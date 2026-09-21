"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { ArrowLeft, CalendarDays, Phone, FileCheck2, ShieldCheck, Video, MapPin, Copy, Check, X, ImagePlus } from "lucide-react";
import { vehicles, vehicleName, branches, faNumber } from "@/lib/mehr-site/data";
import { parsePublicIntake, type IntakeKind, type PublicIntake } from "@/lib/mehr-site/intake";
import { PageHeading, Note } from "./ui";

const kindNames: Record<IntakeKind, string> = { visit: "بازدید حضوری / درخواست تست", "video-visit": "درخواست معرفی ویدیویی خودرو", service: "درخواست خدمات", "trade-in": "کارشناسی و معاوضه" };
type Photo = { name: string; url: string };

export function CustomerIntake({ tradeIn = false, initialCar = "", initialColor = "" }: { tradeIn?: boolean; initialCar?: string; initialColor?: string }) {
  const [kind, setKind] = useState<IntakeKind>(tradeIn ? "trade-in" : "visit");
  const [values, setValues] = useState({ name: "", phone: "", vehicleSlug: initialCar, branch: branches[0].name, preferredDate: "", note: "", color: initialColor, usedModel: "", usedYear: "", mileage: "", condition: "" });
  const [consent, setConsent] = useState(false), [review, setReview] = useState<PublicIntake | null>(null);
  const [available, setAvailable] = useState(false), [busy, setBusy] = useState(false), [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const photoRef = useRef<Photo[]>([]);
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/mehr-api/v1/requests", { signal: controller.signal, cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => setAvailable(data?.available === true)).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => () => { photoRef.current.forEach(photo => URL.revokeObjectURL(photo.url)); }, []);
  function change(field: keyof typeof values, value: string) { setValues(current => ({ ...current, [field]: value })); setMessage(""); }
  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length > 5 || files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024 || file.size === 0)) { setMessage("حداکثر ۵ تصویر JPG، PNG یا WebP، هرکدام تا ۸ مگابایت انتخاب کنید."); event.target.value = ""; return; }
    photoRef.current.forEach(photo => URL.revokeObjectURL(photo.url));
    const next = files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }));
    photoRef.current = next; setPhotos(next); setMessage("");
  }
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = parsePublicIntake({ ...values, kind, consent, consentVersion: "mehr-contact-v1" });
    if (!data) { setMessage("نام، موبایل معتبر، اطلاعات لازم و رضایت تماس را بررسی کنید. سال و کارکرد را با ارقام انگلیسی وارد کنید."); return; }
    setReview(data); setMessage("");
  }
  function summary() {
    if (!review) return "";
    return [uncertain ? "درخواست مهر — وضعیت ثبت نامشخص؛ پیش از ثبت مجدد پیگیری شود" : "پیش‌نویس درخواست مهر — هنوز ثبت نشده", kindNames[review.kind], `نام: ${review.name}`, `تماس: ${review.phone}`, `خودرو: ${vehicles.find(car => car.slug === review.vehicleSlug)?.title || "هنوز انتخاب نشده"}`, `شعبه: ${review.branch}`, `روز پیشنهادی: ${review.preferredDate || "نیازمند هماهنگی"}`, review.color && `رنگ دلخواه: ${review.color}`, review.usedModel && `خودروی فعلی: ${review.usedModel} / ${review.usedYear} / ${review.mileage} کیلومتر`, review.condition, review.note, "این پیش‌نویس شامل عکس یا مدرک نیست."].filter(Boolean).join("\n");
  }
  async function send() {
    if (!review || busy || reference || !available) return;
    const payload = JSON.stringify(review);
    if (!attempt.current || attempt.current.payload !== payload) attempt.current = { payload, key: crypto.randomUUID() };
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/mehr-api/v1/requests", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current.key }, body: payload, signal: AbortSignal.timeout(15_000) });
      const data = await response.json();
      if (response.status === 201 && data.status === "received" && typeof data.reference === "string") { setReference(data.reference); setUncertain(false); }
      else { if (response.status >= 500 && response.status !== 503) setUncertain(true); setMessage(data.error || "تأیید ثبت دریافت نشد؛ از تماس با مهر استفاده کنید."); }
    } catch { setUncertain(true); setMessage("تأیید ثبت دریافت نشد. وضعیت نامشخص است؛ همین درخواست را دوباره ارسال کنید یا با مهر پیگیری کنید."); }
    finally { setBusy(false); }
  }
  return <><PageHeading title={tradeIn ? "خودروی فعلی شما، قدم بعدی شما" : "یک قرار با مهر"} eyebrow={tradeIn ? "YOUR NEXT CHAPTER" : "MEET YOUR NEXT CAR"} description={tradeIn ? "اطلاعات خودرو را برای بررسی کارشناسی آماده کنید؛ ارزش قطعی پس از بررسی اعلام می‌شود." : "خودرو و نوع مراجعه را انتخاب کنید. زمان و امکان تست فقط پس از هماهنگی شعبه قطعی می‌شود."}/><section className="mx-workspace"><div className="mx-intake-layout">
    <div className="mx-panel">{reference ? <div className="mx-receipt" role="status"><Check size={38}/><h2>درخواست دریافت شد</h2><p>کد پیگیری: <bdi>{reference}</bdi></p><p>این پیام به معنی رزرو قطعی نوبت، تأیید قیمت یا تضمین امکان تست نیست. شعبه برای هماهنگی تماس می‌گیرد.</p></div> : review ? <div className="mx-review"><h2>قبل از ارسال بررسی کنید</h2><p className="mx-review-status">{uncertain ? "وضعیت ثبت نامشخص است؛ برای جلوگیری از درخواست تکراری، ویرایش موقتاً بسته است. همین درخواست را دوباره ارسال کنید یا با مهر پیگیری کنید." : "پیش‌نویس آماده است؛ هنوز ثبت نشده."}</p><pre>{summary()}</pre>{photos.length > 0 && <Note>{faNumber(photos.length)} تصویر فقط در این مرورگر پیش‌نمایش شده و همراه درخواست ارسال نمی‌شود.</Note>}<div className="mx-actions"><button disabled={busy || !available} className="ms-button ms-button-dark" onClick={send}>{busy ? "در انتظار پاسخ…" : available ? "ارسال درخواست به مهر" : "ارسال آنلاین هنوز فعال نیست"}<ArrowLeft size={18}/></button><button className="mx-secondary" disabled={busy || uncertain} onClick={() => { setReview(null); setMessage(""); }}>ویرایش اطلاعات</button><button className="mx-secondary" onClick={async () => { try { await navigator.clipboard.writeText(summary()); setMessage("پیش‌نویس کپی شد؛ برای ارسال، خودتان راه ارتباط مورد نظر را انتخاب کنید."); } catch { setMessage("کپی خودکار ممکن نیست؛ متن بالا را انتخاب و کپی کنید."); } }}><Copy size={17}/>کپی پیش‌نویس</button></div></div> : <form className="ms-form" onSubmit={prepare}>
      {!tradeIn && <fieldset className="mx-kind-choice"><legend>چطور همراهتان باشیم؟</legend>{(["visit", "video-visit", "service"] as const).map(value => <label key={value}><input type="radio" name="kind" value={value} checked={kind === value} onChange={() => { setKind(value); change("branch", value === "service" ? branches[1].name : branches[0].name); }}/>{kindNames[value]}</label>)}</fieldset>}
      <div className="ms-form-grid"><label>{tradeIn ? "خودروی مورد نظر برای خرید" : "خودروی مورد نظر"}<select value={values.vehicleSlug} onChange={event => change("vehicleSlug", event.target.value)}><option value="">هنوز انتخاب نکرده‌ام</option>{vehicles.map(car => <option key={car.slug} value={car.slug}>{vehicleName(car)}</option>)}</select></label><label>شعبه پیشنهادی<select value={values.branch} onChange={event => change("branch", event.target.value)}>{branches.map(branch => <option key={branch.name}>{branch.name}</option>)}</select></label><label>نام و نام خانوادگی *<input required autoComplete="name" maxLength={100} value={values.name} onChange={event => change("name", event.target.value)}/></label><label>موبایل ثبت تماس *<input required type="tel" autoComplete="tel" dir="ltr" maxLength={25} placeholder="09…" value={values.phone} onChange={event => change("phone", event.target.value)}/></label><label>روز پیشنهادی، نه نوبت قطعی<input type="date" value={values.preferredDate} onChange={event => change("preferredDate", event.target.value)}/></label><label>رنگ مورد علاقه<input maxLength={40} value={values.color} onChange={event => change("color", event.target.value)} placeholder="اختیاری"/></label></div>
      {tradeIn && <><h2>مشخصات خودروی فعلی</h2><div className="ms-form-grid"><label>برند و مدل *<input required maxLength={100} value={values.usedModel} onChange={event => change("usedModel", event.target.value)} placeholder="مثلاً تویوتا کرولا"/></label><label>سال ساخت میلادی *<input required inputMode="numeric" pattern="[0-9]{4}" dir="ltr" maxLength={4} value={values.usedYear} onChange={event => change("usedYear", event.target.value)} placeholder="2020"/></label><label>کارکرد، کیلومتر *<input required inputMode="numeric" pattern="[0-9]{1,7}" dir="ltr" maxLength={7} value={values.mileage} onChange={event => change("mileage", event.target.value)}/></label><label>وضعیت بدنه و فنی *<input required maxLength={250} value={values.condition} onChange={event => change("condition", event.target.value)} placeholder="مشاهدات شما؛ جایگزین کارشناسی نیست"/></label></div></>}
      <label>{kind === "service" ? "شرح نیاز به خدمات" : "توضیحات برای مشاور"}<textarea rows={4} maxLength={1200} value={values.note} onChange={event => change("note", event.target.value)} placeholder="شماره شاسی، کد ملی یا اطلاعات بانکی را اینجا وارد نکنید."/></label>
      {(tradeIn || kind === "service") && <div className="mx-photo-draft"><label><ImagePlus size={20}/>انتخاب عکس برای پیش‌نمایش محلی<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectPhotos}/></label><p>تا ۵ عکس، هرکدام ۸ مگابایت. عکس‌ها آپلود نمی‌شوند؛ ارسال تصویر و مدارک تا آماده‌شدن فضای امن غیرفعال است. پلاک و اشخاص را در عکس نیاورید.</p>{photos.length > 0 && <div className="mx-photo-list">{photos.map(photo => <div key={photo.url}><img src={photo.url} alt="تصویر انتخاب‌شده توسط شما" width={180} height={120}/><button type="button" aria-label={`حذف ${photo.name}`} onClick={() => { URL.revokeObjectURL(photo.url); photoRef.current = photoRef.current.filter(item => item.url !== photo.url); setPhotos(photoRef.current); }}><X size={16}/></button></div>)}</div>}</div>}
      <label className="mx-check"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)}/>با استفاده از نام، شماره و اطلاعات این فرم فقط برای پاسخ به همین درخواست موافقم. این رضایت شامل پیام تبلیغاتی نیست.</label>
      <button className="ms-button ms-button-dark" type="submit">مرور پیش‌نویس درخواست<ArrowLeft size={18}/></button>
    </form>}<p className="mx-status" role="status">{message}</p></div>
    <aside className="mx-intake-aside"><CalendarDays size={32}/><h2>{tradeIn ? "ارزیابی روشن، تصمیم آگاهانه" : "قرار بعدی شما، با هماهنگی"}</h2><ol><li>اطلاعات و خواسته خود را آماده کنید.</li><li>شعبه، زمان و امکان ارائه خدمت را بررسی می‌کند.</li><li>{tradeIn ? "ارزش کارشناسی و مابه‌التفاوت برای تصمیم شما اعلام می‌شود." : "تنها پس از تأیید شعبه، زمان مراجعه قطعی است."}</li></ol><Note>{available ? "ارسال متن درخواست در دسترس است. اطلاعات برای پاسخ به درخواست به مرکز مجاز مهر ارسال می‌شود؛ هیچ عکسی ارسال نمی‌شود." : "اتصال ثبت آنلاین آماده نیست. پیش‌نویس در همین صفحه باقی می‌ماند؛ چیزی در دستگاه ذخیره یا برای مهر ارسال نمی‌شود."}</Note><a className="ms-button ms-button-dark" href={kind === "service" ? "tel:+981333846760" : "tel:+981334206"}><Phone size={18}/>تماس برای درخواست واقعی</a><Link href="/mehr/contact" className="ms-text-link">نشانی و راه‌های ارتباط<ArrowLeft size={17}/></Link>{tradeIn && <Link href={`/mehr/purchase-plan${values.vehicleSlug ? `?car=${values.vehicleSlug}` : ""}`} className="ms-text-link">محاسبه مابه‌التفاوت با ارقام خودتان<ArrowLeft size={17}/></Link>}</aside>
  </div></section></>;
}

export function MyCarGateway() {
  return <><PageHeading title="خودروی من، از آغاز تا تحویل" eyebrow="MY MEHR JOURNEY" description="پرونده خرید، مسیر خودرو و اقدام بعدی شما در پرتال جداگانه مشتریان قرار می‌گیرد."/><section className="mx-workspace"><div className="mx-private-gateway"><div><ShieldCheck size={38}/><h2>اطلاعات خودروی شما، فقط برای شما</h2><p>برای دیدن قرارداد و خودرو، ورود تأییدشده لازم است. در این صفحه عمومی هیچ پرونده واقعی، شماره شاسی، ویدیو یا مدرک مشتری نمایش داده نمی‌شود.</p><Note>ورود پیامکی عملیاتی هنوز متصل نشده است. پرتال فعلی پیش‌نمایش محلی است و اطلاعات نمونه دارد؛ ورود به حساب واقعی مشتری نیست.</Note><Link className="ms-button ms-button-dark" href="/#/requests">بازکردن پیش‌نمایش پرتال<ArrowLeft size={18}/></Link></div><div className="mx-private-features">{[
    { icon: MapPin, title: "سفر خودرو", text: "نمایش مراحل تأییدشده از مبدأ تا تحویل؛ نه موقعیت زنده ساختگی." },
    { icon: Video, title: "ویدیوی خودروی تخصیص‌یافته", text: "نیازمند تخصیص قطعی، تأیید انتشار و دسترسی امن مالک؛ هنوز متصل نیست." },
    { icon: FileCheck2, title: "مدارک و اقدام بعدی", text: "ارسال خصوصی و بررسی مدارک پس از اتصال فضای امن و احراز هویت فعال می‌شود." },
  ].map(item => <div key={item.title}><item.icon size={25}/><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</div></div></section></>;
}
