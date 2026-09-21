"use client";

import Link from "next/link";
import { Heart, Scale, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { vehicles, faNumber } from "@/lib/mehr-site/data";
import { blankFinder, validSlugs, type FinderPreferences } from "@/lib/mehr-site/experience";

type Garage = { favorites: string[]; compare: string[]; finder: FinderPreferences | null };
const empty: Garage = { favorites: [], compare: [], finder: null };
const key = "mehr-public-preferences-v1";
let cachedRaw: string | null | undefined;
let cached: Garage = empty;
const listeners = new Set<() => void>();
const serverSnapshot = () => empty;
function snapshot(): Garage {
  let raw: string | null;
  try { raw = localStorage.getItem(key); } catch { return cached; }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const input = JSON.parse(raw || "null");
    cached = { favorites: validSlugs(input?.favorites, vehicles), compare: validSlugs(input?.compare, vehicles, 3), finder: null };
    if (input?.finder && typeof input.finder === "object") {
      const p = input.finder;
      cached.finder = { ...blankFinder };
      for (const field of ["body", "fuel", "brand"] as const) {
        if (typeof p[field] === "string" && vehicles.some(v => field === "brand" ? v.brand === p[field] : v.specs[field].includes(p[field]))) cached.finder[field] = p[field];
      }
    }
  } catch { cached = empty; }
  return cached;
}
function emit() { listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
export function updateGarage(update: (current: Garage) => Garage): boolean {
  const next = update(snapshot());
  try { localStorage.setItem(key, JSON.stringify(next)); cachedRaw = undefined; emit(); return true; }
  catch { return false; }
}
export function useGarage() { return useSyncExternalStore(subscribe, snapshot, serverSnapshot); }

export function VehicleActions({ slug }: { slug: string }) {
  const garage = useGarage();
  const favorite = garage.favorites.includes(slug), compared = garage.compare.includes(slug);
  function toggle(field: "favorites" | "compare") {
    const saved = updateGarage(current => ({ ...current, [field]: current[field].includes(slug) ? current[field].filter(id => id !== slug) : [...current[field], slug].slice(0, field === "compare" ? 3 : 30) }));
    if (!saved) window.alert("مرورگر اجازه ذخیره در این دستگاه را نمی‌دهد. تنظیمات حریم خصوصی مرورگر را بررسی کنید.");
  }
  return <div className="mx-vehicle-actions"><button type="button" aria-pressed={favorite} onClick={() => toggle("favorites")}><Heart size={17} fill={favorite ? "currentColor" : "none"}/>{favorite ? "در گاراژ من" : "ذخیره خودرو"}</button><button type="button" aria-pressed={compared} disabled={!compared && garage.compare.length >= 3} title={!compared && garage.compare.length >= 3 ? "حداکثر سه خودرو؛ ابتدا یکی را از مقایسه حذف کنید" : undefined} onClick={() => toggle("compare")}><Scale size={17}/>{compared ? "حذف از مقایسه" : "مقایسه"}</button></div>;
}

export function ComparisonDock() {
  const { compare } = useGarage();
  if (!compare.length) return null;
  return <aside className="mx-compare-dock" aria-label="خودروهای انتخاب‌شده برای مقایسه"><span>{faNumber(compare.length)} از ۳ خودرو</span><Link href="/mehr/compare">مقایسه انتخاب‌ها <Scale size={17}/></Link><button aria-label="پاک‌کردن انتخاب‌های مقایسه" onClick={() => { if (!updateGarage(current => ({ ...current, compare: [] }))) window.alert("پاک‌کردن انتخاب‌ها ممکن نشد."); }}><X size={18}/></button></aside>;
}
