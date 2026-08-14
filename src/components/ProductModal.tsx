"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";
import type { ExtraGroup, Product, ProductExtra } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { isDataUrl } from "@/lib/image";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

// Frase da regra do grupo, no mesmo tom usado pelo iFood ("Escolha 1
// opção", "Escolha até 3 opções", "Escolha de 1 a 3 opções").
function groupRuleText(group: ExtraGroup): string {
  const min = group.required ? Math.max(1, group.minSelect) : group.minSelect;
  const max = group.maxSelect;
  if (max === 1 && min <= 1) return "Escolha 1 opção";
  if (max > 0 && min > 0 && min === max) return `Escolha ${max} opções`;
  if (max > 0 && min > 0) return `Escolha de ${min} a ${max} opções`;
  if (max > 0) return `Escolha até ${max} opções`;
  if (min > 0) return `Escolha pelo menos ${min}`;
  return "Escolha à vontade";
}

// "Monte seu copo": um cartão por grupo (creme, frutas, coberturas...), no
// estilo do item customizável do iFood. Item único (maxSelect === 1) usa
// visual de rádio; senão é multi-seleção com ícone "+" que vira check ao
// selecionar, e trava ao atingir o limite.
function GroupSection({
  group,
  selected,
  onToggle,
}: {
  group: ExtraGroup;
  selected: ProductExtra[];
  onToggle: (item: ProductExtra) => void;
}) {
  const items = group.items.filter((it) => it.available !== false);
  if (items.length === 0) return null;

  const isSingle = group.maxSelect === 1;
  const atLimit = group.maxSelect > 0 && selected.length >= group.maxSelect;
  const minNeeded = group.required ? Math.max(1, group.minSelect) : group.minSelect;
  const satisfied = selected.length >= minNeeded;

  return (
    <div className="mt-6">
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-acai-900 dark:text-acai-100">{group.name}</p>
        <div className="flex items-center gap-1.5">
          {group.required && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                satisfied
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
              }`}
            >
              Obrigatório
            </span>
          )}
          {group.maxSelect > 0 && (
            <span className="text-[11px] font-semibold text-acai-400 dark:text-acai-500">
              {selected.length}/{group.maxSelect}
            </span>
          )}
        </div>
      </div>
      <p className="mb-2.5 text-xs text-acai-400 dark:text-acai-500">{groupRuleText(group)}</p>
      <div className="space-y-2">
        {items.map((item) => {
          const checked = selected.some((e) => e.name === item.name);
          const disabled = !checked && !isSingle && atLimit;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onToggle(item)}
              disabled={disabled}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-2.5 text-sm transition ${
                checked
                  ? "border-acai-500 bg-acai-50 dark:bg-acai-900/50"
                  : disabled
                    ? "cursor-not-allowed border-acai-100 opacity-50 dark:border-acai-800"
                    : "border-acai-100 hover:border-acai-200 dark:border-acai-800 dark:hover:border-acai-700"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5 font-medium text-acai-800 dark:text-acai-200">
                {item.imageUrl && (
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-acai-100 dark:bg-acai-800">
                    <Image src={item.imageUrl} alt="" fill unoptimized className="object-cover" />
                  </span>
                )}
                <span className="truncate">{item.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5">
                <span className="font-semibold text-acai-600 dark:text-acai-300">
                  {item.price > 0 ? `+ ${formatCurrency(item.price)}` : "Grátis"}
                </span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    checked ? "border-acai-600 bg-acai-600 text-white" : "border-acai-200 text-acai-400 dark:border-acai-700"
                  }`}
                >
                  {isSingle ? (
                    checked && <span className="h-2 w-2 rounded-full bg-white" />
                  ) : checked ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const [groupSelections, setGroupSelections] = useState<Record<string, ProductExtra[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // sizeIndex/selectedExtras/groupSelections/qty/notes começam sempre nos
  // valores padrão. O reset ao trocar de produto acontece pelo `key` que o
  // HomePage passa em <ProductModal key={...} />, que remonta este
  // componente do zero.

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

  const groups = product.extraGroups ?? [];
  const groupExtrasFlat = Object.values(groupSelections).flat();
  const extrasTotal = [...selectedExtras, ...groupExtrasFlat].reduce((sum, e) => sum + e.price, 0);
  const total = (size.price + extrasTotal) * qty;

  const unmetGroup = groups.find((g) => {
    const min = g.required ? Math.max(1, g.minSelect) : g.minSelect;
    return (groupSelections[g.id]?.length ?? 0) < min;
  });

  function toggleExtra(extra: ProductExtra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  }

  function toggleGroupItem(group: ExtraGroup, item: ProductExtra) {
    setGroupSelections((prev) => {
      const current = prev[group.id] ?? [];
      const isSelected = current.some((e) => e.name === item.name);
      if (isSelected) {
        return { ...prev, [group.id]: current.filter((e) => e.name !== item.name) };
      }
      if (group.maxSelect === 1) {
        return { ...prev, [group.id]: [item] };
      }
      if (group.maxSelect > 0 && current.length >= group.maxSelect) {
        return prev;
      }
      return { ...prev, [group.id]: [...current, item] };
    });
  }

  function handleAdd() {
    if (unmetGroup) {
      toast.error(`Escolha "${unmetGroup.name}" antes de continuar.`);
      return;
    }
    addItem({
      productId: product!.id,
      name: product!.name,
      imageUrl: product!.imageUrl,
      size: size!.label,
      unitPrice: size!.price,
      extras: [...selectedExtras, ...groupExtrasFlat],
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
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-scale-in dark:bg-acai-950 sm:rounded-3xl">
        <div className="relative h-56 w-full shrink-0 bg-acai-50 dark:bg-acai-900 sm:h-64">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized={isDataUrl(product.imageUrl)}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">🍨</div>
          )}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-acai-900 shadow-md transition hover:scale-105 dark:bg-acai-800/90 dark:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="font-display text-xl font-bold text-acai-950 dark:text-white">{product.name}</h2>
          <p className="mt-1.5 text-sm text-acai-500 dark:text-acai-400">{product.description}</p>

          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 text-sm font-bold text-acai-900 dark:text-acai-100">Escolha o tamanho</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => setSizeIndex(i)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                      i === sizeIndex
                        ? "border-acai-600 bg-acai-600 text-white shadow-soft"
                        : "border-acai-100 text-acai-700 hover:border-acai-300 dark:border-acai-800 dark:text-acai-300 dark:hover:border-acai-600"
                    }`}
                  >
                    {s.label} · {formatCurrency(s.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              selected={groupSelections[group.id] ?? []}
              onToggle={(item) => toggleGroupItem(group, item)}
            />
          ))}

          {product.extras.filter((e) => e.available !== false).length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 text-sm font-bold text-acai-900 dark:text-acai-100">Complementos</p>
              <div className="space-y-2">
                {product.extras.filter((e) => e.available !== false).map((extra) => {
                  const checked = selectedExtras.some((e) => e.name === extra.name);
                  return (
                    <button
                      key={extra.name}
                      onClick={() => toggleExtra(extra)}
                      className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-2.5 text-sm transition ${
                        checked
                          ? "border-acai-500 bg-acai-50 dark:bg-acai-900/50"
                          : "border-acai-100 hover:border-acai-200 dark:border-acai-800 dark:hover:border-acai-700"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 font-medium text-acai-800 dark:text-acai-200">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                            checked
                              ? "border-acai-600 bg-acai-600 text-white"
                              : "border-acai-200 dark:border-acai-700"
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        {extra.name}
                      </span>
                      <span className="font-semibold text-acai-600 dark:text-acai-300">
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

        <div className="flex items-center gap-3 border-t border-acai-100 bg-white p-5 dark:border-acai-800 dark:bg-acai-950">
          <div className="flex items-center gap-3 rounded-full border-2 border-acai-100 px-2 py-1.5 dark:border-acai-800">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-acai-700 transition hover:bg-acai-50 dark:text-acai-300 dark:hover:bg-acai-900"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center font-bold text-acai-950 dark:text-white">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-acai-700 transition hover:bg-acai-50 dark:text-acai-300 dark:hover:bg-acai-900"
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
