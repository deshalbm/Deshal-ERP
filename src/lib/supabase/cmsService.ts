/**
 * CMS Service — Supabase CRUD
 * Browser-side authenticated service for the CMS platform.
 * Uses the anon key + user JWT session. RLS enforces tenant isolation.
 *
 * NEVER use the service role key here. This file is bundled into the browser.
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  TenantWebsite,
  TenantPage,
  CmsBlogPost,
  CmsHeroBanner,
  CmsContentRevision,
  CmsMedia,
  CmsAuditLog,
  CmsResult,
  CmsPaginatedResult,
  CmsPublishStatus,
  CmsEntityType,
  CmsAuditAction,
} from '../../types/cms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(slug: string): string | null {
  if (!slug || !slug.trim()) return 'الرابط (Slug) مطلوب.';
  if (!SLUG_REGEX.test(slug.trim())) return 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط.';
  return null;
}

function notConfigured<T>(): CmsResult<T> {
  return { success: false, error: 'Supabase غير مضبوط.' };
}

function estimateReadingTime(text: string): { wordCount: number; readingTimeMinutes: number } {
  const wordCount = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return { wordCount, readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)) };
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTenantWebsite(row: any): TenantWebsite {
  return {
    id: row.id,
    companyId: row.company_id,
    siteType: row.site_type,
    name: row.name,
    slug: row.slug,
    domain: row.domain ?? undefined,
    subdomain: row.subdomain ?? undefined,
    template: row.template,
    status: row.status,
    logoUrl: row.logo_url ?? undefined,
    faviconUrl: row.favicon_url ?? undefined,
    primaryColor: row.primary_color ?? '#002e69',
    secondaryColor: row.secondary_color ?? '#006d33',
    primaryLanguage: row.primary_language ?? 'ar',
    secondaryLanguage: row.secondary_language ?? undefined,
    settings: typeof row.settings === 'object' ? row.settings : {},
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    ogImage: row.og_image ?? undefined,
    robotsPolicy: row.robots_policy ?? 'index, follow',
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTenantPage(row: any): TenantPage {
  return {
    id: row.id,
    tenantWebsiteId: row.tenant_website_id,
    companyId: row.company_id,
    slug: row.slug,
    title: row.title,
    pageType: row.page_type,
    sections: Array.isArray(row.sections) ? row.sections : [],
    content: row.content ?? undefined,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
    submittedForReviewAt: row.submitted_for_review_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    ogImage: row.og_image ?? undefined,
    ogTitle: row.og_title ?? undefined,
    ogDescription: row.og_description ?? undefined,
    robots: row.robots ?? undefined,
    structuredData: row.structured_data ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    publishedBy: row.published_by ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBlogPost(row: any): CmsBlogPost {
  return {
    id: row.id,
    tenantWebsiteId: row.tenant_website_id,
    companyId: row.company_id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    content: row.content ?? undefined,
    coverImage: row.cover_image ?? undefined,
    coverImageAlt: row.cover_image_alt ?? undefined,
    category: row.category ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    authorId: row.author_id ?? undefined,
    authorName: row.author_name ?? undefined,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
    submittedForReviewAt: row.submitted_for_review_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    readingTimeMinutes: row.reading_time_minutes ?? 1,
    wordCount: row.word_count ?? 0,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    ogImage: row.og_image ?? undefined,
    ogTitle: row.og_title ?? undefined,
    ogDescription: row.og_description ?? undefined,
    robots: row.robots ?? undefined,
    structuredData: row.structured_data ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    publishedBy: row.published_by ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToHeroBanner(row: any): CmsHeroBanner {
  return {
    id: row.id,
    tenantWebsiteId: row.tenant_website_id,
    companyId: row.company_id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    bodyText: row.body_text ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    videoUrl: row.video_url ?? undefined,
    ctaText: row.cta_text ?? undefined,
    ctaLink: row.cta_link ?? undefined,
    ctaSecondaryText: row.cta_secondary_text ?? undefined,
    ctaSecondaryLink: row.cta_secondary_link ?? undefined,
    displayOrder: row.display_order ?? 0,
    isActive: row.is_active ?? true,
    activeFrom: row.active_from ?? undefined,
    activeUntil: row.active_until ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRevision(row: any): CmsContentRevision {
  return {
    id: row.id,
    tenantWebsiteId: row.tenant_website_id,
    companyId: row.company_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    version: row.version,
    contentSnapshot: row.content_snapshot ?? {},
    changeReason: row.change_reason ?? undefined,
    action: row.action,
    changedBy: row.changed_by ?? undefined,
    changedByName: row.changed_by_name ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMedia(row: any): CmsMedia {
  return {
    id: row.id,
    tenantWebsiteId: row.tenant_website_id,
    companyId: row.company_id,
    bucketName: row.bucket_name,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    filename: row.filename,
    originalFilename: row.original_filename ?? undefined,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes ?? 0,
    widthPx: row.width_px ?? undefined,
    heightPx: row.height_px ?? undefined,
    altText: row.alt_text ?? undefined,
    caption: row.caption ?? undefined,
    mediaType: row.media_type,
    uploadedBy: row.uploaded_by ?? undefined,
    uploadedByName: row.uploaded_by_name ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAuditLog(row: any): CmsAuditLog {
  return {
    id: row.id,
    tenantWebsiteId: row.tenant_website_id ?? undefined,
    companyId: row.company_id,
    userId: row.user_id ?? undefined,
    userName: row.user_name ?? undefined,
    userRole: row.user_role ?? undefined,
    action: row.action,
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    entityTitle: row.entity_title ?? undefined,
    oldValue: row.old_value ?? undefined,
    newValue: row.new_value ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

// ─── Revision helpers ─────────────────────────────────────────────────────────

async function getNextRevisionVersion(entityId: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('cms_content_revisions') as any)
    .select('version')
    .eq('entity_id', entityId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.version ?? 0) + 1;
}

async function createRevision(params: {
  entityType: CmsEntityType;
  entityId: string;
  tenantWebsiteId: string;
  companyId: string;
  contentSnapshot: Record<string, unknown>;
  action: string;
  changedBy?: string;
  changedByName?: string;
  changeReason?: string;
}): Promise<void> {
  const version = await getNextRevisionVersion(params.entityId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_content_revisions') as any).insert({
    tenant_website_id: params.tenantWebsiteId,
    company_id: params.companyId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    version,
    content_snapshot: params.contentSnapshot,
    action: params.action,
    changed_by: params.changedBy ?? null,
    changed_by_name: params.changedByName ?? null,
    change_reason: params.changeReason ?? null,
  });
  if (error) {
    console.warn('[CmsService] Failed to create revision:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

export async function logCmsAudit(
  entry: Omit<CmsAuditLog, 'id' | 'createdAt'>
): Promise<void> {
  if (!isSupabaseConfigured) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_audit_logs') as any).insert({
    tenant_website_id: entry.tenantWebsiteId ?? null,
    company_id: entry.companyId,
    user_id: entry.userId ?? null,
    user_name: entry.userName ?? null,
    user_role: entry.userRole ?? null,
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    entity_title: entry.entityTitle ?? null,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    console.warn('[CmsService] Failed to write audit log:', error.message);
  }
}

export async function listCmsAuditLogs(siteId: string, limit = 100): Promise<CmsAuditLog[]> {
  if (!isSupabaseConfigured) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cms_audit_logs') as any)
    .select('*')
    .eq('tenant_website_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToAuditLog(r));
}

// ─────────────────────────────────────────────────────────────────────────────
// TENANT WEBSITES
// ─────────────────────────────────────────────────────────────────────────────

export async function listTenantWebsites(companyId: string): Promise<TenantWebsite[]> {
  if (!isSupabaseConfigured) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_websites') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });
  if (error) { console.error('[CmsService] listTenantWebsites:', error.message); return []; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToTenantWebsite(r));
}

export async function getTenantWebsite(id: string): Promise<TenantWebsite | null> {
  if (!isSupabaseConfigured) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_websites') as any)
    .select('*').eq('id', id).maybeSingle();
  if (error) return null;
  return data ? rowToTenantWebsite(data) : null;
}

export async function getOfficialSite(companyId: string): Promise<TenantWebsite | null> {
  if (!isSupabaseConfigured) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_websites') as any)
    .select('*').eq('company_id', companyId).eq('site_type', 'official').maybeSingle();
  if (error) return null;
  return data ? rowToTenantWebsite(data) : null;
}

export async function upsertTenantWebsite(
  site: Partial<TenantWebsite>,
  companyId: string
): Promise<CmsResult<TenantWebsite>> {
  if (!isSupabaseConfigured) return notConfigured();

  const row = {
    ...(site.id ? { id: site.id } : {}),
    company_id: companyId,
    site_type: site.siteType ?? 'tenant',
    name: site.name,
    slug: site.slug,
    domain: site.domain ?? null,
    subdomain: site.subdomain ?? null,
    template: site.template ?? 'corporate',
    status: site.status ?? 'active',
    logo_url: site.logoUrl ?? null,
    favicon_url: site.faviconUrl ?? null,
    primary_color: site.primaryColor ?? '#002e69',
    secondary_color: site.secondaryColor ?? '#006d33',
    primary_language: site.primaryLanguage ?? 'ar',
    secondary_language: site.secondaryLanguage ?? null,
    settings: site.settings ?? {},
    seo_title: site.seoTitle ?? null,
    seo_description: site.seoDescription ?? null,
    og_image: site.ogImage ?? null,
    robots_policy: site.robotsPolicy ?? 'index, follow',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_websites') as any)
    .upsert(row, { onConflict: 'id' }).select().single();

  if (error) return { success: false, error: 'فشل حفظ بيانات الموقع.' };

  const action: CmsAuditAction = site.id ? 'site_updated' : 'site_created';
  logCmsAudit({ tenantWebsiteId: data.id, companyId, action, entityType: 'tenant_website', entityId: data.id, entityTitle: data.name, metadata: {} });
  return { success: true, data: rowToTenantWebsite(data) };
}

export async function deleteTenantWebsite(id: string, companyId: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tenant_websites') as any)
    .update({ status: 'inactive', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { success: false, error: 'فشل تعطيل الموقع.' };
  logCmsAudit({ tenantWebsiteId: id, companyId, action: 'site_deleted', entityType: 'tenant_website', entityId: id, metadata: {} });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// TENANT PAGES
// ─────────────────────────────────────────────────────────────────────────────

export async function listTenantPages(siteId: string): Promise<TenantPage[]> {
  if (!isSupabaseConfigured) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_pages') as any)
    .select('*').eq('tenant_website_id', siteId).is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToTenantPage(r));
}

export async function getTenantPage(siteId: string, slug: string): Promise<TenantPage | null> {
  if (!isSupabaseConfigured) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_pages') as any)
    .select('*').eq('tenant_website_id', siteId).eq('slug', slug).is('deleted_at', null).maybeSingle();
  if (error) return null;
  return data ? rowToTenantPage(data) : null;
}

export async function upsertTenantPage(page: Partial<TenantPage>): Promise<CmsResult<TenantPage>> {
  if (!isSupabaseConfigured) return notConfigured();
  if (!page.title?.trim()) return { success: false, error: 'عنوان الصفحة مطلوب.' };
  const slugErr = validateSlug(page.slug ?? '');
  if (slugErr) return { success: false, error: slugErr };

  const row = {
    ...(page.id ? { id: page.id } : {}),
    tenant_website_id: page.tenantWebsiteId,
    company_id: page.companyId,
    slug: page.slug!.trim(),
    title: page.title.trim(),
    page_type: page.pageType ?? 'custom',
    sections: page.sections ?? [],
    content: page.content ?? null,
    status: page.status ?? 'draft',
    seo_title: page.seoTitle ?? null,
    seo_description: page.seoDescription ?? null,
    canonical_url: page.canonicalUrl ?? null,
    og_image: page.ogImage ?? null,
    og_title: page.ogTitle ?? null,
    og_description: page.ogDescription ?? null,
    robots: page.robots ?? 'index, follow',
    updated_by: page.updatedBy ?? null,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_pages') as any)
    .upsert(row, { onConflict: 'id' }).select().single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'الرابط مستخدم بالفعل في هذا الموقع.' };
    return { success: false, error: 'فشل حفظ الصفحة.' };
  }

  logCmsAudit({ tenantWebsiteId: data.tenant_website_id, companyId: data.company_id, action: page.id ? 'page_updated' : 'page_created', entityType: 'tenant_page', entityId: data.id, entityTitle: data.title, metadata: { slug: data.slug } });
  return { success: true, data: rowToTenantPage(data) };
}

export async function submitPageForReview(pageId: string, userId: string, companyId: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tenant_pages') as any)
    .update({ status: 'under_review', submitted_for_review_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', pageId).eq('status', 'draft');
  if (error) return { success: false, error: 'فشل إرسال الصفحة للمراجعة.' };
  logCmsAudit({ companyId, userId, action: 'page_submitted_for_review', entityType: 'tenant_page', entityId: pageId, metadata: {} });
  return { success: true };
}

export async function approvePage(pageId: string, userId: string, companyId: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tenant_pages') as any)
    .update({ approved_at: new Date().toISOString(), reviewed_by: userId, updated_at: new Date().toISOString() })
    .eq('id', pageId);
  if (error) return { success: false, error: 'فشل اعتماد الصفحة.' };
  logCmsAudit({ companyId, userId, action: 'page_approved', entityType: 'tenant_page', entityId: pageId, metadata: {} });
  return { success: true };
}

export async function publishPage(
  pageId: string, userId: string, companyId: string, userRole?: string
): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  if (userRole === 'EDITOR') {
    return { success: false, error: 'غير مصرح لك بنشر الصفحة. يتطلب هذا الإجراء صلاحية مدير أو ناشر.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pageRow, error: fetchErr } = await (supabase.from('tenant_pages') as any)
    .select('*').eq('id', pageId).maybeSingle();
  if (fetchErr || !pageRow) return { success: false, error: 'الصفحة غير موجودة.' };
  if (!pageRow.title?.trim()) return { success: false, error: 'لا يمكن نشر صفحة بدون عنوان.' };
  const slugErr = validateSlug(pageRow.slug ?? '');
  if (slugErr) return { success: false, error: slugErr };

  await createRevision({ entityType: 'tenant_page', entityId: pageId, tenantWebsiteId: pageRow.tenant_website_id, companyId, contentSnapshot: { ...pageRow }, action: 'publish', changedBy: userId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tenant_pages') as any)
    .update({ status: 'published', published_at: new Date().toISOString(), published_by: userId, updated_at: new Date().toISOString() })
    .eq('id', pageId);
  if (error) return { success: false, error: 'فشل نشر الصفحة.' };

  logCmsAudit({ tenantWebsiteId: pageRow.tenant_website_id, companyId, userId, action: 'page_published', entityType: 'tenant_page', entityId: pageId, entityTitle: pageRow.title, oldValue: { status: pageRow.status }, newValue: { status: 'published' }, metadata: { slug: pageRow.slug } });
  return { success: true };
}

export async function unpublishPage(pageId: string, userId: string, companyId: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tenant_pages') as any)
    .update({ status: 'unpublished', updated_at: new Date().toISOString() }).eq('id', pageId);
  if (error) return { success: false, error: 'فشل إلغاء نشر الصفحة.' };
  logCmsAudit({ companyId, userId, action: 'page_unpublished', entityType: 'tenant_page', entityId: pageId, metadata: {} });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG POSTS
// ─────────────────────────────────────────────────────────────────────────────

export async function listBlogPosts(
  siteId: string,
  options: { status?: CmsPublishStatus; limit?: number; offset?: number } = {}
): Promise<CmsPaginatedResult<CmsBlogPost>> {
  if (!isSupabaseConfigured) return { success: false, data: [], total: 0, page: 1, limit: 20 };

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('cms_blog_posts') as any)
    .select('*', { count: 'exact' })
    .eq('tenant_website_id', siteId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) query = query.eq('status', options.status);

  const { data, error, count } = await query;
  if (error) return { success: false, data: [], total: 0, page: 1, limit };

  return {
    success: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: (data ?? []).map((r: any) => rowToBlogPost(r)),
    total: count ?? 0,
    page: Math.floor(offset / limit) + 1,
    limit,
  };
}

export async function getBlogPost(siteId: string, slug: string): Promise<CmsBlogPost | null> {
  if (!isSupabaseConfigured) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cms_blog_posts') as any)
    .select('*').eq('tenant_website_id', siteId).eq('slug', slug).is('deleted_at', null).maybeSingle();
  if (error) return null;
  return data ? rowToBlogPost(data) : null;
}

export async function upsertBlogPost(post: Partial<CmsBlogPost>): Promise<CmsResult<CmsBlogPost>> {
  if (!isSupabaseConfigured) return notConfigured();
  if (!post.title?.trim()) return { success: false, error: 'عنوان المقال مطلوب.' };
  const slugErr = validateSlug(post.slug ?? '');
  if (slugErr) return { success: false, error: slugErr };

  const { wordCount, readingTimeMinutes } = estimateReadingTime(post.content ?? '');

  const row = {
    ...(post.id ? { id: post.id } : {}),
    tenant_website_id: post.tenantWebsiteId,
    company_id: post.companyId,
    slug: post.slug!.trim(),
    title: post.title.trim(),
    excerpt: post.excerpt ?? null,
    content: post.content ?? null,
    cover_image: post.coverImage ?? null,
    cover_image_alt: post.coverImageAlt ?? null,
    category: post.category ?? null,
    tags: post.tags ?? [],
    author_id: post.authorId ?? null,
    author_name: post.authorName ?? null,
    status: post.status ?? 'draft',
    word_count: wordCount,
    reading_time_minutes: readingTimeMinutes,
    seo_title: post.seoTitle ?? null,
    seo_description: post.seoDescription ?? null,
    canonical_url: post.canonicalUrl ?? null,
    og_image: post.ogImage ?? null,
    og_title: post.ogTitle ?? null,
    og_description: post.ogDescription ?? null,
    robots: post.robots ?? 'index, follow',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cms_blog_posts') as any)
    .upsert(row, { onConflict: 'id' }).select().single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'الرابط مستخدم بالفعل في هذا الموقع.' };
    return { success: false, error: 'فشل حفظ المقال.' };
  }

  logCmsAudit({ tenantWebsiteId: data.tenant_website_id, companyId: data.company_id, action: post.id ? 'post_updated' : 'post_created', entityType: 'cms_blog_post', entityId: data.id, entityTitle: data.title, metadata: { slug: data.slug } });
  return { success: true, data: rowToBlogPost(data) };
}

export async function submitPostForReview(postId: string, userId: string, companyId: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_blog_posts') as any)
    .update({ status: 'under_review', submitted_for_review_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', postId).eq('status', 'draft');
  if (error) return { success: false, error: 'فشل إرسال المقال للمراجعة.' };
  logCmsAudit({ companyId, userId, action: 'post_submitted_for_review', entityType: 'cms_blog_post', entityId: postId, metadata: {} });
  return { success: true };
}

export async function publishBlogPost(
  postId: string, userId: string, companyId: string, userRole?: string
): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  if (userRole === 'EDITOR') {
    return { success: false, error: 'غير مصرح لك بنشر المقال. يتطلب هذا الإجراء صلاحية مدير أو ناشر.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: postRow, error: fetchErr } = await (supabase.from('cms_blog_posts') as any)
    .select('*').eq('id', postId).maybeSingle();
  if (fetchErr || !postRow) return { success: false, error: 'المقال غير موجود.' };
  if (!postRow.title?.trim()) return { success: false, error: 'لا يمكن نشر مقال بدون عنوان.' };
  if (!postRow.excerpt?.trim()) return { success: false, error: 'الملخص (excerpt) مطلوب للنشر.' };

  await createRevision({ entityType: 'cms_blog_post', entityId: postId, tenantWebsiteId: postRow.tenant_website_id, companyId, contentSnapshot: { ...postRow }, action: 'publish', changedBy: userId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_blog_posts') as any)
    .update({ status: 'published', published_at: new Date().toISOString(), published_by: userId, updated_at: new Date().toISOString() })
    .eq('id', postId);
  if (error) return { success: false, error: 'فشل نشر المقال.' };

  logCmsAudit({ tenantWebsiteId: postRow.tenant_website_id, companyId, userId, action: 'post_published', entityType: 'cms_blog_post', entityId: postId, entityTitle: postRow.title, oldValue: { status: postRow.status }, newValue: { status: 'published' }, metadata: { slug: postRow.slug } });
  return { success: true };
}

export async function unpublishBlogPost(postId: string, userId: string, companyId: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_blog_posts') as any)
    .update({ status: 'unpublished', updated_at: new Date().toISOString() }).eq('id', postId);
  if (error) return { success: false, error: 'فشل إلغاء نشر المقال.' };
  logCmsAudit({ companyId, userId, action: 'post_unpublished', entityType: 'cms_blog_post', entityId: postId, metadata: {} });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadCmsMedia(
  file: File, siteId: string, companyId: string, uploadedByName: string
): Promise<CmsResult<CmsMedia>> {
  if (!isSupabaseConfigured) return notConfigured();

  const timestamp = Date.now();
  const safeFilename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storagePath = `${companyId}/${siteId}/${safeFilename}`;
  const bucketName = 'cms_media';

  const { error: uploadError } = await supabase.storage
    .from(bucketName).upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) return { success: false, error: 'فشل رفع الملف. تأكد من إعداد bucket cms_media في Supabase.' };

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

  const mediaType = file.type.startsWith('image/') ? 'image' : 'document';

  const row = {
    tenant_website_id: siteId,
    company_id: companyId,
    bucket_name: bucketName,
    storage_path: storagePath,
    public_url: urlData.publicUrl,
    filename: safeFilename,
    original_filename: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
    media_type: mediaType,
    uploaded_by_name: uploadedByName,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cms_media') as any).insert(row).select().single();

  if (error) {
    await supabase.storage.from(bucketName).remove([storagePath]).catch(() => {});
    return { success: false, error: 'فشل حفظ معلومات الملف.' };
  }

  logCmsAudit({ tenantWebsiteId: siteId, companyId, action: 'media_uploaded', entityType: 'cms_media', entityId: data.id, entityTitle: file.name, metadata: { mimeType: file.type, size: file.size } });
  return { success: true, data: rowToMedia(data) };
}

export async function listCmsMedia(siteId: string): Promise<CmsMedia[]> {
  if (!isSupabaseConfigured) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('cms_media') as any)
    .select('*').eq('tenant_website_id', siteId).is('deleted_at', null)
    .order('created_at', { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToMedia(r));
}

export async function updateCmsMediaAltText(id: string, altText: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_media') as any)
    .update({ alt_text: altText, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { success: false, error: 'فشل تحديث النص البديل.' };
  return { success: true };
}

export async function deleteCmsMedia(id: string, companyId: string, userId: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mediaRow } = await (supabase.from('cms_media') as any)
    .select('storage_path, bucket_name, original_filename, tenant_website_id').eq('id', id).maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_media') as any)
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq('id', id);
  if (error) return { success: false, error: 'فشل حذف الملف.' };

  if (mediaRow?.storage_path && mediaRow?.bucket_name) {
    await supabase.storage.from(mediaRow.bucket_name).remove([mediaRow.storage_path]).catch(() => {});
  }

  logCmsAudit({ tenantWebsiteId: mediaRow?.tenant_website_id, companyId, userId, action: 'media_deleted', entityType: 'cms_media', entityId: id, entityTitle: mediaRow?.original_filename, metadata: {} });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// REVISIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function listRevisions(entityType: CmsEntityType, entityId: string): Promise<CmsContentRevision[]> {
  if (!isSupabaseConfigured) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('cms_content_revisions') as any)
    .select('*').eq('entity_type', entityType).eq('entity_id', entityId)
    .order('version', { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToRevision(r));
}

export async function restoreRevision(
  revisionId: string, restoredBy: string, restoredByName: string, companyId: string, changeReason?: string
): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rev, error: revErr } = await (supabase.from('cms_content_revisions') as any)
    .select('*').eq('id', revisionId).maybeSingle();
  if (revErr || !rev) return { success: false, error: 'النسخة غير موجودة.' };

  const snapshot = rev.content_snapshot as Record<string, unknown>;
  const table = rev.entity_type === 'tenant_page' ? 'tenant_pages' : rev.entity_type === 'cms_blog_post' ? 'cms_blog_posts' : 'cms_hero_banners';

  const restoreData = { ...snapshot, status: 'draft', updated_at: new Date().toISOString(), updated_by: restoredBy, id: rev.entity_id, published_at: null, published_by: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any).update(restoreData).eq('id', rev.entity_id);
  if (error) return { success: false, error: 'فشل استعادة النسخة.' };

  await createRevision({ entityType: rev.entity_type, entityId: rev.entity_id, tenantWebsiteId: rev.tenant_website_id, companyId, contentSnapshot: snapshot, action: 'restore', changedBy: restoredBy, changedByName: restoredByName, changeReason: changeReason ?? `استعادة من النسخة ${rev.version}` });

  logCmsAudit({ tenantWebsiteId: rev.tenant_website_id, companyId, userId: restoredBy, userName: restoredByName, action: 'revision_restored', entityType: rev.entity_type, entityId: rev.entity_id, metadata: { restoredFromVersion: rev.version, reason: changeReason } });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO BANNERS
// ─────────────────────────────────────────────────────────────────────────────

export async function listHeroBanners(siteId: string): Promise<CmsHeroBanner[]> {
  if (!isSupabaseConfigured) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('cms_hero_banners') as any)
    .select('*').eq('tenant_website_id', siteId).order('display_order', { ascending: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToHeroBanner(r));
}

export async function upsertHeroBanner(banner: Partial<CmsHeroBanner>): Promise<CmsResult<CmsHeroBanner>> {
  if (!isSupabaseConfigured) return notConfigured();
  if (!banner.title?.trim()) return { success: false, error: 'عنوان البانر مطلوب.' };

  const row = {
    ...(banner.id ? { id: banner.id } : {}),
    tenant_website_id: banner.tenantWebsiteId,
    company_id: banner.companyId,
    title: banner.title.trim(),
    subtitle: banner.subtitle ?? null,
    body_text: banner.bodyText ?? null,
    image_url: banner.imageUrl ?? null,
    image_alt: banner.imageAlt ?? null,
    video_url: banner.videoUrl ?? null,
    cta_text: banner.ctaText ?? null,
    cta_link: banner.ctaLink ?? null,
    cta_secondary_text: banner.ctaSecondaryText ?? null,
    cta_secondary_link: banner.ctaSecondaryLink ?? null,
    display_order: banner.displayOrder ?? 0,
    is_active: banner.isActive ?? true,
    active_from: banner.activeFrom ?? null,
    active_until: banner.activeUntil ?? null,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cms_hero_banners') as any)
    .upsert(row, { onConflict: 'id' }).select().single();
  if (error) return { success: false, error: 'فشل حفظ البانر.' };
  return { success: true, data: rowToHeroBanner(data) };
}

export async function deleteHeroBanner(id: string): Promise<CmsResult<void>> {
  if (!isSupabaseConfigured) return notConfigured();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cms_hero_banners') as any).delete().eq('id', id);
  if (error) return { success: false, error: 'فشل حذف البانر.' };
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING REVIEW
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingReviewItem {
  id: string;
  type: 'page' | 'post';
  title: string;
  slug: string;
  siteId: string;
  submittedAt: string;
}

export async function listPendingReviewItems(companyId: string): Promise<PendingReviewItem[]> {
  if (!isSupabaseConfigured) return [];

  const [pagesResult, postsResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('tenant_pages') as any).select('id, title, slug, tenant_website_id, submitted_for_review_at')
      .eq('company_id', companyId).eq('status', 'under_review').is('deleted_at', null)
      .order('submitted_for_review_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('cms_blog_posts') as any).select('id, title, slug, tenant_website_id, submitted_for_review_at')
      .eq('company_id', companyId).eq('status', 'under_review').is('deleted_at', null)
      .order('submitted_for_review_at', { ascending: true }),
  ]);

  const items: PendingReviewItem[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pagesResult.data ?? []).forEach((r: any) => items.push({ id: r.id, type: 'page', title: r.title, slug: r.slug, siteId: r.tenant_website_id, submittedAt: r.submitted_for_review_at ?? '' }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (postsResult.data ?? []).forEach((r: any) => items.push({ id: r.id, type: 'post', title: r.title, slug: r.slug, siteId: r.tenant_website_id, submittedAt: r.submitted_for_review_at ?? '' }));

  return items.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// SLUG UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function generateSlug(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[\u0600-\u06FF]/g, '')  // Remove Arabic chars (not URL-safe)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || `item-${Date.now()}`;
}

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const RESERVED = new Set(['www','api','admin','app','erp','mail','smtp','ftp','dev','staging','test','portal','cms','static','media','assets','cdn']);
  if (RESERVED.has(subdomain.toLowerCase())) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('tenant_websites') as any)
    .select('id').eq('subdomain', subdomain).maybeSingle();
  return !data;
}
