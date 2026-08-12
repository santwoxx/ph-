"use client";

import Image from "next/image";
import { Star, Truck, Clock3 } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export function Hero() {
  const { settings } = useSettings();

  return (
    <section className="relative overflow-hidden bg-acai-radial">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-berry-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 animate-float rounded-full bg-acai-400/20 blur-2xl" />

      <div className="container-app relative flex flex-col items-center gap-10 py-16 sm:py-20 lg:flex-row lg:py-28">
        <div className="max-w-xl text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-gold ring-1 ring-white/20">
            <Star className="h-3.5 w-3.5 fill-gold" /> O favorito da vizinhança
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            {settings.storeName}
          </h1>
          <p className="mt-5 text-balance text-base text-acai-100/90 sm:text-lg">
            {settings.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15">
              <Truck className="h-4 w-4 text-gold" /> Entrega rápida
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15">
              <Clock3 className="h-4 w-4 text-gold" /> {settings.openingHours}
            </div>
          </div>

          <a
            href="#cardapio"
            className="mt-9 inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3.5 font-display text-base font-bold text-acai-700 shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Ver cardápio
          </a>
        </div>

        <div className="relative flex w-full max-w-md flex-1 items-center justify-center">
          <div className="absolute h-64 w-64 rounded-full bg-white/10 blur-2xl sm:h-80 sm:w-80" />
          {settings.bannerUrl ? (
            <div className="relative aspect-square w-full max-w-sm animate-float overflow-hidden rounded-[2.5rem] shadow-2xl ring-4 ring-white/20">
              <Image
                src={settings.bannerUrl}
                alt={settings.storeName}
                fill
                sizes="(min-width: 1024px) 420px, 80vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="relative flex aspect-square w-full max-w-sm animate-float items-center justify-center rounded-[2.5rem] bg-white/10 text-[120px] shadow-2xl ring-4 ring-white/20 backdrop-blur">
              🍇🥣
            </div>
          )}
        </div>
      </div>

      <svg
        className="relative block w-full text-cream"
        viewBox="0 0 1440 60"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0,32 C240,60 480,60 720,40 C960,20 1200,0 1440,20 L1440,60 L0,60 Z" />
      </svg>
    </section>
  );
}
