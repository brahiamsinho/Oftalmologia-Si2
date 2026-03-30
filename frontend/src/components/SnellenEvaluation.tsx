'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Cartilla tipo Snellen para la pantalla de login:
 * - Filas con letras de tamaño decreciente
 * - Hover: resalta la fila (simula “línea de agudeza”)
 * - Clic en una letra: regenera letras de esa fila (práctica interactiva)
 */
const POOL = ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'D', 'C'] as const;

const INITIAL_ROWS: string[][] = [
  ['E'],
  ['F', 'P'],
  ['T', 'O', 'Z'],
  ['L', 'P', 'E', 'D'],
  ['F', 'E', 'L', 'O', 'P'],
  ['D', 'E', 'F', 'P', 'O', 'T', 'E'],
  ['L', 'E', 'F', 'O', 'D', 'P', 'C', 'T'],
];

/** Tamaños en rem, proporción similar a cartilla a distancia reducida en pantalla */
const ROW_REM = [3.25, 2.35, 1.75, 1.35, 1.05, 0.82, 0.65];

function randomLetter(): string {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

function randomRow(length: number): string[] {
  return Array.from({ length }, () => randomLetter());
}

export default function SnellenEvaluation() {
  const [rows, setRows] = useState<string[][]>(() => INITIAL_ROWS.map(r => [...r]));
  const [hovered, setHovered] = useState<number | null>(null);

  const handleLetterClick = useCallback((rowIndex: number) => {
    setRows(prev => {
      const next = prev.map((r, i) =>
        i === rowIndex ? randomRow(r.length) : r
      );
      return next;
    });
  }, []);

  const hintId = useMemo(() => 'snellen-hint', []);

  return (
    <div
      className="w-full max-w-[380px] rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md px-4 py-6 shadow-lg"
      role="img"
      aria-labelledby={hintId}
    >
      <p id={hintId} className="sr-only">
        Cartilla de agudeza visual tipo Snellen. Pasa el cursor sobre cada fila o toca una letra para cambiar la secuencia.
      </p>

      <div className="text-center mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
          Agudeza visual
        </p>
        <p className="text-[11px] text-blue-100/90 mt-1">
          Pasa el cursor por una fila · Clic en una letra para nueva línea
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-1.5 sm:gap-2">
        {rows.map((letters, rowIndex) => {
          const isHot = hovered === rowIndex;
          const rem = ROW_REM[rowIndex] ?? ROW_REM[ROW_REM.length - 1];

          return (
            <div
              key={rowIndex}
              role="group"
              aria-label={`Fila ${rowIndex + 1}, ${letters.length} letras. Clic en una letra para nueva secuencia.`}
              className={`w-full rounded-xl py-1.5 px-2 transition-all duration-200
                ${isHot ? 'bg-white/20 scale-[1.02]' : 'bg-transparent hover:bg-white/10'}`}
              onMouseEnter={() => setHovered(rowIndex)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center justify-center flex-wrap" style={{ gap: '0.35em' }}>
                {letters.map((ch, i) => (
                  <button
                    key={`${rowIndex}-${i}-${ch}`}
                    type="button"
                    onClick={() => handleLetterClick(rowIndex)}
                    className="inline-flex items-center justify-center font-bold text-white cursor-pointer select-none
                      transition-transform duration-150 hover:scale-110 active:scale-95
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:rounded
                      drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] bg-transparent border-0 p-0 m-0"
                    style={{
                      fontSize: `${rem}rem`,
                      lineHeight: 1,
                      fontFamily: 'ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif',
                      letterSpacing: '0.02em',
                    }}
                    aria-label={`Letra ${ch}, regenerar fila ${rowIndex + 1}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-2 border-t border-white/15 pt-3">
        <span className="text-[10px] text-blue-100/80">
          Simulación educativa · no sustituye examen clínico
        </span>
      </div>
    </div>
  );
}
