# Projects 27 Android app

Flutter 3.47.8 (Dart 3.13.7), Android only, in Indonesian, on the core API ([apps/api](../api/README.md)) and its contract ([packages/contract](../../packages/contract/README.md)).

| Screen | What it does |
| :--- | :--- |
| Masuk / Buat akun | Sign in as a native client; the bearer token is kept in the Android Keystore through `flutter_secure_storage` 11.2.0 |
| Dasbor | Income, expenses, net, savings rate, a 6-month trend chart that reads all its values to TalkBack, spending per category |
| Catat | **Bicara** with Android's speech recogniser in Indonesian (`speech_to_text` 7.5.0, `id_ID`, dictation mode, stops after a 3-second pause) or type a sentence; the form (type, amount, date, category, funding, description, counterparty) is filled for review and saved only with Simpan; idempotency key per submission |
| Jurnal | Entries of the current month |

Amounts arrive as decimal strings and are formatted as text (`lib/src/money.dart`), never parsed into a `double` except for drawing chart bars.

## Run

```sh
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080   # emulator to an API on the host
```

Release builds allow HTTPS only and set `android:allowBackup="false"`, so the token and data are not copied into device backups. Debug builds allow plain HTTP to `10.0.2.2` and `localhost` only (`android/app/src/debug/res/xml/network_security_config.xml`).

## Voice and offline

- **Bicara** shows a red dot, "Merekam", a timer and the input level while recording; partial words are kept when the recogniser ends without a final result.
- **Offline**: GET answers and transactions saved while the API is down are kept in SQLite (`sqflite` 2.4.4+2, `lib/src/sqlite_store.dart`, in the app's private storage). A banner shows when the data on screen was saved and what is waiting; the outbox is sent on start, every 30 seconds and with "Kirim sekarang". Signing out clears it, after asking when transactions are still waiting.

## Check

```sh
flutter analyze
flutter test                                        # money, client with a fake transport, the shared fixture, a widget test with contrast and tap-target guidelines
dart run tool/live_check.dart http://127.0.0.1:8095 # against a running API: posts the shared sample ledger and compares the recap
```
