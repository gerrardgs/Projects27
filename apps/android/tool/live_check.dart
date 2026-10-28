// Proves the Android client and the API agree: signs up against a running API, posts the shared
// sample ledger through ApiClient and compares the monthly recap with the independently computed
// expected values. Usage: dart run tool/live_check.dart http://127.0.0.1:8095

import 'dart:convert';
import 'dart:io';

import 'package:keuangan/src/api.dart';

Future<void> main(List<String> args) async {
  final api = ApiClient(
    Uri.parse(args.isEmpty ? 'http://127.0.0.1:8080' : args.first),
  );
  final fixture = jsonDecode(
    File('../../packages/contract/fixtures/personal-sample.json')
        .readAsStringSync(),
  ) as Map<String, dynamic>;
  final email = 'android-${DateTime.now().microsecondsSinceEpoch}@example.test';
  await api.register(email, 'correct horse battery staple', 'Android');
  await api.login(email, 'correct horse battery staple');
  final entityId = (await api.me()).entities.first.id;
  final ids = {for (final a in await api.accounts(entityId)) a.code: a.id};
  var index = 0;
  for (final raw in fixture['entries'] as List) {
    final e = raw as Map<String, dynamic>;
    final key = 'android-fixture-${index++}';
    if (e['type'] == 'journal') {
      await api.createJournalEntry(entityId, {
        'date': e['date'] as String,
        'description': e['description'] as String,
        'idempotencyKey': key,
        'lines': [
          for (final l in e['lines'] as List)
            {
              'accountId': ids[(l as Map)['account']]!,
              if (l['debit'] != null) 'debit': l['debit'],
              if (l['credit'] != null) 'credit': l['credit'],
            },
        ],
      });
    } else {
      await api.recordTransaction(entityId, {
        'kind': e['kind'] as String,
        'date': e['date'] as String,
        'description': e['description'] as String,
        'amount': e['amount'] as String,
        'accountId': ids[e['account']]!,
        'fundingAccountId': ids[e['funding']]!,
        'idempotencyKey': key,
      });
    }
  }
  final recap = await api.monthlyRecap(entityId, 2026, 10);
  final want = (fixture['expected'] as Map)['monthlyRecap'] as Map;
  final got = {
    'totalIncome': recap.totalIncome,
    'totalExpenses': recap.totalExpenses,
    'net': recap.net,
    'savingsRate': recap.savingsRate,
  };
  final mismatches = got.entries
      .where((g) => want[g.key] != g.value)
      .map((g) => '${g.key}: got ${g.value}, want ${want[g.key]}')
      .toList();
  if (!recap.checksPassed) mismatches.add('report self-checks failed');
  if (mismatches.isNotEmpty) {
    stderr.writeln(mismatches.join('\n'));
    exit(1);
  }
  stdout.writeln(
    'ok: ${fixture['entries'].length} entries posted; October recap matches the shared fixture ($got)',
  );
  await api.logout();
}
