"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Bike,
  Store,
  Wallet,
  QrCode,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useCartStore } from "@/store/cart";
import { getUserProfile } from "@/lib/data/users";
import { createOrder } from "@/lib/data/orders";
import { formatCurrency } from "@/lib/format";
import type { DeliveryType, PaymentMethod } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const { items, subtotal, clear } = useCartStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [complement, setComplement] = useState("");
  const [reference, setReference] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getUserProfile(user.uid).then((profile) => {
      if (cancelled) return;
      setName(profile?.name || user.displayName || "");
      setPhone(profile?.phone || "");
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const sub = subtotal();
  const deliveryFee = deliveryType === "delivery" ? settings.deliveryFee : 0;
  const total = sub + deliveryFee;
  const belowMinimum = sub < settings.minOrder;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    if (items.length === 0 || belowMinimum) return;

    setSubmitting(true);
    try {
      const orderItems = items.map((item) => {
        const extrasTotal = item.extras.reduce((s, ex) => s + ex.price, 0);
        return {
          productId: item.productId,
          name: item.name,
          size: item.size,
          unitPrice: item.unitPrice,
          qty: item.qty,
          extras: item.extras,
          notes: item.notes,
          lineTotal: (item.unitPrice + extrasTotal) * item.qty,
        };
      });

      const ref = await createOrder({
        customerUid: user.uid,
        customerName: name,
        customerPhone: phone,
        customerEmail: user.email || "",
        deliveryType,
        address:
          deliveryType === "delivery"
            ? { street, number, district, city, complement, reference }
            : null,
        items: orderItems,
        subtotal: sub,
        deliveryFee,
        discount: 0,
        total,
        paymentMethod,
        changeFor: paymentMethod === "dinheiro" && changeFor ? Number(changeFor) : null,
        notes,
      });

      setPlacedOrderId(ref.id);
      clear();
      toast.success("Pedido enviado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrderId) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container-app flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="h-20 w-20 text-emerald-500" />
          <h1 className="mt-6 font-display text-2xl font-bold text-acai-950">
            Pedido enviado!
          </h1>
          <p className="mt-2 max-w-sm text-sm text-acai-500">
            Recebemos seu pedido <span className="font-mono font-semibold">#{placedOrderId.slice(-6).toUpperCase()}</span> e
            já vamos começar a preparar. Acompanhe o status em &quot;Meus pedidos&quot;.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/meus-pedidos">
              <Button size="lg">Acompanhar pedido</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                Voltar ao cardápio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container-app flex flex-col items-center justify-center py-24 text-center">
          <p className="font-semibold text-acai-800">Seu carrinho está vazio</p>
          <Link href="/" className="mt-4">
            <Button>Ver cardápio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="container-app py-8 sm:py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-acai-400 transition hover:text-acai-700"
        >
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>

        <h1 className="font-display text-2xl font-bold text-acai-950 sm:text-3xl">
          Finalizar pedido
        </h1>

        {!user && (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-acai-200 bg-acai-50 p-5">
            <p className="text-sm font-semibold text-acai-800">
              Entre ou crie sua conta para concluir o pedido
            </p>
            <p className="mt-1 text-sm text-acai-500">
              Assim você acompanha o status e pode repetir pedidos facilmente.
            </p>
            <Link href="/login?redirect=/checkout" className="mt-3 inline-block">
              <Button>Entrar / Criar conta</Button>
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-acai-100 bg-white p-5 sm:p-6">
              <h2 className="font-display text-base font-bold text-acai-950">
                Como você quer receber?
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                    deliveryType === "delivery"
                      ? "border-acai-600 bg-acai-50"
                      : "border-acai-100 hover:border-acai-200"
                  }`}
                >
                  <Bike className="h-6 w-6 text-acai-600" />
                  <span className="text-sm font-semibold text-acai-800">Entrega</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                    deliveryType === "pickup"
                      ? "border-acai-600 bg-acai-50"
                      : "border-acai-100 hover:border-acai-200"
                  }`}
                >
                  <Store className="h-6 w-6 text-acai-600" />
                  <span className="text-sm font-semibold text-acai-800">Retirar na loja</span>
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-acai-100 bg-white p-5 sm:p-6">
              <h2 className="font-display text-base font-bold text-acai-950">Seus dados</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Telefone / WhatsApp"
                  required
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </section>

            {deliveryType === "delivery" && (
              <section className="rounded-2xl border border-acai-100 bg-white p-5 sm:p-6">
                <h2 className="font-display text-base font-bold text-acai-950">
                  Endereço de entrega
                </h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-[2fr_1fr]">
                  <Input
                    label="Rua"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                  <Input
                    label="Número"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Bairro"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                  <Input
                    label="Cidade"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Complemento (opcional)"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                  />
                  <Input
                    label="Ponto de referência (opcional)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-acai-100 bg-white p-5 sm:p-6">
              <h2 className="font-display text-base font-bold text-acai-950">Pagamento</h2>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(
                  [
                    { key: "pix", label: "Pix", icon: QrCode },
                    { key: "dinheiro", label: "Dinheiro", icon: Wallet },
                    { key: "cartao", label: "Cartão", icon: CreditCard },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                      paymentMethod === key
                        ? "border-acai-600 bg-acai-50"
                        : "border-acai-100 hover:border-acai-200"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-acai-600" />
                    <span className="text-xs font-semibold text-acai-800">{label}</span>
                  </button>
                ))}
              </div>
              {paymentMethod === "dinheiro" && (
                <div className="mt-4">
                  <Input
                    label="Precisa de troco para quanto? (opcional)"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Ex: 50"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                  />
                </div>
              )}
              {paymentMethod === "pix" && settings.pixKey && (
                <p className="mt-4 rounded-lg bg-acai-50 px-3 py-2 text-xs text-acai-600">
                  Chave Pix: <span className="font-mono font-semibold">{settings.pixKey}</span>
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-acai-100 bg-white p-5 sm:p-6">
              <Textarea
                label="Observações do pedido (opcional)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border border-acai-100 bg-white p-5 sm:sticky sm:top-24 sm:p-6">
            <h2 className="font-display text-base font-bold text-acai-950">Resumo</h2>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.key} className="flex justify-between gap-2">
                  <span className="text-acai-500">
                    {item.qty}x {item.name} ({item.size})
                  </span>
                  <span className="shrink-0 font-medium text-acai-800">
                    {formatCurrency(
                      (item.unitPrice + item.extras.reduce((s, e) => s + e.price, 0)) * item.qty
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-acai-100 pt-3 text-sm">
              <div className="flex justify-between text-acai-500">
                <span>Subtotal</span>
                <span>{formatCurrency(sub)}</span>
              </div>
              <div className="flex justify-between text-acai-500">
                <span>Entrega</span>
                <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"}</span>
              </div>
              <div className="flex justify-between border-t border-acai-100 pt-2 font-display text-lg font-bold text-acai-950">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            {belowMinimum && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Pedido mínimo de {formatCurrency(settings.minOrder)}.
              </p>
            )}
            <Button type="submit" fullWidth size="lg" loading={submitting} disabled={belowMinimum}>
              {user ? "Confirmar pedido" : "Entrar para confirmar"}
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}
