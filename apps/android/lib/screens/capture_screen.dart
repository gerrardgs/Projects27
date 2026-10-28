import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';

import '../src/api.dart';
import '../src/dates.dart';
import '../src/local_store.dart';
import '../src/models.dart';
import '../src/money.dart';
import '../src/voice.dart';

String _newKey() {
  final r = Random.secure();
  return List.generate(
    16,
    (_) => r.nextInt(256).toRadixString(16).padLeft(2, '0'),
  ).join();
}

const _kindLabels = {
  'expense': 'Pengeluaran',
  'income': 'Pemasukan',
  'transfer': 'Pindah',
};

/// Quick capture of one income, expense or transfer. Speaking (or typing a sentence) fills the form;
/// the person checks it and presses Simpan.
class CaptureScreen extends StatefulWidget {
  const CaptureScreen({
    super.key,
    required this.api,
    required this.entityId,
    required this.accounts,
    required this.onSaved,
    this.voice,
  });
  final ApiClient api;
  final String entityId;
  final List<Account> accounts;
  final VoidCallback onSaved;
  final VoiceInput? voice;
  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  late final VoiceInput _voice = widget.voice ?? DeviceVoiceInput();
  String _kind = 'expense';
  String? _category;
  String? _funding;
  String _date = todayJakarta();
  String _key = _newKey();
  final _amount = TextEditingController();
  final _description = TextEditingController();
  final _counterparty = TextEditingController();
  final _sentence = TextEditingController();
  final _amountFocus = FocusNode();
  final _saveFocus = FocusNode();
  String? _message;
  String? _amountError;
  String? _voiceStatus;
  bool _listening = false;
  bool _recording = false;
  double _level = 0;
  bool _processing = false;
  CaptureDraft? _draft;
  int _round = 0;

  List<Account> _ofTypes(List<String> types) =>
      widget.accounts.where((a) => types.contains(a.type)).toList();
  List<Account> get _categories =>
      _ofTypes(_kind == 'transfer' ? ['asset', 'liability'] : [_kind]);
  List<Account> get _fundingAccounts => _ofTypes(['asset', 'liability']);

  Future<void> _fill(String text) async {
    if (text.trim().isEmpty) {
      setState(() {
        _listening = false;
        _voiceStatus = 'Tidak ada kalimat yang terdengar. Coba lagi.';
      });
      return;
    }
    setState(() {
      _listening = false;
      _recording = false;
      _processing = true;
      _voiceStatus = 'Memproses “$text”…';
    });
    try {
      final draft = await widget.api.parseCapture(widget.entityId, text);
      setState(() {
        _draft = draft;
        _kind = draft.kind;
        if (draft.amount != null) _amount.text = toInputAmount(draft.amount!);
        _date = draft.date;
        _category = draft.accountId;
        _funding = draft.fundingAccountId ?? _funding;
        if (draft.description != null) _description.text = draft.description!;
        if (draft.counterparty != null) {
          _counterparty.text = draft.counterparty!;
        }
        final how = draft.source == 'ai' ? 'AI' : 'aturan bawaan';
        _voiceStatus =
            'Formulir terisi otomatis dari “$text” ($how).${draft.missing.isEmpty ? '' : ' Lengkapi kolom yang kosong.'} Periksa lalu tekan Simpan.';
      });
      (draft.amount == null ? _amountFocus : _saveFocus).requestFocus();
    } on ApiException catch (e) {
      setState(() => _voiceStatus = e.detail);
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _startListening() async {
    setState(() {
      _listening = true;
      _recording = false;
      _voiceStatus = 'Meminta izin dan menyalakan mikrofon…';
    });
    await _voice.listen(
      onRecording: () => setState(() {
        _recording = true;
        _voiceStatus = 'Mendengarkan… silakan bicara.';
      }),
      onLevel: (level) => setState(() => _level = level),
      onPartial: (text) => setState(() {
        _recording = true;
        _voiceStatus = 'Mendengarkan… “$text”';
      }),
      onFinal: _fill,
      onError: (message) => setState(() {
        _listening = false;
        _recording = false;
        _voiceStatus = message;
      }),
    );
  }

  Future<void> _pickDate() async {
    final current = DateTime.parse(_date);
    final picked = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime(current.year - 5),
      lastDate: DateTime(current.year + 1),
    );
    if (picked != null) {
      setState(() => _date = picked.toIso8601String().substring(0, 10));
    }
  }

  Future<void> _save() async {
    final amount = parseRupiahInput(_amount.text);
    setState(
      () => _amountError = amount == null
          ? 'Tulis jumlah seperti 35.000 atau 1.250.000,50'
          : null,
    );
    final categories = _categories;
    final funding = _fundingAccounts;
    if (amount == null || categories.isEmpty || funding.isEmpty) return;
    final body = {
      'kind': _kind,
      'date': _date,
      'amount': amount,
      'accountId': _category ?? categories.first.id,
      'fundingAccountId': _funding ?? funding.first.id,
      'description': _description.text.trim(),
      'counterparty': _counterparty.text.trim(),
      'idempotencyKey': _key,
    };
    final draft = _draft;
    final review = draft == null
        ? null
        : CaptureReview(draft.draftId, changedFields(draft, body));
    try {
      final result = await widget.api.saveTransaction(
        widget.entityId,
        body,
        review,
      );
      setState(() {
        _message = switch (result) {
          Saved(:final entry) =>
            'Tersimpan: ${entry.description}, ${formatRupiah(entry.total)}',
          Queued() => 'Server tidak dapat dihubungi. Transaksi disimpan di perangkat ini dan dikirim otomatis saat server tersedia.',
        };
        _voiceStatus = null;
        _draft = null;
        _round += 1;
        _key = _newKey();
        // A fresh form, as on the web: the kind, category and date of the last entry do not carry over.
        _kind = 'expense';
        _category = null;
        _date = todayJakarta();
      });
      for (final c in [_amount, _description, _counterparty, _sentence]) {
        c.clear();
      }
      widget.onSaved();
    } on ApiException catch (e) {
      setState(() => _message = e.detail);
    }
  }

  @override
  void dispose() {
    for (final c in [_amount, _description, _counterparty, _sentence]) {
      c.dispose();
    }
    _amountFocus.dispose();
    _saveFocus.dispose();
    super.dispose();
  }

  Widget _voiceCard() {
    final busy = _listening || _processing;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Isi dengan suara atau kalimat',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Text(
              'Contoh: “beli nasi padang 35 ribu pakai GoPay kemarin”. Formulir diisi otomatis; periksa, lalu tekan Simpan.',
            ),
            const SizedBox(height: 8),
            _listening
                ? FilledButton.icon(
                    onPressed: _voice.stop,
                    icon: const Icon(Icons.stop),
                    label: const Text('Selesai bicara'),
                  )
                : FilledButton.icon(
                    onPressed: busy ? null : _startListening,
                    icon: const Icon(Icons.mic),
                    label: const Text('Bicara'),
                  ),
            if (_listening)
              _RecordingIndicator(recording: _recording, level: _level),
            if (_voiceStatus != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Semantics(liveRegion: true, child: Text(_voiceStatus!)),
              ),
            TextField(
              controller: _sentence,
              decoration: const InputDecoration(
                labelText: 'Atau ketik kalimatnya',
              ),
              textInputAction: TextInputAction.done,
              onSubmitted: busy ? null : _fill,
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: busy ? null : () => _fill(_sentence.text),
                child: const Text('Isi otomatis'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final categories = _categories;
    final funding = _fundingAccounts;
    final categoryValue = categories.any((a) => a.id == _category)
        ? _category
        : (categories.isEmpty ? null : categories.first.id);
    final fundingValue = funding.any((a) => a.id == _funding)
        ? _funding
        : (funding.isEmpty ? null : funding.first.id);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _voiceCard(),
        _QualityNote(
          key: ValueKey(_round),
          api: widget.api,
          entityId: widget.entityId,
        ),
        if (_message != null)
          Semantics(liveRegion: true, child: Text(_message!)),
        SegmentedButton<String>(
          segments: [
            for (final e in _kindLabels.entries)
              ButtonSegment(value: e.key, label: Text(e.value)),
          ],
          selected: {_kind},
          onSelectionChanged: (s) => setState(() {
            _kind = s.first;
            _category = null;
          }),
        ),
        TextField(
          controller: _amount,
          focusNode: _amountFocus,
          decoration: InputDecoration(
            labelText: 'Jumlah (Rp)',
            helperText: 'Contoh: 35.000',
            errorText: _amountError,
          ),
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Tanggal'),
          subtitle: Text(_date),
          trailing: const Icon(Icons.calendar_month),
          onTap: _pickDate,
        ),
        DropdownButtonFormField<String>(
          key: ValueKey('category-$_kind-$categoryValue'),
          initialValue: categoryValue,
          decoration: InputDecoration(
            labelText: _kind == 'transfer' ? 'Ke akun' : 'Kategori',
          ),
          items: [
            for (final a in categories)
              DropdownMenuItem(value: a.id, child: Text('${a.code} ${a.name}')),
          ],
          onChanged: (v) => _category = v,
        ),
        DropdownButtonFormField<String>(
          key: ValueKey('funding-$fundingValue'),
          initialValue: fundingValue,
          decoration: InputDecoration(
            labelText: _kind == 'income' ? 'Masuk ke' : 'Dari',
          ),
          items: [
            for (final a in funding)
              DropdownMenuItem(value: a.id, child: Text('${a.code} ${a.name}')),
          ],
          onChanged: (v) => _funding = v,
        ),
        TextField(
          controller: _description,
          decoration: const InputDecoration(labelText: 'Keterangan'),
        ),
        TextField(
          controller: _counterparty,
          decoration: const InputDecoration(labelText: 'Pihak lain (opsional)'),
        ),
        const SizedBox(height: 16),
        FilledButton(
          focusNode: _saveFocus,
          onPressed: _save,
          child: const Text('Simpan'),
        ),
      ],
    );
  }
}

/// The fields the draft filled that the person changed before Simpan; what the quality report counts.
List<String> changedFields(CaptureDraft draft, Map<String, String> saved) {
  final pairs = <(String, String?, String?)>[
    ('kind', draft.kind, saved['kind']),
    ('amount', draft.amount, saved['amount']),
    ('date', draft.date, saved['date']),
    ('accountId', draft.accountId, saved['accountId']),
    ('fundingAccountId', draft.fundingAccountId, saved['fundingAccountId']),
    ('description', draft.description, saved['description']),
    ('counterparty', draft.counterparty, saved['counterparty']),
  ];
  return [
    for (final (field, filled, now) in pairs)
      if (filled != null && filled.isNotEmpty && filled != now) field,
  ];
}

/// A visible sign that the microphone records: a red dot, the word, the elapsed time and the input level.
class _RecordingIndicator extends StatefulWidget {
  const _RecordingIndicator({required this.recording, required this.level});
  final bool recording;
  final double level;
  @override
  State<_RecordingIndicator> createState() => _RecordingIndicatorState();
}

class _RecordingIndicatorState extends State<_RecordingIndicator> {
  final _watch = Stopwatch();
  Timer? _timer;

  @override
  void didUpdateWidget(_RecordingIndicator old) {
    super.didUpdateWidget(old);
    _sync();
  }

  @override
  void initState() {
    super.initState();
    _sync();
  }

  void _sync() {
    if (widget.recording && !_watch.isRunning) {
      _watch.start();
      _timer = Timer.periodic(
        const Duration(milliseconds: 250),
        (_) => setState(() {}),
      );
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.recording) {
      return const Padding(
        padding: EdgeInsets.only(top: 8),
        child: Text('Menyalakan mikrofon…'),
      );
    }
    final seconds = _watch.elapsed.inSeconds;
    final time =
        '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';
    // speech_to_text reports the level in dB, roughly -2 (quiet) to 10 (loud) on Android.
    final level = ((widget.level + 2) / 12).clamp(0.0, 1.0);
    final red = Theme.of(context).colorScheme.error;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        key: const Key('recording-indicator'),
        children: [
          ExcludeSemantics(
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(color: red, shape: BoxShape.circle),
            ),
          ),
          const SizedBox(width: 8),
          const Text('Merekam', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(width: 8),
          ExcludeSemantics(child: Text(time)),
          const SizedBox(width: 12),
          Expanded(
            child: ExcludeSemantics(
              child: LinearProgressIndicator(value: level, color: red),
            ),
          ),
        ],
      ),
    );
  }
}

/// How often filled forms were saved without correction, from this person's own use.
class _QualityNote extends StatelessWidget {
  const _QualityNote({super.key, required this.api, required this.entityId});
  final ApiClient api;
  final String entityId;
  @override
  Widget build(BuildContext context) => FutureBuilder<CaptureQuality>(
    future: api.captureQuality(entityId),
    builder: (context, snapshot) {
      final q = snapshot.data;
      if (q == null || q.saved == 0) return const SizedBox.shrink();
      final r = q.savedWithoutChanges;
      String pct(double v) => '${(v * 100).round()}%';
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(
          'Ketepatan isi otomatis (${q.days} hari terakhir): ${r.count} dari ${r.of} formulir disimpan tanpa koreksi'
          '${r.rate == null ? '' : ' (${pct(r.rate!)}; rentang 95%: ${pct(r.low)}–${pct(r.high)})'}.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      );
    },
  );
}
