import type { Vehicle } from "./data";

export type FinderPreferences = { body: string; fuel: string; brand: string };
export const blankFinder: FinderPreferences = { body: "", fuel: "", brand: "" };

export function recommendVehicles(cars: Vehicle[], preferences: FinderPreferences) {
  return cars.map(car => {
    const matches = {
      body: Boolean(preferences.body && car.specs.body.includes(preferences.body)),
      fuel: Boolean(preferences.fuel && car.specs.fuel.includes(preferences.fuel)),
      brand: Boolean(preferences.brand && car.brand === preferences.brand),
    };
    return { car, matches, score: Number(matches.body) * 4 + Number(matches.fuel) * 3 + Number(matches.brand) * 2 };
  }).filter(result => !Object.values(preferences).some(Boolean) || result.score > 0)
    .sort((a, b) => b.score - a.score || a.car.title.localeCompare(b.car.title, "fa"));
}

export function validSlugs(input: unknown, cars: Vehicle[], limit = 30): string[] {
  if (!Array.isArray(input)) return [];
  const known = new Set(cars.map(car => car.slug));
  return [...new Set(input.filter((value): value is string => typeof value === "string" && known.has(value)))].slice(0, limit);
}

// No lender rate, retail price, or eligibility is inferred. All amounts are
// entered by the visitor in toman; this is arithmetic, not a Mehr sales offer.
export function calculateBudget(input: { price: number; down: number; trade: number; extra: number; months: number }) {
  const { price, down, trade, extra, months } = input;
  if (![price, down, trade, extra, months].every(Number.isSafeInteger) || price <= 0 || [down, trade, extra].some(n => n < 0) || price + extra > 1e12 || months < 1 || months > 60) return null;
  const total = price + extra;
  if (down + trade > total) return null;
  const balance = total - down - trade;
  const installment = Math.floor(balance / months);
  return { total, balance, installment, finalInstallment: balance - installment * (months - 1) };
}

export function parseAmount(value: string): number {
  const normalized = value.replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[,٬\s]/g, "");
  return /^\d+$/.test(normalized) ? Number(normalized) : NaN;
}
