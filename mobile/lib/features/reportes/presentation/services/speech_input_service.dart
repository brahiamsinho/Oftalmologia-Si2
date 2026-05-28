import 'package:speech_to_text/speech_to_text.dart';

/// Dictado por voz (es-ES) para consultas de reportes.
class SpeechInputService {
  SpeechInputService() : _speech = SpeechToText();

  final SpeechToText _speech;
  bool _available = false;
  bool _initialized = false;

  bool get isListening => _speech.isListening;

  Future<bool> initialize() async {
    if (_initialized) return _available;
    _available = await _speech.initialize(
      onError: (_) {},
      onStatus: (_) {},
    );
    _initialized = true;
    return _available;
  }

  Future<void> startListening({
    required void Function(String text) onText,
    void Function(String message)? onError,
  }) async {
    final ok = await initialize();
    if (!ok) {
      onError?.call('El dictado por voz no está disponible en este dispositivo.');
      return;
    }
    if (_speech.isListening) {
      await _speech.stop();
    }
    await _speech.listen(
      localeId: 'es_ES',
      listenMode: ListenMode.confirmation,
      onResult: (result) {
        onText(result.recognizedWords);
      },
      cancelOnError: true,
      partialResults: true,
    );
  }

  Future<void> stopListening() async {
    if (_speech.isListening) {
      await _speech.stop();
    }
  }

  void dispose() {
    _speech.stop();
    _speech.cancel();
  }
}
