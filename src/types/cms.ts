/**
 * CMS TypeScript Types — Deshal ERP
 *
 * All types for the Multi-Tenant Website & CMS platform.
 * No `any` used. All enums are string literal unions.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS / UNION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CmsSiteType = 'official' | 'tenant';

export type CmsSiteStatus = 'active' | 'inactive' | 'suspended';

export type CmsPublishStatus =
  | 'draft'
  | 'under_review'
  | 'published'
  | 'unpublished'
  | 'archived';

export type CmsTemplate =
  | 'corporate'
  | 'professional_services'
  | 'trading'
  | 'training'
  | 'construction';

export type CmsSectionType =
  | 'hero'
  | 'about'
  | 'services'
  | 'statistics'
  | 'projects'
  | 'products'
  | 'industries'
  | 'testimonials'
  | 'team'
  | 'courses'
  | 'trainers'
  | 'partners'
  | 'cta'
  | 'contact'
  | 'footer';

export type CmsPageType =
  | 'home'
  | 'about'
  | 'services'
  | 'business_center'
  | 'studio'
  | 'training'
  | 'knowledge_hub'
  | 'contact'
  | 'blog_index'
  | 'custom';

export type CmsMediaType = 'image' | 'document' | 'video_metadata';

export type CmsRevisionAction =
  | 'save'
  | 'submit_for_review'
  | 'approve'
  | 'publish'
  | 'unpublish'
  | 'restore';

export type CmsAuditAction =
  | 'site_created' | 'site_updated' | 'site_deleted'
  | 'page_created' | 'page_updated' | 'page_submitted_for_review'
  | 'page_approved' | 'page_published' | 'page_unpublished'
  | 'page_archived' | 'page_restored' | 'page_deleted'
  | 'post_created' | 'post_updated' | 'post_submitted_for_review'
  | 'post_approved' | 'post_published' | 'post_unpublished'
  | 'post_archived' | 'post_restored' | 'post_deleted'
  | 'media_uploaded' | 'media_deleted'
  | 'revision_restored'
  | 'seo_updated'
  | 'domain_changed'
  | 'contact_received';

export type CmsEntityType = 'tenant_page' | 'cms_blog_post' | 'cms_hero_banner';

export type CmsContactCrmStatus = 'pending' | 'routed' | 'duplicate' | 'spam' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION DATA TYPES (Structured — no raw HTML/CSS/JS)
// ─────────────────────────────────────────────────────────────────────────────

export interface CmsSectionDataHero {
  title: string;
  subtitle?: string;
  bodyText?: string;
  imageUrl?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  backgroundType?: 'image' | 'gradient' | 'solid';
  backgroundColor?: string;
}

export interface CmsSectionDataAbout {
  title: string;
  text: string;
  imageUrl?: string;
  imageAlt?: string;
  highlights?: Array<{ icon?: string; title: string; text: string }>;
}

export interface CmsSectionDataServices {
  title: string;
  subtitle?: string;
  items: Array<{
    icon?: string;
    title: string;
    description: string;
    link?: string;
    ctaText?: string;
  }>;
}

export interface CmsSectionDataStatistics {
  title?: string;
  items: Array<{ value: string; label: string; suffix?: string }>;
}

export interface CmsSectionDataTeam {
  title?: string;
  members: Array<{
    name: string;
    role: string;
    imageUrl?: string;
    bio?: string;
  }>;
}

export interface CmsSectionDataTestimonials {
  title?: string;
  items: Array<{
    quote: string;
    author: string;
    role?: string;
    company?: string;
    avatarUrl?: string;
  }>;
}

export interface CmsSectionDataCta {
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaLink: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  backgroundColor?: string;
}

export interface CmsSectionDataContact {
  title?: string;
  subtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  mapEmbedUrl?: string;
  showForm?: boolean;
  formFields?: string[];
}

export interface CmsSectionDataGeneric {
  title?: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export type CmsSectionData =
  | CmsSectionDataHero
  | CmsSectionDataAbout
  | CmsSectionDataServices
  | CmsSectionDataStatistics
  | CmsSectionDataTeam
  | CmsSectionDataTestimonials
  | CmsSectionDataCta
  | CmsSectionDataContact
  | CmsSectionDataGeneric;

export interface CmsPageSection {
  id: string;        // client-side UUID for stable React keys
  type: CmsSectionType;
  visible: boolean;
  order: number;
  data: CmsSectionData;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO FIELDS (reused across pages and posts)
// ─────────────────────────────────────────────────────────────────────────────

export interface CmsSeoFields {
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantWebsiteSettings {
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  social?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
  };
  navItems?: Array<{ id: string; labelAr: string; labelEn: string; slug: string; visible: boolean }>;
  footerText?: string;
  copyrightText?: string;
  analyticsId?: string;
}

export interface TenantWebsite {
  id: string;
  companyId: string;
  siteType: CmsSiteType;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  template: CmsTemplate;
  status: CmsSiteStatus;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  primaryLanguage: string;
  secondaryLanguage?: string;
  settings: TenantWebsiteSettings;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  robotsPolicy: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantPage extends CmsSeoFields {
  id: string;
  tenantWebsiteId: string;
  companyId: string;
  slug: string;
  title: string;
  pageType: CmsPageType;
  sections: CmsPageSection[];
  content?: string;
  status: CmsPublishStatus;
  publishedAt?: string;
  submittedForReviewAt?: string;
  approvedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  reviewedBy?: string;
  publishedBy?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsBlogPost extends CmsSeoFields {
  id: string;
  tenantWebsiteId: string;
  companyId: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  coverImageAlt?: string;
  category?: string;
  tags: string[];
  authorId?: string;
  authorName?: string;
  status: CmsPublishStatus;
  publishedAt?: string;
  submittedForReviewAt?: string;
  approvedAt?: string;
  readingTimeMinutes: number;
  wordCount: number;
  createdBy?: string;
  updatedBy?: string;
  reviewedBy?: string;
  publishedBy?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsHeroBanner {
  id: string;
  tenantWebsiteId: string;
  companyId: string;
  title: string;
  subtitle?: string;
  bodyText?: string;
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  displayOrder: number;
  isActive: boolean;
  activeFrom?: string;
  activeUntil?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsContentRevision {
  id: string;
  tenantWebsiteId: string;
  companyId: string;
  entityType: CmsEntityType;
  entityId: string;
  version: number;
  contentSnapshot: Record<string, unknown>;
  changeReason?: string;
  action: CmsRevisionAction;
  changedBy?: string;
  changedByName?: string;
  createdAt: string;
}

export interface CmsMedia {
  id: string;
  tenantWebsiteId: string;
  companyId: string;
  bucketName: string;
  storagePath: string;
  publicUrl: string;
  filename: string;
  originalFilename?: string;
  mimeType: string;
  fileSizeBytes: number;
  widthPx?: number;
  heightPx?: number;
  altText?: string;
  caption?: string;
  mediaType: CmsMediaType;
  uploadedBy?: string;
  uploadedByName?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsAuditLog {
  id: string;
  tenantWebsiteId?: string;
  companyId: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: CmsAuditAction;
  entityType?: string;
  entityId?: string;
  entityTitle?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CmsContactSubmission {
  id: string;
  tenantWebsiteId?: string;
  companyId?: string;
  resolvedDomain?: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  serviceInterest?: string;
  message?: string;
  preferredDate?: string;
  preferredTime?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  crmLeadId?: string;
  crmStatus: CmsContactCrmStatus;
  crmRoutedAt?: string;
  crmErrorMessage?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD STATE (10-step tenant site creation wizard)
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantWebsiteWizardState {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  // Step 1: Company
  companyId: string;
  companyName: string;
  // Step 2: Domain
  domainMode: 'subdomain' | 'custom';
  subdomain: string;
  customDomain: string;
  domainValidation: 'idle' | 'checking' | 'valid' | 'invalid' | 'reserved' | 'taken';
  // Step 3: Template
  template: CmsTemplate;
  // Step 4: Branding
  name: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  // Step 5: Pages
  selectedPages: CmsPageType[];
  // Step 6: Sections (per page)
  pageSections: Record<CmsPageType, CmsSectionType[]>;
  // Step 7: Content (per page, per section)
  pageContent: Record<string, CmsPageSection[]>;
  // Step 8: SEO
  siteSeqTitle: string;
  siteSeoDescription: string;
  pageSeo: Record<string, CmsSeoFields>;
  // Step 9: Preview mode
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  // Step 10: Publish
  publishValidation: string[];
  isPublishing: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVED SITE CONTEXT (server-side, from hostname)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedSiteContext {
  siteId: string;
  siteType: CmsSiteType;
  companyId: string;
  domain: string;
  primaryLanguage: string;
  template: CmsTemplate;
  name: string;
  logoUrl?: string;
  settings: TenantWebsiteSettings;
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS SERVICE RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CmsResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CmsPaginatedResult<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS MANAGER UI STATE
// ─────────────────────────────────────────────────────────────────────────────

export type CmsManagerTab =
  | 'sites'
  | 'pages'
  | 'blog'
  | 'media'
  | 'seo'
  | 'review'
  | 'audit'
  | 'revisions';

export type CmsEditorMode = 'list' | 'editor' | 'preview' | 'revisions';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API RESPONSE TYPES (returned by Express public endpoints)
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicSiteResponse {
  id: string;
  name: string;
  siteType: CmsSiteType;
  template: CmsTemplate;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  primaryLanguage: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  settings: TenantWebsiteSettings;
}

export interface PublicPageResponse {
  id: string;
  slug: string;
  title: string;
  pageType: CmsPageType;
  sections: CmsPageSection[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
  publishedAt?: string;
}

export interface PublicBlogListResponse {
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    coverImage?: string;
    coverImageAlt?: string;
    category?: string;
    tags: string[];
    authorName?: string;
    publishedAt?: string;
    readingTimeMinutes: number;
    seoDescription?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface PublicBlogPostResponse {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  coverImageAlt?: string;
  category?: string;
  tags: string[];
  authorName?: string;
  publishedAt?: string;
  readingTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
}
