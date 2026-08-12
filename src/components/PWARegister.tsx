"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWARegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (!installEvent || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-acai-100 bg-white p-4 shadow-soft animate-fade-up dark:border-acai-800 dark:bg-acai-900">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-acai-gradient text-lg">
        🍇
      </span>
      <div className="flex-1">
        <p className="text-sm font-bold text-acai-950 dark:text-white">Instalar o app</p>
        <p className="text-xs text-acai-400">Peça mais rápido direto da tela inicial</p>
      </div>
      <button
        onClick={async () => {
          await installEvent.prompt();
          setInstallEvent(null);
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-acai-gradient px-3 py-2 text-xs font-bold text-white"
      >
        <Download className="h-3.5 w-3.5" /> Instalar
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Fechar"
        className="shrink-0 text-acai-300 hover:text-acai-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
