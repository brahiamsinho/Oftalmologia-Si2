'use client';

import { useState, useEffect } from 'react';
import {
  Users, Calendar as CalendarIcon, Activity, Stethoscope,
  Clock, ArrowRight, Loader2, ChevronRight, Shield
} from 'lucide-react';
import Link from 'next/link';
import { citasService, pacientesService, especialistasService } from '@/lib/services';
import type { Cita } from '@/lib/services/citas';

const TZ_BO = 'America/La_Paz';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pacientes: 0,
    especialistas: 0,
    citasTotales: 0,
    citasAtendidas: 0,
  });
  const [proximasCitas, setProximasCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pacientesRes, citasRes, atendidasRes, especialistasRes] = await Promise.all([
          pacientesService.list({ page: 1 }),
          citasService.list({ page: 1, ordering: 'fecha_hora_inicio' }),
          citasService.list({ estado: 'ATENDIDA', page: 1 }),
          especialistasService.list({ page: 1, activo: 'true' }),
        ]);

        setStats({
          pacientes: pacientesRes.count,
          citasTotales: citasRes.count,
          citasAtendidas: atendidasRes.count,
          especialistas: especialistasRes.count,
        });

        setProximasCitas(citasRes.results.slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const ESTADO_STYLE: Record<string, string> = {
    PROGRAMADA:   'bg-blue-50 text-blue-700 border-blue-100',
    CONFIRMADA:   'bg-emerald-50 text-emerald-700 border-emerald-100',
    CANCELADA:    'bg-red-50 text-red-700 border-red-100',
    ATENDIDA:     'bg-indigo-50 text-indigo-700 border-indigo-100',
    NO_ASISTIO:   'bg-gray-100 text-gray-600 border-gray-200',
  };

  const STATS_UI = [
    { label: 'Pacientes registrados', value: loading ? '—' : stats.pacientes, icon: Users, bg: 'bg-blue-50', ic: 'text-blue-500' },
    { label: 'Citas en sistema', value: loading ? '—' : stats.citasTotales, icon: CalendarIcon, bg: 'bg-emerald-50', ic: 'text-emerald-500' },
    { label: 'Especialistas activos', value: loading ? '—' : stats.especialistas, icon: Stethoscope, bg: 'bg-purple-50', ic: 'text-purple-500' },
    { label: 'Consultas atendidas', value: loading ? '—' : stats.citasAtendidas, icon: Activity, bg: 'bg-orange-50', ic: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in p-2">

      <div>
        <h2 className="text-[22px] sm:text-[24px] font-extrabold text-gray-900 tracking-tight">Panel principal</h2>
        <p className="text-[13.5px] text-gray-500 mt-1">Bienvenido a tu espacio de trabajo en OftalmoCRM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS_UI.map(({ label, value, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start justify-between hover:shadow-md transition-shadow">
            <div className="min-w-0 pr-2">
              <p className="text-[12.5px] text-gray-500 font-bold uppercase tracking-wide mb-1">{label}</p>
              <p className="text-[28px] sm:text-[32px] font-black text-gray-900 leading-none">{value}</p>
            </div>
            <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${ic}`} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/30">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Próximas citas</h3>
            </div>
            <Link href="/citas-agenda" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver agenda <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-0 flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : proximasCitas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                <CalendarIcon className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-[14px]">No hay citas programadas.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {proximasCitas.map(cita => (
                  <div key={cita.id_cita} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-bold text-gray-900">{cita.paciente_nombre}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${ESTADO_STYLE[cita.estado] || 'bg-gray-100 text-gray-600'}`}>
                          {cita.estado_display}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[13px] text-gray-500">
                        <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 flex-shrink-0" /> {cita.especialista_nombre}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-medium text-blue-600">
                          {new Date(cita.fecha_hora_inicio).toLocaleString('es-BO', {
                            timeZone: TZ_BO,
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <Link href="/citas-agenda" className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors self-start sm:self-auto">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/30">
            <h3 className="font-bold text-gray-900">Accesos rápidos</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { title: 'Nuevo paciente', desc: 'Registrar datos', href: '/pacientes', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { title: 'Agendar cita', desc: 'Programar en calendario', href: '/citas-agenda', icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'Historial médico', desc: 'Ver evoluciones', href: '/historial', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(action => (
              <Link key={action.title} href={action.href} className="group flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all bg-white mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-105 transition-transform flex-shrink-0`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[14px] text-gray-900">{action.title}</h4>
                  <p className="text-[12px] text-gray-500">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>

          <div className="mt-auto p-5 bg-gradient-to-br from-blue-600 to-indigo-700 m-5 rounded-xl text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <Shield className="w-8 h-8 text-blue-200 mb-2" />
              <h4 className="font-bold text-lg">Sistema protegido</h4>
              <p className="text-blue-100 text-xs mt-1 leading-relaxed">Datos clínicos con trazabilidad y acceso autenticado.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
          </div>
        </div>

      </div>
    </div>
  );
}
