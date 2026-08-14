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
  Clock,
  Tag,
  MapPin,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useCartStore } from "@/store/cart";
import { getUserProfile, updateUserProfile } from "@/lib/data/users";
import { createOrder } from "@/lib/data/orders";
import { getCoupon, redeemCoupon } from "@/lib/data/coupons";
import { formatCurrency, todayISO } from "@/lib/format";
import { checkIsStoreOpen } from "@/lib/schedule";
import type { DeliveryType, PaymentMethod, Coupon, OrderAddress } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const { items, subtotal, clear } = useCartStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Addresses
  const [savedAddresses, setSavedAddresses] = useState<(OrderAddress & { tag: string })[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | "new">("new");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [complement, setComplement] = useState("");
  const [reference, setReference] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [saveAddressTag, setSaveAddressTag] = useState("Casa");

  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledTo, setScheduledTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any>(null);

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getUserProfile(user.uid).then((profile) => {
      if (cancelled) return;
      setName(profile?.name || user.displayName || "");
      setPhone(profile?.phone || "");
      if (profile?.addresses && profile.addresses.length > 0) {
        setSavedAddresses(profile.addresses);
        handleSelectAddress(0, profile.addresses);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function handleSelectAddress(index: number | "new", addressesList = savedAddresses) {
    setSelectedAddressIndex(index);
    if (index !== "new" && addressesList[index]) {
      const addr = addressesList[index];
      setStreet(addr.street);
      setNumber(addr.number);
      setDistrict(addr.district);
      setCity(addr.city);
      setComplement(addr.complement || "");
      setReference(addr.reference || "");
    } else {
      setStreet("");
      setNumber("");
      setDistrict("");
      setCity("");
      setComplement("");
      setReference("");
    }
  }

  const sub = subtotal();

  let calculatedDeliveryFee = settings.deliveryFee;
  if (district && settings.neighborhoods && settings.neighborhoods.length > 0) {
    const matched = settings.neighborhoods.find(
      (n) => n.name.toLowerCase() === district.trim().toLowerCase()
    );
    if (matched) {
      calculatedDeliveryFee = matched.fee;
    }
  }

  const deliveryFee = deliveryType === "delivery" ? calculatedDeliveryFee : 0;
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discountAmount = (sub * appliedCoupon.value) / 100;
    } else {
      discountAmount = appliedCoupon.value;
    }
    if (discountAmount > sub) discountAmount = sub;
  }

  const total = sub + deliveryFee - discountAmount;
  const belowMinimum = sub < settings.minOrder;

  async function handleApplyCoupon() {
    setCouponError("");
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      return;
    }
    setLoadingCoupon(true);
    try {
      const coupon = await getCoupon(couponCode);
      if (!coupon) {
        setCouponError("Cupom inválido.");
        setAppliedCoupon(null);
        return;
      }
      if (!coupon.active) {
        setCouponError("Este cupom não está mais ativo.");
        setAppliedCoupon(null);
        return;
      }
      if (coupon.expiresAt && coupon.expiresAt < todayISO()) {
        setCouponError("Este cupom expirou.");
        setAppliedCoupon(null);
        return;
      }
      if (coupon.maxUses && coupon.maxUses > 0 && (coupon.usedCount ?? 0) >= coupon.maxUses) {
        setCouponError("Este cupom atingiu o limite de usos.");
        setAppliedCoupon(null);
        return;
      }
      if (coupon.minOrder && sub < coupon.minOrder) {
        setCouponError(`Pedido mínimo para este cupom é ${formatCurrency(coupon.minOrder)}`);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(coupon);
      setCouponError("");
      toast.success("Cupom aplicado!");
    } catch (err) {
      console.error(err);
      setCouponError("Erro ao verificar cupom.");
    } finally {
      setLoadingCoupon(false);
    }
  }

  // Se o usuário mexer no carrinho e ficar abaixo do mínimo do cupom
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrder && sub < appliedCoupon.minOrder) {
      setAppliedCoupon(null);
      toast.error("O cupom foi removido pois o carrinho não atinge o valor mínimo.");
    }
  }, [sub, appliedCoupon]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    
    if (!checkIsStoreOpen(settings)) {
      toast.error("A loja está fechada no momento.");
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

      const orderAddress = deliveryType === "delivery"
        ? { street, number, district, city, complement, reference }
        : null;

      if (deliveryType === "delivery" && saveAddress && selectedAddressIndex === "new") {
        const newAddress = { ...orderAddress!, tag: saveAddressTag || "Casa" };
        const newAddressesList = [...savedAddresses, newAddress];
        // Não bloqueia a criação do pedido: salvar o endereço no perfil é só
        // conveniência para a próxima compra, não precisa esperar isso pra
        // então começar a criar o pedido (o que dobrava o tempo de espera).
        updateUserProfile(user.uid, { addresses: newAddressesList }).catch((err) =>
          console.error("Falha ao salvar endereço no perfil:", err)
        );
        setSavedAddresses(newAddressesList);
      }

      const orderData = {
        customerUid: user.uid,
        customerName: name,
        customerPhone: phone,
        customerEmail: user.email || "",
        deliveryType,
        address: orderAddress,
        items: orderItems,
        subtotal: sub,
        deliveryFee,
        discount: discountAmount,
        total,
        paymentMethod,
        changeFor: paymentMethod === "dinheiro" && changeFor ? Number(changeFor) : null,
        notes,
        scheduledTo: scheduledTo || undefined,
      };

      const ref = await createOrder(orderData);

      if (appliedCoupon) {
        // Best effort: o pedido já foi criado, então uma falha aqui não pode
        // atrapalhar o cliente — só perdemos a contagem daquele uso.
        redeemCoupon(appliedCoupon.id).catch((err) => console.error("Falha ao registrar uso do cupom:", err));
      }

      setPlacedOrderDetails({ id: ref.id, ...orderData });
      clear();
      toast.success("Pedido enviado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrderDetails) {
    const wppNumber = settings.whatsapp.replace(/\D/g, "");
    
    let wppText = `Olá, vim pelo App! Acabei de fazer o pedido *#${placedOrderDetails.id.slice(-6).toUpperCase()}*.\n\n`;
    wppText += `*Resumo:*\n`;
    placedOrderDetails.items.forEach((i: any) => {
      wppText += `- ${i.qty}x ${i.name} (${i.size})\n`;
      if (i.extras.length > 0) wppText += `  + ${i.extras.map((e:any) => e.name).join(", ")}\n`;
    });
    wppText += `\n*Total:* ${formatCurrency(placedOrderDetails.total)}`;
    if (placedOrderDetails.discount > 0) {
      wppText += ` (Desconto: -${formatCurrency(placedOrderDetails.discount)})`;
    }
    wppText += `\n*Pagamento:* ${placedOrderDetails.paymentMethod}`;
    if (placedOrderDetails.changeFor) wppText += ` (Troco para ${formatCurrency(placedOrderDetails.changeFor)})`;
    if (placedOrderDetails.scheduledTo) wppText += `\n*Agendado para:* ${placedOrderDetails.scheduledTo}`;
    if (placedOrderDetails.deliveryType === "delivery") {
      wppText += `\n*Entrega:* ${placedOrderDetails.address.street}, ${placedOrderDetails.address.number}`;
    } else {
      wppText += `\n*Retirada na loja*`;
    }
    if (placedOrderDetails.notes) wppText += `\n*Obs:* ${placedOrderDetails.notes}`;
    wppText += `\n\nAguardando confirmação! Obrigado.`;

    const wppLink = `https://wa.me/55${wppNumber}?text=${encodeURIComponent(wppText)}`;

    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container-app flex flex-col items-center justify-center py-24 text-center animate-fade-in">
          <CheckCircle2 className="h-20 w-20 text-emerald-500 animate-scale-in" />
          <h1 className="mt-6 font-display text-2xl font-bold text-acai-950">
            Pedido enviado!
          </h1>
          <p className="mt-2 max-w-sm text-sm text-acai-500">
            Recebemos seu pedido <span className="font-mono font-semibold">#{placedOrderDetails.id.slice(-6).toUpperCase()}</span> e
            já vamos começar a preparar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href={wppLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600 shadow-lg shadow-emerald-500/30">
              Acompanhar pelo WhatsApp
            </a>
            <Link href="/meus-pedidos">
              <Button variant="outline" size="lg">Meus pedidos</Button>
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

              <div className="mt-6 border-t border-acai-50 pt-5">
                <h3 className="mb-3 text-sm font-bold text-acai-900">Agendar horário (Opcional)</h3>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-acai-400" />
                  <div className="flex-1">
                    <Input
                      type="time"
                      label=""
                      placeholder="O mais rápido possível"
                      value={scheduledTo}
                      onChange={(e) => setScheduledTo(e.target.value)}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-acai-400 ml-8">Se vazio, enviaremos o mais rápido possível.</p>
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
                <h2 className="font-display text-base font-bold text-acai-950 mb-3">
                  Endereço de entrega
                </h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {savedAddresses.map((addr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAddress(i)}
                        className={`flex shrink-0 flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition ${
                          selectedAddressIndex === i ? "border-acai-600 bg-acai-50" : "border-acai-100 bg-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-bold text-acai-900">
                          <MapPin className="h-3.5 w-3.5 text-acai-500" />
                          {addr.tag}
                        </span>
                        <span className="mt-1 text-xs text-acai-500 max-w-[150px] truncate">
                          {addr.street}, {addr.number}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSelectAddress("new")}
                      className={`flex shrink-0 items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition ${
                        selectedAddressIndex === "new" ? "border-acai-600 bg-acai-50 text-acai-700" : "border-acai-200 text-acai-500 hover:bg-acai-50"
                      }`}
                    >
                      + Novo endereço
                    </button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
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

                {selectedAddressIndex === "new" && (
                  <div className="mt-5 flex items-center gap-3 rounded-lg bg-acai-50 p-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-acai-800">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 rounded border-acai-300 text-acai-600 focus:ring-acai-500"
                      />
                      Salvar este endereço para a próxima vez
                    </label>
                    {saveAddress && (
                      <input
                        type="text"
                        placeholder="Nome (Ex: Trabalho)"
                        className="flex-1 rounded-md border border-acai-200 px-3 py-1.5 text-sm outline-none focus:border-acai-500 focus:ring-1 focus:ring-acai-500"
                        value={saveAddressTag}
                        onChange={(e) => setSaveAddressTag(e.target.value)}
                      />
                    )}
                  </div>
                )}
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

            <div className="border-t border-acai-100 pt-4">
              <label className="mb-2 block text-xs font-semibold text-acai-900">Cupom de desconto</label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Ex: BEMVINDO10"
                    disabled={Boolean(appliedCoupon)}
                    value={appliedCoupon ? appliedCoupon.id : couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-acai-200 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-acai-500 focus:ring-1 focus:ring-acai-500 disabled:bg-acai-50 disabled:text-acai-500"
                  />
                  {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
                </div>
                {appliedCoupon ? (
                  <Button type="button" variant="outline" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                    Remover
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={handleApplyCoupon} loading={loadingCoupon} disabled={!couponCode.trim()}>
                    Aplicar
                  </Button>
                )}
              </div>
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
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Desconto</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
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
