import { MarketplaceShell } from "@/components/marketplace-shell";

export default function Home() {
  return <MarketplaceShell preview={process.env.NODE_ENV !== "production"} />;
}
