'use client';

import { useState } from 'react';
import { Search, LogIn, LogOut, Plus, Edit2, Trash2, Key, AlertTriangle, RefreshCw, Calendar, SlidersHorizontal } from 'lucide-react';

type Accion = 'LOGIN'|'LOGOUT'|'LOGIN_FALLIDO'|'CREAR'|'EDITAR'|'ELIMINAR'|'CAMBIAR_PASSWORD'|'RECUPERAR_PASSWORD'|'REPROGRAMAR'|'CANCELAR'|'CONFIRMAR';

interface Registro { id:number; usuario:string; tipo:string; modulo:string; accion:Accion; desc:string; ip:string; fecha:string; hora:string; }

const DATA: Registro[] = [
  {id:1,  usuario:'admin@clinica.com',      tipo:'ADMIN',         modulo:'Auth',      accion:'LOGIN',             desc:'Inicio de sesión exitoso',                           ip:'192.168.1.10', fecha:'2026-03-29', hora:'09:05:12'},
  {id:2,  usuario:'doctor@clinica.com',     tipo:'MEDICO',        modulo:'Auth',      accion:'LOGIN',             desc:'Inicio de sesión exitoso',                           ip:'192.168.1.21', fecha:'2026-03-29', hora:'08:58:43'},
  {id:3,  usuario:'admin@clinica.com',      tipo:'ADMIN',         modulo:'Pacientes', accion:'CREAR',             desc:'Nuevo paciente: Laura Sánchez (ID: 5)',               ip:'192.168.1.10', fecha:'2026-03-29', hora:'09:12:30'},
  {id:4,  usuario:'doctor@clinica.com',     tipo:'MEDICO',        modulo:'Pacientes', accion:'EDITAR',            desc:'Actualizado estado paciente María González (ID: 1)', ip:'192.168.1.21', fecha:'2026-03-29', hora:'09:21:05'},
  {id:5,  usuario:'sofia.m@clinica.com',    tipo:'ADMIN',         modulo:'Agenda',    accion:'CONFIRMAR',         desc:'Cita confirmada para Juan Pérez (Cita ID: 12)',       ip:'192.168.1.33', fecha:'2026-03-29', hora:'09:35:18'},
  {id:6,  usuario:'desconocido@ext.com',    tipo:'-',             modulo:'Auth',      accion:'LOGIN_FALLIDO',     desc:'Intento fallido de login (3er intento)',              ip:'203.0.113.55', fecha:'2026-03-29', hora:'09:40:02'},
  {id:7,  usuario:'admin@clinica.com',      tipo:'ADMIN',         modulo:'Usuarios',  accion:'CREAR',             desc:'Nuevo usuario creado: Isabel Ruiz (ID: 8)',           ip:'192.168.1.10', fecha:'2026-03-29', hora:'10:02:55'},
  {id:8,  usuario:'admin@clinica.com',      tipo:'ADMIN',         modulo:'Roles',     accion:'EDITAR',            desc:'Rol "Recepcionista" actualizado — nuevos permisos',   ip:'192.168.1.10', fecha:'2026-03-29', hora:'10:15:40'},
  {id:9,  usuario:'jorge.d@clinica.com',    tipo:'MEDICO',        modulo:'Auth',      accion:'CAMBIAR_PASSWORD',  desc:'Cambio de contraseña exitoso',                       ip:'192.168.1.55', fecha:'2026-03-29', hora:'10:30:11'},
  {id:10, usuario:'dra.martinez@clinica.com',tipo:'MEDICO',       modulo:'Agenda',    accion:'CANCELAR',          desc:'Cita cancelada (ID: 8) — motivo: emergencia',        ip:'192.168.1.22', fecha:'2026-03-29', hora:'10:45:27'},
  {id:11, usuario:'lucia.f@clinica.com',    tipo:'ADMIN',         modulo:'Agenda',    accion:'REPROGRAMAR',       desc:'Cita reprogramada para Carlos Mendoza',               ip:'192.168.1.34', fecha:'2026-03-29', hora:'11:00:09'},
  {id:12, usuario:'admin@clinica.com',      tipo:'ADMIN',         modulo:'Pacientes', accion:'ELIMINAR',          desc:'Registro de prueba eliminado (ID: 99)',               ip:'192.168.1.10', fecha:'2026-03-29', hora:'11:10:33'},
  {id:13, usuario:'doctor@clinica.com',     tipo:'MEDICO',        modulo:'Auth',      accion:'LOGOUT',            desc:'Cierre de sesión',                                   ip:'192.168.1.21', fecha:'2026-03-29', hora:'13:00:00'},
  {id:14, usuario:'sofia.m@clinica.com',    tipo:'ADMIN',         modulo:'Auth',      accion:'RECUPERAR_PASSWORD',desc:'Solicitud de recuperación de contraseña enviada',     ip:'192.168.1.33', fecha:'2026-03-29', hora:'13:25:47'},
];

const ACCION: Record<Accion,{label:string; color:string; icon:React.ReactNode}> = {
  LOGIN:             {label:'Login',             color:'bg-green-100 text-green-700',  icon:<LogIn   className="w-3 h-3"/>},
  LOGOUT:            {label:'Logout',            color:'bg-gray-100 text-gray-500',    icon:<LogOut  className="w-3 h-3"/>},
  LOGIN_FALLIDO:     {label:'Login fallido',     color:'bg-red-100 text-red-700',      icon:<AlertTriangle className="w-3 h-3"/>},
  CREAR:             {label:'Crear',             color:'bg-blue-100 text-blue-700',    icon:<Plus    className="w-3 h-3"/>},
  EDITAR:            {label:'Editar',            color:'bg-yellow-100 text-yellow-700',icon:<Edit2   className="w-3 h-3"/>},
  ELIMINAR:          {label:'Eliminar',          color:'bg-red-100 text-red-700',      icon:<Trash2  className="w-3 h-3"/>},
  CAMBIAR_PASSWORD:  {label:'Cambiar contraseña',color:'bg-purple-100 text-purple-700',icon:<Key     className="w-3 h-3"/>},
  RECUPERAR_PASSWORD:{label:'Recuperar contraseña',color:'bg-orange-100 text-orange-700',icon:<Key  className="w-3 h-3"/>},
  REPROGRAMAR:       {label:'Reprogramar',       color:'bg-indigo-100 text-indigo-700',icon:<RefreshCw className="w-3 h-3"/>},
  CANCELAR:          {label:'Cancelar',          color:'bg-red-100 text-red-700',      icon:<AlertTriangle className="w-3 h-3"/>},
  CONFIRMAR:         {label:'Confirmar',         color:'bg-green-100 text-green-700',  icon:<Calendar className="w-3 h-3"/>},
};

const MODULOS = ['Todos','Auth','Pacientes','Usuarios','Roles','Agenda'];

export default function BitacoraPage() {
  const [search, setSearch] = useState('');
  const [modulo, setModulo] = useState('Todos');
  const [accion, setAccion] = useState<Accion|'Todas'>('Todas');

  const rows = DATA.filter(r=>{
    const q=search.toLowerCase();
    return (
      (modulo==='Todos'||r.modulo===modulo) &&
      (accion==='Todas'||r.accion===accion) &&
      (r.usuario.toLowerCase().includes(q)||r.desc.toLowerCase().includes(q))
    );
  });

  const counts = {
    total:  DATA.length,
    logins: DATA.filter(r=>r.accion==='LOGIN').length,
    errores:DATA.filter(r=>r.accion==='LOGIN_FALLIDO').length,
    cambios:DATA.filter(r=>['CREAR','EDITAR','ELIMINAR'].includes(r.accion)).length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Bitácora del Sistema</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Registro de auditoría de todas las acciones</p>
        </div>
        <button className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm">
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {label:'Eventos hoy',    v:counts.total,   c:'text-gray-900'  },
          {label:'Logins exitosos',v:counts.logins,  c:'text-green-600' },
          {label:'Errores acceso', v:counts.errores, c:'text-red-600'   },
          {label:'Cambios de data',v:counts.cambios, c:'text-blue-600'  },
        ].map(({label,v,c})=>(
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[12px] text-gray-400 mb-1">{label}</p>
            <p className={`text-[30px] font-bold leading-none ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400"/>
          <input type="text" placeholder="Buscar por usuario o descripción..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"/>
        </div>
        <SlidersHorizontal className="w-[15px] h-[15px] text-gray-400 flex-shrink-0"/>
        <select value={modulo} onChange={e=>setModulo(e.target.value)}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
          {MODULOS.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <select value={accion} onChange={e=>setAccion(e.target.value as Accion|'Todas')}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
          <option value="Todas">Todas las acciones</option>
          {(Object.entries(ACCION) as [Accion,{label:string}][]).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-gray-900">Registro de eventos</p>
          <span className="text-[12px] text-gray-400">{rows.length} evento{rows.length!==1?'s':''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['#','Hora','Usuario','Módulo','Acción','Descripción','IP'].map(h=>(
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r=>{
                const A=ACCION[r.accion];
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 text-[11px] font-mono text-gray-300">{r.id}</td>
                    <td className="px-5 py-3">
                      <p className="text-[12.5px] font-semibold text-gray-900 font-mono">{r.hora}</p>
                      <p className="text-[11px] text-gray-400">{r.fecha}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[12.5px] text-gray-700">{r.usuario}</p>
                      <p className="text-[11px] text-gray-400">{r.tipo}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11.5px] font-medium">{r.modulo}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11.5px] font-medium ${A.color}`}>
                        {A.icon}{A.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-gray-600 max-w-[260px]">
                      <span className="line-clamp-1">{r.desc}</span>
                    </td>
                    <td className="px-5 py-3 text-[11.5px] font-mono text-gray-400 whitespace-nowrap">{r.ip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
