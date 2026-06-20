"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  Users,
  ShieldCheck,
  ScrollText,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Stethoscope,
  Eye,
  Calendar,
  List,
  Scissors,
  Slice,
  HeartPulse,
  Megaphone,
  Bell,
  BarChart2,
  Settings,
  MessageSquare,
  Tags,
  DatabaseBackup,
  Bot,
  Receipt,
  Landmark,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useTenant } from "@/context/TenantContext";
import { TenantStorage } from "@/lib/api";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// ── Catálogo de navegación (para búsqueda) ─────────────────────────────────────

type NavEntry = {
  label: string;
  href: string;
  icon: React.ElementType;
  group?: string;
  keywords?: string; // CU número, sinónimos, etc.
};

const NAV_CATALOG: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "inicio panel principal" },
  // Pacientes
  { label: "Pacientes", href: "/pacientes", icon: Users, group: "Pacientes", keywords: "CU01 listado gestión" },
  { label: "Historial Clínico", href: "/historial", icon: ClipboardList, group: "Pacientes", keywords: "CU03 historia médica expediente" },
  // Atención Clínica
  { label: "Registrar Consulta", href: "/registrar-consulta", icon: Stethoscope, group: "Atención Clínica", keywords: "CU05 nueva consulta atención" },
  { label: "Consultas", href: "/consultas", icon: List, group: "Atención Clínica", keywords: "CU06 listado visitas" },
  { label: "Mediciones", href: "/mediciones", icon: Activity, group: "Atención Clínica", keywords: "CU07 agudeza visual refracción" },
  { label: "Registrar Medición", href: "/registrar-medicion", icon: Eye, group: "Atención Clínica", keywords: "CU07 nueva medición visual" },
  { label: "Citas y Agenda", href: "/citas-agenda", icon: Calendar, group: "Atención Clínica", keywords: "CU04 agendar cita horario" },
  { label: "Eval. Quirúrgica", href: "/evaluaciones-quirurgicas", icon: Scissors, group: "Atención Clínica", keywords: "CU08 evaluación quirúrgica cirugía pre" },
  { label: "Preoperatorio", href: "/preoperatorio", icon: ClipboardList, group: "Atención Clínica", keywords: "CU09 pre operatorio preparación" },
  { label: "Cirugías", href: "/cirugias", icon: Slice, group: "Atención Clínica", keywords: "CU10 intervención quirúrgica operación" },
  { label: "Postoperatorio", href: "/postoperatorio", icon: HeartPulse, group: "Atención Clínica", keywords: "CU11 recuperación seguimiento post" },
  // CRM
  { label: "Segmentaciones", href: "/crm/segmentaciones", icon: Tags, group: "CRM", keywords: "CU12 grupos segmentos pacientes" },
  { label: "Campañas CRM", href: "/crm/campanas", icon: Megaphone, group: "CRM", keywords: "CU13 campaña comunicación marketing" },
  { label: "Comunicaciones", href: "/crm/contactos", icon: MessageSquare, group: "CRM", keywords: "CU14 mensajes contacto" },
  { label: "Recordatorios", href: "/crm/recordatorios", icon: Bell, group: "CRM", keywords: "CU18 recordatorio notificación automática push programado regla" },
  // Admin Financiera
  { label: "Seguros", href: "/administracionFinanciera/seguros", icon: ShieldCheck, group: "Admin. Financiera", keywords: "CU19 convenio aseguradora cobertura póliza" },
  { label: "Campañas & Descuentos", href: "/administracionFinanciera/descuentos", icon: Tags, group: "Admin. Financiera", keywords: "CU20 descuento promoción beneficio campaña" },
  { label: "Facturación", href: "/administracionFinanciera/facturacion", icon: Receipt, group: "Admin. Financiera", keywords: "CU21 factura cobro pago pasarela comprobante" },
  // Reportes
  { label: "Reportes", href: "/reportes", icon: BarChart2, keywords: "CU22 informe estadística exportar excel pdf" },
  // IA
  { label: "Asistente Virtual", href: "/InteligenciaArtificial", icon: Bot, group: "Inteligencia Artificial", keywords: "CU23 IA chatbot consulta lenguaje natural paciente" },
  // Notificaciones
  { label: "Notificaciones", href: "/notificaciones", icon: Bell, keywords: "CU18 recordatorio alerta aviso automático" },
  // Admin
  { label: "Usuarios", href: "/usuarios", icon: Users, group: "Usuarios", keywords: "gestión cuentas staff" },
  { label: "Roles", href: "/roles", icon: ShieldCheck, group: "Usuarios", keywords: "permisos rol acceso" },
  { label: "Permisos", href: "/permisos", icon: KeyRound, group: "Usuarios", keywords: "acceso restricción autorización" },
  { label: "Bitácora", href: "/bitacora", icon: ScrollText, keywords: "auditoría log historial acciones" },
  { label: "Backups", href: "/backups", icon: DatabaseBackup, keywords: "respaldo copia seguridad restaurar" },
  { label: "Mi Perfil", href: "/perfil", icon: Users, group: "Cuenta", keywords: "usuario datos personales contraseña" },
  { label: "Organización", href: "/configuracion-org", icon: Settings, group: "Cuenta", keywords: "clínica configuración branding logo" },
  { label: "Planes", href: "/planes", icon: BarChart2, group: "Cuenta", keywords: "suscripción plan upgrade precio" },
];

// ── Buscador del sidebar ────────────────────────────────────────────────────────

function SidebarSearch({
  onClose,
}: {
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const results = q.length < 1
    ? []
    : NAV_CATALOG.filter((item) => {
        const haystack = `${item.label} ${item.group ?? ""} ${item.keywords ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });

  return (
    <div className="px-2 pt-2 pb-1">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar módulo o CU…"
          className="w-full pl-8 pr-8 py-1.5 text-[12px] border border-gray-200 rounded-lg
                     bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200
                     outline-none transition-all placeholder-gray-400 text-gray-700"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Resultados */}
      {q.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 max-h-[320px] overflow-y-auto">
          {results.length === 0 ? (
            <li className="text-center py-4 text-[11px] text-gray-400">
              Sin resultados para &quot;{query}&quot;
            </li>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-all group
                      ${active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    <Icon
                      className={`w-[13px] h-[13px] flex-shrink-0
                        ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block leading-tight">{item.label}</span>
                      {item.group && (
                        <span className="text-[10px] text-gray-400 leading-tight">{item.group}</span>
                      )}
                    </div>
                    {/* Keyword badge si hay CU en la búsqueda */}
                    {q.startsWith("cu") && item.keywords?.toLowerCase().includes(q.split(" ")[0]) && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 uppercase tracking-wide flex-shrink-0">
                        {item.keywords.toLowerCase().split(" ").find(k => k.startsWith("cu"))?.toUpperCase()}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

// ── NavItem simple ─────────────────────────────────────────────────────────────
function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  depth = 0,
  onNavigate,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  depth?: number;
  onNavigate?: () => void;
  badge?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        title={label}
        onClick={onNavigate}
        className={`group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150
          ${
            collapsed
              ? "px-[13px] py-[9px] justify-center"
              : depth > 0
                ? "pl-8 pr-3 py-2"
                : "px-3 py-[9px]"
          }
          ${
            active
              ? "bg-blue-50 text-blue-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          }`}
      >
        <Icon
          className={`flex-shrink-0 transition-colors
            ${collapsed ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]"}
            ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
          strokeWidth={active ? 2.2 : 1.8}
        />
        {!collapsed && <span className="truncate flex-1">{label}</span>}
        {!collapsed && badge && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ── NavGroup (sección desplegable) ─────────────────────────────────────────────
function NavGroup({
  label,
  icon: Icon,
  active,
  collapsed,
  defaultOpen = false,
  children,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || active);

  if (collapsed) {
    return (
      <li>
        <button
          title={label}
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-center px-[13px] py-[9px] rounded-lg transition-all duration-150
            ${active ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
        >
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] font-medium transition-all duration-150
          ${active ? "text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
      >
        <Icon
          className={`w-[15px] h-[15px] flex-shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`}
          strokeWidth={active ? 2.2 : 1.8}
        />
        <span className="truncate flex-1 text-left">{label}</span>
        {open ? (
          <ChevronUp className="w-3 h-3 flex-shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <ul className="mt-0.5 ml-[10px] space-y-0.5 border-l-2 border-gray-100 pl-2">
          {children}
        </ul>
      )}
    </li>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { isCollapsed, isMobileDrawerOpen, toggle, closeMobileDrawer } =
    useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)", false);
  const { orgData, flags, loading: tenantLoading } = useTenant();

  const is = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const widthPx = isDesktop ? (isCollapsed ? 64 : 244) : 244;
  const offCanvas = !isDesktop && !isMobileDrawerOpen;

  // ── Datos de branding del tenant ──
  // Primero intenta datos frescos del contexto, luego cae al localStorage
  const cached = TenantStorage.getTenantData();
  const branding = orgData?.branding ?? cached?.branding;
  const clinicNombre = orgData?.nombre ?? cached?.nombre ?? "OftalmoCRM";
  const clinicSub =
    branding?.nombre !== clinicNombre
      ? (branding?.nombre ?? "Clínica Oftalmológica")
      : "Clínica Oftalmológica";
  const logoUrl = branding?.logo_url ?? null;
  const colorPrimario = branding?.color_primario ?? "#2563eb";

  // Notificaciones siguen ligadas al plan/flags; CRM y Reportes siempre en el menú (rutas ya existen).
  const showNotif = !tenantLoading && flags.mostrar_notificaciones;

  // ── Estado del plan para badge ──
  const subEstado = orgData?.subscription?.estado;
  const isTrial = subEstado === "TRIAL";

  return (
    <aside
      style={{ width: widthPx }}
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200
                 flex flex-col z-[45] select-none overflow-hidden
                 transition-[transform,width] duration-300 ease-out
                 ${offCanvas ? "-translate-x-full" : "translate-x-0"}`}
    >
      {/* ── Logo + toggle ── */}
      <div
        className={`flex items-center h-[60px] border-b border-gray-100 flex-shrink-0 px-3
        ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {/* Logo real del tenant o icono genérico */}
            {logoUrl ? (
              <div className="w-[32px] h-[32px] rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                <Image
                  src={logoUrl}
                  alt={clinicNombre}
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ backgroundColor: colorPrimario }}
              >
                <Activity
                  className="w-[17px] h-[17px] text-white"
                  strokeWidth={2.5}
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                {clinicNombre}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-[9.5px] text-gray-400 leading-tight truncate">
                  {clinicSub}
                </p>
                {isTrial && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">
                    Trial
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón colapsar/expandir */}
        <button
          onClick={toggle}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400
                     hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Buscador ── */}
      {isCollapsed ? (
        <div className="flex justify-center py-2 px-2 border-b border-gray-100">
          <button
            onClick={toggle}
            title="Buscar módulo"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                       hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-b border-gray-100">
          <SidebarSearch onClose={closeMobileDrawer} />
        </div>
      )}

      {/* ── Navegación ── */}
      <nav className="flex-1 px-2 pt-3 pb-2 overflow-y-auto overflow-x-hidden">
        {/* General */}
        <ul className="space-y-0.5">
          <NavItem
            href="/dashboard"
            label="Dashboard"
            icon={LayoutDashboard}
            active={is("/dashboard")}
            collapsed={isCollapsed}
            onNavigate={closeMobileDrawer}
          />
        </ul>

        {/* Pacientes */}
        <ul className="space-y-0.5 mt-1">
          <NavGroup
            label="Pacientes"
            icon={Users}
            active={is("/pacientes") || is("/historial")}
            collapsed={isCollapsed}
            defaultOpen
          >
            <NavItem
              href="/pacientes"
              label="Pacientes"
              icon={Users}
              active={is("/pacientes")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/historial"
              label="Historial Clínico"
              icon={ClipboardList}
              active={is("/historial")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
          </NavGroup>
        </ul>

        {/* Atención Clínica */}
        <ul className="space-y-0.5 mt-1">
          <NavGroup
            label="Atención Clínica"
            icon={Stethoscope}
            active={
              is("/registrar-consulta") ||
              is("/registrar-medicion") ||
              is("/mediciones") ||
              is("/citas-agenda") ||
              is("/consultas") ||
              is("/evaluaciones-quirurgicas") ||
              is("/preoperatorio") ||
              is("/cirugias") ||
              is("/postoperatorio")
            }
            collapsed={isCollapsed}
            defaultOpen={
              is("/registrar-consulta") ||
              is("/registrar-medicion") ||
              is("/mediciones") ||
              is("/citas-agenda") ||
              is("/consultas") ||
              is("/evaluaciones-quirurgicas") ||
              is("/preoperatorio") ||
              is("/cirugias") ||
              is("/postoperatorio")
            }
          >
            <NavItem
              href="/registrar-consulta"
              label="Registrar Consulta"
              icon={Stethoscope}
              active={is("/registrar-consulta")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/consultas"
              label="Consultas"
              icon={List}
              active={is("/consultas")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/mediciones"
              label="Mediciones"
              icon={Activity}
              active={is("/mediciones")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/registrar-medicion"
              label="Registrar Medición"
              icon={Eye}
              active={is("/registrar-medicion")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/citas-agenda"
              label="Citas y Agenda"
              icon={Calendar}
              active={is("/citas-agenda")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/evaluaciones-quirurgicas"
              label="Eval. Quirúrgica"
              icon={Scissors}
              active={is("/evaluaciones-quirurgicas")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/preoperatorio"
              label="Preoperatorio"
              icon={ClipboardList}
              active={is("/preoperatorio")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/cirugias"
              label="Cirugías"
              icon={Slice}
              active={is("/cirugias")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/postoperatorio"
              label="Postoperatorio"
              icon={HeartPulse}
              active={is("/postoperatorio")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
          </NavGroup>
        </ul>

        {/* CRM — comunicación con pacientes; visible siempre; permisos en API */}
        <ul className="space-y-0.5 mt-1">
          <NavGroup
            label="CRM"
            icon={Megaphone}
            active={is("/crm")}
            collapsed={isCollapsed}
            defaultOpen={is("/crm") || is("/crm/recordatorios")}
          >
            <NavItem
              href="/crm/segmentaciones"
              label="Segmentaciones"
              icon={Tags}
              active={is("/crm/segmentaciones")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/crm/campanas"
              label="Campañas"
              icon={Megaphone}
              active={is("/crm/campanas")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/crm/contactos"
              label="Comunicaciones"
              icon={MessageSquare}
              active={is("/crm/contactos")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/crm/recordatorios"
              label="Recordatorios"
              icon={Bell}
              active={is("/crm/recordatorios")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
          </NavGroup>
        </ul>

        {/* Notificaciones — solo si el plan + settings lo permiten */}
        {showNotif && (
          <ul className="space-y-0.5 mt-1">
            <NavItem
              href="/notificaciones"
              label="Notificaciones"
              icon={Bell}
              active={is("/notificaciones")}
              collapsed={isCollapsed}
              onNavigate={closeMobileDrawer}
            />
          </ul>
        )}

        {/* Administración Financiera */}
        <ul className="space-y-0.5 mt-1">
          <NavGroup
            label="Admin. Financiera"
            icon={Landmark}
            active={is("/administracionFinanciera")}
            collapsed={isCollapsed}
            defaultOpen={is("/administracionFinanciera")}
          >
            <NavItem
              href="/administracionFinanciera/seguros"
              label="Seguros"
              icon={ShieldCheck}
              active={is("/administracionFinanciera/seguros")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/administracionFinanciera/descuentos"
              label="Campañas & Descuentos"
              icon={Tags}
              active={is("/administracionFinanciera/descuentos")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/administracionFinanciera/facturacion"
              label="Facturación"
              icon={Receipt}
              active={is("/administracionFinanciera/facturacion")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
          </NavGroup>
        </ul>

        {/* Reportes — visible siempre; export/plan según backend */}
        <ul className="space-y-0.5 mt-1">
          <NavItem
            href="/reportes"
            label="Reportes"
            icon={BarChart2}
            active={is("/reportes")}
            collapsed={isCollapsed}
            onNavigate={closeMobileDrawer}
          />
        </ul>

        {/* IA */}
        <ul className="space-y-0.5 mt-1">
          <NavGroup
            label="Inteligencia Artificial"
            icon={Bot}
            active={is("/asistente-virtual") || is("/InteligenciaArtificial")}
            collapsed={isCollapsed}
            defaultOpen={is("/asistente-virtual") || is("/InteligenciaArtificial")}
          >
            <NavItem
              href="/InteligenciaArtificial"
              label="Asistente Virtual"
              icon={MessageSquare}
              active={is("/asistente-virtual") || is("/InteligenciaArtificial")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
          </NavGroup>
        </ul>

        <div className="my-2 border-t border-gray-100 mx-1" />

        {/* Usuarios + Bitácora */}
        <ul className="space-y-0.5">
          <NavGroup
            label="Usuarios"
            icon={Users}
            active={is("/usuarios") || is("/roles") || is("/permisos")}
            collapsed={isCollapsed}
            defaultOpen={is("/usuarios") || is("/roles") || is("/permisos")}
          >
            <NavItem
              href="/usuarios"
              label="Usuarios"
              icon={Users}
              active={is("/usuarios")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/roles"
              label="Roles"
              icon={ShieldCheck}
              active={is("/roles")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/permisos"
              label="Permisos"
              icon={KeyRound}
              active={is("/permisos")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
          </NavGroup>
          <NavItem
            href="/bitacora"
            label="Bitácora"
            icon={ScrollText}
            active={is("/bitacora")}
            collapsed={isCollapsed}
            onNavigate={closeMobileDrawer}
          />
          <NavItem
            href="/backups"
            label="Backups"
            icon={DatabaseBackup}
            active={is("/backups")}
            collapsed={isCollapsed}
            onNavigate={closeMobileDrawer}
          />
        </ul>

        <div className="my-2 border-t border-gray-100 mx-1" />

        {/* Cuenta */}
        <ul className="space-y-0.5">
          <NavGroup
            label="Cuenta"
            icon={Settings}
            active={is("/perfil") || is("/planes") || is("/configuracion-org")}
            collapsed={isCollapsed}
            defaultOpen={
              is("/perfil") || is("/planes") || is("/configuracion-org")
            }
          >
            <NavItem
              href="/perfil"
              label="Mi Perfil"
              icon={Users}
              active={is("/perfil")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/configuracion-org"
              label="Organización"
              icon={Settings}
              active={is("/configuracion-org")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
            />
            <NavItem
              href="/planes"
              label="Planes"
              icon={BarChart2}
              active={is("/planes")}
              collapsed={false}
              depth={1}
              onNavigate={closeMobileDrawer}
              badge={isTrial ? "Trial" : undefined}
            />
          </NavGroup>
        </ul>
      </nav>

      {/* ── Cerrar sesión ── */}
      <div className="flex-shrink-0 border-t border-gray-100 p-2">
        <button
          onClick={() => logout()}
          title={isCollapsed ? "Cerrar sesión" : undefined}
          className={`w-full flex items-center gap-2.5 text-[13px] font-medium rounded-lg
            text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors
            py-2.5 ${isCollapsed ? "justify-center px-2" : "px-3"}`}
        >
          <LogOut
            className="w-[15px] h-[15px] flex-shrink-0"
            strokeWidth={1.8}
          />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
