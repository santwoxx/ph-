import { ImageResponse } from "next/og";
import { getStoreBranding } from "@/lib/server/store-logo";

export const alt = "Açaí do PH | Cardápio Digital";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const { logoUrl, storeName, tagline } = await getStoreBranding();
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2a0e48 0%, #7f2fc9 45%, #d43d84 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "140px",
            height: "140px",
            backgroundColor: "#fff",
            borderRadius: "70px",
            marginBottom: "30px",
            fontSize: "70px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" width={140} height={140} style={{ objectFit: "cover" }} />
          ) : (
            "🍇"
          )}
        </div>

        <h1
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            margin: "0 0 20px 0",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {storeName}
        </h1>

        <p
          style={{
            fontSize: "36px",
            margin: 0,
            opacity: 0.9,
            textAlign: "center",
            maxWidth: "800px",
            fontWeight: 500,
          }}
        >
          {tagline}
        </p>

        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            padding: "10px 30px",
            borderRadius: "40px",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Faça seu pedido agora ➔
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
