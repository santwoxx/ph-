"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { GoogleIcon } from "@/components/GoogleIcon";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const adminSnap = await getDoc(doc(db, "admins", (user.email || "").toLowerCase()));

      if (!adminSnap.exists()) {
        toast.error("Este e-mail não tem permissão de administrador.");
        router.push("/");
        return;
      }

      toast.success("Bem-vindo ao painel!");
      router.push("/admin");
    } catch (err) {
      const code = (err as { code?: string }).code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // usuário só fechou o popup, sem erro pra mostrar
      } else {
        toast.error("Não foi possível entrar com o Google. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-acai-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-acai-400 transition hover:text-acai-700"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-acai-gradient text-white shadow-soft">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-acai-950">
          Painel administrativo
        </h1>
        <p className="mt-1 text-sm text-acai-400">
          Acesso restrito a e-mails autorizados como administrador.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-acai-100 px-4 py-3.5 text-sm font-semibold text-acai-800 transition hover:border-acai-300 hover:bg-acai-50 disabled:opacity-60"
        >
          <GoogleIcon className="h-5 w-5" />
          {loading ? "Entrando..." : "Continuar com o Google"}
        </button>

        <p className="mt-5 text-xs text-acai-400">
          Seu e-mail precisa estar cadastrado como administrador em Configurações → Administradores.
        </p>
      </div>
    </div>
  );
}
