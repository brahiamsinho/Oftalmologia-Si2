'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;

/** Tipado mínimo para Web Speech API (no todos los navegadores lo exponen igual). */
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Permiso de micrófono denegado. Activá el micrófono en el navegador.',
  'service-not-allowed': 'El micrófono está bloqueado en este sitio.',
  'no-speech': 'No se detectó voz. Intentá de nuevo.',
  'audio-capture': 'No se encontró micrófono en el dispositivo.',
  'network': 'Error de red del servicio de voz.',
  aborted: '',
  no_start: 'No se pudo iniciar el dictado. Probá de nuevo.',
};

export interface UseSpeechToTextResult {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  browserSupportsSpeechRecognition: boolean;
  recognitionError: string | null;
}

/**
 * Dictado por micrófono → texto (es-ES).
 * Acumula resultados parciales y finales para consultas largas.
 */
export function useSpeechToText(): UseSpeechToTextResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);

  const browserSupportsSpeechRecognition = useMemo(() => getRecognitionCtor() !== null, []);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0]?.transcript ?? '';
      }
      setTranscript(text.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;
      const msg = ERROR_MESSAGES[event.error];
      if (msg) setRecognitionError(msg);
      listeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          listeningRef.current = false;
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    setRecognitionError(null);
    const r = recognitionRef.current;
    if (!r) {
      setRecognitionError('Tu navegador no soporta dictado por voz. Usá Chrome o Edge.');
      return;
    }
    try {
      setTranscript('');
      listeningRef.current = true;
      setIsListening(true);
      r.start();
    } catch {
      listeningRef.current = false;
      setIsListening(false);
      setRecognitionError(ERROR_MESSAGES.no_start);
    }
  }, []);

  const stopListening = useCallback(() => {
    const r = recognitionRef.current;
    listeningRef.current = false;
    if (!r) return;
    try {
      r.stop();
    } catch {
      /* ya detenido */
    }
    setIsListening(false);
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
    recognitionError,
  };
}
