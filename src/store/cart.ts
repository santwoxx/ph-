"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductExtra } from "@/lib/types";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  imageUrl: string;
  size: string;
  unitPrice: number;
  qty: number;
  extras: ProductExtra[];
  notes?: string;
};

type AddItemInput = Omit<CartItem, "key" | "qty"> & { qty?: number };

function buildKey(input: AddItemInput): string {
  const extrasKey = input.extras
    .map((e) => e.name)
    .sort()
    .join("|");
  return `${input.productId}::${input.size}::${extrasKey}::${input.notes ?? ""}`;
}

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (input: AddItemInput) => void;
  removeItem: (key: string) => void;
  incrementItem: (key: string) => void;
  decrementItem: (key: string) => void;
  clear: () => void;
  subtotal: () => number;
  totalItems: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (input) => {
        const key = buildKey(input);
        const qty = input.qty ?? 1;
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: i.qty + qty } : i
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...input, key, qty }],
            isOpen: true,
          };
        });
      },
      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      incrementItem: (key) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, qty: i.qty + 1 } : i
          ),
        })),
      decrementItem: (key) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.key === key ? { ...i, qty: i.qty - 1 } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      subtotal: () =>
        get().items.reduce((sum, item) => {
          const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
          return sum + (item.unitPrice + extrasTotal) * item.qty;
        }, 0),
      totalItems: () => get().items.reduce((sum, item) => sum + item.qty, 0),
    }),
    {
      name: "acai-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
