"use client";

import Link from "next/link";
import { ArrowUpLeft, ArrowLeft, ChevronLeft, Info, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { type Vehicle, type Entry, vehicleName, vehicleImage, entryImage, entryPath, faDate } from "@/lib/mehr-site/data";
import { VehicleActions } from "./garage-store";

export function PageHeading({ title, eyebrow, description, children }: { title: string; eyebrow?: string; description?: string; children?: ReactNode }) {
  return <section className="ms-page-heading"><div className="ms-breadcrumb"><Link href="/mehr">مهر خودرو</Link><ChevronLeft size={14}/><span>{title}</span></div><div className="ms-heading-row"><div>{eyebrow&&<span className="ms-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{children}</div></section>;
}
export function SectionHeading({ title, eyebrow, href, link = "مشاهده همه" }: { title: string; eyebrow?: string; href?: string; link?: string }) {
  return <div className="ms-section-heading"><div>{eyebrow&&<span className="ms-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{href&&<Link className="ms-text-link" href={href}>{link}<ArrowLeft size={19}/></Link>}</div>;
}
export function Note({ children }: { children: ReactNode }) { return <div className="ms-note"><Info size={18}/><span>{children}</span></div>; }
export function CarCard({ car }: { car: Vehicle }) {
  return <article className="mx-car-card"><Link className="ms-car-card" href={`/mehr/cars/${car.slug}`}><div className="ms-car-photo"><span className="ms-car-category">{car.specs.body.join(" / ")}</span><img src={vehicleImage(car)} alt={vehicleName(car)} width={768} height={384} loading="lazy"/></div><div className="ms-car-info"><small dir="ltr">{car.brandName} · {car.specs.year.join(" / ")}</small><h3>{vehicleName(car)}</h3><div><span>{car.specs.fuel.join(" / ")} <i>·</i> {car.specs.gearbox[0]}</span><ArrowUpLeft size={22}/></div></div></Link><VehicleActions slug={car.slug}/></article>;
}
export function EditorialCard({ entry }: { entry: Entry }) {
  return <Link className={`ms-editorial-card ${entry.type==="notifications"?"is-notice":""}`} href={entryPath(entry)}><div className="ms-editorial-photo">{entryImage(entry)?<img src={entryImage(entry)!} alt={entry.title} width={640} height={400} loading="lazy"/>:<div className="ms-document-art"><span>MEHR</span><small>اطلاعیه مهر خودرو</small></div>}</div><div className="ms-editorial-info"><small>{faDate(entry.date)} <span>·</span> {entry.type==="posts"?"مجله مهر":"اطلاعیه"}</small><h3>{entry.title.split("|")[0]}</h3><div className="ms-text-link">مطالعه بیشتر<ArrowUpLeft size={18}/></div></div></Link>;
}
export function Modal({ title, open, onClose, children, wide = false }: { title: string; open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=ref.current;
    if(open&&!dialog?.open) dialog?.showModal();
    if(!open&&dialog?.open) dialog?.close();
  },[open]);
  return <dialog ref={ref} className={`ms-dialog ${wide?"ms-dialog-wide":""}`} aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="ms-dialog-heading"><h2>{title}</h2><button className="ms-icon-button" onClick={onClose} aria-label="بستن پنجره"><X/></button></div>{open&&children}</dialog>;
}
