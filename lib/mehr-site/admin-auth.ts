import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "mehr_admin_session";
const maxAge = 60 * 60 * 8;
export type AdminRole = "SYSTEM_ADMIN" | "CONTENT_EDITOR" | "REVIEWER" | "CATALOG_MANAGER" | "SEO_MANAGER" | "SUPPORT_AGENT";
export type AdminSession = { username: string; roles: AdminRole[] };
const knownRoles = new Set<AdminRole>(["SYSTEM_ADMIN", "CONTENT_EDITOR", "REVIEWER", "CATALOG_MANAGER", "SEO_MANAGER", "SUPPORT_AGENT"]);
const permissions: Record<string, readonly AdminRole[]> = {
  readCms: ["SYSTEM_ADMIN", "CONTENT_EDITOR", "REVIEWER", "CATALOG_MANAGER", "SEO_MANAGER"],
  editContent: ["SYSTEM_ADMIN", "CONTENT_EDITOR", "CATALOG_MANAGER", "SEO_MANAGER"],
  publishContent: ["SYSTEM_ADMIN", "REVIEWER"],
  manageNavigation: ["SYSTEM_ADMIN", "CONTENT_EDITOR"],
  manageMedia: ["SYSTEM_ADMIN", "CONTENT_EDITOR", "CATALOG_MANAGER"],
};
function config() {
  const production = process.env.NODE_ENV === "production";
  const username = process.env.MEHR_ADMIN_USERNAME || (production ? "" : "admin");
  const password = process.env.MEHR_ADMIN_PASSWORD || (production ? "" : "mehr-local-only-change-me");
  const secret = process.env.MEHR_ADMIN_SESSION_SECRET || (production ? "" : "mehr-local-session-secret-change-me");
  const roles: AdminRole[] = (process.env.MEHR_ADMIN_ROLES || "SYSTEM_ADMIN").split(",").map(role => role.trim()).filter((role): role is AdminRole => knownRoles.has(role as AdminRole));
  return { username, password, secret, production, roles: roles.length ? roles : ["SYSTEM_ADMIN"] as AdminRole[] };
}
function sign(value: string, secret: string) { return createHmac("sha256", secret).update(value).digest("base64url"); }
export function adminConfigured() { const { username, password, secret } = config(); return Boolean(username && password && secret); }
export function validAdminCredentials(username: string, password: string) { const settings = config(); if (!adminConfigured()) return false; const left = Buffer.from(`${username}\0${password}`); const right = Buffer.from(`${settings.username}\0${settings.password}`); return left.length === right.length && timingSafeEqual(left, right); }
export function createAdminSession() { const { username, secret, production, roles } = config(); const issued = Math.floor(Date.now() / 1000); const payload = Buffer.from(JSON.stringify({ username, roles, issued, nonce: randomBytes(12).toString("base64url") })).toString("base64url"); return { value: `${payload}.${sign(payload, secret)}`, options: { httpOnly: true, sameSite: "strict" as const, secure: production, path: "/", maxAge } }; }
export async function getAdminSession(): Promise<AdminSession | null> { const { username, secret, roles } = config(); const value = (await cookies()).get(cookieName)?.value; if (!value || !username || !secret) return null; const [payload, signature] = value.split("."); const expected = payload ? Buffer.from(sign(payload, secret)) : null; const received = signature ? Buffer.from(signature) : null; if (!payload || !expected || !received || expected.length !== received.length || !timingSafeEqual(received, expected)) return null; try { const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { username?: unknown; issued?: unknown; roles?: unknown }; return parsed.username === username && Number.isInteger(parsed.issued) && (parsed.issued as number) + maxAge >= Math.floor(Date.now() / 1000) ? { username, roles: Array.isArray(parsed.roles) && parsed.roles.every((role): role is AdminRole => typeof role === "string" && knownRoles.has(role as AdminRole)) ? parsed.roles : roles } : null; } catch { return null; } }
export function hasAdminPermission(session: AdminSession, permission: keyof typeof permissions) { return session.roles.some(role => permissions[permission].includes(role)); }
export const adminSessionCookieName = cookieName;
