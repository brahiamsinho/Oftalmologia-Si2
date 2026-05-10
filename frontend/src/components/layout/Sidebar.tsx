"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useTenant } from "@/context/TenantContext";
import { TenantStorage } from "@/lib/api";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
        title={collapsed ? label : undefined}
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
  const { orgData, planInfo, flags, loading: tenantLoading } = useTenant();

  const is = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const widthPx = isDesktop ? (isCollapsed ? 64 : 220) : 220;
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

  // ── Flags de plan para mostrar módulos opcionales ──
  const showCRM = !tenantLoading && flags.mostrar_modulo_crm;
  const showNotif = !tenantLoading && flags.mostrar_notificaciones;
  const showReport =
    !tenantLoading && (planInfo?.permite_reportes_avanzados ?? false);

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

        {/* CRM — solo si el plan + settings lo permiten */}
        {showCRM && (
          <ul className="space-y-0.5 mt-1">
            <NavGroup
              label="CRM"
              icon={Megaphone}
              active={is("/crm")}
              collapsed={isCollapsed}
              defaultOpen={is("/crm")}
            >
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
                href="/crm/campanas"
                label="Campañas"
                icon={Megaphone}
                active={is("/crm/campanas")}
                collapsed={false}
                depth={1}
                onNavigate={closeMobileDrawer}
              />
            </NavGroup>
          </ul>
        )}

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

        {/* Reportes avanzados — solo si el plan lo permite */}
        {showReport && (
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
        )}

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
