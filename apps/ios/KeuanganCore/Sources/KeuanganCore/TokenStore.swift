import Foundation
import Security

/// The bearer token in the Keychain, readable only while the device is unlocked and never synced
/// or restored to another device (kSecAttrAccessibleWhenUnlockedThisDeviceOnly).
public struct TokenStore: Sendable {
    let service: String
    let account = "p27_token"

    public init(service: String = "id.projects27.keuangan") { self.service = service }

    private var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }

    public func save(_ token: String) throws {
        SecItemDelete(query as CFDictionary)
        var item = query
        item[kSecValueData as String] = Data(token.utf8)
        item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        let status = SecItemAdd(item as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError(status: status) }
    }

    public func load() -> String? {
        var request = query
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        guard SecItemCopyMatching(request as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    public func delete() { SecItemDelete(query as CFDictionary) }
}

public struct KeychainError: Error { public let status: OSStatus }
