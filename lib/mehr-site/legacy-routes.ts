import { entries, vehicles } from "./data";

function normalizedPath(value: string) {
  const withoutQuery = value.split(/[?#]/, 1)[0] || "/";
  let decoded = withoutQuery;
  // Depending on the server/proxy, an already-percent-encoded Persian slug may
  // reach the catch-all route as either decoded text or as a literal `%XX`.
  // Normalize both forms without accepting malformed encodings.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch { break; }
  }
  const prefixed = decoded.startsWith("/") ? decoded : `/${decoded}`;
  return prefixed.length > 1 ? prefixed.replace(/\/+$/, "") : "/";
}

const legacyRoutes = new Map<string, string>();
function add(source: string, destination: string) {
  legacyRoutes.set(normalizedPath(source), destination);
}

for (const vehicle of vehicles) add(new URL(vehicle.pageUrl).pathname, `/mehr/cars/${vehicle.slug}`);
for (const entry of entries) {
  const section = entry.type === "posts" ? "journal" : entry.type === "notifications" ? "news" : entry.type === "service" ? "services" : entry.slug === "about-us" ? "about" : entry.slug === "register-numberplate" ? "numberplate" : null;
  if (section) add(new URL(entry.sourceUrl).pathname, `/mehr/${section}${["posts", "notifications", "service"].includes(entry.type) ? `/${entry.slug}` : ""}`);
}

// These paths have a genuine equivalent in the new public site. We intentionally
// do not redirect obsolete cart/account/sample URLs to the home page: that would
// mislead users and search engines.
for (const [source, destination] of Object.entries({
  "/cars/": "/mehr/cars",
  "/products/": "/mehr/cars",
  "/search/": "/mehr/cars",
  "/notifications/": "/mehr/news",
  "/blog/": "/mehr/journal",
  "/category/blog/": "/mehr/journal",
  "/about-us/": "/mehr/about",
  "/contact-us/": "/mehr/contact",
  "/register-numberplate/": "/mehr/numberplate",
  "/امور-مشتریان/": "/mehr/customers",
  "/آیین-حمایت-از-حقوق-مشتریان/": "/mehr/rights",
  "/سامانه-ارتباط-با-مشتریان/": "/mehr/communication",
  "/راه-های-ارتباطی/": "/mehr/contact",
  "/نظر-سنجی/": "/mehr/survey",
  "/شکایت-مشتریان/": "/mehr/complaints",
})) add(source, destination);

export function legacyDestination(pathname: string) {
  return legacyRoutes.get(normalizedPath(pathname));
}

export function knownLegacyRoutes() {
  return [...legacyRoutes.entries()].map(([source, destination]) => ({ source, destination }));
}
