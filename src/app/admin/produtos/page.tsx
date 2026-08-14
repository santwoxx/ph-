"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, PackageSearch, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/Modal";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { subscribeToProducts, deleteProduct, updateProduct } from "@/lib/data/products";
import { deleteImageByPath } from "@/lib/data/upload";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  useEffect(() => {
    const unsub = subscribeToProducts(setProducts, () => setProducts([]));
    return () => unsub();
  }, []);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  // Fecha o diálogo na hora — a lista já reflete a exclusão imediatamente
  // (o Firestore aplica a escrita no cache local antes mesmo de confirmar
  // com o servidor), então não faz sentido segurar a tela esperando a
  // confirmação de rede. Se a exclusão falhar de verdade, o erro aparece
  // depois em um toast, sem travar a interação.
  function confirmDelete() {
    if (!deleting) return;
    const product = deleting;
    setDeleting(null);
    deleteProduct(product.id)
      .then(() => {
        if (product.imagePath) return deleteImageByPath(product.imagePath);
      })
      .then(() => toast.success("Produto removido."))
      .catch((err) => {
        console.error(err);
        toast.error(`Não foi possível remover "${product.name}". Tente novamente.`);
      });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-acai-950">Produtos</h1>
          <p className="text-sm text-acai-400">Cadastre, edite e organize o cardápio.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      {products === null ? (
        <Spinner label="Carregando produtos..." />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-acai-200 bg-white py-20 text-center">
          <PackageSearch className="h-14 w-14 text-acai-200" />
          <p className="font-semibold text-acai-800">Nenhum produto cadastrado</p>
          <p className="text-sm text-acai-400">Clique em &quot;Novo produto&quot; para começar seu cardápio.</p>
          <Button onClick={openNew} className="mt-2">
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const startingPrice =
              product.sizes.length > 0
                ? Math.min(...product.sizes.map((s) => s.price))
                : product.basePrice;
            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-acai-100 bg-white shadow-card"
              >
                <div className="relative aspect-[4/3] w-full bg-acai-50">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🍨</div>
                  )}
                  {!product.available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-acai-900">
                        Indisponível
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-acai-400">
                    {product.category}
                  </p>
                  <h3 className="mt-0.5 font-display text-sm font-bold text-acai-950">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-acai-600">
                    {formatCurrency(startingPrice)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" fullWidth onClick={() => openEdit(product)}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateProduct(product.id, { available: !product.available })}
                      title={product.available ? "Pausar vendas" : "Retomar vendas"}
                    >
                      {product.available ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-acai-400" />}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleting(product)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductFormModal
        key={formOpen ? editing?.id ?? "new" : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        categories={settings.categories}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remover produto?"
        description={`Tem certeza que deseja remover "${deleting?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
