import type { MetadataRoute } from 'next';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'OftalmoCRM';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Gestión Clínica Oftalmológica`,
    short_name: APP_NAME,
    description: 'Sistema integral para clínica oftalmológica: pacientes, citas, reportes y operación diaria.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    lang: 'es',
    dir: 'ltr',
    categories: ['medical', 'business', 'productivity'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
