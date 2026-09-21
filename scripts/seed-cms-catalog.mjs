import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const cars = JSON.parse(await readFile(join(root, "lib/mehr-site/vehicles.json"), "utf8"));
const database = new DatabaseSync(join(root, "data/mehr-cms.local.db"));
const now = new Date().toISOString();
let seeded = 0;
try {
  database.exec("BEGIN");
  const existing = database.prepare("SELECT id FROM cms_documents WHERE kind='vehicle' AND slug=?");
  const insertDocument = database.prepare("INSERT INTO cms_documents (id,kind,slug,locale,status,published_revision_id,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)");
  const insertRevision = database.prepare("INSERT INTO cms_document_revisions (id,document_id,revision_no,body_json,seo_json,created_by,created_at) VALUES (?,?,?,?,?,?,?)");
  const insertAudit = database.prepare("INSERT INTO cms_audit_events (id,actor_id,action,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?)");
  for (const car of cars) {
    if (existing.get(car.slug)) continue;
    const id = `vehicle-${car.slug}`, revision = randomUUID();
    insertDocument.run(id, "vehicle", car.slug, "fa-IR", "published", revision, "system-seed", now, now);
    insertRevision.run(revision, id, 1, JSON.stringify({ vehicle: car }), JSON.stringify({ title: car.title, description: `${car.title} در مهر خودرو` }), "system-seed", now);
    insertAudit.run(randomUUID(), "system-seed", "catalog_migrated", "vehicle", id, now);
    seeded++;
  }
  database.exec("COMMIT");
  console.log(`Seeded ${seeded} vehicle documents; ${cars.length - seeded} already existed.`);
} catch (error) { try { database.exec("ROLLBACK"); } catch {} throw error; } finally { database.close(); }
