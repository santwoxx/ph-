"use client";

import { Suspense, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { FirebaseSetupNotice } from "@/components/FirebaseSetupNotice";
import { AnalyticsListener } from "@/components/AnalyticsListener";

export function Providers({ children }: { children: ReactNode }) {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupNotice />;
  }

  return (
    <AuthProvider>
      <SettingsProvider>{children}</SettingsProvider>
      <Suspense fallback={null}>
        <AnalyticsListener />
      </Suspense>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#2a0e48",
            color: "#fff",
            fontSize: "14px",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: { iconTheme: { primary: "#e8b04b", secondary: "#2a0e48" } },
          error: { iconTheme: { primary: "#d43d84", secondary: "#fff" } },
        }}
      />
    </AuthProvider>
  );
}
