"use client";

import { MapPin, Clock, Phone, Instagram } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="mt-20 bg-acai-950 text-acai-100">
      <div className="container-app grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-xl font-bold text-white">{settings.storeName}</p>
          <p className="mt-3 max-w-xs text-sm text-acai-300">{settings.tagline}</p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-acai-300">
            Contato
          </p>
          {settings.address && (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-berry-400" /> {settings.address}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-berry-400" /> {settings.openingHours}
          </p>
          {settings.whatsapp && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-berry-400" /> {settings.whatsapp}
            </p>
          )}
          {settings.instagram && (
            <p className="flex items-center gap-2">
              <Instagram className="h-4 w-4 shrink-0 text-berry-400" /> {settings.instagram}
            </p>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-acai-300">
            Entrega
          </p>
          <p>Taxa de entrega a partir de {settings.deliveryFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p>Pedido mínimo: {settings.minOrder.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-acai-400">
        © {new Date().getFullYear()} {settings.storeName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
