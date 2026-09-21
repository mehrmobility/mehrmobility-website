import { NextRequest, NextResponse } from "next/server";

import { getUsedPurchaseCase, WorkflowError } from "@/lib/customer-api/used-purchase-workflow";
import { requireCustomerPrincipal } from "@/lib/customer-api/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/customer-api/v1/me/purchase-applications/[caseId]">) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "ورود با شماره موبایل الزامی است." } }, { status: 401 });
  }
  const { caseId } = await context.params;
  try {
    const data = getUsedPurchaseCase(principal.customerId, caseId);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof WorkflowError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "UNEXPECTED", message: "دریافت پرونده ممکن نشد." } }, { status: 500 });
  }
}
