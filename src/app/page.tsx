"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ProductCard, ProductSkeleton } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";

import { subscribeToProducts } from "@/lib/data/products";
import { useSettings } from "@/context/SettingsContext";
import { checkIsStoreOpen } from "@/lib/schedule";
import type { Product } from "@/lib/types";
import { PackageSearch } from "lucide-react";

export default function HomePage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [selected, setSelected] = useState<Product | null>(null);

  // O horário de funcionamento depende da hora local de quem está vendo a
  // página — o servidor (Vercel, em UTC) e o navegador do visitante quase
  // sempre calculam horas diferentes. Por isso só calculamos isso depois
  // que o componente já montou no navegador: antes disso assumimos "aberta"
  // para o HTML do servidor bater com a primeira renderização do client e
  // evitar erro de hidratação.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isStoreOpen = useMemo(() => {
    if (!mounted) return true;
    return checkIsStoreOpen(settings);
  }, [mounted, settings]);

  useEffect(() => {
    const unsub = subscribeToProducts(setProducts, () => setProducts([]));
    return () => unsub();
  }, []);

  const categories = useMemo(() => {
    const fromSettings = settings.categories ?? [];
    const fromProducts = Array.from(new Set((products ?? []).map((p) => p.category)));
    const merged = Array.from(new Set([...fromSettings, ...fromProducts]));
    return ["Todos", ...merged];
  }, [settings.categories, products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const available = products;
    if (activeCategory === "Todos") return available;
    return available.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="min-h-screen bg-cream dark:bg-acai-950">
      <Header />
      {!isStoreOpen && (
        <div className="bg-red-500 py-2.5 text-center text-sm font-medium text-white shadow dark:bg-red-900">
          Loja fechada no momento. Você ainda pode ver nosso cardápio!
        </div>
      )}
      <Hero />

      <main id="cardapio" className="relative">
        <CategoryTabs categories={categories} active={activeCategory} onSelect={setActiveCategory} />

        <div className="container-app py-10 sm:py-14">
          {products === null ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <PackageSearch className="h-14 w-14 text-acai-200 dark:text-acai-700" />
              <p className="font-semibold text-acai-800 dark:text-acai-100">Nenhum produto por aqui ainda</p>
              <p className="text-sm text-acai-400 dark:text-acai-400">
                Assim que os produtos forem cadastrados, eles aparecem aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms`, opacity: 0 }}
                >
                  <ProductCard product={product} onSelect={setSelected} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <ProductModal
        key={selected ? selected.id : "closed"}
        product={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
