"use client";

import { memo } from "react";
import Image from "next/image";
import { Plus, Flame } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export const ProductCard = memo(function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (product: Product) => void;
}) {
  const startingPrice =
    product.sizes.length > 0
      ? Math.min(...product.sizes.map((s) => s.price))
      : product.basePrice;

  return (
    <button
      onClick={() => onSelect(product)}
      disabled={!product.available}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-acai-100 bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-acai-800 dark:bg-acai-900 dark:shadow-none dark:hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-acai-50 dark:bg-acai-950">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">🍨</div>
        )}
        {product.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-acai-950 shadow">
            <Flame className="h-3 w-3" /> Mais pedido
          </span>
        )}
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-acai-900">
              Esgotado Hoje
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-base font-bold text-acai-950 dark:text-white">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-acai-400 dark:text-acai-300">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            <span className="block text-[11px] font-medium uppercase tracking-wide text-acai-300 dark:text-acai-400">
              {product.sizes.length > 0 ? "a partir de" : "preço"}
            </span>
            <span className="font-display text-lg font-extrabold text-acai-700 dark:text-acai-200">
              {formatCurrency(startingPrice)}
            </span>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-acai-gradient text-white shadow-soft transition group-hover:scale-110">
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
});

export function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-acai-100 bg-white text-left shadow-card dark:border-acai-800 dark:bg-acai-900">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-acai-50 dark:bg-acai-950">
        <div className="h-full w-full animate-pulse bg-acai-100/50 dark:bg-acai-800/50" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-acai-100/50 dark:bg-acai-800/50" />
        <div className="mt-1 h-3 w-full animate-pulse rounded bg-acai-100/50 dark:bg-acai-800/50" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-acai-100/50 dark:bg-acai-800/50" />
        
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="space-y-1">
            <div className="h-2.5 w-16 animate-pulse rounded bg-acai-100/50 dark:bg-acai-800/50" />
            <div className="h-5 w-20 animate-pulse rounded bg-acai-100/50 dark:bg-acai-800/50" />
          </div>
          <div className="h-9 w-9 animate-pulse rounded-full bg-acai-100/50 dark:bg-acai-800/50" />
        </div>
      </div>
    </div>
  );
}
