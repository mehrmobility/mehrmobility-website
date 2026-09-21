export const intakeKinds = ["visit", "video-visit", "service", "trade-in"] as const;
export type IntakeKind = typeof intakeKinds[number];
export type PublicIntake = {
  kind: IntakeKind; name: string; phone: string; vehicleSlug: string;
  branch: string; preferredDate: string; note: string; color: string;
  usedModel: string; usedYear: string; mileage: string; condition: string;
  consent: true; consentVersion: "mehr-contact-v1";
};
const textLimits = { name: 100, vehicleSlug: 80, branch: 100, preferredDate: 10, note: 1200, color: 40, usedModel: 100, usedYear: 4, mileage: 10, condition: 250 } as const;
export function normalizeMobile(value: string) {
  return value.replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[\s()-]/g, "").replace(/^(?:\+98|0098)/, "0");
}
export function parsePublicIntake(input: unknown): PublicIntake | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const allowed = [...Object.keys(textLimits), "kind", "phone", "consent", "consentVersion"];
  if (Object.keys(value).some(key => !allowed.includes(key)) || !intakeKinds.includes(value.kind as IntakeKind) || value.consent !== true || value.consentVersion !== "mehr-contact-v1" || typeof value.phone !== "string" || value.phone.length > 25) return null;
  for (const [key, limit] of Object.entries(textLimits)) {
    if (typeof value[key] !== "string" || value[key].length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value[key] as string)) return null;
  }
  const phone = normalizeMobile(value.phone);
  if (!/^09\d{9}$/.test(phone) || !(value.name as string).trim()) return null;
  if (value.preferredDate && (!/^\d{4}-\d{2}-\d{2}$/.test(value.preferredDate as string) || !Number.isFinite(Date.parse(`${value.preferredDate}T12:00:00Z`)) || new Date(`${value.preferredDate}T12:00:00Z`).toISOString().slice(0, 10) !== value.preferredDate)) return null;
  if (value.kind === "trade-in" && (!(value.usedModel as string).trim() || !/^(19|20)\d{2}$/.test(value.usedYear as string) || Number(value.usedYear) < 1980 || Number(value.usedYear) > new Date().getUTCFullYear() + 1 || !/^\d{1,7}$/.test(value.mileage as string) || !(value.condition as string).trim())) return null;
  return { ...value, phone, name: (value.name as string).trim() } as PublicIntake;
}
