'use client';

import { Users, Calendar, Scissors, Activity } from 'lucide-react';

const STATS = [
  { label: 'Pacientes hoy',        value: '—', icon: Users,    bg: 'bg-blue-50',   ic: 'text-blue-500'   },
  { label: 'Próximas citas',        value: '—', icon: Calendar, bg: 'bg-green-50',  ic: 'text-green-500'  },
  { label: 'Cirugías programadas',  value: '—', icon: Scissors, bg: 'bg-purple-50', ic: 'text-purple-500' },
  { label: 'En postoperatorio',     value: '—', icon: Activity, bg: 'bg-orange-50', ic: 'text-orange-500' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between">
            <div>
              <p className="text-[12.5px] text-gray-500 font-medium mb-1">{label}</p>
              <p className="text-[32px] font-bold text-gray-300 leading-none">{value}</p>
            </div>
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${ic}`} strokeWidth={1.8} />
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center h-56 gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">Actividad semanal disponible con datos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center h-56 gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400 text-center">Estado de pacientes disponible con datos</p>
        </div>
      </div>
    </div>
  );
}
