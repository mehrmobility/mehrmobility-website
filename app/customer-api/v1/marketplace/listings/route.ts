import { NextRequest, NextResponse } from "next/server";

import type { ListingKind } from "@/lib/customer-api/contracts";
import { collectionEnvelope, listCustomerMarketplace } from "@/lib/customer-api/marketplace-source";
import { checkRateLimit, requireCustomerPrincipal } from "@/lib/customer-api/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "ورود با شماره موبایل الزامی است." } }, { status: 401 });
  }
  if (!checkRateLimit(`marketplace:${principal.customerId}`)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "کمی بعد دوباره تلاش کنید." } }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const queryKeys = [...request.nextUrl.searchParams.keys()];
  const kindValues = request.nextUrl.searchParams.getAll("kind");
  if (queryKeys.some((key) => key !== "kind") || kindValues.length > 1) {
    return NextResponse.json({ error: { code: "INVALID_QUERY", message: "پارامتر درخواست معتبر نیست." } }, { status: 422 });
  }
  const kindParam = kindValues[0];
  if (kindParam && kindParam !== "SALES_PLAN" && kindParam !== "USED_SUPPLY") {
    return NextResponse.json({ error: { code: "INVALID_KIND", message: "نوع خودرو معتبر نیست." } }, { status: 422 });
  }
  const kind = kindParam as ListingKind | undefined;
  let data;
  try {
    data = await listCustomerMarketplace(principal.customerId, kind);
  } catch {
    return NextResponse.json({ error: { code: "SOURCE_UNAVAILABLE", message: "اطلاعات بازار موقتاً در دسترس نیست." } }, { status: 503 });
  }
  const response = collectionEnvelope(data);

  return NextResponse.json(response, {
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
