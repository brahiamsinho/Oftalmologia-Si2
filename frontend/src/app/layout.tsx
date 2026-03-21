import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Oftalmología Si2 — Sistema de Gestión Clínica',
  description:
    'Sistema integral para clínica oftalmológica. Gestión de pacientes, citas, exámenes y más.',
  keywords: ['oftalmología', 'clínica', 'gestión', 'pacientes', 'citas'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
