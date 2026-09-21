import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

async function moduleAt(path, overrides = {}) {
  const source = await readFile(path, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const scope = { exports: {}, ...overrides };
  vm.runInNewContext(code, scope, { filename: path });
  return scope.exports;
}
const cars = JSON.parse(await readFile("lib/mehr-site/vehicles.json", "utf8"));
const { recommendVehicles, blankFinder, validSlugs, calculateBudget, parseAmount } = await moduleAt("lib/mehr-site/experience.ts");
assert.equal(recommendVehicles(cars, blankFinder).length, 30);
const ranked = recommendVehicles(cars, { body: "سدان", fuel: "هایبرید", brand: "toyota" });
assert(ranked[0].score === 9 && ranked[0].car.brand === "toyota" && ranked[0].car.specs.body.includes("سدان"));
assert(ranked.every((item, index) => index === 0 || item.score <= ranked[index - 1].score));
assert.equal(recommendVehicles(cars, { body: "not-a-body", fuel: "", brand: "" }).length, 0);
assert.deepEqual(Array.from(validSlugs(["camry", "camry", "no-such-car", "rav4", "k5", "k3"], cars, 3)), ["camry", "rav4", "k5"]);
assert.equal(validSlugs("camry", cars).length, 0);
assert.equal(parseAmount("۱٬۲۵۰٬۰۰۰"), 1250000);
assert.equal(parseAmount("١٢٣٤"), 1234);
assert(Number.isNaN(parseAmount("1e10")));
const budget = calculateBudget({ price: 100000003, down: 20000000, trade: 10000000, extra: 2000, months: 12 });
assert.equal(budget.total, 100002003);
assert.equal(budget.balance, 70002003);
assert.equal(budget.installment * 11 + budget.finalInstallment, budget.balance);
for (const invalid of [
  { price: NaN, down: 0, trade: 0, extra: 0, months: 12 },
  { price: 100, down: 101, trade: 0, extra: 0, months: 12 },
  { price: 100, down: -1, trade: 0, extra: 0, months: 12 },
  { price: 100, down: 0, trade: 0, extra: 0, months: 0 },
  { price: 100, down: 0, trade: 0, extra: 0, months: 61 },
  { price: 1e12, down: 0, trade: 0, extra: 1, months: 12 },
]) assert.equal(calculateBudget(invalid), null);
assert.equal(calculateBudget({ price: 100, down: 100, trade: 0, extra: 0, months: 12 }).balance, 0);

const { parsePublicIntake, normalizeMobile } = await moduleAt("lib/mehr-site/intake.ts");
const intake = { kind: "visit", name: "Test", phone: "09120000000", vehicleSlug: "camry", branch: "شوروم مهر", preferredDate: "", note: "", color: "", usedModel: "", usedYear: "", mileage: "", condition: "", consent: true, consentVersion: "mehr-contact-v1" };
assert.equal(normalizeMobile("+۹۸ ۹۱۲ ۰۰۰ ۰۰۰۰"), "09120000000");
assert(parsePublicIntake(intake));
for (const invalid of [{ ...intake, consent: false }, { ...intake, customerId: "someone-else" }, { ...intake, vin: "not-public" }, { ...intake, name: "" }, { ...intake, phone: "1234" }, { ...intake, note: "a".repeat(1201) }, { ...intake, preferredDate: "2026-02-30" }, { ...intake, kind: "trade-in" }]) assert.equal(parsePublicIntake(invalid), null);
assert(parsePublicIntake({ ...intake, kind: "trade-in", usedModel: "Test", usedYear: "2020", mileage: "12000", condition: "needs inspection" }));

// Exercise device-local preferences without a browser or customer data.
const storage = new Map();
let blocked = false;
const garage = await moduleAt("components/mehr-site/garage-store.tsx", {
  localStorage: { getItem: key => { if (blocked) throw new Error("blocked"); return storage.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw new Error("blocked"); storage.set(key, value); } },
  window: { addEventListener() {}, removeEventListener() {} },
  require: name => {
    if (name === "react") return { useSyncExternalStore: (_subscribe, snapshot) => snapshot() };
    if (name === "@/lib/mehr-site/data") return { vehicles: cars };
    if (name === "@/lib/mehr-site/experience") return { blankFinder, validSlugs };
    return {};
  },
});
assert.equal(garage.useGarage().favorites.length, 0);
assert(garage.updateGarage(current => ({ ...current, favorites: ["camry"], compare: ["camry"] })));
assert.equal(garage.useGarage().favorites[0], "camry");
const stored = [...storage.values()][0];
assert.deepEqual(Object.keys(JSON.parse(stored)).sort(), ["compare", "favorites", "finder"]);
storage.set("mehr-public-preferences-v1", "corrupt");
assert.equal(garage.useGarage().favorites.length, 0);
blocked = true;
assert.equal(garage.updateGarage(current => ({ ...current, favorites: ["rav4"] })), false);
console.log("PASS: recommendations, public-ID validation, exact arithmetic, intake consent/allowlist and device-local preference safety");

// Mock the external intake boundary: these checks never contact a live CRM.
let forwarded;
let upstreamMode = "received";
const api = await moduleAt("app/mehr-api/v1/requests/route.ts", {
  URL, Response, Request, Buffer, AbortSignal,
  process: { env: { MEHR_PUBLIC_INTAKE_API_URL: "https://approved-intake.example.test/requests", MEHR_PUBLIC_INTAKE_API_TOKEN: "test-token-only-".repeat(4), MEHR_PUBLIC_SITE_ORIGIN: "http://127.0.0.1:3001" } },
  require: name => {
    if (name === "node:crypto") return { randomUUID: () => "11111111-1111-4111-8111-111111111111" };
    if (name === "@/lib/mehr-site/intake") return { parsePublicIntake };
    if (name === "@/lib/mehr-site/data") return { vehicles: cars, branches: [{ name: "شوروم مهر" }] };
    return {};
  },
  fetch: async (_url, options) => {
    forwarded = { body: JSON.parse(options.body), options };
    if (upstreamMode === "error") throw new Error("mock unavailable");
    return Response.json(upstreamMode === "received" ? { status: "received", reference: "MEHR-TEST-01", auditRecorded: true } : { status: "received", reference: "MEHR-TEST-01" });
  },
});
function intakeRequest(body = intake, headers = {}) {
  return new Request("http://127.0.0.1:3001/mehr-api/v1/requests", { method: "POST", headers: { Origin: "http://127.0.0.1:3001", "Content-Type": "application/json", "Idempotency-Key": "11111111-1111-4111-8111-111111111111", ...headers }, body: JSON.stringify(body) });
}
assert.equal((await api.POST(intakeRequest(intake, { Origin: "https://foreign.example.test" }))).status, 403);
assert.equal((await api.POST(intakeRequest(intake, { "Idempotency-Key": "wrong" }))).status, 400);
assert.equal((await api.POST(intakeRequest({ ...intake, consent: false }))).status, 400);
assert.equal((await api.POST(intakeRequest({ ...intake, vehicleSlug: "unknown" }))).status, 400);
assert.equal((await api.POST(intakeRequest({ ...intake, branch: "unknown" }))).status, 400);
assert.equal((await api.POST(intakeRequest({ note: "a".repeat(17000) }))).status, 413);
const accepted = await api.POST(intakeRequest());
assert.equal(accepted.status, 201);
assert.equal((await accepted.json()).appointmentConfirmed, false);
assert.equal(forwarded.body.contactVerified, false);
assert.equal(forwarded.body.marketingConsent, false);
assert.equal(forwarded.options.redirect, "error");
assert.equal(forwarded.options.headers["Idempotency-Key"], "11111111-1111-4111-8111-111111111111");
upstreamMode = "missing-audit";
assert.equal((await api.POST(intakeRequest())).status, 502);
upstreamMode = "error";
assert.equal((await api.POST(intakeRequest())).status, 502);
console.log("PASS: mocked intake origin, bounded input, consent, identity allowlist, idempotency forwarding and audited receipt gate");

const base = "http://127.0.0.1:3001";
for (const route of ["finder", "compare", "garage", "showroom", "purchase-plan", "trade-in", "visit", "my-car"]) {
  const response = await fetch(`${base}/mehr/${route}`, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert(html.includes("mx-nav") && html.includes("noindex"), route);
}
for (const url of ["/mehr/compare?cars=camry,rav4,k5", "/mehr/garage?cars=camry,invalid,camry", "/mehr/showroom?car=rav4", "/mehr/visit?car=camry&color=%D8%B3%D9%81%DB%8C%D8%AF", "/mehr/purchase-plan?car=not-a-car"]) {
  assert.equal((await fetch(base + url)).status, 200, url);
}
const capabilities = await fetch(base + "/mehr-api/v1/requests");
assert.equal(capabilities.status, 200);
assert.equal(capabilities.headers.get("cache-control"), "no-store");
const availability = await capabilities.json();
assert.equal(availability.uploadsAvailable, false);
if (!availability.available) {
  // Do not submit contact data when a real upstream has been configured.
  const disabled = await fetch(base + "/mehr-api/v1/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(disabled.status, 503);
}
assert.equal((await fetch(base + "/mehr/compare/invalid")).status, 404);
console.log("PASS: eight public experience routes, shared model links, invalid routes and fail-closed intake");
