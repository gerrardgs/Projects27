import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import 'local_store.dart';

/// The device copy in SQLite, in the app's private storage (not readable by other apps).
class SqliteStore implements LocalStore {
  SqliteStore._(this._db);
  final Database _db;

  static Future<SqliteStore> open() async {
    final db = await openDatabase(
      '${await getDatabasesPath()}/keuangan.db',
      version: 1,
      onCreate: (db, _) async {
        await db.execute(
          'create table cache (path text primary key, body text not null, saved_at text not null)',
        );
        await db.execute(
          'create table outbox (key text primary key, created_at text not null, item text not null)',
        );
      },
    );
    return SqliteStore._(db);
  }

  @override
  Future<CachedResponse?> read(String path) async {
    final rows = await _db.query('cache', where: 'path = ?', whereArgs: [path]);
    if (rows.isEmpty) return null;
    return CachedResponse(
      rows.first['body'] as String,
      DateTime.parse(rows.first['saved_at'] as String),
    );
  }

  @override
  Future<void> write(String path, String body) => _db.insert('cache', {
    'path': path,
    'body': body,
    'saved_at': DateTime.now().toUtc().toIso8601String(),
  }, conflictAlgorithm: ConflictAlgorithm.replace);

  @override
  Future<List<QueuedTransaction>> queued() async {
    final rows = await _db.query('outbox', orderBy: 'created_at');
    return rows
        .map((r) => QueuedTransaction.fromJson(_decode(r['item'] as String)))
        .toList();
  }

  @override
  Future<void> put(QueuedTransaction item) => _db.insert('outbox', {
    'key': item.key,
    'created_at': item.createdAt.toUtc().toIso8601String(),
    'item': item.encode(),
  }, conflictAlgorithm: ConflictAlgorithm.replace);

  @override
  Future<void> remove(String key) =>
      _db.delete('outbox', where: 'key = ?', whereArgs: [key]);

  @override
  Future<void> clear() async {
    await _db.delete('cache');
    await _db.delete('outbox');
  }
}

Map<String, dynamic> _decode(String text) =>
    jsonDecode(text) as Map<String, dynamic>;
