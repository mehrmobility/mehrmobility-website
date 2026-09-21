import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import { join, basename } from "node:path";
import { readFile } from "node:fs/promises";

const dbPath = process.env.MEHR_CMS_DATABASE_PATH || join(process.cwd(), "data", "mehr-cms.local.db");
const mediaDir = join(process.cwd(), "data", "cms-media");

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{8,80}$/i.test(id)) return new NextResponse(null, { status: 404 });
  const db = new DatabaseSync(dbPath);
  try {
    const row = db.prepare("SELECT storage_key,mime_type,bytes,alt_text FROM cms_media WHERE id=? AND status='published' AND rights_status='approved_public'").get(id) as { storage_key: string; mime_type: string; bytes: number; alt_text: string | null } | undefined;
    if (!row || basename(row.storage_key) !== row.storage_key) return new NextResponse(null, { status: 404 });
    try {
      const data = await readFile(join(mediaDir, row.storage_key));
      if (data.byteLength !== row.bytes) return new NextResponse(null, { status: 404 });
      return new NextResponse(data, { headers: { "content-type": row.mime_type, "cache-control": "public, max-age=31536000, immutable", "content-disposition": `inline; filename="${row.storage_key}"`, "x-content-type-options": "nosniff" } });
    } catch { return new NextResponse(null, { status: 404 }); }
  } finally { db.close(); }
}
