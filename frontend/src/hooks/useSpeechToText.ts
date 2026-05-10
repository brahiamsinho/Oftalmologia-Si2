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

/** Expuesto por Chromium / Safari con prefijo webkit. */
function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

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
 * Devuelve handlers seguros si el navegador no soporta la API.
 */
export function useSpeechToText(): UseSpeechToTextResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const browserSupportsSpeechRecognition = useMemo(() => getRecognitionCtor() !== null, []);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0]?.transcript ?? '';
      }
      setTranscript((prev) => (event.resultIndex === 0 ? text : prev + text));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      setRecognitionError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    setRecognitionError(null);
    const r = recognitionRef.current;
    if (!r) return;
    try {
      setTranscript('');
      setIsListening(true);
      r.start();
    } catch {
      setIsListening(false);
      setRecognitionError('no_start');
    }
  }, []);

  const stopListening = useCallback(() => {
    const r = recognitionRef.current;
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
