"use client";

import { CatalogVehicleImage } from "@/components/catalog-vehicle-image";
import { useEffect, useState } from "react";
import { ArrowUpLeft, Bell, CalendarDays, CarFront, Check, ChevronLeft, CircleHelp, ClipboardList, FileText, Heart, LoaderCircle, MessageCircle, RefreshCw, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import type { PurchaseCaseCollectionResponse, UsedVehiclePurchaseCase } from "@/lib/customer-api/contracts";

const number = new Intl.NumberFormat("fa-IR");
const actionLabels = { NONE: "مشاهده پرونده", REVIEW_OFFER: "بررسی پیشنهاد مهر", PAY_DEPOSIT: "بررسی و پرداخت بیعانه", REVIEW_INSPECTION: "بررسی گزارش کارشناسی", PAY_BALANCE: "بررسی و پرداخت مانده", CONTACT_SUPPORT: "پیگیری پرونده" };

function useMyCases() {
  const [cases, setCases] = useState<UsedVehiclePurchaseCase[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      setState("loading");
      try {
        const response = await fetch("/customer-api/v1/me/purchase-applications", { cache: "no-store", signal: abort.signal });
        if (!response.ok) throw new Error("CASE_UNAVAILABLE");
        const payload = await response.json() as PurchaseCaseCollectionResponse;
        if (!Array.isArray(payload.data)) throw new Error("INVALID_CASES");
        setCases(payload.data);
        setState("ready");
      } catch {
        if (!abort.signal.aborted) setState("error");
      }
    }
    void load();
    return () => abort.abort();
  }, [retry]);
  return { cases, state, retry: () => setRetry((value) => value + 1) };
}

function CaseHero({ item }: { item: UsedVehiclePurchaseCase }) {
  const journey = item.journey;
  const phases = journey?.phases;
  const href = `#/requests/${encodeURIComponent(item.id)}`;
  const slides = [
    {
      key: "journey",
      eyebrow: journey?.overall.status === "DELIVERED" ? "در گاراژ شما" : "در مسیر شما",
      title: journey?.overall.headline ?? item.publicStatus.label,
      detail: "مسیر خودرو و گام‌های بعدی را در یک نمای ساده دنبال کنید.",
      action: actionLabels[item.requiredAction.type],
    },
    {
      key: "vehicle",
      eyebrow: "خودروی شما",
      title: item.vehicle.title,
      detail: `${item.vehicle.trim} · مدل ${number.format(item.vehicle.modelYear)}`,
      action: "مشاهده پرونده خودرو",
    },
    {
      key: "next-step",
      eyebrow: "گام بعدی",
      title: actionLabels[item.requiredAction.type],
      detail: item.requiredAction.type === "NONE" ? "پرونده شما در حال پیگیری است؛ در صورت نیاز اینجا به شما اطلاع می‌دهیم." : "اقدام موردنیاز شما آماده است و از همین‌جا قابل پیگیری خواهد بود.",
      action: actionLabels[item.requiredAction.type],
    },
  ];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[activeSlide] ?? slides[0];

  return <article className={`garage-hero garage-hero--${slide.key}`} aria-roledescription="اسلایدشو" aria-label="خلاصه پرونده خودرو">
    <div className="garage-hero__visual" aria-hidden="true"><CatalogVehicleImage src={item.vehicle.imageUrl} alt="" used sizes="(max-width: 760px) 100vw, 1100px" priority /></div>
    <div className="garage-hero__shade" aria-hidden="true" />
    <div className="garage-hero__content">
      <div className="garage-hero__top"><span><span className="garage-pulse" /> {slide.eyebrow}</span><bdi>{item.trackingCode}</bdi></div>
      <div className="garage-hero__copy"><h2>{slide.title}</h2><p>{slide.detail}</p></div>
      {slide.key === "journey" && phases && <ol className="garage-phase-rail" aria-label="پیشرفت خودرو">{phases.map((phase) => <li key={phase.code} className={phase.status === "COMPLETED" ? "done" : phase.code === journey?.overall.currentPhase ? "current" : ""} aria-current={phase.code === journey?.overall.currentPhase ? "step" : undefined}><span>{phase.status === "COMPLETED" ? <Check size={12} /> : null}</span><small>{phase.shortTitle}</small></li>)}</ol>}
      <div className="garage-hero__footer"><div className="garage-hero__dots" role="tablist" aria-label="نمای پرونده خودرو">{slides.map((entry, index) => <button key={entry.key} type="button" role="tab" aria-selected={index === activeSlide} aria-label={`نمای ${number.format(index + 1)}: ${entry.eyebrow}`} onClick={() => setActiveSlide(index)} />)}</div><a href={href} className="garage-hero__action"><span>{slide.action}</span><ArrowUpLeft size={22} /></a></div>
    </div>
  </article>;
}

export function CustomerHome() {
  const { cases, state, retry } = useMyCases();
  const active = cases.find((item) => item.journey && item.journey.overall.status !== "DELIVERED") ?? cases[0];
  const attention = cases.filter((item) => item.requiredAction.type !== "NONE");
  return <div className="lifecycle-home">
    <div className="lifecycle-home__hero">
      <div className="section-heading"><div><span>گاراژ شخصی شما</span><h2>هر قدم، کنار شما</h2></div><a href="#/requests">همه خودروها <ChevronLeft size={16} /></a></div>
      {state === "loading" && <div className="garage-loading" role="status"><LoaderCircle className="spin" /> در حال دریافت خودروی شما…</div>}
      {state === "error" && <div className="garage-empty"><CarFront size={36} /><h3>دریافت پرونده ممکن نشد</h3><p>کمی بعد دوباره تلاش کنید.</p><button className="button button--dark" onClick={retry}><RefreshCw size={18} /> تلاش دوباره</button></div>}
      {state === "ready" && (active ? <CaseHero item={active} /> : <div className="garage-empty"><CarFront size={38} /><h3>جای خودروی شما اینجاست</h3><p>با انتخاب خودرو و ثبت درخواست، مسیر خریدتان را همین‌جا دنبال کنید.</p><a className="button button--primary" href="#/buy">پیداکردن خودرو <ChevronLeft size={18} /></a></div>)}
    </div>
    <div className="lifecycle-home__primary">
      {attention.length > 0 && <section className="next-action-list" aria-label="اقدام‌های شما"><h3>نوبت شماست <span>{number.format(attention.length)}</span></h3>{attention.map((item) => <a key={item.id} href={`#/requests/${encodeURIComponent(item.id)}`}><span className="action-round"><ClipboardList size={22} /></span><div><strong>{actionLabels[item.requiredAction.type]}</strong><small>{item.vehicle.title}</small></div><ChevronLeft size={20} /></a>)}</section>}
    </div>
    <div className="lifecycle-home__secondary">
      <div className="home-shortcuts"><a href="#/documents"><FileText /><span>مدارک من</span></a><a href="#/requests"><ClipboardList /><span>پرونده خرید</span></a><a href="#/aftersales"><Wrench /><span>خدمات خودرو</span></a></div>
      <a href="#/buy" className="discovery-banner"><div><span>انتخاب بعدی شما</span><h3>خودروی دلخواهت<br />را پیدا کن.</h3><span className="discovery-banner__link">ورود به بازار مهر <ArrowUpLeft size={18} /></span></div><Search size={65} strokeWidth={1} /></a>
      <div className="service-teaser"><ShieldCheck size={26} /><h3>همراهی، بعد از تحویل</h3><p>پرونده خدمات، نوبت تعمیرگاه و راهنمای نگهداری؛ در کنار خودروی شما.</p><a href="#/aftersales">خدمات پس از فروش <ChevronLeft size={17} /></a></div>
    </div>
  </div>;
}

export function CustomerServices() {
  const { cases, state } = useMyCases();
  const delivered = cases.filter((item) => item.journey?.overall.status === "DELIVERED");
  const [topic, setTopic] = useState<"appointment" | "assistant" | "history">("appointment");
  return <section className="customer-services">
    <div className="service-intro"><span className="service-intro__icon"><Wrench size={32} strokeWidth={1.4} /></span><span>خیالتان از همراهی راحت</span><h2>یک همراه برای<br /><em>تمام کیلومترها.</em></h2><p>خدمات و نگهداری خودرو، در یک پرونده.</p></div>
    <div className="service-switch" role="group" aria-label="بخش خدمات"><button aria-pressed={topic === "appointment"} onClick={() => setTopic("appointment")}><CalendarDays size={22} />نوبت خدمات</button><button aria-pressed={topic === "assistant"} onClick={() => setTopic("assistant")}><Sparkles size={22} />دستیار هوشمند</button><button aria-pressed={topic === "history"} onClick={() => setTopic("history")}><FileText size={22} />سوابق خودرو</button></div>
    <div className="service-workspace" aria-live="polite">
      {topic === "appointment" && <><CalendarDays size={30} /><h3>نوبت متناسب با خودروی شما</h3><p>{state === "loading" ? "در حال بررسی پرونده خودرو…" : state === "error" ? "اطلاعات خودرو در دسترس نیست. از پرونده خرید دوباره پیگیری کنید." : delivered.length ? "خودروی تحویل‌شده در پرونده شما موجود است؛ دریافت ظرفیت مراکز و ثبت نوبت هنوز فعال نشده است." : "پس از ثبت تحویل خودرو، خدمات و نوبت‌های مربوط به همان خودرو اینجا در دسترس قرار می‌گیرند."}</p><ol className="service-booking-steps"><li><span>۱</span>انتخاب خودرو و نوع خدمت</li><li><span>۲</span>انتخاب مرکز و زمان آزاد</li><li><span>۳</span>تأیید نوبت و دریافت پیگیری</li></ol><span className="not-connected">رزرو آنلاین هنوز فعال نیست</span><a className="button button--dark" href="#/requests">مشاهده پرونده خودرو <ChevronLeft size={18} /></a></>}
      {topic === "assistant" && <><span className="assistant-mark"><Sparkles size={29} /></span><h3>دستیار خدمات مهر</h3><p>راهنمای نگهداری، توضیح چراغ‌های هشدار و کمک برای انتخاب خدمت مناسب، بر اساس مدل خودرو و راهنماهای تأییدشده.</p><div className="assistant-topics"><span>زمان سرویس دوره‌ای</span><span>راهنمای چراغ‌های هشدار</span><span>آماده‌شدن برای مراجعه</span></div><div className="assistant-offline"><MessageCircle size={19} /><span>گفت‌وگوی هوشمند پس از اتصال راهنماهای خودرو و سرویس پاسخ‌گویی فعال می‌شود.</span></div><span className="not-connected">دستیار هوشمند هنوز متصل نیست</span></>}
      {topic === "history" && <><FileText size={30} /><h3>داستان نگهداری خودروی شما</h3><p>سرویس‌ها، درخواست‌های خدمات و مدارک ضمانت بعد از دریافت از سامانه مهر، به تفکیک خودرو نمایش داده می‌شوند.</p><span className="not-connected">سابقه خدماتی دریافت نشده است</span><a href="#/documents" className="button button--outline">مشاهده مدارک خرید <ChevronLeft size={18} /></a></>}
    </div>
  </section>;
}

export function CustomerAccount({ favoriteCount }: { favoriteCount: number }) {
  return <section className="customer-account"><div className="account-avatar">م</div><h2>حساب مهرِ من</h2><p>خودروها و همراهی‌های شما، یک‌جا.</p><div className="account-links"><a href="#/buy/saved"><Heart size={22} /><span>خودروهای نشان‌شده<small>{number.format(favoriteCount)} خودرو در این دستگاه</small></span><ChevronLeft size={19} /></a><a href="#/documents"><FileText size={22} /><span>مدارک و پرونده‌ها</span><ChevronLeft size={19} /></a><a href="#/notifications"><Bell size={22} /><span>اعلان‌های من</span><ChevronLeft size={19} /></a><a href="#/aftersales"><CircleHelp size={22} /><span>خدمات و راهنمای خودرو</span><ChevronLeft size={19} /></a></div></section>;
}
