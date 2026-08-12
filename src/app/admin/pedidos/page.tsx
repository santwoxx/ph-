"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ClipboardList, Phone, MapPin, Bike, Store } from "lucide-react";
import clsx from "clsx";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { subscribeToAllOrders, updateOrderStatus } from "@/lib/data/orders";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  type Order,
  type OrderStatus,
} from "@/lib/types";

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Aguardando" },
  { key: "confirmed", label: "Confirmado" },
  { key: "preparing", label: "Em preparo" },
  { key: "out_for_delivery", label: "Saiu p/ entrega" },
  { key: "delivered", label: "Entregue" },
  { key: "cancelled", label: "Cancelado" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllOrders(setOrders, () => setOrders([]));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Pedido atualizado para "${ORDER_STATUS_LABEL[status]}"`);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível atualizar o pedido.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-acai-950">Pedidos</h1>
        <p className="text-sm text-acai-400">Acompanhe e atualize o status dos pedidos em tempo real.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              filter === f.key
                ? "bg-acai-gradient text-white shadow-soft"
                : "bg-white text-acai-600 ring-1 ring-acai-100 hover:ring-acai-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders === null ? (
        <Spinner label="Carregando pedidos..." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-acai-200 bg-white py-20 text-center">
          <ClipboardList className="h-14 w-14 text-acai-200" />
          <p className="font-semibold text-acai-800">Nenhum pedido por aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const open = openId === order.id;
            const flowIndex = ORDER_STATUS_FLOW.indexOf(order.status);
            const nextStatus =
              flowIndex >= 0 && flowIndex < ORDER_STATUS_FLOW.length - 1
                ? ORDER_STATUS_FLOW[flowIndex + 1]
                : null;

            return (
              <div key={order.id} className="overflow-hidden rounded-2xl border border-acai-100 bg-white shadow-card">
                <button
                  onClick={() => setOpenId(open ? null : order.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        order.deliveryType === "delivery" ? "bg-acai-100 text-acai-700" : "bg-gold/15 text-amber-700"
                      )}
                    >
                      {order.deliveryType === "delivery" ? <Bike className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-mono text-xs font-semibold text-acai-400">
                        #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm font-semibold text-acai-900">{order.customerName}</p>
                    </div>
                  </div>
                  <p className="text-xs text-acai-400">{formatDateTime(order.createdAt)}</p>
                  <StatusBadge status={order.status} />
                  <span className="font-display text-base font-bold text-acai-950">
                    {formatCurrency(order.total)}
                  </span>
                  <ChevronDown className={clsx("h-4 w-4 text-acai-400 transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="grid gap-6 border-t border-acai-100 p-5 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                      <p className="text-sm font-bold text-acai-900">Itens do pedido</p>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between text-acai-600">
                            <span>
                              {item.qty}x {item.name} ({item.size})
                              {item.extras.length > 0 && (
                                <span className="text-acai-400"> + {item.extras.map((e) => e.name).join(", ")}</span>
                              )}
                            </span>
                            <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                          </li>
                        ))}
                      </ul>
                      {order.notes && (
                        <p className="mt-3 rounded-lg bg-acai-50 px-3 py-2 text-xs text-acai-600">
                          Obs: {order.notes}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2 text-sm text-acai-600">
                        <Phone className="h-4 w-4 text-acai-400" /> {order.customerPhone}
                      </div>
                      {order.address && (
                        <div className="mt-2 flex items-start gap-2 text-sm text-acai-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-acai-400" />
                          <span>
                            {order.address.street}, {order.address.number} — {order.address.district},{" "}
                            {order.address.city}
                            {order.address.complement && ` (${order.address.complement})`}
                          </span>
                        </div>
                      )}
                      <p className="mt-2 text-sm text-acai-600">
                        Pagamento: <span className="font-medium">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
                        {order.changeFor ? ` (troco para ${formatCurrency(order.changeFor)})` : ""}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl bg-acai-50 p-4 text-sm">
                        <div className="flex justify-between text-acai-500">
                          <span>Subtotal</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-acai-500">
                          <span>Entrega</span>
                          <span>{formatCurrency(order.deliveryFee)}</span>
                        </div>
                        <div className="mt-1 flex justify-between border-t border-acai-100 pt-1 font-bold text-acai-900">
                          <span>Total</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-bold text-acai-900">Atualizar status</p>
                        <div className="flex flex-wrap gap-2">
                          {nextStatus && (
                            <button
                              disabled={updatingId === order.id}
                              onClick={() => handleStatusChange(order, nextStatus)}
                              className="rounded-xl bg-acai-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-60"
                            >
                              Avançar para &quot;{ORDER_STATUS_LABEL[nextStatus]}&quot;
                            </button>
                          )}
                          {order.status !== "cancelled" && order.status !== "delivered" && (
                            <button
                              disabled={updatingId === order.id}
                              onClick={() => handleStatusChange(order, "cancelled")}
                              className="rounded-xl border-2 border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                            >
                              Cancelar pedido
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
