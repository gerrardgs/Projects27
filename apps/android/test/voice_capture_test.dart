import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:keuangan/screens/capture_screen.dart';
import 'package:keuangan/src/api.dart';
import 'package:keuangan/src/local_store.dart';
import 'package:keuangan/src/models.dart';
import 'package:keuangan/src/voice.dart';

class FakeVoice implements VoiceInput {
  FakeVoice(this.heard);
  final String heard;
  @override
  Future<bool> available() async => true;
  @override
  Future<void> listen({
    required void Function() onRecording,
    required void Function(double) onLevel,
    required void Function(String) onPartial,
    required void Function(String) onFinal,
    required void Function(String) onError,
  }) async {
    onRecording();
    onLevel(5);
    onPartial(heard.split(' ').first);
    onFinal(heard);
  }

  @override
  Future<void> stop() async {}
}

final accounts = [
  Account(id: 'a5100', code: '5100', name: 'Makan dan Minum', type: 'expense'),
  Account(id: 'a5990', code: '5990', name: 'Pengeluaran Lain', type: 'expense'),
  Account(id: 'a1100', code: '1100', name: 'Kas Tunai', type: 'asset'),
  Account(id: 'a1300', code: '1300', name: 'Dompet Digital', type: 'asset'),
];

final quality = {
  'days': 90,
  'drafts': 1,
  'saved': 1,
  'savedWithoutChanges': {
    'count': 1,
    'of': 1,
    'rate': 1.0,
    'ci95': [0.2065, 1.0],
  },
};

void main() {
  testWidgets('speaking fills the form; nothing is posted until Simpan', (
    tester,
  ) async {
    final calls = <String>[];
    Future<(int, String)> transport(
      String method,
      Uri uri,
      Map<String, String> headers,
      String? body,
    ) async {
      if (method == 'GET') return (200, jsonEncode(quality));
      calls.add('$method ${uri.path} ${body ?? ''}');
      if (uri.path.endsWith('/review')) return (204, '');
      if (uri.path.endsWith('/capture/parse')) {
        return (
          200,
          jsonEncode({
            'draftId': 'd-1',
            'kind': 'expense',
            'amount': '35000.00',
            'date': '2026-10-27',
            'accountId': 'a5100',
            'accountCode': '5100',
            'fundingAccountId': 'a1300',
            'fundingCode': '1300',
            'description': 'Beli nasi padang',
            'counterparty': 'Warung Sederhana',
            'source': 'rules',
            'model': null,
            'missing': <String>[],
            'note': null,
          }),
        );
      }
      return (
        201,
        jsonEncode({
          'id': 'e1',
          'date': '2026-10-27',
          'description': 'Beli nasi padang',
          'status': 'posted',
          'total': '35000.00',
        }),
      );
    }

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CaptureScreen(
            api: ApiClient(
              Uri.parse('https://api.example.test'),
              transport: transport,
              token: 't',
            ),
            entityId: 'e',
            accounts: accounts,
            onSaved: () {},
            voice: FakeVoice(
              'beli nasi padang 35 ribu pakai gopay kemarin di warung sederhana',
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Bicara'));
    await tester.pumpAndSettle();

    expect(calls, hasLength(1));
    expect(
      jsonDecode(calls.single.split(' ').skip(2).join(' '))['text'],
      'beli nasi padang 35 ribu pakai gopay kemarin di warung sederhana',
    );
    expect(find.widgetWithText(TextField, '35.000'), findsOneWidget);
    expect(find.text('2026-10-27'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('5100 Makan dan Minum'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('5100 Makan dan Minum'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('1300 Dompet Digital'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('1300 Dompet Digital'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Beli nasi padang'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.widgetWithText(TextField, 'Warung Sederhana'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.widgetWithText(TextField, 'Warung Sederhana'), findsOneWidget);
    expect(find.textContaining('Formulir terisi otomatis'), findsOneWidget);
    expect(
      calls.where((c) => c.contains('/transactions')),
      isEmpty,
      reason: 'the person has not pressed Simpan yet',
    );

    await tester.scrollUntilVisible(
      find.text('Simpan'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(find.text('Simpan'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Simpan'));
    await tester.pumpAndSettle();
    final posted = jsonDecode(
      calls
          .firstWhere((c) => c.contains('/transactions'))
          .split(' ')
          .skip(2)
          .join(' '),
    ) as Map<String, dynamic>;
    final review = calls.last;
    expect(review, startsWith('POST /v1/entities/e/capture/d-1/review'));
    expect(jsonDecode(review.split(' ').skip(2).join(' '))['changed'], isEmpty);
    expect(posted['amount'], '35000.00');
    expect(posted['accountId'], 'a5100');
    expect(posted['fundingAccountId'], 'a1300');
    expect(posted['date'], '2026-10-27');
    expect(find.textContaining('Tersimpan: Beli nasi padang'), findsOneWidget);
  });

  test('when the server cannot be reached, data comes from the device and a save waits in the outbox', () async {
    var online = true;
    final posted = <String>[];
    Future<(int, String)> transport(
      String method,
      Uri uri,
      Map<String, String> headers,
      String? body,
    ) async {
      if (!online) throw const SocketException('Connection refused');
      if (method == 'GET') {
        return (200, jsonEncode({'accounts': <Object>[]}));
      }
      posted.add(jsonDecode(body!)['idempotencyKey'] as String);
      return (
        201,
        jsonEncode({
          'id': 'e1',
          'date': '2026-10-27',
          'description': 'Parkir',
          'status': 'posted',
          'total': '5000.00',
        }),
      );
    }

    final api = ApiClient(
      Uri.parse('https://api.example.test'),
      transport: transport,
      token: 't',
      store: MemoryStore(),
    );
    expect(await api.accounts('e'), isEmpty);
    expect(api.offlineSince, isNull);
    online = false;
    expect(await api.accounts('e'), isEmpty, reason: 'served from the device');
    expect(api.offlineSince, isNotNull);

    final body = {
      'kind': 'expense',
      'date': '2026-10-27',
      'amount': '5000.00',
      'accountId': 'a5990',
      'fundingAccountId': 'a1100',
      'description': 'Parkir',
      'counterparty': '',
      'idempotencyKey': 'k-1',
    };
    expect(await api.saveTransaction('e', body, null), isA<Queued>());
    expect(api.queue.single.key, 'k-1');
    expect(await api.syncOutbox(), 0, reason: 'still offline');
    expect(api.queue, hasLength(1));

    online = true;
    expect(await api.syncOutbox(), 1);
    expect(api.queue, isEmpty);
    expect(posted, ['k-1'], reason: 'sent once, with its idempotency key');
    await expectLater(api.accounts('e'), completes);
    expect(api.offlineSince, isNull);
  });
}
