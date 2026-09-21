import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { importTopics } from "../lib/mehr-site/import-guides.ts";

const database = new DatabaseSync(join(process.cwd(), "data", "mehr-cms.local.db"));
const now = new Date().toISOString();
let seeded = 0;
try {
  database.exec("BEGIN");
  const existing = database.prepare("SELECT id FROM cms_documents WHERE kind='page' AND slug=?");
  const insertDocument = database.prepare("INSERT INTO cms_documents (id,kind,slug,locale,status,published_revision_id,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)");
  const insertRevision = database.prepare("INSERT INTO cms_document_revisions (id,document_id,revision_no,body_json,seo_json,created_by,created_at) VALUES (?,?,?,?,?,?,?)");
  const insertAudit = database.prepare("INSERT INTO cms_audit_events (id,actor_id,action,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?)");
  for (const [slug, guide] of Object.entries(importTopics)) {
    const documentSlug = `import-${slug}`;
    if (existing.get(documentSlug)) continue;
    const id = `page-${documentSlug}`, revision = randomUUID();
    insertDocument.run(id, "page", documentSlug, "fa-IR", "published", revision, "system-seed", now, now);
    insertRevision.run(revision, id, 1, JSON.stringify({ guide }), JSON.stringify({ title: guide.title, description: guide.description }), "system-seed", now);
    insertAudit.run(randomUUID(), "system-seed", "import_guide_migrated", "page", id, now);
    seeded++;
  }
  database.exec("COMMIT");
  console.log(`Seeded ${seeded} import guide documents.`);
} catch (error) {
  try { database.exec("ROLLBACK"); } catch {}
  throw error;
} finally { database.close(); }
