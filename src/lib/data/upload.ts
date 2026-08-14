// O projeto roda no plano gratuito do Firebase (Spark), que não inclui um
// bucket do Storage — criar um exige habilitar o plano pago (Blaze). Por
// isso as fotos de produto, logo e banner são redimensionadas/comprimidas
// aqui no navegador e guardadas como Data URL direto no campo `imageUrl` do
// próprio documento no Firestore, sem nenhum arquivo externo. Mantemos a
// mesma assinatura de função (`{ url, path }`) que era usada com o Storage
// para não precisar mexer em quem chama.

const MAX_DATA_URL_BYTES = 220 * 1024; // string completa da Data URL, com folga sobre o limite de 1MiB por documento do Firestore
// Miniaturas de opção (creme, calda, adicional) ficam embutidas dentro do
// MESMO documento do produto, e um produto pode ter várias — por isso o
// limite por imagem aqui é bem mais apertado que o de uma foto principal.
const MAX_OPTION_DATA_URL_BYTES = 35 * 1024;
const MIN_JPEG_QUALITY = 0.4;
const MIN_DIMENSION = 240;
const MIN_OPTION_DIMENSION = 96;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = objectUrl;
  });
}

function canvasFrom(img: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste navegador.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Comprime como JPEG (fotos de produto/banner: sem transparência, prioriza
// tamanho pequeno). Reduz qualidade e, se ainda assim não couber, reduz a
// resolução também — algumas fotos (muito ruído/detalhe) não encolhem só
// baixando a qualidade.
async function compressToJpegDataUrl(
  file: File,
  maxDimension: number,
  maxBytes: number = MAX_DATA_URL_BYTES,
  minDimension: number = MIN_DIMENSION
): Promise<string> {
  const img = await loadImage(file);
  try {
    let dimension = maxDimension;
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = canvasFrom(img, dimension);
      let quality = 0.82;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > maxBytes && quality > MIN_JPEG_QUALITY) {
        quality -= 0.12;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      if (dataUrl.length <= maxBytes || dimension <= minDimension) {
        return dataUrl;
      }
      dimension = Math.round(dimension * 0.75);
    }
    return canvasFrom(img, minDimension).toDataURL("image/jpeg", MIN_JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

// Logo fica em PNG para preservar fundo transparente (comum em logos).
// Como PNG não tem "qualidade" ajustável, quem cede é a resolução.
async function compressToPngDataUrl(file: File, maxDimension: number): Promise<string> {
  const img = await loadImage(file);
  try {
    let dimension = maxDimension;
    for (let attempt = 0; attempt < 5; attempt++) {
      const dataUrl = canvasFrom(img, dimension).toDataURL("image/png");
      if (dataUrl.length <= MAX_DATA_URL_BYTES || dimension <= MIN_DIMENSION) {
        return dataUrl;
      }
      dimension = Math.round(dimension * 0.75);
    }
    return canvasFrom(img, MIN_DIMENSION).toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

export async function uploadProductImage(
  _productId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const url = await compressToJpegDataUrl(file, 720);
  return { url, path: "" };
}

export async function uploadSettingsImage(
  kind: "logo" | "banner",
  file: File
): Promise<{ url: string; path: string }> {
  const url =
    kind === "logo"
      ? await compressToPngDataUrl(file, 480)
      : await compressToJpegDataUrl(file, 960);
  return { url, path: "" };
}

// Foto pequena de uma opção dentro de um grupo "monte seu copo" (creme,
// calda, adicional — estilo iFood). Um produto pode ter várias, todas
// embutidas no mesmo documento, por isso o tamanho-alvo é bem menor que o
// da foto principal do produto.
export async function uploadExtraOptionImage(file: File): Promise<string> {
  return compressToJpegDataUrl(file, 200, MAX_OPTION_DATA_URL_BYTES, MIN_OPTION_DIMENSION);
}

// Sem Storage, não existe mais um arquivo separado para apagar: a imagem
// antiga é substituída junto com o próprio documento ao salvar a nova.
export async function deleteImageByPath(_path: string) {}
