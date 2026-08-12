"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, PackageSearch } from "lucide-react";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { subscribeToCustomerOrders } from "@/lib/data/orders";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function MeusPedidosPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCustomerOrders(user.uid, setOrders, () => setOrders([]));
    return () => unsub();
  }, [user]);

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container-app flex flex-col items-center justify-center py-24 text-center">
          <p className="font-semibold text-acai-800">Você precisa entrar para ver seus pedidos</p>
          <Link href="/login?redirect=/meus-pedidos" className="mt-4">
            <Button>Entrar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="container-app py-8 sm:py-12">
        <h1 className="font-display text-2xl font-bold text-acai-950 sm:text-3xl">
          Meus pedidos
        </h1>

        {orders === null ? (
          <FullPageSpinner />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <PackageSearch className="h-14 w-14 text-acai-200" />
            <p className="font-semibold text-acai-800">Você ainda não fez nenhum pedido</p>
            <Link href="/" className="mt-2">
              <Button>Ver cardápio</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const open = openId === order.id;
              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-acai-100 bg-white"
                >
                  <button
                    onClick={() => setOpenId(open ? null : order.id)}
                    className="flex w-full items-center justify-between gap-3 p-5 text-left"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-acai-400">
                        #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-acai-500">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="font-display text-base font-bold text-acai-950">
                        {formatCurrency(order.total)}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-acai-400 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-acai-100 p-5">
                      <ul className="space-y-1.5 text-sm">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between text-acai-600">
                            <span>
                              {item.qty}x {item.name} ({item.size})
                            </span>
                            <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 space-y-1 border-t border-acai-100 pt-3 text-sm text-acai-500">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Entrega</span>
                          <span>{formatCurrency(order.deliveryFee)}</span>
                        </div>
                      </div>
                      {order.address && (
                        <p className="mt-3 text-sm text-acai-500">
                          Entrega em: {order.address.street}, {order.address.number} —{" "}
                          {order.address.district}, {order.address.city}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
