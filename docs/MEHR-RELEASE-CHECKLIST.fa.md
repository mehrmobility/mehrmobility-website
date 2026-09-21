# چک‌لیست انتشار سایت عمومی مهر

این فایل برای آماده‌سازی artifact است؛ اجرای هر مورد production فقط پس از تأیید صریح مالک انجام می‌شود.

## پیش‌نیاز artifact

1. شاخه release از یک commit/SHA بازتولیدپذیر ساخته شده باشد.
2. `npm run release:verify-local` موفق باشد.
3. فایل‌های `data/`، `.env`، backupها و داده مشتری در artifact یا Git نباشند.
4. migration و seed فقط در database مستقل CMS آماده باشند:
   - `db/migrations/001_mehr_cms.sql`
   - `db/seeds/mariadb/001_cms_roles.sql`

## گیت production

1. backup قابل بازیابی از database مستقل CMS گرفته شود.
2. secretهای production برای هویت ادمین، session و نقش‌ها تعیین شوند؛ رمز local هرگز منتقل نشود.
3. `MEHR_PUBLIC_ORIGIN=https://mehrkhodro.co` تنظیم شود؛ `MEHR_ALLOW_INDEXING` تا پایان smoke test روی `false` بماند.
4. migration و role smoke test با کاربر محدود CMS اجرا شود؛ هیچ credential یا اتصال به دیتابیس داخلی مجاز نیست.
5. deploy انجام و SHA اجراشده ثبت شود.
6. smoke test روی دامنه واقعی: خانه، خودروها، خبرها، خدمات، راهنمای واردات، ورود ادمین، `401` مهمان، صفحه 404 و رسانه عمومی.
7. canonical، redirectهای قدیمی، sitemap و Search Console بررسی شوند.
8. فقط پس از تأیید نهایی مالک، `MEHR_ALLOW_INDEXING=true` و انتشار عمومی فعال شود.

## معیار توقف

اگر SHA، backup، database مستقل، secret یا نتیجه smoke test وجود نداشت، deploy متوقف می‌شود.
