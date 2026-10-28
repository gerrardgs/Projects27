# Projects 27 iOS app

`KeuanganCore/` is the Swift package the iOS app is built on: exact rupiah formatting and input (`Money`), models of the API contract, `APIClient` (signs in as a native client, bearer token), and `TokenStore`, which keeps the token in the Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` (never synced, never restored to another device).

## Check

```sh
cd KeuanganCore
swift build
swift run keuangan-check ../../../packages/contract/fixtures/personal-sample.json            # money and fixture checks
swift run keuangan-check ../../../packages/contract/fixtures/personal-sample.json http://127.0.0.1:8097   # plus a live round trip through a running API and the Keychain
```

`keuangan-check` exists because XCTest and Swift Testing need a full Xcode. On 2026-10-28 it passed with the Command Line Tools (Swift 6.4): every money check, and a live run that posted the 14-entry shared ledger through `APIClient` and matched the October recap and trend.

## The app (`Keuangan/`)

SwiftUI, iOS 17 or later, in Indonesian: sign-in and registration (token in the Keychain), Dasbor (month figures, a 6-month Swift Charts trend with VoiceOver values, spending per category), Catat and Jurnal.

**Catat with voice**: press **Bicara** and speak, for example "beli nasi padang 35 ribu pakai GoPay kemarin". Apple's Speech framework recognises Indonesian (`id-ID`), on the device when the recogniser supports it, and stops after two seconds of silence. The sentence goes to `POST .../capture/parse`, the form fills in (type, amount, date, category, funding account, description, counterparty), VoiceOver announces the result, and nothing is saved until you press **Simpan**. A typed sentence with **Isi otomatis** does the same. A red dot, "Merekam", a timer and the input level show while the microphone records.

**Offline**: `KeuanganCore` keeps every GET answer and the outbox in SQLite (`LocalStore.swift`, system SQLite, file protection until first unlock, in Application Support). When the API is down, a banner says when the data on screen was saved; transactions saved meanwhile are sent on start, every 30 seconds or with "Kirim sekarang", once each. `keuangan-check` and the UI test both exercise it against a real API.

```sh
cd Keuangan
xcodegen generate                       # XcodeGen 2.46.0 writes Keuangan.xcodeproj from project.yml
open Keuangan.xcodeproj                 # choose an iPhone simulator, Run; the API must run on this Mac (port 8080)
```

The API address comes from the `API_BASE_URL` build setting (default `http://127.0.0.1:8080`) or the launch argument `-API_BASE_URL <url>`. Plain HTTP is allowed only to local addresses (`NSAllowsLocalNetworking`); a real iPhone needs the API over HTTPS. Simulator builds are signed to run locally with the app's own Keychain group; installing on a device needs an Apple ID or Developer account in Xcode.

UI test (XCUITest) against a running API, with the recognised sentence supplied by a launch argument because the simulator has no microphone input:

```sh
TEST_RUNNER_UITEST_API_BASE_URL=http://127.0.0.1:8098 xcodebuild test -project Keuangan.xcodeproj -scheme Keuangan -destination 'platform=iOS Simulator,name=iPhone Duo'
```
