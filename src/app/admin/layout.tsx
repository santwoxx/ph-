"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin, adminChecked } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (loading || !adminChecked) return;
    if (!user || !isAdmin) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, loading, adminChecked, user, isAdmin, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !adminChecked || !user || !isAdmin) {
    return <FullPageSpinner label="Verificando acesso..." />;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-acai-50/40">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <div className="flex items-center gap-3 border-b border-acai-100 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-acai-700 hover:bg-acai-50"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-bold text-acai-950">Painel administrativo</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
