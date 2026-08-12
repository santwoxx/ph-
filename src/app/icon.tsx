import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        <div style={{ display: "flex", fontSize: 20 }}>🍇</div>
      </div>
    ),
    { ...size }
  );
}
