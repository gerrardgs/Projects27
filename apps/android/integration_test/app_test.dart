// Runs the real app on a device or emulator against a running API:
// flutter test integration_test --dart-define=API_BASE_URL=http://10.0.2.2:8096

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:keuangan/main.dart';
import 'package:keuangan/src/api.dart';
import 'package:keuangan/src/session.dart';
import 'package:keuangan/src/sqlite_store.dart';

Future<void> pumpUntil(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 20),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
    if (finder.evaluate().isNotEmpty) return;
  }
  final shown = find
      .byType(Text)
      .evaluate()
      .map((e) => (e.widget as Text).data)
      .join(' | ');
  final lists = find.byType(Scrollable).evaluate().map((e) => tester.getSize(find.byWidget(e.widget))).join(', ');
  final insets = tester.view.viewInsets.bottom;
  throw TestFailure('timed out waiting for $finder; on screen: $shown; scrollables: $lists; keyboard: $insets');
}

Future<void> pumpUntilGone(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 30),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
    if (finder.evaluate().isEmpty) return;
  }
  throw TestFailure('still showing $finder');
}

Finder field(String label) => find.widgetWithText(TextField, label);

/// The capture form is a lazily built list: scroll until the target exists and is fully on screen.
Future<void> reveal(WidgetTester tester, Finder finder) async {
  // On a device the soft keyboard shrinks the viewport and the lazy list drops off-screen rows; close it first.
  FocusManager.instance.primaryFocus?.unfocus();
  await tester.pumpAndSettle(const Duration(milliseconds: 300));
  await tester.scrollUntilVisible(
    finder,
    200,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'sign up, record an expense, see it on the dashboard and in the journal',
    (tester) async {
      // The real transport, with a switch that makes the API unreachable, and the real SQLite store.
      var apiDown = false;
      Future<(int, String)> transport(
        String method,
        Uri uri,
        Map<String, String> headers,
        String? body,
      ) {
        if (apiDown) throw const SocketException('Connection refused');
        return ioTransport(method, uri, headers, body);
      }

      final store = await SqliteStore.open();
      await store.clear();
      await tester.pumpWidget(
        KeuanganApp(
          session: Session(
            ApiClient(
              Uri.parse(apiBaseUrl),
              transport: transport,
              store: store,
            ),
          ),
        ),
      );
      await pumpUntil(tester, find.text('Belum punya akun? Daftar'));
      await tester.tap(find.text('Belum punya akun? Daftar'));
      await tester.pump();
      await tester.enterText(field('Nama'), 'Android');
      await tester.enterText(
        field('Email'),
        'android-${DateTime.now().microsecondsSinceEpoch}@example.test',
      );
      await tester.enterText(
        field('Kata sandi'),
        'correct horse battery staple',
      );
      await tester.tap(find.text('Buat akun dan masuk'));
      await pumpUntil(tester, find.text('Tingkat tabungan'));
      expect(find.text('Rp 0'), findsWidgets);

      await tester.tap(find.text('Catat'));
      await pumpUntil(tester, field('Jumlah (Rp)'));
      await tester.enterText(field('Jumlah (Rp)'), '35.000');
      await reveal(tester, field('Keterangan'));
      await tester.enterText(field('Keterangan'), 'Nasi padang');
      await reveal(tester, find.text('Simpan'));
      await tester.tap(find.text('Simpan'));
      await pumpUntil(tester, find.text('Tersimpan: Nasi padang, Rp 35.000'));

      await tester.enterText(
        field('Atau ketik kalimatnya'),
        'terima gaji 12,5 juta dari PT Maju Jaya',
      );
      await tester.tap(find.text('Isi otomatis'));
      await pumpUntil(tester, find.textContaining('Formulir terisi otomatis'));
      expect(find.widgetWithText(TextField, '12.500.000'), findsOneWidget);
      await reveal(tester, find.text('Simpan'));
      await tester.tap(find.text('Simpan'));
      await pumpUntil(tester, find.textContaining('Tersimpan: Terima gaji'));

      // The API goes down: the save waits on the device, and the screens show the saved copy.
      apiDown = true;
      await reveal(tester, field('Jumlah (Rp)'));
      await tester.enterText(field('Jumlah (Rp)'), '12.000');
      await reveal(tester, field('Keterangan'));
      await tester.enterText(field('Keterangan'), 'Parkir saat offline');
      await reveal(tester, find.text('Simpan'));
      await tester.tap(find.text('Simpan'));
      await pumpUntil(
        tester,
        find.textContaining(
          '1 transaksi tersimpan di perangkat, menunggu dikirim',
        ),
      );
      await pumpUntil(
        tester,
        find.textContaining('Data yang tampil tersimpan di perangkat ini'),
      );
      expect(
        (await store.queued()).single.body['description'],
        'Parkir saat offline',
      );

      // Back online: it is sent once and appears in the journal.
      apiDown = false;
      await tester.tap(find.text('Kirim sekarang'));
      await pumpUntilGone(tester, find.textContaining('menunggu dikirim'));
      expect(await store.queued(), isEmpty);

      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      await tester.tap(find.text('Dasbor'));
      await pumpUntil(tester, find.text('Rp 47.000'));
      await tester.tap(find.text('Jurnal'));
      await pumpUntil(tester, find.text('Nasi padang'));
      expect(find.text('Parkir saat offline'), findsOneWidget);
      expect(find.textContaining('Diposting'), findsWidgets);

      await tester.tap(find.byTooltip('Keluar'));
      await pumpUntil(tester, find.text('Masuk'));
    },
  );
}
