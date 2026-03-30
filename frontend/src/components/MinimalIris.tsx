'use client';

/**
 * Iris + pupila minimal para login: círculos concéntricos, pupila con dilatación CSS suave.
 */
export default function MinimalIris() {
  return (
    <div
      className="relative flex items-center justify-center mx-auto"
      style={{ width: 152, height: 152 }}
      aria-hidden
    >
      {/* Halo exterior */}
      <div
        className="absolute inset-0 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 65%)',
        }}
      />

      {/* Anillo tipo esclerótica / borde */}
      <div
        className="absolute rounded-full border border-white/25 shadow-[0_0_40px_rgba(59,130,246,0.25)]"
        style={{ width: 132, height: 132, inset: 10 }}
      />

      {/* Iris */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: 118,
          height: 118,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `
            radial-gradient(circle at 32% 30%,
              rgba(255,255,255,0.55) 0%,
              rgba(186,230,253,0.35) 8%,
              transparent 22%
            ),
            radial-gradient(circle at 50% 50%,
              #7dd3fc 0%,
              #38bdf8 28%,
              #2563eb 55%,
              #1e40af 78%,
              #172554 100%
            )
          `,
          boxShadow: 'inset 0 0 24px rgba(15,23,42,0.35)',
        }}
      >
        {/* Rayos muy sutiles */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            background: `repeating-conic-gradient(
              from 0deg at 50% 50%,
              transparent 0deg 14deg,
              rgba(255,255,255,0.9) 14deg 15deg
            )`,
          }}
        />

        {/* Pupila (animada) */}
        <div
          className="minimal-iris-pupil absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: '34%',
            height: '34%',
            background: 'radial-gradient(circle at 28% 22%, #64748b 0%, #0f172a 45%, #020617 100%)',
            boxShadow: 'inset 0 -2px 6px rgba(0,0,0,0.5), 0 0 12px rgba(15,23,42,0.6)',
          }}
        />

        {/* Brillo */}
        <div
          className="absolute rounded-full bg-white/50 blur-[1.5px]"
          style={{ width: 10, height: 10, top: '26%', left: '30%' }}
        />
      </div>
    </div>
  );
}
