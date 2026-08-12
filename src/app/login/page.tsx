"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/data/users";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSettings } from "@/context/SettingsContext";

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado. Tente entrar.";
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";
    case "auth/operation-not-allowed":
      return "Login por e-mail/senha ainda não está ativado no Firebase (Authentication → Sign-in method → E-mail/senha).";
    default:
      return "Não foi possível concluir. Tente novamente.";
  }
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const { settings } = useSettings();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await ensureUserProfile(cred.user.uid, { name, email, phone });
        toast.success("Conta criada com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Bem-vindo de volta!");
      }
      router.push(redirect);
    } catch (err) {
      const code = (err as { code?: string }).code || "";
      toast.error(friendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-acai-radial px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-acai-400 transition hover:text-acai-700"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao cardápio
        </Link>

        <div className="mb-2 text-3xl">🍇</div>
        <h1 className="font-display text-2xl font-bold text-acai-950">
          {settings.storeName}
        </h1>
        <p className="mt-1 text-sm text-acai-400">
          {mode === "signin" ? "Entre para continuar seu pedido" : "Crie sua conta em segundos"}
        </p>

        <div className="mt-6 flex rounded-xl bg-acai-50 p-1">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mode === "signin" ? "bg-white text-acai-700 shadow" : "text-acai-400"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mode === "signup" ? "bg-white text-acai-700 shadow" : "text-acai-400"
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <Input
                label="Nome completo"
                placeholder="Seu nome"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Telefone / WhatsApp"
                placeholder="(00) 00000-0000"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}
          <Input
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-acai-300">
          É dono da loja?{" "}
          <Link href="/admin/login" className="font-semibold text-acai-500 underline">
            Acessar painel administrativo
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
