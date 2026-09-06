import React, { useEffect } from 'react';
import { CmsSeoFields, TenantWebsiteSettings } from '../../types/cms';
import { generateSchemaOrgGraph, normalizeCanonicalUrl } from '../../lib/cms/seoEngine';

interface DynamicMetadataEngineProps {
  seo: CmsSeoFields;
  siteName: string;
  domain: string;
  pageTitle: string;
  path: string;
  logoUrl?: string;
  pageType?: string;
  settings?: TenantWebsiteSettings;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const DynamicMetadataEngine: React.FC<DynamicMetadataEngineProps> = ({
  seo,
  siteName,
  domain,
  pageTitle,
  path,
  logoUrl,
  pageType = 'WebPage',
  settings,
  breadcrumbs,
}) => {
  useEffect(() => {
    const finalTitle = seo.seoTitle || `${pageTitle} — ${siteName}`;
    const finalDescription = seo.seoDescription || settings?.footerText || `${siteName} — ${pageTitle}`;
    const canonical = seo.canonicalUrl || normalizeCanonicalUrl(domain || window.location.hostname, path);
    const origin = window.location.origin;
    let rawOgImage = seo.ogImage || logoUrl || '/assets/images/deshal_logo.png';
    const ogImage = rawOgImage.startsWith('http') ? rawOgImage : `${origin}${rawOgImage.startsWith('/') ? '' : '/'}${rawOgImage}`;
    const twitterImage = seo.twitterImage ? (seo.twitterImage.startsWith('http') ? seo.twitterImage : `${origin}${seo.twitterImage.startsWith('/') ? '' : '/'}${seo.twitterImage}`) : ogImage;
    const twitterCard = seo.twitterCard || 'summary_large_image';

    // 1. Update Title
    document.title = finalTitle;

    // Helper to update or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to update or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Standard Meta & Icon Tags
    setMetaTag('meta[name="description"]', 'name', 'description', finalDescription);
    setMetaTag('meta[name="robots"]', 'name', 'robots', seo.robots || 'index, follow');
    setLinkTag('canonical', canonical);
    const faviconUrl = logoUrl || '/favicon.png';
    setLinkTag('icon', faviconUrl);
    setLinkTag('shortcut icon', '/favicon.ico');
    setLinkTag('apple-touch-icon', logoUrl || '/apple-touch-icon.png');

    // 3. OpenGraph Meta Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', seo.ogTitle || finalTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', seo.ogDescription || finalDescription);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', ogImage);
    setMetaTag('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/png');
    setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1600');
    setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '1600');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', pageType === 'BlogPosting' ? 'article' : 'website');
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteName);

    // 4. Twitter Card Meta Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', twitterCard);
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', seo.twitterTitle || finalTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', seo.twitterDescription || finalDescription);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', twitterImage);

    // 5. Schema.org JSON-LD Graph
    const schemaGraph = generateSchemaOrgGraph({
      siteName,
      domain: domain || window.location.hostname,
      pageTitle: finalTitle,
      pageDescription: finalDescription,
      canonicalUrl: canonical,
      logoUrl,
      ogImage,
      pageType,
      authorName: seo.eeatAuthorName,
      authorCredentials: seo.eeatAuthorCredentials,
      faqs: seo.geoFaqs,
      breadcrumbs,
      localSettings: settings,
    });

    let scriptEl = document.querySelector('script[data-schema="dynamic-jsonld"]') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.setAttribute('type', 'application/ld+json');
      scriptEl.setAttribute('data-schema', 'dynamic-jsonld');
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schemaGraph);
  }, [seo, siteName, domain, pageTitle, path, logoUrl, pageType, settings, breadcrumbs]);

  return null;
};
