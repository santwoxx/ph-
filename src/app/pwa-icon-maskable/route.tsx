import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

// Ícone "maskable": o sistema operacional aplica sua própria máscara
// (círculo, squircle, etc), então o fundo precisa ir de ponta a ponta e o
// conteúdo precisa ficar dentro da "zona segura" central (~80% do tamanho).
export function GET() {
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
        <div style={{ display: "flex", fontSize: 220 }}>🍇</div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
