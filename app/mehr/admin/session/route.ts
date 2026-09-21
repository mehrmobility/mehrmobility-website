import { NextResponse } from "next/server";
import { createAdminSession, validAdminCredentials } from "@/lib/mehr-site/admin-auth";

export async function POST(request: Request) { const form = await request.formData(); const username = String(form.get("username") || "").slice(0, 128); const password = String(form.get("password") || "").slice(0, 256); if (!validAdminCredentials(username, password)) return NextResponse.redirect(new URL("/mehr/admin/login?error=1", request.url), 303); const response = NextResponse.redirect(new URL("/mehr/admin", request.url), 303); const session = createAdminSession(); response.cookies.set("mehr_admin_session", session.value, session.options); return response; }
