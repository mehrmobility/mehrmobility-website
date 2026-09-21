import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { getAdminSession, hasAdminPermission } from "@/lib/mehr-site/admin-auth";
import type { Vehicle } from "@/lib/mehr-site/data";

const dbPath = process.env.MEHR_CMS_DATABASE_PATH || join(process.cwd(), "data", "mehr-cms.local.db");
function database() { return new DatabaseSync(dbPath); }
function writesAllowed() { return process.env.NODE_ENV !== "production" || process.env.MEHR_ADMIN_CATALOG_WRITES === "true"; }
function validCar(value: unknown): value is Vehicle {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const car = value as Record<string, unknown>;
  return typeof car.slug === "string" && /^[a-z0-9-]{2,80}$/.test(car.slug) && typeof car.title === "string" && typeof car.brand === "string" && typeof car.brandName === "string" && typeof car.pageUrl === "string" && !!car.primaryImage && Array.isArray(car.gallery) && !!car.specs;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasAdminPermission(session, "readCms")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = database();
  try {
    const rows = db.prepare("SELECT d.id,d.slug,d.status,r.body_json,r.revision_no,d.updated_at FROM cms_documents d LEFT JOIN cms_document_revisions r ON r.document_id=d.id AND r.revision_no=(SELECT MAX(revision_no) FROM cms_document_revisions WHERE document_id=d.id) WHERE d.kind='vehicle' ORDER BY d.updated_at DESC").all() as { id: string; slug: string; status: string; body_json: string; revision_no: number; updated_at: string }[];
    const catalog = rows.flatMap(row => {
      try {
        const vehicle = (JSON.parse(row.body_json) as { vehicle?: unknown }).vehicle;
        return vehicle ? [{ ...(vehicle as object), _cms: { id: row.id, status: row.status, revisionNo: row.revision_no, updatedAt: row.updated_at } }] : [];
      } catch { return []; }
    });
    return NextResponse.json({ vehicles: catalog }, { headers: { "cache-control": "no-store" } });
  } finally { db.close(); }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasAdminPermission(session, "editContent")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasAdminPermission(session, "publishContent")) return NextResponse.json({ error: "publish_forbidden" }, { status: 403 });
  if (!writesAllowed()) return NextResponse.json({ error: "writes_disabled" }, { status: 409 });
  const vehicle = await request.json().catch(() => null);
  if (!validCar(vehicle)) return NextResponse.json({ error: "invalid_vehicle" }, { status: 400 });
  const db = database(), now = new Date().toISOString();
  try {
    db.exec("BEGIN");
    const current = db.prepare("SELECT d.id,r.body_json FROM cms_documents d LEFT JOIN cms_document_revisions r ON r.id=d.published_revision_id WHERE d.kind='vehicle' AND d.slug=?").get(vehicle.slug) as { id: string; body_json?: string } | undefined;
    const id = current?.id || randomUUID();
    if (current) db.prepare("UPDATE cms_documents SET status='published',updated_at=? WHERE id=?").run(now, id);
    else db.prepare("INSERT INTO cms_documents (id,kind,slug,locale,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").run(id, "vehicle", vehicle.slug, "fa-IR", "published", session.username, now, now);
    const revisionNo = (db.prepare("SELECT COALESCE(MAX(revision_no),0)+1 AS value FROM cms_document_revisions WHERE document_id=?").get(id) as { value: number }).value;
    const revision = randomUUID(), body = JSON.stringify({ vehicle });
    db.prepare("INSERT INTO cms_document_revisions (id,document_id,revision_no,body_json,seo_json,created_by,created_at) VALUES (?,?,?,?,?,?,?)").run(revision, id, revisionNo, body, JSON.stringify({ title: vehicle.title, description: `${vehicle.title} در مهر خودرو` }), session.username, now);
    db.prepare("UPDATE cms_documents SET published_revision_id=? WHERE id=?").run(revision, id);
    db.prepare("INSERT INTO cms_audit_events (id,actor_id,action,entity_type,entity_id,before_json,after_json,created_at) VALUES (?,?,?,?,?,?,?,?)").run(randomUUID(), session.username, current ? "vehicle_published_revision" : "vehicle_published", "vehicle", id, current?.body_json || null, body, now);
    db.exec("COMMIT");
    return NextResponse.json({ id, revision, revisionNo, vehicle });
  } catch {
    try { db.exec("ROLLBACK"); } catch {}
    return NextResponse.json({ error: "save_failed" }, { status: 409 });
  } finally { db.close(); }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasAdminPermission(session, "publishContent")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!writesAllowed()) return NextResponse.json({ error: "writes_disabled" }, { status: 409 });
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]{2,80}$/.test(slug)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const db = database(), now = new Date().toISOString();
  try {
    db.exec("BEGIN");
    const current = db.prepare("SELECT id,status FROM cms_documents WHERE kind='vehicle' AND slug=?").get(slug) as { id: string; status: string } | undefined;
    if (!current) { db.exec("ROLLBACK"); return NextResponse.json({ error: "not_found" }, { status: 404 }); }
    db.prepare("UPDATE cms_documents SET status='archived',updated_at=? WHERE id=?").run(now, current.id);
    db.prepare("INSERT INTO cms_audit_events (id,actor_id,action,entity_type,entity_id,before_json,after_json,created_at) VALUES (?,?,?,?,?,?,?,?)").run(randomUUID(), session.username, "vehicle_archived", "vehicle", current.id, JSON.stringify({ status: current.status }), JSON.stringify({ status: "archived" }), now);
    db.exec("COMMIT");
    return NextResponse.json({ ok: true, archived: slug });
  } catch {
    try { db.exec("ROLLBACK"); } catch {}
    return NextResponse.json({ error: "archive_failed" }, { status: 409 });
  } finally { db.close(); }
}
