"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, TrendingUp, TrendingDown, PiggyBank, Receipt, Trophy } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/Modal";
import { subscribeToAllOrders } from "@/lib/data/orders";
import { subscribeToExpenses, createExpense, deleteExpense } from "@/lib/data/expenses";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import type { Order, Expense } from "@/lib/types";

const EXPENSE_CATEGORIES = [
  "Ingredientes",
  "Embalagens",
  "Aluguel",
  "Funcionários",
  "Marketing",
  "Manutenção",
  "Outros",
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminFinancePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubOrders = subscribeToAllOrders(setOrders, () => setOrders([]));
    const unsubExpenses = subscribeToExpenses(setExpenses, () => setExpenses([]));
    return () => {
      unsubOrders();
      unsubExpenses();
    };
  }, []);

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = monthKey(now);

  const monthRevenue = useMemo(() => {
    if (!orders) return 0;
    return orders
      .filter((o) => o.status !== "cancelled" && monthKey(new Date(o.createdAt)) === currentMonthKey)
      .reduce((s, o) => s + o.total, 0);
  }, [orders, currentMonthKey]);

  const monthExpensesTotal = useMemo(() => {
    if (!expenses) return 0;
    return expenses
      .filter((e) => e.date.slice(0, 7) === currentMonthKey)
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, currentMonthKey]);

  const monthOrdersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(
      (o) => o.status !== "cancelled" && monthKey(new Date(o.createdAt)) === currentMonthKey
    ).length;
  }, [orders, currentMonthKey]);

  const topProducts = useMemo(() => {
    if (!orders) return [];
    
    const productStats: Record<string, { qty: number; revenue: number }> = {};
    
    orders
      .filter((o) => o.status !== "cancelled" && monthKey(new Date(o.createdAt)) === currentMonthKey)
      .forEach((o) => {
        o.items.forEach(item => {
          if (!productStats[item.name]) {
            productStats[item.name] = { qty: 0, revenue: 0 };
          }
          productStats[item.name].qty += item.qty;
          productStats[item.name].revenue += item.lineTotal;
        });
      });
      
    return Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders, currentMonthKey]);

  const chartData = useMemo(() => {
    const months: { key: string; label: string; receita: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: monthKey(d),
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receita: 0,
        despesas: 0,
      });
    }
    (orders ?? [])
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        const k = monthKey(new Date(o.createdAt));
        const m = months.find((mo) => mo.key === k);
        if (m) m.receita += o.total;
      });
    (expenses ?? []).forEach((e) => {
      const k = e.date.slice(0, 7);
      const m = months.find((mo) => mo.key === k);
      if (m) m.despesas += e.amount;
    });
    return months;
  }, [orders, expenses, now]);

  async function handleAddExpense(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!description.trim() || !value || value <= 0) {
      toast.error("Preencha descrição e um valor válido.");
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        description: description.trim(),
        category,
        amount: value,
        date,
        createdBy: user?.email || "",
      });
      toast.success("Despesa lançada.");
      setDescription("");
      setAmount("");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível lançar a despesa.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteExpense(deleting.id);
      toast.success("Despesa removida.");
      setDeleting(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível remover.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const loading = orders === null || expenses === null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-acai-950">Finanças</h1>
        <p className="text-sm text-acai-400">Controle receitas, despesas e o lucro da loja.</p>
      </div>

      {loading ? (
        <Spinner label="Carregando finanças..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Receita do mês" value={formatCurrency(monthRevenue)} icon={TrendingUp} tone="emerald" />
            <StatCard label="Despesas do mês" value={formatCurrency(monthExpensesTotal)} icon={TrendingDown} tone="berry" />
            <StatCard
              label="Lucro do mês"
              value={formatCurrency(monthRevenue - monthExpensesTotal)}
              icon={PiggyBank}
              tone="gold"
            />
            <StatCard label="Pedidos válidos no mês" value={String(monthOrdersCount)} icon={Receipt} tone="acai" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
              <h2 className="font-display text-base font-bold text-acai-950">
                Receita x Despesas — últimos 6 meses
              </h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                    <CartesianGrid vertical={false} stroke="#f0e6fa" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9b7cb8" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#9b7cb8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${v}`}
                      width={60}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: "1px solid #e9d9f8" }} />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="#7f2fc9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="#d43d84" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card h-fit">
              <h2 className="font-display text-base font-bold text-acai-950 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gold" />
                Top Produtos do Mês
              </h2>
              {topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-acai-400">Nenhuma venda registrada neste mês.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {topProducts.map((p, index) => (
                    <div key={p.name} className="flex items-center justify-between rounded-xl bg-acai-50 px-4 py-3 border border-acai-100/50">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-soft ${index === 0 ? "bg-gold" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-acai-300"}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-acai-900">{p.name}</p>
                          <p className="text-xs font-semibold text-acai-500">{p.qty} unid. vendidas</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-acai-700">{formatCurrency(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
              <h2 className="font-display text-base font-bold text-acai-950">Lançar despesa</h2>
              <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
                <Input
                  label="Descrição"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Compra de açaí congelado"
                />
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-acai-900">Categoria</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border-2 border-acai-100 bg-white px-4 py-2.5 text-sm text-acai-950 outline-none focus:border-acai-500 focus:ring-4 focus:ring-acai-100"
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Data"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <Input
                  label="Valor (R$)"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
                <Button type="submit" fullWidth loading={saving}>
                  <Plus className="h-4 w-4" /> Lançar despesa
                </Button>
              </form>
            </div>

            <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
              <h2 className="font-display text-base font-bold text-acai-950">Despesas recentes</h2>
              {expenses.length === 0 ? (
                <p className="mt-4 text-sm text-acai-400">Nenhuma despesa lançada ainda.</p>
              ) : (
                <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-xl border border-acai-100 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-acai-900">{expense.description}</p>
                        <p className="text-xs text-acai-400">
                          {expense.category} · {formatDate(new Date(expense.date).getTime() + 12 * 3600 * 1000)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-red-500">
                          - {formatCurrency(expense.amount)}
                        </span>
                        <button
                          onClick={() => setDeleting(expense)}
                          className="text-acai-300 transition hover:text-red-500"
                          aria-label="Remover despesa"
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
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remover despesa?"
        description={`Remover o lançamento "${deleting?.description}"?`}
        confirmLabel="Remover"
        danger
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
