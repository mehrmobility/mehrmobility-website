import { NextRequest, NextResponse } from "next/server";

import type { PurchaseApplicationRequest, PurchaseApplicationResponse } from "@/lib/customer-api/contracts";
import { getCustomerMarketplaceListing } from "@/lib/customer-api/marketplace-source";
import { checkRateLimit, executeIdempotent, IdempotencyConflict, recordAudit, requireCustomerPrincipal } from "@/lib/customer-api/security";
import { createUsedSupplyRequest } from "@/lib/customer-api/used-purchase-workflow";

export async function POST(request: NextRequest, context: { params: Promise<{ listingId: string }> }) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "ورود با شماره موبایل الزامی است." } }, { status: 401 });
  }
  const { listingId } = await context.params;
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(listingId)) {
    return NextResponse.json({ error: { code: "UNAVAILABLE", message: "این خودرو در دسترس نیست." } }, { status: 404 });
  }

  if (!checkRateLimit(`purchase:${principal.customerId}`, 5, 5 * 60_000)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید." } }, { status: 429, headers: { "Retry-After": "300" } });
  }

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return NextResponse.json({ error: { code: "IDEMPOTENCY_REQUIRED", message: "شناسه امن درخواست الزامی است." } }, { status: 400 });
  }

  let listing;
  try {
    listing = await getCustomerMarketplaceListing(principal.customerId, listingId);
  } catch {
    return NextResponse.json({ error: { code: "SOURCE_UNAVAILABLE", message: "کنترل موجودی موقتاً ممکن نیست." } }, { status: 503 });
  }
  if (!listing || !["AVAILABLE", "LIMITED"].includes(listing.availability)) {
    recordAudit({ action: "PURCHASE_APPLICATION", customerId: principal.customerId, listingId, result: "DENIED" });
    return NextResponse.json({ error: { code: "UNAVAILABLE", message: "این خودرو دیگر قابل درخواست نیست." } }, { status: 409 });
  }

  let body: Partial<PurchaseApplicationRequest>;
  try {
    body = (await request.json()) as Partial<PurchaseApplicationRequest>;
  } catch {
    return NextResponse.json({ error: { code: "INVALID_BODY", message: "اطلاعات درخواست معتبر نیست." } }, { status: 400 });
  }

  if (body.consentAccepted !== true || !["PHONE", "IN_APP"].includes(body.preferredContact ?? "")) {
    return NextResponse.json({ error: { code: "CONSENT_REQUIRED", message: "پذیرش شرایط و روش تماس الزامی است." } }, { status: 422 });
  }

  recordAudit({ action: "PURCHASE_APPLICATION", customerId: principal.customerId, listingId, result: "RECEIVED" });
  const suffix = idempotencyKey.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  let usedApplication;
  try {
    usedApplication = listing.kind === "USED_SUPPLY"
      ? executeIdempotent(
        `supply-request:${principal.customerId}:${listing.id}`,
        idempotencyKey,
        JSON.stringify(body),
        () => createUsedSupplyRequest(principal.customerId, listing),
      )
      : undefined;
  } catch (error) {
    if (error instanceof IdempotencyConflict) {
      return NextResponse.json({ error: { code: "IDEMPOTENCY_CONFLICT", message: error.message } }, { status: 409 });
    }
    throw error;
  }
  const response: PurchaseApplicationResponse = {
    data: {
      trackingCode: usedApplication?.trackingCode ?? `MEHR-${suffix || "DEMO01"}`,
      status: usedApplication ? "SUBMITTED" : "RECEIVED",
      statusLabel: usedApplication ? "درخواست تأمین ثبت شد" : "درخواست شما دریافت شد",
      listingId,
      nextStep: usedApplication ? "درخواست برای مدیر تأمین ارسال شد. قیمت و شرایط قطعی پس از تأیید وجود خودرو در پرونده نمایش داده می‌شود." : "شرایط احراز و مدارک لازم در پرونده شما بررسی می‌شود.",
      ...(usedApplication ? { application: usedApplication } : {}),
    },
  };

  return NextResponse.json(response, { status: 201, headers: { "Cache-Control": "no-store" } });
}
