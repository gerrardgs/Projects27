// Speech to text in the browser with the Web Speech API (W3C Community Group draft). Chrome, Edge and
// Safari implement it, Safari and older Chrome under the webkit prefix; Firefox does not. With the
// default settings the browser may send the audio to its vendor's speech service, which the capture
// page tells the user.
//
// Safari does not always mark a result as final before `end` (seen on Safari with macOS 27: the page
// showed the interim words, then reported that nothing was heard), so the latest transcript is used
// whether or not it is final. Engines also differ in when they stop on a pause, so recognition stops
// after SILENCE_MS without new words, and after NO_SPEECH_MS when no word arrives at all.

interface Recognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onaudiostart: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognizerConstructor = new () => Recognizer;

function recognizerClass(): RecognizerConstructor | null {
  const scope = globalThis as unknown as {
    SpeechRecognition?: RecognizerConstructor;
    webkitSpeechRecognition?: RecognizerConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export const speechSupported = () => recognizerClass() !== null;

export interface SpeechHandlers {
  /** The microphone is capturing audio. */
  onAudioStart: () => void;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
}

const ERROR_TEXT: Record<string, string> = {
  "not-allowed": "Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser, lalu coba lagi.",
  "service-not-allowed": "Browser tidak mengizinkan layanan pengenal suara di halaman ini.",
  "audio-capture": "Mikrofon tidak ditemukan atau sedang dipakai aplikasi lain.",
  "no-speech": "Tidak terdengar suara. Coba lagi dan bicara setelah tanda merekam muncul.",
  network: "Layanan pengenal suara browser tidak dapat dihubungi. Periksa koneksi atau ketik kalimatnya.",
  "language-not-supported": "Browser ini belum mendukung pengenalan suara bahasa Indonesia. Ketik kalimatnya.",
};

export const SILENCE_MS = 2500;
export const NO_SPEECH_MS = 8000;
export const MAX_MS = 30_000;

/** The whole transcript so far: every result in order, final or not. */
function transcriptOf(event: SpeechRecognitionEvent): string {
  let text = "";
  for (let i = 0; i < event.results.length; i += 1) text += event.results[i]?.[0]?.transcript ?? "";
  return text.trim();
}

/** Starts listening in Indonesian; returns a function that stops early and keeps what was heard. */
export function listen(handlers: SpeechHandlers): () => void {
  const Recognition = recognizerClass();
  if (Recognition === null) {
    handlers.onError(
      "Browser ini tidak mendukung pengenalan suara. Gunakan Chrome, Edge atau Safari, atau ketik kalimatnya.",
    );
    return () => undefined;
  }
  const recognizer = new Recognition();
  recognizer.lang = "id-ID";
  recognizer.interimResults = true;
  recognizer.continuous = true;
  recognizer.maxAlternatives = 1;
  let transcript = "";
  let failed = false;
  let ended = false;
  let quiet: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    if (!ended) recognizer.stop();
  };
  const stopAfter = (ms: number) => {
    clearTimeout(quiet);
    quiet = setTimeout(stop, ms);
  };
  const limit = setTimeout(stop, MAX_MS);
  recognizer.onaudiostart = () => {
    handlers.onAudioStart();
    stopAfter(NO_SPEECH_MS);
  };
  recognizer.onresult = (event) => {
    transcript = transcriptOf(event);
    handlers.onInterim(transcript);
    stopAfter(SILENCE_MS);
  };
  recognizer.onerror = (event) => {
    // A pause or an early stop after words were heard still yields those words.
    const keepWords = transcript !== "" && ["no-speech", "aborted"].includes(event.error);
    failed = event.error !== "aborted" && !keepWords;
    if (failed) handlers.onError(ERROR_TEXT[event.error] ?? `Pengenalan suara gagal (${event.error}).`);
  };
  recognizer.onend = () => {
    ended = true;
    clearTimeout(quiet);
    clearTimeout(limit);
    if (!failed) handlers.onFinal(transcript);
  };
  recognizer.start();
  return stop;
}
