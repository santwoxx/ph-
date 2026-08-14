"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { X, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/data/users";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { formatPhone } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Só monta (e só então lê user/profile pra preencher os campos) quando o
// AuthContext já decidiu que falta completar o cadastro — assim os campos
// já nascem com os dados que existirem, sem precisar de useEffect pra
// sincronizar depois que o perfil carrega.
export function CompleteProfileModal() {
  const { needsProfileCompletion, isAdmin, adminChecked } = useAuth();
  // Admin não precisa preencher CPF/endereço de cliente — e só sabemos se é
  // admin depois que `adminChecked` vira true, então esperamos essa checagem
  // pra não piscar o modal por um instante para quem é admin.
  if (!needsProfileCompletion || !adminChecked || isAdmin) return null;
  return <CompleteProfileModalInner />;
}

function CompleteProfileModalInner() {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.name || user?.displayName || "");
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [complement, setComplement] = useState("");
  const [reference, setReference] = useState("");

  if (dismissed) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (!isValidCPF(cpf)) {
      toast.error("CPF inválido. Confira os números digitados.");
      return;
    }
    if (!phone.replace(/\D/g, "").trim() || phone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um número de telefone válido.");
      return;
    }
    if (!street.trim() || !number.trim() || !district.trim() || !city.trim()) {
      toast.error("Preencha o endereço completo.");
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: name.trim(),
        cpf: cpf.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
        addresses: [
          {
            street: street.trim(),
            number: number.trim(),
            district: district.trim(),
            city: city.trim(),
            complement: complement.trim(),
            reference: reference.trim(),
            tag: "Principal",
          },
        ],
      });
      toast.success("Cadastro completo!");
      setDismissed(true);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={() => setDismissed(true)} aria-hidden />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-scale-in dark:bg-acai-950 sm:rounded-3xl">
        <div className="flex items-start justify-between border-b border-acai-100 p-6 dark:border-acai-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-acai-gradient text-white">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-acai-950 dark:text-white">
                Complete seu cadastro
              </h2>
              <p className="text-xs text-acai-400">
                Só precisamos disso uma vez, pra agilizar suas próximas entregas.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Preencher depois"
            className="shrink-0 text-acai-300 hover:text-acai-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <Input label="Nome completo" required value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="CPF"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14}
              />
              <Input
                label="Telefone"
                required
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                maxLength={15}
              />
            </div>
          </div>

          <p className="mb-2.5 mt-6 text-sm font-bold text-acai-900 dark:text-acai-100">
            Endereço de entrega
          </p>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Input label="Rua" required value={street} onChange={(e) => setStreet(e.target.value)} />
            <Input label="Número" required value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Bairro" required value={district} onChange={(e) => setDistrict(e.target.value)} />
            <Input label="Cidade" required value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Complemento (opcional)"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
            />
            <Input
              label="Referência (opcional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button type="submit" fullWidth loading={saving}>
              Salvar cadastro
            </Button>
            <Button type="button" variant="outline" fullWidth onClick={() => setDismissed(true)}>
              Preencher depois
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
