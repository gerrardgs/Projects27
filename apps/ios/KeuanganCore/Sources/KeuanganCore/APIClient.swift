import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct APIError: Error, CustomStringConvertible, Sendable {
    public let status: Int
    public let title: String
    public let detail: String
    public var description: String { detail }

    public init(status: Int, title: String, detail: String) {
        self.status = status
        self.title = title
        self.detail = detail
    }
}

public let unreachableMessage = "Server API tidak dapat dihubungi. Periksa koneksi atau pastikan API berjalan."

extension APIError {
    /// The server could not be reached (no network, refused, timed out, or a gateway error).
    public var isUnreachable: Bool { status == 0 || (502...504).contains(status) }
    /// A refusal the server will repeat on retry, unlike an outage or an expired session.
    var isRefusal: Bool { (400..<500).contains(status) && ![401, 408, 429].contains(status) }
}

public enum SaveResult: Sendable {
    case saved(Entry)
    /// Kept on the device; sent when the server is back.
    case queued
}

/// Client for the core API as a native app: signs in with client "native" and sends the token as a bearer header.
/// With a LocalStore, GET answers are kept on the device and shown when the server cannot be reached, and
/// transactions saved then wait in the outbox until it is back.
public final class APIClient: @unchecked Sendable {
    public let baseURL: URL
    public var token: String?
    private let session: URLSession
    public let store: LocalStore?
    private let lock = NSLock()
    private var _offlineSince: Date?
    /// Called after `offlineSince` or the outbox changes.
    public var onChange: (@Sendable () -> Void)?

    public init(baseURL: URL, token: String? = nil, session: URLSession = .shared, store: LocalStore? = nil) {
        self.baseURL = baseURL
        self.token = token
        self.session = session
        self.store = store
    }

    /// When the data shown was saved, while the server cannot be reached; nil when online.
    public var offlineSince: Date? { lock.withLock { _offlineSince } }
    public var queue: [QueuedTransaction] { store?.queued() ?? [] }

    private func setOffline(_ since: Date?) {
        let changed = lock.withLock {
            defer { _offlineSince = since }
            return _offlineSince != since
        }
        if changed { onChange?() }
    }

    private static let unreachableCodes: Set<URLError.Code> = [
        .notConnectedToInternet, .cannotConnectToHost, .cannotFindHost, .timedOut, .networkConnectionLost,
        .dnsLookupFailed, .internationalRoamingOff, .dataNotAllowed, .secureConnectionFailed,
    ]

    /// Sends one request; GET answers are saved, and served from the device when the server cannot be reached.
    private func send(_ method: String, _ path: String, body: [String: Any]? = nil) async throws -> Data {
        do {
            let data = try await exchange(method, path, body: body)
            if method == "GET" {
                store?.write(path, data)
                setOffline(nil)
            }
            return data
        } catch let error as APIError where method == "GET" && error.isUnreachable {
            guard let saved = store?.read(path) else { throw error }
            setOffline(saved.savedAt)
            return saved.body
        }
    }

    /// One HTTP exchange; API errors (RFC 9457 problem details) become APIError, outages status 0.
    private func exchange(_ method: String, _ path: String, body: [String: Any]?) async throws -> Data {
        guard let url = URL(string: path, relativeTo: baseURL) else { throw APIError(status: 0, title: "Error", detail: "bad path \(path)") }
        var request = URLRequest(url: url, timeoutInterval: 30)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "accept")
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "authorization") }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "content-type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch let error as URLError where Self.unreachableCodes.contains(error.code) {
            throw APIError(status: 0, title: "Unreachable", detail: unreachableMessage)
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if (502...504).contains(status) { throw APIError(status: status, title: "Unreachable", detail: unreachableMessage) }
        if status >= 400 {
            let problem = try? JSONDecoder().decode(Problem.self, from: data)
            throw APIError(status: status, title: problem?.title ?? "Error", detail: problem?.detail ?? "HTTP \(status)")
        }
        return data
    }

    private func call<T: Decodable>(_ method: String, _ path: String, body: [String: Any]? = nil, as type: T.Type) async throws -> T {
        try JSONDecoder().decode(T.self, from: try await send(method, path, body: body))
    }

    private func entity(_ id: String) -> String { "/v1/entities/\(id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? id)" }

    public func register(email: String, password: String, displayName: String) async throws {
        _ = try await send("POST", "/v1/auth/register", body: ["email": email, "password": password, "displayName": displayName])
    }

    @discardableResult
    public func login(email: String, password: String, totp: String? = nil) async throws -> String {
        var body: [String: Any] = ["email": email, "password": password, "client": "native"]
        if let totp { body["totp"] = totp }
        let session = try await call("POST", "/v1/auth/login", body: body, as: NativeSession.self)
        token = session.token
        return session.token
    }

    public func logout() async throws {
        defer {
            token = nil
            store?.clear()
            setOffline(nil)
            onChange?()
        }
        do {
            _ = try await send("POST", "/v1/auth/logout")
        } catch let error as APIError where error.isUnreachable {}
    }

    public func me() async throws -> Me { try await call("GET", "/v1/me", as: Me.self) }

    public func accounts(entityId: String) async throws -> [Account] {
        try await call("GET", "\(entity(entityId))/accounts", as: AccountsResponse.self).accounts
    }

    public func recordTransaction(entityId: String, _ body: [String: String]) async throws -> Entry {
        try await call("POST", "\(entity(entityId))/transactions", body: body, as: Entry.self)
    }

    public func createJournalEntry(entityId: String, _ body: [String: Any]) async throws -> Entry {
        try await call("POST", "\(entity(entityId))/journal-entries", body: body, as: Entry.self)
    }

    public func parseCapture(entityId: String, text: String) async throws -> CaptureDraft {
        try await call("POST", "\(entity(entityId))/capture/parse", body: ["text": text], as: CaptureDraft.self)
    }

    public func reviewCapture(entityId: String, _ review: CaptureReview) async throws {
        _ = try await send("POST", "\(entity(entityId))/capture/\(review.draftId)/review", body: ["outcome": "saved", "changed": review.changed])
    }

    public func captureQuality(entityId: String, days: Int = 90) async throws -> CaptureQuality {
        try await call("GET", "\(entity(entityId))/capture/quality?days=\(days)", as: CaptureQuality.self)
    }

    /// Saves a transaction, or keeps it on the device when the server cannot be reached. `body` carries the
    /// idempotency key; the review, if any, is sent after the transaction is saved.
    public func saveTransaction(entityId: String, _ body: [String: String], review: CaptureReview?) async throws -> SaveResult {
        do {
            let entry = try await recordTransaction(entityId: entityId, body)
            if let review { try? await reviewCapture(entityId: entityId, review) }
            return .saved(entry)
        } catch let error as APIError where error.isUnreachable && store != nil {
            store?.put(QueuedTransaction(
                key: body["idempotencyKey"] ?? UUID().uuidString, entityId: entityId, body: body, review: review,
                createdAt: Date(), status: "pending", error: nil))
            onChange?()
            return .queued
        }
    }

    /// Sends queued transactions oldest first, stopping at the first outage. Returns how many were tried.
    @discardableResult
    public func syncOutbox() async -> Int {
        guard let store else { return 0 }
        defer { onChange?() }
        var tried = 0
        for var item in store.queued() where item.status == "pending" {
            do {
                _ = try await recordTransaction(entityId: item.entityId, item.body)
                if let review = item.review { try? await reviewCapture(entityId: item.entityId, review) }
                store.remove(item.key)
            } catch let error as APIError where error.isRefusal {
                item.status = "failed"
                item.error = error.detail
                store.put(item)
            } catch {
                break
            }
            tried += 1
        }
        return tried
    }

    public func discardQueued(_ key: String) {
        store?.remove(key)
        onChange?()
    }

    public func entries(entityId: String, from: String, to: String) async throws -> [Entry] {
        try await call("GET", "\(entity(entityId))/journal-entries?from=\(from)&to=\(to)&limit=500", as: EntriesResponse.self).entries
    }

    public func monthlyRecap(entityId: String, year: Int, month: Int) async throws -> MonthlyRecap {
        try await call("GET", "\(entity(entityId))/reports/monthly-recap?year=\(year)&month=\(month)", as: MonthlyRecap.self)
    }

    public func trend(entityId: String, year: Int, month: Int, months: Int = 6) async throws -> [TrendPoint] {
        try await call("GET", "\(entity(entityId))/reports/monthly-trend?year=\(year)&month=\(month)&months=\(months)", as: TrendResponse.self).series
    }
}
