import Foundation
import SQLite3

// Data kept on the device so the app keeps working when the API or the hosting is down: the last good
// answer to every GET, and transactions saved while offline, waiting to be sent. The app uses SQLite in
// its private container; tests and checks can use MemoryStore.

/// Which filled fields the person changed before Simpan; feeds the real-use quality report.
public struct CaptureReview: Codable, Sendable, Equatable {
    public let draftId: String
    public let changed: [String]
    public init(draftId: String, changed: [String]) {
        self.draftId = draftId
        self.changed = changed
    }
}

public struct QueuedTransaction: Codable, Sendable, Equatable {
    /// The transaction's idempotency key, so sending it twice posts it once.
    public let key: String
    public let entityId: String
    public let body: [String: String]
    public let review: CaptureReview?
    public let createdAt: Date
    /// "pending" until sent, or "failed" when the server refused it (for example a closed period).
    public var status: String
    public var error: String?
}

public struct CachedResponse: Sendable {
    public let body: Data
    public let savedAt: Date
}

public protocol LocalStore: Sendable {
    func read(_ path: String) -> CachedResponse?
    func write(_ path: String, _ body: Data)
    func queued() -> [QueuedTransaction]
    func put(_ item: QueuedTransaction)
    func remove(_ key: String)
    /// Everything, at sign-out: the data belongs to the person who was signed in.
    func clear()
}

public final class MemoryStore: LocalStore, @unchecked Sendable {
    private let lock = NSLock()
    private var cache: [String: CachedResponse] = [:]
    private var queue: [String: QueuedTransaction] = [:]
    public init() {}
    public func read(_ path: String) -> CachedResponse? { lock.withLock { cache[path] } }
    public func write(_ path: String, _ body: Data) { lock.withLock { cache[path] = CachedResponse(body: body, savedAt: Date()) } }
    public func queued() -> [QueuedTransaction] { lock.withLock { queue.values.sorted { $0.createdAt < $1.createdAt } } }
    public func put(_ item: QueuedTransaction) { lock.withLock { queue[item.key] = item } }
    public func remove(_ key: String) { _ = lock.withLock { queue.removeValue(forKey: key) } }
    public func clear() { lock.withLock { cache = [:]; queue = [:] } }
}

private let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

/// SQLite through the system library. One connection, serialised by a lock.
public final class SQLiteStore: LocalStore, @unchecked Sendable {
    private let lock = NSLock()
    private var db: OpaquePointer?
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(url: URL) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        guard sqlite3_open_v2(url.path, &db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK else {
            throw APIError(status: 0, title: "Storage", detail: "Penyimpanan perangkat tidak dapat dibuka.")
        }
        exec("create table if not exists cache (path text primary key, body blob not null, saved_at real not null)")
        exec("create table if not exists outbox (key text primary key, created_at real not null, item blob not null)")
        #if os(iOS)
        // Readable after the first unlock, so queued transactions can still be sent from the background.
        try? FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: url.path)
        #endif
    }

    deinit { sqlite3_close(db) }

    private func exec(_ sql: String) { sqlite3_exec(db, sql, nil, nil, nil) }

    private func statement(_ sql: String, _ bind: (OpaquePointer?) -> Void, _ each: (OpaquePointer?) -> Void = { _ in }) {
        lock.withLock {
            var stmt: OpaquePointer?
            guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return }
            defer { sqlite3_finalize(stmt) }
            bind(stmt)
            while sqlite3_step(stmt) == SQLITE_ROW { each(stmt) }
        }
    }

    private static func data(_ stmt: OpaquePointer?, _ column: Int32) -> Data {
        guard let bytes = sqlite3_column_blob(stmt, column) else { return Data() }
        return Data(bytes: bytes, count: Int(sqlite3_column_bytes(stmt, column)))
    }

    private static func bind(_ stmt: OpaquePointer?, _ index: Int32, _ data: Data) {
        _ = data.withUnsafeBytes { sqlite3_bind_blob(stmt, index, $0.baseAddress, Int32(data.count), transient) }
    }

    public func read(_ path: String) -> CachedResponse? {
        var found: CachedResponse?
        statement("select body, saved_at from cache where path = ?", { sqlite3_bind_text($0, 1, path, -1, transient) }) {
            found = CachedResponse(body: Self.data($0, 0), savedAt: Date(timeIntervalSince1970: sqlite3_column_double($0, 1)))
        }
        return found
    }

    public func write(_ path: String, _ body: Data) {
        statement("insert or replace into cache (path, body, saved_at) values (?, ?, ?)", {
            sqlite3_bind_text($0, 1, path, -1, transient)
            Self.bind($0, 2, body)
            sqlite3_bind_double($0, 3, Date().timeIntervalSince1970)
        })
    }

    public func queued() -> [QueuedTransaction] {
        var items: [QueuedTransaction] = []
        statement("select item from outbox order by created_at", { _ in }) {
            if let item = try? decoder.decode(QueuedTransaction.self, from: Self.data($0, 0)) { items.append(item) }
        }
        return items
    }

    public func put(_ item: QueuedTransaction) {
        guard let data = try? encoder.encode(item) else { return }
        statement("insert or replace into outbox (key, created_at, item) values (?, ?, ?)", {
            sqlite3_bind_text($0, 1, item.key, -1, transient)
            sqlite3_bind_double($0, 2, item.createdAt.timeIntervalSince1970)
            Self.bind($0, 3, data)
        })
    }

    public func remove(_ key: String) {
        statement("delete from outbox where key = ?", { sqlite3_bind_text($0, 1, key, -1, transient) })
    }

    public func clear() {
        lock.withLock {
            exec("delete from cache")
            exec("delete from outbox")
        }
    }
}
