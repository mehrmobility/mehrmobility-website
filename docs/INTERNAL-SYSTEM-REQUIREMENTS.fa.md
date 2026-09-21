# امکانات لازم در سامانه داخلی مهر

این سند فقط نیازمندی‌های سامانه داخلی را مشخص می‌کند. در این کار هیچ تغییری در مخزن سامانه داخلی انجام نشده است.

## نتیجه ممیزی وضعیت فعلی

مبنای بررسی: شاخه `main` مخزن `mehr-vehicle-supply-platform`، commit `df780ca3a823ff47a30207de7bfc5acef2b2f2a4`.

سامانه فعلی موتور محاسبه قیمت خودروی کارکرده، نسخه‌بندی سود، RBAC، Audit، Idempotency و `workflow_command` دارد؛ اما فرایند خرید مشتری وجود ندارد. امکانات گمرک، PDI لجستیک و `trade_document` معنای دیگری دارند و نباید برای این فرایند بازاستفاده شوند.

## ۱. Aggregate و جداول جدید

### `used_vehicle_supply_request`

- شناسه داخلی و شناسه عمومی opaque
- `externalCustomerSubjectId` دریافتی از سرویس وب‌اپ
- Snapshot آگهی/انتخاب مشتری
- وضعیت اصلی، نسخه optimistic و SLA
- آخرین Offer و Report پذیرفته‌شده
- زمان ایجاد/تغییر و actorها

### `used_vehicle_candidate_reservation`

- ارتباط خصوصی با خودروی فیزیکی یا Candidate
- وضعیت موجودی و تاریخ انقضای رزرو
- قید یکتای رزرو فعال برای جلوگیری از فروش هم‌زمان
- VIN فقط در بخش خصوصی؛ انتشار آن منوط به تخصیص قطعی

### `used_vehicle_offer`

- `requestId`، Revision افزایشی و hash محتوا
- `publicPriceRial`
- شرایط مشتری‌پسند ساختاریافته
- `validUntil`
- `DRAFT / PUBLISHED / SUPERSEDED / ACCEPTED / REJECTED / EXPIRED`
- دلیل تغییر داخلی و خلاصه تغییر قابل انتشار جداگانه
- ارتباط اختیاری و خصوصی با محاسبه قیمت فعلی؛ هزینه، سود و نرخ ارز هرگز وارد DTO مشتری نشوند

### `used_vehicle_customer_decision`

- مرحله `OFFER` یا `INSPECTION`
- شناسه و Revision هدف
- `ACCEPT / REJECT / REQUEST_REVISION`
- نسخه رضایت/شرایط، actor مشتری و timestamp

### `used_vehicle_payment_obligation`

- نوع `DEPOSIT / FINAL_BALANCE`
- مبلغ IRR، Offer Revision، dueAt و وضعیت
- Snapshot سیاست بیعانه؛ مبلغ فعلی `2_000_000_000 IRR`

### `used_vehicle_payment_transaction`

- درگاه، order/authority/trace، مبلغ و واحد
- `CREATED / PENDING / VERIFIED / FAILED / EXPIRED / CANCELLED / REFUND_PENDING / REFUNDED`
- قید یکتای مرجع درگاه و Idempotency-Key
- نتیجه Callback و امضا فقط در بخش محرمانه

### `used_vehicle_inspection`

- درخواست/Candidate، کارشناس و مبدا خصوصی
- `SCHEDULED / IN_PROGRESS / REPORT_DRAFT / REPORT_PUBLISHED`
- نتیجه ساختاریافته، Revision، خلاصه عمومی و یادداشت داخلی جدا

### `used_vehicle_artifact`

- نوع `INSPECTION_REPORT / CERTIFICATE_REPORT / PHOTO / VIDEO`
- R2 object key، MIME، size، SHA-256 و Revision
- وضعیت virus scan، redaction، QA و publication
- `supersedesArtifactId` برای اصلاح نسخه

### Integration

- `customer_integration_outbox`
- `customer_integration_inbox` یا توسعه کنترل‌شده `workflow_command`
- deduplication بر پایه Event ID و ترتیب بر پایه Aggregate Version

## ۲. کارتابل مدیر تأمین

- منوی «درخواست‌های تأمین وب‌اپ» با صف، SLA، فیلتر وضعیت و تخصیص کارشناس پرونده
- صفحه پرونده با Timeline کامل و اطلاعات مشتری در حد نقش
- تأیید «موجود است / قابل تأمین نیست» و رزرو Candidate
- فرم Draft قیمت و شرایط مشتری‌پسند
- Preview دقیق آنچه مشتری می‌بیند
- انتشار Offer و ایجاد Revision جدید به‌جای ویرایش نسخه منتشرشده
- مقایسه نسخه‌ها و الزام ثبت دلیل تغییر
- مشاهده نتیجه پذیرش/رد مشتری
- ممنوعیت تغییر معمول قیمت پس از وصول بیعانه؛ مسیر Amendment با تأیید سطح بالاتر

## ۳. کارتابل کارشناس خودرو

- دریافت مأموریت فقط بعد از تأیید قطعی بیعانه
- زمان‌بندی و ثبت شروع/پایان کارشناسی مبدا
- فرم ساختاریافته فنی، بدنه، کابین، ایمنی، تایر و تصاویر
- بارگذاری گزارش کارشناسی و Certificate Report
- جداسازی یادداشت داخلی از خلاصه عمومی
- کنترل کامل‌بودن، scan، redaction و QA پیش از انتشار
- انتشار Revision گزارش و ابطال تصمیم قبلی مشتری در صورت اصلاح

## ۴. کارتابل مالی

- مشاهده Payment Intent و تراکنش‌ها به‌صورت read-only برای سایر نقش‌ها
- Verify/Inquiry سروربه‌سرور و تطبیق مبلغ/واحد/مرجع
- Reconciliation دوره‌ای و پایان روز
- صف مغایرت، پرداخت تکراری، موفقیت دیرهنگام و Pending طولانی
- درخواست و پیگیری بازپرداخت کامل/جزئی با تأیید دوم
- رسید پرداخت و رسید بازپرداخت

## ۵. نقش‌ها و Permissionها

- `ROLE-COM-SUP-MGR`: مشاهده/بررسی درخواست، تأیید موجودی، ساخت/اصلاح/انتشار پیشنهاد و تخصیص کارشناس
- `ROLE-COM-UV-INSPECTOR`: مشاهده مأموریت، ثبت کارشناسی و بارگذاری Artifact؛ بدون قیمت محرمانه یا پرداخت
- `ROLE-FIN-CUSTOMER-PAYMENT`: مشاهده، تطبیق و بازپرداخت؛ بدون تغییر Offer یا Report
- Service Principal وب‌اپ: ثبت Command مشتری با مالکیت و Idempotency؛ نه نقش پرسنلی
- تغییر دستی قیمت پس از بیعانه و بازپرداخت، نیازمند تأیید دوم و Audit است

## ۶. API خصوصی اتصال

این مسیرها از `/api/prototype` جدا و فقط سرویس‌به‌سرویس باشند:

```text
POST /api/integration/customer/v1/used-vehicle-requests
POST /api/integration/customer/v1/used-vehicle-requests/{id}/offer-decisions
POST /api/integration/customer/v1/used-vehicle-requests/{id}/inspection-decisions
POST /api/integration/customer/v1/used-vehicle-requests/{id}/payment-results
```

- احراز سرویس با mTLS یا HMAC شامل timestamp، nonce و rotation
- تمام Commandها دارای Idempotency-Key، correlationId و actor customer subject
- شناسه مشتری از نشست OTP در BFF استخراج می‌شود و از Body مرورگر پذیرفته نمی‌شود
- Transition و Outbox Event در یک تراکنش نوشته می‌شوند
- پاسخ خام جدول یا مدل داخلی به وب‌اپ Proxy نمی‌شود

## ۷. Eventهای Outbox

```text
used_vehicle.request.submitted.v1
used_vehicle.request.review_started.v1
used_vehicle.request.unavailable.v1
used_vehicle.offer.published.v1
used_vehicle.offer.superseded.v1
used_vehicle.offer.accepted.v1
used_vehicle.offer.declined.v1
used_vehicle.deposit.settled.v1
used_vehicle.inspection.scheduled.v1
used_vehicle.inspection.report_published.v1
used_vehicle.inspection.accepted.v1
used_vehicle.inspection.rejected.v1
used_vehicle.balance.settled.v1
used_vehicle.purchase.finalized.v1
used_vehicle.refund.requested.v1
used_vehicle.refund.settled.v1
```

Projection مشتری فقط وضعیت، قیمت/شرایط عمومی، تعهد پرداخت، خلاصه کارشناسی و token رسانه را دریافت می‌کند. CIF، cost basis، سود، FX، تأمین‌کننده، یادداشت داخلی و VIN پیشنهادی ممنوع‌اند.

## ۸. ادامه فرایند پس از پرداخت کامل

سامانه فعلی بخش بزرگی از ستون فقرات عملیات را دارد: `import_process_case`، `vehicle_sales_projection`، رویدادها و Milestoneهای حمل، `customs_case`، `vehicle_exit` و `logistics_handover`. این APIها داخلی‌اند و به علت داشتن تمام VINهای محموله، فورواردر، مکان عملیاتی و جزئیات گمرک نباید مستقیماً در اختیار پرتال قرار گیرند.

موارد جدید الزامی:

- `customer_vehicle_entitlement` برای اتصال قطعی مشتری، سفارش و خودرو با وضعیت `PENDING_ALLOCATION / FINAL_ALLOCATED / REVOKED / DELIVERED`
- Outbox/Inbox پایدار و Customer Projector مستقل؛ `audit_event` و `workflow_command` جای Outbox نیستند
- Read Modelهای `customer_vehicle_journey`، `customer_vehicle_journey_event` و `customer_vehicle_milestone`
- Event نسخه‌دار برای Transitionهای گمرک، خروج، لجستیک، PDI و تحویل
- ETA و SLA عمومی برای ترخیص، لجستیک، PDI و تحویل؛ سامانه فعلی عمدتاً ETA حمل دارد
- `pdi_inspection` ساختاریافته با چک‌لیست، Revision، اقدام اصلاحی و گزارش قابل انتشار
- `delivery_appointment`، انتخاب بازه تحویل، OTP تحویل‌گیرنده، صورت‌جلسه و Proof of Delivery
- مسیر نهایی `READY_FOR_DELIVERY → DELIVERY_SCHEDULED → HANDED_OVER → DELIVERED`

نگاشت Customer Journey، قواعد Polling و فهرست کامل داده‌های ممنوع در سند `LIVE-VEHICLE-JOURNEY.fa.md` آمده است.

## تصمیم‌های کسب‌وکاری قبل از Production

1. بازگشت‌پذیری بیعانه در رد کارشناسی، عدم تأمین و انصراف مشتری
2. مدت اعتبار Offer، رزرو، تصمیم گزارش و پرداخت مانده
3. سقف/شرط اصلاح قیمت بعد از بیعانه و حق لغو مشتری
4. مسیر پیشنهاد خودروی جایگزین
5. انتخاب درگاه و امکان پرداخت چندتراکنشی برای مبالغ بالا
6. اجزای دقیق قیمت قابل پرداخت مشتری
7. قاعده VIN داخل Certificate Report پیش از تخصیص قطعی
8. سطح موقعیت قابل انتشار در هر مرحله و Templateهای مجاز علت تأخیر
9. نقطه شروع ETA تحویل و مسئول تأیید تغییر بازه
10. شعب/مراکز مجاز تحویل، قاعده تعیین نوبت و روش اثبات تحویل
