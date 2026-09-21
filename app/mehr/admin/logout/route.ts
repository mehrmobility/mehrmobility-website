import { NextResponse } from "next/server";
export async function POST(request: Request) { const response = NextResponse.redirect(new URL("/mehr/admin/login", request.url), 303); response.cookies.set("mehr_admin_session", "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "strict" }); return response; }
