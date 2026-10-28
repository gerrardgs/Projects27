import 'package:speech_to_text/speech_to_text.dart';

/// Speech to text on the device. Android's SpeechRecognizer (through speech_to_text 7.5.0) listens in
/// Indonesian and stops after a pause. A fake replaces it in tests.
///
/// Recognisers do not always send a final result: stopping early, a pause timeout or "no match" after
/// words were heard can end the session with only partial words. Those words are kept and delivered as
/// the final text, so what the person saw on screen is what fills the form.
abstract class VoiceInput {
  Future<bool> available();
  Future<void> listen({
    required void Function() onRecording,
    required void Function(double level) onLevel,
    required void Function(String text) onPartial,
    required void Function(String text) onFinal,
    required void Function(String message) onError,
  });
  Future<void> stop();
}

class DeviceVoiceInput implements VoiceInput {
  final SpeechToText _speech = SpeechToText();
  void Function(String code)? _onError;
  void Function(String status)? _onStatus;

  @override
  Future<bool> available() => _speech.initialize(
    onError: (e) => _onError?.call(e.errorMsg),
    onStatus: (status) => _onStatus?.call(status),
  );

  @override
  Future<void> listen({
    required void Function() onRecording,
    required void Function(double level) onLevel,
    required void Function(String text) onPartial,
    required void Function(String text) onFinal,
    required void Function(String message) onError,
  }) async {
    var heard = '';
    var done = false;
    void finish() {
      if (done) return;
      done = true;
      onFinal(heard);
    }

    _onStatus = (status) {
      if (status == SpeechToText.listeningStatus) onRecording();
      if (status == SpeechToText.doneStatus) finish();
    };
    _onError = (code) {
      if (done) return;
      if (heard.isNotEmpty) return finish();
      done = true;
      onError(_message(code));
    };
    if (!await available()) {
      onError(
        'Pengenalan suara tidak tersedia. Izinkan mikrofon untuk aplikasi ini, atau ketik kalimatnya.',
      );
      return;
    }
    await _speech.listen(
      onResult: (result) {
        heard = result.recognizedWords;
        if (result.finalResult) {
          finish();
        } else {
          onPartial(heard);
        }
      },
      onSoundLevelChange: onLevel,
      listenOptions: SpeechListenOptions(
        localeId: 'id_ID',
        partialResults: true,
        listenMode: ListenMode.dictation,
        pauseFor: const Duration(seconds: 3),
        listenFor: const Duration(seconds: 30),
        cancelOnError: true,
      ),
    );
  }

  @override
  Future<void> stop() => _speech.stop();

  static String _message(String code) => switch (code) {
    'error_permission' || 'error_insufficient_permissions' =>
      'Izin mikrofon ditolak. Izinkan di Pengaturan, lalu coba lagi.',
    'error_no_match' ||
    'error_speech_timeout' => 'Tidak terdengar kalimat yang jelas. Coba lagi.',
    'error_network' || 'error_network_timeout' || 'error_server' =>
      'Layanan pengenal suara tidak dapat dihubungi. Ketik kalimatnya.',
    'error_language_not_supported' || 'error_language_unavailable' =>
      'Bahasa Indonesia belum tersedia di pengenal suara perangkat ini.',
    _ => 'Pengenalan suara gagal ($code).',
  };
}
