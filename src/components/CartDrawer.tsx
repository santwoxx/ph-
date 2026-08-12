"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/context/SettingsContext";

export function CartDrawer() {
  const { items, isOpen, close, incrementItem, decrementItem, removeItem, subtotal } =
    useCartStore();
  const { settings } = useSettings();

  const sub = subtotal();
  const belowMinimum = sub > 0 && sub < settings.minOrder;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-acai-950 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-acai-100 p-5 dark:border-acai-800">
          <h2 className="font-display text-lg font-bold text-acai-950 dark:text-white">Seu carrinho</h2>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-acai-500 transition hover:bg-acai-50"
            aria-label="Fechar carrinho"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-14 w-14 text-acai-200 dark:text-acai-700" />
            <p className="font-semibold text-acai-800 dark:text-acai-100">Seu carrinho está vazio</p>
            <p className="text-sm text-acai-400 dark:text-acai-400">Adicione um açaí delicioso para começar!</p>
            <Button variant="outline" onClick={close} className="mt-2">
              Ver cardápio
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map((item) => {
                const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
                const lineTotal = (item.unitPrice + extrasTotal) * item.qty;
                return (
                  <div
                    key={item.key}
                    className="flex gap-3 rounded-2xl border border-acai-100 p-3 dark:border-acai-800"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-acai-50 dark:bg-acai-900">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🍨</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-acai-950 dark:text-white">{item.name}</p>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="text-acai-300 transition hover:text-red-500 dark:text-acai-500 dark:hover:text-red-400"
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-acai-400 dark:text-acai-500">{item.size}</p>
                      {item.extras.length > 0 && (
                        <p className="text-xs text-acai-400 dark:text-acai-500">
                          + {item.extras.map((e) => e.name).join(", ")}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-acai-100 px-1.5 py-1 dark:border-acai-800">
                          <button
                            onClick={() => decrementItem(item.key)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-acai-700 hover:bg-acai-50 dark:text-acai-300 dark:hover:bg-acai-800"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-4 text-center text-sm font-bold dark:text-white">{item.qty}</span>
                          <button
                            onClick={() => incrementItem(item.key)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-acai-700 hover:bg-acai-50 dark:text-acai-300 dark:hover:bg-acai-800"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-acai-700 dark:text-acai-300">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-acai-100 p-5 dark:border-acai-800">
              {belowMinimum && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Pedido mínimo de {formatCurrency(settings.minOrder)}. Faltam{" "}
                  {formatCurrency(settings.minOrder - sub)}.
                </p>
              )}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-acai-500 dark:text-acai-400">Subtotal</span>
                <span className="font-display text-xl font-extrabold text-acai-950 dark:text-white">
                  {formatCurrency(sub)}
                </span>
              </div>
              <Link href="/checkout" onClick={close}>
                <Button fullWidth size="lg" disabled={belowMinimum}>
                  Finalizar pedido
                </Button>
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
