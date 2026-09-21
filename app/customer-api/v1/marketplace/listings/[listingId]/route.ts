import { NextRequest, NextResponse } from "next/server";

import { getCustomerMarketplaceListing } from "@/lib/customer-api/marketplace-source";
import { checkRateLimit, requireCustomerPrincipal } from "@/lib/customer-api/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ listingId: string }> }) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "ورود با شماره موبایل الزامی است." } }, { status: 401 });
  }
  const { listingId } = await context.params;
  if (!checkRateLimit(`marketplace-detail:${principal.customerId}`, 30) || !checkRateLimit(`marketplace-detail:${principal.customerId}:${listingId}`, 10)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "کمی بعد دوباره تلاش کنید." } }, { status: 429, headers: { "Retry-After": "60" } });
  }
  let listing;
  try {
    listing = await getCustomerMarketplaceListing(principal.customerId, listingId);
  } catch {
    return NextResponse.json({ error: { code: "SOURCE_UNAVAILABLE", message: "جزئیات خودرو موقتاً در دسترس نیست." } }, { status: 503 });
  }

  if (!listing) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "این خودرو در دسترس نیست." } }, { status: 404 });
  }

  return NextResponse.json({ data: listing }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
