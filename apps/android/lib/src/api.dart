// Client for the core API. Pure Dart (dart:io only), so it also runs in `dart run tool/live_check.dart`.
// Native clients sign in with client "native" and send the token as a bearer header. With a LocalStore,
// GET answers are kept on the device and shown when the server cannot be reached, and transactions saved
// then wait in the outbox until it is back.

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'local_store.dart';
import 'models.dart';

/// One HTTP exchange; replaced by a fake in tests.
typedef Transport = Future<(int, String)> Function(
  String method,
  Uri uri,
  Map<String, String> headers,
  String? body,
);

Future<(int, String)> ioTransport(
  String method,
  Uri uri,
  Map<String, String> headers,
  String? body,
) async {
  final client = HttpClient()..connectionTimeout = const Duration(seconds: 10);
  try {
    final request = await client.openUrl(method, uri);
    headers.forEach(request.headers.set);
    if (body != null) request.add(utf8.encode(body));
    final response = await request.close().timeout(const Duration(seconds: 30));
    return (response.statusCode, await response.transform(utf8.decoder).join());
  } finally {
    client.close();
  }
}

class ApiException implements Exception {
  ApiException(this.status, this.title, this.detail);
  final int status;
  final String title;
  final String detail;
  @override
  String toString() => detail;
}

const unreachableMessage =
    'Server API tidak dapat dihubungi. Periksa koneksi atau pastikan API berjalan.';

/// The server could not be reached (no network, refused, timed out, or a gateway error), as opposed to
/// a server that answered with an error.
bool isUnreachable(Object error) =>
    error is ApiException &&
    (error.status == 0 || (error.status >= 502 && error.status <= 504));

sealed class SaveResult {}

class Saved extends SaveResult {
  Saved(this.entry);
  final Entry entry;
}

class Queued extends SaveResult {}

class ApiClient {
  ApiClient(this.baseUrl, {Transport? transport, this.token, this.store})
    : _transport = transport ?? ioTransport;
  final Uri baseUrl;
  final Transport _transport;
  String? token;
  final LocalStore? store;

  /// When the data shown was saved, while the server cannot be reached; null when online.
  DateTime? offlineSince;
  List<QueuedTransaction> queue = const [];
  final _changes = StreamController<void>.broadcast();

  /// Fires when [offlineSince] or [queue] changes.
  Stream<void> get changes => _changes.stream;

  void _setOffline(DateTime? since) {
    if (since == offlineSince) return;
    offlineSince = since;
    _changes.add(null);
  }

  Future<(int, String)> _exchange(
    String method,
    String path,
    Map<String, String> headers,
    String? body,
  ) async {
    try {
      final (status, text) = await _transport(
        method,
        baseUrl.resolve(path),
        headers,
        body,
      );
      if (status >= 502 && status <= 504) {
        throw ApiException(status, 'Unreachable', unreachableMessage);
      }
      return (status, text);
    } on ApiException {
      rethrow;
    } on Object catch (error) {
      if (error is SocketException ||
          error is TimeoutException ||
          error is HttpException ||
          error is HandshakeException) {
        throw ApiException(0, 'Unreachable', unreachableMessage);
      }
      rethrow;
    }
  }

  Future<dynamic> _call(String method, String path, [Object? body]) async {
    final headers = <String, String>{'accept': 'application/json'};
    if (token != null) headers['authorization'] = 'Bearer $token';
    if (body != null) headers['content-type'] = 'application/json';
    final String text;
    final int status;
    try {
      (status, text) = await _exchange(
        method,
        path,
        headers,
        body == null ? null : jsonEncode(body),
      );
    } on ApiException catch (error) {
      final saved = method == 'GET' && isUnreachable(error)
          ? await store?.read(path)
          : null;
      if (saved == null) rethrow;
      _setOffline(saved.savedAt);
      return jsonDecode(saved.body);
    }
    if (method == 'GET' && status < 400) {
      await store?.write(path, text);
      _setOffline(null);
    }
    final data = text.isEmpty ? null : jsonDecode(text);
    if (status >= 400) {
      final problem = data is Map<String, dynamic>
          ? data
          : const <String, dynamic>{};
      throw ApiException(
        status,
        problem['title'] as String? ?? 'Error',
        problem['detail'] as String? ?? 'HTTP $status',
      );
    }
    return data;
  }

  Future<void> register(String email, String password, String displayName) =>
      _call('POST', '/v1/auth/register', {
        'email': email,
        'password': password,
        'displayName': displayName,
      });

  Future<String> login(String email, String password, {String? totp}) async {
    final data = await _call('POST', '/v1/auth/login', {
      'email': email,
      'password': password,
      'client': 'native',
      'totp': ?totp,
    });
    return token = (data as Json)['token'] as String;
  }

  Future<void> logout() async {
    try {
      await _call('POST', '/v1/auth/logout');
    } on ApiException catch (error) {
      if (!isUnreachable(error)) rethrow;
    } finally {
      token = null;
      await store?.clear();
      queue = const [];
      _setOffline(null);
      _changes.add(null);
    }
  }

  Future<Me> me() async => Me.fromJson(await _call('GET', '/v1/me') as Json);

  String _entity(String id) => '/v1/entities/${Uri.encodeComponent(id)}';

  Future<List<Account>> accounts(String entityId) async =>
      ((await _call('GET', '${_entity(entityId)}/accounts') as Json)['accounts']
              as List)
          .map((a) => Account.fromJson(a as Json))
          .toList();

  Future<Entry> recordTransaction(
    String entityId,
    Map<String, String> body,
  ) async => Entry.fromJson(
    await _call('POST', '${_entity(entityId)}/transactions', body) as Json,
  );

  Future<Entry> createJournalEntry(
    String entityId,
    Map<String, Object> body,
  ) async => Entry.fromJson(
    await _call('POST', '${_entity(entityId)}/journal-entries', body) as Json,
  );

  Future<CaptureDraft> parseCapture(String entityId, String text) async =>
      CaptureDraft.fromJson(
        await _call('POST', '${_entity(entityId)}/capture/parse', {
          'text': text,
        }) as Json,
      );

  Future<void> reviewCapture(String entityId, CaptureReview review) => _call(
    'POST',
    '${_entity(entityId)}/capture/${review.draftId}/review',
    {'outcome': 'saved', 'changed': review.changed},
  );

  Future<CaptureQuality> captureQuality(
    String entityId, {
    int days = 90,
  }) async => CaptureQuality.fromJson(
    await _call('GET', '${_entity(entityId)}/capture/quality?days=$days')
        as Json,
  );

  /// Saves a transaction, or keeps it on the device when the server cannot be reached. `body` carries
  /// the idempotency key; the review, if any, is sent after the transaction is saved.
  Future<SaveResult> saveTransaction(
    String entityId,
    Map<String, String> body,
    CaptureReview? review,
  ) async {
    try {
      final entry = await recordTransaction(entityId, body);
      if (review != null) await _reviewQuietly(entityId, review);
      return Saved(entry);
    } on ApiException catch (error) {
      final local = store;
      if (!isUnreachable(error) || local == null) rethrow;
      await local.put(
        QueuedTransaction(
          key:
              body['idempotencyKey'] ??
              '${DateTime.now().microsecondsSinceEpoch}',
          entityId: entityId,
          body: body,
          review: review,
          createdAt: DateTime.now(),
        ),
      );
      await refreshQueue();
      return Queued();
    }
  }

  // The review only feeds the quality report; failing to send it never fails the save.
  Future<void> _reviewQuietly(String entityId, CaptureReview review) async {
    try {
      await reviewCapture(entityId, review);
    } on Object catch (_) {}
  }

  Future<void> refreshQueue() async {
    queue = await store?.queued() ?? const [];
    _changes.add(null);
  }

  static bool _isRefusal(Object error) =>
      error is ApiException &&
      error.status >= 400 &&
      error.status < 500 &&
      !const [401, 408, 429].contains(error.status);

  /// Sends queued transactions oldest first, stopping at the first outage. Returns how many were tried.
  Future<int> syncOutbox() async {
    final local = store;
    if (local == null) return 0;
    var tried = 0;
    try {
      for (final item in await local.queued()) {
        if (item.status != 'pending') continue;
        try {
          await recordTransaction(item.entityId, item.body);
          final review = item.review;
          if (review != null) await _reviewQuietly(item.entityId, review);
          await local.remove(item.key);
        } on Object catch (error) {
          if (!_isRefusal(error)) break;
          await local.put(item.failed('$error'));
        }
        tried += 1;
      }
    } finally {
      await refreshQueue();
    }
    return tried;
  }

  Future<void> discardQueued(String key) async {
    await store?.remove(key);
    await refreshQueue();
  }

  Future<List<Entry>> entries(String entityId, String from, String to) async =>
      ((await _call(
                'GET',
                '${_entity(entityId)}/journal-entries?from=$from&to=$to&limit=500',
              ) as Json)['entries']
              as List)
          .map((e) => Entry.fromJson(e as Json))
          .toList();

  Future<MonthlyRecap> monthlyRecap(
    String entityId,
    int year,
    int month,
  ) async => MonthlyRecap.fromJson(
    await _call(
      'GET',
      '${_entity(entityId)}/reports/monthly-recap?year=$year&month=$month',
    ) as Json,
  );

  Future<List<TrendPoint>> trend(String entityId, int year, int month) async =>
      ((await _call(
                'GET',
                '${_entity(entityId)}/reports/monthly-trend?year=$year&month=$month&months=6',
              ) as Json)['series']
              as List)
          .map((p) => TrendPoint.fromJson(p as Json))
          .toList();
}
