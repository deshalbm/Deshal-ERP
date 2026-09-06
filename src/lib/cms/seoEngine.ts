/**
 * Pure SEO / GEO / AEO / SMO / Schema.org Utility Engine for Deshal ERP CMS.
 * Shared between client React components and server-side rendering logic.
 */

import { CmsSeoFields, TenantWebsiteSettings } from '../../types/cms';

export interface SchemaOrgBuildParams {
  siteName: string;
  domain: string;
  pageTitle: string;
  pageDescription?: string;
  canonicalUrl: string;
  logoUrl?: string;
  ogImage?: string;
  pageType?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  authorCredentials?: string;
  publisherName?: string;
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  localSettings?: TenantWebsiteSettings;
  entityType?: string;
}

/**
 * Normalizes a URL to serve as a clean, duplicate-free Canonical URL.
 * Strips tracking parameters (utm_*, gclid, fbclid) while preserving structure.
 */
export function normalizeCanonicalUrl(rawHostname: string, rawPath: string, options?: { forceHttps?: boolean; trailingSlash?: boolean }): string {
  try {
    let hostname = (rawHostname || '').split(':')[0].toLowerCase().trim();
    if (hostname.startsWith('www.')) hostname = hostname.slice(4);

    let path = rawPath || '/';
    // Remove query string tracking params
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?');
      const params = new URLSearchParams(queryString);
      const cleanParams = new URLSearchParams();
      // Keep only pagination or functional params
      ['page', 'lang', 'p'].forEach(key => {
        if (params.has(key)) cleanParams.set(key, params.get(key)!);
      });
      const q = cleanParams.toString();
      path = basePath + (q ? `?${q}` : '');
    }

    // Trailing slash policy: default remove trailing slash except root
    if (options?.trailingSlash && !path.endsWith('/')) {
      path += '/';
    } else if (!options?.trailingSlash && path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    const scheme = options?.forceHttps === false ? 'http' : 'https';
    return `${scheme}://${hostname}${path.startsWith('/') ? path : `/${path}`}`;
  } catch {
    return `https://${rawHostname}${rawPath}`;
  }
}

/**
 * Validates and normalizes URL slugs.
 */
export function validateSlug(rawSlug: string): { isValid: boolean; error?: string; normalizedSlug: string } {
  if (!rawSlug || !rawSlug.trim()) {
    return { isValid: false, error: 'الرابط (Slug) مطلوب', normalizedSlug: '' };
  }

  const normalized = rawSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!normalized) {
    return { isValid: false, error: 'الرابط يحتوي على رموز غير مسموح بها', normalizedSlug: '' };
  }

  return { isValid: true, normalizedSlug: normalized };
}

/**
 * Builds Schema.org JSON-LD structured data graph array.
 */
export function generateSchemaOrgGraph(params: SchemaOrgBuildParams): Record<string, unknown> {
  const {
    siteName,
    domain,
    pageTitle,
    pageDescription,
    canonicalUrl,
    logoUrl,
    ogImage,
    pageType = 'WebPage',
    datePublished,
    dateModified,
    authorName,
    authorCredentials,
    faqs,
    breadcrumbs,
    localSettings,
  } = params;

  const graph: Array<Record<string, unknown>> = [];

  // 1. Organization / LocalBusiness
  const isLocal = !!(localSettings?.address || localSettings?.localGeoLatitude);
  const orgType = isLocal ? (localSettings?.localBusinessType || 'LocalBusiness') : 'Organization';

  const orgSchema: Record<string, unknown> = {
    '@type': orgType,
    '@id': `${canonicalUrl}#organization`,
    name: siteName,
    url: `https://${domain}`,
    logo: logoUrl ? { '@type': 'ImageObject', url: logoUrl } : undefined,
  };

  if (localSettings?.address) orgSchema.address = localSettings.address;
  if (localSettings?.phone) orgSchema.telephone = localSettings.phone;
  if (localSettings?.email) orgSchema.email = localSettings.email;

  if (localSettings?.localGeoLatitude && localSettings?.localGeoLongitude) {
    orgSchema.geo = {
      '@type': 'GeoCoordinates',
      latitude: localSettings.localGeoLatitude,
      longitude: localSettings.localGeoLongitude,
    };
  }

  if (localSettings?.social) {
    const sameAs = Object.values(localSettings.social).filter(Boolean);
    if (sameAs.length > 0) orgSchema.sameAs = sameAs;
  }

  graph.push(orgSchema);

  // 2. WebSite
  graph.push({
    '@type': 'WebSite',
    '@id': `https://${domain}/#website`,
    url: `https://${domain}`,
    name: siteName,
    publisher: { '@id': `${canonicalUrl}#organization` },
    inLanguage: 'ar',
  });

  // 3. WebPage or BlogPosting
  if (pageType === 'BlogPosting' || pageType === 'Article') {
    const articleSchema: Record<string, unknown> = {
      '@type': 'BlogPosting',
      '@id': `${canonicalUrl}#article`,
      isPartOf: { '@id': `https://${domain}/#website` },
      headline: pageTitle,
      description: pageDescription || '',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      image: ogImage ? [ogImage] : logoUrl ? [logoUrl] : undefined,
      datePublished: datePublished || new Date().toISOString(),
      dateModified: dateModified || datePublished || new Date().toISOString(),
      publisher: { '@id': `${canonicalUrl}#organization` },
      inLanguage: 'ar',
    };

    if (authorName) {
      articleSchema.author = {
        '@type': 'Person',
        name: authorName,
        jobTitle: authorCredentials || undefined,
      };
    }

    graph.push(articleSchema);
  } else {
    const webPageSchema: Record<string, unknown> = {
      '@type': pageType === 'about' ? 'AboutPage' : pageType === 'contact' ? 'ContactPage' : 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: pageTitle,
      description: pageDescription || '',
      isPartOf: { '@id': `https://${domain}/#website` },
      about: { '@id': `${canonicalUrl}#organization` },
      inLanguage: 'ar',
    };

    graph.push(webPageSchema);
  }

  // 4. BreadcrumbList Schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    });
  }

  // 5. FAQPage Schema
  if (faqs && faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/**
 * Real-time SEO & Content Health Score Calculator (0 - 100)
 */
export function calculateSeoScore(data: {
  title?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  focusKeyword?: string;
  content?: string;
  hasAltText?: boolean;
  hasH1?: boolean;
  hasFaqs?: boolean;
  geoPrimaryQuestion?: string;
  geoDirectAnswer?: string;
}): { score: number; issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; code: string }> } {
  let score = 100;
  const issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; code: string }> = [];

  const title = data.seoTitle || data.title || '';
  const desc = data.seoDescription || '';

  // Title checks
  if (!title.trim()) {
    score -= 25;
    issues.push({ type: 'error', message: 'عنوان الصفحة (SEO Title) مفقود', code: 'MISSING_TITLE' });
  } else if (title.length < 30) {
    score -= 5;
    issues.push({ type: 'warning', message: 'عنوان الصفحة قصير جداً (يفضل بين 50 و 60 حرفاً)', code: 'TITLE_TOO_SHORT' });
  } else if (title.length > 70) {
    score -= 5;
    issues.push({ type: 'warning', message: 'عنوان الصفحة طويل جداً قد يتم قطعه في محركات البحث (> 70 حرفاً)', code: 'TITLE_TOO_LONG' });
  }

  // Description checks
  if (!desc.trim()) {
    score -= 20;
    issues.push({ type: 'error', message: 'وصف الصفحة (Meta Description) مفقود', code: 'MISSING_DESC' });
  } else if (desc.length < 70) {
    score -= 5;
    issues.push({ type: 'warning', message: 'وصف الصفحة قصير جداً (يفضل بين 120 و 160 حرفاً)', code: 'DESC_TOO_SHORT' });
  } else if (desc.length > 165) {
    score -= 5;
    issues.push({ type: 'warning', message: 'وصف الصفحة تجاوز 160 حرفاً وسيقوم Google بقطعه', code: 'DESC_TOO_LONG' });
  }

  // Focus keyword check
  if (!data.focusKeyword?.trim()) {
    score -= 10;
    issues.push({ type: 'warning', message: 'لم يتم تحديد الكلمة المفتاحية المستهدفة (Focus Keyword)', code: 'MISSING_FOCUS_KEYWORD' });
  } else {
    const kw = data.focusKeyword.toLowerCase();
    if (!title.toLowerCase().includes(kw)) {
      score -= 5;
      issues.push({ type: 'info', message: 'الكلمة المفتاحية غير موجودة في عنوان الصفحة (SEO Title)', code: 'KEYWORD_NOT_IN_TITLE' });
    }
    if (!desc.toLowerCase().includes(kw)) {
      score -= 5;
      issues.push({ type: 'info', message: 'الكلمة المفتاحية غير موجودة في وصف الصفحة', code: 'KEYWORD_NOT_IN_DESC' });
    }
  }

  // Image & Alt checks
  if (!data.ogImage) {
    score -= 10;
    issues.push({ type: 'warning', message: 'صورة المشاركة الاجتماعية (OpenGraph / Social Image) مفقودة', code: 'MISSING_OG_IMAGE' });
  }

  if (data.hasAltText === false) {
    score -= 10;
    issues.push({ type: 'error', message: 'يوجد صور تفتقر للنص البديل (Alt text)', code: 'MISSING_ALT_TEXT' });
  }

  // GEO & AEO Checks
  if (!data.geoPrimaryQuestion || !data.geoDirectAnswer) {
    score -= 5;
    issues.push({ type: 'info', message: 'إعدادات الإجابة المباشرة (GEO/AEO Direct Answer) غير مكتملة', code: 'GEO_MISSING_ANSWER' });
  }

  return {
    score: Math.max(0, score),
    issues,
  };
}
