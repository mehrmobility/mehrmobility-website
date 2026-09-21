export type PublicationStatus = "draft" | "in_review" | "approved" | "published" | "archived";
export type CmsDocumentKind = "page" | "article" | "notice" | "vehicle" | "service" | "settings";
export type CmsRevision = { id: string; documentId: string; revisionNo: number; body: Record<string, unknown>; seo?: { title?: string; description?: string; canonical?: string; noindex?: boolean }; status: PublicationStatus; createdAt: string; createdBy: string };
export type CmsNavigationItem = { id: string; location: "header" | "footer" | "mobile"; label: string; href: string; sortOrder: number; status: PublicationStatus };
export const cmsRoles = ["SYSTEM_ADMIN", "CONTENT_EDITOR", "REVIEWER", "CATALOG_MANAGER", "SEO_MANAGER", "SUPPORT_AGENT"] as const;
export type HomeHero = { eyebrow: string; title: string; accent: string; description: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string; footnote: string };
export type PageIntro = { title: string; eyebrow: string; description: string };
