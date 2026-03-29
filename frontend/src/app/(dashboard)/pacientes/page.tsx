'use client';

import { useState } from 'react';
import { Search, Plus, Phone, Mail, Calendar, Eye, SlidersHorizontal } from 'lucide-react';

type Estado = 'Nuevo' | 'En consulta' | 'Candidato a cirugía' | 'Postoperatorio' | 'Alta';

interface Paciente {
  id: number;
  nombre: string;
  edad: number;
  telefono: string;
  email: string;
  diagnostico: string;
  medico: string;
  estado: Estado;
  proximaCita: string | null;
}

const DATA: Paciente[] = [
  { id: 1, nombre: 'María González',  edad: 45, telefono: '+34 612 345 678', email: 'maria.gonzalez@email.com',  diagnostico: 'Catarata bilateral',              medico: 'Dr. Ramírez',   estado: 'Postoperatorio',      proximaCita: '17/3/2026' },
  { id: 2, nombre: 'Carlos Mendoza',  edad: 62, telefono: '+34 623 456 789', email: 'carlos.mendoza@email.com',  diagnostico: 'Glaucoma de ángulo abierto',      medico: 'Dra. Martínez', estado: 'Candidato a cirugía', proximaCita: '16/3/2026' },
  { id: 3, nombre: 'Ana Rodríguez',   edad: 38, telefono: '+34 634 567 890', email: 'ana.rodriguez@email.com',   diagnostico: 'Miopía progresiva',               medico: 'Dr. Ramírez',   estado: 'En consulta',         proximaCita: '15/3/2026' },
  { id: 4, nombre: 'Juan Pérez',      edad: 58, telefono: '+34 645 678 901', email: 'juan.perez@email.com',      diagnostico: 'Desprendimiento de retina',       medico: 'Dra. Martínez', estado: 'Postoperatorio',      proximaCita: '18/3/2026' },
  { id: 5, nombre: 'Laura Sánchez',   edad: 51, telefono: '+34 656 789 012', email: 'laura.sanchez@email.com',   diagnostico: 'Pendiente de evaluación',         medico: 'Dr. Ramírez',   estado: 'Nuevo',               proximaCita: '20/3/2026' },
  { id: 6, nombre: 'Roberto Torres',  edad: 67, telefono: '+34 667 890 123', email: 'roberto.torres@email.com',  diagnostico: 'Catarata - Recuperación exitosa', medico: 'Dra. Martínez', estado: 'Alta',                proximaCita: null          },
];

const BADGE: Record<Estado, string> = {
  'Nuevo':               'bg-blue-100 text-blue-700',
  'En consulta':         'bg-yellow-100 text-yellow-700',
  'Candidato a cirugía': 'bg-purple-100 text-purple-700',
  'Postoperatorio':      'bg-green-100 text-green-700',
  'Alta':                'bg-gray-100 text-gray-500',
};

const SUMMARY = [
  { label: 'Nuevos',             color: 'text-blue-600'   },
  { label: 'En consulta',        color: 'text-yellow-600' },
  { label: 'Candidatos cirugía', color: 'text-purple-600' },
  { label: 'Postoperatorio',     color: 'text-green-600'  },
  { label: 'Alta',               color: 'text-gray-500'   },
];

export default function PacientesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Estado | 'Todos'>('Todos');

  const rows = DATA.filter((p) => {
    const q = search.toLowerCase();
    return (
      (filter === 'Todos' || p.estado === filter) &&
      (p.nombre.toLowerCase().includes(q) || p.diagnostico.toLowerCase().includes(q))
    );
  });

  const counts: Record<string, number> = {
    'Nuevos':             DATA.filter(p => p.estado === 'Nuevo').length,
    'En consulta':        DATA.filter(p => p.estado === 'En consulta').length,
    'Candidatos cirugía': DATA.filter(p => p.estado === 'Candidato a cirugía').length,
    'Postoperatorio':     DATA.filter(p => p.estado === 'Postoperatorio').length,
    'Alta':               DATA.filter(p => p.estado === 'Alta').length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Pacientes</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Gestión completa de pacientes de la clínica</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nuevo Paciente
        </button>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente o diagnóstico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-[15px] h-[15px] text-gray-400" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as Estado | 'Todos')}
            className="h-9 pl-2.5 pr-7 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
          >
            <option value="Todos">Todos los estados</option>
            {(Object.keys(BADGE) as Estado[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-[14px] font-semibold text-gray-900">Lista de pacientes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Paciente', 'Edad', 'Contacto', 'Diagnóstico', 'Médico', 'Estado', 'Próxima cita', ''].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Paciente */}
                  <td className="px-5 py-3.5">
                    <p className="text-[13.5px] font-semibold text-gray-900">{p.nombre}</p>
                    <p className="text-[11px] text-gray-400">ID: {p.id}</p>
                  </td>
                  {/* Edad */}
                  <td className="px-5 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">{p.edad} años</td>
                  {/* Contacto */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />{p.telefono}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-gray-400 mt-0.5">
                      <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />{p.email}
                    </div>
                  </td>
                  {/* Diagnóstico */}
                  <td className="px-5 py-3.5 text-[13px] text-gray-700 max-w-[180px]">
                    <span className="line-clamp-2">{p.diagnostico}</span>
                  </td>
                  {/* Médico */}
                  <td className="px-5 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">{p.medico}</td>
                  {/* Estado */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-[11.5px] font-medium whitespace-nowrap ${BADGE[p.estado]}`}>
                      {p.estado}
                    </span>
                  </td>
                  {/* Próxima cita */}
                  <td className="px-5 py-3.5">
                    {p.proximaCita
                      ? <div className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />{p.proximaCita}
                        </div>
                      : <span className="text-[12px] text-gray-400">Sin cita</span>
                    }
                  </td>
                  {/* Ver */}
                  <td className="px-5 py-3.5">
                    <button className="flex items-center gap-1 text-[12.5px] text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SUMMARY.map(({ label, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[12px] text-gray-400 mb-1">{label}</p>
            <p className={`text-[30px] font-bold leading-none ${color}`}>{counts[label]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
