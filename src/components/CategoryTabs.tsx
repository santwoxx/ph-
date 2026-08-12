"use client";

import clsx from "clsx";

export function CategoryTabs({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div className="sticky top-16 z-30 border-b border-acai-100/60 bg-cream/90 py-3 backdrop-blur sm:top-20">
      <div className="container-app">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={clsx(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                active === cat
                  ? "bg-acai-gradient text-white shadow-soft"
                  : "bg-white text-acai-600 ring-1 ring-acai-100 hover:ring-acai-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
