import Foundation

/// Exact rupiah. The API sends decimal strings such as "725350.50"; they are formatted as text and never
/// converted to `Double`, so no sen is rounded away.
public enum Money {
    /// "725350.50" -> "Rp 725.350,50"; "35000.00" -> "Rp 35.000" (sen only when there are any).
    public static func format(_ amount: String) throws -> String {
        guard let match = amount.wholeMatch(of: /(-?)(0|[1-9]\d*)\.(\d{2})/) else { throw MoneyError.notAnAmount(amount) }
        let digits = String(match.2)
        var grouped = ""
        for (index, digit) in digits.enumerated() {
            if index > 0 && (digits.count - index) % 3 == 0 { grouped.append(".") }
            grouped.append(digit)
        }
        let sen = String(match.3)
        return "\(match.1)Rp \(grouped)\(sen == "00" ? "" : ",\(sen)")"
    }

    /// Reads an amount typed the Indonesian way ("35.000", "1.250.000,50", "Rp 35000") and returns the API
    /// decimal string, or nil when it is not a valid positive amount.
    public static func parseInput(_ input: String) -> String? {
        var text = input.trimmingCharacters(in: .whitespaces)
        if let prefix = text.prefixMatch(of: /(?i)rp\.?\s*/) { text.removeSubrange(prefix.range) }
        text = text.filter { !$0.isWhitespace }
        guard let match = text.wholeMatch(of: /(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/) else { return nil }
        var whole = String(match.1).replacingOccurrences(of: ".", with: "")
        while whole.count > 1 && whole.hasPrefix("0") { whole.removeFirst() }
        let sen = String((match.2 ?? "") + "00").prefix(2)
        if whole.count > 15 || (whole == "0" && sen == "00") { return nil }
        return "\(whole).\(sen)"
    }

    /// "1250000.50" -> "1.250.000,50", "35000.00" -> "35.000": an API amount written the way the amount field expects it.
    public static func toInput(_ amount: String) -> String {
        let parts = amount.split(separator: ".", maxSplits: 1).map(String.init)
        let whole = parts.first ?? "0"
        var grouped = ""
        for (index, digit) in whole.enumerated() {
            if index > 0 && (whole.count - index) % 3 == 0 { grouped.append(".") }
            grouped.append(digit)
        }
        let sen = parts.count > 1 ? parts[1] : "00"
        return sen == "00" ? grouped : "\(grouped),\(sen)"
    }

    /// Only for drawing charts; never use the result in arithmetic on money.
    public static func forChart(_ amount: String) -> Double { Double(amount) ?? 0 }
}

public enum MoneyError: Error, Equatable {
    case notAnAmount(String)
}
