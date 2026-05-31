'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwa_install_dismissed_until';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || '0');
    if (Date.now() < dismissedUntil) return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(Date.now() + sevenDays));
    setVisible(false);
    setDeferredPrompt(null);
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[120] mx-auto max-w-xl rounded-2xl border border-indigo-100 bg-white p-4 shadow-lg sm:left-auto sm:right-6"
      role="region"
      aria-label="Instalar aplicación"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Instalar OftalmoCRM</p>
          <p className="mt-1 text-xs text-gray-600">
            Agregá la app al escritorio o inicio del celular para abrirla como aplicación.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar aviso de instalación"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
