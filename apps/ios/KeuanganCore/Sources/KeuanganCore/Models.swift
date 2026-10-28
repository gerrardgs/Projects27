import Foundation

// Models for the parts of packages/contract/openapi.json that the iOS app uses. Amounts stay `String`.

public struct Entity: Codable, Sendable { public let id: String; public let name: String; public let currency: String }
public struct Me: Codable, Sendable { public let displayName: String; public let entities: [Entity] }
public struct Account: Codable, Sendable { public let id: String; public let code: String; public let name: String; public let type: String }
public struct Entry: Codable, Sendable { public let id: String; public let date: String; public let description: String; public let status: String; public let total: String }
public struct Check: Codable, Sendable { public let name: String; public let passed: Bool; public let detail: String }
public struct RecapRow: Codable, Sendable { public let code: String; public let name: String; public let month: String; public let shareOfTotal: String }

public struct MonthlyRecap: Codable, Sendable {
    public let income: [RecapRow]
    public let expenses: [RecapRow]
    public let totalIncome: String
    public let totalExpenses: String
    public let net: String
    public let savingsRate: String
    public let checks: [Check]
    public var checksPassed: Bool { checks.allSatisfy(\.passed) }
}

public struct TrendPoint: Codable, Sendable { public let year: Int; public let month: Int; public let income: String; public let expenses: String; public let net: String }

struct NativeSession: Codable { let token: String }
struct Problem: Codable { let title: String?; let detail: String? }
struct AccountsResponse: Codable { let accounts: [Account] }
struct EntriesResponse: Codable { let entries: [Entry] }
struct TrendResponse: Codable { let series: [TrendPoint] }

/// A filled-in, unsaved transaction form from POST /capture/parse. The person reviews it and presses Simpan.
public struct CaptureDraft: Codable, Sendable {
    /// Sent back with the review after Simpan.
    public let draftId: String
    public let kind: String
    public let amount: String?
    public let date: String
    public let accountId: String?
    public let fundingAccountId: String?
    public let description: String?
    public let counterparty: String?
    public let source: String
    public let missing: [String]
    public let note: String?
}

public struct QualityRate: Codable, Sendable {
    public let count: Int
    public let of: Int
    public let rate: Double?
    /// 95% Wilson score interval.
    public let ci95: [Double]
}

/// Real-use quality of capture: saved forms the person did not correct.
public struct CaptureQuality: Codable, Sendable {
    public let days: Int
    public let drafts: Int
    public let saved: Int
    public let savedWithoutChanges: QualityRate
}
