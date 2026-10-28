---
name: mobile-engineering
description: Design, build, test, secure and release mobile apps for Android and iOS - native (Kotlin with Jetpack Compose, Swift with SwiftUI) or cross-platform (Flutter, React Native, Expo) - covering platform design guidelines (Apple HIG, Material Design 3), safe areas, dynamic type, touch targets, gestures, dark mode, architecture, offline behaviour, permissions, performance, accessibility with VoiceOver and TalkBack, OWASP MASVS security, and app store release. Use when designing or building a mobile app screen or feature, turning mobile designs into code, fixing mobile crashes or performance problems, handling device permissions or storage, or preparing a store release.
license: MIT
metadata:
  version: "1.0.0"
---

# Mobile Engineering

Adapted from the Projects 23 skill of the same name, with a mobile UI and design layer added. Facts checked on 2026-10-15. Store policies change often: confirm current requirements (minimum target SDK, privacy declarations, review guidelines) in the official [Google Play](https://support.google.com/googleplay/android-developer/answer/11926878) and [Apple App Review](https://developer.apple.com/app-store/review/guidelines/) documentation before every release.

## 1. Fit the existing app

Identify platform and stack, minimum supported OS versions, architecture pattern (for example MVVM or unidirectional data flow), dependency injection, navigation, networking and persistence libraries, design system, and the build system (Gradle, Xcode, Flutter, Metro/Expo). Follow them.

| Stack | Language and UI | Lint and format | Tests |
| :--- | :--- | :--- | :--- |
| Android native | Kotlin, Jetpack Compose | Android Lint, ktlint, detekt | JUnit, Compose UI tests, Espresso |
| iOS native | Swift, SwiftUI | SwiftLint, swift-format | Swift Testing, XCTest, XCUITest |
| Flutter (stable 3.47.7, 2026-10-08) | Dart | `dart format`, `dart analyze` / `flutter analyze` | `flutter test`, integration tests |
| React Native (0.87.1) / Expo (`expo` package 57.0.29) | TypeScript | ESLint, Prettier | Jest, React Native Testing Library (14.1.0), end-to-end with Detox (20.51.4) or Maestro |

Versions are the latest releases on 2026-10-15 (npm registry, Flutter release feed); the project's lockfiles decide what is used. VS Code extension IDs (checked on the Marketplace): `Dart-Code.flutter`, `Dart-Code.dart-code`, `swiftlang.swift-vscode`, `expo.vscode-expo-tools`, `msjsdiag.vscode-react-native`. Android Studio and Xcode remain the primary IDEs for native work.

## 2. Mobile UI design and design-to-code

- Follow the platform: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) on iOS and iPadOS, [Material Design 3](https://m3.material.io/) on Android. Cross-platform apps may share a brand, but navigation patterns, back behaviour, system controls and typography should feel native on each platform.
- **Touch targets**: at least 44 by 44 pt (Apple) and 48 by 48 dp (Material); spacing between targets.
- **Safe areas and insets**: respect notches, the home indicator, status and navigation bars, the on-screen keyboard and foldable hinges ([Compose insets](https://developer.android.com/develop/ui/compose/layouts/insets), [HIG layout](https://developer.apple.com/design/human-interface-guidelines/layout)).
- **Dynamic type and font scaling**: support the user's text size up to the largest accessibility sizes without clipping; use platform text styles ([HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
- **Layouts for every size class**: phones in both orientations, tablets, foldables and split screen ([Material breakpoints](https://m3.material.io/foundations/layout/applying-layout)).
- **Dark mode and dynamic colour**: semantic colour tokens per theme; contrast checked in both.
- **2025 platform design languages**: Apple's Liquid Glass ([overview](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)) comes automatically to standard controls in apps built with the Xcode 26 SDK ([WWDC25: Build a SwiftUI app with the new design](https://developer.apple.com/videos/play/wwdc2025/323/)); custom components must adopt it deliberately and stay legible with Reduce Transparency and Increase Contrast. Google's Material 3 Expressive ([building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)) adds expressive shapes, type and spring motion to Material 3 components.
- **Android edge-to-edge**: apps targeting Android 16 (API level 36) can no longer opt out of edge-to-edge display ([behaviour changes](https://developer.android.com/about/versions/16/behavior-changes-16)); handle insets for every screen. Large-screen orientation and resizability restrictions are being removed as well ([Android 17 preparation](https://android-developers.googleblog.com/2026/02/prepare-your-app-for-resizability-and.html)), so layouts must adapt to any window size.
- **Gestures**: every gesture has a visible alternative; system gestures (edge swipes) are not overridden.
- **Motion**: honour Reduce Motion (iOS) and Remove animations (Android).
- From Figma: tokens map to platform resources (Compose theme, SwiftUI assets and `Color` sets, Flutter `ThemeData`, React Native theme objects); [figma-integration](../figma-integration/SKILL.md) covers Code Connect for SwiftUI and Jetpack Compose, and the DTCG tokens from [design-system-and-tokens](../design-system-and-tokens/SKILL.md) can be generated for each platform with Style Dictionary.

## 3. Architecture and behaviour

- Keep business logic out of UI code, in testable classes or functions.
- Design for unreliable networks: timeouts, retries with backoff for idempotent requests, offline caching where users expect it, and clear error and retry states.
- Handle the app lifecycle: process death, backgrounding, configuration changes and state restoration.
- Never block the main thread with I/O or heavy computation.
- Request permissions only when needed, explain why in context, and handle denial gracefully.

## 4. Security (OWASP MASVS)

Use the [OWASP MASVS](https://mas.owasp.org/MASVS/) control groups as the checklist, and the MASTG for test procedures:

- **MASVS-STORAGE**: secrets and tokens in the Android Keystore or the iOS Keychain, never in plain preferences, logs or backups.
- **MASVS-CRYPTO**: platform cryptography APIs; no hard-coded keys.
- **MASVS-AUTH**: authentication and authorization enforced by the backend; biometrics only to unlock locally stored credentials.
- **MASVS-NETWORK**: TLS only; no disabled certificate validation; certificate pinning only with a rotation plan.
- **MASVS-PLATFORM**: validate deep links and intents; minimal exported components; safe WebView configuration.
- **MASVS-CODE**: up-to-date dependencies; input validation; no debug code in release builds.
- **MASVS-RESILIENCE**: obfuscation and tamper detection where the threat model requires it.
- **MASVS-PRIVACY**: data minimization and accurate store privacy declarations.

API keys shipped in an app are public. Anything secret stays on the server.

## 5. Performance, accessibility and quality

- Measure startup time, frame rendering (jank), memory and battery with the platform profilers (Android Studio profilers, Xcode Instruments, Flutter DevTools, React Native DevTools).
- Lists use lazy or recycled rendering; images are sized and cached.
- Accessibility: labels for every control (`contentDescription`, `accessibilityLabel`, `Semantics`, React Native `accessibilityLabel` and `accessibilityRole`), logical focus order, dynamic type, contrast, target sizes, and tests with TalkBack and VoiceOver. Guides: [Android](https://developer.android.com/guide/topics/ui/accessibility), [Flutter](https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility), [React Native](https://reactnative.dev/docs/accessibility).
- Crash and error reporting in release builds, without collecting personal data beyond policy.

## 6. Release

- Version code and version name (Android) or build and marketing version (iOS) incremented on every release.
- Signing keys and store credentials kept in the CI secret store; never in the repository.
- Store artwork (icons, screenshots) produced to the stores' current specifications ([graphic-design-production](../graphic-design-production/SKILL.md) references); target SDK level meets [Google Play's requirement](https://developer.android.com/google/play/requirements/target-sdk).
- Staged rollouts (Google Play) or phased releases (App Store) with crash-rate monitoring and a halt plan.
- Backward-compatible APIs: old app versions stay in use for a long time, so the backend must support them or force an update deliberately.

## Done when

- [ ] Follows the platform guidelines; works at the largest text size, in dark mode, and in every supported size class
- [ ] Unit and UI tests pass on the minimum and latest supported OS versions
- [ ] No secrets in the app bundle; MASVS items relevant to the change checked
- [ ] Offline, slow-network, permission-denied and process-death cases handled
- [ ] Accessibility checked with VoiceOver and TalkBack
- [ ] Store requirements for this release confirmed in the official documentation
