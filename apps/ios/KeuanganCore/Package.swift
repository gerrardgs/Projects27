// swift-tools-version: 6.0
// KeuanganCore: the iOS app's money formatting, API models and client, and Keychain token store.
// The SwiftUI app target is added once Xcode can build for iOS; this package builds with the
// Command Line Tools too, and `keuangan-check` verifies it against the shared fixture and a live API.
import PackageDescription

let package = Package(
    name: "KeuanganCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "KeuanganCore", targets: ["KeuanganCore"])],
    targets: [
        .target(name: "KeuanganCore"),
        .executableTarget(name: "keuangan-check", dependencies: ["KeuanganCore"]),
    ]
)
