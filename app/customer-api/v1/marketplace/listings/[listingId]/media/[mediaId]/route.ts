import { NextRequest, NextResponse } from "next/server";
import { getCustomerMarketplaceImage } from "@/lib/customer-api/marketplace-source";
import { checkRateLimit, requireCustomerPrincipal } from "@/lib/customer-api/security";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" };

export async function GET(request: NextRequest, context: { params: Promise<{ listingId: string; mediaId: string }> }) {
  const principal = requireCustomerPrincipal(request);
  if (!principal) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401, headers });
  if (!checkRateLimit(`marketplace-media:${principal.customerId}`, 120)) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  if ([...request.nextUrl.searchParams.keys()].length) return NextResponse.json({ error: "INVALID_QUERY" }, { status: 422, headers });
  const { listingId, mediaId } = await context.params;
  try {
    const image = await getCustomerMarketplaceImage(principal.customerId, listingId, mediaId);
    if (!image) return NextResponse.json({ error: "IMAGE_NOT_AVAILABLE" }, { status: 404, headers });
    return new Response(image.bytes, { headers: { ...headers, "Content-Type": image.contentType, "Content-Length": String(image.bytes.length), "Content-Disposition": "inline" } });
  } catch {
    return NextResponse.json({ error: "IMAGE_SOURCE_UNAVAILABLE" }, { status: 503, headers });
  }
}
