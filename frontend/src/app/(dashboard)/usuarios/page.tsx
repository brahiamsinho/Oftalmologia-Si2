'use client';

import { useState } from 'react';
import { Search, Plus, MoreHorizontal, Shield, CheckCircle, XCircle, Lock, Mail, Phone, SlidersHorizontal } from 'lucide-react';

type Tipo  = 'ADMIN' | 'MEDICO' | 'ESPECIALISTA' | 'ADMINISTRATIVO' | 'PACIENTE';
type Estado = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

interface Usuario { id: number; nombres: string; apellidos: string; email: string; telefono: string; tipo: Tipo; estado: Estado; roles: string[]; acceso: string; }

const DATA: Usuario[] = [
  { id: 1, nombres: 'Carlos',  apellidos: 'López Hernández',  email: 'admin@clinica.com',       telefono: '+34 611 000 001', tipo: 'ADMIN',          estado: 'ACTIVO',    roles: ['Administrador'],             acceso: 'Hace 5 min'   },
  { id: 2, nombres: 'María',   apellidos: 'Ramírez Torres',   email: 'doctor@clinica.com',      telefono: '+34 611 000 002', tipo: 'MEDICO',         estado: 'ACTIVO',    roles: ['Médico General'],            acceso: 'Hace 2 h'    },
  { id: 3, nombres: 'Ana',     apellidos: 'Martínez Ruiz',    email: 'dra.martinez@clinica.com',telefono: '+34 611 000 003', tipo: 'MEDICO',         estado: 'ACTIVO',    roles: ['Médico General','Jefe Unidad'], acceso: 'Ayer'       },
  { id: 4, nombres: 'Pedro',   apellidos: 'García Vega',      email: 'pedro.garcia@clinica.com',telefono: '+34 611 000 004', tipo: 'ESPECIALISTA',   estado: 'ACTIVO',    roles: ['Especialista Córnea'],       acceso: 'Hace 3 días'  },
  { id: 5, nombres: 'Lucía',   apellidos: 'Fernández Gil',    email: 'lucia.f@clinica.com',     telefono: '+34 611 000 005', tipo: 'ADMINISTRATIVO', estado: 'ACTIVO',    roles: ['Recepcionista'],             acceso: 'Hace 1 h'    },
  { id: 6, nombres: 'Sofía',   apellidos: 'Moreno Castro',    email: 'sofia.m@clinica.com',     telefono: '+34 611 000 006', tipo: 'ADMINISTRATIVO', estado: 'INACTIVO',  roles: ['Recepcionista'],             acceso: 'Hace 30 días' },
  { id: 7, nombres: 'Jorge',   apellidos: 'Díaz Prieto',      email: 'jorge.d@clinica.com',     telefono: '+34 611 000 007', tipo: 'MEDICO',         estado: 'BLOQUEADO', roles: ['Médico General'],            acceso: 'Hace 60 días' },
  { id: 8, nombres: 'Isabel',  apellidos: 'Ruiz Navarro',     email: 'isabel.r@clinica.com',    telefono: '+34 611 000 008', tipo: 'ESPECIALISTA',   estado: 'ACTIVO',    roles: ['Especialista Retina'],       acceso: 'Hoy'          },
];

const TIPO_BADGE: Record<Tipo, string> = {
  ADMIN:          'bg-purple-100 text-purple-700',
  MEDICO:         'bg-blue-100 text-blue-700',
  ESPECIALISTA:   'bg-indigo-100 text-indigo-700',
  ADMINISTRATIVO: 'bg-yellow-100 text-yellow-700',
  PACIENTE:       'bg-gray-100 text-gray-500',
};
const TIPO_LABEL: Record<Tipo, string> = {
  ADMIN: 'Administrador', MEDICO: 'Médico', ESPECIALISTA: 'Especialista',
  ADMINISTRATIVO: 'Administrativo', PACIENTE: 'Paciente',
};
const ESTADO_CFG: Record<Estado, { icon: React.ReactNode; badge: string; label: string }> = {
  ACTIVO:    { icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" />, badge: 'bg-green-100 text-green-700', label: 'Activo'    },
  INACTIVO:  { icon: <XCircle     className="w-3.5 h-3.5 text-gray-400"  />, badge: 'bg-gray-100 text-gray-500',  label: 'Inactivo'  },
  BLOQUEADO: { icon: <Lock        className="w-3.5 h-3.5 text-red-500"   />, badge: 'bg-red-100 text-red-700',    label: 'Bloqueado' },
};

export default function UsuariosPage() {
  const [search,  setSearch]  = useState('');
  const [tipo,    setTipo]    = useState<Tipo | 'Todos'>('Todos');
  const [estado,  setEstado]  = useState<Estado | 'Todos'>('Todos');

  const rows = DATA.filter(u => {
    const q = search.toLowerCase();
    return (
      (tipo   === 'Todos' || u.tipo   === tipo)   &&
      (estado === 'Todos' || u.estado === estado) &&
      (`${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(q))
    );
  });

  const counts = { total: DATA.length, activos: DATA.filter(u=>u.estado==='ACTIVO').length, inactivos: DATA.filter(u=>u.estado==='INACTIVO').length, bloqueados: DATA.filter(u=>u.estado==='BLOQUEADO').length };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Usuarios</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Gestión de cuentas y accesos del sistema</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total',      value: counts.total,      color: 'text-gray-900'  },
          { label: 'Activos',    value: counts.activos,    color: 'text-green-600' },
          { label: 'Inactivos',  value: counts.inactivos,  color: 'text-gray-500'  },
          { label: 'Bloqueados', value: counts.bloqueados, color: 'text-red-600'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[12px] text-gray-400 mb-1">{label}</p>
            <p className={`text-[30px] font-bold leading-none ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>
        <SlidersHorizontal className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" />
        <select value={tipo} onChange={e=>setTipo(e.target.value as Tipo|'Todos')}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
          <option value="Todos">Todos los tipos</option>
          {(Object.keys(TIPO_LABEL) as Tipo[]).map(k=><option key={k} value={k}>{TIPO_LABEL[k]}</option>)}
        </select>
        <select value={estado} onChange={e=>setEstado(e.target.value as Estado|'Todos')}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
          <option value="Todos">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="BLOQUEADO">Bloqueado</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-gray-900">Lista de usuarios</p>
          <span className="text-[12px] text-gray-400">{rows.length} resultado{rows.length!==1?'s':''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Usuario','Contacto','Tipo','Roles','Estado','Último acceso',''].map(h=>(
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(u=>(
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-blue-700">{u.nombres[0]}{u.apellidos[0]}</span>
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-gray-900">{u.nombres} {u.apellidos}</p>
                        <p className="text-[11px] text-gray-400">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600"><Mail className="w-3 h-3 text-gray-400 flex-shrink-0"/>{u.email}</div>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-0.5"><Phone className="w-3 h-3 text-gray-400 flex-shrink-0"/>{u.telefono}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-[11.5px] font-medium ${TIPO_BADGE[u.tipo]}`}>{TIPO_LABEL[u.tipo]}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(r=>(
                        <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11.5px]">
                          <Shield className="w-2.5 h-2.5"/>{r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {ESTADO_CFG[u.estado].icon}
                      <span className={`px-2.5 py-[3px] rounded-full text-[11.5px] font-medium ${ESTADO_CFG[u.estado].badge}`}>{ESTADO_CFG[u.estado].label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">{u.acceso}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="text-[12.5px] text-blue-600 hover:text-blue-700 font-medium transition-colors">Editar</button>
                      <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4 text-gray-400"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
