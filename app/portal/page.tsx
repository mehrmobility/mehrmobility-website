import { MarketplaceShell } from "@/components/marketplace-shell";

// Transitional local route. The same web app is intended to move to
// app.mehrmobility.com in a separate, approved production release.
export default function PortalPreview() {
  return <MarketplaceShell preview={process.env.NODE_ENV !== "production"} />;
}
