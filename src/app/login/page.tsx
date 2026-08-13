"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { GoogleIcon } from "@/components/GoogleIcon";
import { useSettings } from "@/context/SettingsContext";

function friendlyAuthError(code: string): string {
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "";
  return "Não foi possível entrar com o Google. Tente novamente.";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const { settings } = useSettings();
  const { signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const adminSnap = await getDoc(doc(db, "admins", (user.email || "").toLowerCase()));
      if (adminSnap.exists()) {
        toast.success("Bem-vindo ao painel!");
        router.push("/admin");
        return;
      }
      toast.success("Bem-vindo!");
      router.push(redirect);
    } catch (err) {
      const code = (err as { code?: string }).code || "";
      const message = friendlyAuthError(code);
      if (message) toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-acai-radial px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-acai-400 transition hover:text-acai-700"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao cardápio
        </Link>

        <div className="mb-2 text-3xl">🍇</div>
        <h1 className="font-display text-2xl font-bold text-acai-950">{settings.storeName}</h1>
        <p className="mt-1 text-sm text-acai-400">Entre para continuar seu pedido</p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-acai-100 px-4 py-3.5 text-sm font-semibold text-acai-800 transition hover:border-acai-300 hover:bg-acai-50 disabled:opacity-60"
        >
          <GoogleIcon className="h-5 w-5" />
          {loading ? "Entrando..." : "Continuar com o Google"}
        </button>

        <p className="mt-5 text-xs text-acai-400">
          É rápido e seguro — usamos sua conta Google só para confirmar quem é você.
        </p>

        <p className="mt-6 text-center text-xs text-acai-300">
          É dono da loja e ainda não tem acesso?{" "}
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
