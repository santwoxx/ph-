"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const adminSnap = await getDoc(doc(db, "admins", (cred.user.email || "").toLowerCase()));

      if (!adminSnap.exists()) {
        await auth.signOut();
        toast.error("Este e-mail não tem permissão de administrador.");
        return;
      }

      toast.success("Bem-vindo ao painel!");
      router.push("/admin");
    } catch (err) {
      const code = (err as { code?: string }).code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        toast.error("E-mail ou senha incorretos.");
      } else if (code === "auth/operation-not-allowed") {
        toast.error(
          "Login por e-mail/senha ainda não está ativado no Firebase (Authentication → Sign-in method → E-mail/senha)."
        );
      } else {
        toast.error("Não foi possível entrar. Tente novamente.");
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@suaacaiteria.com"
          />
          <Input
            label="Senha"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            Entrar no painel
          </Button>
        </form>
      </div>
    </div>
  );
}
