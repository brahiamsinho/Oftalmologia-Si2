'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { usePathname } from 'next/navigation';

function initials(nombres: string, apellidos: string) {
  return ((nombres?.[0] ?? '') + (apellidos?.[0] ?? '')).toUpperCase() || '?';
}

// Mapa de rutas → etiqueta de breadcrumb
const BREADCRUMB: Record<string, string> = {
  '/dashboard':      'Dashboard',
  '/pacientes':      'Pacientes',
  '/historial':      'Historial Clínico',
  '/registrar-consulta': 'Registrar Consulta',
  '/consultas':      'Consultas',
  '/mediciones':     'Mediciones',
  '/registrar-medicion': 'Registrar Medición',
  '/citas-agenda':   'Citas y Agenda',
  '/usuarios':       'Usuarios',
  '/roles':          'Roles',
  '/permisos':       'Permisos',
  '/bitacora':       'Bitácora',
  '/perfil':              'Mi perfil',
  '/planes':                    'Planes y Suscripción',
  '/configuracion-org':         'Configuración de la Organización',
  '/evaluaciones-quirurgicas':  'Evaluaciones Quirúrgicas',
  '/preoperatorio':             'Preoperatorio',
  '/cirugias':                  'Cirugías',
  '/postoperatorio':            'Postoperatorio',
  '/crm/contactos':             'CRM · Comunicaciones',
  '/crm/campanas':              'CRM · Campañas',
  '/crm':                       'CRM',
};

export default function Header() {
  const { user, logout } = useAuth();
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const nombre   = user?.nombres   ?? '';
  const apellido = user?.apellidos ?? '';
  const fullName = `${nombre} ${apellido}`.trim() || 'Usuario';
  const role     = user?.tipo_usuario?.toLowerCase().replace(/_/g, ' ') ?? '';
  const init     = initials(nombre, apellido);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Breadcrumb: encontrar la ruta más larga que coincida
  const crumb = Object.entries(BREADCRUMB)
    .filter(([k]) => pathname.startsWith(k))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Inicio';

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-4">

      {/* ── Izquierda: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
          <Menu className="w-4.5 h-4.5 w-[18px] h-[18px]" strokeWidth={2} />
        </button>
        <span className="text-[14px] font-semibold text-gray-700 truncate">{crumb}</span>
      </div>

      {/* ── Derecha: campana + usuario ── */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Campana */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-blue-600 text-white
                           text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            3
          </span>
        </button>

        {/* Dropdown usuario */}
        <div ref={dropRef} className="relative ml-1">
          <button
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-50
                       border border-transparent hover:border-gray-200 transition-all"
          >
            <div className="w-[30px] h-[30px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-blue-700">{init}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[12.5px] font-semibold text-gray-900 leading-tight whitespace-nowrap">{fullName}</p>
              <p className="text-[11px] text-gray-400 leading-tight capitalize">{role}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {dropOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-white rounded-xl
                            border border-gray-200 shadow-lg py-1.5 z-50">
              {/* Info */}
              <div className="px-3.5 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-[12.5px] font-semibold text-gray-900 truncate">{fullName}</p>
                <p className="text-[11px] text-gray-400 truncate capitalize">{role}</p>
              </div>

              <Link href="/perfil" onClick={() => setDropOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-600
                           hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Mi perfil
              </Link>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => { setDropOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500
                             hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
