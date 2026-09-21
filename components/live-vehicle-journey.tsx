"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  FileText,
  Flag,
  Info,
  MapPin,
  PackageCheck,
  Radio,
  RefreshCw,
  ShieldCheck,
  Ship,
  Stamp,
  Truck,
  Warehouse,
} from "lucide-react";
import { useState } from "react";

import type { PublicVehicleJourney, VehicleJourneyPhaseCode } from "@/lib/customer-api/contracts";

const phaseIcons: Record<VehicleJourneyPhaseCode, LucideIcon> = {
  PURCHASE: PackageCheck,
  ORIGIN_PREPARATION: Warehouse,
  INTERNATIONAL_TRANSPORT: Ship,
  IMPORT_CLEARANCE: Stamp,
  DOMESTIC_LOGISTICS: Truck,
  DELIVERY_PREPARATION: ShieldCheck,
  HANDOVER: Flag,
};

const confidenceLabels = { LOW: "اولیه", MEDIUM: "متوسط", HIGH: "بالا" } as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LiveVehicleJourney({
  journey,
  busy,
  onRefresh,
}: {
  journey: PublicVehicleJourney;
  busy: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [showAllStages, setShowAllStages] = useState(false);
  const currentPhaseIndex = journey.phases.findIndex((phase) => phase.code === journey.overall.currentPhase);
  const currentPhase = journey.phases[currentPhaseIndex];
  const eta = journey.overall.deliveryEta;
  const needsAction = journey.overall.status === "CUSTOMER_ACTION_REQUIRED";
  const unlockedAchievements = journey.achievements.filter((achievement) => achievement.unlockedAt);

  return (
    <section className="live-vehicle-journey" aria-labelledby="live-journey-title">
      <header className="live-journey__sync">
        <div>
          <h3 id="live-journey-title">سفر خودروی شما</h3>
          <span><i aria-hidden="true" /> آخرین وضعیت تأییدشده · {formatDateTime(journey.sync.lastConfirmedAt)}</span>
        </div>
        <button type="button" disabled={busy} onClick={onRefresh} aria-label="دریافت آخرین وضعیت خودرو">
          <RefreshCw className={busy ? "spin" : ""} size={18} /><span>تازه‌سازی</span>
        </button>
      </header>

      <div className="live-journey__summary">
        <div className="live-journey__headline">
          <span>مرحله {new Intl.NumberFormat("fa-IR").format(currentPhaseIndex + 1)} از {new Intl.NumberFormat("fa-IR").format(journey.phases.length)}</span>
          <h3>{currentPhase?.title ?? journey.overall.headline}</h3>
          <p>{currentPhase?.publicMessage ?? journey.overall.description}</p>
          <div className={needsAction ? "journey-action-state journey-action-state--required" : "journey-action-state"}>
            <CheckCircle2 size={17} /> {needsAction ? "این مرحله به اقدام شما نیاز دارد" : "فعلاً نیازی به اقدام شما نیست"}
          </div>
        </div>

        <dl className="live-journey__facts">
          <div>
            <dt>تحویل احتمالی</dt>
            <dd>{eta ? `${formatDate(eta.earliestDate)} تا ${formatDate(eta.latestDate)}` : "در حال محاسبه"}</dd>
            {eta ? <small>برآورد با اطمینان {confidenceLabels[eta.confidence]}</small> : null}
          </div>
          {journey.location ? (
            <div>
              <dt><MapPin size={15} /> آخرین موقعیت قابل انتشار <Info size={14} aria-label="این موقعیت GPS زنده نیست و از رویداد تأییدشده به دست می‌آید." /></dt>
              <dd>{journey.location.label}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div
        className="journey-progress-line"
        role="progressbar"
        aria-label="پیشرفت سفر خودرو بر اساس نقاط عطف تأییدشده"
        aria-valuemin={0}
        aria-valuemax={journey.overall.progress.totalMilestones}
        aria-valuenow={journey.overall.progress.completedMilestones}
      >
        <span style={{ width: `${journey.overall.progress.displayPercent}%` }} />
      </div>

      {journey.delay ? (
        <div className={`journey-delay journey-delay--${journey.delay.level.toLowerCase()}`}>
          <Info size={18} /><div><strong>{journey.delay.label}</strong><p>{journey.delay.publicReason}</p></div>
        </div>
      ) : null}

      <div className="journey-map" role="list" aria-label="مراحل سفر خودرو">
        {journey.phases.map((phase, index) => {
          const Icon = phaseIcons[phase.code];
          const completed = phase.status === "COMPLETED";
          const current = ["IN_PROGRESS", "ACTION_REQUIRED", "DELAYED"].includes(phase.status);
          const mobileHidden = !showAllStages && Math.abs(index - currentPhaseIndex) > 1;
          return (
            <div
              key={phase.code}
              role="listitem"
              className={`journey-stop journey-stop--${completed ? "completed" : current ? "current" : "upcoming"}${mobileHidden ? " journey-stop--mobile-hidden" : ""}`}
              aria-current={current ? "step" : undefined}
            >
              <div className="journey-stop__marker">{completed ? <Check size={18} /> : <Icon size={18} />}</div>
              <div>
                <small>{completed ? "تکمیل‌شده" : current ? "مرحله فعلی" : `مرحله ${new Intl.NumberFormat("fa-IR").format(index + 1)}`}</small>
                <strong>{phase.title}</strong>
                <span>{completed && phase.completedAt ? formatDate(phase.completedAt.slice(0, 10)) : current ? phase.publicMessage : "در ادامه مسیر"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="journey-map-toggle" onClick={() => setShowAllStages((value) => !value)}>
        {showAllStages ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        {showAllStages ? "نمایش مراحل اصلی" : "مشاهده همه مراحل"}
      </button>

      <div className="journey-focus-list">
        <article>
          <span className="journey-focus-list__marker"><Radio size={16} /></span>
          <div><small>اکنون</small><h4>{journey.latestEvent.title}</h4><p>{journey.latestEvent.message}</p><time>{formatDateTime(journey.latestEvent.publishedAt)}</time></div>
        </article>
        <article>
          <span className="journey-focus-list__marker journey-focus-list__marker--next" />
          <div><small>قدم بعد</small><h4>{journey.nextMilestone.title}</h4><p>{journey.nextMilestone.description}</p></div>
        </article>
      </div>

      <a className="journey-assets" href="#/documents">
        <span><FileText size={20} /></span>
        <div><strong>مدارک و رسانه‌های پرونده</strong><small>{new Intl.NumberFormat("fa-IR").format(journey.artifacts.documentsAvailable)} سند تأییدشده · {new Intl.NumberFormat("fa-IR").format(journey.artifacts.mediaAvailable)} ویدئو و رسانه</small></div>
        <ChevronLeft size={19} />
      </a>

      {unlockedAchievements.length > 0 ? (
        <section className="journey-confirmations" aria-label="تأییدهای انجام‌شده">
          <span>تأییدهای انجام‌شده</span>
          <div>{unlockedAchievements.map((achievement) => <strong key={achievement.code} title={achievement.description}><BadgeCheck size={17} /> {achievement.label}</strong>)}</div>
        </section>
      ) : null}

      <p className="journey-privacy-note">هر مرحله فقط پس از ثبت رویداد قطعی در سامانه مهر تغییر می‌کند.</p>
    </section>
  );
}
