import "server-only";

import { NextRequest } from "next/server";

const requestsByKey = new Map<string, { count: number; resetAt: number }>();
const auditTrail: Array<Record<string, string>> = [];
const idempotentResults = new Map<string, { fingerprint: string; value: unknown }>();

export class IdempotencyConflict extends Error {}

export type CustomerPrincipal = {
  customerId: string;
  mobileMasked: string;
};

export function requireCustomerPrincipal(request: NextRequest): CustomerPrincipal | null {
  // Local prototype only. Production stays fail-closed until this function is
  // replaced by a signed, HttpOnly OTP session resolver. customerId must never
  // be accepted from request input.
  void request;
  if (process.env.NODE_ENV === "production") return null;
  return { customerId: "cus_demo_001", mobileMasked: "۰۹۱۲•••۴۲۱۰" };
}

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = requestsByKey.get(key);
  if (!current || current.resetAt <= now) {
    requestsByKey.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function recordAudit(event: {
  action: string;
  customerId: string;
  listingId: string;
  result: string;
}) {
  auditTrail.push({ ...event, occurredAt: new Date().toISOString() });
}

export function executeIdempotent<T>(scope: string, key: string, fingerprint: string, operation: () => T): T {
  const storageKey = `${scope}:${key}`;
  const existing = idempotentResults.get(storageKey);
  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      throw new IdempotencyConflict("این شناسه قبلاً با اطلاعات دیگری استفاده شده است.");
    }
    return structuredClone(existing.value) as T;
  }
  const value = operation();
  idempotentResults.set(storageKey, { fingerprint, value: structuredClone(value) });
  return value;
}
