import XCTest

/// Runs the app against a real API (launch argument -API_BASE_URL). The simulator has no microphone
/// input, so -UITestSpeech supplies the recognised sentence; everything after recognition is real.
final class VoiceCaptureUITests: XCTestCase {
    /// Forms render rows lazily: swipe until the element exists and is hittable (at most a few screens).
    @MainActor
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<6 where !(element.exists && element.isHittable) { app.swipeUp() }
    }

    private let sentence = "beli nasi padang di warung sederhana 35 ribu pakai gopay"

    @MainActor
    func testSpeakingFillsTheFormAndSimpanSaves() throws {
        let app = XCUIApplication()
        let api = ProcessInfo.processInfo.environment["UITEST_API_BASE_URL"] ?? "http://127.0.0.1:8098"
        app.launchArguments = ["-API_BASE_URL", api, "-UITestResetSession", "-UITestSpeech", sentence]
        app.launch()

        app.buttons["Belum punya akun? Daftar"].tap()
        app.textFields["Nama"].tap()
        app.textFields["Nama"].typeText("iPhone")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("ios-ui-\(Int(Date().timeIntervalSince1970))@example.test")
        app.secureTextFields["Kata sandi"].tap()
        app.secureTextFields["Kata sandi"].typeText("correct horse battery staple")
        app.buttons["Buat akun dan masuk"].tap()

        guard app.buttons["Catat"].firstMatch.waitForExistence(timeout: 15) else {
            let shown = app.staticTexts["login-error"].exists ? app.staticTexts["login-error"].label : "no error shown"
            let tree = app.debugDescription.components(separatedBy: "\n")
                .filter { $0.contains("Button") || $0.contains("StaticText") || $0.contains("TabBar") || $0.contains("NavigationBar") }
                .prefix(40).joined(separator: "\n")
            XCTFail("home did not appear after sign-up; login screen says: \(shown)\n\(tree)")
            return
        }
        app.buttons["Catat"].firstMatch.tap()
        app.buttons["Bicara"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["recording-indicator"].firstMatch.waitForExistence(timeout: 3), "a visible recording sign")

        let status = app.staticTexts["capture-status"]
        XCTAssertTrue(status.waitForExistence(timeout: 10))
        let filled = NSPredicate(format: "label CONTAINS 'Formulir terisi otomatis'")
        expectation(for: filled, evaluatedWith: status)
        waitForExpectations(timeout: 15)
        XCTAssertEqual(app.textFields["amount"].value as? String, "35.000")
        reveal(app.textFields["counterparty"], in: app)
        XCTAssertEqual(app.textFields["description"].value as? String, "Beli nasi padang di warung sederhana")
        XCTAssertEqual(app.textFields["counterparty"].value as? String, "Warung Sederhana")

        app.buttons["Jurnal"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Belum ada transaksi pada bulan ini."].waitForExistence(timeout: 10), "nothing is saved before Simpan")

        app.buttons["Catat"].firstMatch.tap()
        reveal(app.buttons["Simpan"].firstMatch, in: app)
        app.buttons["Simpan"].firstMatch.tap()
        let saved = NSPredicate(format: "label CONTAINS 'Tersimpan: Beli nasi padang'")
        expectation(for: saved, evaluatedWith: app.staticTexts["capture-status"])
        waitForExpectations(timeout: 15)

        app.buttons["Jurnal"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Beli nasi padang di warung sederhana"].waitForExistence(timeout: 10))

        // The API is down (a closed port): the app opens from its SQLite copy and a new save waits on the device.
        app.terminate()
        app.launchArguments = ["-API_BASE_URL", "http://127.0.0.1:9"]
        app.launch()
        XCTAssertTrue(app.otherElements["device-banner"].firstMatch.waitForExistence(timeout: 15)
            || app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'tersimpan di perangkat ini'")).firstMatch.waitForExistence(timeout: 5))
        app.buttons["Jurnal"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Beli nasi padang di warung sederhana"].waitForExistence(timeout: 10), "journal from the device copy")
        app.buttons["Catat"].firstMatch.tap()
        let amount = app.textFields["amount"]
        XCTAssertTrue(amount.waitForExistence(timeout: 10))
        amount.tap()
        amount.typeText("12.000")
        reveal(app.textFields["description"], in: app)
        app.textFields["description"].tap()
        app.textFields["description"].typeText("Parkir saat offline")
        reveal(app.buttons["Simpan"].firstMatch, in: app)
        app.buttons["Simpan"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["1 transaksi tersimpan di perangkat, menunggu dikirim"].firstMatch.waitForExistence(timeout: 15))
        // The status row sits above the form, which has scrolled down to Simpan.
        for _ in 0..<4 where !app.staticTexts["capture-status"].exists { app.swipeDown() }
        XCTAssertTrue((app.staticTexts["capture-status"].label).contains("disimpan di perangkat ini"))

        // The API is back: the queued transaction is sent on start and appears once in the journal.
        app.terminate()
        app.launchArguments = ["-API_BASE_URL", api]
        app.launch()
        app.buttons["Jurnal"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Parkir saat offline"].waitForExistence(timeout: 20))
        XCTAssertEqual(app.staticTexts.matching(identifier: "Parkir saat offline").count, 1)
        XCTAssertFalse(app.staticTexts["1 transaksi tersimpan di perangkat, menunggu dikirim"].exists)
    }
}
