import {
  normalizeCanonicalUrl,
  validateSlug,
  generateSchemaOrgGraph,
  calculateSeoScore,
} from '../lib/cms/seoEngine';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetail) console.error(`     Detail: ${failureDetail}`);
  }
}

export async function runSeoEngineTests() {
  console.log('\n================================================================');
  console.log('  DESHAL ERP — ENTERPRISE SEO, GEO, AEO, SMO ENGINE TEST SUITE');
  console.log('================================================================\n');

  // [Test 1] Canonical Normalization
  console.log('[Test 1] Canonical URL Normalization & Tracking Param Stripping');
  const rawHost = 'www.alshamil.om:443';
  const rawPath = '/services?utm_source=google&utm_medium=cpc&page=2';
  const canonical = normalizeCanonicalUrl(rawHost, rawPath);
  assert(canonical === 'https://alshamil.om/services?page=2', 'Strips tracking parameters (utm_*) while retaining functional pagination (page=2)');

  // [Test 2] Safe Slug Validation
  console.log('\n[Test 2] Safe Arabic & Latin Slug Normalization');
  const res = validateSlug('  الخدمات الاستشارية والمشروعات!  ');
  assert(res.isValid === true, 'Arabic text is validated as valid slug');
  assert(res.normalizedSlug === 'الخدمات-الاستشارية-والمشروعات', 'Normalizes Arabic text into hyphenated slug format');

  // [Test 3] Schema.org Graph Building
  console.log('\n[Test 3] Schema.org Graph Generation (Organization, WebSite, FAQPage)');
  const graph = generateSchemaOrgGraph({
    siteName: 'شركة الدليل الشامل',
    domain: 'alshamil.om',
    pageTitle: 'مركز الأعمال بصحار',
    pageDescription: 'حاضنة مكاتب ومساحات عمل مجهزة في صحار.',
    canonicalUrl: 'https://alshamil.om/business-center',
    logoUrl: 'https://alshamil.om/logo.png',
    pageType: 'WebPage',
    faqs: [
      { question: 'ما هي مواعيد العمل؟', answer: 'من الأحد إلى الخميس 8 صباحاً حتى 5 مساءً.' },
    ],
    localSettings: {
      address: 'ولاية صحار',
      phone: '+96826840000',
      localBusinessType: 'ProfessionalService',
      localGeoLatitude: 24.3461,
      localGeoLongitude: 56.7075,
    },
  }) as any;

  assert(graph['@context'] === 'https://schema.org', 'Graph context is https://schema.org');
  assert(Array.isArray(graph['@graph']), 'Graph contains @graph array');

  const org = graph['@graph'].find((item: any) => item['@type'] === 'ProfessionalService');
  assert(org !== undefined && org.name === 'شركة الدليل الشامل', 'Contains Organization/LocalBusiness schema node with correct name');
  assert(org.geo && org.geo.latitude === 24.3461, 'Contains GeoCoordinates node with latitude 24.3461');

  const faq = graph['@graph'].find((item: any) => item['@type'] === 'FAQPage');
  assert(faq !== undefined && faq.mainEntity[0].name === 'ما هي مواعيد العمل؟', 'Contains FAQPage node with question and answer');

  // [Test 4] SEO Health Score Calculation
  console.log('\n[Test 4] Real-time SEO Health Score Calculation');
  const badSeo = calculateSeoScore({
    title: '',
    seoTitle: '',
    seoDescription: '',
  });

  assert(badSeo.score < 60, 'Incomplete page SEO yields low score (< 60)');
  assert(badSeo.issues.some(i => i.code === 'MISSING_TITLE'), 'Identifies missing title error');
  assert(badSeo.issues.some(i => i.code === 'MISSING_DESC'), 'Identifies missing meta description error');

  const goodSeo = calculateSeoScore({
    title: 'شركة الدليل الشامل لاستشارات إدارة المشاريع صحار',
    seoTitle: 'شركة الدليل الشامل لاستشارات إدارة المشاريع — صحار',
    seoDescription: 'شركة استشارية متخصصة ومصرحة في سلطنة عُمان لتأسيس المشاريع، دراسات الجدوى، وحاضنات الأعمال في ولاية صحار.',
    focusKeyword: 'استشارات',
    ogImage: 'https://alshamil.om/logo.png',
    geoPrimaryQuestion: 'ما هي خدمات الدليل الشامل؟',
    geoDirectAnswer: 'خدمات استشارية متكاملة لرواد الأعمال والمستثمرين في صحار.',
    hasAltText: true,
  });

  assert(goodSeo.score >= 90, 'Complete optimized page yields high score (>= 90)');
  assert(goodSeo.issues.filter(i => i.type === 'error').length === 0, 'No critical errors in optimized page');

  console.log('\n================================================================');
  console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

// Run automatically when executed directly
runSeoEngineTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
