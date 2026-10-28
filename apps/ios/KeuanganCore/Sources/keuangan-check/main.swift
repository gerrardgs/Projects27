// Verifies KeuanganCore without XCTest (which needs a full Xcode): money formatting against the shared
// fixture, and, when an API URL is given, a full round trip through APIClient and the Keychain.
// Usage: swift run keuangan-check <path to personal-sample.json> [http://127.0.0.1:8097]

import Foundation
import KeuanganCore

var failures: [String] = []
@MainActor
func expect(_ condition: @autoclosure () -> Bool, _ message: String) {
    if !condition() { failures.append(message) }
}

let arguments = CommandLine.arguments
guard arguments.count >= 2, let fixtureData = FileManager.default.contents(atPath: arguments[1]),
      let fixture = try JSONSerialization.jsonObject(with: fixtureData) as? [String: Any],
      let expected = (fixture["expected"] as? [String: Any])?["monthlyRecap"] as? [String: Any]
else {
    FileHandle.standardError.write(Data("usage: keuangan-check <personal-sample.json> [api-url]\n".utf8))
    exit(2)
}

// Money: exact formatting and Indonesian input.
expect((try? Money.format("725350.50")) == "Rp 725.350,50", "format sen")
expect((try? Money.format("35000.00")) == "Rp 35.000", "format whole rupiah")
expect((try? Money.format("-186000.00")) == "-Rp 186.000", "format negative")
expect((try? Money.format("999999999999999.99")) == "Rp 999.999.999.999.999,99", "format 17 digits exactly")
expect((try? Money.format("35000")) == nil, "reject non-API amount")
expect(Money.parseInput("Rp 1.250.000,50") == "1250000.50", "parse Indonesian input")
expect(Money.parseInput("35.000") == "35000.00", "parse thousands")
for bad in ["", "abc", "-5", "1,234", "12.34", "0"] { expect(Money.parseInput(bad) == nil, "reject input \(bad)") }
expect((try? Money.format(expected["totalExpenses"] as? String ?? "")) == "Rp 6.206.350,50", "fixture total expenses")
for amount in ["35000.00", "1250000.50", "0.50", "999999999999999.99"] {
    expect(Money.parseInput(Money.toInput(amount)) == amount, "input round trip \(amount)")
}

@MainActor
func liveRoundTrip(_ api: APIClient, fixture: [String: Any], expected: [String: Any]) async throws {
    let email = "ios-\(UUID().uuidString.lowercased())@example.test"
    try await api.register(email: email, password: "correct horse battery staple", displayName: "iOS")
    let token = try await api.login(email: email, password: "correct horse battery staple")
    let store = TokenStore(service: "id.projects27.keuangan.check")
    try store.save(token)
    expect(store.load() == token, "keychain round trip")
    store.delete()
    expect(store.load() == nil, "keychain delete")
    guard let entityId = try await api.me().entities.first?.id else { throw APIError(status: 0, title: "Error", detail: "no entity") }
    let ids = Dictionary(uniqueKeysWithValues: try await api.accounts(entityId: entityId).map { ($0.code, $0.id) })
    for (index, raw) in (fixture["entries"] as? [[String: Any]] ?? []).enumerated() {
        let key = "ios-fixture-\(index)"
        if raw["type"] as? String == "journal" {
            let lines = (raw["lines"] as? [[String: String]] ?? []).map { line -> [String: String] in
                var out = ["accountId": ids[line["account"] ?? ""] ?? ""]
                if let debit = line["debit"] { out["debit"] = debit }
                if let credit = line["credit"] { out["credit"] = credit }
                return out
            }
            _ = try await api.createJournalEntry(entityId: entityId, ["date": raw["date"] ?? "", "description": raw["description"] ?? "", "idempotencyKey": key, "lines": lines])
        } else {
            _ = try await api.recordTransaction(entityId: entityId, [
                "kind": raw["kind"] as? String ?? "", "date": raw["date"] as? String ?? "", "description": raw["description"] as? String ?? "",
                "amount": raw["amount"] as? String ?? "", "accountId": ids[raw["account"] as? String ?? ""] ?? "",
                "fundingAccountId": ids[raw["funding"] as? String ?? ""] ?? "", "idempotencyKey": key,
            ])
        }
    }
    let recap = try await api.monthlyRecap(entityId: entityId, year: 2026, month: 10)
    for (field, value) in [("totalIncome", recap.totalIncome), ("totalExpenses", recap.totalExpenses), ("net", recap.net), ("savingsRate", recap.savingsRate)] {
        expect(expected[field] as? String == value, "recap \(field): got \(value), want \(expected[field] ?? "")")
    }
    expect(recap.checksPassed, "report self-checks")
    let draft = try await api.parseCapture(entityId: entityId, text: "beli nasi padang 35 ribu pakai gopay")
    expect(draft.amount == "35000.00" && draft.accountId == ids["5100"] && draft.fundingAccountId == ids["1300"], "capture draft")
    let trend = try await api.trend(entityId: entityId, year: 2026, month: 10, months: 2)
    expect(trend.map(\.net) == ["7650000.00", expected["net"] as? String ?? ""], "trend nets")
    try await api.reviewCapture(entityId: entityId, CaptureReview(draftId: draft.draftId, changed: []))
    let quality = try await api.captureQuality(entityId: entityId)
    expect(quality.saved == 1 && quality.savedWithoutChanges.count == 1, "capture quality after review")
    try await offlineRoundTrip(api, entityId: entityId, ids: ids)
    try await api.logout()
    print("live: \(fixture["entries"].map { ($0 as? [Any])?.count ?? 0 } ?? 0) entries posted through APIClient; recap matches the fixture")
}

/// The same SQLite file seen by a client whose server is down (a closed port) and by one whose server is up.
@MainActor
func offlineRoundTrip(_ online: APIClient, entityId: String, ids: [String: String]) async throws {
    let file = FileManager.default.temporaryDirectory.appendingPathComponent("keuangan-check-\(UUID().uuidString).sqlite")
    defer { try? FileManager.default.removeItem(at: file) }
    let store = try SQLiteStore(url: file)
    let up = APIClient(baseURL: online.baseURL, token: online.token, store: store)
    let down = APIClient(baseURL: URL(string: "http://127.0.0.1:9")!, token: online.token, store: store)
    let accounts = try await up.accounts(entityId: entityId)
    expect(up.offlineSince == nil, "online: not offline")
    let cached = try await down.accounts(entityId: entityId)
    expect(cached.count == accounts.count && down.offlineSince != nil, "offline: accounts from SQLite")
    let body = [
        "kind": "expense", "date": "2026-10-28", "amount": "12000.00", "description": "Parkir saat offline",
        "accountId": ids["5200"] ?? "", "fundingAccountId": ids["1100"] ?? "", "counterparty": "", "idempotencyKey": "ios-offline-1",
    ]
    if case .queued = try await down.saveTransaction(entityId: entityId, body, review: nil) {} else { expect(false, "offline save is queued") }
    expect(store.queued().map(\.key) == ["ios-offline-1"], "outbox holds the transaction")
    let whileDown = await down.syncOutbox()
    expect(whileDown == 0 && store.queued().count == 1, "still offline: nothing sent")
    let whenUp = await up.syncOutbox()
    expect(whenUp == 1 && store.queued().isEmpty, "back online: sent")
    let again = await up.syncOutbox()
    expect(again == 0, "nothing left to send")
    let entries = try await up.entries(entityId: entityId, from: "2026-10-28", to: "2026-10-28")
    expect(entries.filter { $0.description == "Parkir saat offline" }.count == 1, "posted exactly once")
}

if arguments.count >= 3, let url = URL(string: arguments[2]) {
    do {
        try await liveRoundTrip(APIClient(baseURL: url), fixture: fixture, expected: expected)
    } catch {
        failures.append("live round trip: \(error)")
    }
}

if failures.isEmpty {
    print("ok: all KeuanganCore checks passed")
} else {
    FileHandle.standardError.write(Data((failures.joined(separator: "\n") + "\n").utf8))
    exit(1)
}
