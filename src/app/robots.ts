import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/en/admin"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
