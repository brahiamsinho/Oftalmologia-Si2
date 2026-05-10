'use client';

import React from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isListening: boolean;
  onToggleListen: () => void;
  loading: boolean;
}

export default function AIAssistantBar({
  value,
  onChange,
  onSubmit,
  isListening,
  onToggleListen,
  loading,
}: Props) {
  return (
    <div className="relative mx-auto flex w-full max-w-4xl items-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50">
      <input
        type="text"
        placeholder="Ej: Mostrame los pacientes registrados este mes..."
        className="w-full rounded-full border-none bg-transparent py-4 pl-6 pr-32 text-gray-700 focus:outline-none focus:ring-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !loading && onSubmit()}
        disabled={loading}
      />

      <div className="absolute right-2 flex items-center gap-2">
        <button
          onClick={onToggleListen}
          type="button"
          className={`rounded-full p-2 transition-colors ${
            isListening ? 'animate-pulse bg-red-100 text-red-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="Dictar por voz"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              Generar
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
