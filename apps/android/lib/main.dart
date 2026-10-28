import 'dart:async';

import 'package:flutter/material.dart';

import 'screens/capture_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/journal_screen.dart';
import 'screens/login_screen.dart';
import 'src/api.dart';
import 'src/dates.dart';
import 'src/models.dart';
import 'src/session.dart';
import 'src/sqlite_store.dart';
import 'widgets/device_banner.dart';

/// The API address is set at build time: flutter run --dart-define=API_BASE_URL=https://...
/// The default reaches a development API on the host machine from the Android emulator.
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8080',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final store = await SqliteStore.open();
  runApp(
    KeuanganApp(
      session: Session(ApiClient(Uri.parse(apiBaseUrl), store: store)),
    ),
  );
}

class KeuanganApp extends StatelessWidget {
  const KeuanganApp({super.key, required this.session});
  final Session session;
  @override
  Widget build(BuildContext context) {
    final seed = ColorScheme.fromSeed(seedColor: const Color(0xFF0B5CAD));
    return MaterialApp(
      title: 'Keuangan',
      theme: ThemeData(colorScheme: seed),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0B5CAD),
          brightness: Brightness.dark,
        ),
      ),
      home: Root(session: session),
    );
  }
}

class Root extends StatefulWidget {
  const Root({super.key, required this.session});
  final Session session;
  @override
  State<Root> createState() => _RootState();
}

class _RootState extends State<Root> {
  late Future<bool> _restored = widget.session.restore();

  @override
  Widget build(BuildContext context) => FutureBuilder<bool>(
    future: _restored,
    builder: (context, snapshot) {
      if (!snapshot.hasData) {
        return const Scaffold(
          body: Center(
            child: CircularProgressIndicator(semanticsLabel: 'Memuat'),
          ),
        );
      }
      if (snapshot.data != true) {
        return LoginScreen(
          session: widget.session,
          onSignedIn: () => setState(() {
            _restored = Future.value(true);
          }),
        );
      }
      return Home(
        session: widget.session,
        onSignedOut: () => setState(() {
          _restored = Future.value(false);
        }),
      );
    },
  );
}

class HomeData {
  HomeData(this.me, this.accounts, this.dashboard, this.entries);
  final Me me;
  final List<Account> accounts;
  final DashboardData dashboard;
  final List<Entry> entries;
}

class Home extends StatefulWidget {
  const Home({super.key, required this.session, required this.onSignedOut});
  final Session session;
  final VoidCallback onSignedOut;
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  int _tab = 0;
  late Future<HomeData> _data = _load();
  Timer? _sync;

  @override
  void initState() {
    super.initState();
    // Queued transactions go out when the server is back: now, then every 30 seconds.
    unawaited(_sendQueued());
    _sync = Timer.periodic(
      const Duration(seconds: 30),
      (_) => unawaited(_sendQueued()),
    );
  }

  @override
  void dispose() {
    _sync?.cancel();
    super.dispose();
  }

  Future<void> _sendQueued() async {
    final api = widget.session.api;
    await api.refreshQueue();
    if (api.queue.any((q) => q.status == 'pending') &&
        await api.syncOutbox() > 0 &&
        mounted) {
      _reload();
    }
  }

  /// Signing out clears this device's copy, so it first asks before dropping unsent transactions.
  Future<void> _signOut() async {
    final waiting = widget.session.api.queue.length;
    if (waiting > 0) {
      final sure = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Keluar?'),
          content: Text(
            '$waiting transaksi belum terkirim dan akan dihapus dari perangkat ini.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Batal'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Tetap keluar'),
            ),
          ],
        ),
      );
      if (sure != true) return;
    }
    await widget.session.signOut().whenComplete(widget.onSignedOut);
  }

  Future<HomeData> _load() async {
    final api = widget.session.api;
    final me = await api.me();
    final entityId = me.entities.first.id;
    final today = todayJakarta();
    final year = int.parse(today.substring(0, 4));
    final month = int.parse(today.substring(5, 7));
    final bounds = monthBounds(year, month);
    return HomeData(
      me,
      await api.accounts(entityId),
      await loadDashboard(api, entityId, year, month),
      await api.entries(entityId, bounds.from, bounds.to),
    );
  }

  void _reload() => setState(() {
    _data = _load();
  });

  @override
  Widget build(BuildContext context) {
    final today = todayJakarta();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Keuangan'),
        actions: [
          IconButton(
            tooltip: 'Keluar',
            icon: const Icon(Icons.logout),
            onPressed: _signOut,
          ),
        ],
      ),
      body: FutureBuilder<HomeData>(
        future: _data,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('${snapshot.error}'),
                  TextButton(
                    onPressed: _reload,
                    child: const Text('Coba lagi'),
                  ),
                ],
              ),
            );
          }
          final data = snapshot.data;
          if (data == null) {
            return const Center(
              child: CircularProgressIndicator(semanticsLabel: 'Memuat'),
            );
          }
          final entityId = data.me.entities.first.id;
          final screen = switch (_tab) {
            1 => CaptureScreen(
              api: widget.session.api,
              entityId: entityId,
              accounts: data.accounts,
              onSaved: _reload,
            ),
            2 => JournalScreen(entries: data.entries),
            _ => DashboardScreen(
              data: data.dashboard,
              year: int.parse(today.substring(0, 4)),
              month: int.parse(today.substring(5, 7)),
            ),
          };
          return Column(
            children: [
              DeviceBanner(api: widget.session.api, onSend: _sendQueued),
              Expanded(child: screen),
            ],
          );
        },
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            label: 'Dasbor',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            label: 'Catat',
          ),
          NavigationDestination(icon: Icon(Icons.list_alt), label: 'Jurnal'),
        ],
      ),
    );
  }
}
