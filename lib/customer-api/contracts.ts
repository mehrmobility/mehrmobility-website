export type ListingKind = "SALES_PLAN" | "USED_SUPPLY";
export type ListingAvailability = "AVAILABLE" | "LIMITED" | "RESERVED" | "CLOSED";

export type Money = {
  amount: string | null;
  currency: "IRR";
  displayLabel: string;
};

export type PublicSpec = {
  label: string;
  value: string;
};

export type MarketplaceListing = {
  id: string;
  kind: ListingKind;
  title: string;
  trim: string;
  modelYear: number;
  imageUrl: string;
  gallery: string[];
  hasVideo: boolean;
  price: Money;
  availability: ListingAvailability;
  availabilityLabel: string;
  primaryActionLabel: string;
  locationLabel?: string;
  mileageKm?: number;
  deliveryWindow?: string;
  registrationDeadline?: string;
  purchaseMethod?: string;
  verification?: {
    label: "تأییدشده مهر";
    inspectedAt: string;
    score: number;
    bodySummary: string;
    warrantyLabel: string;
  };
  usedSupply?: {
    depositAmount: Money;
    offerNotice: string;
    inspectionNotice: string;
  };
  specs: PublicSpec[];
  features: string[];
  description: string;
  terms: string[];
  customerSummary?: {
    text: string;
    revision: number;
    approvedAt: string;
  };
};

export type ListingCollectionResponse = {
  data: MarketplaceListing[];
  meta: {
    total: number;
    source: "CUSTOMER_READ_MODEL";
    generatedAt: string;
  };
};

export type PurchaseApplicationRequest = {
  consentAccepted: true;
  preferredContact: "PHONE" | "IN_APP";
};

export type PurchaseApplicationResponse = {
  data: {
    trackingCode: string;
    status: "RECEIVED" | "SUBMITTED";
    statusLabel: string;
    listingId: string;
    nextStep: string;
    application?: UsedVehiclePurchaseCase;
  };
};

export type UsedPurchaseStatus =
  | "SUBMITTED"
  | "SUPPLY_REVIEW"
  | "OFFER_PENDING"
  | "DEPOSIT_DUE"
  | "DEPOSIT_SETTLED"
  | "INSPECTION_SCHEDULED"
  | "INSPECTION_IN_PROGRESS"
  | "INSPECTION_DECISION_DUE"
  | "BALANCE_DUE"
  | "BALANCE_SETTLED"
  | "FINALIZING"
  | "COMPLETED"
  | "CLOSED_UNAVAILABLE"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "ON_HOLD";

export type RequiredPurchaseAction =
  | "NONE"
  | "REVIEW_OFFER"
  | "PAY_DEPOSIT"
  | "REVIEW_INSPECTION"
  | "PAY_BALANCE"
  | "CONTACT_SUPPORT";

export type PaymentSummary = {
  kind: "DEPOSIT" | "BALANCE";
  status: "NOT_CREATED" | "SESSION_CREATED" | "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUND_PENDING" | "REFUNDED";
  amount?: Money;
  paidAt?: string;
  receiptNumber?: string;
};

export type PublicOffer = {
  id: string;
  revision: number;
  totalPrice: Money;
  previousTotalPrice?: Money;
  depositAmount: Money;
  balanceAmount: Money;
  terms: Array<{ code: string; title: string; value: string }>;
  changesFromPrevious: string[];
  expiresAt: string;
};

export type PublicInspection = {
  status: "NOT_SCHEDULED" | "SCHEDULED" | "IN_PROGRESS" | "REPORT_PUBLISHED" | "CUSTOMER_ACCEPTED" | "CUSTOMER_REJECTED";
  report?: {
    id: string;
    version: number;
    overallResult: "APPROVED" | "CONDITIONAL" | "NOT_APPROVED";
    score: number;
    summary: string;
    items: Array<{ category: string; result: string; severity: "INFO" | "MINOR" | "MAJOR" }>;
    expertReportLabel: string;
    certificateReportLabel: string;
    vehicleVideoLabel?: string;
    certificateReference: string;
    publishedAt: string;
  };
};

export type VehicleJourneyPhaseCode =
  | "PURCHASE"
  | "ORIGIN_PREPARATION"
  | "INTERNATIONAL_TRANSPORT"
  | "IMPORT_CLEARANCE"
  | "DOMESTIC_LOGISTICS"
  | "DELIVERY_PREPARATION"
  | "HANDOVER";

export type VehicleJourneyPhaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACTION_REQUIRED" | "DELAYED" | "COMPLETED";

export type PublicVehicleJourney = {
  schemaVersion: 1;
  version: number;
  overall: {
    status: "IN_PROGRESS" | "CUSTOMER_ACTION_REQUIRED" | "DELAYED" | "READY_FOR_HANDOVER" | "DELIVERED";
    currentPhase: VehicleJourneyPhaseCode;
    headline: string;
    description: string;
    progress: {
      completedMilestones: number;
      totalMilestones: number;
      displayPercent: number;
      basis: "PUBLISHED_MILESTONES";
      isEstimate: true;
    };
    deliveryEta?: {
      earliestDate: string;
      latestDate: string;
      confidence: "LOW" | "MEDIUM" | "HIGH";
      asOf: string;
    };
  };
  phases: Array<{
    code: VehicleJourneyPhaseCode;
    title: string;
    shortTitle: string;
    status: VehicleJourneyPhaseStatus;
    completedMilestones: number;
    totalMilestones: number;
    completedAt?: string;
    publicMessage?: string;
  }>;
  latestEvent: {
    id: string;
    sequence: number;
    phase: VehicleJourneyPhaseCode;
    occurredAt: string;
    publishedAt: string;
    title: string;
    message: string;
    confirmation: "CONFIRMED";
  };
  nextMilestone: {
    title: string;
    description: string;
  };
  location?: {
    label: string;
    granularity: "NOT_SHARED" | "COUNTRY" | "BROAD_REGION" | "CITY" | "DELIVERY_SITE";
    isLive: false;
    asOf: string;
  };
  delay?: {
    level: "AT_RISK" | "DELAYED" | "AWAITING_UPDATE";
    label: string;
    publicReason: string;
    nextReviewAt?: string;
  };
  achievements: Array<{
    code: string;
    label: string;
    description: string;
    unlockedAt?: string;
  }>;
  artifacts: {
    documentsAvailable: number;
    mediaAvailable: number;
  };
  sync: {
    nextPollAfterSeconds: number;
    lastConfirmedAt: string;
  };
};

export type UsedVehiclePurchaseCase = {
  id: string;
  version: number;
  trackingCode: string;
  publicStatus: {
    code: UsedPurchaseStatus;
    label: string;
    description: string;
  };
  requiredAction: {
    type: RequiredPurchaseAction;
    dueAt?: string;
  };
  vehicle: {
    listingId: string;
    title: string;
    trim: string;
    modelYear: number;
    imageUrl: string;
    vin?: string;
    vinPublicationStatus: "PENDING_FINAL_ASSIGNMENT" | "PUBLISHED";
  };
  offer?: PublicOffer;
  deposit: PaymentSummary;
  inspection: PublicInspection;
  balance: PaymentSummary;
  journey?: PublicVehicleJourney;
  cancellation: {
    allowed: boolean;
    refundableAmount?: Money;
    policySummary: string;
  };
  timeline: Array<{
    code: string;
    label: string;
    occurredAt: string;
  }>;
  updatedAt: string;
};

export type PurchaseCaseCollectionResponse = {
  data: UsedVehiclePurchaseCase[];
  meta: { total: number; generatedAt: string };
};
