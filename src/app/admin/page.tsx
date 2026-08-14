"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  Wallet,
  PiggyBank,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { subscribeToAllOrders } from "@/lib/data/orders";
import { subscribeToExpenses } from "@/lib/data/expenses";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order, Expense } from "@/lib/types";

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

const PENDING_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery"];

export default function AdminDashboardPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);

  useEffect(() => {
    // O painel só mostra hoje, o mês atual e os últimos 7 dias — 90 dias de
    // margem é mais que suficiente e evita baixar o histórico inteiro de
    // pedidos/despesas toda vez que o Dashboard abre.
    const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const sinceDate = new Date(since).toISOString().slice(0, 10);
    const unsubOrders = subscribeToAllOrders(setOrders, () => setOrders([]), { sinceMillis: since });
    const unsubExpenses = subscribeToExpenses(setExpenses, () => setExpenses([]), { sinceDate });
    return () => {
      unsubOrders();
      unsubExpenses();
    };
  }, []);

  const stats = useMemo(() => {
    if (!orders) return null;
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const valid = orders.filter((o) => o.status !== "cancelled");

    const todayRevenue = valid
      .filter((o) => o.createdAt >= todayStart)
      .reduce((s, o) => s + o.total, 0);

    const monthOrders = valid.filter((o) => o.createdAt >= monthStart);
    const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);

    const pendingCount = orders.filter((o) => PENDING_STATUSES.includes(o.status)).length;
    const avgTicket = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0;

    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = startOfDay(day);
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const total = valid
        .filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd)
        .reduce((s, o) => s + o.total, 0);
      days.push({
        label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total,
      });
    }

    const monthExpenses = (expenses ?? [])
      .filter((e) => new Date(e.date).getTime() >= monthStart)
      .reduce((s, e) => s + e.amount, 0);

    return {
      todayRevenue,
      monthRevenue,
      pendingCount,
      avgTicket,
      days,
      monthExpenses,
      profit: monthRevenue - monthExpenses,
      recent: orders.slice(0, 6),
    };
  }, [orders, expenses]);

  if (!stats) return <Spinner label="Carregando painel..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-acai-950">Visão geral</h1>
        <p className="text-sm text-acai-400">Acompanhe as vendas e o financeiro da loja em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento hoje"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          tone="emerald"
        />
        <StatCard
          label="Faturamento no mês"
          value={formatCurrency(stats.monthRevenue)}
          icon={TrendingUp}
          tone="acai"
        />
        <StatCard
          label="Pedidos em andamento"
          value={String(stats.pendingCount)}
          icon={Clock}
          tone="gold"
        />
        <StatCard
          label="Ticket médio (mês)"
          value={formatCurrency(stats.avgTicket)}
          icon={ShoppingBag}
          tone="berry"
        />
      </div>

      {Boolean(settings.monthlyGoal) && settings.monthlyGoal! > 0 && (
        <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-amber-600">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-acai-950">Meta do mês</h2>
                <p className="text-xs text-acai-400">
                  {formatCurrency(stats.monthRevenue)} de {formatCurrency(settings.monthlyGoal!)}
                </p>
              </div>
            </div>
            <span className="font-display text-lg font-extrabold text-acai-700">
              {Math.min(100, Math.round((stats.monthRevenue / settings.monthlyGoal!) * 100))}%
            </span>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-acai-50">
            <div
              className="h-full rounded-full bg-acai-gradient transition-all duration-500"
              style={{
                width: `${Math.min(100, (stats.monthRevenue / settings.monthlyGoal!) * 100)}%`,
              }}
            />
          </div>
          {stats.monthRevenue >= settings.monthlyGoal! ? (
            <p className="mt-2 text-xs font-semibold text-emerald-600">
              🎉 Meta batida! Configure uma nova em Configurações.
            </p>
          ) : (
            <p className="mt-2 text-xs text-acai-400">
              Faltam {formatCurrency(settings.monthlyGoal! - stats.monthRevenue)} para bater a meta.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-base font-bold text-acai-950">
            Faturamento — últimos 7 dias
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.days} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7f2fc9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7f2fc9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f0e6fa" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9b7cb8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9b7cb8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e9d9f8" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#7f2fc9"
                  strokeWidth={2.5}
                  fill="url(#revenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-acai-400">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Despesas do mês</span>
            </div>
            <p className="mt-2 font-display text-xl font-extrabold text-acai-950">
              {formatCurrency(stats.monthExpenses)}
            </p>
          </div>
          <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-acai-400">
              <PiggyBank className="h-4 w-4" />
              <span className="text-sm font-medium">Lucro do mês</span>
            </div>
            <p
              className={`mt-2 font-display text-xl font-extrabold ${
                stats.profit >= 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {formatCurrency(stats.profit)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold text-acai-950">Pedidos recentes</h2>
        {stats.recent.length === 0 ? (
          <p className="mt-4 text-sm text-acai-400">Nenhum pedido ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-acai-300">
                  <th className="pb-2 font-semibold">Pedido</th>
                  <th className="pb-2 font-semibold">Cliente</th>
                  <th className="pb-2 font-semibold">Data</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-acai-50">
                {stats.recent.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2.5 font-mono text-xs font-semibold text-acai-500">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-2.5 text-acai-800">{order.customerName}</td>
                    <td className="py-2.5 text-acai-500">{formatDateTime(order.createdAt)}</td>
                    <td className="py-2.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-2.5 text-right font-semibold text-acai-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
