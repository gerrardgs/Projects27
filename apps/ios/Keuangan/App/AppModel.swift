import Foundation
import KeuanganCore
import Observation
import os

/// Session and shared data for the app. The bearer token lives only in the Keychain (TokenStore).
@MainActor
@Observable
final class AppModel {
    let api: APIClient
    private let store = TokenStore()
    var me: Me?
    var accounts: [Account] = []
    /// When the data on screen was saved, while the server cannot be reached; nil when online.
    var offlineSince: Date?
    /// Transactions saved on this device, waiting to be sent or refused by the server.
    var queue: [QueuedTransaction] = []
    // Reads only observed state: `me` is set after a successful sign-in and cleared on sign-out. (A check of
    // `api.token` first would short-circuit on the first render, so SwiftUI would never start observing `me`.)
    var signedIn: Bool { me != nil }

    init() {
        // A launch argument "-API_BASE_URL <url>" (read through UserDefaults) overrides the Info.plist value.
        let configured = UserDefaults.standard.string(forKey: "API_BASE_URL") ?? (Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String)
        // The device copy: SQLite in Application Support, inside the app's private container.
        let file = URL.applicationSupportDirectory.appending(path: "keuangan.sqlite")
        api = APIClient(baseURL: URL(string: configured ?? "http://127.0.0.1:8080")!, token: store.load(), store: try? SQLiteStore(url: file))
        api.onChange = { [weak self] in Task { @MainActor in self?.refreshDeviceState() } }
        // UI tests start signed out, whatever an earlier run left in the Keychain.
        if ProcessInfo.processInfo.arguments.contains("-UITestResetSession") {
            signOutLocally()
            api.store?.clear()
        }
        refreshDeviceState()
    }

    func refreshDeviceState() {
        offlineSince = api.offlineSince
        queue = api.queue
    }

    /// Sends queued transactions; returns true when any were sent, so screens can reload.
    @discardableResult
    func sync() async -> Bool {
        guard queue.contains(where: { $0.status == "pending" }) else { return false }
        return await api.syncOutbox() > 0
    }

    var entityId: String? { me?.entities.first?.id }

    func restore() async {
        guard api.token != nil else { return }
        do { try await load() } catch { signOutLocally() }
    }

    func signIn(email: String, password: String, totp: String?) async throws {
        let token = try await api.login(email: email, password: password, totp: totp)
        do {
            try store.save(token)
            try await load()
        } catch {
            log.error("sign-in after login failed: \(String(describing: error), privacy: .public)")
            throw error
        }
    }

    func register(email: String, password: String, displayName: String) async throws {
        try await api.register(email: email, password: password, displayName: displayName)
        try await signIn(email: email, password: password, totp: nil)
    }

    func signOut() async {
        try? await api.logout()
        signOutLocally()
        refreshDeviceState()
    }

    private func signOutLocally() {
        store.delete()
        api.token = nil
        me = nil
        accounts = []
    }

    private let log = Logger(subsystem: "id.projects27.keuangan", category: "session")

    private func load() async throws {
        let me = try await api.me()
        guard let entityId = me.entities.first?.id else {
            log.error("signed in, but the account has no entity")
            throw APIError(status: 0, title: "No entity", detail: "Akun ini belum punya entitas keuangan.")
        }
        accounts = try await api.accounts(entityId: entityId)
        self.me = me
    }
}

enum Jakarta {
    static let timeZone = TimeZone(identifier: "Asia/Jakarta")!
    static func isoDate(_ date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = timeZone
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    static func date(_ iso: String) -> Date {
        let formatter = DateFormatter()
        formatter.timeZone = timeZone
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: iso) ?? Date()
    }
}
