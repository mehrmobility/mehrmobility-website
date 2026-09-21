"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Phone, ChevronRight, CalendarDays } from "lucide-react";
import { Note } from "./ui";
import { faDate, brands } from "@/lib/mehr-site/data";

type Mode = "purchase" | "contact" | "numberplate" | "comment";
const normalizePhone=(value:string)=>value.replace(/[۰-۹]/g,c=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g,c=>String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[\s()-]/g,"");
export function RequestForm({ mode="contact", vehicle="", source="https://mehrkhodro.co/contact-us/" }: { mode?: Mode; vehicle?: string; source?: string }) {
  const [done,setDone]=useState(false);
  const [error,setError]=useState("");
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const phone=normalizePhone(String(data.get("phone")||""));
    if(mode!=="comment"&&(mode!=="contact"||phone)&&!/^(?:\+98|0098|0)[0-9]{8,11}$/.test(phone)){setError("شماره تماس را همراه با صفر یا کد کشور وارد کنید.");return;}
    setError("");setDone(true);
  }
  if(done)return <div className="ms-form-result" role="status"><span className="ms-result-icon"><Check/></span><h3>اطلاعات فرم آماده است</h3><p>این نسخه برای بررسی طراحی است؛ هیچ درخواستی ثبت یا ارسال نشده است.</p><a className="ms-button ms-button-dark" href={source} target="_blank" rel="noreferrer">ادامه در سایت فعلی مهر <ArrowLeft size={18}/></a><button className="ms-text-link" onClick={()=>setDone(false)}>بازگشت به فرم</button></div>;
  return <form className="ms-form" onSubmit={submit}>
    <Note>پیش‌نمایش فرم؛ اطلاعات شما ذخیره یا ارسال نمی‌شود. برای درخواست واقعی با مهر تماس بگیرید.</Note>
    <div className="ms-form-grid"><label>نام و نام خانوادگی <span>*</span><input name="name" autoComplete="name" required maxLength={100} placeholder="نام کامل شما"/></label>{mode!=="comment"&&<label>شماره تماس {mode!=="contact"&&<span>*</span>}<input name="phone" type="tel" dir="ltr" autoComplete="tel" required={mode!=="contact"} maxLength={18} placeholder="09…"/></label>}
    {(mode==="contact"||mode==="purchase"||mode==="comment")&&<label>ایمیل {mode!=="purchase"&&<span>*</span>}<input name="email" type="email" dir="ltr" autoComplete="email" required={mode!=="purchase"} placeholder="name@example.com"/></label>}
    {mode==="purchase"&&<><label>خودروی درخواستی<input name="vehicle" defaultValue={vehicle} required/></label><label>شهر<input name="city" autoComplete="address-level2" list="ms-cities" placeholder="شهر محل سکونت"/><datalist id="ms-cities">{["رشت","بندر انزلی","لاهیجان","لنگرود","آستارا","تالش","رودسر","تهران"].map(x=><option key={x} value={x}/>)}</datalist></label></>}
    {mode==="numberplate"&&<><label>برند خودرو <span>*</span><select name="brand" required defaultValue=""><option value="" disabled>انتخاب برند</option>{Object.entries(brands).map(([id,title])=><option key={id} value={title}>{title}</option>)}<option>سایر</option></select></label><label>مدل خودرو <span>*</span><input name="model" required placeholder="مثلاً کرولا"/></label><label>سال ساخت میلادی <span>*</span><input name="year" type="number" min={1980} max={2030} required placeholder="2024"/></label></>}
    {mode==="contact"&&<label>موضوع پیام<input name="subject" maxLength={150} placeholder="چطور می‌توانیم کمک کنیم؟"/></label>}
    </div>
    {(mode==="comment"||mode==="contact")&&<label>{mode==="comment"?"دیدگاه شما":"پیام شما"}<textarea name="message" rows={4} maxLength={3000} required={mode==="comment"} placeholder="پیام خود را اینجا بنویسید…"/></label>}
    {error&&<p className="ms-field-error" role="alert">{error}</p>}<div className="ms-form-actions"><button className="ms-button ms-button-dark" type="submit">بررسی اطلاعات فرم<ArrowLeft size={18}/></button><a className="ms-text-link" href="tel:+981334206"><Phone size={17}/>تماس با مهر</a></div>
  </form>;
}

export function BookingForm({ service }: { service: string }) {
  const [step,setStep]=useState(0),[date,setDate]=useState(""),[slot,setSlot]=useState(""),[done,setDone]=useState(false),[error,setError]=useState("");
  const [contact,setContact]=useState({phone:"",email:"",address:""});
  const slots=["08:00–09:00","09:10–10:10","10:20–11:20","11:30–12:30","12:40–13:40","13:50–14:50","15:00–16:00","16:10–17:00"];
  function next(e:FormEvent<HTMLFormElement>){e.preventDefault();if(step===1&&!/^(?:\+98|0098|0)[0-9]{8,11}$/.test(normalizePhone(contact.phone))){setError("شماره تماس معتبر وارد کنید.");return;}setError("");if(step<2)setStep(step+1);else setDone(true);}
  return <div className="ms-booking"><div className="ms-booking-title"><CalendarDays/><div><h2>درخواست نوبت خدمات</h2><p>{service}</p></div></div><Note>پیش‌نمایش نوبت‌گیری؛ ساعت‌ها نمونه‌اند. هیچ نوبت، سفارش یا پرداخت واقعی ثبت نمی‌شود.</Note>
    <ol className="ms-booking-steps">{["زمان مراجعه","اطلاعات تماس","مشخصات خودرو"].map((label,i)=><li key={label} className={i<=step?"is-active":""}><span>{i<step?<Check size={14}/>:i+1}</span>{label}</li>)}</ol>
    {done?<div className="ms-form-result" role="status"><h3>پیش‌نمایش درخواست شما</h3><p>{service} · {date&&faDate(date+"T12:00:00Z")} · <bdi>{slot}</bdi></p><p>این نوبت تأیید نشده است. برای هماهنگی زمان و تعرفه با مرکز خدمات تماس بگیرید.</p><a href="tel:+981333846760" className="ms-button ms-button-dark">تماس با مرکز خدمات<Phone size={18}/></a></div>:<form onSubmit={next} className="ms-form">
      {step===0&&<><label>روز پیشنهادی مراجعه<input type="date" required value={date} onChange={e=>setDate(e.target.value)} min={new Date().toLocaleDateString("en-CA")} aria-label="روز پیشنهادی مراجعه"/></label>{date&&<p className="ms-date-preview">{faDate(date+"T12:00:00Z")}</p>}<fieldset className="ms-slots"><legend>ساعت پیشنهادی</legend>{slots.map(s=><label key={s} className={slot===s?"is-selected":""}><input type="radio" name="slot" value={s} required checked={slot===s} onChange={()=>setSlot(s)}/><bdi>{s}</bdi></label>)}</fieldset></>}
      {step===1&&<><div className="ms-form-grid"><label>شماره تماس *<input type="tel" dir="ltr" autoComplete="tel" required value={contact.phone} onChange={e=>setContact({...contact,phone:e.target.value})}/></label><label>ایمیل<input type="email" dir="ltr" autoComplete="email" value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})}/></label></div><label>نشانی *<textarea required autoComplete="street-address" value={contact.address} onChange={e=>setContact({...contact,address:e.target.value})}/></label></>}
      {step===2&&<><div className="ms-form-grid"><label>برند خودرو *<select required defaultValue=""><option value="" disabled>انتخاب کنید</option>{Object.values(brands).map(b=><option key={b}>{b}</option>)}<option>سایر</option></select></label><label>سال تولید میلادی *<input type="number" min={1980} max={2030} required/></label><label>وضعیت خودرو *<select required defaultValue=""><option value="" disabled>انتخاب کنید</option><option value="new">نو</option><option value="used">کارکرده</option></select></label></div><Note>تعرفه خدمات پس از بررسی نوع خودرو و خدمت اعلام می‌شود.</Note></>}
      {error&&<p className="ms-field-error" role="alert">{error}</p>}<div className="ms-form-actions">{step>0&&<button className="ms-text-link" type="button" onClick={()=>setStep(step-1)}><ChevronRight size={16}/>مرحله قبل</button>}<button className="ms-button ms-button-dark" type="submit">{step===2?"نمایش خلاصه درخواست":"ادامه"}<ArrowLeft size={18}/></button></div>
    </form>}
  </div>;
}
