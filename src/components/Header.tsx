"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, LogOut, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.open);
  const { user, signOutUser } = useAuth();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-acai-100/60 bg-white/85 backdrop-blur-lg">
      <div className="container-app flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="flex items-center gap-3">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.storeName}
              width={44}
              height={44}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-acai-100 sm:h-12 sm:w-12"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-acai-gradient text-lg sm:h-12 sm:w-12 sm:text-xl">
              🍇
            </span>
          )}
          <div className="leading-tight">
            <p className="font-display text-base font-bold text-acai-950 sm:text-lg">
              {settings.storeName}
            </p>
            <p className="hidden text-xs font-medium text-acai-400 sm:block">
              {settings.isOpen ? "Aberto agora" : "Fechado no momento"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border-2 border-acai-100 bg-white px-3 py-2 text-sm font-semibold text-acai-800 transition hover:border-acai-300"
              >
                <User className="h-4 w-4" />
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {user.displayName || user.email}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-acai-100 bg-white shadow-soft animate-scale-in">
                    <Link
                      href="/meus-pedidos"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-acai-800 hover:bg-acai-50"
                    >
                      <ClipboardList className="h-4 w-4" /> Meus pedidos
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOutUser();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full border-2 border-acai-100 px-4 py-2 text-sm font-semibold text-acai-800 transition hover:border-acai-300 sm:block"
            >
              Entrar
            </Link>
          )}

          <button
            onClick={openCart}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-acai-gradient text-white shadow-soft transition hover:brightness-110 sm:h-12 sm:w-12"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-acai-950 ring-2 ring-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
