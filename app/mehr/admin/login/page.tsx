import { redirect } from "next/navigation";
import { adminConfigured, getAdminSession } from "@/lib/mehr-site/admin-auth";
import "../admin.css";
import "../login.css";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) { if (await getAdminSession()) redirect("/mehr/admin"); const { error } = await searchParams; return <main className="ma-login"><form action="/mehr/admin/session" method="post"><img src="/brand/mehr-symbol.png" alt="نشان مهر" width={52} height={52}/><span className="ma-eyebrow">MEHR OPERATOR ACCESS</span><h1>ورود به پنل مهر</h1><p>دسترسی فقط برای اپراتورهای تأییدشده است.</p>{!adminConfigured() ? <p className="ma-login-error">تنظیمات ورود روی سرور کامل نشده است.</p> : error ? <p className="ma-login-error">نام کاربری یا رمز عبور نادرست است.</p> : null}<label>نام کاربری<input required name="username" autoComplete="username"/></label><label>رمز عبور<input required name="password" type="password" autoComplete="current-password"/></label><button className="ms-button ms-button-dark" type="submit">ورود به پنل</button></form></main>; }
