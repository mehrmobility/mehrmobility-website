import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import vm from "node:vm";
import ts from "typescript";

const cars=JSON.parse(await readFile("lib/mehr-site/vehicles.json","utf8"));
const entries=JSON.parse(await readFile("lib/mehr-site/editorial.json","utf8"));
const tables=JSON.parse(await readFile("lib/mehr-site/technical-tables.json","utf8"));
const source=await readFile("lib/mehr-site/catalog.ts","utf8");
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const scope={exports:{}};vm.runInNewContext(code,scope);
const {filterVehicles,emptyFilters,normalizeText}=scope.exports;
assert.equal(cars.length,30);
assert.equal(new Set(cars.map(x=>x.brand)).size,9);
assert.equal(filterVehicles(cars,emptyFilters).length,30);
assert.deepEqual(Array.from(filterVehicles(cars,{...emptyFilters,brand:"suzuki"}),x=>x.slug).sort(),["fronx","grand-vitara"]);
assert.equal(filterVehicles(cars,{...emptyFilters,q:"fronx"})[0].slug,"fronx");
assert.equal(filterVehicles(cars,{...emptyFilters,q:"no_such_vehicle"}).length,0);
assert.equal(normalizeText("كيا ۲۰۲۵"),"کیا 2025");
assert.equal(entries.filter(e=>e.type==="posts").length,10);
assert.equal(entries.filter(e=>e.type==="notifications").length,4);
assert.equal(entries.filter(e=>e.type==="service").length,7);
assert.equal(cars.filter(v=>v.catalogUrl).length,27);
assert.equal(cars.reduce((sum,c)=>sum+c.gallery.length,0),271);
assert.deepEqual(Object.keys(tables).sort(),["camry","corolla-cross","rav4"]);
for(const car of cars){const ext=new URL(car.primaryImage.url).pathname.split(".").pop();assert((await stat(`public/mehr-site/vehicles/${car.slug}.${ext}`)).size>0);}
for(const entry of entries){
  if(entry.displayImage?.startsWith("https://mehrkhodro.co/")){const ext=new URL(entry.displayImage).pathname.split(".").pop();assert((await stat(`public/mehr-site/content/${entry.id}.${ext}`)).size>0);}
  assert(!/<(?:script|form|iframe|object|embed|input|style)\b|\son\w+\s*=|javascript:|vbscript:/i.test(entry.bodyHtml));
}
console.log("PASS: catalog filters, public content counts, media assets and HTML checks");

const base="http://127.0.0.1:3001";
const sections=["cars","services","news","journal","about","contact","customers","numberplate","survey","complaints","rights","communication"];
const paths=["/mehr",...sections.map(x=>`/mehr/${x}`),...cars.map(v=>`/mehr/cars/${v.slug}`),...entries.filter(e=>["posts","notifications","service"].includes(e.type)).map(e=>`/mehr/${{posts:"journal",notifications:"news",service:"services"}[e.type]}/${encodeURIComponent(e.slug)}`)];
let cursor=0;
const failures=[];
await Promise.all(Array.from({length:3},async()=>{
  while(cursor<paths.length){const route=paths[cursor++];try{const response=await fetch(base+route,{signal:AbortSignal.timeout(45000)});assert.equal(response.status,200);const html=await response.text();assert(html.includes("ms-header")&&html.includes("ms-footer")&&html.includes("noindex"));}catch(error){failures.push({route,error:error.message});}}
}));
assert.deepEqual(failures,[]);
console.log(`PASS: ${paths.length} routes return 200 with branded shell and noindex`);
const missing=await fetch(base+"/mehr/cars/not-a-real-car");assert.equal(missing.status,404);
const filtered=await (await fetch(base+"/mehr/cars?brand=suzuki")).text();
assert.equal(filtered.split("<main")[1].split("</main>")[0].split('class="ms-car-card"').length-1,2);
const portal=await fetch(base+"/");assert.equal(portal.status,200);
console.log("PASS: unknown car 404, server-rendered Suzuki filter, original portal still 200");
for(const [legacy, destination] of [["/car/camry/","/mehr/cars/camry"],["/service/1392/","/mehr/services/1392"],["/about-us/","/mehr/about"],["/%D8%A7%D9%85%D9%88%D8%B1-%D9%85%D8%B4%D8%AA%D8%B1%DB%8C%D8%A7%D9%86/","/mehr/customers"],["/shop/",null]]){
  const response=await fetch(base+legacy,{redirect:"manual"});
  if(destination){assert.equal(response.status,308,legacy);assert.equal(response.headers.get("location"),destination,legacy);}else assert.equal(response.status,404,legacy);
}
const robots=await fetch(base+"/robots.txt");assert.equal(robots.status,200);assert((await robots.text()).includes("Disallow: /"));
const sitemap=await fetch(base+"/sitemap.xml");assert.equal(sitemap.status,200);assert(!(await sitemap.text()).includes("/mehr/cars/"));
console.log("PASS: legacy URLs redirect only to matching content; retired paths 404; preview robots and sitemap remain non-indexable");
