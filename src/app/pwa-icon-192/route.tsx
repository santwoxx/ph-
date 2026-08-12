import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const contentType = "image/png";

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
          borderRadius: 40,
        }}
      >
        <div style={{ display: "flex", fontSize: 108 }}>🍇</div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
