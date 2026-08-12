"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeToSettings, DEFAULT_SETTINGS } from "@/lib/data/settings";
import type { StoreSettings } from "@/lib/types";

const SettingsContext = createContext<{ settings: StoreSettings; loading: boolean }>({
  settings: DEFAULT_SETTINGS,
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToSettings(
      (s) => {
        setSettings(s);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
