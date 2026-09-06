import { resolveHostname } from './tenantResolver';
import { generateSitemapXml } from './TenantSitemapGenerator';
import { validateSlug } from '../supabase/cmsService';

async function runAuditTests() {
  console.log('=== STARTING SECURITY & CMS INTEGRATION TESTS ===');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Reserved Subdomains Test
  console.log('\n--- 1. Hostname & Subdomain Security ---');
  const mockSupabase: any = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
  };

  const reservedDomains = ['www.alshamil.om', 'api.alshamil.om', 'admin.alshamil.om', 'erp.deshalbm.com'];
  for (const domain of reservedDomains) {
    const res = await resolveHostname(domain, mockSupabase);
    assert(res === null, `Reject reserved domain / app domain: ${domain}`);
  }

  // 2. Slug Validation Security
  console.log('\n--- 2. Slug Security & Injection Prevention ---');
  assert(validateSlug('about-us') === null, 'Valid slug "about-us" accepted');
  assert(validateSlug('about_us') !== null, 'Invalid slug with underscore rejected');
  assert(validateSlug('about/us') !== null, 'Slug with slash rejected');
  assert(validateSlug('<script>') !== null, 'XSS attack slug rejected');
  assert(validateSlug('../admin') !== null, 'Path traversal slug rejected');

  // 3. Sitemap Isolation Test
  console.log('\n--- 3. Sitemap Tenant Isolation ---');
  const tenantAContext: any = {
    siteId: 'site-uuid-tenant-a',
    companyId: 'company-a',
    domain: 'tenant-a.alshamil.om',
    siteType: 'tenant',
    primaryLanguage: 'ar',
    template: 'corporate',
    name: 'Tenant A',
    settings: {},
  };

  const mockSupabaseForSitemap: any = {
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: string) => ({
          eq: (col2: string, val2: string) => ({
            is: () => {
              if (val === 'site-uuid-tenant-a') {
                return {
                  data: [
                    { slug: 'about', updated_at: '2026-01-01T00:00:00Z', canonical_url: null },
                  ],
                };
              }
              return { data: [] };
            },
          }),
        }),
      }),
    }),
  };

  const xml = await generateSitemapXml(tenantAContext, mockSupabaseForSitemap);
  assert(xml.includes('https://tenant-a.alshamil.om/about'), 'Sitemap contains Tenant A domain URL');
  assert(!xml.includes('tenant-b'), 'Sitemap does NOT contain Tenant B URLs');

  console.log(`\n=== TEST SUMMARY: ${passed}/${total} PASSED ===`);
}

runAuditTests().catch(console.error);
