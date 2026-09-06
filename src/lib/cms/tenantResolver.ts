/**
 * SERVER-SIDE ONLY — Do NOT import this file into React components or any client-side code.
 * This file is intended to be imported ONLY by server.ts.
 * It uses the Supabase service role client which bypasses RLS.
 * The service role key must NEVER appear in any browser bundle.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { ResolvedSiteContext } from '../../types/cms';

// ─── Cache (60-second TTL to reduce DB round trips) ──────────────────────────
const CACHE_TTL_MS = 60 * 1_000;

interface CacheEntry {
  data: ResolvedSiteContext | null;
  timestamp: number;
}

const siteCache = new Map<string, CacheEntry>();

export function invalidateSiteCache(hostname?: string): void {
  if (hostname) {
    siteCache.delete(hostname);
  } else {
    siteCache.clear();
  }
}

// ─── Domain Lists ─────────────────────────────────────────────────────────────

/** Domains that map to the official Al-Shamil site */
const OFFICIAL_DOMAINS = new Set([
  'alshamil.om',
  'deshalbm.com',
]);

/** Domains that are the ERP app itself — return null (not a public website) */
const ERP_APP_DOMAINS = new Set([
  'erp.deshalbm.com',
  'localhost',
  '127.0.0.1',
]);

/** Subdomains reserved for system use — never allocatable to tenants */
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'app', 'erp', 'mail', 'smtp', 'ftp',
  'dev', 'staging', 'test', 'portal', 'cms', 'static', 'media',
  'assets', 'cdn', 'ns', 'ns1', 'ns2', 'mx', 'pop', 'imap', 'autodiscover',
]);

/** Base domain for tenant subdomains */
const TENANT_BASE_DOMAIN = 'alshamil.om';

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToContext(row: any): ResolvedSiteContext {
  return {
    siteId: row.id,
    siteType: row.site_type,
    companyId: row.company_id,
    domain: row.domain ?? row.subdomain ?? '',
    primaryLanguage: row.primary_language ?? 'ar',
    template: row.template ?? 'corporate',
    name: row.name,
    logoUrl: row.logo_url ?? undefined,
    settings: typeof row.settings === 'object' ? row.settings : {},
  };
}

// ─── Main Resolver ────────────────────────────────────────────────────────────

/**
 * Resolves a hostname to a site context by querying the tenant_websites table.
 *
 * Security guarantees:
 * - Uses service role client (bypasses RLS) for read-only lookup only.
 * - The tenant_id / company_id are NEVER taken from the request body.
 * - Reserved + unknown hostnames return null — caller must respond with 404.
 * - Results are cached for 60 s to reduce DB load.
 */
export async function resolveHostname(
  rawHostname: string,
  supabaseServiceClient: SupabaseClient,
): Promise<ResolvedSiteContext | null> {
  try {
    // Strip port and lowercase
    const cleanHostname = rawHostname.split(':')[0].toLowerCase().trim();

    // Strip www. prefix for matching
    const hostname = cleanHostname.startsWith('www.')
      ? cleanHostname.slice(4)
      : cleanHostname;

    // Cache hit
    const cached = siteCache.get(hostname);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    let result: ResolvedSiteContext | null = null;

    if (ERP_APP_DOMAINS.has(hostname)) {
      // ERP app domain — not a public CMS site
      result = null;

    } else if (OFFICIAL_DOMAINS.has(hostname)) {
      // Official company site
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseServiceClient.from('tenant_websites') as any)
        .select('id, site_type, company_id, domain, subdomain, primary_language, template, name, logo_url, settings')
        .eq('domain', hostname)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.warn(`[TenantResolver] DB error resolving official domain "${hostname}":`, error.message);
      } else if (data) {
        result = rowToContext(data);
      } else {
        // Fall back to site_type='official' lookup if domain column isn't set yet
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: offData, error: offError } = await (supabaseServiceClient.from('tenant_websites') as any)
          .select('id, site_type, company_id, domain, subdomain, primary_language, template, name, logo_url, settings')
          .eq('site_type', 'official')
          .eq('status', 'active')
          .maybeSingle();

        if (offError) {
          console.warn(`[TenantResolver] DB error fetching official site:`, offError.message);
        } else if (offData) {
          result = rowToContext(offData);
        }
      }

    } else if (hostname.endsWith(`.${TENANT_BASE_DOMAIN}`)) {
      // Potential tenant subdomain
      const subdomain = hostname.slice(0, hostname.length - TENANT_BASE_DOMAIN.length - 1);

      if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
        console.warn(`[TenantResolver] Rejected reserved/empty subdomain: "${subdomain}" from "${rawHostname}"`);
        result = null;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseServiceClient.from('tenant_websites') as any)
          .select('id, site_type, company_id, domain, subdomain, primary_language, template, name, logo_url, settings')
          .eq('subdomain', subdomain)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.warn(`[TenantResolver] DB error resolving subdomain "${subdomain}":`, error.message);
        } else {
          result = data ? rowToContext(data) : null;
        }
      }

    } else {
      // Unknown domain — could be a custom domain for a tenant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseServiceClient.from('tenant_websites') as any)
        .select('id, site_type, company_id, domain, subdomain, primary_language, template, name, logo_url, settings')
        .eq('domain', hostname)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.warn(`[TenantResolver] DB error resolving custom domain "${hostname}":`, error.message);
      } else {
        result = data ? rowToContext(data) : null;
      }
    }

    // Cache result (including null results to avoid repeated DB hits for unknown domains)
    siteCache.set(hostname, { data: result, timestamp: Date.now() });

    return result;
  } catch (err) {
    console.warn(`[TenantResolver] Unexpected error resolving "${rawHostname}":`, err);
    return null;
  }
}
