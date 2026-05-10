"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import EyeIllustration from "@/components/EyeIllustration";
import {
  Activity,
  Users,
  Calendar,
  Shield,
  Bot,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    title: "Gestión de Pacientes",
    desc: "Historial clínico digital completo. Diagnósticos, evoluciones, recetas y seguimiento postoperatorio en un solo lugar.",
  },
  {
    icon: Calendar,
    color: "bg-green-50 text-green-600",
    title: "Agenda Inteligente",
    desc: "Programación de citas, cirugías y estudios diagnósticos. Confirmaciones automáticas y recordatorios.",
  },
  {
    icon: Bot,
    color: "bg-purple-50 text-purple-600",
    title: "Asistente con IA",
    desc: "Documentación médica automática, alertas clínicas inteligentes y sugerencias basadas en el historial del paciente.",
  },
  {
    icon: Shield,
    color: "bg-orange-50 text-orange-600",
    title: "Seguridad y Auditoría",
    desc: "Control de acceso por roles, bitácora de todas las acciones y cumplimiento de normativas de privacidad médica.",
  },
  {
    icon: BarChart3,
    color: "bg-cyan-50 text-cyan-600",
    title: "Reportes y Estadísticas",
    desc: "Dashboards en tiempo real con métricas clínicas, ocupación quirúrgica y seguimiento de resultados.",
  },
  {
    icon: Activity,
    color: "bg-rose-50 text-rose-600",
    title: "Control Quirúrgico",
    desc: "Gestión completa del proceso quirúrgico: preoperatorio, acto quirúrgico y seguimiento postoperatorio.",
  },
];

const STATS = [
  { value: "+500", label: "Pacientes gestionados" },
  { value: "99.9%", label: "Disponibilidad del sistema" },
  { value: "+20", label: "Especialistas conectados" },
  { value: "< 2s", label: "Tiempo de respuesta" },
];

const BENEFITS = [
  "Acceso desde cualquier dispositivo, 24/7",
  "Datos cifrados y respaldos automáticos",
  "Integración con equipos de diagnóstico",
  "Soporte técnico especializado",
  "Actualizaciones continuas sin costo adicional",
  "Capacitación incluida para el equipo médico",
];

// ── Componente ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [active, setActive] = useState("inicio");

  useEffect(() => {
    const sections = ["inicio", "features", "nosotros", "contacto"];
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.4 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const NAV = [
    { label: "Inicio", href: "#inicio", id: "inicio" },
    { label: "Características", href: "#features", id: "features" },
    { label: "Sobre nosotros", href: "#nosotros", id: "nosotros" },
    { label: "Contacto", href: "#contacto", id: "contacto" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-blue-700">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold text-white">OftalmoCRM</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ label, href, id }) => (
              <a
                key={id}
                href={href}
                className={`px-4 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${
                  active === id
                    ? "bg-white/20 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm"
          >
            Iniciar Sesión
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section id="inicio" className="pt-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 min-h-[92vh] flex items-center">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-500/20 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-800/30 translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />

          <div className="relative max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-blue-100 text-[12.5px] font-medium rounded-full mb-5 border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Sistema activo — Clínica Oftalmológica San Rafael
              </span>
              <h1 className="text-[46px] font-bold text-white leading-[1.1] mb-5">
                Gestión médica
                <br />
                <span className="text-blue-200">inteligente</span>
                <br />
                con IA
              </h1>
              <p className="text-blue-100 text-[16px] leading-relaxed mb-8 max-w-[480px]">
                Centraliza la administración de tu clínica oftalmológica.
                Pacientes, citas, cirugías, historiales clínicos y más — todo en
                una plataforma segura y moderna.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl text-[14.5px] font-bold transition-colors shadow-lg"
                >
                  Acceder al sistema
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="flex items-center gap-2 text-white border border-white/30 hover:bg-white/10 px-6 py-3 rounded-xl text-[14.5px] font-semibold transition-colors"
                >
                  Ver características
                </a>
              </div>
            </div>

            {/* Eye illustration */}
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Halo exterior */}
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative w-full max-w-[460px] aspect-[480/380]">
                <EyeIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-[38px] font-bold text-white leading-none">
                {value}
              </p>
              <p className="text-[13px] text-gray-400 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[13px] font-semibold text-blue-600 uppercase tracking-widest">
              Características
            </span>
            <h2 className="text-[36px] font-bold text-gray-900 mt-2 mb-3">
              Todo lo que necesita tu clínica
            </h2>
            <p className="text-[15px] text-gray-500 max-w-xl mx-auto">
              Una plataforma completa diseñada específicamente para clínicas
              oftalmológicas, con flujos de trabajo adaptados al sector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div
                  className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOBRE NOSOTROS ══════════════════════════════════════════════════ */}
      <section id="nosotros" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Images grid */}
          <div className="grid grid-cols-2 gap-3">
            <Image
              src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&q=80&auto=format&fit=crop"
              alt="Equipo médico"
              width={400}
              height={192}
              className="h-48 w-full rounded-2xl object-cover"
            />
            <Image
              src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80&auto=format&fit=crop"
              alt="Oftalmología"
              width={400}
              height={192}
              className="mt-6 h-48 w-full rounded-2xl object-cover"
            />
            <Image
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80&auto=format&fit=crop"
              alt="Consulta"
              width={400}
              height={192}
              className="-mt-6 h-48 w-full rounded-2xl object-cover"
            />
            <Image
              src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80&auto=format&fit=crop"
              alt="Tecnología médica"
              width={400}
              height={192}
              className="h-48 w-full rounded-2xl object-cover"
            />
          </div>

          {/* Text */}
          <div>
            <span className="text-[13px] font-semibold text-blue-600 uppercase tracking-widest">
              Sobre nosotros
            </span>
            <h2 className="text-[34px] font-bold text-gray-900 mt-2 mb-4 leading-tight">
              Tecnología al servicio de la visión
            </h2>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-5">
              OftalmoCRM nació de la necesidad real de una clínica oftalmológica
              de digitalizar y centralizar todos sus procesos. Diseñado junto a
              médicos y especialistas para que la herramienta se adapte al
              trabajo clínico, no al revés.
            </p>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-8">
              Nuestra plataforma integra inteligencia artificial para asistir en
              la documentación clínica, reduciendo la carga administrativa y
              permitiendo que los profesionales se enfoquen en lo que más
              importa: la salud de sus pacientes.
            </p>
            <ul className="space-y-2.5">
              {BENEFITS.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2.5 text-[13.5px] text-gray-600"
                >
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-[32px] font-bold text-white mb-3">
            ¿Listo para modernizar tu clínica?
          </h2>
          <p className="text-blue-100 text-[15px] mb-8">
            Accedé al sistema con tus credenciales o solicitá una demostración
            gratuita.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 rounded-xl text-[15px] font-bold transition-colors shadow-lg"
          >
            Iniciar Sesión
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ══ CONTACTO ════════════════════════════════════════════════════════ */}
      <section id="contacto" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-bold text-gray-900">Contacto</h2>
            <p className="text-gray-500 text-[14px] mt-1">
              Clínica Oftalmológica San Rafael
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            {[
              { icon: Phone, label: "Teléfono", value: "+34 900 000 000" },
              { icon: Mail, label: "Correo", value: "info@sanrafael.clinica" },
              {
                icon: MapPin,
                label: "Dirección",
                value: "Calle Médica 42, Madrid",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon
                    className="w-4.5 h-4.5 text-blue-600 w-5 h-5"
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <p className="text-[11.5px] text-gray-400">{label}</p>
                  <p className="text-[13.5px] font-medium text-gray-900">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[13.5px] font-semibold text-white">
              OftalmoCRM
            </span>
          </div>
          <p className="text-[12.5px] text-gray-500">
            © 2026 Clínica Oftalmológica San Rafael. Sistema de gestión médica
            integral.
          </p>
          <Link
            href="/login"
            className="text-[13px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Acceso al panel →
          </Link>
        </div>
      </footer>
    </div>
  );
}
