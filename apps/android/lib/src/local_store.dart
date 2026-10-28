// Data kept on the device so the app keeps working when the API or the hosting is down: the last good
// answer to every GET, and transactions saved while offline, waiting to be sent. Pure Dart, so the API
// client stays testable; the app uses SQLite (sqlite_store.dart), tests use MemoryStore.

import 'dart:convert';

class CachedResponse {
  CachedResponse(this.body, this.savedAt);
  final String body;
  final DateTime savedAt;
}

class QueuedTransaction {
  QueuedTransaction({
    required this.key,
    required this.entityId,
    required this.body,
    required this.review,
    required this.createdAt,
    this.status = 'pending',
    this.error,
  });

  factory QueuedTransaction.fromJson(Map<String, dynamic> j) =>
      QueuedTransaction(
        key: j['key'] as String,
        entityId: j['entityId'] as String,
        body: (j['body'] as Map).cast<String, String>(),
        review: j['review'] == null
            ? null
            : CaptureReview.fromJson(j['review'] as Map<String, dynamic>),
        createdAt: DateTime.parse(j['createdAt'] as String),
        status: j['status'] as String,
        error: j['error'] as String?,
      );

  /// The transaction's idempotency key, so sending it twice posts it once.
  final String key;
  final String entityId;
  final Map<String, String> body;
  final CaptureReview? review;
  final DateTime createdAt;

  /// "pending" until sent, or "failed" when the server refused it (for example a closed period).
  final String status;
  final String? error;

  QueuedTransaction failed(String message) => QueuedTransaction(
    key: key,
    entityId: entityId,
    body: body,
    review: review,
    createdAt: createdAt,
    status: 'failed',
    error: message,
  );

  Map<String, dynamic> toJson() => {
    'key': key,
    'entityId': entityId,
    'body': body,
    'review': review?.toJson(),
    'createdAt': createdAt.toUtc().toIso8601String(),
    'status': status,
    'error': error,
  };

  String encode() => jsonEncode(toJson());
}

/// Which filled fields the person changed before Simpan; feeds the real-use quality report.
class CaptureReview {
  CaptureReview(this.draftId, this.changed);
  factory CaptureReview.fromJson(Map<String, dynamic> j) => CaptureReview(
    j['draftId'] as String,
    (j['changed'] as List).cast<String>(),
  );
  final String draftId;
  final List<String> changed;
  Map<String, dynamic> toJson() => {'draftId': draftId, 'changed': changed};
}

abstract class LocalStore {
  Future<CachedResponse?> read(String path);
  Future<void> write(String path, String body);
  Future<List<QueuedTransaction>> queued();
  Future<void> put(QueuedTransaction item);
  Future<void> remove(String key);

  /// Everything, at sign-out: the data belongs to the person who was signed in.
  Future<void> clear();
}

class MemoryStore implements LocalStore {
  final _cache = <String, CachedResponse>{};
  final _queue = <String, QueuedTransaction>{};

  @override
  Future<CachedResponse?> read(String path) async => _cache[path];
  @override
  Future<void> write(String path, String body) async =>
      _cache[path] = CachedResponse(body, DateTime.now());
  @override
  Future<List<QueuedTransaction>> queued() async =>
      _queue.values.toList()
        ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
  @override
  Future<void> put(QueuedTransaction item) async => _queue[item.key] = item;
  @override
  Future<void> remove(String key) async => _queue.remove(key);
  @override
  Future<void> clear() async {
    _cache.clear();
    _queue.clear();
  }
}
