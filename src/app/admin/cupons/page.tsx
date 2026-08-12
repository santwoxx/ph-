"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Tag, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/Modal";
import {
  subscribeToCoupons,
  createCoupon,
  toggleCouponActive,
  deleteCoupon,
} from "@/lib/data/coupons";
import type { Coupon } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"fixed" | "percentage">("percentage");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCoupons(setCoupons, () => setCoupons([]));
    return () => unsub();
  }, []);

  async function handleAddCoupon(e: FormEvent) {
    e.preventDefault();
    const val = Number(value);
    const min = minOrder ? Number(minOrder) : 0;
    if (!code.trim() || !val || val <= 0) {
      toast.error("Preencha o código e um valor válido.");
      return;
    }
    if (type === "percentage" && val > 100) {
      toast.error("O desconto percentual não pode ser maior que 100%.");
      return;
    }

    setSaving(true);
    try {
      await createCoupon({
        id: code.trim().toUpperCase(),
        type,
        value: val,
        minOrder: min > 0 ? min : undefined,
        active: true,
      });
      toast.success("Cupom criado com sucesso!");
      setCode("");
      setValue("");
      setMinOrder("");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível criar o cupom.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    try {
      await toggleCouponActive(coupon.id, !coupon.active);
      toast.success(
        `Cupom ${coupon.id} ${!coupon.active ? "ativado" : "desativado"}.`
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar o status do cupom.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCoupon(deleting.id);
      toast.success("Cupom removido.");
      setDeleting(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível remover.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-acai-950">Cupons de Desconto</h1>
        <p className="text-sm text-acai-400">Crie e gerencie ofertas para seus clientes.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card h-fit">
          <h2 className="font-display text-base font-bold text-acai-950">Novo Cupom</h2>
          <form onSubmit={handleAddCoupon} className="mt-4 space-y-4">
            <Input
              label="Código (ex: BEMVINDO10)"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-acai-900">Tipo de desconto</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "fixed" | "percentage")}
                  className="w-full rounded-xl border-2 border-acai-100 bg-white px-4 py-2.5 text-sm text-acai-950 outline-none focus:border-acai-500 focus:ring-4 focus:ring-acai-100"
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </label>
              <Input
                label={type === "percentage" ? "Desconto (%)" : "Desconto (R$)"}
                type="number"
                min={0}
                step={type === "fixed" ? "0.01" : "1"}
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <Input
              label="Pedido Mínimo (R$) - Opcional"
              type="number"
              min={0}
              step="0.01"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="0,00"
            />
            <Button type="submit" fullWidth loading={saving}>
              <Plus className="h-4 w-4" /> Criar cupom
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-acai-950">Cupons criados</h2>
          {coupons === null ? (
            <Spinner label="Carregando cupons..." />
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-acai-400">
              <Tag className="h-10 w-10 mb-2 opacity-50" />
              <p>Nenhum cupom criado ainda.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`flex items-center justify-between rounded-xl border-2 p-4 transition-opacity ${
                    !coupon.active ? "opacity-60 border-gray-100 bg-gray-50" : "border-acai-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-acai-50 text-acai-600">
                      {coupon.type === "percentage" ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-acai-900">{coupon.id}</p>
                      <p className="text-xs text-acai-500">
                        {coupon.type === "percentage" ? `${coupon.value}% de desconto` : `${formatCurrency(coupon.value)} de desconto`}
                        {coupon.minOrder ? ` (Min. ${formatCurrency(coupon.minOrder)})` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={coupon.active}
                          onChange={() => handleToggleActive(coupon)}
                        />
                        <div className="block h-6 w-10 rounded-full bg-acai-200 transition peer-checked:bg-acai-500"></div>
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
                      </div>
                    </label>
                    <button
                      onClick={() => setDeleting(coupon)}
                      className="text-acai-300 transition hover:text-red-500"
                      aria-label="Remover cupom"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remover cupom?"
        description={`Tem certeza que deseja remover o cupom "${deleting?.id}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        danger
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
