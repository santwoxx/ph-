"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { Spinner } from "@/components/ui/Spinner";
import { subscribeToProducts } from "@/lib/data/products";
import { useSettings } from "@/context/SettingsContext";
import type { Product } from "@/lib/types";
import { PackageSearch } from "lucide-react";

export default function HomePage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [selected, setSelected] = useState<Product | null>(null);

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
    <div className="min-h-screen bg-cream">
      <Header />
      <Hero />

      <main id="cardapio" className="relative">
        <CategoryTabs categories={categories} active={activeCategory} onSelect={setActiveCategory} />

        <div className="container-app py-10 sm:py-14">
          {products === null ? (
            <Spinner label="Carregando cardápio..." />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <PackageSearch className="h-14 w-14 text-acai-200" />
              <p className="font-semibold text-acai-800">Nenhum produto por aqui ainda</p>
              <p className="text-sm text-acai-400">
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
