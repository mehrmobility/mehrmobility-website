import "server-only";

import type {
  MarketplaceListing,
  Money,
  PublicInspection,
  PublicOffer,
  PublicVehicleJourney,
  RequiredPurchaseAction,
  UsedPurchaseStatus,
  UsedVehiclePurchaseCase,
} from "./contracts";

type InternalPurchaseCase = UsedVehiclePurchaseCase & {
  customerId: string;
  inspectionReadyAt?: number;
};

export class WorkflowError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

const cases = new Map<string, InternalPurchaseCase>();

function tomanLabel(irr: string) {
  return `${new Intl.NumberFormat("fa-IR").format(Number(BigInt(irr) / BigInt(10)))} تومان`;
}

function money(amount: string): Money {
  return { amount, currency: "IRR", displayLabel: tomanLabel(amount) };
}

function now() {
  return new Date().toISOString();
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60_000).toISOString().slice(0, 10);
}

function initialVehicleJourney(): PublicVehicleJourney {
  const confirmedAt = now();
  return {
    schemaVersion: 1,
    version: 1,
    overall: {
      status: "IN_PROGRESS",
      currentPhase: "ORIGIN_PREPARATION",
      headline: "خرید قطعی شد؛ خودرو برای سفر آماده می‌شود",
      description: "تیم مهر تثبیت خرید و مدارک لازم برای آماده‌سازی خودرو در مبدا را پیگیری می‌کند.",
      progress: { completedMilestones: 2, totalMilestones: 16, displayPercent: 13, basis: "PUBLISHED_MILESTONES", isEstimate: true },
      deliveryEta: { earliestDate: daysFromNow(24), latestDate: daysFromNow(34), confidence: "LOW", asOf: confirmedAt },
    },
    phases: [
      { code: "PURCHASE", title: "خرید و تثبیت سفارش", shortTitle: "خرید", status: "COMPLETED", completedMilestones: 2, totalMilestones: 2, completedAt: confirmedAt },
      { code: "ORIGIN_PREPARATION", title: "آماده‌سازی در مبدا", shortTitle: "آماده‌سازی", status: "IN_PROGRESS", completedMilestones: 0, totalMilestones: 2, publicMessage: "خودرو و مدارک خروج در حال آماده‌سازی هستند." },
      { code: "INTERNATIONAL_TRANSPORT", title: "حمل بین‌المللی", shortTitle: "حمل", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 3 },
      { code: "IMPORT_CLEARANCE", title: "واردات و ترخیص", shortTitle: "ترخیص", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 3 },
      { code: "DOMESTIC_LOGISTICS", title: "لجستیک داخل کشور", shortTitle: "لجستیک", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 2 },
      { code: "DELIVERY_PREPARATION", title: "کنترل نهایی و مدارک", shortTitle: "PDI", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 2 },
      { code: "HANDOVER", title: "تحویل خودرو", shortTitle: "تحویل", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 2 },
    ],
    latestEvent: {
      id: `pevt_${crypto.randomUUID()}`,
      sequence: 1,
      phase: "PURCHASE",
      occurredAt: confirmedAt,
      publishedAt: confirmedAt,
      title: "پرداخت کامل تأیید شد",
      message: "فرایند خرید و آماده‌سازی خودروی شما آغاز شده است.",
      confirmation: "CONFIRMED",
    },
    nextMilestone: { title: "تکمیل آماده‌سازی مبدا", description: "پس از تأیید آماده‌بودن خودرو، برنامه حمل در همین صفحه نمایش داده می‌شود." },
    achievements: [
      { code: "PURCHASE_CONFIRMED", label: "خرید قطعی", description: "تسویه و تثبیت سفارش انجام شد.", unlockedAt: confirmedAt },
      { code: "READY_TO_TRAVEL", label: "آماده سفر", description: "خودرو برای خروج از مبدا آماده شد." },
      { code: "ARRIVED_IN_COUNTRY", label: "به ایران رسید", description: "ورود خودرو به کشور تأیید شد." },
      { code: "CUSTOMS_RELEASED", label: "عبور از گمرک", description: "مجوز خروج گمرکی صادر شد." },
      { code: "READY_TO_MEET", label: "آماده ملاقات", description: "خودرو برای تحویل نهایی آماده است." },
    ],
    artifacts: { documentsAvailable: 2, mediaAvailable: 1 },
    sync: { nextPollAfterSeconds: 30, lastConfirmedAt: confirmedAt },
  };
}

function demoVehicleJourney(): PublicVehicleJourney {
  const lastConfirmedAt = minutesAgo(18);
  const purchaseAt = minutesAgo(10 * 24 * 60);
  const originReadyAt = minutesAgo(8 * 24 * 60);
  const arrivalAt = minutesAgo(17 * 60);
  return {
    schemaVersion: 1,
    version: 12,
    overall: {
      status: "IN_PROGRESS",
      currentPhase: "IMPORT_CLEARANCE",
      headline: "تشریفات ترخیص خودروی شما در حال انجام است",
      description: "ورود خودرو به کشور تأیید شده و پرونده در مرحله تکمیل تشریفات قانونی قرار دارد.",
      progress: { completedMilestones: 9, totalMilestones: 16, displayPercent: 56, basis: "PUBLISHED_MILESTONES", isEstimate: true },
      deliveryEta: { earliestDate: daysFromNow(24), latestDate: daysFromNow(30), confidence: "MEDIUM", asOf: lastConfirmedAt },
    },
    phases: [
      { code: "PURCHASE", title: "خرید و تثبیت سفارش", shortTitle: "خرید", status: "COMPLETED", completedMilestones: 2, totalMilestones: 2, completedAt: purchaseAt },
      { code: "ORIGIN_PREPARATION", title: "آماده‌سازی در مبدا", shortTitle: "آماده‌سازی", status: "COMPLETED", completedMilestones: 2, totalMilestones: 2, completedAt: originReadyAt },
      { code: "INTERNATIONAL_TRANSPORT", title: "حمل بین‌المللی", shortTitle: "حمل", status: "COMPLETED", completedMilestones: 3, totalMilestones: 3, completedAt: arrivalAt },
      { code: "IMPORT_CLEARANCE", title: "واردات و ترخیص", shortTitle: "ترخیص", status: "IN_PROGRESS", completedMilestones: 2, totalMilestones: 3, publicMessage: "پرونده واردات تشکیل شده و تشریفات گمرکی در حال انجام است." },
      { code: "DOMESTIC_LOGISTICS", title: "لجستیک داخل کشور", shortTitle: "لجستیک", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 2 },
      { code: "DELIVERY_PREPARATION", title: "کنترل نهایی و مدارک", shortTitle: "PDI", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 2 },
      { code: "HANDOVER", title: "تحویل خودرو", shortTitle: "تحویل", status: "NOT_STARTED", completedMilestones: 0, totalMilestones: 2 },
    ],
    latestEvent: {
      id: "pevt_demo_customs_started",
      sequence: 128,
      phase: "IMPORT_CLEARANCE",
      occurredAt: minutesAgo(24),
      publishedAt: lastConfirmedAt,
      title: "تشریفات گمرکی آغاز شد",
      message: "پرونده واردات پذیرفته شده و مراحل قانونی ترخیص در جریان است.",
      confirmation: "CONFIRMED",
    },
    nextMilestone: { title: "صدور مجوز خروج گمرکی", description: "به محض تأیید ترخیص، برنامه حمل داخلی خودرو فعال می‌شود." },
    location: { label: "در حال انجام تشریفات گمرکی", granularity: "NOT_SHARED", isLive: false, asOf: lastConfirmedAt },
    achievements: [
      { code: "PURCHASE_CONFIRMED", label: "خرید قطعی", description: "تسویه و تثبیت سفارش انجام شد.", unlockedAt: purchaseAt },
      { code: "READY_TO_TRAVEL", label: "آماده سفر", description: "خودرو برای خروج از مبدا آماده شد.", unlockedAt: originReadyAt },
      { code: "ARRIVED_IN_COUNTRY", label: "به ایران رسید", description: "ورود خودرو به کشور تأیید شد.", unlockedAt: arrivalAt },
      { code: "CUSTOMS_RELEASED", label: "عبور از گمرک", description: "مجوز خروج گمرکی صادر شد." },
      { code: "READY_TO_MEET", label: "آماده ملاقات", description: "خودرو برای تحویل نهایی آماده است." },
    ],
    artifacts: { documentsAvailable: 4, mediaAvailable: 2 },
    sync: { nextPollAfterSeconds: 30, lastConfirmedAt },
  };
}

function status(
  code: UsedPurchaseStatus,
  label: string,
  description: string,
  action: RequiredPurchaseAction,
  dueAt?: string,
) {
  return {
    publicStatus: { code, label, description },
    requiredAction: { type: action, ...(dueAt ? { dueAt } : {}) },
  };
}

function seedDemoCase() {
  if (!cases.has("pcase_demo_offer_01")) {
    const totalPrice = money("29400000000");
    const depositAmount = money("2000000000");
    const balanceAmount = money((BigInt(totalPrice.amount ?? "0") - BigInt(depositAmount.amount ?? "0")).toString());
    const offer: PublicOffer = {
      id: "offer_public_demo_02",
      revision: 2,
      totalPrice,
      previousTotalPrice: money("28900000000"),
      depositAmount,
      balanceAmount,
      terms: [
        { code: "VEHICLE", title: "خودروی تأییدشده برای پیشنهاد", value: "کراس‌اوور X7، مدل ۱۴۰۱، کارکرد حداکثر ۵۵ هزار کیلومتر" },
        { code: "DELIVERY", title: "شرط تحویل", value: "تحویل پس از کارشناسی، تسویه کامل و تکمیل اسناد" },
        { code: "INSPECTION", title: "شرط کارشناسی", value: "ادامه خرید منوط به تأیید گزارش کارشناسی و سرتیفیکیت ریپورت توسط شماست" },
      ],
      changesFromPrevious: ["قیمت پیشنهادی ۵۰ میلیون تومان افزایش یافته است.", "مهلت پرداخت بیعانه پس از پذیرش به ۲۴ ساعت افزایش یافته است."],
      expiresAt: "2026-09-14T14:30:00.000Z",
    };

    cases.set("pcase_demo_offer_01", {
      id: "pcase_demo_offer_01",
      customerId: "cus_demo_001",
      version: 4,
      trackingCode: "MEHR-UV-1405012",
      ...status("OFFER_PENDING", "پیشنهاد جدید آماده بررسی است", "مدیر تأمین وجود خودرو را تأیید و نسخه دوم قیمت و شرایط را ارسال کرده است.", "REVIEW_OFFER", offer.expiresAt),
      vehicle: {
        listingId: "lst_used_02HMEHR",
        title: "کراس‌اوور X7",
        trim: "نسخه پریمیوم",
        modelYear: 1401,
        imageUrl: "/vehicles/plan-crossover.png",
        vinPublicationStatus: "PENDING_FINAL_ASSIGNMENT",
      },
      offer,
      deposit: { kind: "DEPOSIT", status: "NOT_CREATED", amount: depositAmount },
      inspection: { status: "NOT_SCHEDULED" },
      balance: { kind: "BALANCE", status: "NOT_CREATED", amount: balanceAmount },
      cancellation: { allowed: true, policySummary: "پیش از پرداخت بیعانه، انصراف بدون عملیات مالی انجام می‌شود." },
      timeline: [
        { code: "SUBMITTED", label: "درخواست تأمین ثبت شد", occurredAt: minutesAgo(8 * 60) },
        { code: "SUPPLY_REVIEW", label: "بررسی مدیر تأمین آغاز شد", occurredAt: minutesAgo(7 * 60) },
        { code: "OFFER_REVISION_1", label: "پیشنهاد اولیه منتشر شد", occurredAt: minutesAgo(4 * 60) },
        { code: "OFFER_REVISION_2", label: "نسخه جدید قیمت و شرایط ارسال شد", occurredAt: minutesAgo(3 * 60) },
      ],
      updatedAt: minutesAgo(3 * 60),
    });
  }

  if (!cases.has("pcase_demo_journey_01")) {
    const journey = demoVehicleJourney();
    const totalPrice = money("24800000000");
    const depositAmount = money("2000000000");
    const balanceAmount = money("22800000000");
    const purchaseAt = minutesAgo(10 * 24 * 60);
    const report = {
      ...inspectionReport(minutesAgo(11 * 24 * 60)),
      id: "report_public_demo_journey_01",
      certificateReference: "CERT-UV-1405-0142",
    };
    const offer: PublicOffer = {
      id: "offer_public_demo_journey_01",
      revision: 1,
      totalPrice,
      depositAmount,
      balanceAmount,
      terms: [
        { code: "VEHICLE", title: "خودروی خریداری‌شده", value: "سدان S5، مدل ۱۴۰۲" },
        { code: "DELIVERY", title: "فرایند تحویل", value: "پس از واردات، ترخیص، لجستیک داخلی و کنترل نهایی مهر" },
      ],
      changesFromPrevious: [],
      expiresAt: minutesAgo(12 * 24 * 60),
    };
    const lastConfirmedAt = journey.sync.lastConfirmedAt;

    cases.set("pcase_demo_journey_01", {
      id: "pcase_demo_journey_01",
      customerId: "cus_demo_001",
      version: 24,
      trackingCode: "MEHR-UV-1404971",
      ...status("FINALIZING", "تشریفات ترخیص در حال انجام است", "آخرین وضعیت تأییدشده خودرو از مسیر امن سامانه مهر دریافت شده است.", "NONE"),
      vehicle: {
        listingId: "lst_used_01HMEHR",
        title: "سدان S5",
        trim: "نسخه اتوماتیک",
        modelYear: 1402,
        imageUrl: "/vehicles/verified-used-sedan.png",
        vinPublicationStatus: "PENDING_FINAL_ASSIGNMENT",
      },
      offer,
      deposit: { kind: "DEPOSIT", status: "PAID", amount: depositAmount, paidAt: minutesAgo(11 * 24 * 60), receiptNumber: "PAY-DEMO-DEPOSIT" },
      inspection: { status: "CUSTOMER_ACCEPTED", report },
      balance: { kind: "BALANCE", status: "PAID", amount: balanceAmount, paidAt: purchaseAt, receiptNumber: "PAY-DEMO-BALANCE" },
      journey,
      cancellation: { allowed: false, policySummary: "پس از خرید قطعی، هر تغییر نیازمند بررسی مالی و حقوقی است." },
      timeline: [
        { code: "SUBMITTED", label: "درخواست تأمین ثبت شد", occurredAt: minutesAgo(14 * 24 * 60) },
        { code: "OFFER_ACCEPTED", label: "پیشنهاد قیمت و شرایط تأیید شد", occurredAt: minutesAgo(12 * 24 * 60) },
        { code: "DEPOSIT_SETTLED", label: "بیعانه دریافت شد", occurredAt: minutesAgo(11 * 24 * 60) },
        { code: "INSPECTION_ACCEPTED", label: "گزارش کارشناسی تأیید شد", occurredAt: minutesAgo(10 * 24 * 60 + 90) },
        { code: "BALANCE_SETTLED", label: "مانده قیمت خودرو پرداخت شد", occurredAt: purchaseAt },
        { code: "PURCHASE_CONFIRMED", label: "خرید خودرو نهایی شد", occurredAt: purchaseAt },
        { code: "ORIGIN_READY", label: "خودرو در مبدا آماده ارسال شد", occurredAt: minutesAgo(8 * 24 * 60) },
        { code: "INTERNATIONAL_DISPATCHED", label: "حمل بین‌المللی خودرو آغاز شد", occurredAt: minutesAgo(7 * 24 * 60) },
        { code: "ARRIVED_IN_COUNTRY", label: "ورود خودرو به کشور تأیید شد", occurredAt: minutesAgo(17 * 60) },
        { code: "IMPORT_CASE_ACCEPTED", label: "پرونده واردات تشکیل شد", occurredAt: minutesAgo(3 * 60) },
        { code: "CUSTOMS_STARTED", label: "تشریفات گمرکی آغاز شد", occurredAt: lastConfirmedAt },
      ],
      updatedAt: lastConfirmedAt,
    });
  }
}

function inspectionReport(publishedAt = now()): NonNullable<PublicInspection["report"]> {
  return {
    id: "report_public_demo_01",
    version: 1,
    overallResult: "CONDITIONAL",
    score: 91,
    summary: "خودرو از نظر فنی قابل تأیید است؛ دو مورد جزئی بدنه در گزارش ثبت شده و مانع استفاده ایمن نیست.",
    items: [
      { category: "موتور و گیربکس", result: "عملکرد عادی و بدون نشتی مؤثر", severity: "INFO" },
      { category: "بدنه", result: "ترمیم جزئی گلگیر عقب راست", severity: "MINOR" },
      { category: "ایمنی", result: "کیسه‌های هوا و سامانه ترمز تأیید شد", severity: "INFO" },
      { category: "تایرها", result: "تعویض دو حلقه طی شش ماه آینده پیشنهاد می‌شود", severity: "MINOR" },
    ],
    expertReportLabel: "گزارش کارشناسی فنی و بدنه مهر",
    certificateReportLabel: "سرتیفیکیت ریپورت خودرو",
    vehicleVideoLabel: "ویدئوی خودروی کارشناسی‌شده",
    certificateReference: "CERT-UV-1405-0198",
    publishedAt,
  };
}

function publishInspectionIfReady(purchaseCase: InternalPurchaseCase) {
  if (
    purchaseCase.publicStatus.code === "INSPECTION_IN_PROGRESS" &&
    purchaseCase.inspectionReadyAt &&
    Date.now() >= purchaseCase.inspectionReadyAt
  ) {
    Object.assign(purchaseCase, status(
      "INSPECTION_DECISION_DUE",
      "گزارش کارشناسی آماده بررسی است",
      "گزارش کارشناس مهر و سرتیفیکیت ریپورت خودرو را بررسی و تصمیم خود را ثبت کنید.",
      "REVIEW_INSPECTION",
      new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    ));
    purchaseCase.inspection = { status: "REPORT_PUBLISHED", report: inspectionReport() };
    purchaseCase.timeline.push({ code: "INSPECTION_REPORT_PUBLISHED", label: "گزارش کارشناسی و سرتیفیکیت منتشر شد", occurredAt: now() });
    purchaseCase.version += 1;
    purchaseCase.updatedAt = now();
    delete purchaseCase.inspectionReadyAt;
  }
}

function toPublicCase(purchaseCase: InternalPurchaseCase): UsedVehiclePurchaseCase {
  publishInspectionIfReady(purchaseCase);
  return {
    id: purchaseCase.id,
    version: purchaseCase.version,
    trackingCode: purchaseCase.trackingCode,
    publicStatus: { ...purchaseCase.publicStatus },
    requiredAction: { ...purchaseCase.requiredAction },
    vehicle: { ...purchaseCase.vehicle },
    ...(purchaseCase.offer ? {
      offer: {
        ...purchaseCase.offer,
        totalPrice: { ...purchaseCase.offer.totalPrice },
        ...(purchaseCase.offer.previousTotalPrice ? { previousTotalPrice: { ...purchaseCase.offer.previousTotalPrice } } : {}),
        depositAmount: { ...purchaseCase.offer.depositAmount },
        balanceAmount: { ...purchaseCase.offer.balanceAmount },
        terms: purchaseCase.offer.terms.map((term) => ({ ...term })),
        changesFromPrevious: [...purchaseCase.offer.changesFromPrevious],
      },
    } : {}),
    deposit: { ...purchaseCase.deposit, ...(purchaseCase.deposit.amount ? { amount: { ...purchaseCase.deposit.amount } } : {}) },
    inspection: {
      status: purchaseCase.inspection.status,
      ...(purchaseCase.inspection.report ? {
        report: {
          ...purchaseCase.inspection.report,
          items: purchaseCase.inspection.report.items.map((item) => ({ ...item })),
        },
      } : {}),
    },
    balance: { ...purchaseCase.balance, ...(purchaseCase.balance.amount ? { amount: { ...purchaseCase.balance.amount } } : {}) },
    ...(purchaseCase.journey ? {
      journey: {
        schemaVersion: purchaseCase.journey.schemaVersion,
        version: purchaseCase.journey.version,
        overall: {
          ...purchaseCase.journey.overall,
          progress: { ...purchaseCase.journey.overall.progress },
          ...(purchaseCase.journey.overall.deliveryEta ? { deliveryEta: { ...purchaseCase.journey.overall.deliveryEta } } : {}),
        },
        phases: purchaseCase.journey.phases.map((phase) => ({ ...phase })),
        latestEvent: { ...purchaseCase.journey.latestEvent },
        nextMilestone: { ...purchaseCase.journey.nextMilestone },
        ...(purchaseCase.journey.location ? { location: { ...purchaseCase.journey.location } } : {}),
        ...(purchaseCase.journey.delay ? { delay: { ...purchaseCase.journey.delay } } : {}),
        achievements: purchaseCase.journey.achievements.map((achievement) => ({ ...achievement })),
        artifacts: { ...purchaseCase.journey.artifacts },
        sync: { ...purchaseCase.journey.sync },
      },
    } : {}),
    cancellation: {
      ...purchaseCase.cancellation,
      ...(purchaseCase.cancellation.refundableAmount ? { refundableAmount: { ...purchaseCase.cancellation.refundableAmount } } : {}),
    },
    timeline: purchaseCase.timeline.map((event) => ({ ...event })),
    updatedAt: purchaseCase.updatedAt,
  };
}

function ownedCase(customerId: string, caseId: string) {
  seedDemoCase();
  const purchaseCase = cases.get(caseId);
  if (!purchaseCase || purchaseCase.customerId !== customerId) {
    throw new WorkflowError("NOT_FOUND", 404, "این پرونده در دسترس نیست.");
  }
  return purchaseCase;
}

export function listUsedPurchaseCases(customerId: string) {
  seedDemoCase();
  return [...cases.values()]
    .filter((purchaseCase) => purchaseCase.customerId === customerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toPublicCase);
}

export function getUsedPurchaseCase(customerId: string, caseId: string) {
  return toPublicCase(ownedCase(customerId, caseId));
}

export function createUsedSupplyRequest(customerId: string, listing: MarketplaceListing) {
  if (listing.kind !== "USED_SUPPLY" || !listing.usedSupply) {
    throw new WorkflowError("INVALID_LISTING_KIND", 422, "این خودرو برای درخواست تأمین معتبر نیست.");
  }
  const createdAt = now();
  const id = `pcase_${crypto.randomUUID()}`;
  const trackingCode = `MEHR-UV-${crypto.randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase()}`;
  const purchaseCase: InternalPurchaseCase = {
    id,
    customerId,
    version: 1,
    trackingCode,
    ...status("SUBMITTED", "درخواست تأمین ثبت شد", "درخواست برای مدیر تأمین ارسال شده و نتیجه بررسی در همین پرونده اعلام می‌شود.", "NONE"),
    vehicle: {
      listingId: listing.id,
      title: listing.title,
      trim: listing.trim,
      modelYear: listing.modelYear,
      imageUrl: listing.imageUrl,
      vinPublicationStatus: "PENDING_FINAL_ASSIGNMENT",
    },
    deposit: { kind: "DEPOSIT", status: "NOT_CREATED", amount: { ...listing.usedSupply.depositAmount } },
    inspection: { status: "NOT_SCHEDULED" },
    balance: { kind: "BALANCE", status: "NOT_CREATED" },
    cancellation: { allowed: true, policySummary: "تا پیش از پذیرش پیشنهاد می‌توانید بدون عملیات مالی انصراف دهید." },
    timeline: [{ code: "SUBMITTED", label: "درخواست تأمین ثبت شد", occurredAt: createdAt }],
    updatedAt: createdAt,
  };
  cases.set(id, purchaseCase);
  return toPublicCase(purchaseCase);
}

export function decideOffer(
  customerId: string,
  caseId: string,
  input: { offerId: string; offerRevision: number; decision: "ACCEPT" | "DECLINE" | "REQUEST_REVISION"; caseVersion: number },
) {
  const purchaseCase = ownedCase(customerId, caseId);
  if (purchaseCase.publicStatus.code !== "OFFER_PENDING" || !purchaseCase.offer) {
    throw new WorkflowError("INVALID_CASE_STATE", 409, "این پرونده در مرحله بررسی پیشنهاد نیست.");
  }
  if (purchaseCase.version !== input.caseVersion) {
    throw new WorkflowError("STALE_CASE_VERSION", 409, "اطلاعات پرونده تغییر کرده است؛ دوباره آن را دریافت کنید.");
  }
  if (purchaseCase.offer.id !== input.offerId || purchaseCase.offer.revision !== input.offerRevision) {
    throw new WorkflowError("STALE_OFFER_VERSION", 409, "نسخه جدیدی از پیشنهاد منتشر شده است.");
  }
  if (new Date(purchaseCase.offer.expiresAt).getTime() <= Date.now()) {
    throw new WorkflowError("OFFER_EXPIRED", 410, "مهلت این پیشنهاد پایان یافته است.");
  }

  if (input.decision === "ACCEPT") {
    Object.assign(purchaseCase, status("DEPOSIT_DUE", "پیشنهاد تأیید شد؛ بیعانه را پرداخت کنید", "برای تثبیت درخواست، بیعانه ۲۰۰ میلیون تومانی را تا مهلت اعلام‌شده پرداخت کنید.", "PAY_DEPOSIT", new Date(Date.now() + 24 * 60 * 60_000).toISOString()));
    purchaseCase.timeline.push({ code: "OFFER_ACCEPTED", label: `نسخه ${purchaseCase.offer.revision} پیشنهاد تأیید شد`, occurredAt: now() });
  } else if (input.decision === "REQUEST_REVISION") {
    Object.assign(purchaseCase, status("SUPPLY_REVIEW", "درخواست بازنگری ارسال شد", "مدیر تأمین قیمت و شرایط را دوباره بررسی می‌کند.", "NONE"));
    purchaseCase.timeline.push({ code: "OFFER_REVISION_REQUESTED", label: "بازنگری پیشنهاد درخواست شد", occurredAt: now() });
  } else {
    Object.assign(purchaseCase, status("CANCELLED", "پیشنهاد رد شد", "پرونده بدون پرداخت وجه بسته شد.", "NONE"));
    purchaseCase.cancellation.allowed = false;
    purchaseCase.timeline.push({ code: "OFFER_DECLINED", label: "پیشنهاد رد و پرونده بسته شد", occurredAt: now() });
  }
  purchaseCase.version += 1;
  purchaseCase.updatedAt = now();
  return toPublicCase(purchaseCase);
}

export function payPurchaseCase(customerId: string, caseId: string, kind: "DEPOSIT" | "BALANCE", caseVersion: number) {
  const purchaseCase = ownedCase(customerId, caseId);
  if (purchaseCase.version !== caseVersion) {
    throw new WorkflowError("STALE_CASE_VERSION", 409, "اطلاعات پرونده تغییر کرده است؛ دوباره آن را دریافت کنید.");
  }
  const paidAt = now();
  const receiptNumber = `PAY-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

  if (kind === "DEPOSIT") {
    if (purchaseCase.publicStatus.code !== "DEPOSIT_DUE" || !purchaseCase.deposit.amount) {
      throw new WorkflowError("INVALID_CASE_STATE", 409, "بیعانه در این مرحله قابل پرداخت نیست.");
    }
    const depositAmount = purchaseCase.deposit.amount;
    purchaseCase.deposit = { ...purchaseCase.deposit, status: "PAID", paidAt, receiptNumber };
    purchaseCase.inspection = { status: "IN_PROGRESS" };
    purchaseCase.inspectionReadyAt = Date.now() + 2_500;
    purchaseCase.cancellation = {
      allowed: true,
      refundableAmount: { ...depositAmount },
      policySummary: "در صورت رد نتیجه کارشناسی، پرونده وارد فرایند بازپرداخت می‌شود.",
    };
    Object.assign(purchaseCase, status("INSPECTION_IN_PROGRESS", "بیعانه دریافت شد؛ کارشناسی در حال انجام است", "کارشناس مهر خودرو را در مبدا بررسی می‌کند. پس از انتشار گزارش به شما اطلاع می‌دهیم.", "NONE"));
    purchaseCase.timeline.push({ code: "DEPOSIT_SETTLED", label: "بیعانه ۲۰۰ میلیون تومانی دریافت شد", occurredAt: paidAt });
    purchaseCase.timeline.push({ code: "INSPECTION_STARTED", label: "کارشناسی خودرو در مبدا آغاز شد", occurredAt: paidAt });
  } else {
    if (purchaseCase.publicStatus.code !== "BALANCE_DUE" || !purchaseCase.balance.amount) {
      throw new WorkflowError("INVALID_CASE_STATE", 409, "پرداخت مانده در این مرحله ممکن نیست.");
    }
    purchaseCase.balance = { ...purchaseCase.balance, status: "PAID", paidAt, receiptNumber };
    purchaseCase.journey = initialVehicleJourney();
    Object.assign(purchaseCase, status("BALANCE_SETTLED", "پرداخت کامل شد", "پرداخت تطبیق داده می‌شود و پرونده برای نهایی‌سازی خرید به سامانه ارسال شده است.", "NONE"));
    purchaseCase.cancellation = { allowed: false, policySummary: "پس از پرداخت کامل، درخواست لغو نیازمند بررسی مالی و حقوقی است." };
    purchaseCase.timeline.push({ code: "BALANCE_SETTLED", label: "مانده قیمت خودرو پرداخت شد", occurredAt: paidAt });
    purchaseCase.timeline.push({ code: "PURCHASE_JOURNEY_STARTED", label: "سفر خودرو برای خرید و تحویل آغاز شد", occurredAt: paidAt });
  }

  purchaseCase.version += 1;
  purchaseCase.updatedAt = paidAt;
  return toPublicCase(purchaseCase);
}

export function decideInspection(
  customerId: string,
  caseId: string,
  input: { reportId: string; reportVersion: number; decision: "ACCEPT" | "REJECT"; caseVersion: number },
) {
  const purchaseCase = ownedCase(customerId, caseId);
  const report = purchaseCase.inspection.report;
  if (purchaseCase.publicStatus.code !== "INSPECTION_DECISION_DUE" || !report) {
    throw new WorkflowError("INVALID_CASE_STATE", 409, "گزارش در این مرحله قابل تصمیم‌گیری نیست.");
  }
  if (purchaseCase.version !== input.caseVersion) {
    throw new WorkflowError("STALE_CASE_VERSION", 409, "نسخه پرونده تغییر کرده است.");
  }
  if (report.id !== input.reportId || report.version !== input.reportVersion) {
    throw new WorkflowError("STALE_REPORT_VERSION", 409, "نسخه جدیدی از گزارش منتشر شده است.");
  }

  if (input.decision === "ACCEPT") {
    purchaseCase.inspection.status = "CUSTOMER_ACCEPTED";
    Object.assign(purchaseCase, status("BALANCE_DUE", "خودرو تأیید شد؛ مانده را پرداخت کنید", "مانده قیمت فقط بر پایه پیشنهاد پذیرفته‌شده در سرور محاسبه شده است.", "PAY_BALANCE", new Date(Date.now() + 24 * 60 * 60_000).toISOString()));
    purchaseCase.timeline.push({ code: "INSPECTION_ACCEPTED", label: "گزارش کارشناسی توسط مشتری تأیید شد", occurredAt: now() });
  } else {
    purchaseCase.inspection.status = "CUSTOMER_REJECTED";
    purchaseCase.deposit.status = "REFUND_PENDING";
    Object.assign(purchaseCase, status("REFUND_PENDING", "خودرو تأیید نشد؛ بازپرداخت در حال انجام است", "نتیجه بازپرداخت بیعانه پس از تأیید مالی در همین پرونده نمایش داده می‌شود.", "NONE"));
    purchaseCase.cancellation.allowed = false;
    purchaseCase.timeline.push({ code: "INSPECTION_REJECTED", label: "خودرو پس از بررسی گزارش تأیید نشد", occurredAt: now() });
    purchaseCase.timeline.push({ code: "REFUND_REQUESTED", label: "درخواست بازپرداخت بیعانه ثبت شد", occurredAt: now() });
  }
  purchaseCase.version += 1;
  purchaseCase.updatedAt = now();
  return toPublicCase(purchaseCase);
}
