import type { Metadata } from "next";

const fallbackOrigin = "https://mehrmobility.com";

function validOrigin(value: string | undefined) {
  try {
    const url = new URL(value || fallbackOrigin);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return new URL(fallbackOrigin);
    return url;
  } catch { return new URL(fallbackOrigin); }
}

export const mehrOrigin = validOrigin(process.env.MEHR_PUBLIC_ORIGIN);
// Deliberately opt-in: a local preview or staging environment must never be
// indexable just because it has production-like markup.
export const mehrIndexingEnabled = process.env.MEHR_ALLOW_INDEXING === "true";
export const mehrBasePath = "/mehr";

export function mehrUrl(path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, mehrOrigin).toString();
}

export function indexRobots(): Metadata["robots"] {
  return mehrIndexingEnabled
    ? { index: true, follow: true, googleBot: { index: true, follow: true } }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
}

export function plainText(value: string, max = 155) {
  const text = value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
