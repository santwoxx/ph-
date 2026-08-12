import { AlertTriangle } from "lucide-react";

const REQUIRED_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

export function FirebaseSetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-acai-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-acai-950">
          Firebase ainda não configurado
        </h1>
        <p className="mt-2 text-sm text-acai-500">
          O projeto está rodando, mas ainda faltam as credenciais do seu Firebase para o
          cardápio, login e painel funcionarem.
        </p>

        <ol className="mt-5 space-y-2 text-sm text-acai-600">
          <li>
            1. Copie <code className="rounded bg-acai-50 px-1.5 py-0.5 font-mono text-xs">.env.local.example</code>{" "}
            para <code className="rounded bg-acai-50 px-1.5 py-0.5 font-mono text-xs">.env.local</code>
          </li>
          <li>2. Preencha com os dados do seu projeto no Firebase Console</li>
          <li>3. Reinicie o servidor (<code className="rounded bg-acai-50 px-1.5 py-0.5 font-mono text-xs">npm run dev</code>)</li>
        </ol>

        <div className="mt-5 rounded-xl bg-acai-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-acai-400">
            Variáveis necessárias
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-acai-600">
            {REQUIRED_VARS.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-xs text-acai-400">
          O passo a passo completo (criar o projeto, ativar Auth/Firestore/Storage, publicar as
          regras e criar o primeiro admin) está no <strong>README.md</strong> do projeto.
        </p>
      </div>
    </div>
  );
}
