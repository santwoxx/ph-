import { ImageResponse } from "next/og";
import { getStoreLogoDataUrl } from "@/lib/server/store-logo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          borderRadius: 8,
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={28} height={28} style={{ objectFit: "cover", borderRadius: 6 }} />
        ) : (
          <div style={{ display: "flex", fontSize: 20 }}>🍇</div>
        )}
      </div>
    ),
    { ...size }
  );
}
