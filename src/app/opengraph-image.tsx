import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

// Default social share image for every route (Open Graph + Twitter). Routes can
// override by adding their own opengraph-image file deeper in the tree.
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const { brand, background, foreground } = siteConfig.theme.dark;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background,
          color: foreground,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 96,
            height: 12,
            background: brand,
            borderRadius: 999,
            marginBottom: 48,
          }}
        />
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.03em" }}>
          {siteConfig.name}
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: brand, fontWeight: 600 }}>
          {siteConfig.legalName}
        </div>
      </div>
    ),
    { ...size },
  );
}
