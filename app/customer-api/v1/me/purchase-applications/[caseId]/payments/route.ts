import { NextRequest, NextResponse } from "next/server";

import { payPurchaseCase, WorkflowError } from "@/lib/customer-api/used-purchase-workflow";
import { checkRateLimit, executeIdempotent, IdempotencyConflict, requireCustomerPrincipal } from "@/lib/customer-api/security";

type PaymentBody = { kind?: unknown; caseVersion?: unknown };

export async function POST(request: NextRequest, context: RouteContext<"/customer-api/v1/me/purchase-applications/[caseId]/payments">) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "ورود با شماره موبایل الزامی است." } }, { status: 401 });
  }
  const { caseId } = await context.params;
  if (!checkRateLimit(`purchase-payment:${principal.customerId}`, 5, 5 * 60_000)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "کمی بعد دوباره تلاش کنید." } }, { status: 429 });
  }
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return NextResponse.json({ error: { code: "IDEMPOTENCY_REQUIRED", message: "شناسه امن پرداخت الزامی است." } }, { status: 400 });
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: { code: "PAYMENT_GATEWAY_NOT_CONFIGURED", message: "درگاه پرداخت هنوز فعال نشده است." } }, { status: 503 });
  }
  try {
    const body = (await request.json()) as PaymentBody;
    if (!["DEPOSIT", "BALANCE"].includes(String(body.kind)) || typeof body.caseVersion !== "number") {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "درخواست پرداخت معتبر نیست." } }, { status: 422 });
    }
    const input = { kind: body.kind as "DEPOSIT" | "BALANCE", caseVersion: body.caseVersion };
    const data = executeIdempotent(
      `payment:${principal.customerId}:${caseId}:${input.kind}`,
      idempotencyKey,
      JSON.stringify(input),
      () => payPurchaseCase(principal.customerId, caseId, input.kind, input.caseVersion),
    );
    return NextResponse.json({ data, meta: { simulated: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof IdempotencyConflict) {
      return NextResponse.json({ error: { code: "IDEMPOTENCY_CONFLICT", message: error.message } }, { status: 409 });
    }
    if (error instanceof WorkflowError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "INVALID_BODY", message: "ایجاد پرداخت ممکن نشد." } }, { status: 400 });
  }
}
