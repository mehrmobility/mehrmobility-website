import "server-only";
import { randomUUID } from "node:crypto";
import { parsePublicIntake } from "@/lib/mehr-site/intake";
import { vehicles, branches } from "@/lib/mehr-site/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
function configuration() {
  try {
    const endpoint = new URL(process.env.MEHR_PUBLIC_INTAKE_API_URL || "");
    const origin = new URL(process.env.MEHR_PUBLIC_SITE_ORIGIN || "");
    const token = process.env.MEHR_PUBLIC_INTAKE_API_TOKEN || "";
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.hash || endpoint.hostname.endsWith(".invalid") || token.length < 32 || !["http:", "https:"].includes(origin.protocol) || (origin.protocol === "http:" && !["localhost", "127.0.0.1"].includes(origin.hostname))) return null;
    return { endpoint: endpoint.toString(), origin: origin.origin, token };
  } catch { return null; }
}

// A conservative single-process safety cap. The receiving service MUST provide
// distributed rate limits, durable idempotency, audit and authenticated staff access.
let windowStarted = 0, requestCount = 0;
export function GET() { return json({ available: Boolean(configuration()), uploadsAvailable: false }); }
export async function POST(request: Request) {
  const config = configuration();
  if (!config) return json({ error: "ارسال آنلاین هنوز متصل نیست؛ هیچ درخواستی ثبت نشده است." }, 503);
  if (request.headers.get("origin") !== config.origin) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "قالب درخواست معتبر نیست." }, 415);
  const now = Date.now();
  if (now - windowStarted > 60_000) { windowStarted = now; requestCount = 0; }
  if (++requestCount > 20) return json({ error: "درخواست‌های زیادی دریافت شد. یک دقیقه دیگر تلاش کنید." }, 429);
  const idempotencyKey = request.headers.get("idempotency-key") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) return json({ error: "شناسه درخواست معتبر نیست." }, 400);
  let input: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "درخواست خالی است." }, 400);
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > 16384) { await reader.cancel(); return json({ error: "درخواست بیش از حد بزرگ است." }, 413); } chunks.push(value); }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return json({ error: "اطلاعات درخواست خوانده نشد." }, 400); }
  const data = parsePublicIntake(input);
  if (!data || data.vehicleSlug && !vehicles.some(vehicle => vehicle.slug === data.vehicleSlug) || data && !branches.some(branch => branch.name === data.branch)) return json({ error: "اطلاعات و رضایت تماس را بررسی کنید." }, 400);
  const requestId = randomUUID();
  try {
    const response = await fetch(config.endpoint, {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey, "X-Request-Id": requestId },
      body: JSON.stringify({ ...data, source: "mehr-public-website", contactVerified: false, consentPurpose: "respond_to_this_request", marketingConsent: false }),
    });
    if (!response.ok) return json({ error: "تأیید ثبت دریافت نشد. با همان درخواست دوباره تلاش کنید یا تماس بگیرید." }, 502);
    const result = await response.json();
    if (result.status !== "received" || result.auditRecorded !== true || typeof result.reference !== "string" || !/^[A-Za-z0-9-]{6,64}$/.test(result.reference)) return json({ error: "تأیید معتبر ثبت دریافت نشد؛ با مهر پیگیری کنید." }, 502);
    return json({ reference: result.reference, status: "received", appointmentConfirmed: false }, 201);
  } catch {
    return json({ error: "پاسخ مرکز دریافت نشد؛ وضعیت ثبت نامشخص است. برای جلوگیری از ثبت تکراری، همین درخواست را دوباره ارسال کنید یا با مهر تماس بگیرید." }, 502);
  }
}
