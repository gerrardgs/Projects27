import 'package:flutter/material.dart';

import '../src/models.dart';
import '../src/money.dart';

const _statusLabel = {
  'posted': 'Diposting',
  'reversed': 'Dibalik',
  'submitted': 'Menunggu persetujuan',
  'rejected': 'Ditolak',
};

class JournalScreen extends StatelessWidget {
  const JournalScreen({super.key, required this.entries});
  final List<Entry> entries;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const Center(child: Text('Belum ada transaksi pada bulan ini.'));
    }
    return ListView.separated(
      itemCount: entries.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (_, i) {
        final e = entries[i];
        return ListTile(
          title: Text(e.description),
          subtitle: Text('${e.date} · ${_statusLabel[e.status] ?? e.status}'),
          trailing: Text(formatRupiah(e.total)),
        );
      },
    );
  }
}
