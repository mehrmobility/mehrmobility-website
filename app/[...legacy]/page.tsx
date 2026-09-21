import { notFound, permanentRedirect } from "next/navigation";
import { legacyDestination } from "@/lib/mehr-site/legacy-routes";

export default async function LegacyPage({ params }: { params: Promise<{ legacy: string[] }> }) {
  const { legacy } = await params;
  const source = `/${legacy.map(segment => encodeURIComponent(segment)).join("/")}`;
  const destination = legacyDestination(source);
  if (!destination) notFound();
  permanentRedirect(destination);
}
