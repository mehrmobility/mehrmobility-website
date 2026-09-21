import "server-only";

import { readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";

import type { ListingCollectionResponse, ListingKind, MarketplaceListing } from "./contracts";
import { getMarketplaceListing, listMarketplaceListings } from "./read-model";

const upstreamBaseUrlValue = process.env.MEHR_MARKETPLACE_READ_API_URL?.trim();
const upstreamTokenValue = process.env.MEHR_MARKETPLACE_READ_API_TOKEN?.trim();
const upstreamTokenFile = process.env.MEHR_MARKETPLACE_READ_API_TOKEN_FILE?.trim();
const upstreamConfigured = Boolean(upstreamBaseUrlValue || upstreamTokenValue || upstreamTokenFile);
const COLLECTION_LIMIT_BYTES = 1_048_576;
const DETAIL_LIMIT_BYTES = 262_144;
const MAX_LISTINGS = 200;
const IMAGE_LIMIT_BYTES = 5 * 1024 * 1024;
const upstreamNotFound = Symbol("UPSTREAM_NOT_FOUND");

function text(value: unknown, field: string, max = 250): string {
  if (typeof value !== "string") throw new Error(`INVALID_UPSTREAM_${field}`);
  const result = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!result || result.length > max || /[\u0000-\u001f\u007f]/u.test(result)) {
    throw new Error(`INVALID_UPSTREAM_${field}`);
  }
  return result;
}

function optionalText(value: unknown, field: string, max = 250): string | undefined {
  return value === undefined || value === null || value === "" ? undefined : text(value, field, max);
}

function safeMoneyAmount(value: unknown, nullable: boolean) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,19})$/.test(value)) throw new Error("INVALID_UPSTREAM_MONEY");
  return value;
}

function safeImagePath(value: unknown, field: string) {
  const path = text(value, field, 300);
  if (!/^\/[A-Za-z0-9/_-]+\.(?:png|jpe?g|webp|avif)$/i.test(path) || path.includes("//")) {
    throw new Error(`INVALID_UPSTREAM_${field}`);
  }
  return path;
}

function boundedArray(value: unknown, field: string, max: number) {
  if (!Array.isArray(value) || value.length > max) throw new Error(`INVALID_UPSTREAM_${field}`);
  return value;
}

function validYear(value: unknown) {
  if (!Number.isSafeInteger(value)) throw new Error("INVALID_UPSTREAM_MODEL_YEAR");
  const year = Number(value);
  if (!((year >= 1300 && year <= 1499) || (year >= 1900 && year <= 2100))) {
    throw new Error("INVALID_UPSTREAM_MODEL_YEAR");
  }
  return year;
}

function customerImagePath(listingId: string, mediaId: string) {
  return `/customer-api/v1/marketplace/listings/${encodeURIComponent(listingId)}/media/${encodeURIComponent(mediaId)}`;
}

function publishedImagePaths(record: Record<string, unknown>, listingId: string): string[] {
  if (record.customerMedia === undefined) return [];
  const media = boundedArray(record.customerMedia, "CUSTOMER_MEDIA", 20);
  const ids = new Set<string>();
  for (const candidate of media) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as Record<string, unknown>;
    if (item.kind !== "IMAGE" || item.subject !== "LISTING_VEHICLE" || item.listingId !== listingId || item.publicationState !== "PUBLISHED" || item.publicationAudience !== "CUSTOMER" || item.rightsState !== "APPROVED" || item.scanState !== "CLEAN" || item.redactionState !== "APPROVED") continue;
    const id = text(item.id, "MEDIA_ID", 100);
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(id)) throw new Error("INVALID_UPSTREAM_MEDIA_ID");
    ids.add(id);
  }
  return [...ids].map((id) => customerImagePath(listingId, id));
}

function sanitizeListing(value: unknown, requestedKind?: ListingKind): MarketplaceListing {
  if (!value || typeof value !== "object") throw new Error("INVALID_UPSTREAM_LISTING");
  const record = value as Record<string, unknown>;
  const kind = record.kind;
  if (kind !== "SALES_PLAN" && kind !== "USED_SUPPLY") throw new Error("INVALID_UPSTREAM_KIND");
  if (requestedKind && kind !== requestedKind) throw new Error("UPSTREAM_KIND_SCOPE_VIOLATION");
  if (record.publicationState !== "PUBLISHED" || record.publicationAudience !== "CUSTOMER") {
    throw new Error("UPSTREAM_NOT_PUBLISHED_FOR_CUSTOMER");
  }
  if (kind === "USED_SUPPLY" && record.sourceApprovalState !== "PRICE_APPROVED") {
    throw new Error("UPSTREAM_USED_PRICE_NOT_APPROVED");
  }

  const availability = record.availability;
  if (!["AVAILABLE", "LIMITED", "RESERVED", "CLOSED"].includes(String(availability))) {
    throw new Error("INVALID_UPSTREAM_AVAILABILITY");
  }
  const price = record.price as Record<string, unknown> | undefined;
  if (!price || price.currency !== "IRR") throw new Error("INVALID_UPSTREAM_PRICE");
  const specs = boundedArray(record.specs, "SPECS", 30);
  const features = boundedArray(record.features, "FEATURES", 30);
  const gallery = boundedArray(record.gallery, "GALLERY", 20);
  const terms = boundedArray(record.terms, "TERMS", 20);

  // A second explicit allowlist at the BFF boundary. Publication proof fields
  // are verified above and then discarded together with every unknown field.
  const sanitized: MarketplaceListing = {
    id: text(record.id, "ID", 100),
    kind,
    title: text(record.title, "TITLE", 160),
    trim: text(record.trim, "TRIM", 160),
    modelYear: validYear(record.modelYear),
    imageUrl: safeImagePath(record.imageUrl, "IMAGE_URL"),
    gallery: gallery.map((item) => safeImagePath(item, "GALLERY_ITEM")),
    hasVideo: record.hasVideo === true,
    price: {
      amount: safeMoneyAmount(price.amount, true),
      currency: "IRR",
      displayLabel: text(price.displayLabel, "PRICE_LABEL", 100),
    },
    availability: availability as MarketplaceListing["availability"],
    availabilityLabel: text(record.availabilityLabel, "AVAILABILITY_LABEL", 80),
    primaryActionLabel: text(record.primaryActionLabel, "ACTION_LABEL", 80),
    specs: specs.map((item) => {
      if (!item || typeof item !== "object") throw new Error("INVALID_UPSTREAM_SPEC");
      const spec = item as Record<string, unknown>;
      return { label: text(spec.label, "SPEC_LABEL", 80), value: text(spec.value, "SPEC_VALUE", 180) };
    }),
    features: features.map((item) => text(item, "FEATURE", 180)),
    description: text(record.description, "DESCRIPTION", 2_000),
    terms: terms.map((item) => text(item, "TERM", 500)),
  };

  if (kind === "USED_SUPPLY") {
    // Only customer-published images of this exact listing replace the old
    // model illustration. The browser never sees an external source URL.
    const images = publishedImagePaths(record, sanitized.id);
    sanitized.imageUrl = images[0] ?? "";
    sanitized.gallery = images.slice(1);
  }

  const locationLabel = optionalText(record.locationLabel, "LOCATION", 120);
  const summary = record.customerSummary as Record<string, unknown> | undefined;
  if (summary && summary.publicationState === "PUBLISHED" && summary.approvalState === "APPROVED" && summary.publicationAudience === "CUSTOMER" && Number.isSafeInteger(record.publicationRevision) && Number(record.publicationRevision) > 0 && summary.sourceListingRevision === record.publicationRevision) {
    if (!Number.isSafeInteger(summary.revision) || Number(summary.revision) < 1) throw new Error("INVALID_UPSTREAM_SUMMARY_REVISION");
    const approvedAt = text(summary.approvedAt, "SUMMARY_APPROVED_AT", 40);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(approvedAt) || !Number.isFinite(Date.parse(approvedAt))) throw new Error("INVALID_UPSTREAM_SUMMARY_DATE");
    sanitized.customerSummary = { text: text(summary.text, "CUSTOMER_SUMMARY", 2_000), revision: Number(summary.revision), approvedAt };
  }
  const deliveryWindow = optionalText(record.deliveryWindow, "DELIVERY_WINDOW", 180);
  const registrationDeadline = optionalText(record.registrationDeadline, "REGISTRATION_DEADLINE", 120);
  const purchaseMethod = optionalText(record.purchaseMethod, "PURCHASE_METHOD", 180);
  if (locationLabel) sanitized.locationLabel = locationLabel;
  if (deliveryWindow) sanitized.deliveryWindow = deliveryWindow;
  if (registrationDeadline) sanitized.registrationDeadline = registrationDeadline;
  if (purchaseMethod) sanitized.purchaseMethod = purchaseMethod;
  if (record.mileageKm !== undefined) {
    if (!Number.isSafeInteger(record.mileageKm) || Number(record.mileageKm) < 0 || Number(record.mileageKm) > 10_000_000) {
      throw new Error("INVALID_UPSTREAM_MILEAGE");
    }
    sanitized.mileageKm = Number(record.mileageKm);
  }

  if (kind === "USED_SUPPLY") {
    const usedSupply = record.usedSupply as Record<string, unknown> | undefined;
    const deposit = usedSupply?.depositAmount as Record<string, unknown> | undefined;
    if (!usedSupply || !deposit || deposit.currency !== "IRR") throw new Error("INVALID_UPSTREAM_USED_SUPPLY_TERMS");
    const depositAmount = safeMoneyAmount(deposit.amount, false);
    if (depositAmount !== "2000000000") throw new Error("INVALID_UPSTREAM_DEPOSIT_POLICY");
    sanitized.usedSupply = {
      depositAmount: {
        amount: depositAmount,
        currency: "IRR",
        displayLabel: text(deposit.displayLabel, "DEPOSIT_LABEL", 100),
      },
      offerNotice: text(usedSupply.offerNotice, "OFFER_NOTICE", 500),
      inspectionNotice: text(usedSupply.inspectionNotice, "INSPECTION_NOTICE", 500),
    };
  }

  return sanitized;
}

function validatedBaseUrl() {
  if (!upstreamBaseUrlValue) throw new Error("MARKETPLACE_UPSTREAM_URL_MISSING");
  let url: URL;
  try {
    url = new URL(upstreamBaseUrlValue);
  } catch {
    throw new Error("MARKETPLACE_UPSTREAM_URL_INVALID");
  }
  const loopback = ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname);
  const allowedHosts = new Set((process.env.MEHR_MARKETPLACE_READ_API_HOSTS ?? "").split(",").map((host) => host.trim()).filter(Boolean));
  if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !(loopback && url.protocol === "http:"))) {
    throw new Error("MARKETPLACE_UPSTREAM_URL_INVALID");
  }
  if (!loopback && !allowedHosts.has(url.hostname)) throw new Error("MARKETPLACE_UPSTREAM_HOST_NOT_ALLOWED");
  return url.toString().replace(/\/$/, "");
}

async function readUpstreamToken() {
  let token = upstreamTokenValue;
  if (!token && upstreamTokenFile) {
    if (!isAbsolute(upstreamTokenFile)) throw new Error("MARKETPLACE_TOKEN_FILE_INVALID");
    const content = await readFile(upstreamTokenFile, "utf8");
    token = content.split(/\r?\n/).find((line) => line.startsWith("MEHR_CUSTOMER_MARKETPLACE_READ_TOKEN="))?.slice("MEHR_CUSTOMER_MARKETPLACE_READ_TOKEN=".length).trim();
  }
  if (!token || !/^[A-Za-z0-9_-]{43,200}$/.test(token)) throw new Error("MARKETPLACE_UPSTREAM_TOKEN_MISSING");
  return token;
}

async function readBoundedJson(response: Response, maxBytes: number) {
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
  if (contentType !== "application/json" && !(contentType.startsWith("application/") && contentType.endsWith("+json"))) {
    throw new Error("MARKETPLACE_UPSTREAM_NOT_JSON");
  }
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("MARKETPLACE_UPSTREAM_TOO_LARGE");
  if (!response.body) throw new Error("MARKETPLACE_UPSTREAM_EMPTY");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("MARKETPLACE_UPSTREAM_TOO_LARGE");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    throw new Error("MARKETPLACE_UPSTREAM_INVALID_JSON");
  }
}

function validateEnvelope(payload: unknown) {
  if (!payload || typeof payload !== "object") throw new Error("INVALID_UPSTREAM_ENVELOPE");
  const meta = (payload as { meta?: unknown }).meta;
  if (!meta || typeof meta !== "object") throw new Error("INVALID_UPSTREAM_META");
  const contract = meta as Record<string, unknown>;
  if (contract.contractVersion !== 1 || contract.audience !== "CUSTOMER") throw new Error("UPSTREAM_CONTRACT_MISMATCH");
}

async function upstreamFetch(path: string, maxBytes: number, customerId: string) {
  const baseUrl = validatedBaseUrl();
  const token = await readUpstreamToken();
  const customerSubject = /^[A-Za-z0-9_-]{3,100}$/.test(customerId) ? customerId : "CUSTOMER_WEBAPP";
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Mehr-Customer-Subject": customerSubject,
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return upstreamNotFound;
  if (!response.ok) throw new Error(`MARKETPLACE_UPSTREAM_${response.status}`);
  return readBoundedJson(response, maxBytes);
}

export async function listCustomerMarketplace(customerId: string, kind?: ListingKind) {
  if (!upstreamConfigured && process.env.NODE_ENV !== "production") return listMarketplaceListings(customerId, kind);
  const payload = await upstreamFetch(`/v1/listings${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`, COLLECTION_LIMIT_BYTES, customerId);
  if (payload === upstreamNotFound) throw new Error("MARKETPLACE_UPSTREAM_COLLECTION_NOT_FOUND");
  validateEnvelope(payload);
  const rawData = (payload as { data?: unknown }).data;
  if (!Array.isArray(rawData) || rawData.length > MAX_LISTINGS) throw new Error("INVALID_UPSTREAM_COLLECTION");
  const data = rawData.map((item) => sanitizeListing(item, kind));
  if (new Set(data.map((listing) => listing.id)).size !== data.length) throw new Error("DUPLICATE_UPSTREAM_LISTING_ID");
  return data;
}

export async function getCustomerMarketplaceListing(customerId: string, listingId: string) {
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(listingId)) return null;
  if (!upstreamConfigured && process.env.NODE_ENV !== "production") return getMarketplaceListing(customerId, listingId);
  const payload = await upstreamFetch(`/v1/listings/${encodeURIComponent(listingId)}`, DETAIL_LIMIT_BYTES, customerId);
  if (payload === upstreamNotFound) return null;
  validateEnvelope(payload);
  const data = (payload as { data?: unknown }).data;
  if (!data) return null;
  const sanitized = sanitizeListing(data);
  if (sanitized.id !== listingId) throw new Error("UPSTREAM_DETAIL_ID_MISMATCH");
  return sanitized;
}

export function collectionEnvelope(data: MarketplaceListing[]): ListingCollectionResponse {
  return {
    data,
    meta: { total: data.length, source: "CUSTOMER_READ_MODEL", generatedAt: new Date().toISOString() },
  };
}

export async function getCustomerMarketplaceImage(customerId: string, listingId: string, mediaId: string) {
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(listingId) || !/^[A-Za-z0-9_-]{8,100}$/.test(mediaId)) return null;
  if (!upstreamConfigured) return null;
  const listing = await getCustomerMarketplaceListing(customerId, listingId);
  const path = customerImagePath(listingId, mediaId);
  if (!listing || ![listing.imageUrl, ...listing.gallery].includes(path)) return null;
  const response = await fetch(`${validatedBaseUrl()}/v1/listings/${encodeURIComponent(listingId)}/media/${encodeURIComponent(mediaId)}`, {
    headers: { Authorization: `Bearer ${await readUpstreamToken()}`, Accept: "image/jpeg, image/png, image/webp", "X-Mehr-Customer-Subject": customerId },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404 || response.status === 403) return null;
  if (response.status !== 200 || !response.body) throw new Error("MARKETPLACE_IMAGE_UNAVAILABLE");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (!contentType || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) { await response.body.cancel(); throw new Error("INVALID_IMAGE_TYPE"); }
  if (Number(response.headers.get("content-length") ?? 0) > IMAGE_LIMIT_BYTES) { await response.body.cancel(); throw new Error("IMAGE_TOO_LARGE"); }
  const reader = response.body.getReader();
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > IMAGE_LIMIT_BYTES) { await reader.cancel(); throw new Error("IMAGE_TOO_LARGE"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(contentType === "image/jpeg" ? jpeg : contentType === "image/png" ? png : webp)) throw new Error("INVALID_IMAGE_SIGNATURE");
  return { bytes, contentType };
}
