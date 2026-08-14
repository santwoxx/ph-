import { ImageResponse } from "next/og";
import { getStoreLogoDataUrl } from "@/lib/server/store-logo";

export const dynamic = "force-static";
export const contentType = "image/png";

// Ícone "maskable": o sistema operacional aplica sua própria máscara
// (círculo, squircle, etc), então o fundo precisa ir de ponta a ponta e o
// conteúdo precisa ficar dentro da "zona segura" central (~80% do tamanho).
export async function GET() {
  const logo = await getStoreLogoDataUrl();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #521a88 0%, #7f2fc9 45%, #d43d84 100%)",
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={340} height={340} style={{ objectFit: "cover", borderRadius: 70 }} />
        ) : (
          <div style={{ display: "flex", fontSize: 220 }}>🍇</div>
        )}
      </div>
    ),
    { width: 512, height: 512 }
  );
}
