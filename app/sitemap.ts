import type { MetadataRoute } from "next";
import { entries, vehicles } from "@/lib/mehr-site/data";
import { mehrIndexingEnabled, mehrUrl } from "@/lib/mehr-site/seo";
import { importTopicSlugs } from "@/lib/mehr-site/import-guides";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!mehrIndexingEnabled) return [];
  const fixed = [
    ["/mehr", "weekly" as const, 1], ["/mehr/cars", "weekly" as const, .9], ["/mehr/services", "monthly" as const, .8],
    ["/mehr/journal", "weekly" as const, .8], ["/mehr/news", "weekly" as const, .7], ["/mehr/about", "yearly" as const, .5],
    ["/mehr/contact", "monthly" as const, .7], ["/mehr/customers", "monthly" as const, .6], ["/mehr/numberplate", "monthly" as const, .6],
    ["/mehr/import", "monthly" as const, .7], ["/mehr/brands/toyota", "monthly" as const, .6], ["/mehr/brands/nissan", "monthly" as const, .6],
  ].map(([path, changeFrequency, priority]) => ({ url: mehrUrl(path as string), changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"], priority: priority as number }));
  const cars = vehicles.map(vehicle => ({ url: mehrUrl(`/mehr/cars/${vehicle.slug}`), changeFrequency: "weekly" as const, priority: .8 }));
  const guides = importTopicSlugs.map(topic => ({ url: mehrUrl(`/mehr/import/${topic}`), changeFrequency: "monthly" as const, priority: topic === "anzali" ? .7 : .4 }));
  const editorial = entries.filter(entry => ["posts", "notifications", "service"].includes(entry.type)).map(entry => ({ url: mehrUrl(`/mehr/${entry.type === "posts" ? "journal" : entry.type === "notifications" ? "news" : "services"}/${entry.slug}`), lastModified: new Date(entry.date), changeFrequency: entry.type === "service" ? "monthly" as const : "yearly" as const, priority: entry.type === "posts" ? .7 : .6 }));
  return [...fixed, ...cars, ...guides, ...editorial];
}
