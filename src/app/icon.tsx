import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

// App icon (favicon / browser tab / PWA). Generated at build time. A full-bleed
// brand background with a centred monogram keeps it safe for maskable cropping.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** First letters of each word in the brand name, e.g. "N8X Marketing" → "N8". */
function monogram(): string {
  return siteConfig.name
    .split(/\s+/)
    .slice(0, 1)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Icon() {
  const { brand, brandForeground } = siteConfig.theme.light;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand,
          color: brandForeground,
          fontSize: 280,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: "-0.05em",
        }}
      >
        {monogram()}
      </div>
    ),
    { ...size },
  );
}
