"use client";

import { useEffect, useState } from "react";
import type { Vehicle } from "@/lib/mehr-site/data";

type EditableVehicle = Vehicle & { _cms?: { id: string; status: string; revisionNo: number; updatedAt: string } };
const template = { id: 0, slug: "new-car", title: "نام خودرو | BRAND MODEL", brand: "toyota", brandName: "TOYOTA", pageUrl: "https://mehrkhodro.co/car/new-car/", primaryImage: { url: "https://example.invalid/car.png", alt: "تصویر خودرو", width: 1024, height: 512 }, gallery: [], catalogUrl: "", descriptionSections: [], specs: { country: [], year: [], body: [], gearbox: [], fuel: [], colors: [] } } as EditableVehicle;

export function AdminVehicleEditor() {
  const [cars, setCars] = useState<EditableVehicle[]>([]);
  const [selected, setSelected] = useState<EditableVehicle | null>(null);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/mehr/admin/api/vehicles", { cache: "no-store" }).then(response => response.json()).then((data: unknown) => {
      const catalog = data && typeof data === "object" && Array.isArray((data as { vehicles?: unknown }).vehicles) ? (data as { vehicles: EditableVehicle[] }).vehicles : [];
      setCars(catalog);
      if (catalog[0]) choose(catalog[0]);
    });
  }, []);
  function choose(car: EditableVehicle | null) { setSelected(car); setText(car ? JSON.stringify(car, null, 2) : ""); setMessage(""); }
  async function save() {
    let vehicle: EditableVehicle;
    try { vehicle = JSON.parse(text) as EditableVehicle; } catch { return setMessage("JSON معتبر نیست."); }
    delete vehicle._cms;
    setMessage("در حال ذخیره…");
    const response = await fetch("/mehr/admin/api/vehicles", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(vehicle) });
    if (!response.ok) return setMessage("ذخیره نشد؛ ساختار خودرو یا مجوز انتشار را بررسی کنید.");
    const next = cars.some(car => car.slug === vehicle.slug) ? cars.map(car => car.slug === vehicle.slug ? vehicle : car) : [...cars, vehicle];
    setCars(next); choose(vehicle); setMessage("نسخه منتشرشده کاتالوگ ذخیره شد.");
  }
  async function archive() {
    if (!selected || !window.confirm(`بایگانی ${selected.title} از کاتالوگ؟`)) return;
    const response = await fetch(`/mehr/admin/api/vehicles?slug=${encodeURIComponent(selected.slug)}`, { method: "DELETE" });
    if (!response.ok) return setMessage("بایگانی ممکن نشد.");
    const next = cars.filter(car => car.slug !== selected.slug);
    setCars(next); choose(next[0] || null); if (!next[0]) setText("");
    setMessage("خودرو بایگانی شد و از سایت عمومی حذف می‌شود.");
  }
  return <section className="ma-publisher"><div><span className="ma-eyebrow">CMS CATALOG / VERSIONED VEHICLES</span><h2>مدیریت کامل خودروها</h2><p>هر خودرو نسخه مستقل دارد؛ تغییرات فقط پس از انتشار عمومی دیده می‌شوند و حذف، بایگانی نرم است.</p></div><div className="ma-publisher-grid"><aside><button type="button" onClick={() => choose(template)}><span>＋ افزودن خودرو</span></button>{cars.map(car => <button type="button" key={car.slug} className={selected?.slug === car.slug ? "is-active" : ""} onClick={() => choose(car)}><span>{car.title}</span><small>{car.slug}</small></button>)}</aside><div className="ma-editor"><label>داده کامل خودرو (JSON)<textarea rows={20} value={text} onChange={event => setText(event.target.value)} /></label><div><button type="button" className="ms-button ms-button-red" onClick={save}>ذخیره و انتشار</button>{selected && cars.some(car => car.slug === selected.slug) && <button type="button" className="mx-secondary" onClick={archive}>بایگانی خودرو</button>}</div><p role="status">{message}</p></div></div></section>;
}
