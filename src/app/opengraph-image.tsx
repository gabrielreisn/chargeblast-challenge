import { ImageResponse } from "next/og";
import { ogImage, site } from "@/lib/seo";

export const alt = ogImage.alt;
export const size = { width: ogImage.width, height: ogImage.height };
export const contentType = ogImage.type;

// ImageResponse renders with Satori, which only understands inline styles.
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#ffffff",
        borderTop: `16px solid ${site.themeColor}`,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 14,
            background: "#d7c4fb",
            color: "#352353",
            fontSize: 56,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          c
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: "#303746" }}>{site.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 76, fontWeight: 700, color: "#303645", letterSpacing: -2 }}>
          Payments
        </div>
        <div style={{ fontSize: 32, color: "#596171", maxWidth: 900 }}>{site.description}</div>
      </div>
    </div>,
    size,
  );
}
