"use client";

import { CatalogVehicleImage } from "@/components/catalog-vehicle-image";
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileCheck2,
  FileSearch,
  LoaderCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LiveVehicleJourney } from "@/components/live-vehicle-journey";
import type { UsedPurchaseStatus, UsedVehiclePurchaseCase } from "@/lib/customer-api/contracts";

const steps = [
  { label: "درخواست تأمین", icon: ClipboardCheck },
  { label: "پیشنهاد مهر", icon: FileSearch },
  { label: "پرداخت بیعانه", icon: WalletCards },
  { label: "کارشناسی مبدا", icon: ShieldCheck },
  { label: "تأیید گزارش", icon: FileCheck2 },
  { label: "پرداخت مانده", icon: CreditCard },
];

const stepByStatus: Record<UsedPurchaseStatus, number> = {
  SUBMITTED: 0,
  SUPPLY_REVIEW: 0,
  OFFER_PENDING: 1,
  DEPOSIT_DUE: 2,
  DEPOSIT_SETTLED: 3,
  INSPECTION_SCHEDULED: 3,
  INSPECTION_IN_PROGRESS: 3,
  INSPECTION_DECISION_DUE: 4,
  BALANCE_DUE: 5,
  BALANCE_SETTLED: 6,
  FINALIZING: 6,
  COMPLETED: 6,
  CLOSED_UNAVAILABLE: 0,
  CANCELLED: 1,
  REFUND_PENDING: 4,
  REFUNDED: 4,
  ON_HOLD: 0,
};

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null;
  if (!response.ok || !payload?.data) throw new Error(payload?.error?.message ?? "انجام درخواست ممکن نشد.");
  return payload.data;
}

function JourneyProgress({ purchaseCase }: { purchaseCase: UsedVehiclePurchaseCase }) {
  const activeIndex = stepByStatus[purchaseCase.publicStatus.code];
  const isTerminalFailure = ["CANCELLED", "CLOSED_UNAVAILABLE", "REFUND_PENDING", "REFUNDED"].includes(purchaseCase.publicStatus.code);

  return (
    <ol className="journey-progress" aria-label="مراحل خرید خودرو">
      {steps.map(({ label, icon: Icon }, index) => {
        const done = !isTerminalFailure && activeIndex > index;
        const current = activeIndex === index;
        return (
          <li key={label} className={done ? "done" : current ? "current" : "upcoming"} aria-current={current ? "step" : undefined}>
            <span>{done ? <Check size={17} /> : <Icon size={17} />}</span>
            <small>مرحله {new Intl.NumberFormat("fa-IR").format(index + 1)}</small>
            <strong>{label}</strong>
          </li>
        );
      })}
    </ol>
  );
}

function OfferPanel({
  purchaseCase,
  busy,
  onDecision,
}: {
  purchaseCase: UsedVehiclePurchaseCase;
  busy: boolean;
  onDecision: (decision: "ACCEPT" | "DECLINE" | "REQUEST_REVISION") => Promise<void>;
}) {
  const [accepted, setAccepted] = useState(false);
  const offer = purchaseCase.offer;
  if (!offer) return null;

  return (
    <section className="case-action-card offer-panel" aria-labelledby="offer-title">
      <div className="case-action-card__heading">
        <div><span>پیشنهاد شماره {new Intl.NumberFormat("fa-IR").format(offer.revision)}</span><h3 id="offer-title">قیمت و شرایط تأمین</h3></div>
        <div className="offer-price"><small>قیمت نهایی پیشنهادی</small><strong>{offer.totalPrice.displayLabel}</strong>{offer.previousTotalPrice && <del>{offer.previousTotalPrice.displayLabel}</del>}</div>
      </div>

      {offer.changesFromPrevious.length > 0 && (
        <div className="offer-changes"><RefreshCw size={18} /><div><strong>این پیشنهاد اصلاح شده است</strong>{offer.changesFromPrevious.map((change) => <span key={change}>{change}</span>)}</div></div>
      )}

      <div className="offer-money-grid">
        <div><span>بیعانه پس از تأیید</span><strong>{offer.depositAmount.displayLabel}</strong></div>
        <div><span>مانده پس از تأیید کارشناسی</span><strong>{offer.balanceAmount.displayLabel}</strong></div>
      </div>

      <div className="offer-terms">
        {offer.terms.map((term) => <div key={term.code}><span>{term.title}</span><p>{term.value}</p></div>)}
      </div>

      <div className="offer-expiry"><Clock3 size={17} /> اعتبار پیشنهاد تا {formatDateTime(offer.expiresAt)}</div>
      <label className="consent-row consent-row--offer"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>آخرین نسخه قیمت، شرایط تأمین و ضوابط بیعانه را مطالعه کردم و می‌پذیرم.</span></label>
      <div className="action-row">
        <button type="button" className="button button--primary" disabled={!accepted || busy} onClick={() => onDecision("ACCEPT")}>
          {busy ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />} تأیید پیشنهاد
        </button>
        <button type="button" className="button button--outline" disabled={busy} onClick={() => onDecision("REQUEST_REVISION")}><RotateCcw size={16} /> درخواست بازنگری</button>
        <button type="button" className="text-action text-action--danger" disabled={busy} onClick={() => window.confirm("این پیشنهاد رد و پرونده بدون پرداخت بسته شود؟") && onDecision("DECLINE")}>رد پیشنهاد</button>
      </div>
    </section>
  );
}

function PaymentPanel({
  purchaseCase,
  kind,
  busy,
  onPay,
}: {
  purchaseCase: UsedVehiclePurchaseCase;
  kind: "DEPOSIT" | "BALANCE";
  busy: boolean;
  onPay: (kind: "DEPOSIT" | "BALANCE") => Promise<void>;
}) {
  const payment = kind === "DEPOSIT" ? purchaseCase.deposit : purchaseCase.balance;
  const label = kind === "DEPOSIT" ? "بیعانه" : "مانده قیمت خودرو";

  return (
    <section className="case-action-card payment-panel">
      <div className="payment-panel__icon"><Banknote size={27} /></div>
      <div className="payment-panel__copy"><span>مرحله پرداخت {label}</span><h3>{payment.amount?.displayLabel}</h3><p>مبلغ توسط سامانه و بر پایه آخرین پیشنهاد پذیرفته‌شده محاسبه شده و از ورودی مرورگر دریافت نمی‌شود.</p></div>
      <button type="button" className="button button--primary" disabled={busy} onClick={() => onPay(kind)}>{busy ? <LoaderCircle className="spin" size={17} /> : <CreditCard size={17} />} پرداخت آنلاین {label}</button>
      <div className="payment-demo-note"><AlertCircle size={15} /> در پیش‌نمایش محلی، درگاه شبیه‌سازی می‌شود و هیچ مبلغی جابه‌جا نمی‌شود.</div>
    </section>
  );
}

function InspectionPanel({
  purchaseCase,
  busy,
  onDecision,
}: {
  purchaseCase: UsedVehiclePurchaseCase;
  busy: boolean;
  onDecision: (decision: "ACCEPT" | "REJECT") => Promise<void>;
}) {
  const [reviewed, setReviewed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showVideoNotice, setShowVideoNotice] = useState(false);
  const report = purchaseCase.inspection.report;
  if (!report) return null;

  return (
    <section className="case-action-card inspection-panel">
      <div className="inspection-summary">
        <div className="inspection-score"><BadgeCheck size={22} /><strong>{new Intl.NumberFormat("fa-IR").format(report.score)}</strong><span>از ۱۰۰</span></div>
        <div><span>نتیجه کارشناسی: {report.overallResult === "APPROVED" ? "تأیید" : report.overallResult === "CONDITIONAL" ? "تأیید مشروط" : "عدم تأیید"}</span><h3>گزارش‌ها آماده بررسی شما هستند</h3><p>{report.summary}</p></div>
      </div>

      <div className="report-documents">
        <button type="button" onClick={() => setShowDetails((value) => !value)}><FileCheck2 size={22} /><span><strong>{report.expertReportLabel}</strong><small>نسخه {new Intl.NumberFormat("fa-IR").format(report.version)} · مشاهده جزئیات</small></span><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => setShowDetails((value) => !value)}><ShieldCheck size={22} /><span><strong>{report.certificateReportLabel}</strong><small>شماره {report.certificateReference}</small></span><ChevronLeft size={18} /></button>
        {report.vehicleVideoLabel && <button type="button" onClick={() => setShowVideoNotice((value) => !value)}><PlayCircle size={22} /><span><strong>{report.vehicleVideoLabel}</strong><small>پخش امن داخل پرتال</small></span><ChevronLeft size={18} /></button>}
      </div>

      {showVideoNotice && <div className="video-notice inspection-video-notice"><PlayCircle size={19} /><span>در نسخه متصل، ویدئوی بارگذاری‌شده در سامانه با نشست کوتاه‌مدت پخش می‌شود. این پرونده نمایشی فایل واقعی ندارد.</span><button type="button" onClick={() => setShowVideoNotice(false)} aria-label="بستن پیام"><XCircle size={16} /></button></div>}

      {showDetails && (
        <div className="inspection-items">
          {report.items.map((item) => <div key={item.category} className={`severity-${item.severity.toLowerCase()}`}><span>{item.category}</span><strong>{item.result}</strong></div>)}
          <small>منتشرشده در {formatDateTime(report.publishedAt)} · VIN تا تخصیص قطعی در گزارش مشتری نمایش داده نمی‌شود.</small>
        </div>
      )}

      <label className="consent-row consent-row--offer"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /><span>گزارش کارشناسی و سرتیفیکیت ریپورت خودرو را بررسی کردم.</span></label>
      <div className="action-row">
        <button type="button" className="button button--primary" disabled={!reviewed || busy} onClick={() => onDecision("ACCEPT")}><CheckCircle2 size={17} /> تأیید خودرو و ادامه پرداخت</button>
        <button type="button" className="button button--outline button--danger-outline" disabled={!reviewed || busy} onClick={() => window.confirm("خودرو را تأیید نمی‌کنید و درخواست بازپرداخت بیعانه ثبت شود؟") && onDecision("REJECT")}><XCircle size={17} /> عدم تأیید خودرو</button>
      </div>
    </section>
  );
}

function WaitingPanel({ purchaseCase, busy, onRefresh }: { purchaseCase: UsedVehiclePurchaseCase; busy: boolean; onRefresh: () => Promise<void> }) {
  const inspectionActive = purchaseCase.publicStatus.code === "INSPECTION_IN_PROGRESS";
  return (
    <section className="case-action-card waiting-panel">
      <div className="waiting-panel__icon"><Clock3 size={27} /></div>
      <div><h3>{purchaseCase.publicStatus.label}</h3><p>{purchaseCase.publicStatus.description}</p></div>
      {inspectionActive && <button type="button" className="button button--outline" disabled={busy} onClick={onRefresh}>{busy ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />} به‌روزرسانی وضعیت</button>}
    </section>
  );
}

export function PurchaseJourney({
  refreshKey = 0,
  requestedCaseId,
  onCaseSelect,
}: {
  refreshKey?: number;
  requestedCaseId?: string;
  onCaseSelect?: (caseId: string) => void;
}) {
  const [cases, setCases] = useState<UsedVehiclePurchaseCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requestedCaseExists = requestedCaseId ? cases.some((item) => item.id === requestedCaseId) : true;
  const selected = useMemo(
    () => requestedCaseId
      ? cases.find((item) => item.id === requestedCaseId) ?? null
      : cases.find((item) => item.id === selectedId) ?? cases[0] ?? null,
    [cases, requestedCaseId, selectedId],
  );
  const selectedCaseId = selected?.id;
  const selectedJourneyStatus = selected?.journey?.overall.status;
  const selectedJourneyPollSeconds = selected?.journey?.sync.nextPollAfterSeconds;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/customer-api/v1/me/purchase-applications", { cache: "no-store", signal: controller.signal });
        const payload = await readJson<UsedVehiclePurchaseCase[]>(response);
        setCases(payload);
        setSelectedId((current) => current && payload.some((item) => item.id === current) ? current : payload[0]?.id ?? null);
      } catch (reason) {
        if ((reason as Error).name !== "AbortError") setError(reason instanceof Error ? reason.message : "دریافت پرونده‌ها ممکن نشد.");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedCaseId || !selectedJourneyStatus || selectedJourneyStatus === "DELIVERED") return;

    const caseId = selectedCaseId;
    const activeInterval = Math.max(15, selectedJourneyPollSeconds ?? 30);
    let stopped = false;
    let failures = 0;
    let timeoutId: number | undefined;

    function schedule(seconds: number) {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(poll, seconds * 1000);
    }

    async function poll() {
      if (stopped) return;
      if (document.visibilityState !== "visible") {
        schedule(Math.max(90, activeInterval));
        return;
      }
      try {
        const response = await fetch(`/customer-api/v1/me/purchase-applications/${caseId}`, { cache: "no-store" });
        const next = await readJson<UsedVehiclePurchaseCase>(response);
        setCases((current) => current.map((item) => item.id === next.id ? next : item));
        failures = 0;
        schedule(activeInterval);
      } catch {
        failures += 1;
        schedule(Math.min(300, activeInterval * (2 ** failures)));
      }
    }

    function resume() {
      if (document.visibilityState === "visible" && navigator.onLine) void poll();
    }

    schedule(activeInterval);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      stopped = true;
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [selectedCaseId, selectedJourneyPollSeconds, selectedJourneyStatus]);

  function replaceCase(next: UsedVehiclePurchaseCase) {
    setCases((current) => current.map((item) => item.id === next.id ? next : item));
  }

  async function mutate(path: string, body: Record<string, unknown>) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/customer-api/v1/me/purchase-applications/${selected.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      replaceCase(await readJson<UsedVehiclePurchaseCase>(response));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "انجام درخواست ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function decideOfferAction(decision: "ACCEPT" | "DECLINE" | "REQUEST_REVISION") {
    if (!selected?.offer) return;
    await mutate("offer-decisions", {
      offerId: selected.offer.id,
      offerRevision: selected.offer.revision,
      decision,
      caseVersion: selected.version,
    });
  }

  async function pay(kind: "DEPOSIT" | "BALANCE") {
    if (!selected) return;
    await mutate("payments", { kind, caseVersion: selected.version });
  }

  async function decideInspectionAction(decision: "ACCEPT" | "REJECT") {
    const report = selected?.inspection.report;
    if (!selected || !report) return;
    await mutate("inspection-decisions", {
      reportId: report.id,
      reportVersion: report.version,
      decision,
      caseVersion: selected.version,
    });
  }

  async function refreshSelected() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/customer-api/v1/me/purchase-applications/${selected.id}`, { cache: "no-store" });
      replaceCase(await readJson<UsedVehiclePurchaseCase>(response));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "به‌روزرسانی ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  function selectCase(caseId: string) {
    setSelectedId(caseId);
    setError("");
    onCaseSelect?.(caseId);
  }

  return (
    <section className="journey-section" id="requests" aria-label="پرونده‌های خرید من">
      {loading ? <div className="journey-loading"><LoaderCircle className="spin" size={24} /> در حال دریافت پرونده‌ها…</div> : null}
      {!loading && error && cases.length === 0 ? <div className="empty-state"><AlertCircle size={30} /><h3>پرونده‌ها در دسترس نیستند</h3><p>{error}</p></div> : null}
      {!loading && !error && cases.length === 0 ? <div className="empty-state"><ClipboardCheck size={30} /><h3>هنوز درخواستی ثبت نشده است</h3><p>از بخش خودروهای کارکرده، درخواست تأمین خود را ثبت کنید.</p></div> : null}

      {!loading && requestedCaseId && !requestedCaseExists ? (
        <div className="empty-state" role="status">
          <AlertCircle size={30} />
          <h3>این پرونده در دسترس شما نیست</h3>
          <p>آدرس پرونده را بررسی کنید یا یکی از پرونده‌های متعلق به حساب خودتان را باز کنید.</p>
          {cases.length > 0 ? <button type="button" className="button button--outline" onClick={() => selectCase(cases[0].id)}>مشاهده پرونده‌های من</button> : null}
        </div>
      ) : null}

      {!loading && requestedCaseExists && cases.length > 0 && selected ? (
        <div className="journey-layout">
          <label className="mobile-case-picker" htmlFor="mobile-case-select">
            <span>پرونده فعال</span>
            <select id="mobile-case-select" value={selected.id} onChange={(event) => selectCase(event.target.value)}>
              {cases.map((item) => (
                <option key={item.id} value={item.id}>{item.vehicle.title} · {item.trackingCode}</option>
              ))}
            </select>
            <small>{selected.journey?.overall.headline ?? selected.publicStatus.label}</small>
          </label>

          <aside className="case-list" aria-label="فهرست درخواست‌ها">
            <div className="case-list__title"><span>پرونده‌ها</span><b>{new Intl.NumberFormat("fa-IR").format(cases.length)}</b></div>
            {cases.map((item) => (
              <button key={item.id} type="button" className={item.id === selected.id ? "active" : ""} onClick={() => selectCase(item.id)}>
                <div className="case-vehicle-thumbnail"><CatalogVehicleImage src={item.vehicle.imageUrl} alt={item.vehicle.title} used sizes="74px" /></div>
                <span><strong>{item.vehicle.title}</strong><small>{item.trackingCode}</small><em>{item.journey?.overall.headline ?? item.publicStatus.label}</em>{item.journey ? <i><b style={{ width: `${item.journey.overall.progress.displayPercent}%` }} /></i> : null}</span>
                <ChevronLeft size={17} />
              </button>
            ))}
          </aside>

          <article className="case-detail">
            <header className="case-detail__header">
              <div><span>کد پیگیری <bdi>{selected.trackingCode}</bdi></span><h3>{selected.vehicle.title}</h3><p>{selected.vehicle.trim} · مدل {new Intl.NumberFormat("fa-IR").format(selected.vehicle.modelYear)}</p></div>
              <div className={`case-status case-status--${selected.requiredAction.type === "NONE" ? "waiting" : "action"}`}><span>{selected.journey ? "سفر خودروی شما" : selected.requiredAction.type === "NONE" ? "وضعیت پرونده" : "نیازمند اقدام شما"}</span><strong>{selected.journey?.overall.headline ?? selected.publicStatus.label}</strong></div>
            </header>

            {selected.journey ? (
              <div className="purchase-complete-strip">
                <CheckCircle2 size={21} />
                <div><strong>فرایند خرید تکمیل شد</strong><small>پیشنهاد، پرداخت و کارشناسی با موفقیت انجام شده است.</small></div>
                <span>۶ از ۶</span>
              </div>
            ) : <JourneyProgress purchaseCase={selected} />}
            {error ? <div role="alert" className="journey-error"><AlertCircle size={17} /> {error}</div> : null}

            {selected.requiredAction.type === "REVIEW_OFFER" && <OfferPanel key={`${selected.offer?.id}-${selected.offer?.revision}`} purchaseCase={selected} busy={busy} onDecision={decideOfferAction} />}
            {selected.requiredAction.type === "PAY_DEPOSIT" && <PaymentPanel purchaseCase={selected} kind="DEPOSIT" busy={busy} onPay={pay} />}
            {selected.requiredAction.type === "REVIEW_INSPECTION" && <InspectionPanel key={`${selected.inspection.report?.id}-${selected.inspection.report?.version}`} purchaseCase={selected} busy={busy} onDecision={decideInspectionAction} />}
            {selected.requiredAction.type === "PAY_BALANCE" && <PaymentPanel purchaseCase={selected} kind="BALANCE" busy={busy} onPay={pay} />}
            {selected.journey ? <LiveVehicleJourney journey={selected.journey} busy={busy} onRefresh={refreshSelected} /> : null}
            {selected.requiredAction.type === "NONE" && !selected.journey && <WaitingPanel purchaseCase={selected} busy={busy} onRefresh={refreshSelected} />}

            <details className="case-history">
              <summary><span>تاریخچه کامل پرونده</span><small>{new Intl.NumberFormat("fa-IR").format(selected.timeline.length)} رویداد ثبت‌شده</small></summary>
              <ol>{[...selected.timeline].reverse().map((event) => <li key={`${event.code}-${event.occurredAt}`}><span /><div><strong>{event.label}</strong><small>{formatDateTime(event.occurredAt)}</small></div></li>)}</ol>
            </details>
          </article>
        </div>
      ) : null}
    </section>
  );
}
