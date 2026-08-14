// As fotos de produto/logo/banner são guardadas como Data URL direto no
// documento do Firestore (ver `lib/data/upload.ts`) para não depender do
// Firebase Storage, que exige o plano pago (Blaze) para existir. O
// next/image precisa da prop `unoptimized` para esses casos: uma Data URL já
// está no navegador, então a otimização (buscar/redimensionar no servidor)
// não se aplica e o componente rejeita a URL sem essa flag.
export function isDataUrl(src: string | undefined | null): boolean {
  return Boolean(src && src.startsWith("data:"));
}
