"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpLeft, ArrowLeft, ShieldCheck, Wrench, MapPin, ChevronLeft, CalendarDays } from "lucide-react";
import { vehicles, vehicleImage, vehicleName, brands, entries, entryPath, faDate, type Entry, type Vehicle } from "@/lib/mehr-site/data";
import { CarCard, EditorialCard, SectionHeading } from "./ui";
import { ExperienceHome } from "./selection-tools";
import type { HomeHero } from "@/lib/mehr-site/cms-contract";

export function Home({ hero, cmsEntries, cmsVehicles }: { hero?: HomeHero; cmsEntries?: Entry[]; cmsVehicles?: Vehicle[] }){
  const [slide,setSlide]=useState(0);
  const slides=[{slug:"hilux-grs",label:"HILUX",name:"HILUX GR SPORT",copy:"قدرت، با امضای تویوتا"},{slug:"changan-x5-plus",label:"X5 PLUS",name:"CHANGAN X5 PLUS",copy:"نگاهی تازه به رانندگی"},{slug:"camry",label:"CAMRY",name:"TOYOTA CAMRY",copy:"وقار، در هر مسیر"}];
  const catalog=cmsVehicles||vehicles;
  const current=slides[slide],car=catalog.find(v=>v.slug===current.slug)||catalog[0];
  const featured=["changan-x5-plus","k4","attrage"].map(slug=>catalog.find(v=>v.slug===slug)).filter((vehicle): vehicle is Vehicle => Boolean(vehicle));
  const editorial=cmsEntries||entries;
  const journal=editorial.filter(e=>e.type==="posts").slice(0,3);
  const copy = hero || { eyebrow:"از انتخاب، تا هر کیلومتر بعد", title:"انتخاب شما.", accent:"تعهد مهر.", description:"خودروهای صفر و کارکرده وارداتی را با اطلاعات شفاف بررسی کنید؛ از انتخاب تا خدمات، همراه شما هستیم.", primaryLabel:"خودروی خود را پیدا کنید", primaryHref:"/mehr/cars", secondaryLabel:"راهنمای واردات", secondaryHref:"/mehr/import", footnote:"از سال ۱۳۹۱، در کنار شما" };
  return <>
    <section className="ms-hero"><div className="ms-hero-copy"><div className="ms-eyebrow"><span/> {copy.eyebrow}</div><h1>{copy.title}<br/><span>{copy.accent}</span></h1><p>{copy.description}</p><div className="ms-hero-actions"><Link className="ms-button ms-button-dark" href={copy.primaryHref}>{copy.primaryLabel}<ArrowLeft size={20}/></Link><Link className="ms-text-link" href={copy.secondaryHref}>{copy.secondaryLabel}<ArrowUpLeft size={18}/></Link></div><div className="ms-hero-footnote"><span className="ms-red-line"/><span>{copy.footnote}</span></div></div>
    <div className="ms-hero-visual"><span className="ms-hero-watermark" aria-hidden="true">{current.label}</span><span className="ms-hero-index" dir="ltr">0{slide+1} / MEHR COLLECTION</span><img key={car.slug} className="ms-hero-car" src={vehicleImage(car)} alt={vehicleName(car)} fetchPriority="high" width={1024} height={515}/><div className="ms-hero-vehicle" aria-live="polite"><div><small>{current.copy}</small><strong dir="ltr">{current.name}</strong></div><Link href={`/mehr/cars/${car.slug}`} aria-label={`مشاهده ${vehicleName(car)}`}><ArrowUpLeft size={25}/></Link></div><div className="ms-hero-pagination" aria-label="انتخاب خودروی شاخص">{slides.map((s,i)=><button key={s.slug} className={slide===i?"is-active":""} aria-label={`نمایش ${s.name}`} aria-pressed={slide===i} onClick={()=>setSlide(i)}/>)}</div></div></section>
    <div className="ms-promise-strip"><div><ShieldCheck/><span>انتخاب آگاهانه</span><small>مشخصات و کاتالوگ خودروها</small></div><div><Wrench/><span>همراهی پس از خرید</span><small>خدمات تخصصی خودرو</small></div><div><MapPin/><span>نزدیک به شما</span><small>شعب مهر در رشت و انزلی</small></div><Link href="/mehr/contact">با مهر در ارتباط باشید<ArrowUpLeft size={22}/></Link></div>
    <section className="ms-section"><SectionHeading title="خودرو، به انتخاب شما" eyebrow="MEHR COLLECTION" href="/mehr/cars" link="مشاهده همه خودروها"/><div className="ms-cards">{featured.map(v=><CarCard key={v.slug} car={v}/>)}</div><div className="ms-brand-list" aria-label="برندهای خودرو"><span>برندهای مهر</span>{Object.entries(brands).map(([id,name])=><Link key={id} href={`/mehr/cars?brand=${id}`} aria-label={`خودروهای ${name}`}>{id.toUpperCase()}</Link>)}</div></section>
    <ExperienceHome/>
    <section className="ms-home-services"><div className="ms-services-photo"><img src="/mehr-site/content/1371.jpg" alt="خدمات تخصصی خودرو در مهر" width={800} height={640} loading="lazy"/><span>MEHR AFTERSALES</span></div><div className="ms-services-copy"><span className="ms-eyebrow">همراهی که ادامه دارد</span><h2>خرید، آغاز<br/>همراهی ماست.</h2><p>از سرویس‌های دوره‌ای تا خدمات تخصصی؛ برای رسیدگی به خودروی شما، در کنار شما هستیم.</p><div className="ms-service-shortcuts">{editorial.filter(e=>e.type==="service").slice(0,4).map(e=><Link key={e.id} href={entryPath(e)}>{e.title}<ChevronLeft size={17}/></Link>)}</div><Link href="/mehr/services" className="ms-button ms-button-dark">خدمات و درخواست نوبت<CalendarDays size={19}/></Link></div></section>
    <section className="ms-section"><SectionHeading title="تازه‌های دنیای مهر" eyebrow="THE MEHR JOURNAL" href="/mehr/journal" link="ورود به مجله مهر"/><div className="ms-editorial-grid">{journal.map(e=><EditorialCard key={e.id} entry={e}/>)}</div></section>
    <section className="ms-home-notices"><div><span className="ms-eyebrow">MEHR NEWSROOM</span><h2>اطلاعیه‌ها<br/>و بخشنامه‌های مهر</h2><Link href="/mehr/news" className="ms-text-link">همه اطلاعیه‌ها<ArrowLeft size={18}/></Link></div><div>{editorial.filter(e=>e.type==="notifications").slice(0,3).map(e=><Link key={e.id} href={entryPath(e)}><span><small>{faDate(e.date)}</small><strong>{e.title}</strong></span><ArrowUpLeft size={24}/></Link>)}</div></section>
    <section className="ms-home-contact"><span className="ms-eyebrow">یک گفت‌وگو، آغاز یک انتخاب</span><h2>مهر، نزدیک‌تر از همیشه.</h2><p>برای مشاوره انتخاب خودرو یا دیدار در شعب مهر، با ما در ارتباط باشید.</p><Link className="ms-button ms-button-red" href="/mehr/contact">شعب و راه‌های ارتباط<ArrowLeft size={20}/></Link></section>
  </>;
}
