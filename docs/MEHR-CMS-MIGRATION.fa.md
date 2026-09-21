# اجرای CMS مهر

فایل `db/migrations/001_mehr_cms.sql` مدل داده نسخه‌دار CMS را برای MariaDB 10.6+ فراهم می‌کند. این migration عمداً اجرا نشده است؛ پیش از اجرا باید اتصال database مستقل، backup معتبر، secretهای ورود و تأیید انتشار production مشخص شوند.

## ترتیب اجرا

1. ساخت database CMS مستقل و اعمال migration افزایشی.
2. اجرای `db/seeds/mariadb/001_cms_roles.sql` و ایجاد اولین SYSTEM_ADMIN با password hash (هرگز رمز خام).
3. انتقال read-only صفحات، منوها، خودروها و رسانه‌های فعلی به document/revision.
4. اتصال سایت عمومی فقط به published revisionها از طریق CMS Read API. در preview محلی، صفحه اصلی، منو، معرفی صفحات و محتوای خبر/مجله/خدمات به این read model متصل شده‌اند.
5. فعال‌سازی Content Studio، Media Library، Redirects و Audit UI.
6. پس از smoke test، جایگزینی storeهای باقی‌مانده توسعه (کاتالوگ JSON و راهنمای واردات) با CMS API و archive نرم.

هیچ جدول CMS شامل داده قرارداد، VIN، هزینه داخلی یا سند خصوصی مشتری نیست.

## گیت انتقال MariaDB

- نام کاربر CMS و رمز hash‌شده فقط در database مستقل CMS نگهداری می‌شوند؛ متغیرهای ورود موقت preview جایگزین آن نیستند.
- کاربر اتصال وب فقط مجاز به جدول‌های CMS است؛ هیچ DSN، credential یا replication از سامانه داخلی در این پروژه تعریف نمی‌شود.
- ابتدا migration، سپس seed نقش‌ها، backup، تست دسترسی نقش‌محور و smoke test صفحات منتشرشده اجرا می‌شود. اتصال production یا اجرای این SQL خارج از فرایند release تأییدشده نیست.
