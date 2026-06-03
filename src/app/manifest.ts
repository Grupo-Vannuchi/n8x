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
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
