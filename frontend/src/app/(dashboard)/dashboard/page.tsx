'use client';

import { Users, Calendar, Scissors, Activity } from 'lucide-react';

/* ── Donut chart ── */
const DONUT_DATA = [
  { label: 'Nuevos',          value: 15, color: '#3B82F6' },
  { label: 'En consulta',     value: 25, color: '#F59E0B' },
  { label: 'Cirugía',         value: 12, color: '#8B5CF6' },
  { label: 'Postoperatorio',  value: 18, color: '#10B981' },
];

function DonutChart() {
  const total = DONUT_DATA.reduce((s, d) => s + d.value, 0);
  const R = 68;
  const CX = 90;
  const CY = 90;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const slices = DONUT_DATA.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = offset * 360 - 90;
    offset += pct;
    return { ...d, dash, gap, rotation };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={180} height={180} viewBox="0 0 180 180">
        {slices.map((s) => (
          <circle
            key={s.label}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={0}
            transform={`rotate(${s.rotation} ${CX} ${CY})`}
          />
        ))}
        {/* Center hole overlay */}
        <circle cx={CX} cy={CY} r={R - strokeWidth / 2 - 2} fill="white" />
        <text x={CX} y={CY - 6} textAnchor="middle" className="text-sm" fill="#111827" fontSize={20} fontWeight={700}>{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="#6B7280" fontSize={10}>pacientes</text>
      </svg>

      {/* Legend */}
      <div className="space-y-2.5">
        {DONUT_DATA.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[13px] text-gray-600 min-w-[100px]">{d.label}</span>
            <span className="text-[13px] font-semibold text-gray-900 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Weekly bar chart ── */
const WEEKLY = [
  { day: 'Lun', v: 12 },
  { day: 'Mar', v: 15 },
  { day: 'Mié', v: 18 },
  { day: 'Jue', v: 14 },
  { day: 'Vie', v: 20 },
  { day: 'Sáb', v: 8  },
];
const MAX_V = Math.max(...WEEKLY.map(d => d.v));
const CHART_H = 140;

/* ── Stat cards ── */
const STATS = [
  { label: 'Pacientes hoy',        value: '0', sub: '+12% vs semana anterior', icon: Users,    bg: 'bg-blue-50',   ic: 'text-blue-500'   },
  { label: 'Próximas citas',        value: '5', sub: 'Esta semana',             icon: Calendar, bg: 'bg-green-50',  ic: 'text-green-500'  },
  { label: 'Cirugías programadas',  value: '1', sub: 'Próximos 7 días',         icon: Scissors, bg: 'bg-purple-50', ic: 'text-purple-500' },
  { label: 'En postoperatorio',     value: '2', sub: 'Requieren seguimiento',   icon: Activity, bg: 'bg-orange-50', ic: 'text-orange-500' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between">
            <div>
              <p className="text-[12.5px] text-gray-500 font-medium mb-1">{label}</p>
              <p className="text-[32px] font-bold text-gray-900 leading-none mb-2">{value}</p>
              <p className="text-[11.5px] text-gray-400">{sub}</p>
            </div>
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${ic}`} strokeWidth={1.8} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-5">Actividad semanal</h3>

          {/* Y gridlines + bars */}
          <div className="relative" style={{ height: CHART_H + 28 }}>
            {/* Grid */}
            {[0, 5, 10, 15, 20].map((tick) => (
              <div
                key={tick}
                className="absolute left-0 right-0 flex items-center"
                style={{ bottom: (tick / MAX_V) * CHART_H + 24 }}
              >
                <span className="text-[10px] text-gray-300 w-5 flex-shrink-0 text-right pr-1">{tick}</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>
            ))}

            {/* Bars */}
            <div className="absolute left-6 right-0 flex items-end justify-between" style={{ height: CHART_H, bottom: 24 }}>
              {WEEKLY.map(({ day, v }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 mx-1">
                  <div
                    className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors cursor-default"
                    style={{ height: (v / MAX_V) * CHART_H }}
                    title={`${day}: ${v}`}
                  />
                </div>
              ))}
            </div>

            {/* X labels */}
            <div className="absolute left-6 right-0 flex justify-between" style={{ bottom: 4 }}>
              {WEEKLY.map(({ day }) => (
                <div key={day} className="flex-1 text-center">
                  <span className="text-[11px] text-gray-400">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Estado de pacientes</h3>
          <DonutChart />
        </div>
      </div>
    </div>
  );
}
