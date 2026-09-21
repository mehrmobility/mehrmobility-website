import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MehrAdminConsole } from "@/components/mehr-site/admin-console";
import "./admin.css";
import "./login.css";
import "./cms.css";
import { getAdminSession } from "@/lib/mehr-site/admin-auth";

export const metadata: Metadata = { title: "کنسول ادمین مهر", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";
export default async function MehrAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/mehr/admin/login");
  return <MehrAdminConsole username={session.username} />;
}
