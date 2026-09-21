# نگاشت سامانه داخلی به Marketplace مشتری

مبنای خواندنی این پروژه به‌صورت remote محلی زیر ثبت شده است:

```text
system-readonly/main → mehr-vehicle-supply-platform
push URL             → DISABLED
```

نسخه مرجع اتصال لوکال در شاخه مستقل `codex/customer-marketplace-local` نگهداری می‌شود. سرویس فعال محلی در `127.0.0.1:3000` نیز همان projection را اجرا می‌کند؛ هیچ انتشار عمومی انجام نشده است.

## نگاشت طرح فروش

| منبع سامانه | مقصد Customer Read Model | قاعده |
|---|---|---|
| `vehicle_models` | عنوان، برند، مدل، تیپ، بدنه، سال، سوخت، گیربکس، رنگ | فقط رکورد کامل و فعال |
| `sales_plans` | عنوان و وضعیت طرح، شروع و موعد تحویل | فقط نسخه تأیید و منتشرشده |
| `sales_plan_lines` | قیمت مشتری، پیش‌پرداخت/اقساط، نسخه و رنگ | پول خروجی فقط IRR و رشته عددی |
| ETA تأییدشده | `deliveryWindow` | به عبارت تقریبی مشتری‌پسند تبدیل شود |
| Snapshot قیمت | `price` | فقط جمع نهایی منتشرشده؛ اجزای قیمت حذف شوند |

فیلدهای `exchangeRate`، `region`، `naturalKey`، `pricingKeyId`، `revision` و تعداد دقیق/VIN-count از endpoint فعلی `sales-basket` وارد قرارداد مشتری نمی‌شوند.

## نگاشت خودروی کارکرده

منبع فعلی `used_car_market_listing` است، اما endpoint کارکنان Proxy نمی‌شود. مسیر اختصاصی لوکال زیر یک projection سفید‌لیست‌شده می‌سازد:

```text
GET /api/integrations/customer-marketplace/v1/listings?kind=USED_SUPPLY
GET /api/integrations/customer-marketplace/v1/listings/{publicListingId}
```

شرایط منبع: رکورد فعال، `saleApproval.state=APPROVED`، منبع حذف‌نشده، بدون نیاز به بازبینی و قیمت نهایی مثبت. این تأیید فقط «تأیید قیمت فروش» است؛ موجودی قطعی یا کارشناسی فنی مهر محسوب نمی‌شود.

خروجی شامل شناسه عمومی هش‌شده، برند، مدل، تیپ، سال، رنگ، کارکرد، حجم موتور، سوخت، مشخصات بازار، قیمت فعلی مشتری و مبلغ بیعانه است. `CIF`، قیمت خرید، سود، نرخ ارز، منبع/URL آگهی، منطقه داخلی، پلاک، یادداشت، تأییدکننده و کل JSON محاسبات هرگز وارد DTO نمی‌شوند.

در حالت توسعه لوکال، فعال‌شدن `MEHR_CUSTOMER_MARKETPLACE_LOCAL_PUBLISH_PRICE_APPROVED=1` مجوز صریح نمایش همین فهرست روی دستگاه است. برای محیط واقعی این جایگزین چرخه `Marketing PRODUCT APPROVED + healthy source` نیست و flag نباید فعال شود. تصویر منبع نیز تا تعیین حق بازنشر عبور نمی‌کند و وب‌اپ تصویر عمومی جایگزین نشان می‌دهد.

## روش فعال‌سازی اتصال

وب‌اپ فقط متغیرهای server-only زیر را می‌خواند:

```text
MEHR_MARKETPLACE_READ_API_URL
MEHR_MARKETPLACE_READ_API_TOKEN
MEHR_MARKETPLACE_READ_API_TOKEN_FILE
```

در اتصال فعلی، URL روی `http://127.0.0.1:3000/api/integrations/customer-marketplace` است و وب‌اپ توکن چرخشی فقط‌خواندن را از فایل امن و جداگانه `customer-marketplace-read.env` می‌خواند؛ این فایل حاوی توکن سرویس قیمت‌گذاری نیست و توکن وارد مرورگر، bundle یا localStorage نمی‌شود. در توسعه و نبود تمام تنظیمات، Read Model نمایشی فعال است. اگر بخشی از تنظیمات upstream وجود داشته باشد اما اتصال معتبر نباشد، پاسخ HTTP 503 است و fallback نمایشی رخ نمی‌دهد.
