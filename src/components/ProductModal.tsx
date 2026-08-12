"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";
import type { Product, ProductExtra } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // sizeIndex/selectedExtras/qty/notes começam sempre nos valores padrão.
  // O reset ao trocar de produto acontece pelo `key` que o HomePage passa
  // em <ProductModal key={...} />, que remonta este componente do zero.

  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [product]);

  const size = useMemo(() => {
    if (!product) return null;
    if (product.sizes.length === 0) return { label: "Único", price: product.basePrice };
    return product.sizes[sizeIndex];
  }, [product, sizeIndex]);

  if (!product || !size) return null;

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const total = (size.price + extrasTotal) * qty;

  function toggleExtra(extra: ProductExtra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  }

  function handleAdd() {
    addItem({
      productId: product!.id,
      name: product!.name,
      imageUrl: product!.imageUrl,
      size: size!.label,
      unitPrice: size!.price,
      extras: selectedExtras,
      notes: notes.trim() || undefined,
      qty,
    });
    toast.success(`${product!.name} adicionado ao carrinho!`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-scale-in sm:rounded-3xl">
        <div className="relative h-56 w-full shrink-0 bg-acai-50 sm:h-64">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">🍨</div>
          )}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-acai-900 shadow-md transition hover:scale-105"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="font-display text-xl font-bold text-acai-950">{product.name}</h2>
          <p className="mt-1.5 text-sm text-acai-500">{product.description}</p>

          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 text-sm font-bold text-acai-900">Escolha o tamanho</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => setSizeIndex(i)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                      i === sizeIndex
                        ? "border-acai-600 bg-acai-600 text-white shadow-soft"
                        : "border-acai-100 text-acai-700 hover:border-acai-300"
                    }`}
                  >
                    {s.label} · {formatCurrency(s.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.extras.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 text-sm font-bold text-acai-900">Complementos</p>
              <div className="space-y-2">
                {product.extras.map((extra) => {
                  const checked = selectedExtras.some((e) => e.name === extra.name);
                  return (
                    <button
                      key={extra.name}
                      onClick={() => toggleExtra(extra)}
                      className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-2.5 text-sm transition ${
                        checked
                          ? "border-acai-500 bg-acai-50"
                          : "border-acai-100 hover:border-acai-200"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 font-medium text-acai-800">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                            checked
                              ? "border-acai-600 bg-acai-600 text-white"
                              : "border-acai-200"
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        {extra.name}
                      </span>
                      <span className="font-semibold text-acai-600">
                        + {formatCurrency(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Textarea
              label="Observações (opcional)"
              placeholder="Ex: sem granola, pouco leite condensado..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-acai-100 bg-white p-5">
          <div className="flex items-center gap-3 rounded-full border-2 border-acai-100 px-2 py-1.5">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-acai-700 transition hover:bg-acai-50"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center font-bold text-acai-950">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-acai-700 transition hover:bg-acai-50"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleAdd} fullWidth size="lg">
            Adicionar · {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
