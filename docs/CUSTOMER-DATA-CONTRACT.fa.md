# قرارداد داده مشتری — Marketplace v1

این سند مرز انتشار تأییدشده برای اتصال لوکال است. استفاده خارج از localhost همچنان نیازمند تأیید مستقل انتشار، هویت OTP و Customer Read Model عملیاتی است.

## Endpointهای BFF

```text
GET  /customer-api/v1/marketplace/listings?kind=SALES_PLAN|USED_SUPPLY&cursor=...
GET  /customer-api/v1/marketplace/listings/{listingId}
GET  /customer-api/v1/marketplace/media/{mediaId}
POST /customer-api/v1/marketplace/listings/{listingId}/applications
GET  /customer-api/v1/me/purchase-applications
GET  /customer-api/v1/me/purchase-applications/{applicationId}
GET  /customer-api/v1/me/purchase-applications/{applicationId}/journey/events
GET  /customer-api/v1/me/purchase-applications/{applicationId}/journey/documents
GET  /customer-api/v1/me/purchase-applications/{applicationId}/journey/media
POST /customer-api/v1/me/purchase-applications/{applicationId}/offer-decisions
POST /customer-api/v1/me/purchase-applications/{applicationId}/payments
POST /customer-api/v1/me/purchase-applications/{applicationId}/inspection-decisions
```

## فیلدهای مجاز مشترک

- شناسه عمومی opaque لیستینگ؛ نه شناسه داخلی
- نوع `SALES_PLAN` یا `USED_SUPPLY`
- برند، مدل، تیپ، سال، رنگ، بدنه، گیربکس، سوخت و ویژگی‌های منتشرشده
- قیمت فعلی سامانه به‌صورت رشته عددی IRR و برچسب نمایشی؛ این مبلغ تا انتشار Offer نسخه‌دار می‌تواند توسط مدیر تأمین تغییر کند
- وضعیت عمومی موجودی، زمان انتشار و انقضا
- عکس/ویدئوی تأییدشده با شناسه عمومی و URL واسط
- عنوان، توضیح و شرایط مشتری‌پسند

## افزونه طرح فروش

- نوع فروش و عنوان طرح
- تاریخ شروع/پایان درخواست
- پیش‌پرداخت و اقساط، فقط در صورت انتشار رسمی
- موعد تقریبی تحویل یا تعداد روز کاری
- رنگ‌ها/نسخه‌های قابل انتخاب

## افزونه خودروی کارکرده

- در کاتالوگ اولیه: مشخصات گزینه قابل تأمین، مبلغ بیعانه، توضیح مسیر پیشنهاد و کارشناسی
- پس از تأیید مدیر تأمین: Offer ID/Revision، قیمت نهایی، مانده، شرایط، مهلت و خلاصه تغییرات نسخه
- پس از پرداخت بیعانه: وضعیت مأموریت کارشناسی
- پس از انتشار: آخرین Revision گزارش کارشناس و Certificate Report پاک‌سازی‌شده
- پس از تأیید مشتری: تعهد پرداخت مانده و رسیدهای پرداخت
- VIN فقط پس از تخصیص قطعی و فقط در پرونده مالک

## افزونه سفر خودرو پس از تسویه

- فصل عمومی `PURCHASE / ORIGIN_PREPARATION / INTERNATIONAL_TRANSPORT / IMPORT_CLEARANCE / DOMESTIC_LOGISTICS / DELIVERY_PREPARATION / HANDOVER`
- وضعیت هر فصل، نقاط عطف تکمیل‌شده و درصد سروری مبتنی بر رویداد منتشرشده
- آخرین رویداد تأییدشده، زمان وقوع/انتشار و قدم بعدی مشتری‌پسند
- ETA به‌صورت بازه و سطح اطمینان؛ نه وعده تاریخ قطعی
- موقعیت در حد کشور/منطقه/شهر مجاز همراه `isLive: false` و `asOf`
- Delay فقط با متن عمومی از Template تأییدشده
- اسناد/ویدئو فقط پس از Scan، Redaction، تأیید انتشار و لینک کوتاه‌عمر

## فیلدهای ممنوع

- CIF، هزینه تکمیلی، قیمت خرید، سود و نرخ ارز داخلی
- VIN پیشنهادی، VIN تخصیص‌نیافته و پلاک
- تعداد دقیق موجودی، کسری یا اولویت منطقه‌ای
- اطلاعات سایر مشتریان و مالک قبلی
- یادداشت داخلی، کلید طبیعی، شناسه/بازبینی قیمت‌گذاری
- جزئیات تأمین‌کننده، حمل‌کننده، پارت یا محل دقیق خودرو
- جزئیات کامل کارشناسی که برای انتشار تأیید نشده‌اند
- GPS، مسیر دقیق، بندر/انبار عملیاتی، بارنامه، کانتینر، کشتی، پرواز یا Booking
- اسناد خام خرید، حمل، واردات و گمرک

## قواعد انتشار

- فقط `PUBLISHED` با مخاطب `CUSTOMER` قابل خواندن است. BFF این markerها را بررسی و پیش از پاسخ مرورگر حذف می‌کند.
- برای خودروی کارکرده، marker `PRICE_APPROVED` فقط تأیید قیمت منبع است و هرگز به برچسب «کارشناسی‌شده مهر» تبدیل نمی‌شود.
- کاتالوگ `USED_SUPPLY` فقط پس از تأیید انتشار نمایش داده می‌شود؛ تأیید فنی خودروی فیزیکی صرفاً بعد از بیعانه و انتشار گزارش پرونده است.
- رکورد ناقص، وضعیت ناشناخته یا media تأییدنشده fail closed است.
- موجودی و صلاحیت هنگام ایجاد درخواست دوباره در سرور کنترل می‌شوند.
- DTO خروجی field-by-field ساخته می‌شود؛ spread کردن رکورد داخلی روی پاسخ ممنوع است.
- مرورگر هیچ‌گاه `customer_id`، وضعیت انتشار یا نتیجه کارشناسی را تعیین نمی‌کند.
- VIN فقط در پرونده خود مشتری و پس از تخصیص قطعی نمایش داده می‌شود؛ Marketplace اصولاً VIN منتشر نمی‌کند.

## وضعیت اجرای لوکال

- ۱۳۲ رکورد واجد شرایط از دیتابیس محلی سامانه در زمان اتصال خوانده شدند.
- browser فقط BFF روی پورت `3001` را فراخوانی می‌کند؛ ارتباط پورت `3000` فقط server-to-server و با Bearer چرخشی است.
- response حداکثر ۱ MiB، redirect ممنوع، JSON و Contract Version اجباری و فهرست حداکثر ۲۰۰ رکورد است.
- هر خواندن در `audit_event` سامانه داخلی با نوع `customer_marketplace` ثبت می‌شود.
- رسانه خارجی عبور داده نمی‌شود و تصویر جایگزین داخلی استفاده می‌شود.
