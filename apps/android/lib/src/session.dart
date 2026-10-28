import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api.dart';

/// Keeps the bearer token in the Android Keystore (through flutter_secure_storage), never in plain preferences.
class Session {
  Session(this.api, {FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();
  final ApiClient api;
  final FlutterSecureStorage _storage;
  static const _key = 'p27_token';

  Future<bool> restore() async {
    api.token = await _storage.read(key: _key);
    return api.token != null;
  }

  Future<void> signIn(String email, String password, {String? totp}) async {
    await _storage.write(
      key: _key,
      value: await api.login(email, password, totp: totp),
    );
  }

  Future<void> signOut() async {
    try {
      await api.logout();
    } finally {
      api.token = null;
      await _storage.delete(key: _key);
    }
  }
}
