"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, LogOut, ClipboardList, Sun, Moon, Instagram } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { NotificationBell } from "@/components/NotificationBell";
import { checkIsStoreOpen } from "@/lib/schedule";

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.open);
  const { user, signOutUser } = useAuth();
  const { settings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const prevTotal = useRef(totalItems);

  const isStoreOpen = checkIsStoreOpen(settings);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (totalItems > prevTotal.current) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 300);
      return () => clearTimeout(timer);
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  return (
    <header className="sticky top-0 z-40 border-b border-acai-100/60 bg-white/85 backdrop-blur-lg dark:border-acai-800 dark:bg-acai-950/85">
      <div className="container-app flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={settings.logoUrl || "/logo-ph.png"}
            alt={settings.storeName || "Logo"}
            width={48}
            height={48}
            className="h-10 w-10 object-contain sm:h-12 sm:w-12 drop-shadow-md"
            priority
          />
          <div className="leading-tight">
            <p className="font-display text-base font-bold text-acai-950 dark:text-white sm:text-lg">
              {settings.storeName}
            </p>
            <p className="hidden text-xs font-medium text-acai-400 dark:text-acai-300 sm:block">
              {isStoreOpen ? "Aberto agora" : "Fechado no momento"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border-2 border-acai-100 bg-white px-3 py-2 text-sm font-semibold text-acai-800 transition hover:border-acai-300 dark:border-acai-800 dark:bg-acai-900 dark:text-acai-100 dark:hover:border-acai-600"
              >
                <User className="h-4 w-4" />
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {user.displayName || user.email}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-acai-100 bg-white shadow-soft animate-scale-in dark:border-acai-800 dark:bg-acai-900">
                    <Link
                      href="/meus-pedidos"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-acai-800 hover:bg-acai-50 dark:text-acai-100 dark:hover:bg-acai-800"
                    >
                      <ClipboardList className="h-4 w-4" /> Meus pedidos
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOutUser();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
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
              className="flex items-center gap-2 rounded-full border-2 border-acai-100 bg-white px-3 py-2 text-sm font-semibold text-acai-800 transition hover:border-acai-300 dark:border-acai-800 dark:bg-acai-900 dark:text-acai-100 dark:hover:border-acai-600"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}

          <NotificationBell />

          {settings.instagram && (
            <a
              href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-acai-100 text-acai-800 transition hover:border-acai-300 dark:border-acai-800 dark:text-acai-100 dark:hover:border-acai-600 sm:h-12 sm:w-12"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-acai-100 text-acai-800 transition hover:border-acai-300 dark:border-acai-800 dark:text-acai-100 dark:hover:border-acai-600 sm:h-12 sm:w-12"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          <button
            onClick={openCart}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-acai-gradient text-white shadow-soft transition hover:brightness-110 sm:h-12 sm:w-12 ${
              isBumping ? "animate-cart-bump" : ""
            }`}
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
