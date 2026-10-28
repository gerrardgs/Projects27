import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:keuangan/src/api.dart';
import 'package:keuangan/src/money.dart';

// The shared sample ledger (packages/contract/fixtures) drives the same numbers as the API and web tests.
final fixture = jsonDecode(
  File('../../packages/contract/fixtures/personal-sample.json')
      .readAsStringSync(),
) as Map<String, dynamic>;

void main() {
  test('the sample recap totals format without losing a single sen', () {
    final recap = (fixture['expected'] as Map)['monthlyRecap'] as Map;
    expect(formatRupiah(recap['totalIncome'] as String), 'Rp 16.250.000');
    expect(formatRupiah(recap['totalExpenses'] as String), 'Rp 6.206.350,50');
    expect(formatRupiah(recap['net'] as String), 'Rp 10.043.649,50');
  });

  test('the client sends a bearer token, string amounts, and reads problem details', () async {
    final calls = <(String, Uri, Map<String, String>, String?)>[];
    Future<(int, String)> fake(
      String method,
      Uri uri,
      Map<String, String> headers,
      String? body,
    ) async {
      calls.add((method, uri, headers, body));
      if (uri.path.endsWith('/login')) {
        return (
          200,
          jsonEncode({
            'token': 't' * 43,
            'tokenType': 'Bearer',
            'expiresAt': '2026-11-27T00:00:00.000Z',
          }),
        );
      }
      return (
        422,
        jsonEncode({
          'title': 'Rule violated',
          'status': 422,
          'detail': 'period 2026-09 is closed',
          'requestId': 'x',
        }),
      );
    }

    final api = ApiClient(
      Uri.parse('https://api.example.test'),
      transport: fake,
    );
    await api.login('a@example.test', 'correct horse battery staple');
    expect(jsonDecode(calls.first.$4!)['client'], 'native');
    await expectLater(
      api.recordTransaction('e1', {'kind': 'expense', 'amount': '35000.00'}),
      throwsA(
        isA<ApiException>().having(
          (e) => e.detail,
          'detail',
          'period 2026-09 is closed',
        ),
      ),
    );
    expect(calls.last.$3['authorization'], 'Bearer ${'t' * 43}');
    expect(
      jsonDecode(calls.last.$4!)['amount'],
      '35000.00',
      reason: 'amounts travel as strings',
    );
  });
}
