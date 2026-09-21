"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Heart, Scale, SlidersHorizontal, Share2, Trash2, Check, Compass } from "lucide-react";
import { vehicles, brands, vehicleName, vehicleImage, faNumber } from "@/lib/mehr-site/data";
import { blankFinder, recommendVehicles, validSlugs, type FinderPreferences } from "@/lib/mehr-site/experience";
import { CarCard, Note, PageHeading } from "./ui";
import { updateGarage, useGarage, VehicleActions } from "./garage-store";

export const experienceLinks = [
  ["راهنمای انتخاب", "finder"], ["مقایسه", "compare"], ["گاراژ من", "garage"],
  ["نمایشگاه تعاملی", "showroom"], ["برنامه خرید", "purchase-plan"],
  ["کارشناسی و معاوضه", "trade-in"], ["بازدید و خدمات", "visit"], ["خودروی من", "my-car"],
] as const;

export function ExperienceNav({ section }: { section?: string }) {
  return <nav className="mx-nav" aria-label="ابزارهای انتخاب و همراهی مهر">{experienceLinks.map(([label, path]) => <Link key={path} href={`/mehr/${path}`} aria-current={section === path ? "page" : undefined}>{label}</Link>)}</nav>;
}

export function ExperienceHome() {
  return <section className="mx-home"><div className="mx-home-intro"><span className="ms-eyebrow">MEHR, YOUR WAY</span><h2>انتخابی که<br/>به شما می‌آید.</h2><p>خودروها را بشناسید، کنار هم ببینید و انتخاب‌هایتان را نگه دارید.</p><Link className="ms-button ms-button-dark" href="/mehr/finder">راهنمای انتخاب خودرو<ArrowLeft size={18}/></Link></div><div className="mx-home-links">{[
    { path: "showroom", icon: Compass, title: "از نزدیک ببینید", text: "تصاویر واقعی و جزئیات هر مدل" },
    { path: "compare", icon: Scale, title: "تفاوت‌ها را پیدا کنید", text: "مقایسه هم‌زمان تا سه خودرو" },
    { path: "garage", icon: Heart, title: "انتخاب‌هایتان، کنار هم", text: "فهرست شخصی روی همین دستگاه" },
    { path: "my-car", icon: ArrowLeft, title: "بعد از انتخاب هم همراهیم", text: "پرونده خرید و مسیر تحویل" },
  ].map(item => <Link href={`/mehr/${item.path}`} key={item.path}><item.icon size={27}/><h3>{item.title}</h3><p>{item.text}</p><ArrowLeft size={18}/></Link>)}</div></section>;
}

export function Finder() {
  const [preferences, setPreferences] = useState<FinderPreferences>({ ...blankFinder });
  const [result, setResult] = useState<FinderPreferences | null>(null);
  const [message, setMessage] = useState("");
  const { finder } = useGarage();
  const ranked = result ? recommendVehicles(vehicles, result) : [];
  const total = result ? (result.body ? 4 : 0) + (result.fuel ? 3 : 0) + (result.brand ? 2 : 0) : 0;
  return <><PageHeading title="خودروی نزدیک به انتخاب شما" eyebrow="FIND YOUR MEHR" description="سه ترجیح را مشخص کنید؛ گزینه‌ها را همراه با دلیل تطبیق ببینید."/><section className="mx-workspace">
    <form className="mx-panel ms-form" onSubmit={event => { event.preventDefault(); setResult({ ...preferences }); setMessage(""); }}>
      <div className="mx-panel-heading"><SlidersHorizontal/><h2>از سلیقه شما شروع کنیم</h2></div>
      <div className="mx-three-fields">{([['body', '۱. چه فرم بدنه‌ای دوست دارید؟'], ['fuel', '۲. کدام نوع سوخت؟'], ['brand', '۳. برند مورد علاقه؟']] as const).map(([field, label]) => <label key={field}>{label}<select value={preferences[field]} onChange={event => { setPreferences({ ...preferences, [field]: event.target.value }); setResult(null); }}>{<option value="">فرقی ندارد</option>}{field === "brand" ? Object.entries(brands).map(([id, name]) => <option key={id} value={id}>{name}</option>) : [...new Set(vehicles.flatMap(car => car.specs[field]))].map(value => <option key={value}>{value}</option>)}</select></label>)}</div>
      <div className="mx-actions"><button className="ms-button ms-button-dark" type="submit">پیشنهادهای من<ArrowLeft size={18}/></button>{finder && <button type="button" className="mx-secondary" onClick={() => { setPreferences(finder); setResult(finder); }}>استفاده از انتخاب ذخیره‌شده</button>}<button type="button" className="mx-secondary" onClick={() => { setPreferences({ ...blankFinder }); setResult(null); setMessage(""); }}>شروع دوباره</button></div>
      <p className="mx-muted">تطبیق با مشخصات منتشرشده مهر است؛ فرم بدنه، سوخت و سپس برند اولویت دارند. قیمت، ظرفیت سرنشین و موعد تحویل در رتبه‌بندی دخالت ندارند چون داده تأییدشده همه مدل‌ها در دسترس نیست.</p>
    </form>
    {result ? <div className="mx-results"><div className="mx-section-title"><h2>{total ? "نزدیک‌ترین انتخاب‌ها" : "برای شروع، این خودروها را ببینید"}</h2><button className="mx-secondary" onClick={() => setMessage(updateGarage(current => ({ ...current, finder: result })) ? "ترجیحات روی همین دستگاه ذخیره شد." : "مرورگر اجازه ذخیره نمی‌دهد.")}>ذخیره ترجیحات</button></div><p role="status">{message}</p>{ranked.length ? <div className="ms-cards">{ranked.slice(0, 3).map(({ car, matches, score }) => <div key={car.slug}><div className="mx-reasons"><strong>{total && score === total ? "مطابق همه ترجیحات شما" : total ? "تطبیق بخشی از ترجیحات" : "از مجموعه مهر"}</strong><span>{[matches.body && `بدنه ${result.body}`, matches.fuel && `سوخت ${result.fuel}`, matches.brand && `برند ${brands[result.brand]}`].filter(Boolean).join(" · ") || "مشخصات و تصاویر را بررسی کنید"}</span></div><CarCard car={car}/></div>)}</div> : <Note>گزینه‌ای با این ترجیحات پیدا نشد؛ یکی از انتخاب‌ها را به «فرقی ندارد» تغییر دهید.</Note>}</div> : <div className="mx-empty"><Compass size={38}/><h2>انتخاب نهایی با شماست</h2><p>پیشنهادها همراه با مشخصات قابل مقایسه ارائه می‌شوند؛ هیچ مدلی بر اساس تبلیغ یا قیمت حدسی بالاتر قرار نمی‌گیرد.</p></div>}
  </section></>;
}

async function sharePublicSelection(slugs: string[], path: string, onMessage: (message: string) => void) {
  const url = new URL(`/mehr/${path}`, window.location.origin);
  url.searchParams.set("cars", slugs.join(","));
  try {
    if (navigator.share) await navigator.share({ title: "انتخاب‌های من از مهر خودرو", url: url.toString() });
    else { await navigator.clipboard.writeText(url.toString()); onMessage("پیوند انتخاب‌ها کپی شد؛ فقط نام مدل‌ها به اشتراک گذاشته می‌شود."); }
  } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) onMessage(`کپی خودکار ممکن نشد. پیوند: ${url}`); }
}

const compareRows = [
  { label: "برند", value: (car: typeof vehicles[number]) => brands[car.brand] },
  ...([['body', 'فرم بدنه'], ['fuel', 'سوخت'], ['gearbox', 'گیربکس'], ['year', 'سال تولید'], ['country', 'کشور درج‌شده در کاتالوگ'], ['colors', 'رنگ‌های معرفی‌شده']] as const).map(([field, label]) => ({ label, value: (car: typeof vehicles[number]) => car.specs[field].join("، ") || "اعلام نشده" })),
  { label: "قیمت و موجودی", value: () => "نیازمند استعلام" },
  { label: "موعد تحویل / ضمانت", value: () => "طبق پیشنهاد و قرارداد تأییدشده" },
];

export function Compare({ initialIds }: { initialIds: string[] }) {
  const garage = useGarage();
  const [sharedIds, setSharedIds] = useState<string[] | null>(initialIds.length ? validSlugs(initialIds, vehicles, 3) : null);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [message, setMessage] = useState("");
  const ids = sharedIds ?? garage.compare;
  const selected = ids.map(id => vehicles.find(car => car.slug === id)!);
  function change(next: string[]) {
    if (sharedIds !== null) setSharedIds(next);
    else if (!updateGarage(current => ({ ...current, compare: next }))) setMessage("مرورگر اجازه ذخیره انتخاب‌ها را نمی‌دهد.");
  }
  return <><PageHeading title="تفاوت‌ها را کنار هم ببینید" eyebrow="SIDE BY SIDE" description="تا سه مدل را انتخاب کنید. اطلاعات نامشخص، امتیاز یا عدد ساختگی نمی‌گیرند."/><section className="mx-workspace">
    {sharedIds !== null && <Note>این یک فهرست اشتراکی است و انتخاب‌های شخصی شما را تغییر نمی‌دهد. <button className="ms-text-link" onClick={() => setSharedIds(null)}>بازگشت به مقایسه خودم</button></Note>}
    <div className="mx-panel mx-three-fields">{[0, 1, 2].map(index => <label key={index}>خودروی {faNumber(index + 1)}<select aria-label={`انتخاب خودروی ${faNumber(index + 1)}`} value={ids[index] || ""} onChange={event => { const next = [...ids]; if (event.target.value) next[index] = event.target.value; else next.splice(index, 1); change(validSlugs(next, vehicles, 3)); }}><option value="">انتخاب خودرو</option>{vehicles.filter(car => car.slug === ids[index] || !ids.includes(car.slug)).map(car => <option key={car.slug} value={car.slug}>{vehicleName(car)}</option>)}</select></label>)}</div>
    {selected.length ? <><div className="mx-actions mx-toolbar"><label className="mx-check"><input type="checkbox" checked={onlyDifferences} disabled={selected.length < 2} onChange={event => setOnlyDifferences(event.target.checked)}/>فقط تفاوت‌ها</label><button className="mx-secondary" onClick={() => sharePublicSelection(ids, "compare", setMessage)}><Share2 size={17}/>اشتراک مقایسه</button></div><p className="mx-status" role="status">{message}</p><div className="mx-table-scroll" role="region" tabIndex={0} aria-label="جدول مقایسه خودروها"><table className="mx-compare-table"><caption>مقایسه مشخصات عمومی خودروها؛ تجهیزات نهایی وابسته به تیپ و قرارداد است.</caption><thead><tr><th scope="col">مشخصات</th>{selected.map(car => <th scope="col" key={car.slug}><img src={vehicleImage(car)} alt={vehicleName(car)} width={300} height={160}/><Link href={`/mehr/cars/${car.slug}`}>{vehicleName(car)}</Link><button className="mx-remove" onClick={() => change(ids.filter(id => id !== car.slug))} aria-label={`حذف ${vehicleName(car)} از مقایسه`}><Trash2 size={16}/>حذف</button></th>)}</tr></thead><tbody>{compareRows.filter(row => !onlyDifferences || selected.length < 2 || new Set(selected.map(row.value)).size > 1).map(row => <tr key={row.label} className={new Set(selected.map(row.value)).size > 1 ? "is-different" : ""}><th scope="row">{row.label}</th>{selected.map(car => <td key={car.slug}>{row.value(car)}</td>)}</tr>)}<tr><th scope="row">ادامه بررسی</th>{selected.map(car => <td key={car.slug}><Link className="ms-text-link" href={`/mehr/showroom?car=${car.slug}`}>نمایشگاه<ArrowLeft size={16}/></Link>{car.catalogUrl && <a className="ms-text-link" href={car.catalogUrl} target="_blank" rel="noreferrer">کاتالوگ رسمی</a>}</td>)}</tr></tbody></table></div></> : <div className="mx-empty"><Scale size={38}/><h2>اولین خودرو را انتخاب کنید</h2><p>از انتخاب‌گرهای بالا یا دکمه مقایسه روی کارت خودروها استفاده کنید.</p></div>}
  </section></>;
}

export function Garage({ initialIds }: { initialIds: string[] }) {
  const { favorites, finder } = useGarage();
  const [message, setMessage] = useState("");
  const [showShared, setShowShared] = useState(initialIds.length > 0);
  const ids = showShared ? validSlugs(initialIds, vehicles) : favorites;
  return <><PageHeading title={showShared ? "انتخاب‌های به‌اشتراک‌گذاشته‌شده" : "گاراژ من"} eyebrow="MY MEHR GARAGE" description="خودروهایی که دوست دارید، برای ادامه بررسی کنار هم نگه دارید."/><section className="mx-workspace">
    <Note>این فهرست فقط روی همین مرورگر و دستگاه ذخیره می‌شود؛ حساب مشتری نیست و با دستگاه‌های دیگر همگام نمی‌شود. اطلاعات تماس، مدارک و قرارداد در این بخش ذخیره نمی‌شوند.</Note>
    <div className="mx-actions mx-toolbar">{showShared ? <button className="mx-secondary" onClick={() => setShowShared(false)}>نمایش گاراژ خودم</button> : <span>{faNumber(favorites.length)} انتخاب ذخیره‌شده</span>}{ids.length > 0 && <button className="mx-secondary" onClick={() => sharePublicSelection(ids, "garage", setMessage)}><Share2 size={17}/>اشتراک انتخاب‌ها</button>}{!showShared && favorites.length > 0 && <button className="mx-secondary" onClick={() => { if (window.confirm("فهرست علاقه‌مندی‌های این دستگاه پاک شود؟")) setMessage(updateGarage(current => ({ ...current, favorites: [] })) ? "فهرست پاک شد." : "پاک‌کردن ممکن نشد."); }}><Trash2 size={17}/>پاک‌کردن فهرست</button>}</div>
    <p className="mx-status" role="status">{message}</p>{ids.length ? <div className="ms-cards">{ids.map(id => <CarCard key={id} car={vehicles.find(car => car.slug === id)!}/>)}</div> : <div className="mx-empty"><Heart size={38}/><h2>جای انتخاب‌های شما خالی است</h2><p>دکمه «ذخیره خودرو» روی هر کارت، آن را به این فهرست اضافه می‌کند.</p><Link className="ms-button ms-button-dark" href="/mehr/cars">دیدن خودروها<ArrowLeft size={18}/></Link></div>}
    {finder && !showShared && <div className="mx-panel mx-saved-preferences"><Check size={20}/><div><h2>ترجیحات انتخاب شما</h2><p>{[finder.body, finder.fuel, brands[finder.brand]].filter(Boolean).join(" · ") || "بدون ترجیح مشخص"}</p></div><Link className="mx-secondary" href="/mehr/finder">ادامه انتخاب</Link><button className="mx-secondary" onClick={() => setMessage(updateGarage(current => ({ ...current, finder: null })) ? "ترجیحات پاک شد." : "پاک‌کردن ممکن نشد.")}>حذف</button></div>}
    <Note>اعلان موجودشدن خودرو هنوز فعال نیست؛ به موجودی معتبر، ورود تأییدشده و رضایت جداگانه برای دریافت اعلان نیاز دارد.</Note>
  </section></>;
}

export function CarExperienceActions({ slug }: { slug: string }) {
  return <div className="mx-car-tools"><VehicleActions slug={slug}/><div className="mx-actions"><Link href={`/mehr/showroom?car=${slug}`} className="mx-secondary">نمایشگاه تعاملی</Link><Link href={`/mehr/purchase-plan?car=${slug}`} className="mx-secondary">برنامه خرید</Link><Link href={`/mehr/visit?car=${slug}`} className="mx-secondary">درخواست بازدید</Link></div></div>;
}
