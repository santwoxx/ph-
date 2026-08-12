"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ImagePlus, Plus, Trash2, ShieldCheck, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { saveSettings } from "@/lib/data/settings";
import { uploadSettingsImage } from "@/lib/data/upload";
import { subscribeToAdmins, addAdmin, removeAdmin, type AdminEntry } from "@/lib/data/admins";
import { formatDate } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const { settings, loading } = useSettings();
  const { user } = useAuth();

  const [form, setForm] = useState<StoreSettings>(settings);
  // Carrega o formulário com os dados reais assim que o primeiro snapshot
  // do Firestore chega — só uma vez, para não sobrescrever o que o admin
  // já está digitando caso o documento mude de novo enquanto ele edita.
  const [hydrated, setHydrated] = useState(false);
  if (!loading && !hydrated) {
    setHydrated(true);
    setForm(settings);
  }

  const [newCategory, setNewCategory] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [admins, setAdmins] = useState<AdminEntry[] | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState<AdminEntry | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAdmins(setAdmins, () => setAdmins([]));
    return () => unsub();
  }, []);

  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSettings(form);
      toast.success("Configurações salvas!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar as configurações.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleImageUpload(kind: "logo" | "banner", file: File) {
    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingBanner;
    setUploading(true);
    try {
      const { url } = await uploadSettingsImage(kind, file);
      update(kind === "logo" ? "logoUrl" : "bannerUrl", url);
      toast.success("Imagem enviada! Não esqueça de salvar.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  function addCategory() {
    const value = newCategory.trim();
    if (!value || form.categories.includes(value)) return;
    update("categories", [...form.categories, value]);
    setNewCategory("");
  }

  function removeCategory(cat: string) {
    update(
      "categories",
      form.categories.filter((c) => c !== cat)
    );
  }

  async function handleAddAdmin(e: FormEvent) {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setAddingAdmin(true);
    try {
      await addAdmin(email, user?.email || "");
      toast.success(`"${email}" agora pode acessar o painel.`);
      setNewAdminEmail("");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível adicionar o administrador.");
    } finally {
      setAddingAdmin(false);
    }
  }

  async function confirmRemoveAdmin() {
    if (!removingAdmin) return;
    setRemoveLoading(true);
    try {
      await removeAdmin(removingAdmin.email);
      toast.success("Administrador removido.");
      setRemovingAdmin(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível remover.");
    } finally {
      setRemoveLoading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-acai-950">Configurações</h1>
        <p className="text-sm text-acai-400">Dados da loja, entrega e administradores do painel.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <section className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-display text-base font-bold text-acai-950">Identidade visual</h2>
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-acai-900">Logo</span>
              <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-acai-200 bg-acai-50 hover:border-acai-400">
                {form.logoUrl ? (
                  <Image src={form.logoUrl} alt="Logo" fill className="object-cover" unoptimized />
                ) : (
                  <ImagePlus className="h-6 w-6 text-acai-400" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => e.target.files?.[0] && handleImageUpload("logo", e.target.files[0])}
                />
              </label>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-acai-900">Banner (hero)</span>
              <label className="group relative flex h-24 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-acai-200 bg-acai-50 hover:border-acai-400">
                {form.bannerUrl ? (
                  <Image src={form.bannerUrl} alt="Banner" fill className="object-cover" unoptimized />
                ) : (
                  <ImagePlus className="h-6 w-6 text-acai-400" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingBanner}
                  onChange={(e) => e.target.files?.[0] && handleImageUpload("banner", e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-display text-base font-bold text-acai-950">Dados da loja</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Nome da loja" required value={form.storeName} onChange={(e) => update("storeName", e.target.value)} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
            <Input label="Instagram" value={form.instagram} onChange={(e) => update("instagram", e.target.value ?? "")} />
            <Input label="Endereço" value={form.address} onChange={(e) => update("address", e.target.value)} />
            <Input label="Horário de funcionamento" value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} />
            <Input label="Chave Pix" value={form.pixKey} onChange={(e) => update("pixKey", e.target.value ?? "")} />
          </div>
          <div className="mt-4">
            <Input
              label="Frase de destaque (tagline)"
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
            />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-acai-800">
            <input
              type="checkbox"
              checked={form.isOpen}
              onChange={(e) => update("isOpen", e.target.checked)}
              className="h-4 w-4 rounded accent-acai-600"
            />
            Loja aberta para pedidos
          </label>
        </section>

        <section className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-display text-base font-bold text-acai-950">Entrega</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Taxa de entrega (R$)"
              type="number"
              min={0}
              step="0.01"
              value={form.deliveryFee}
              onChange={(e) => update("deliveryFee", Number(e.target.value))}
            />
            <Input
              label="Pedido mínimo (R$)"
              type="number"
              min={0}
              step="0.01"
              value={form.minOrder}
              onChange={(e) => update("minOrder", Number(e.target.value))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-display text-base font-bold text-acai-950">Meta de vendas</h2>
          <p className="mt-1 text-sm text-acai-400">
            Definir uma meta mensal mostra uma barra de progresso na Visão geral do painel.
          </p>
          <div className="mt-4">
            <Input
              label="Meta de faturamento do mês (R$)"
              type="number"
              min={0}
              step="0.01"
              placeholder="Ex: 15000"
              value={form.monthlyGoal ?? 0}
              onChange={(e) => update("monthlyGoal", Number(e.target.value))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-display text-base font-bold text-acai-950">Categorias do cardápio</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.categories.map((cat) => (
              <span
                key={cat}
                className="flex items-center gap-1.5 rounded-full bg-acai-50 px-3 py-1.5 text-sm font-medium text-acai-700 ring-1 ring-acai-100"
              >
                {cat}
                <button type="button" onClick={() => removeCategory(cat)} className="text-acai-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nova categoria"
              className="flex-1 rounded-xl border-2 border-acai-100 px-4 py-2.5 text-sm outline-none focus:border-acai-400"
            />
            <Button type="button" variant="outline" onClick={addCategory}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </section>

        <Button type="submit" size="lg" loading={savingSettings}>
          <Save className="h-4 w-4" /> Salvar configurações
        </Button>
      </form>

      <section className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-acai-600" />
          <h2 className="font-display text-base font-bold text-acai-950">Administradores</h2>
        </div>
        <p className="mt-1 text-sm text-acai-400">
          Apenas e-mails cadastrados aqui conseguem acessar o painel administrativo — essa lista é a
          fonte de verdade usada diretamente nas regras de segurança do Firestore.
        </p>

        <form onSubmit={handleAddAdmin} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="email@exemplo.com"
            required
            className="flex-1 rounded-xl border-2 border-acai-100 px-4 py-2.5 text-sm outline-none focus:border-acai-400"
          />
          <Button type="submit" loading={addingAdmin}>
            <Plus className="h-4 w-4" /> Adicionar admin
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          {admins === null ? (
            <p className="text-sm text-acai-400">Carregando...</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-acai-400">Nenhum administrador cadastrado.</p>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.email}
                className="flex items-center justify-between rounded-xl border border-acai-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-acai-900">
                    {admin.email}
                    {admin.email === user?.email?.toLowerCase() && (
                      <span className="ml-2 rounded-full bg-acai-100 px-2 py-0.5 text-[10px] font-bold text-acai-600">
                        VOCÊ
                      </span>
                    )}
                  </p>
                  {admin.addedAt && (
                    <p className="text-xs text-acai-400">
                      Adicionado em {formatDate(new Date(admin.addedAt).getTime())}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setRemovingAdmin(admin)}
                  className="text-acai-300 transition hover:text-red-500"
                  aria-label="Remover admin"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(removingAdmin)}
        title="Remover administrador?"
        description={
          removingAdmin?.email === user?.email?.toLowerCase()
            ? "Você está removendo o seu próprio acesso ao painel. Essa ação não pode ser desfeita por você mesmo depois."
            : `"${removingAdmin?.email}" perderá acesso ao painel administrativo.`
        }
        confirmLabel="Remover"
        danger
        loading={removeLoading}
        onConfirm={confirmRemoveAdmin}
        onCancel={() => setRemovingAdmin(null)}
      />
    </div>
  );
}
