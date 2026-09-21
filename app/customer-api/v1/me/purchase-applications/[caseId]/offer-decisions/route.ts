import { NextRequest, NextResponse } from "next/server";

import { decideOffer, WorkflowError } from "@/lib/customer-api/used-purchase-workflow";
import { checkRateLimit, executeIdempotent, IdempotencyConflict, requireCustomerPrincipal } from "@/lib/customer-api/security";

type OfferDecisionBody = {
  offerId?: unknown;
  offerRevision?: unknown;
  decision?: unknown;
  caseVersion?: unknown;
};

export async function POST(request: NextRequest, context: RouteContext<"/customer-api/v1/me/purchase-applications/[caseId]/offer-decisions">) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "ورود با شماره موبایل الزامی است." } }, { status: 401 });
  }
  const { caseId } = await context.params;
  if (!checkRateLimit(`offer-decision:${principal.customerId}`, 8, 5 * 60_000)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "کمی بعد دوباره تلاش کنید." } }, { status: 429 });
  }
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return NextResponse.json({ error: { code: "IDEMPOTENCY_REQUIRED", message: "شناسه امن درخواست الزامی است." } }, { status: 400 });
  }
  try {
    const body = (await request.json()) as OfferDecisionBody;
    if (
      typeof body.offerId !== "string" ||
      typeof body.offerRevision !== "number" ||
      typeof body.caseVersion !== "number" ||
      !["ACCEPT", "DECLINE", "REQUEST_REVISION"].includes(String(body.decision))
    ) {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "اطلاعات تصمیم معتبر نیست." } }, { status: 422 });
    }
    const input = {
      offerId: body.offerId,
      offerRevision: body.offerRevision,
      caseVersion: body.caseVersion,
      decision: body.decision as "ACCEPT" | "DECLINE" | "REQUEST_REVISION",
    };
    const data = executeIdempotent(
      `offer-decision:${principal.customerId}:${caseId}`,
      idempotencyKey,
      JSON.stringify(input),
      () => decideOffer(principal.customerId, caseId, input),
    );
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof IdempotencyConflict) {
      return NextResponse.json({ error: { code: "IDEMPOTENCY_CONFLICT", message: error.message } }, { status: 409 });
    }
    if (error instanceof WorkflowError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "INVALID_BODY", message: "ثبت تصمیم ممکن نشد." } }, { status: 400 });
  }
}
