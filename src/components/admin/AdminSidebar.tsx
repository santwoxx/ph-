"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  Users,
  Wallet,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

const links = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Utensils },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/financas", label: "Finanças", icon: Wallet },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();
  const { settings } = useSettings();

  return (
    <div className="flex h-full w-64 flex-col bg-acai-950 text-white">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-acai-gradient text-base">
          🍇
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold">{settings.storeName}</p>
          <p className="text-[11px] text-acai-300">Painel administrativo</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-acai-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-acai-200 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" /> Ver cardápio
        </Link>
        <button
          onClick={() => signOutUser()}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
        {user?.email && (
          <p className="truncate px-3.5 pt-1 text-[11px] text-acai-400">{user.email}</p>
        )}
      </div>
    </div>
  );
}
