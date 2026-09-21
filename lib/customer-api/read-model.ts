import "server-only";

import type { ListingKind, MarketplaceListing } from "./contracts";

type InternalMarketplaceProjection = MarketplaceListing & {
  publicationState: "PUBLISHED" | "DRAFT";
  catalogReviewState?: "APPROVED" | "PENDING" | "REJECTED";
  eligibleCustomerIds: string[] | "ALL_REGISTERED_CUSTOMERS";
};

const listings: InternalMarketplaceProjection[] = [
  {
    id: "lst_plan_01HMEHRX7",
    kind: "SALES_PLAN",
    title: "کراس‌اوور X7",
    trim: "نسخه پریمیوم",
    modelYear: 1405,
    imageUrl: "/vehicles/plan-crossover.png",
    gallery: ["/vehicles/plan-crossover.png"],
    hasVideo: false,
    price: { amount: "38900000000", currency: "IRR", displayLabel: "۳٬۸۹۰٬۰۰۰٬۰۰۰ تومان" },
    availability: "AVAILABLE",
    availabilityLabel: "قابل درخواست",
    primaryActionLabel: "مشاهده شرایط",
    deliveryWindow: "تحویل تقریبی ۹۰ روزه",
    registrationDeadline: "تا ۲۵ شهریور ۱۴۰۵",
    purchaseMethod: "فروش نقدی با دو مرحله پرداخت",
    specs: [
      { label: "گیربکس", value: "اتوماتیک" },
      { label: "پیشرانه", value: "۱.۵ لیتری توربو" },
      { label: "رنگ‌های قابل انتخاب", value: "سفید، خاکستری، مشکی" },
    ],
    features: ["سامانه کنترل پایداری", "دوربین ۳۶۰ درجه", "شش کیسه هوا", "سقف پانوراما"],
    description: "نمونه نمایشی یک طرح فروش فعال؛ شرایط نهایی و ظرفیت فقط از خروجی قابل انتشار سامانه دریافت می‌شود.",
    terms: ["ثبت درخواست به‌معنای انعقاد قرارداد قطعی نیست.", "موعد تحویل تقریبی است و در قرارداد نهایی تثبیت می‌شود."],
    publicationState: "PUBLISHED",
    eligibleCustomerIds: "ALL_REGISTERED_CUSTOMERS",
  },
  {
    id: "lst_plan_02HMEHRS5",
    kind: "SALES_PLAN",
    title: "سدان S5",
    trim: "نسخه استاندارد",
    modelYear: 1405,
    imageUrl: "/vehicles/verified-used-sedan.png",
    gallery: ["/vehicles/verified-used-sedan.png"],
    hasVideo: false,
    price: { amount: "27500000000", currency: "IRR", displayLabel: "۲٬۷۵۰٬۰۰۰٬۰۰۰ تومان" },
    availability: "LIMITED",
    availabilityLabel: "ظرفیت محدود",
    primaryActionLabel: "مشاهده شرایط",
    deliveryWindow: "تحویل تقریبی ۶۰ روزه",
    registrationDeadline: "تا تکمیل ظرفیت",
    purchaseMethod: "فروش نقدی",
    specs: [
      { label: "گیربکس", value: "اتوماتیک" },
      { label: "پیشرانه", value: "۱.۵ لیتری" },
      { label: "رنگ‌های قابل انتخاب", value: "سفید، مشکی" },
    ],
    features: ["کروز کنترل", "نمایشگر مرکزی", "تهویه اتوماتیک", "سنسور پارک"],
    description: "نمونه نمایشی طرح فروش با ظرفیت محدود و اطلاعات عمومی مشتری‌پسند.",
    terms: ["ظرفیت پس از کنترل سمت سرور قطعی می‌شود.", "قیمت نمایش‌داده‌شده باید نسخه منتشرشده سامانه باشد."],
    publicationState: "PUBLISHED",
    eligibleCustomerIds: "ALL_REGISTERED_CUSTOMERS",
  },
  {
    id: "lst_used_01HMEHR",
    kind: "USED_SUPPLY",
    title: "سدان S5",
    trim: "درخواست تأمین نسخه اتوماتیک",
    modelYear: 1402,
    imageUrl: "/vehicles/verified-used-sedan.png",
    gallery: ["/vehicles/verified-used-sedan.png"],
    hasVideo: false,
    price: { amount: null, currency: "IRR", displayLabel: "پس از تأیید مدیر تأمین" },
    availability: "AVAILABLE",
    availabilityLabel: "قابل درخواست تأمین",
    primaryActionLabel: "ثبت درخواست تأمین",
    usedSupply: {
      depositAmount: { amount: "2000000000", currency: "IRR", displayLabel: "۲۰۰٬۰۰۰٬۰۰۰ تومان" },
      offerNotice: "قیمت و شرایط قطعی پس از تأیید موجودی توسط مدیر تأمین ارائه می‌شود.",
      inspectionNotice: "پس از پرداخت بیعانه، خودرو در مبدا توسط کارشناس مهر بررسی می‌شود.",
    },
    specs: [
      { label: "گیربکس", value: "اتوماتیک" },
      { label: "سوخت", value: "بنزینی" },
      { label: "رنگ", value: "خاکستری" },
    ],
    features: ["بررسی موجودی توسط مدیر تأمین", "پیشنهاد نسخه‌دار قیمت و شرایط", "کارشناسی در مبدا", "پرداخت آنلاین پس از تأیید"],
    description: "با ثبت این درخواست، مدیر تأمین وجود خودروی مناسب را بررسی و قیمت و شرایط قطعی را برای تصمیم شما ارسال می‌کند.",
    terms: ["ثبت درخواست تعهد خرید ایجاد نمی‌کند.", "بیعانه فقط پس از مشاهده و تأیید آخرین نسخه پیشنهاد پرداخت می‌شود."],
    publicationState: "PUBLISHED",
    catalogReviewState: "APPROVED",
    eligibleCustomerIds: "ALL_REGISTERED_CUSTOMERS",
  },
  {
    id: "lst_used_02HMEHR",
    kind: "USED_SUPPLY",
    title: "کراس‌اوور X7",
    trim: "درخواست تأمین نسخه پریمیوم",
    modelYear: 1401,
    imageUrl: "/vehicles/plan-crossover.png",
    gallery: ["/vehicles/plan-crossover.png"],
    hasVideo: false,
    price: { amount: null, currency: "IRR", displayLabel: "پس از تأیید مدیر تأمین" },
    availability: "LIMITED",
    availabilityLabel: "قابل درخواست تأمین",
    primaryActionLabel: "ثبت درخواست تأمین",
    usedSupply: {
      depositAmount: { amount: "2000000000", currency: "IRR", displayLabel: "۲۰۰٬۰۰۰٬۰۰۰ تومان" },
      offerNotice: "مدیر تأمین پس از تأیید خودرو، قیمت و شرایط پیشنهادی را منتشر می‌کند.",
      inspectionNotice: "کارشناسی و سرتیفیکیت ریپورت پس از پرداخت بیعانه در پرونده قرار می‌گیرد.",
    },
    specs: [
      { label: "گیربکس", value: "اتوماتیک" },
      { label: "سوخت", value: "بنزینی" },
      { label: "رنگ", value: "قرمز" },
    ],
    features: ["تأیید وجود خودرو", "امکان اصلاح پیشنهاد توسط مدیر تأمین", "گزارش کارشناسی مهر", "سرتیفیکیت ریپورت خودرو"],
    description: "درخواست شما برای یافتن نمونه مناسب این خودرو به مدیر تأمین ارجاع می‌شود و تصمیم‌های بعدی در همین پرونده انجام خواهد شد.",
    terms: ["قیمت اولیه در کارت قطعی نیست و پیشنهاد نهایی نسخه‌دار است.", "پس از کارشناسی، تأیید خودرو و پرداخت مانده کاملاً در اختیار مشتری است."],
    publicationState: "PUBLISHED",
    catalogReviewState: "APPROVED",
    eligibleCustomerIds: "ALL_REGISTERED_CUSTOMERS",
  },
  {
    id: "lst_used_hidden",
    kind: "USED_SUPPLY",
    title: "خودروی در انتظار تأیید",
    trim: "نمایش ممنوع",
    modelYear: 1403,
    imageUrl: "/vehicles/verified-used-sedan.png",
    gallery: [],
    hasVideo: false,
    price: { amount: null, currency: "IRR", displayLabel: "در انتظار اعلام" },
    availability: "CLOSED",
    availabilityLabel: "منتشر نشده",
    primaryActionLabel: "",
    specs: [],
    features: [],
    description: "این رکورد باید پشت مرز انتشار حذف شود.",
    terms: [],
    publicationState: "DRAFT",
    catalogReviewState: "PENDING",
    eligibleCustomerIds: [],
  },
];

function isPublishable(listing: InternalMarketplaceProjection, customerId: string) {
  const customerCanSeeListing =
    listing.eligibleCustomerIds === "ALL_REGISTERED_CUSTOMERS" ||
    listing.eligibleCustomerIds.includes(customerId);
  const usedCatalogIsApproved =
    listing.kind !== "USED_SUPPLY" || listing.catalogReviewState === "APPROVED";

  return listing.publicationState === "PUBLISHED" && customerCanSeeListing && usedCatalogIsApproved;
}

function toCustomerContract(listing: InternalMarketplaceProjection): MarketplaceListing {
  // Deliberate field-by-field allowlist. Adding an internal field cannot make it
  // cross the customer boundary by accident.
  return {
    id: listing.id,
    kind: listing.kind,
    title: listing.title,
    trim: listing.trim,
    modelYear: listing.modelYear,
    imageUrl: listing.imageUrl,
    gallery: [...listing.gallery],
    hasVideo: listing.hasVideo,
    price: { ...listing.price },
    availability: listing.availability,
    availabilityLabel: listing.availabilityLabel,
    primaryActionLabel: listing.primaryActionLabel,
    ...(listing.locationLabel ? { locationLabel: listing.locationLabel } : {}),
    ...(listing.mileageKm !== undefined ? { mileageKm: listing.mileageKm } : {}),
    ...(listing.deliveryWindow ? { deliveryWindow: listing.deliveryWindow } : {}),
    ...(listing.registrationDeadline ? { registrationDeadline: listing.registrationDeadline } : {}),
    ...(listing.purchaseMethod ? { purchaseMethod: listing.purchaseMethod } : {}),
    ...(listing.verification ? { verification: { ...listing.verification } } : {}),
    ...(listing.usedSupply ? {
      usedSupply: {
        depositAmount: { ...listing.usedSupply.depositAmount },
        offerNotice: listing.usedSupply.offerNotice,
        inspectionNotice: listing.usedSupply.inspectionNotice,
      },
    } : {}),
    specs: listing.specs.map((spec) => ({ ...spec })),
    features: [...listing.features],
    description: listing.description,
    terms: [...listing.terms],
  };
}

export function listMarketplaceListings(customerId: string, kind?: ListingKind) {
  return listings
    .filter((listing) => isPublishable(listing, customerId))
    .filter((listing) => !kind || listing.kind === kind)
    .map(toCustomerContract);
}

export function getMarketplaceListing(customerId: string, listingId: string) {
  const listing = listings.find((candidate) => candidate.id === listingId);
  if (!listing || !isPublishable(listing, customerId)) return null;
  return toCustomerContract(listing);
}
