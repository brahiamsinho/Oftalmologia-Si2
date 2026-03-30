'use client';

/**
 * EyeIllustration.tsx
 * Ojo animado con:
 *  - Parpadeo natural (SVG SMIL, sin JS)
 *  - Pupila que sigue el cursor con lerp suave (rAF, cero re-renders)
 */

import { useEffect, useRef } from 'react';

export default function EyeIllustration() {
  const svgRef   = useRef<SVGSVGElement>(null);
  const pupilRef = useRef<SVGGElement>(null);
  const rafRef   = useRef<number>(0);
  const target   = useRef({ x: 0, y: 0 });
  const current  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left)  / rect.width)  * 480;
      const svgY = ((e.clientY - rect.top)   / rect.height) * 380;

      const dx   = svgX - 240;
      const dy   = svgY - 190;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) { target.current = { x: 0, y: 0 }; return; }

      const maxTravel  = 22;
      const trackRange = 260;
      const factor     = Math.min(dist / trackRange, 1) * maxTravel;

      target.current = {
        x: (dx / dist) * factor,
        y: (dy / dist) * factor,
      };
    }

    function onMouseLeave() {
      target.current = { x: 0, y: 0 };
    }

    function tick() {
      const SMOOTHNESS = 0.09;

      current.current.x += (target.current.x - current.current.x) * SMOOTHNESS;
      current.current.y += (target.current.y - current.current.y) * SMOOTHNESS;

      if (pupilRef.current) {
        const x = current.current.x.toFixed(3);
        const y = current.current.y.toFixed(3);
        pupilRef.current.setAttribute('transform', `translate(${x},${y})`);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove',   onMouseMove,  { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove',   onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Timing del parpadeo ── */
  const dur = '5s';
  const kt  = '0; 0.70; 0.78; 0.84; 0.93; 1';
  const ks  = '0 0 1 1; 0.55 0 1 0.45; 0 0 1 1; 0 0.55 0.45 1; 0 0 1 1';

  /* ── Paths de párpados ── */
  const topOpen   = 'M 40 190 Q 140 70  240 70  Q 340 70  440 190';
  const topClosed = 'M 40 190 Q 140 192 240 192 Q 340 192 440 190';
  const botOpen   = 'M 440 190 Q 340 310 240 310 Q 140 310 40 190';
  const botClosed = 'M 440 190 Q 340 188 240 188 Q 140 188 40 190';
  const clipOpen  = 'M 40 190 Q 140 70  240 70  Q 340 70  440 190 Q 340 310 240 310 Q 140 310 40 190 Z';
  const clipClosed= 'M 40 190 Q 140 192 240 192 Q 340 192 440 190 Q 340 188 240 188 Q 140 188 40 190 Z';

  const vals = (o: string, c: string) => `${o};${o};${c};${c};${o};${o}`;
  const rays  = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 480 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ojo animado — Clínica Oftalmológica"
      className="w-full h-full"
      style={{ cursor: 'none' }}
    >
      <defs>
        <clipPath id="eyeClip">
          <path d={clipOpen}>
            <animate attributeName="d" values={vals(clipOpen, clipClosed)}
              keyTimes={kt} dur={dur} repeatCount="indefinite"
              calcMode="spline" keySplines={ks} />
          </path>
        </clipPath>

        <filter id="irisGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="lidGlow" x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="pupilGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.30" />
          <stop offset="100%" stopColor="white" stopOpacity="0"    />
        </radialGradient>

        <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(180,140,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </radialGradient>
      </defs>

      {/* Círculos ambientales */}
      <circle cx="240" cy="190" r="178" stroke="white" strokeWidth="1"   opacity="0.07" />
      <circle cx="240" cy="190" r="148" stroke="white" strokeWidth="0.8" opacity="0.11" />

      {/* Esclerótica */}
      <g clipPath="url(#eyeClip)">
        <ellipse cx="240" cy="190" rx="210" ry="130" fill="rgba(255,255,255,0.05)" />
      </g>

      {/* Iris */}
      <g clipPath="url(#eyeClip)">
        <circle cx="240" cy="190" r="72"
          stroke="white" strokeWidth="2"
          fill="url(#irisGrad)"
          opacity="0.95"
          filter="url(#irisGlow)"
        />
        {rays.map(deg => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={deg}
              x1={240 + 44 * Math.cos(rad)} y1={190 + 44 * Math.sin(rad)}
              x2={240 + 69 * Math.cos(rad)} y2={190 + 69 * Math.sin(rad)}
              stroke="white" strokeWidth="1.1" opacity="0.38"
            />
          );
        })}
      </g>

      {/* Pupila — sigue el cursor */}
      <g clipPath="url(#eyeClip)">
        <g ref={pupilRef}>
          <circle cx="240" cy="190" r="34" fill="rgba(40,0,70,0.80)">
            <animate attributeName="r" values="34;34;2;2;34;34"
              keyTimes={kt} dur={dur} repeatCount="indefinite"
              calcMode="spline" keySplines={ks} />
          </circle>
          <circle cx="240" cy="190" r="34" fill="url(#pupilGrad)">
            <animate attributeName="r" values="34;34;2;2;34;34"
              keyTimes={kt} dur={dur} repeatCount="indefinite"
              calcMode="spline" keySplines={ks} />
          </circle>
          <circle cx="224" cy="173" r="11" fill="white" opacity="0.58" />
          <circle cx="257" cy="207" r="5"  fill="white" opacity="0.22" />
          <circle cx="249" cy="177" r="3"  fill="white" opacity="0.20" />
        </g>
      </g>

      {/* Párpado superior */}
      <path d={topOpen} stroke="white" strokeWidth="2.6"
        strokeLinecap="round" opacity="0.90" filter="url(#lidGlow)">
        <animate attributeName="d" values={vals(topOpen, topClosed)}
          keyTimes={kt} dur={dur} repeatCount="indefinite"
          calcMode="spline" keySplines={ks} />
      </path>

      {/* Párpado inferior */}
      <path d={botOpen} stroke="white" strokeWidth="1.8"
        strokeLinecap="round" opacity="0.65">
        <animate attributeName="d" values={vals(botOpen, botClosed)}
          keyTimes={kt} dur={dur} repeatCount="indefinite"
          calcMode="spline" keySplines={ks} />
      </path>

      {/* Esquinas */}
      <circle cx="40"  cy="190" r="3" fill="white" opacity="0.55" />
      <circle cx="440" cy="190" r="3" fill="white" opacity="0.55" />

      {/* Pestañas superiores */}
      {[
        { x: 92,  y: 140, dx:  -4, dy: -18 },
        { x: 155, y: 98,  dx:  -1, dy: -20 },
        { x: 200, y: 76,  dx:   2, dy: -20 },
        { x: 240, y: 70,  dx:   0, dy: -20 },
        { x: 280, y: 76,  dx:  -2, dy: -20 },
        { x: 325, y: 98,  dx:   1, dy: -20 },
        { x: 388, y: 140, dx:   4, dy: -18 },
      ].map(({ x, y, dx, dy }, i) => (
        <line key={i}
          x1={x} y1={y} x2={x + dx} y2={y + dy}
          stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.52">
          <animate attributeName="y1"
            values={`${y};${y};191;191;${y};${y}`}
            keyTimes={kt} dur={dur} repeatCount="indefinite"
            calcMode="spline" keySplines={ks} />
          <animate attributeName="y2"
            values={`${y + dy};${y + dy};188;188;${y + dy};${y + dy}`}
            keyTimes={kt} dur={dur} repeatCount="indefinite"
            calcMode="spline" keySplines={ks} />
          <animate attributeName="x2"
            values={`${x + dx};${x + dx};${x};${x};${x + dx};${x + dx}`}
            keyTimes={kt} dur={dur} repeatCount="indefinite"
            calcMode="spline" keySplines={ks} />
        </line>
      ))}

      {/* Partículas flotantes */}
      <circle cx="80"  cy="96"  r="6.5" fill="white" opacity="0.13">
        <animate attributeName="cy" values="96;88;96"    dur="7s"   repeatCount="indefinite" />
      </circle>
      <circle cx="400" cy="284" r="9"   fill="white" opacity="0.08">
        <animate attributeName="cy" values="284;294;284" dur="9s"   repeatCount="indefinite" />
      </circle>
      <circle cx="390" cy="76"  r="5"   fill="white" opacity="0.15">
        <animate attributeName="cy" values="76;68;76"    dur="6s"   repeatCount="indefinite" />
      </circle>
      <circle cx="95"  cy="306" r="7"   fill="white" opacity="0.10">
        <animate attributeName="cy" values="306;314;306" dur="8s"   repeatCount="indefinite" />
      </circle>
      <circle cx="434" cy="150" r="4"   fill="white" opacity="0.17">
        <animate attributeName="cy" values="150;142;150" dur="5.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
