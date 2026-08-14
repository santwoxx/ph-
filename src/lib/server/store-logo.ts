import { readFile } from "node:fs/promises";
import path from "node:path";

// Mesma logo padrão que Header/Hero/Footer usam no navegador
// (`settings.logoUrl || "/logo-ph.png"`) quando a loja ainda não subiu uma
// logo própria pelo painel. O Satori (motor por trás do ImageResponse) não
// resolve caminho relativo tipo "/logo-ph.png", por isso lemos o arquivo do
// disco e convertemos pra Data URI. Cacheado em memória — é sempre o mesmo
// arquivo, não precisa reler a cada chamada.
let cachedFallbackLogo: string | null | undefined;
async function getFallbackLogoDataUrl(): Promise<string | null> {
  if (cachedFallbackLogo !== undefined) return cachedFallbackLogo;
  try {
    const buffer = await readFile(path.join(process.cwd(), "public", "logo-ph.png"));
    cachedFallbackLogo = `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    cachedFallbackLogo = null;
  }
  return cachedFallbackLogo;
}

// Só usado pelos geradores de ícone/imagem (favicon, ícones do PWA, imagem
// de Open Graph) — esses arquivos rodam no build/servidor, sem acesso ao
// SettingsContext (que só existe no navegador), então buscam os dados
// direto da API REST do Firestore. O documento `settings/store` é público
// pra leitura (mesma regra que libera o cardápio), então não precisa de
// credencial nenhuma. Se falhar, quem chama recebe os valores padrão e cai
// de volta pro emoji/texto genérico — nunca pode quebrar a build por causa
// disso.
async function fetchStoreSettingsFields(): Promise<Record<string, { stringValue?: string }> | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/store`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.fields ?? null;
  } catch {
    return null;
  }
}

export async function getStoreLogoDataUrl(): Promise<string | null> {
  const fields = await fetchStoreSettingsFields();
  const logoUrl = fields?.logoUrl?.stringValue;
  if (typeof logoUrl === "string" && logoUrl.startsWith("data:")) return logoUrl;
  return getFallbackLogoDataUrl();
}

export async function getStoreBranding(): Promise<{
  logoUrl: string | null;
  storeName: string;
  tagline: string;
}> {
  const fields = await fetchStoreSettingsFields();
  const logoUrl = fields?.logoUrl?.stringValue;
  return {
    logoUrl:
      typeof logoUrl === "string" && logoUrl.startsWith("data:")
        ? logoUrl
        : await getFallbackLogoDataUrl(),
    storeName: fields?.storeName?.stringValue || "Açaí do PH",
    tagline: fields?.tagline?.stringValue || "O melhor açaí da região, aberto até meia-noite!",
  };
}
