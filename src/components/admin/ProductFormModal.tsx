"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Plus, Trash2, ImagePlus, Loader2, Eye, EyeOff, Layers } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { createProduct, updateProduct } from "@/lib/data/products";
import { uploadProductImage, uploadExtraOptionImage, deleteImageByPath } from "@/lib/data/upload";
import type { Product, ProductSize, ProductExtra, ExtraGroup } from "@/lib/types";

function tempId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function ProductFormModal({
  open,
  onClose,
  product,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  categories: string[];
}) {
  const isEdit = Boolean(product);

  // O formulário parte direto dos dados do produto (ou dos valores padrão de
  // "novo produto"). Não precisa de useEffect para "resetar": o componente
  // pai remonta este modal com uma `key` diferente sempre que o produto em
  // edição muda ou o modal é reaberto, então esses valores iniciais já saem
  // corretos a cada abertura.
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [usingCustomCategory, setUsingCustomCategory] = useState(
    Boolean(product && !categories.includes(product.category))
  );
  const [category, setCategory] = useState(
    product && categories.includes(product.category) ? product.category : categories[0] ?? "Açaí"
  );
  const [customCategory, setCustomCategory] = useState(
    product && !categories.includes(product.category) ? product.category : ""
  );
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? 0));
  const [sizes, setSizes] = useState<ProductSize[]>(
    product ? product.sizes ?? [] : [{ label: "300ml", price: 12 }]
  );
  const [extras, setExtras] = useState<ProductExtra[]>(product?.extras ?? []);
  const [extraGroups, setExtraGroups] = useState<ExtraGroup[]>(product?.extraGroups ?? []);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingItemKey, setUploadingItemKey] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter até 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function addSize() {
    setSizes((s) => [...s, { label: "", price: 0 }]);
  }
  function updateSize(i: number, patch: Partial<ProductSize>) {
    setSizes((s) => s.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }
  function removeSize(i: number) {
    setSizes((s) => s.filter((_, idx) => idx !== i));
  }

  function addExtra() {
    setExtras((s) => [...s, { name: "", price: 0 }]);
  }
  function updateExtra(i: number, patch: Partial<ProductExtra>) {
    setExtras((s) => s.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }
  function removeExtra(i: number) {
    setExtras((s) => s.filter((_, idx) => idx !== i));
  }

  function addGroup() {
    setExtraGroups((groups) => [
      ...groups,
      { id: tempId(), name: "", required: false, minSelect: 0, maxSelect: 1, items: [] },
    ]);
  }
  function updateGroup(gi: number, patch: Partial<ExtraGroup>) {
    setExtraGroups((groups) => groups.map((g, idx) => (idx === gi ? { ...g, ...patch } : g)));
  }
  function removeGroup(gi: number) {
    setExtraGroups((groups) => groups.filter((_, idx) => idx !== gi));
  }
  function addGroupItem(gi: number) {
    setExtraGroups((groups) =>
      groups.map((g, idx) => (idx === gi ? { ...g, items: [...g.items, { name: "", price: 0 }] } : g))
    );
  }
  function updateGroupItem(gi: number, ii: number, patch: Partial<ProductExtra>) {
    setExtraGroups((groups) =>
      groups.map((g, idx) =>
        idx === gi
          ? { ...g, items: g.items.map((item, iidx) => (iidx === ii ? { ...item, ...patch } : item)) }
          : g
      )
    );
  }
  function removeGroupItem(gi: number, ii: number) {
    setExtraGroups((groups) =>
      groups.map((g, idx) => (idx === gi ? { ...g, items: g.items.filter((_, iidx) => iidx !== ii) } : g))
    );
  }

  // Comprime e salva na hora (diferente da foto principal, que só sobe ao
  // enviar o formulário) porque cada item é pequeno e independente — não
  // precisa esperar o resto do formulário pra já mostrar a miniatura.
  async function handleGroupItemImage(gi: number, ii: number, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter até 5MB.");
      return;
    }
    const key = `${gi}-${ii}`;
    setUploadingItemKey(key);
    try {
      const url = await uploadExtraOptionImage(file);
      updateGroupItem(gi, ii, { imageUrl: url });
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível processar a imagem.");
    } finally {
      setUploadingItemKey((k) => (k === key ? null : k));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const finalCategory = usingCustomCategory ? customCategory.trim() : category;
    if (!name.trim() || !finalCategory) {
      toast.error("Preencha nome e categoria.");
      return;
    }
    if (sizes.length === 0 && Number(basePrice) <= 0) {
      toast.error("Defina um preço base ou pelo menos um tamanho.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = product?.imageUrl ?? "";
      let imagePath = product?.imagePath ?? "";

      if (imageFile) {
        const folderId = product?.id ?? tempId();
        const uploaded = await uploadProductImage(folderId, imageFile);
        if (product?.imagePath) {
          await deleteImageByPath(product.imagePath);
        }
        imageUrl = uploaded.url;
        imagePath = uploaded.path;
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        imageUrl,
        imagePath,
        basePrice: Number(basePrice) || 0,
        sizes: sizes.filter((s) => s.label.trim()).map((s) => ({ ...s, price: Number(s.price) || 0 })),
        extras: extras
          .filter((ex) => ex.name.trim())
          .map((ex) => ({ ...ex, price: Number(ex.price) || 0 })),
        extraGroups: extraGroups
          .filter((g) => g.name.trim())
          .map((g) => ({
            ...g,
            minSelect: Math.max(0, Number(g.minSelect) || 0),
            maxSelect: Math.max(0, Number(g.maxSelect) || 0),
            items: g.items
              .filter((it) => it.name.trim())
              .map((it) => ({ ...it, price: Number(it.price) || 0 })),
          })),
        available,
        featured,
        order: product?.order ?? Date.now(),
      };

      if (isEdit && product) {
        await updateProduct(product.id, payload);
        toast.success("Produto atualizado!");
      } else {
        await createProduct(payload);
        toast.success("Produto cadastrado!");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar produto" : "Novo produto"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <label className="group relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-acai-200 bg-acai-50 transition hover:border-acai-400">
            {imagePreview ? (
              <Image src={imagePreview} alt="" fill className="object-cover" unoptimized />
            ) : (
              <span className="flex flex-col items-center gap-1 text-acai-400">
                <ImagePlus className="h-6 w-6" />
                <span className="text-[11px] font-medium">Adicionar foto</span>
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
              Alterar
            </div>
          </label>

          <div className="flex-1 space-y-4">
            <Input label="Nome do produto" required value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              label="Descrição"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-acai-900">Categoria</span>
            {usingCustomCategory ? (
              <div className="flex gap-2">
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nome da categoria"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setUsingCustomCategory(false)}>
                  Voltar
                </Button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setUsingCustomCategory(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full rounded-xl border-2 border-acai-100 bg-white px-4 py-2.5 text-sm text-acai-950 outline-none transition focus:border-acai-500 focus:ring-4 focus:ring-acai-100"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__new__">+ Nova categoria</option>
              </select>
            )}
          </div>

          <Input
            label="Preço base (usado se não houver tamanhos)"
            type="number"
            min={0}
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-acai-900">Tamanhos</span>
            <Button type="button" variant="ghost" size="sm" onClick={addSize}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={s.label}
                  onChange={(e) => updateSize(i, { label: e.target.value })}
                  placeholder="Ex: 500ml"
                  className="flex-1 rounded-lg border-2 border-acai-100 px-3 py-2 text-sm outline-none focus:border-acai-400"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={s.price}
                  onChange={(e) => updateSize(i, { price: Number(e.target.value) })}
                  placeholder="Preço"
                  className="w-28 rounded-lg border-2 border-acai-100 px-3 py-2 text-sm outline-none focus:border-acai-400"
                />
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-acai-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {sizes.length === 0 && (
              <p className="text-xs text-acai-400">
                Nenhum tamanho — será usado o preço base como preço único.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-acai-900">Complementos (opcional)</span>
            <Button type="button" variant="ghost" size="sm" onClick={addExtra}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {extras.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={ex.name}
                  onChange={(e) => updateExtra(i, { name: e.target.value })}
                  placeholder="Ex: Granola extra"
                  className="flex-1 rounded-lg border-2 border-acai-100 px-3 py-2 text-sm outline-none focus:border-acai-400"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ex.price}
                  onChange={(e) => updateExtra(i, { price: Number(e.target.value) })}
                  placeholder="Preço"
                  className="w-28 rounded-lg border-2 border-acai-100 px-3 py-2 text-sm outline-none focus:border-acai-400"
                />
                <button
                  type="button"
                  onClick={() => updateExtra(i, { available: ex.available === false ? true : false })}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${ex.available !== false ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-acai-400 bg-acai-100 hover:bg-acai-200'}`}
                  title={ex.available !== false ? "Disponível" : "Esgotado"}
                >
                  {ex.available !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => removeExtra(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-acai-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="flex items-center gap-1.5 text-sm font-bold text-acai-900">
                <Layers className="h-4 w-4" /> Monte o copo (opcional)
              </span>
              <p className="text-xs text-acai-400">
                Grupos com limite de escolha, no estilo iFood — ex: &quot;Creme (até 2)&quot;, &quot;Frutas (até 3)&quot;.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={addGroup}>
              <Plus className="h-3.5 w-3.5" /> Novo grupo
            </Button>
          </div>
          <div className="space-y-3">
            {extraGroups.map((group, gi) => (
              <div key={group.id} className="rounded-xl border-2 border-acai-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={group.name}
                    onChange={(e) => updateGroup(gi, { name: e.target.value })}
                    placeholder="Nome do grupo (ex: Escolha o creme)"
                    className="min-w-[180px] flex-1 rounded-lg border-2 border-acai-100 px-3 py-2 text-sm font-semibold outline-none focus:border-acai-400"
                  />
                  <label className="flex items-center gap-1.5 text-xs font-medium text-acai-700">
                    <input
                      type="checkbox"
                      checked={group.required}
                      onChange={(e) => updateGroup(gi, { required: e.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-acai-600"
                    />
                    Obrigatório
                  </label>
                  <label className="flex items-center gap-1 text-xs font-medium text-acai-500">
                    mín.
                    <input
                      type="number"
                      min={0}
                      value={group.minSelect}
                      onChange={(e) => updateGroup(gi, { minSelect: Number(e.target.value) })}
                      className="w-14 rounded-lg border-2 border-acai-100 px-2 py-1.5 text-xs outline-none focus:border-acai-400"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs font-medium text-acai-500">
                    máx. (0 = sem limite)
                    <input
                      type="number"
                      min={0}
                      value={group.maxSelect}
                      onChange={(e) => updateGroup(gi, { maxSelect: Number(e.target.value) })}
                      className="w-14 rounded-lg border-2 border-acai-100 px-2 py-1.5 text-xs outline-none focus:border-acai-400"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeGroup(gi)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-acai-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2.5 space-y-2">
                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2 pl-2">
                      <label className="group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-acai-200 bg-acai-50 transition hover:border-acai-400">
                        {uploadingItemKey === `${gi}-${ii}` ? (
                          <Loader2 className="h-4 w-4 animate-spin text-acai-400" />
                        ) : item.imageUrl ? (
                          <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <ImagePlus className="h-4 w-4 text-acai-300" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) handleGroupItemImage(gi, ii, file);
                          }}
                        />
                      </label>
                      <input
                        value={item.name}
                        onChange={(e) => updateGroupItem(gi, ii, { name: e.target.value })}
                        placeholder="Ex: Leite ninho"
                        className="flex-1 rounded-lg border-2 border-acai-100 px-3 py-2 text-sm outline-none focus:border-acai-400"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateGroupItem(gi, ii, { price: Number(e.target.value) })}
                        placeholder="Preço"
                        className="w-28 rounded-lg border-2 border-acai-100 px-3 py-2 text-sm outline-none focus:border-acai-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeGroupItem(gi, ii)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-acai-300 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => addGroupItem(gi)}>
                    <Plus className="h-3.5 w-3.5" /> Item do grupo
                  </Button>
                </div>
              </div>
            ))}
            {extraGroups.length === 0 && (
              <p className="text-xs text-acai-400">
                Nenhum grupo criado — o produto usa só a lista simples de complementos acima.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded accent-acai-600"
            />
            <span className="text-sm font-medium text-acai-900">Destaque na vitrine</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="h-4 w-4 rounded accent-acai-600"
            />
            <span className="text-sm font-medium text-acai-900">Produto disponível para venda</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-acai-100 pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar alterações" : "Cadastrar produto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
