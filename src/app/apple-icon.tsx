import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

// Apple touch icon (iOS home screen). 180×180 is Apple's recommended size; iOS
// applies its own rounded mask, so a full-bleed brand background works well.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: "-0.05em",
        }}
      >
        {siteConfig.name.split(/\s+/)[0].slice(0, 2).toUpperCase()}
      </div>
    ),
    { ...size },
  );
}
