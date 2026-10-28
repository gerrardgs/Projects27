import 'package:flutter/material.dart';

import '../src/api.dart';
import '../src/dates.dart';
import '../src/money.dart';

/// Says when the screen shows data saved on this device because the server is unreachable, and lists
/// transactions waiting to be sent or refused by the server.
class DeviceBanner extends StatelessWidget {
  const DeviceBanner({super.key, required this.api, required this.onSend});
  final ApiClient api;
  final Future<void> Function() onSend;

  @override
  Widget build(BuildContext context) => StreamBuilder<void>(
    stream: api.changes,
    builder: (context, _) {
      final since = api.offlineSince;
      final pending = api.queue.where((q) => q.status == 'pending').toList();
      final failed = api.queue.where((q) => q.status == 'failed').toList();
      if (since == null && api.queue.isEmpty) return const SizedBox.shrink();
      final scheme = Theme.of(context).colorScheme;
      return Material(
        color: scheme.secondaryContainer,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Semantics(
            liveRegion: true,
            container: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (since != null)
                  Text(
                    'Server tidak dapat dihubungi. Data yang tampil tersimpan di perangkat ini pada ${formatLocalTime(since)}.',
                  ),
                if (pending.isNotEmpty) ...[
                  Text(
                    '${pending.length} transaksi tersimpan di perangkat, menunggu dikirim',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  for (final q in pending)
                    Text(
                      '${q.body['date']} · ${q.body['description']?.isNotEmpty == true ? q.body['description'] : '(tanpa keterangan)'} · ${formatRupiah(q.body['amount'] ?? '0')}',
                    ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: onSend,
                      child: const Text('Kirim sekarang'),
                    ),
                  ),
                ],
                for (final q in failed)
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Ditolak server: ${q.body['description']} (${q.error})',
                          style: TextStyle(color: scheme.error),
                        ),
                      ),
                      TextButton(
                        onPressed: () => api.discardQueued(q.key),
                        child: const Text('Hapus'),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      );
    },
  );
}
