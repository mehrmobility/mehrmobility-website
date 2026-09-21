import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

// Exercise the real BFF boundary with an isolated HTTP fixture, never the live DB.
const source = await readFile("lib/customer-api/marketplace-source.ts", "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const listing = {
  id: "used_test_listing", kind: "USED_SUPPLY", publicationState: "PUBLISHED", publicationAudience: "CUSTOMER", sourceApprovalState: "PRICE_APPROVED", publicationRevision: 2,
  title: "خودروی آزمون", trim: "تیپ آزمون", modelYear: 2022, imageUrl: "/vehicles/verified-used-sedan.png", gallery: [],
  price: { amount: "30000000000", currency: "IRR", displayLabel: "قیمت آزمون" }, availability: "AVAILABLE", availabilityLabel: "قابل استعلام", primaryActionLabel: "استعلام", specs: [], features: [], description: "آزمون", terms: [],
  usedSupply: { depositAmount: { amount: "2000000000", currency: "IRR", displayLabel: "بیعانه آزمون" }, offerNotice: "پیشنهاد آزمون", inspectionNotice: "کارشناسی آزمون" },
};
const media = { id: "media_test_image", listingId: listing.id, kind: "IMAGE", subject: "LISTING_VEHICLE", publicationState: "PUBLISHED", publicationAudience: "CUSTOMER", rightsState: "APPROVED", scanState: "CLEAN", redactionState: "APPROVED" };
let current = structuredClone(listing);
let imageMode = "valid";
let binaryReads = 0;
const scope = {
  exports: {}, URL, Response, Uint8Array, TextDecoder, AbortSignal, Date, Buffer,
  process: { env: { NODE_ENV: "production", MEHR_MARKETPLACE_READ_API_URL: "https://mehr-customer-api.example.test", MEHR_MARKETPLACE_READ_API_HOSTS: "mehr-customer-api.example.test", MEHR_MARKETPLACE_READ_API_TOKEN: "test-only-credential-not-real-".repeat(2) } },
  require: name => { if (["server-only", "node:fs/promises", "node:path", "./read-model"].includes(name)) return {}; throw new Error(`Unexpected import ${name}`); },
  fetch: async (url, options) => {
    assert.equal(new URL(url).hostname, "mehr-customer-api.example.test");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    if (url.includes("/media/")) {
      binaryReads++;
      if (imageMode === "html") return new Response("<html>no</html>", { headers: { "Content-Type": "text/html" } });
      if (imageMode === "spoofed") return new Response("<html>no</html>", { headers: { "Content-Type": "image/jpeg" } });
      if (imageMode === "oversized") return new Response(new Uint8Array(5 * 1024 * 1024 + 1), { headers: { "Content-Type": "image/jpeg" } });
      if (imageMode === "revoked") return new Response(null, { status: 404 });
      return new Response(new Uint8Array([255, 216, 255, 224, 0]), { headers: { "Content-Type": "image/jpeg" } });
    }
    return Response.json({ data: url.endsWith(`/${listing.id}`) ? current : [current], meta: { contractVersion: 1, audience: "CUSTOMER" } });
  },
};
vm.runInNewContext(code, scope);
const api = scope.exports;
const read = () => api.getCustomerMarketplaceListing("customer_test", listing.id);
assert.equal((await read()).imageUrl, "");
current.customerMedia = [media];
assert.equal((await read()).imageUrl, `/customer-api/v1/marketplace/listings/${listing.id}/media/${media.id}`);
for (const changed of [{ listingId: "another_listing" }, { rightsState: "PENDING" }, { scanState: "PENDING" }, { redactionState: "PENDING" }, { publicationAudience: "STAFF" }, { subject: "MODEL_IMAGE" }, { publicationState: "DRAFT" }]) {
  current.customerMedia = [{ ...media, ...changed }];
  assert.equal((await read()).imageUrl, "");
}
current.customerMedia = [media];
assert.equal(await api.getCustomerMarketplaceImage("customer_test", listing.id, "different_media"), null);
assert.equal(binaryReads, 0);
assert.equal((await api.getCustomerMarketplaceImage("customer_test", listing.id, media.id)).contentType, "image/jpeg");
for (const mode of ["html", "spoofed", "oversized"]) {
  imageMode = mode;
  await assert.rejects(api.getCustomerMarketplaceImage("customer_test", listing.id, media.id));
}
imageMode = "revoked";
assert.equal(await api.getCustomerMarketplaceImage("customer_test", listing.id, media.id), null);
const summary = { text: "خلاصه تأییدشده", revision: 1, sourceListingRevision: 2, approvedAt: "2026-09-12T10:00:00Z", approvalState: "APPROVED", publicationState: "PUBLISHED", publicationAudience: "CUSTOMER", privateNote: "never forward" };
current.customerSummary = summary;
assert.deepEqual(Object.keys((await read()).customerSummary).sort(), ["approvedAt", "revision", "text"]);
current.customerSummary = { ...summary, sourceListingRevision: 1 };
assert.equal((await read()).customerSummary, undefined);
current.customerSummary = { ...summary, approvalState: "DRAFT" };
assert.equal((await read()).customerSummary, undefined);
console.log("PASS: published listing-bound media, revocation, MIME/signature/size limits, source isolation and approved summary revisions");
