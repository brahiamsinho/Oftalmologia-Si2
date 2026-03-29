'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ScrollText,
  Eye,
  ClipboardList,
} from 'lucide-react';
import { Activity } from 'lucide-react';

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`group flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13.5px] font-medium transition-all duration-150
          ${active
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
      >
        <Icon
          className={`w-[17px] h-[17px] flex-shrink-0 transition-colors ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
          strokeWidth={active ? 2.2 : 1.8}
        />
        <span>{label}</span>
      </Link>
    </li>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 mb-1.5 mt-5 text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
      {children}
    </p>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      style={{ width: 220 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 select-none"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4 h-[60px] border-b border-gray-100">
        <div className="w-[34px] h-[34px] rounded-xl bg-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <Activity className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[14.5px] font-bold text-gray-900 tracking-tight">OftalmoCRM</span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 pt-3 pb-2 overflow-y-auto">
        {/* General */}
        <ul className="space-y-0.5">
          <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} active={active('/dashboard')} />
        </ul>

        {/* Gestión de Pacientes */}
        <SectionLabel>Gestión de Pacientes</SectionLabel>
        <ul className="space-y-0.5">
          <NavItem href="/pacientes"    label="Pacientes"         icon={Users}         active={active('/pacientes')} />
          <NavItem href="/historial"    label="Historial Clínico" icon={ClipboardList} active={active('/historial')} />
        </ul>

        {/* Administración */}
        <SectionLabel>Administración</SectionLabel>
        <ul className="space-y-0.5">
          <NavItem href="/usuarios" label="Usuarios" icon={Users}       active={active('/usuarios')} />
          <NavItem href="/roles"    label="Roles"    icon={ShieldCheck} active={active('/roles')}    />
          <NavItem href="/bitacora" label="Bitácora" icon={ScrollText}  active={active('/bitacora')} />
        </ul>
      </nav>

      {/* ── Vista Paciente ── */}
      <div className="px-3 pb-3 border-t border-gray-100 pt-2">
        <Link
          href="/vista-paciente"
          className="flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13.5px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all duration-150"
        >
          <Eye className="w-[17px] h-[17px] text-gray-400" strokeWidth={1.8} />
          Vista Paciente
        </Link>
      </div>
    </aside>
  );
}
