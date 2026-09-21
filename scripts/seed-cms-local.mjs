import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const databasePath = join(root, "data", "mehr-cms.local.db");
await mkdir(join(root, "data"), { recursive: true });
const database = new DatabaseSync(databasePath);
try {
  for (const sqlPath of ["db/migrations/sqlite/001_mehr_cms.sql", "db/seeds/001_home_page.sql", "db/seeds/002_static_page_intros.sql", "db/seeds/sqlite/001_cms_roles.sql"]) {
    database.exec(await readFile(join(root, sqlPath), "utf8"));
  }
} finally {
  database.close();
}
for (const script of ["seed-cms-catalog.mjs", "seed-cms-editorial.mjs", "seed-cms-import-guides.mjs", "seed-cms-public-media.mjs"]) {
  execFileSync(process.execPath, [join(root, "scripts", script)], { cwd: root, stdio: "inherit" });
}
console.log("Local CMS seed is ready.");
