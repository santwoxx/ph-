"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, PackageSearch, RotateCcw, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { subscribeToCustomerOrders, updateOrder } from "@/lib/data/orders";
import { getProduct } from "@/lib/data/products";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useCartStore } from "@/store/cart";

export default function MeusPedidosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [repeatingId, setRepeatingId] = useState<string | null>(null);
  const { clear, addItem } = useCartStore();

  const [ratingOpen, setRatingOpen] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCustomerOrders(user.uid, setOrders, () => setOrders([]));
    return () => unsub();
  }, [user]);

  // Não readicionamos os itens direto do histórico: preço, disponibilidade
  // e até o produto em si podem ter mudado desde a compra original. Por
  // isso buscamos o estado atual de cada produto no Firestore antes de
  // montar o carrinho, e avisamos o cliente se algo não estiver mais
  // disponível — em vez de deixá-lo fechar um pedido com valores errados.
  async function handleRepeatOrder(order: Order) {
    setRepeatingId(order.id);
    try {
      const current = await Promise.all(
        order.items.map((item) => getProduct(item.productId))
      );

      clear();
      const unavailable: string[] = [];
      let addedCount = 0;

      order.items.forEach((item, i) => {
        const product = current[i];
        if (!product || !product.available) {
          unavailable.push(item.name);
          return;
        }
        const matchedSize = product.sizes.find((s) => s.label === item.size);
        const size = matchedSize ?? product.sizes[0] ?? { label: "Único", price: product.basePrice };
        addItem({
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          size: size.label,
          unitPrice: size.price,
          qty: item.qty,
          extras: item.extras,
          notes: item.notes,
        });
        addedCount++;
      });

      if (addedCount === 0) {
        toast.error("Nenhum item deste pedido está disponível no momento.");
        return;
      }
      if (unavailable.length > 0) {
        toast(`Alguns itens não estão mais disponíveis e foram removidos: ${unavailable.join(", ")}`, {
          icon: "⚠️",
          duration: 6000,
        });
      }
      router.push("/checkout");
      toast.success("Itens do pedido recuperados no carrinho com os preços atuais!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível repetir o pedido agora. Tente novamente.");
    } finally {
      setRepeatingId(null);
    }
  }

  async function handleSubmitRating(orderId: string) {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    setSubmittingRating(true);
    try {
      await updateOrder(orderId, { rating, feedback: feedback.trim() });
      toast.success("Obrigado pela sua avaliação!");
      setRatingOpen(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar a avaliação.");
    } finally {
      setSubmittingRating(false);
    }
  }

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return (
      <div className="min-h-screen bg-cream dark:bg-acai-950">
        <Header />
        <div className="container-app flex flex-col items-center justify-center py-24 text-center">
          <p className="font-semibold text-acai-800 dark:text-acai-100">Você precisa entrar para ver seus pedidos</p>
          <Link href="/login?redirect=/meus-pedidos" className="mt-4">
            <Button>Entrar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-acai-950">
      <Header />
      <div className="container-app py-8 sm:py-12">
        <h1 className="font-display text-2xl font-bold text-acai-950 dark:text-white sm:text-3xl">
          Meus pedidos
        </h1>

        {orders === null ? (
          <FullPageSpinner />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <PackageSearch className="h-14 w-14 text-acai-200 dark:text-acai-700" />
            <p className="font-semibold text-acai-800 dark:text-acai-100">Você ainda não fez nenhum pedido</p>
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
                  className="overflow-hidden rounded-2xl border border-acai-100 bg-white dark:border-acai-800 dark:bg-acai-900"
                >
                  <button
                    onClick={() => setOpenId(open ? null : order.id)}
                    className="flex w-full items-center justify-between gap-3 p-5 text-left"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-acai-400 dark:text-acai-500">
                        #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-acai-500 dark:text-acai-400">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="font-display text-base font-bold text-acai-950 dark:text-white">
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
                    <div className="border-t border-acai-100 p-5 dark:border-acai-800">
                      <div className="mb-8 hidden sm:block">
                        <OrderTimeline currentStatus={order.status} />
                      </div>
                      <div className="mb-6 sm:hidden">
                        <OrderTimeline currentStatus={order.status} />
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between text-acai-600 dark:text-acai-300">
                            <span>
                              {item.qty}x {item.name} ({item.size})
                            </span>
                            <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 space-y-1 border-t border-acai-100 pt-3 text-sm text-acai-500 dark:border-acai-800 dark:text-acai-400">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Entrega</span>
                          <span>{formatCurrency(order.deliveryFee)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Desconto</span>
                            <span>-{formatCurrency(order.discount)}</span>
                          </div>
                        )}
                      </div>
                      {order.address && (
                        <p className="mt-3 text-sm text-acai-500 dark:text-acai-400">
                          Entrega em: {order.address.street}, {order.address.number} —{" "}
                          {order.address.district}, {order.address.city}
                        </p>
                      )}

                      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-acai-100 pt-4 dark:border-acai-800">
                        <button
                          onClick={() => handleRepeatOrder(order)}
                          disabled={repeatingId === order.id}
                          className="flex items-center gap-2 rounded-xl bg-acai-50 px-4 py-2 text-sm font-semibold text-acai-700 transition hover:bg-acai-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-acai-800 dark:text-acai-200 dark:hover:bg-acai-700"
                        >
                          <RotateCcw className={`h-4 w-4 ${repeatingId === order.id ? "animate-spin" : ""}`} />
                          {repeatingId === order.id ? "Verificando..." : "Repetir pedido"}
                        </button>

                        {order.status === "delivered" && (
                          <div>
                            {order.rating ? (
                              <div className="flex items-center gap-1.5 text-sm text-acai-500 dark:text-acai-400">
                                <span className="font-semibold">Sua avaliação:</span>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(star => (
                                    <Star key={star} className={`h-4 w-4 ${order.rating! >= star ? 'fill-amber-500 text-amber-500' : 'text-acai-200 dark:text-acai-700'}`} />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setRatingOpen(ratingOpen === order.id ? null : order.id);
                                  setRating(0);
                                  setFeedback("");
                                }}
                                className="text-sm font-semibold text-acai-600 underline transition hover:text-acai-800 dark:text-acai-400 dark:hover:text-acai-300"
                              >
                                Avaliar pedido
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {ratingOpen === order.id && (
                        <div className="mt-4 rounded-xl border border-acai-100 bg-acai-50 p-4 animate-fade-in dark:border-acai-800 dark:bg-acai-900/50">
                          <p className="mb-2 text-sm font-bold text-acai-900 dark:text-white">Como foi sua experiência?</p>
                          <div className="flex gap-1 mb-4">
                            {[1,2,3,4,5].map(star => (
                              <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition hover:scale-110"
                              >
                                <Star className={`h-8 w-8 ${rating >= star ? 'fill-amber-500 text-amber-500' : 'text-acai-200 dark:text-acai-700'}`} />
                              </button>
                            ))}
                          </div>
                          <Textarea 
                            label="Comentário (opcional)" 
                            rows={2} 
                            value={feedback} 
                            onChange={(e) => setFeedback(e.target.value)} 
                          />
                          <div className="mt-3 flex justify-end">
                            <Button 
                              onClick={() => handleSubmitRating(order.id)}
                              loading={submittingRating}
                            >
                              Enviar avaliação
                            </Button>
                          </div>
                        </div>
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
