/**
 * SERVER-SIDE ONLY - Do NOT import this file into React components or any client-side code.
 * This file is intended to be imported by server.ts only.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ResolvedSiteContext } from '../../types/cms';

function getBaseUrl(siteContext: ResolvedSiteContext): string {
    if (siteContext.domain) {
        return siteContext.domain.startsWith('http') ? siteContext.domain : `https://${siteContext.domain}`;
    }
    return ''; // Fallback, shouldn't really happen if properly validated
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export async function generateSitemapXml(siteContext: ResolvedSiteContext, supabaseServiceClient: SupabaseClient): Promise<string> {
    const baseUrl = getBaseUrl(siteContext);
    const now = new Date().toISOString();

    const generateMinimalSitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${escapeXml(baseUrl)}/</loc>
        <lastmod>${now}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>`;

    if (!siteContext || !siteContext.siteId) {
        return generateMinimalSitemap();
    }

    try {
        const [pagesRes, postsRes] = await Promise.all([
            supabaseServiceClient
                .from('tenant_pages')
                .select('slug, updated_at, canonical_url')
                .eq('site_id', siteContext.siteId)
                .eq('status', 'published')
                .is('deleted_at', null),
            
            supabaseServiceClient
                .from('cms_blog_posts')
                .select('slug, updated_at, canonical_url')
                .eq('site_id', siteContext.siteId)
                .eq('status', 'published')
                .is('deleted_at', null)
        ]);

        const pages = pagesRes.data || [];
        const posts = postsRes.data || [];

        let urlsXml = '';

        // Add home page if not in pages
        const hasHomePage = pages.some(p => p.slug === '/' || p.slug === 'home' || p.slug === '');
        if (!hasHomePage && baseUrl) {
             urlsXml += `
    <url>
        <loc>${escapeXml(baseUrl)}/</loc>
        <lastmod>${now}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>`;
        }

        // Add pages
        for (const page of pages) {
            let loc = baseUrl;
            if (page.canonical_url) {
                loc = page.canonical_url;
            } else if (page.slug && page.slug !== '/' && page.slug !== 'home') {
                loc = `${baseUrl}/${page.slug.replace(/^\/+/, '')}`;
            } else {
                loc = `${baseUrl}/`;
            }

            const priority = (page.slug === '/' || page.slug === 'home' || page.slug === '') ? '1.0' : '0.8';
            const lastmod = page.updated_at ? new Date(page.updated_at).toISOString() : now;

            urlsXml += `
    <url>
        <loc>${escapeXml(loc)}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${priority}</priority>
    </url>`;
        }

        // Add blog posts
        for (const post of posts) {
            let loc = baseUrl;
            if (post.canonical_url) {
                loc = post.canonical_url;
            } else {
                loc = `${baseUrl}/blog/${post.slug.replace(/^\/+/, '')}`;
            }

            const lastmod = post.updated_at ? new Date(post.updated_at).toISOString() : now;

            urlsXml += `
    <url>
        <loc>${escapeXml(loc)}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlsXml}
</urlset>`;

    } catch (error) {
        console.warn(`[TenantSitemapGenerator] Error generating sitemap for site ${siteContext.siteId}:`, error);
        return generateMinimalSitemap();
    }
}
