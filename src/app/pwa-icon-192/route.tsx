import { ImageResponse } from "next/og";
import { getStoreLogoDataUrl } from "@/lib/server/store-logo";

export const dynamic = "force-static";
export const contentType = "image/png";

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
          borderRadius: 40,
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={168} height={168} style={{ objectFit: "cover", borderRadius: 34 }} />
        ) : (
          <div style={{ display: "flex", fontSize: 108 }}>🍇</div>
        )}
      </div>
    ),
    { width: 192, height: 192 }
  );
}
