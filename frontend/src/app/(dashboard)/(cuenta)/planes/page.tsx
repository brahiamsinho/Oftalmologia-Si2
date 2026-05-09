import React from 'react';
import { Check, X } from 'lucide-react';

const PLANES = [
  {
    id: 'FREE',
    nombre: 'Free',
    descripcion: 'Plan gratuito para pruebas o uso básico.',
    precio_mensual: 0,
    max_usuarios: 3,
    max_pacientes: 100,
    max_citas_mes: 100,
    max_almacenamiento_mb: 500,
    permite_crm: false,
    permite_notificaciones: false,
    permite_reportes_avanzados: false,
    permite_soporte_prioritario: false,
  },
  {
    id: 'PLUS',
    nombre: 'Plus',
    descripcion: 'Plan para clínicas pequeñas o medianas.',
    precio_mensual: 149,
    max_usuarios: 15,
    max_pacientes: 2000,
    max_citas_mes: 1500,
    max_almacenamiento_mb: 5000,
    permite_crm: true,
    permite_notificaciones: true,
    permite_reportes_avanzados: false,
    permite_soporte_prioritario: false,
  },
  {
    id: 'PRO',
    nombre: 'Pro',
    descripcion: 'Plan completo para organizaciones con alto volumen.',
    precio_mensual: 299,
    max_usuarios: 50,
    max_pacientes: 10000,
    max_citas_mes: 10000,
    max_almacenamiento_mb: 20000,
    permite_crm: true,
    permite_notificaciones: true,
    permite_reportes_avanzados: true,
    permite_soporte_prioritario: true,
  },
];

export default function PlanesPage() {
  // En una aplicación real, esto vendría del contexto de usuario o de una llamada a la API
  const planActual = 'FREE'; 

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Planes y Precios</h1>
        <p className="text-xl text-gray-600">
          Elige el plan que mejor se adapte a las necesidades de tu clínica
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANES.map((plan) => (
          <div 
            key={plan.id}
            className={`rounded-2xl border flex flex-col bg-white overflow-hidden ${
              plan.id === planActual 
                ? 'border-blue-500 shadow-xl ring-2 ring-blue-500 ring-opacity-50' 
                : 'border-gray-200 shadow-sm hover:shadow-md'
            } transition-shadow duration-300`}
          >
            {plan.id === 'PLUS' && (
              <div className="bg-blue-500 text-white text-sm font-bold uppercase tracking-wider text-center py-1">
                Más popular
              </div>
            )}
            
            <div className="p-8 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{plan.nombre}</h2>
              <p className="mt-4 text-gray-500 text-sm min-h-[40px]">{plan.descripcion}</p>
              
              <div className="mt-6 flex items-baseline text-5xl font-extrabold">
                ${plan.precio_mensual}
                <span className="ml-1 text-xl font-medium text-gray-500">/mes</span>
              </div>

              <button
                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-lg text-center font-medium transition-colors ${
                  plan.id === planActual
                    ? 'bg-gray-100 text-gray-800 cursor-not-allowed'
                    : plan.id === 'PLUS'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                }`}
                disabled={plan.id === planActual}
              >
                {plan.id === planActual ? 'Plan Actual' : 'Mejorar Plan'}
              </button>
            </div>

            <div className="px-8 pb-8 pt-6 bg-gray-50 flex-1 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-4">
                Características incluidas
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-700">Hasta {plan.max_usuarios} usuarios</span>
                </li>
                <li className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-700">Hasta {plan.max_pacientes} pacientes</span>
                </li>
                <li className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-700">Hasta {plan.max_citas_mes} citas/mes</span>
                </li>
                <li className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-700">{plan.max_almacenamiento_mb / 1000} GB Almacenamiento</span>
                </li>
                
                <li className="flex items-start">
                  {plan.permite_crm ? (
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  ) : (
                    <X className="flex-shrink-0 h-5 w-5 text-gray-300" />
                  )}
                  <span className={`ml-3 text-sm ${plan.permite_crm ? 'text-gray-700' : 'text-gray-400'}`}>
                    Módulo CRM
                  </span>
                </li>
                <li className="flex items-start">
                  {plan.permite_notificaciones ? (
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  ) : (
                    <X className="flex-shrink-0 h-5 w-5 text-gray-300" />
                  )}
                  <span className={`ml-3 text-sm ${plan.permite_notificaciones ? 'text-gray-700' : 'text-gray-400'}`}>
                    Notificaciones
                  </span>
                </li>
                <li className="flex items-start">
                  {plan.permite_reportes_avanzados ? (
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  ) : (
                    <X className="flex-shrink-0 h-5 w-5 text-gray-300" />
                  )}
                  <span className={`ml-3 text-sm ${plan.permite_reportes_avanzados ? 'text-gray-700' : 'text-gray-400'}`}>
                    Reportes Avanzados
                  </span>
                </li>
                <li className="flex items-start">
                  {plan.permite_soporte_prioritario ? (
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  ) : (
                    <X className="flex-shrink-0 h-5 w-5 text-gray-300" />
                  )}
                  <span className={`ml-3 text-sm ${plan.permite_soporte_prioritario ? 'text-gray-700' : 'text-gray-400'}`}>
                    Soporte Prioritario
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
