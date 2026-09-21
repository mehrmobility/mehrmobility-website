"use client";

import Link from "next/link";
import { ArrowUpLeft, Phone, Menu, X, ChevronLeft, Search, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Home } from "./home";
import { Catalog, VehicleDetail } from "./catalog";
import { ContentIndex, ArticleDetail, ServiceDetail, ContactPage, CustomerPage, AboutPage, NumberplatePage } from "./content";
import { vehicles, entries, type Entry, type Vehicle } from "@/lib/mehr-site/data";
import type { Filters } from "@/lib/mehr-site/catalog";
import { Compare, ExperienceNav, Finder, Garage } from "./selection-tools";
import { ComparisonDock } from "./garage-store";
import { Showroom, PurchasePlan } from "./showroom-plan";
import { CustomerIntake, MyCarGateway } from "./customer-experiences";
import type { HomeHero } from "@/lib/mehr-site/cms-contract";
import type { PageIntro } from "@/lib/mehr-site/cms-contract";

const fallbackNav=[["خودروها","/mehr/cars"],["فروش و اطلاعیه‌ها","/mehr/news"],["خدمات پس از فروش","/mehr/services"],["درباره مهر","/mehr/about"],["مجله مهر","/mehr/journal"]];

export function MehrWebsite({ segments, initialFilters={}, initialIds=[], initialCar="", initialColor="", navigation=[], hero, aboutIntro, contactIntro, cmsEntries, cmsVehicles }: { segments: string[]; initialFilters?: Partial<Filters>; initialIds?: string[]; initialCar?: string; initialColor?: string; navigation?: { id: string; label: string; href: string }[]; hero?: HomeHero; aboutIntro?: PageIntro; contactIntro?: PageIntro; cmsEntries?: Entry[]; cmsVehicles?: Vehicle[] }) {
  const [menuOpen,setMenuOpen]=useState(false);
  const [section,slug]=segments;
  function content(){
    if(!section)return <Home hero={hero} cmsEntries={cmsEntries} cmsVehicles={cmsVehicles}/>;
    if(section==="finder")return <Finder/>;
    if(section==="compare")return <Compare key={initialIds.join(",")} initialIds={initialIds}/>;
    if(section==="garage")return <Garage key={initialIds.join(",")} initialIds={initialIds}/>;
    if(section==="showroom")return <Showroom key={initialCar} initialCar={initialCar}/>;
    if(section==="purchase-plan")return <PurchasePlan key={initialCar} initialCar={initialCar}/>;
    if(section==="trade-in"||section==="visit")return <CustomerIntake key={`${section}-${initialCar}-${initialColor}`} tradeIn={section==="trade-in"} initialCar={initialCar} initialColor={initialColor}/>;
    if(section==="my-car")return <MyCarGateway/>;
    if(section==="cars"){const catalog=cmsVehicles||vehicles;const car=catalog.find(v=>v.slug===slug);return car?<VehicleDetail key={slug} car={car} cars={catalog}/>:<Catalog key={JSON.stringify(initialFilters)} initial={initialFilters} cars={catalog}/>;}
    if(section==="journal"||section==="news"||section==="services"){
      const type=section==="journal"?"posts":section==="news"?"notifications":"service";
      const entry=(cmsEntries||entries).find(e=>e.type===type&&e.slug===slug);
      return entry?(section==="services"?<ServiceDetail key={slug} entry={entry} cmsEntries={cmsEntries}/>:<ArticleDetail key={slug} entry={entry} cmsEntries={cmsEntries}/>):<ContentIndex key={section} kind={section} cmsEntries={cmsEntries}/>;
    }
    if(section==="about")return <AboutPage intro={aboutIntro} cmsEntries={cmsEntries}/>;
    if(section==="contact")return <ContactPage intro={contactIntro}/>;
    if(section==="numberplate")return <NumberplatePage cmsEntries={cmsEntries}/>;
    return <CustomerPage key={section} section={section}/>;
  }
  const nav = navigation.length ? navigation.map(item => [item.label, item.href] as const) : fallbackNav;
  return <>
    <a className="ms-skip" href="#ms-main">رفتن به محتوا</a>
    <div className="ms-topbar"><span>مهر خودرو؛ همراه شما از انتخاب تا خدمات پس از فروش</span><a href="tel:+981334206"><Phone size={13}/><b dir="ltr">013 34206</b><span>تماس با مهر</span></a></div>
    <header className="ms-header"><Link className="ms-logo" href="/mehr" aria-label="مهر خودرو، صفحه اصلی"><img src="/brand/mehr-symbol.png" alt="نشان مهر" width={49} height={49}/><span><b>مهر خودرو</b><small>MEHR KHODRO</small></span></Link><nav className={menuOpen?"ms-nav is-open":"ms-nav"} aria-label="منوی اصلی">{nav.map(([name,path])=>{const active=path === `/mehr/${section || ""}`;return <Link onClick={()=>setMenuOpen(false)} key={path} className={active?"is-active":""} aria-current={active?"page":undefined} href={path}>{name}</Link>})}</nav><div className="ms-header-actions"><Link href="/mehr/cars" className="ms-icon-button" aria-label="جست‌وجوی خودرو"><Search size={20}/></Link><Link href="/mehr/customers" className="ms-customer-link">امور مشتریان<ArrowUpLeft size={17}/></Link><button className="ms-menu-button" aria-expanded={menuOpen} aria-label={menuOpen?"بستن منو":"بازکردن منو"} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></div></header>
    <ExperienceNav section={section}/>
    <main id="ms-main">{content()}</main>
    <ComparisonDock/>
    <footer className="ms-footer"><div><Link href="/mehr" className="ms-footer-brand"><img src="/mehr-site/mehr-logo.png" alt="مهر خودرو" width={1000} height={214}/></Link><p>از انتخاب، تا هر کیلومتر بعد.</p><div className="ms-footer-social"><a href="https://instagram.com/mehrkhodro.co" target="_blank" rel="noreferrer">اینستاگرام<ArrowUpLeft size={14}/></a><a href="https://t.me/mehrkhodro_co" target="_blank" rel="noreferrer">تلگرام<ArrowUpLeft size={14}/></a></div></div><div><h3>جهان مهر</h3><Link href="/mehr/cars">خودروها</Link><Link href="/mehr/news">اطلاعیه‌های فروش</Link><Link href="/mehr/journal">مجله مهر</Link><Link href="/mehr/about">داستان مهر</Link></div><div><h3>همراه شما</h3><Link href="/mehr/customers">امور مشتریان</Link><Link href="/mehr/services">خدمات پس از فروش</Link><Link href="/mehr/numberplate">تبدیل پلاک</Link><Link href="/mehr/contact">شعب و تماس</Link></div><div><h3>صدای شما را می‌شنویم</h3><a className="ms-footer-phone" dir="ltr" href="tel:+981334206">013 34206<Phone size={22}/></a><p>رشت، روبه‌روی اتاق بازرگانی گیلان</p><Link className="ms-text-link" href="/mehr/contact">ارسال پیام و راه‌های ارتباط<ArrowLeft size={16}/></Link></div><div className="ms-official-links"><span>پیوندهای مرتبط</span><a href="https://anzalifz.ir" target="_blank" rel="noreferrer">منطقه آزاد انزلی</a><a href="https://mimt.gov.ir" target="_blank" rel="noreferrer">وزارت صمت</a><a href="https://cppo.mimt.gov.ir" target="_blank" rel="noreferrer">سازمان حمایت</a><a href="https://freezones.ir" target="_blank" rel="noreferrer">شورای عالی مناطق آزاد</a></div><div className="ms-footer-bottom"><span>مهر خودرو © ۱۴۰۵</span><span>پیش‌نمایش طراحی · بدون اتصال به سامانه عملیاتی</span><Link href="https://mehrkhodro.co/">سایت فعلی<ChevronLeft size={14}/></Link></div></footer>
  </>;
}
