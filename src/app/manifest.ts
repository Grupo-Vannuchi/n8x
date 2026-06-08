import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name.split(" ")[0],
    description: siteConfig.legalName,
    start_url: "/",
    display: "standalone",
    background_color: siteConfig.theme.light.background,
    theme_color: siteConfig.theme.light.brand,
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      // The 512×512 icon route (src/app/icon.tsx) downscales for the install
      // prompt and home-screen launcher; the `maskable` copy lets Android crop
      // it cleanly. Same source, two declared purposes (the spec keeps them
      // separate, and Next's manifest type accepts only one purpose per entry).
      {
        src: "/icon",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
