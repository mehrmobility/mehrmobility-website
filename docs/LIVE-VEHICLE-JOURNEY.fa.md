# سفر زنده خودرو — از خرید قطعی تا تحویل

این سند قرارداد محصول و اتصال برای نمایش مراحل پس از پرداخت کامل است. «زنده» در این محصول یعنی آخرین رویداد تأییدشده سامانه با تازه‌سازی خودکار؛ نه GPS لحظه‌ای، مسیر دقیق خودرو یا داده خام حمل‌کننده.

## تجربه مشتری

پس از تسویه مانده، پرونده از فرایند تصمیم‌گیری خرید وارد «سفر خودروی من» می‌شود:

1. خرید و تثبیت سفارش
2. آماده‌سازی در مبدا
3. حمل بین‌المللی
4. واردات و ترخیص
5. لجستیک داخل کشور
6. کنترل نهایی، PDI و مدارک تحویل
7. هماهنگی و تحویل خودرو

هر فصل شامل نقاط عطف قطعی است. درصد فقط از تعداد نقاط عطف عمومی منتشرشده محاسبه می‌شود و با گذشت زمان بالا نمی‌رود.

```text
displayPercent = completedPublishedMilestones / totalPublishedMilestones
```

UI باید موارد زیر را نمایش دهد:

- مسیر گرافیکی هفت‌ایستگاهی با تفکیک روشن مرحله انجام‌شده، جاری و بعدی
- در موبایل سه ایستگاه مرتبط در نگاه اول و امکان بازکردن کل مسیر
- مرحله جاری و شماره آن از هفت ایستگاه به‌عنوان شاخص اصلی
- آخرین اتفاق تأییدشده و زمان انتشار آن
- قدم بعدی سفر
- بازه احتمالی تحویل همراه سطح اطمینان
- تأخیر با دلیل عمومی و زمان بررسی بعدی
- نشان‌های غیررقابتی مانند «خرید قطعی»، «آماده سفر»، «به ایران رسید»، «عبور از گمرک» و «آماده ملاقات»
- اسناد و رسانه‌های تأییدشده همان پرونده

پس از ورود پرونده به سفر خودرو، مراحل شش‌گانه خرید به نوار فشرده «فرایند خرید تکمیل شد» تبدیل می‌شوند تا دو سیستم پیشرفت با هم رقابت نکنند. تاریخچه کامل نیز به‌صورت پیش‌فرض بسته می‌ماند.

امتیاز رقابتی، جایزه مالی، حرکت ساختگی خودرو و پنهان‌کردن تأخیر با عناصر بازی ممنوع است.

## روش به‌روزرسانی MVP

- Polling نسخه‌دار هنگام باز بودن صفحه: مقدار پیشنهادی سرور، فعلاً ۳۰ ثانیه
- هنگام مخفی بودن صفحه: حداقل ۹۰ ثانیه
- تازه‌سازی فوری بعد از بازگشت به صفحه یا اتصال مجدد اینترنت
- Backoff خطا تا پنج دقیقه
- متن ثابت UI: «آخرین وضعیت تأییدشده»

در فاز دوم SSE فقط اعلان تغییر `{caseId, version, cursor}` را می‌فرستد و سپس وب‌اپ Snapshot امن را دوباره از Customer API دریافت می‌کند. مرورگر به Event Bus یا Outbox داخلی متصل نمی‌شود.

## API عمومی پیشنهادی

```text
GET /customer-api/v1/me/purchase-applications/{caseId}
GET /customer-api/v1/me/purchase-applications/{caseId}/journey/events?after={cursor}&limit=30
GET /customer-api/v1/me/purchase-applications/{caseId}/journey/documents
GET /customer-api/v1/me/purchase-applications/{caseId}/journey/documents/{documentId}/content
GET /customer-api/v1/me/purchase-applications/{caseId}/journey/media/{mediaId}/playback
```

شناسه مشتری از Session موبایل/OTP استخراج می‌شود. پرونده متعلق به مشتری دیگر باید `404` برگرداند. URL فایل و ویدئو کوتاه‌عمر و امضاشده است.

## نگاشت سامانه داخلی به فصل عمومی

سامانه فعلی زیرساخت مهمی دارد که می‌تواند منبع رویداد باشد:

- `import_process_case` به‌ازای هر VIN: Aggregate مناسب سفر
- `vehicle_sales_projection`: منبع وضعیت، ETA و Revision پس از پالایش
- `transport_event` و Milestoneهای مسیر: منبع قطعی پیشرفت حمل
- `customs_case` و `vehicle_exit`: منبع واردات و ترخیص
- `logistics_handover` و وضعیت‌های `PDI_GREEN / READY_FOR_DELIVERY`: منبع لجستیک و PDI
- `workflow_command` و `audit_event`: کمک به Idempotency و ردگیری؛ جایگزین Outbox نیستند

نگاشت عمومی:

| وضعیت/رویداد داخلی | خروجی مشتری |
|---|---|
| `PURCHASED` | خرید خودرو نهایی شد |
| `READY_FOR_CARRIER / PLANNED` | آماده‌سازی برنامه حمل |
| `HANDED_TO_CARRIER / DEPARTED / IN_TRANSIT` | حمل خودرو آغاز شد / خودرو در مسیر است |
| `ARRIVED_IRAN` | ورود خودرو به کشور تأیید شد |
| `DOCS_PENDING ... PAYMENT_PENDING` | تشریفات واردات و ترخیص در حال انجام است |
| `vehicle_exit` | خودرو ترخیص شد |
| `PENDING_RECEIPT / RECEIVED` | خودرو در لجستیک داخلی است |
| `PDI_RED` | کنترل نهایی نیازمند پیگیری است |
| `PDI_GREEN` | کنترل نهایی با موفقیت انجام شد |
| `READY_FOR_DELIVERY` | آماده هماهنگی تحویل |
| رویداد جدید `VEHICLE_DELIVERED` | خودرو تحویل شد |

رویدادهای دیررس نباید مرحله مشتری را به عقب ببرند؛ اصلاح تنها با رویداد اصلاحی نسخه‌دار، دلیل عمومی و Audit مجاز است.

## امکاناتی که باید به سامانه داخلی اضافه شود

1. `customer_vehicle_entitlement` برای مالکیت قطعی مشتری، سفارش و خودرو؛ VIN فقط در `FINAL_ALLOCATED` قابل انتشار است.
2. `integration_outbox` و `integration_inbox` پایدار با Retry، Deduplication، Dead Letter و Service Principal مستقل.
3. Customer Projector و دیتابیس مستقل شامل `customer_vehicle_journey`، `customer_vehicle_journey_event` و `customer_vehicle_milestone`.
4. Event غیرقابل‌ویرایش برای همه Transitionهای گمرک، لجستیک، PDI و تحویل؛ Audit عمومی جای Domain Event را نمی‌گیرد.
5. ETA برای ترخیص، خروج، PDI و تحویل با `plannedAt / forecastAt / actualAt / delayReasonCode`.
6. `pdi_inspection` ساختاریافته با چک‌لیست، Revision، نقص، اقدام اصلاحی و نسخه عمومی گزارش.
7. `delivery_appointment`، انتخاب زمان/مرکز تحویل، OTP تحویل‌گیرنده، صورت‌جلسه و Proof of Delivery.
8. انتقال نهایی `READY_FOR_DELIVERY → DELIVERY_SCHEDULED → HANDED_OVER → DELIVERED` و رویداد `VEHICLE_DELIVERED`.

## داده‌های ممنوع

- موقعیت دقیق، GPS، انبار و محوطه عملیاتی
- نام تأمین‌کننده، حمل‌کننده، فورواردر و کارشناس
- شماره بارنامه، کانتینر، کشتی، پرواز، Booking، پارت و مسیر دقیق
- CIF، بهای خرید، سود، نرخ ارز و پرداخت داخلی
- اظهارنامه و اسناد خام تجاری/گمرکی
- کد خطا، Risk Score، SLA و یادداشت داخلی
- اطلاعات سایر خودروها یا مشتریان
- VIN پیشنهادی، موقت یا رزروشده

Location عمومی همیشه `isLive: false` و دارای `asOf` است. VIN فقط وقتی منتشر می‌شود که تخصیص قطعی، تطبیق مالک پرونده و تأیید انتشار هم‌زمان برقرار باشند.
