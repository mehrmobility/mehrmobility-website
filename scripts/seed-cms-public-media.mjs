import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "public", "mehr-site");
const targetRoot = join(root, "data", "cms-media");
const database = new DatabaseSync(join(root, "data", "mehr-cms.local.db"));
const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf" };
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(absolute));
    else if (entry.isFile() && mime[absolute.slice(absolute.lastIndexOf(".")).toLowerCase()]) result.push(absolute);
  }
  return result;
}

let seeded = 0;
try {
  await mkdir(targetRoot, { recursive: true });
  database.exec("BEGIN");
  const exists = database.prepare("SELECT id FROM cms_media WHERE id=?");
  const insert = database.prepare("INSERT INTO cms_media (id,storage_key,mime_type,bytes,alt_text,rights_status,status,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)");
  const audit = database.prepare("INSERT INTO cms_audit_events (id,actor_id,action,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?)");
  const now = new Date().toISOString();
  for (const source of await files(sourceRoot)) {
    const relativePath = relative(sourceRoot, source).replaceAll("\\", "/");
    const digest = createHash("sha256").update(relativePath).digest("hex").slice(0, 32);
    const id = `media-${digest}`;
    if (exists.get(id)) continue;
    const extension = source.slice(source.lastIndexOf(".")).toLowerCase();
    const key = `${id}${extension}`;
    const file = await stat(source);
    await cp(source, join(targetRoot, key));
    insert.run(id, key, mime[extension], file.size, `دارایی عمومی مهر خودرو: ${relativePath}`, "approved_public", "published", "system-seed", now);
    audit.run(randomUUID(), "system-seed", "public_media_migrated", "media", id, now);
    seeded++;
  }
  database.exec("COMMIT");
  console.log(`Seeded ${seeded} public media files.`);
} catch (error) {
  try { database.exec("ROLLBACK"); } catch {}
  throw error;
} finally { database.close(); }
