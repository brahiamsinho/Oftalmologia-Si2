'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, ChevronDown, User, LogOut, Menu, CheckCheck, ExternalLink, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { usePathname } from 'next/navigation';
import { notificacionesService, type Notificacion } from '@/lib/services/notificaciones';

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
  '/backups':        'Backups',
  '/perfil':              'Mi perfil',
  '/planes':                    'Planes y Suscripción',
  '/configuracion-org':         'Configuración de la Organización',
  '/evaluaciones-quirurgicas':  'Evaluaciones Quirúrgicas',
  '/preoperatorio':             'Preoperatorio',
  '/cirugias':                  'Cirugías',
  '/postoperatorio':            'Postoperatorio',
  '/crm/contactos':             'CRM · Comunicaciones',
  '/crm/campanas':              'CRM · Campañas',
  '/crm/segmentaciones':        'CRM · Segmentaciones',
  '/crm/recordatorios':         'CRM · Recordatorios',
  '/crm':                       'CRM',
  '/notificaciones':            'Notificaciones',
  '/reportes':                  'Reportes',
  '/InteligenciaArtificial':    'Inteligencia Artificial · Asistente Virtual',
};

// ── Panel de notificaciones ────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} d`;
}

type NotifPanelProps = {
  items: Notificacion[];
  noLeidas: number;
  loading: boolean;
  marking: boolean;
  onClose: () => void;
  onMarkAll: () => void;
  onMarkOne: (n: Notificacion) => void;
};

function NotifPanel({ items, noLeidas, loading, marking, onClose, onMarkAll, onMarkOne }: NotifPanelProps) {

  return (
    <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <span className="text-[14px] font-bold text-gray-900">Notificaciones</span>
          {noLeidas > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
              {noLeidas}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {noLeidas > 0 && (
            <button
              onClick={() => void onMarkAll()}
              disabled={marking}
              title="Marcar todas como leídas"
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Leídas
            </button>
          )}
          <Link
            href="/notificaciones"
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Ver todo
          </Link>
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-[360px] overflow-y-auto">
        {loading && (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Inbox className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-medium text-gray-500">Sin notificaciones</p>
            <p className="text-[11px] text-gray-400">Los recordatorios y alertas aparecerán aquí.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <ul className="divide-y divide-gray-50">
            {items.map(n => (
              <li key={n.id}>
                <button
                  onClick={() => void onMarkOne(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 group
                    ${!n.leida ? 'bg-blue-50/40' : ''}`}
                >
                  {/* Punto de no leída */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full mt-1 ${!n.leida ? 'bg-blue-500' : 'bg-transparent'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug ${!n.leida ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.titulo}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{n.cuerpo}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelative(n.creada_en)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <Link
          href="/crm/recordatorios"
          onClick={onClose}
          className="flex items-center gap-2 text-[12px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          Gestionar reglas de recordatorio →
        </Link>
      </div>
    </div>
  );
}

// ── Header principal ───────────────────────────────────────────────────────

export default function Header() {
  const { user, logout } = useAuth();
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const [dropOpen, setDropOpen]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas]   = useState(0);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifMarking, setNotifMarking] = useState(false);
  const dropRef   = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);
  const notifMountedRef = useRef(false);
  const notifRefreshInFlightRef = useRef(false);

  const nombre   = user?.nombres   ?? '';
  const apellido = user?.apellidos ?? '';
  const fullName = `${nombre} ${apellido}`.trim() || 'Usuario';
  const role     = user?.tipo_usuario?.toLowerCase().replace(/_/g, ' ') ?? '';
  const init     = initials(nombre, apellido);

  const refreshNotifications = useCallback(async (opts?: { silent?: boolean }) => {
    if (notifRefreshInFlightRef.current) return;
    notifRefreshInFlightRef.current = true;

    const silent = opts?.silent ?? false;
    if (!silent) {
      setNotifLoading(true);
    }

    try {
      const res = await notificacionesService.list();
      if (!notifMountedRef.current) return;
      setNotifItems(res.results ?? []);
      setNoLeidas(res.no_leidas ?? 0);
    } catch {
      // silencioso: el header no debe interrumpir la navegación
    } finally {
      if (notifMountedRef.current && !silent) {
        setNotifLoading(false);
      }
      notifRefreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    notifMountedRef.current = true;
    void refreshNotifications();

    const intervalId = window.setInterval(() => {
      void refreshNotifications({ silent: true });
    }, 20_000);

    return () => {
      notifMountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [refreshNotifications]);

  // Cerrar dropdowns al hacer clic afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Breadcrumb: encontrar la ruta más larga que coincida
  const crumb = Object.entries(BREADCRUMB)
    .filter(([k]) => pathname.startsWith(k))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Inicio';

  const marcarTodas = useCallback(async () => {
    if (notifMarking || noLeidas === 0) return;
    setNotifMarking(true);
    notifRefreshInFlightRef.current = true;
    try {
      await notificacionesService.marcarTodasLeidas();
      setNotifItems((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } finally {
      notifRefreshInFlightRef.current = false;
      setNotifMarking(false);
    }
  }, [notifMarking, noLeidas]);

  const marcarUna = useCallback(async (n: Notificacion) => {
    if (n.leida) return;
    notifRefreshInFlightRef.current = true;
    try {
      await notificacionesService.marcarLeida(n.id);
      setNotifItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {
      // silencioso
    } finally {
      notifRefreshInFlightRef.current = false;
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-4">

      {/* ── Izquierda: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
          <Menu className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
        <span className="text-[14px] font-semibold text-gray-700 truncate">{crumb}</span>
      </div>

      {/* ── Derecha: campana + usuario ── */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Campana con panel de notificaciones */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(v => !v); setDropOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            title="Notificaciones"
          >
            <Bell className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.8} />
            {noLeidas > 0 && (
              <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-blue-600 text-white
                               text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotifPanel
              items={notifItems}
              noLeidas={noLeidas}
              loading={notifLoading}
              marking={notifMarking}
              onClose={() => setNotifOpen(false)}
              onMarkAll={() => void marcarTodas()}
              onMarkOne={(n) => void marcarUna(n)}
            />
          )}
        </div>

        {/* Dropdown usuario */}
        <div ref={dropRef} className="relative ml-1">
          <button
            onClick={() => { setDropOpen(v => !v); setNotifOpen(false); }}
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
