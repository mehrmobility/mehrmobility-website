import "server-only";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import type { NavItem } from "./site-management";
import type { HomeHero, PageIntro } from "./cms-contract";
import { entries, vehicles, type Entry, type Vehicle } from "./data";
const databasePath = process.env.MEHR_CMS_DATABASE_PATH || join(process.cwd(), "data", "mehr-cms.local.db");
function database() { return new DatabaseSync(databasePath); }
const defaults: NavItem[] = [{ id: "cars", label: "خودروها", href: "/mehr/cars", status: "published", order: 10 }, { id: "news", label: "فروش و اطلاعیه‌ها", href: "/mehr/news", status: "published", order: 20 }, { id: "services", label: "خدمات پس از فروش", href: "/mehr/services", status: "published", order: 30 }, { id: "about", label: "درباره مهر", href: "/mehr/about", status: "published", order: 40 }, { id: "journal", label: "مجله مهر", href: "/mehr/journal", status: "published", order: 50 }];
export function cmsNavigation() { const db = database(); try { const rows = db.prepare("SELECT id,label,href,status,sort_order FROM cms_navigation_items WHERE location='header' ORDER BY sort_order").all() as { id:string; label:string; href:string; status:"draft"|"published"; sort_order:number }[]; if (!rows.length) return defaults; return rows.map(row => ({ id: row.id, label: row.label, href: row.href, status: row.status, order: row.sort_order })); } finally { db.close(); } }
export function replaceCmsNavigation(items: NavItem[], actor: string) { const db = database(); try { db.exec("BEGIN"); db.prepare("DELETE FROM cms_navigation_items WHERE location='header'").run(); const now = new Date().toISOString(); const insert = db.prepare("INSERT INTO cms_navigation_items (id,location,label,href,sort_order,status,revision_no,updated_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?)"); for (const item of items) insert.run(item.id, "header", item.label, item.href, item.order, item.status, 1, actor, now); db.prepare("INSERT INTO cms_audit_events (id,actor_id,action,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?)").run(`audit-${Date.now()}`, actor, "navigation_replaced", "navigation", "header", now); db.exec("COMMIT"); return items; } catch (error) { try { db.exec("ROLLBACK"); } catch {} throw error; } finally { db.close(); } }
export const defaultHomeHero: HomeHero = { eyebrow: "از انتخاب، تا هر کیلومتر بعد", title: "انتخاب شما.", accent: "تعهد مهر.", description: "خودروهای صفر و کارکرده وارداتی را با اطلاعات شفاف بررسی کنید؛ از انتخاب تا خدمات، همراه شما هستیم.", primaryLabel: "خودروی خود را پیدا کنید", primaryHref: "/mehr/cars", secondaryLabel: "راهنمای واردات", secondaryHref: "/mehr/import", footnote: "از سال ۱۳۹۱، در کنار شما" };
export function cmsHomeHero(): HomeHero { const db = database(); try { const row = db.prepare("SELECT r.body_json FROM cms_documents d JOIN cms_document_revisions r ON r.id=d.published_revision_id WHERE d.kind='page' AND d.slug='home' AND d.status='published'").get() as { body_json: string } | undefined; if (!row) return defaultHomeHero; const body = JSON.parse(row.body_json) as { hero?: Partial<HomeHero> }; return { ...defaultHomeHero, ...(body.hero || {}) }; } catch { return defaultHomeHero; } finally { db.close(); } }
export function cmsPageIntro(slug: string, fallback: PageIntro): PageIntro { const db = database(); try { const row = db.prepare("SELECT r.body_json FROM cms_documents d JOIN cms_document_revisions r ON r.id=d.published_revision_id WHERE d.kind='page' AND d.slug=? AND d.status='published'").get(slug) as { body_json: string } | undefined; if (!row) return fallback; const body = JSON.parse(row.body_json) as { intro?: Partial<PageIntro> }; return { ...fallback, ...(body.intro || {}) }; } catch { return fallback; } finally { db.close(); } }

export function cmsEditorial(): Entry[] {
  const db = database();
  try {
    const rows = db.prepare("SELECT r.body_json FROM cms_documents d JOIN cms_document_revisions r ON r.id=d.published_revision_id WHERE d.kind IN ('article','notice','service','page') AND d.status='published' ORDER BY d.updated_at DESC").all() as { body_json: string }[];
    if (!rows.length) return entries;
    return rows.map(row => JSON.parse(row.body_json) as { entry?: Entry }).flatMap(body => body.entry ? [body.entry] : []);
  } catch {
    return entries;
  } finally {
    db.close();
  }
}

export function cmsVehicles(): Vehicle[] {
  const db = database();
  try {
    const rows = db.prepare("SELECT r.body_json FROM cms_documents d JOIN cms_document_revisions r ON r.id=d.published_revision_id WHERE d.kind='vehicle' AND d.status='published' ORDER BY d.updated_at DESC").all() as { body_json: string }[];
    if (!rows.length) return vehicles;
    return rows.map(row => JSON.parse(row.body_json) as { vehicle?: Vehicle }).flatMap(body => body.vehicle ? [body.vehicle] : []);
  } catch {
    return vehicles;
  } finally {
    db.close();
  }
}

export function cmsImportGuide<T extends { title: string; description: string }>(slug: string, fallback: T): T {
  return cmsPageBody(`import-${slug}`, fallback, "guide");
}

function cmsPageBody<T extends object>(slug: string, fallback: T, key: string): T {
  const db = database();
  try {
    const row = db.prepare("SELECT r.body_json FROM cms_documents d JOIN cms_document_revisions r ON r.id=d.published_revision_id WHERE d.kind='page' AND d.slug=? AND d.status='published'").get(slug) as { body_json: string } | undefined;
    if (!row) return fallback;
    const body = JSON.parse(row.body_json) as Record<string, unknown>;
    const value = body[key];
    return value && typeof value === "object" ? { ...fallback, ...value as object } as T : fallback;
  } catch { return fallback; } finally { db.close(); }
}
