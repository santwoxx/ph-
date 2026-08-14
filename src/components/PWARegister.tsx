"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import Image from "next/image";
import { useSettings } from "@/context/SettingsContext";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWARegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    // Registra o Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Detecta se é iOS (Safari/Chrome no iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detecta se já está instalado (PWA Standalone)
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in window.navigator && (window.navigator as any).standalone === true);
    
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Lida com o evento de instalação no Android/Chrome
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  // Não mostra nada se o usuário descartou, se já tá instalado, ou se não tem evento e não é iOS
  if (dismissed || isStandalone) return null;
  if (!installEvent && !isIOS) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-3 rounded-2xl border border-acai-100/60 bg-white/95 p-4 shadow-2xl backdrop-blur-lg animate-fade-up dark:border-acai-800/60 dark:bg-acai-950/95 sm:bottom-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-inner dark:bg-acai-900 border border-acai-100 dark:border-acai-800">
          <Image
            src={settings.logoUrl || "/logo-ph.png"}
            alt={settings.storeName || "Logo"}
            width={40}
            height={40}
            className="h-full w-full object-contain"
          />
        </div>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm sm:text-base font-bold text-acai-950 dark:text-white truncate">Baixar App Açaí do PH</h3>
          <p className="text-xs sm:text-sm text-acai-600 dark:text-acai-300 mt-0.5 sm:mt-1 leading-snug">
            {isIOS 
              ? "Instale o app para pedir mais rápido e ter a melhor experiência!" 
              : "Instale o app para pedir mais rápido da sua tela inicial!"}
          </p>
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Fechar"
          className="shrink-0 rounded-full p-1 sm:p-1.5 text-acai-400 hover:bg-acai-50 hover:text-acai-600 dark:hover:bg-acai-900 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isIOS ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-acai-50/80 px-3 py-2.5 text-[13px] text-center text-acai-800 dark:bg-acai-900/50 dark:text-acai-200 border border-acai-100 dark:border-acai-800">
          <span>Toque em</span>
          <Share className="h-4 w-4 text-acai-600 dark:text-acai-400" />
          <span>e depois em</span>
          <strong className="font-bold">Adicionar à Tela de Início</strong>
        </div>
      ) : (
        <button
          onClick={async () => {
            if (!installEvent) return;
            await installEvent.prompt();
            const { outcome } = await installEvent.userChoice;
            if (outcome === 'accepted') {
              setInstallEvent(null);
            }
          }}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-acai-gradient px-4 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <Download className="h-5 w-5" />
          Instalar Aplicativo
        </button>
      )}
    </div>
  );
}
