import { NextRequest, NextResponse } from "next/server";

import { listUsedPurchaseCases } from "@/lib/customer-api/used-purchase-workflow";
import { checkRateLimit, requireCustomerPrincipal } from "@/lib/customer-api/security";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "ورود با شماره موبایل الزامی است." } }, { status: 401 });
  }
  if (!checkRateLimit(`purchase-list:${principal.customerId}`)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "کمی بعد دوباره تلاش کنید." } }, { status: 429 });
  }
  if (process.env.NODE_ENV === "production" && !process.env.MEHR_PURCHASE_WORKFLOW_API_URL) {
    return NextResponse.json({ error: { code: "WORKFLOW_NOT_CONFIGURED", message: "پیگیری درخواست‌ها هنوز فعال نشده است." } }, { status: 503 });
  }
  const data = listUsedPurchaseCases(principal.customerId);
  return NextResponse.json(
    { data, meta: { total: data.length, generatedAt: new Date().toISOString() } },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
