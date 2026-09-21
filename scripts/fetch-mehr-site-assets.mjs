import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const cars = JSON.parse(await readFile(path.join(root, "lib/mehr-site/vehicles.json"), "utf8"));
const entries = JSON.parse(await readFile(path.join(root, "lib/mehr-site/editorial.json"), "utf8"));
const ext = url => new URL(url).pathname.split(".").pop();
const assets = [
  ...cars.map(car => ({ url: car.primaryImage.url, dest: `vehicles/${car.slug}.${ext(car.primaryImage.url)}` })),
  ...entries.filter(e => e.displayImage?.startsWith("https://mehrkhodro.co/")).map(e => ({ url: e.displayImage, dest: `content/${e.id}.${ext(e.displayImage)}` })),
];
let cursor = 0;
const errors = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < assets.length) {
    const asset = assets[cursor++];
    const destination = path.join(root, "public/mehr-site", asset.dest);
    try {
      await mkdir(path.dirname(destination), { recursive: true });
      const response = await fetch(asset.url, { signal: AbortSignal.timeout(35000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error(`Invalid image response ${response.status}`);
      await writeFile(destination, Buffer.from(await response.arrayBuffer()));
      console.log(`OK ${asset.dest}`);
    } catch (error) {
      errors.push(asset.dest);
      console.error(`FAILED ${asset.dest}: ${error.message}`);
    }
  }
}));
console.log(`${assets.length - errors.length}/${assets.length} official images downloaded`);
if (errors.length) process.exitCode = 1;
