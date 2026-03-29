'use client';

import { Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left */}
      <div>
        <p className="text-[14.5px] font-semibold text-gray-900 leading-tight">
          Clínica Oftalmológica San Rafael
        </p>
        <p className="text-[11.5px] text-gray-400 leading-tight">
          Sistema de gestión médica integral
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-[16px] h-[16px] bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            3
          </span>
        </button>

        {/* User */}
        <button className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 ml-1">
          <div className="w-[30px] h-[30px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-blue-700">CA</span>
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold text-gray-900 leading-tight whitespace-nowrap">
              Dr. Carlos Administrador
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">Administrador</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
        </button>
      </div>
    </header>
  );
}
