import type { MetadataRoute } from "next";
import { mehrIndexingEnabled, mehrUrl } from "@/lib/mehr-site/seo";

export default function robots(): MetadataRoute.Robots {
  return mehrIndexingEnabled
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/customer-api/", "/mehr-api/", "/api/"] }, sitemap: mehrUrl("/sitemap.xml") }
    : { rules: { userAgent: "*", disallow: "/" } };
}
