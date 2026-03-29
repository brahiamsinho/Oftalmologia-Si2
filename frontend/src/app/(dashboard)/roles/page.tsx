'use client';

import { useState } from 'react';
import { Plus, Shield, Users, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface Permiso { id: number; nombre: string; modulo: string; }
interface Rol { id: number; nombre: string; desc: string; activo: boolean; usuarios: number; color: string; permisos: Permiso[]; }

const ROLES: Rol[] = [
  { id:1, nombre:'Administrador',    desc:'Acceso total al sistema.',                             activo:true, usuarios:1, color:'purple',
    permisos:[{id:1,nombre:'Gestionar usuarios',modulo:'Usuarios'},{id:2,nombre:'Gestionar roles',modulo:'Roles'},{id:3,nombre:'Ver bitácora',modulo:'Bitácora'},{id:4,nombre:'Gestionar pacientes',modulo:'Pacientes'},{id:5,nombre:'Ver reportes',modulo:'Dashboard'}] },
  { id:2, nombre:'Médico General',   desc:'Pacientes, citas, diagnósticos y evoluciones.',        activo:true, usuarios:3, color:'blue',
    permisos:[{id:4,nombre:'Gestionar pacientes',modulo:'Pacientes'},{id:6,nombre:'Registrar diagnósticos',modulo:'Diagnósticos'},{id:7,nombre:'Gestionar citas',modulo:'Agenda'},{id:8,nombre:'Ver historial',modulo:'Historial'}] },
  { id:3, nombre:'Jefe de Unidad',   desc:'Permisos médico + reportes y supervisión.',            activo:true, usuarios:1, color:'indigo',
    permisos:[{id:4,nombre:'Gestionar pacientes',modulo:'Pacientes'},{id:5,nombre:'Ver reportes',modulo:'Dashboard'},{id:9,nombre:'Supervisar personal',modulo:'Usuarios'}] },
  { id:4, nombre:'Especialista Córnea',desc:'Estudios de córnea y cirugías refractivas.',         activo:true, usuarios:1, color:'cyan',
    permisos:[{id:4,nombre:'Gestionar pacientes',modulo:'Pacientes'},{id:10,nombre:'Gestionar cirugías',modulo:'Cirugías'},{id:11,nombre:'Gestionar estudios',modulo:'Estudios'}] },
  { id:5, nombre:'Especialista Retina',desc:'Procedimientos de retina y postoperatorio.',         activo:true, usuarios:1, color:'teal',
    permisos:[{id:4,nombre:'Gestionar pacientes',modulo:'Pacientes'},{id:11,nombre:'Gestionar estudios',modulo:'Estudios'},{id:12,nombre:'Gestionar postoperatorio',modulo:'Postoperatorio'}] },
  { id:6, nombre:'Recepcionista',    desc:'Agenda, registro de pacientes y CRM básico.',          activo:true, usuarios:2, color:'yellow',
    permisos:[{id:13,nombre:'Registrar pacientes',modulo:'Pacientes'},{id:7,nombre:'Gestionar citas',modulo:'Agenda'},{id:14,nombre:'Acceso CRM',modulo:'CRM'}] },
];

const COLOR_MAP: Record<string, { icon: string; badge: string }> = {
  purple: { icon:'bg-purple-100 text-purple-600', badge:'bg-purple-50 text-purple-600 border-purple-100' },
  blue:   { icon:'bg-blue-100 text-blue-600',     badge:'bg-blue-50 text-blue-600 border-blue-100'       },
  indigo: { icon:'bg-indigo-100 text-indigo-600', badge:'bg-indigo-50 text-indigo-600 border-indigo-100' },
  cyan:   { icon:'bg-cyan-100 text-cyan-600',     badge:'bg-cyan-50 text-cyan-600 border-cyan-100'       },
  teal:   { icon:'bg-teal-100 text-teal-600',     badge:'bg-teal-50 text-teal-600 border-teal-100'       },
  yellow: { icon:'bg-yellow-100 text-yellow-700', badge:'bg-yellow-50 text-yellow-700 border-yellow-100' },
};

const MOD_COLOR: Record<string, string> = {
  Usuarios:'bg-purple-50 text-purple-600', Roles:'bg-indigo-50 text-indigo-600', Bitácora:'bg-gray-100 text-gray-600',
  Pacientes:'bg-blue-50 text-blue-600', Dashboard:'bg-green-50 text-green-600', Diagnósticos:'bg-orange-50 text-orange-600',
  Agenda:'bg-cyan-50 text-cyan-600', Historial:'bg-teal-50 text-teal-600', Cirugías:'bg-red-50 text-red-600',
  Estudios:'bg-yellow-50 text-yellow-600', Postoperatorio:'bg-emerald-50 text-emerald-600', CRM:'bg-pink-50 text-pink-600',
};

export default function RolesPage() {
  const [expanded, setExpanded] = useState<number|null>(null);
  const [roles, setRoles] = useState(ROLES);
  const toggle = (id:number) => setExpanded(p => p===id ? null : id);
  const toggleActive = (id:number) => setRoles(p=>p.map(r=>r.id===id?{...r,activo:!r.activo}:r));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Roles y Permisos</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Define el nivel de acceso de cada tipo de usuario</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5}/>Nuevo Rol
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total roles',        v: roles.length,                          c:'text-gray-900'  },
          { label:'Roles activos',      v: roles.filter(r=>r.activo).length,      c:'text-green-600' },
          { label:'Usuarios asignados', v: roles.reduce((a,r)=>a+r.usuarios,0),   c:'text-blue-600'  },
        ].map(({label,v,c})=>(
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[12px] text-gray-400 mb-1">{label}</p>
            <p className={`text-[30px] font-bold leading-none ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Roles */}
      <div className="space-y-2.5">
        {roles.map(rol=>{
          const C = COLOR_MAP[rol.color];
          const isOpen = expanded===rol.id;
          return (
            <div key={rol.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 flex items-center gap-3">
                {/* Expand toggle */}
                <button onClick={()=>toggle(rol.id)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500"/> : <ChevronRight className="w-4 h-4 text-gray-500"/>}
                </button>
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${C.icon}`}>
                  <Shield className="w-[17px] h-[17px]" strokeWidth={1.8}/>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-gray-900">{rol.nombre}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${C.badge}`}>{rol.permisos.length} permisos</span>
                    {!rol.activo && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-400">Inactivo</span>}
                  </div>
                  <p className="text-[12.5px] text-gray-400 mt-0.5 truncate">{rol.desc}</p>
                </div>
                {/* Usuarios count */}
                <div className="flex items-center gap-1.5 text-[12.5px] text-gray-500 flex-shrink-0">
                  <Users className="w-3.5 h-3.5 text-gray-400"/>{rol.usuarios} usuario{rol.usuarios!==1?'s':''}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button onClick={()=>toggleActive(rol.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-colors ${rol.activo?'bg-green-50 text-green-700 hover:bg-green-100':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {rol.activo?'Activo':'Inactivo'}
                  </button>
                  <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"><Pencil className="w-3.5 h-3.5"/></button>
                  <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>

              {/* Permissions expandable */}
              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Permisos asignados</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {rol.permisos.map(p=>(
                      <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${MOD_COLOR[p.modulo]??'bg-gray-100 text-gray-600'}`}>{p.modulo}</span>
                        <span className="text-[12.5px] text-gray-700 truncate">{p.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
