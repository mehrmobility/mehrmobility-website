"use client";

import Image from "next/image";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  ClipboardList,
  Clock3,
  FileText,
  Headphones,
  Heart,
  House,
  Info,
  ListFilter,
  LoaderCircle,
  MessageCircle,
  Phone,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PurchaseJourney } from "@/components/purchase-journey";
import { CustomerHome, CustomerServices, CustomerAccount } from "@/components/customer-lifecycle";
import { CatalogVehicleImage } from "@/components/catalog-vehicle-image";

import type {
  ListingCollectionResponse,
  ListingKind,
  MarketplaceListing,
  PurchaseApplicationResponse,
  UsedVehiclePurchaseCase,
} from "@/lib/customer-api/contracts";

type LoadState = "loading" | "ready" | "error";
type SortMode = "recommended" | "price-asc" | "price-desc";
type PortalView = "home" | "buy" | "requests" | "documents" | "notifications" | "aftersales" | "account";
type PortalRoute = { view: PortalView; caseId?: string; saved?: boolean };

const persianNumber = new Intl.NumberFormat("fa-IR");

const navigation = [
  { label: "خانه", href: "#/home", view: "home" as const, icon: House },
  { label: "کشف خودرو", href: "#/buy", view: "buy" as const, icon: Search },
  { label: "خودروی من", href: "#/requests", view: "requests" as const, icon: CarFront },
  { label: "خدمات", href: "#/aftersales", view: "aftersales" as const, icon: Wrench },
  { label: "حساب من", href: "#/account", view: "account" as const, icon: CircleUserRound },
];

const viewTitles: Record<PortalView, string> = {
  home: "مهرِ من",
  buy: "کشف خودرو",
  requests: "خودروی من",
  documents: "مدارک من",
  notifications: "اعلان‌ها",
  aftersales: "خدمات خودروی من",
  account: "حساب من",
};

function routeToHash(route: PortalRoute) {
  if (route.view === "buy" && route.saved) return "#/buy/saved";
  return route.view === "requests" && route.caseId
    ? `#/requests/${encodeURIComponent(route.caseId)}`
    : `#/${route.view}`;
}

function readPortalRoute(hash: string): { route: PortalRoute; canonicalHash: string } {
  const raw = hash.replace(/^#/, "").replace(/^\/+/, "");
  const parts = raw.split("/").filter(Boolean);
  const first = parts[0]?.toLowerCase();

  let route: PortalRoute;
  if (!first || first === "home" || first === "top") {
    route = { view: "home" };
  } else if (first === "buy" || first === "marketplace") {
    route = { view: "buy", saved: parts[1] === "saved" };
  } else if (first === "requests") {
    let caseId: string | undefined;
    if (parts.length > 1) {
      try {
        caseId = decodeURIComponent(parts.slice(1).join("/"));
      } catch {
        caseId = undefined;
      }
    }
    route = caseId ? { view: "requests", caseId } : { view: "requests" };
  } else if (first === "documents" || first === "services") {
    route = { view: "documents" };
  } else if (first === "notifications") {
    route = { view: "notifications" };
  } else if (first === "aftersales" || first === "account") {
    route = { view: first };
  } else {
    route = { view: "home" };
  }

  return { route, canonicalHash: routeToHash(route) };
}

function normalizeSearch(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("fa").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\s+/g, " ").trim();
}

function readFavoriteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("mehr:favorite-listings:v1") ?? "[]");
    if (Array.isArray(saved)) return new Set(saved.filter((id): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(id)).slice(0, 200));
  } catch { /* Device-local preferences are optional. */ }
  return new Set();
}

function availabilityClass(availability: MarketplaceListing["availability"]) {
  if (availability === "AVAILABLE") return "status status--success";
  if (availability === "LIMITED") return "status status--warning";
  return "status status--neutral";
}

function LoadingCards() {
  return (
    <div className="vehicle-grid" aria-label="در حال دریافت خودروها">
      {[0, 1].map((item) => (
        <div className="vehicle-card vehicle-card--loading" key={item}>
          <div className="skeleton skeleton--media" />
          <div className="vehicle-card__body">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VehicleCard({
  listing,
  favorite,
  onFavorite,
  onOpen,
}: {
  listing: MarketplaceListing;
  favorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  const isUsed = listing.kind === "USED_SUPPLY";

  return (
    <article className="vehicle-card">
      <div className="vehicle-card__media">
        <CatalogVehicleImage key={listing.imageUrl} src={listing.imageUrl} alt={`${listing.title} ${listing.trim}`} used={isUsed} sizes="(max-width: 820px) 100vw, 36vw" />
        {!isUsed && listing.imageUrl.startsWith("/vehicles/") && <span className="catalog-image-label">تصویر نمونه</span>}
        {isUsed && listing.imageUrl.startsWith("/customer-api/") && <span className="catalog-image-label">تصویر آگهی مبدأ</span>}
        <div className="vehicle-card__badges">
          <span className={availabilityClass(listing.availability)}>{listing.availabilityLabel}</span>
          {listing.verification && (
            <span className="status status--verified"><BadgeCheck size={15} /> {listing.verification.label}</span>
          )}
        </div>
        <button
          className={`favorite-button${favorite ? " favorite-button--active" : ""}`}
          type="button"
          aria-label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          title={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <Heart size={19} fill={favorite ? "currentColor" : "none"} />
        </button>
        {listing.hasVideo && (
          <span className="video-badge"><PlayCircle size={17} /> ویدئوی خودرو</span>
        )}
      </div>

      <div className="vehicle-card__body">
        <div className="vehicle-card__title-row">
          <div>
            <p className="vehicle-card__eyebrow">{isUsed ? "درخواست تأمین خودروی کارکرده" : listing.purchaseMethod}</p>
            <h3>{listing.title}</h3>
            <span>{listing.trim} · مدل {persianNumber.format(listing.modelYear)}</span>
          </div>
          {listing.verification && <strong className="score">{persianNumber.format(listing.verification.score)}<small>/۱۰۰</small></strong>}
        </div>

        <div className="vehicle-facts">
          {isUsed ? (
            <>
              <span><CarFront size={17} /> {listing.mileageKm === undefined ? "کارکرد اعلام نشده" : `${persianNumber.format(listing.mileageKm)} کیلومتر`}</span>
              <span><ShieldCheck size={17} /> استعلام موجودی پیش از خرید</span>
            </>
          ) : (
            <>
              <span><CalendarDays size={17} /> {listing.deliveryWindow}</span>
              <span><Clock3 size={17} /> {listing.registrationDeadline}</span>
              <span><WalletCards size={17} /> {listing.purchaseMethod}</span>
            </>
          )}
        </div>

        <div className="vehicle-card__footer">
          <div className="price-block">
            <span>{isUsed ? "قیمت فروش اعلام‌شده" : "قیمت فروش"}</span>
            <strong>{listing.price.displayLabel}</strong>
          </div>
          <button type="button" className="button button--dark" onClick={onOpen}>
            جزئیات و شرایط
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ListingDrawer({
  listing,
  loading,
  error,
  onClose,
  onApplicationCreated,
}: {
  listing: MarketplaceListing | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
  onApplicationCreated: (application: UsedVehiclePurchaseCase) => void;
}) {
  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState<"PHONE" | "IN_APP">("PHONE");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<PurchaseApplicationResponse["data"] | null>(null);
  const [videoNotice, setVideoNotice] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const isOpen = Boolean(listing || loading || error);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? [])].filter((node) => node.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); if (previous?.isConnected) previous.focus(); };
  }, [isOpen]);

  if (!isOpen) return null;

  async function submitApplication() {
    if (!listing || !consent) return;
    setSubmitState("submitting");
    const body = JSON.stringify({ consentAccepted: true, preferredContact: contact });
    const fingerprint = `${listing.id}:${body}`;
    if (idempotency.current?.fingerprint !== fingerprint) idempotency.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const response = await fetch(`/customer-api/v1/marketplace/listings/${listing.id}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotency.current.key,
        },
        body,
      });
      if (!response.ok) throw new Error("REQUEST_FAILED");
      const payload = (await response.json()) as PurchaseApplicationResponse;
      setResult(payload.data);
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} tabIndex={-1} className="drawer" role="dialog" aria-modal="true" aria-label={listing ? undefined : "جزئیات خودرو"} aria-labelledby={listing ? "vehicle-detail-title" : undefined}>
        <div className="drawer__topbar">
          <span>جزئیات خودرو</span>
          <button type="button" onClick={onClose} aria-label="بستن" title="بستن"><X size={21} /></button>
        </div>

        {error ? <div className="drawer__loading" role="alert"><Info size={30} /><p>دریافت جزئیات این خودرو ممکن نشد.</p><button className="button button--outline" onClick={onClose}>بازگشت به خودروها</button></div> : loading || !listing ? (
          <div className="drawer__loading"><LoaderCircle className="spin" size={28} /> در حال دریافت جزئیات خودرو…</div>
        ) : (
          <div className="drawer__content">
            <div className="drawer__media">
              <CatalogVehicleImage key={galleryIndex} src={[listing.imageUrl, ...listing.gallery][galleryIndex] ?? listing.imageUrl} alt={`${listing.title} · تصویر ${persianNumber.format(galleryIndex + 1)}`} used={listing.kind === "USED_SUPPLY"} sizes="(max-width: 760px) 100vw, 560px" priority />
              {listing.kind !== "USED_SUPPLY" && listing.imageUrl.startsWith("/vehicles/") && <span className="catalog-image-label">تصویر نمونه</span>}
              {listing.kind === "USED_SUPPLY" && listing.imageUrl.startsWith("/customer-api/") && <span className="catalog-image-label">تصویر آگهی مبدأ</span>}
              {listing.hasVideo && <button type="button" className="play-button" title="نمایش ویدئوی خودرو" onClick={() => setVideoNotice(true)}><PlayCircle size={24} /> مشاهده ویدئو</button>}
            </div>

            {listing.gallery.length > 0 && (listing.kind !== "USED_SUPPLY" || listing.imageUrl.startsWith("/customer-api/")) && <div className="listing-gallery" role="group" aria-label="تصاویر خودرو">{[listing.imageUrl, ...listing.gallery].map((src, index) => <button type="button" key={`${src}-${index}`} aria-label={`تصویر ${persianNumber.format(index + 1)}`} aria-pressed={index === galleryIndex} onClick={() => setGalleryIndex(index)}><Image src={src} alt="" width={76} height={54} unoptimized={src.startsWith("/customer-api/")} /></button>)}</div>}

            {videoNotice && <div className="video-notice"><PlayCircle size={19} /><span>در نسخه متصل، پخش با نشست کوتاه‌مدت امن از Customer API انجام می‌شود. این رکورد نمایشی فایل ویدئو ندارد.</span><button type="button" onClick={() => setVideoNotice(false)} aria-label="بستن پیام"><X size={16} /></button></div>}

            <div className="drawer__heading">
              <div>
                <p>{listing.kind === "USED_SUPPLY" ? "تأمین خودروی کارکرده" : "طرح فروش فعال"}</p>
                <h2 id="vehicle-detail-title">{listing.title}</h2>
                <span>{listing.trim} · مدل {persianNumber.format(listing.modelYear)}</span>
              </div>
              <div className="drawer__price"><span>{listing.kind === "USED_SUPPLY" ? "قیمت فعلی سامانه" : "قیمت مشتری"}</span><strong>{listing.price.displayLabel}</strong></div>
            </div>

            {listing.verification && (
              <div className="verification-panel">
                <div className="verification-panel__score"><BadgeCheck size={25} /><strong>{persianNumber.format(listing.verification.score)}</strong><span>از ۱۰۰</span></div>
                <div><h3>گزارش کارشناسی مهر</h3><p>{listing.verification.bodySummary}</p><small>کارشناسی: {listing.verification.inspectedAt} · {listing.verification.warrantyLabel}</small></div>
              </div>
            )}

            {listing.usedSupply && (
              <div className="supply-process-note">
                <div><ClipboardList size={20} /><span><strong>ابتدا درخواست تأمین</strong>{listing.usedSupply.offerNotice}</span></div>
                <div><WalletCards size={20} /><span><strong>بیعانه بعد از تأیید شما</strong>{listing.usedSupply.depositAmount.displayLabel}</span></div>
                <div><ShieldCheck size={20} /><span><strong>سپس کارشناسی مبدا</strong>{listing.usedSupply.inspectionNotice}</span></div>
              </div>
            )}

            <section className="detail-section">
              <h3>مشخصات اصلی</h3>
              <div className="spec-grid">
                {listing.specs.map((spec) => <div key={spec.label}><span>{spec.label}</span><strong>{spec.value}</strong></div>)}
                {listing.mileageKm !== undefined && <div><span>کارکرد</span><strong>{persianNumber.format(listing.mileageKm)} کیلومتر</strong></div>}
                {listing.deliveryWindow && <div><span>موعد تحویل</span><strong>{listing.deliveryWindow}</strong></div>}
              </div>
            </section>

            {listing.customerSummary && <section className="approved-summary"><h3><Sparkles size={20} /> خلاصه هوشمند خودرو</h3><p>{listing.customerSummary.text}</p><small><BadgeCheck size={15} /> بازبینی و تأییدشده توسط مهر</small></section>}

            <section className="detail-section">
              <h3>امکانات و خدمات</h3>
              <div className="feature-list">{listing.features.map((feature) => <span key={feature}><Check size={15} /> {feature}</span>)}</div>
            </section>

            <section className="detail-section detail-section--terms">
              <h3><Info size={18} /> قبل از ثبت درخواست</h3>
              <p>{listing.description}</p>
              <ul>{listing.terms.map((term) => <li key={term}>{term}</li>)}</ul>
            </section>

            {submitState === "success" && result ? (
              <div className="application-success">
                <CheckCircle2 size={34} />
                <div><h3>{result.statusLabel}</h3><p>کد پیگیری: <bdi>{result.trackingCode}</bdi></p><span>{result.nextStep}</span>{result.application && <button type="button" className="button button--dark" onClick={() => onApplicationCreated(result.application as UsedVehiclePurchaseCase)}>مشاهده روند درخواست <ChevronLeft size={17} /></button>}</div>
              </div>
            ) : (
              <div className="application-box">
                <h3>{listing.kind === "USED_SUPPLY" ? "ثبت درخواست تأمین" : "ثبت درخواست خرید"}</h3>
                <div className="contact-options" role="radiogroup" aria-label="روش تماس ترجیحی">
                  <button type="button" className={contact === "PHONE" ? "selected" : ""} onClick={() => setContact("PHONE")}><Phone size={17} /> تماس تلفنی</button>
                  <button type="button" className={contact === "IN_APP" ? "selected" : ""} onClick={() => setContact("IN_APP")}><MessageCircle size={17} /> پیام در پرتال</button>
                </div>
                <label className="consent-row">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                  <span>شرایط ثبت درخواست و پردازش اطلاعات برای پیگیری خرید را مطالعه کردم و می‌پذیرم.</span>
                </label>
                <button className="button button--primary button--wide" type="button" disabled={!consent || submitState === "submitting"} onClick={submitApplication}>
                  {submitState === "submitting" ? <><LoaderCircle className="spin" size={18} /> در حال ثبت امن…</> : listing.kind === "USED_SUPPLY" ? "ارسال درخواست برای مدیر تأمین" : "ثبت درخواست خرید"}
                </button>
                {submitState === "error" && <p className="form-error">ثبت درخواست انجام نشد. دوباره تلاش کنید.</p>}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export function MarketplaceShell({ preview = false }: { preview?: boolean }) {
  const [route, setRoute] = useState<PortalRoute | null>(null);
  const [kind, setKind] = useState<ListingKind>("USED_SUPPLY");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortMode>("recommended");
  const [favorites, setFavorites] = useState<Set<string>>(readFavoriteIds);
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [journeyRefreshKey, setJourneyRefreshKey] = useState(0);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [detailError, setDetailError] = useState(false);
  const [budget, setBudget] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const detailRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    function syncRoute() {
      const next = readPortalRoute(window.location.hash);
      if (window.location.hash !== next.canonicalHash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${next.canonicalHash}`);
      }
      if (next.route.view !== "buy") {
        detailRequest.current?.abort();
        setSelected(null);
        setDrawerLoading(false);
        setDetailError(false);
      }
      setVisibleCount(12);
      setRoute(next.route);
    }

    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
      detailRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!route) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`portal-view-${route.view}`)?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [route]);

  useEffect(() => {
    if (route?.view !== "buy") return;
    const controller = new AbortController();
    async function loadListings() {
      setLoadState("loading");
      try {
        const response = await fetch(`/customer-api/v1/marketplace/listings?kind=${kind}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("LOAD_FAILED");
        const payload = (await response.json()) as ListingCollectionResponse;
        setListings(payload.data);
        setLoadState("ready");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setLoadState("error");
      }
    }
    loadListings();
    return () => controller.abort();
  }, [kind, route?.view, catalogRetry]);

  const filteredListings = useMemo(() => {
    const query = normalizeSearch(search);
    const result = listings.filter((listing) => {
      const matchesSearch = !query || normalizeSearch(`${listing.title} ${listing.trim} ${listing.specs.map((spec) => spec.value).join(" ")}`).includes(query);
      const matchesAvailability = !onlyAvailable || listing.availability === "AVAILABLE";
      const matchesBudget = !budget || (listing.price.amount !== null && Number(listing.price.amount) <= Number(budget) * 10_000_000);
      const matchesYear = !modelYear || String(listing.modelYear) === modelYear;
      const matchesMileage = !maxMileage || (listing.mileageKm !== undefined && listing.mileageKm <= Number(maxMileage));
      const matchesFavorite = !route?.saved || favorites.has(listing.id);
      return matchesSearch && matchesAvailability && matchesBudget && matchesYear && matchesMileage && matchesFavorite;
    });
    if (sort === "price-asc") return [...result].sort((a, b) => Number(a.price.amount ?? Number.MAX_SAFE_INTEGER) - Number(b.price.amount ?? Number.MAX_SAFE_INTEGER));
    if (sort === "price-desc") return [...result].sort((a, b) => Number(b.price.amount ?? 0) - Number(a.price.amount ?? 0));
    return result;
  }, [listings, onlyAvailable, search, sort, budget, modelYear, maxMileage, route?.saved, favorites]);

  function resetFilters() { setSearch(""); setOnlyAvailable(false); setSort("recommended"); setBudget(""); setModelYear(""); setMaxMileage(""); setVisibleCount(12); }

  async function openListing(listingId: string) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setDrawerLoading(true);
    setDetailError(false);
    setSelected(null);
    try {
      const response = await fetch(`/customer-api/v1/marketplace/listings/${encodeURIComponent(listingId)}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("DETAIL_FAILED");
      const payload = (await response.json()) as { data: MarketplaceListing };
      setSelected(payload.data);
    } catch {
      if (!controller.signal.aborted) setDetailError(true);
    } finally {
      if (!controller.signal.aborted) setDrawerLoading(false);
    }
  }

  function toggleFavorite(listingId: string) {
    const next = new Set(favorites);
    if (next.has(listingId)) next.delete(listingId);
    else if (next.size < 200) next.add(listingId);
    setFavorites(next);
    try { localStorage.setItem("mehr:favorite-listings:v1", JSON.stringify([...next])); } catch { /* Preferences remain usable in memory. */ }
  }

  function navigateTo(nextRoute: PortalRoute) {
    const nextHash = routeToHash(nextRoute);
    if (window.location.hash === nextHash) {
      setRoute(nextRoute);
      return;
    }
    window.location.hash = nextHash;
  }

  function showCreatedApplication(application: UsedVehiclePurchaseCase) {
    setJourneyRefreshKey((value) => value + 1);
    setSelected(null);
    setDrawerLoading(false);
    navigateTo({ view: "requests", caseId: application.id });
  }

  if (!route) {
    return <div className="portal-view-loading" role="status"><LoaderCircle className="spin" size={25} /> در حال آماده‌سازی پرتال مهر…</div>;
  }

  return (
    <div className="app-shell mehr-mobile">
      <a className="mehr-skip-link" href="#portal-content">رفتن به محتوای صفحه</a>
      <aside className="sidebar">
        <a className="brand" href="#/home" aria-label="مهر">
          <Image src="/brand/mehr-logo-white.png" alt="مهر" width={112} height={60} priority />
          <span>پرتال مشتریان</span>
        </a>
        <nav aria-label="منوی اصلی">
          {navigation.map(({ label, href, view, icon: Icon }) => (
            <a key={label} href={href} className={route.view === view ? "active" : ""} aria-current={route.view === view ? "page" : undefined}>
              <Icon size={19} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar__help">
          <Headphones size={25} />
          <strong>همراه شما هستیم</strong>
          <span>از انتخاب تا همراهی در جاده</span>
          <a href="#/aftersales">خدمات و پشتیبانی</a>
        </div>
        <p className="sidebar__version">نسخه آزمایشی ۰.۱</p>
      </aside>

      <main className="main-content" id="portal-content" tabIndex={-1}>
        <header className="topbar">
          <div>
            <p>همراه شما، در تمام مسیر</p>
            {route.view === "home" ? (
              <a className="topbar__brand" href="#/home" aria-label="مهر">
                <Image src="/brand/mehr-symbol.png" alt="مهر" width={44} height={44} priority />
              </a>
            ) : <h1>{viewTitles[route.view]}</h1>}
          </div>
          <div className="topbar__actions">
            <button type="button" aria-label="رفتن به اعلان‌ها" title="اعلان‌ها" onClick={() => navigateTo({ view: "notifications" })}><Bell size={20} /></button>
            <button type="button" className="profile-button" aria-label="حساب من" onClick={() => navigateTo({ view: "account" })}><CircleUserRound size={21} /><span>حساب کاربری</span><ChevronLeft size={16} /></button>
          </div>
        </header>

        {route.view === "home" && <div className="portal-view" id="portal-view-home" tabIndex={-1}><CustomerHome /></div>}
        {route.view === "aftersales" && <div className="portal-view" id="portal-view-aftersales" tabIndex={-1}><CustomerServices /></div>}
        {route.view === "account" && <div className="portal-view" id="portal-view-account" tabIndex={-1}><CustomerAccount favoriteCount={favorites.size} /></div>}

        {route.view === "buy" ? (
          <div className="portal-view" id="portal-view-buy" tabIndex={-1}>
            <section className="marketplace">
              <div className="market-tabs" role="tablist" aria-label="نوع خودرو">
                <button role="tab" aria-selected={kind === "SALES_PLAN"} className={kind === "SALES_PLAN" ? "active" : ""} onClick={() => setKind("SALES_PLAN")}>
                  <CarFront size={20} /><span><strong>طرح‌های فروش مصوب</strong><small>قیمت و شرایط بخشنامه‌ها</small></span>
                </button>
                <button role="tab" aria-selected={kind === "USED_SUPPLY"} className={kind === "USED_SUPPLY" ? "active" : ""} onClick={() => setKind("USED_SUPPLY")}>
                  <BadgeCheck size={20} /><span><strong>خودروهای کارکرده</strong><small>پلاک ملی و منطقه آزاد</small></span>
                </button>
              </div>

              <div className="catalog-search">
                <label className="search-box"><Search size={21} /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(12); }} aria-label="جست‌وجوی مدل، برند یا ویژگی خودرو" placeholder="برند، مدل یا ویژگی مدنظر شما…" /></label>
              </div>
              <details className="catalog-filters"><summary><ListFilter size={18} /><strong>فیلتر خودروها</strong><span>{[budget, modelYear, maxMileage, onlyAvailable].filter(Boolean).length ? `${persianNumber.format([budget, modelYear, maxMileage, onlyAvailable].filter(Boolean).length)} فیلتر فعال` : "بودجه، سال و کارکرد"}</span></summary><div className="catalog-filter-fields"><label>حداکثر بودجه · میلیون تومان<input inputMode="numeric" type="text" value={budget} onChange={(event) => { const value = normalizeSearch(event.target.value); if (/^\d{0,7}$/.test(value)) { setBudget(value); setVisibleCount(12); } }} placeholder="مثلاً ۳۰۰۰" /></label><label>سال ساخت<select value={modelYear} onChange={(event) => { setModelYear(event.target.value); setVisibleCount(12); }}><option value="">همه سال‌ها</option>{[...new Set(listings.map((item) => item.modelYear))].sort((a, b) => b - a).map((year) => <option key={year} value={year}>{persianNumber.format(year)}</option>)}</select></label><label>حداکثر کارکرد<select value={maxMileage} onChange={(event) => { setMaxMileage(event.target.value); setVisibleCount(12); }}><option value="">همه کارکردها</option><option value="30000">۳۰٬۰۰۰ کیلومتر</option><option value="60000">۶۰٬۰۰۰ کیلومتر</option><option value="100000">۱۰۰٬۰۰۰ کیلومتر</option></select></label><label className="catalog-available"><input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} />فقط قابل درخواست</label><button className="button button--outline" type="button" onClick={resetFilters}>پاک‌کردن فیلترها</button></div></details>

              <div className="results-meta"><span aria-live="polite">{loadState === "ready" ? `${persianNumber.format(filteredListings.length)} خودرو در فهرست دریافتی` : "فهرست خودروها"}</span><div className="results-meta__actions"><button className={route.saved ? "catalog-saved catalog-saved--compact active" : "catalog-saved catalog-saved--compact"} onClick={() => navigateTo({ view: "buy", saved: !route.saved })} aria-pressed={Boolean(route.saved)} aria-label={route.saved ? "نمایش همه خودروها" : "نمایش نشان‌شده‌ها"}><Heart size={18} fill={route.saved ? "currentColor" : "none"} /><span>{persianNumber.format(favorites.size)}</span></button><label className="sort-select"><select value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setVisibleCount(12); }} aria-label="مرتب‌سازی"><option value="recommended">ترتیب سامانه</option><option value="price-asc">کمترین قیمت</option><option value="price-desc">بیشترین قیمت</option></select></label></div></div>

              {loadState === "loading" && <LoadingCards />}
              {loadState === "error" && <div className="empty-state" role="alert"><Info size={30} /><h3>دریافت خودروها ممکن نشد</h3><p>ارتباط با فهرست خودروها موقتاً برقرار نیست.</p><button className="button button--dark" onClick={() => setCatalogRetry((value) => value + 1)}>تلاش دوباره</button></div>}
              {loadState === "ready" && filteredListings.length === 0 && <div className="empty-state"><Search size={30} /><h3>{route.saved ? "هنوز خودرویی در این فهرست نشان نکرده‌اید" : "موردی پیدا نشد"}</h3><p>{kind === "SALES_PLAN" && listings.length === 0 ? "طرح فروش و بخشنامه فعالی دریافت نشده است." : "فیلترها را تغییر دهید یا از فهرست خودروها یک مورد را نشان کنید."}</p><button className="button button--outline" onClick={() => { resetFilters(); navigateTo({ view: "buy" }); }}>نمایش همه خودروها</button></div>}
              {loadState === "ready" && filteredListings.length > 0 ? (
                <div className="vehicle-grid">
                  {filteredListings.slice(0, visibleCount).map((listing) => <VehicleCard key={listing.id} listing={listing} favorite={favorites.has(listing.id)} onFavorite={() => toggleFavorite(listing.id)} onOpen={() => openListing(listing.id)} />)}
                </div>
              ) : null}
              {loadState === "ready" && filteredListings.length > visibleCount && <button className="button button--outline catalog-more" onClick={() => setVisibleCount((value) => value + 12)}>نمایش خودروهای بیشتر</button>}
              <p className="catalog-footnote"><ShieldCheck size={17} /> {kind === "USED_SUPPLY" ? "قیمت فروش تأیید شده؛ موجودی و کارشناسی هر خودرو جداگانه بررسی می‌شود." : "قیمت و شرایط نهایی مطابق آخرین بخشنامه معتبر است."}</p>
            </section>
          </div>
        ) : null}

        {route.view === "requests" ? (
          <div className="portal-view portal-view--requests" id="portal-view-requests" tabIndex={-1}>
            <PurchaseJourney
              refreshKey={journeyRefreshKey}
              requestedCaseId={route.caseId}
              onCaseSelect={(caseId) => navigateTo({ view: "requests", caseId })}
            />
          </div>
        ) : null}

        {route.view === "documents" ? (
          <section className="portal-view portal-simple-view" id="portal-view-documents" tabIndex={-1} aria-labelledby="documents-title">
            <header className="portal-view__heading">
              <span>فضای امن پرونده</span>
              <h2 id="documents-title">مدارک من</h2>
              <p>مدارک هویتی، قرارداد، پرداخت‌ها و گزارش کارشناسی هر خودرو در پرونده خودش قرار می‌گیرند.</p>
            </header>
            <div className="documents-overview">
              <div className="documents-overview__graphic" aria-hidden="true"><Upload size={34} /><span /><FileText size={25} /></div>
              <div><strong>مدارک هر خودرو، در پرونده خودش</strong><p>بارگذاری مدارک هنوز فعال نیست. فعلاً می‌توانید خلاصه اطلاعات پرونده را مشاهده کنید.</p></div>
              <a className="button button--primary" href="#/requests">انتخاب پرونده <ChevronLeft size={17} /></a>
            </div>
            <div className="document-principles" role="list" aria-label="اصول ارسال مدارک">
              <article role="listitem"><ShieldCheck size={21} /><div><strong>دسترسی مالک‌محور</strong><span>فقط شما و کارشناسان مجاز همان پرونده</span></div></article>
              <article role="listitem"><FileText size={21} /><div><strong>وضعیت روشن</strong><span>دریافت‌شده، در حال بررسی یا نیازمند اصلاح</span></div></article>
              <article role="listitem"><WalletCards size={21} /><div><strong>تفکیک مدارک</strong><span>هویتی، پرداخت، کارشناسی و تحویل</span></div></article>
            </div>
          </section>
        ) : null}

        {route.view === "notifications" ? (
          <section className="portal-view portal-simple-view" id="portal-view-notifications" tabIndex={-1} aria-labelledby="notifications-title">
            <header className="portal-view__heading">
              <span>تغییرات مهم پرونده</span>
              <h2 id="notifications-title">اعلان‌ها</h2>
              <p>فقط رویدادهای قابل انتشار و اقدام‌هایی که به تصمیم شما نیاز دارند اینجا نمایش داده می‌شوند.</p>
            </header>
            <div className="notification-list">
              {preview ? <><a href="#/requests/pcase_demo_offer_01"><span className="notification-list__icon"><Bell size={20} /></span><div><strong>پیشنهاد جدید آماده بررسی است</strong><p>قیمت و شرایط تأمین به‌روزرسانی شده و منتظر تصمیم شماست.</p><small>اعلان نمونه</small></div><ChevronLeft size={19} /></a><a href="#/requests/pcase_demo_journey_01"><span className="notification-list__icon notification-list__icon--success"><CheckCircle2 size={20} /></span><div><strong>وضعیت سفر خودرو به‌روزرسانی شد</strong><p>آخرین رویداد تأییدشده در پرونده خودرو ثبت شده است.</p><small>اعلان نمونه</small></div><ChevronLeft size={19} /></a></> : <div className="empty-state"><Bell size={30} /><p>سرویس اعلان‌ها هنوز فعال نشده است.</p></div>}
            </div>
          </section>
        ) : null}

        <footer><span>© ۱۴۰۵ مهر · پرتال مستقل مشتریان</span><span>حریم خصوصی · شرایط استفاده · دسترس‌پذیری</span></footer>
      </main>

      <ListingDrawer key={selected?.id ?? (drawerLoading ? "loading" : detailError ? "error" : "closed")} listing={selected} loading={drawerLoading} error={detailError} onClose={() => { detailRequest.current?.abort(); setSelected(null); setDrawerLoading(false); setDetailError(false); }} onApplicationCreated={showCreatedApplication} />

      <nav className="mobile-nav" aria-label="منوی موبایل">
        {navigation.map(({ label, href, view, icon: Icon }) => <a key={label} href={href} className={route.view === view ? "active" : ""} aria-current={route.view === view ? "page" : undefined}><Icon size={19} /><span>{label}</span></a>)}
      </nav>
    </div>
  );
}
