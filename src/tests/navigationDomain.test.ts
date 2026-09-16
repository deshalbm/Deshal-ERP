/**
 * Characterization Unit Test Suite — Application Navigation & Tab Routing Domain
 * Verifies valid tab route identifiers, breadcrumbs formatting logic,
 * and recent tabs history management.
 */

import { BreadcrumbItem } from '../components/navigation/Breadcrumbs';

const VALID_TAB_ROUTES = [
  'home',
  'pos',
  'accounting',
  'spaces',
  'contracts',
  'services',
  'portal',
  'doc-wizard',
  'editor',
  'preview',
  'history',
  'crm',
  'inventory',
  'purchases',
  'branches',
  'employees',
  'requests',
  'schedules',
  'settings',
  'help',
];

export function resolveValidTabRoute(tab?: string): string {
  if (!tab || typeof tab !== 'string') return 'home';
  const cleanTab = tab.trim().toLowerCase();
  return VALID_TAB_ROUTES.includes(cleanTab) ? cleanTab : 'home';
}

export function updateRecentTabsHistory(currentRecent: string[], newTab: string, maxHistory: number = 5): string[] {
  const resolved = resolveValidTabRoute(newTab);
  if (resolved === 'home') return currentRecent; // Do not push home to recent list
  const filtered = currentRecent.filter((t) => t !== resolved);
  return [resolved, ...filtered].slice(0, maxHistory);
}

export function buildTabBreadcrumbs(activeTab: string, isRTL: boolean = true): BreadcrumbItem[] {
  const resolved = resolveValidTabRoute(activeTab);
  const labels: Record<string, { ar: string; en: string }> = {
    home: { ar: 'الرئيسية', en: 'Home' },
    pos: { ar: 'نقطة البيع', en: 'Point of Sale' },
    accounting: { ar: 'المحاسبة والشجرة', en: 'Accounting & Ledger' },
    spaces: { ar: 'إدارة المساحات', en: 'Spaces Manager' },
    contracts: { ar: 'عقود الإيجار', en: 'Lease Contracts' },
    services: { ar: 'الخدمات والاستشارات', en: 'Services & Consulting' },
    crm: { ar: 'إدارة العملاء CRM', en: 'CRM & Customers' },
    inventory: { ar: 'المخزون والمنتجات', en: 'Inventory & Stock' },
    purchases: { ar: 'المشتريات والموردون', en: 'Purchases & Suppliers' },
    branches: { ar: 'الفروع والمواقع', en: 'Branches & Locations' },
    employees: { ar: 'الموظفون والموارد البشرية', en: 'Employees & HR' },
    requests: { ar: 'الطلبات والاعتمادات', en: 'Requests & Approvals' },
    schedules: { ar: 'الجدولة والتكرار', en: 'Schedules & Recurring' },
    settings: { ar: 'إعدادات النظام', en: 'System Settings' },
    help: { ar: 'مركز المساعدة', en: 'Help Center' },
  };

  const currentLabel = labels[resolved]
    ? isRTL
      ? labels[resolved].ar
      : labels[resolved].en
    : resolved;

  return [
    {
      label: currentLabel,
      tab: resolved,
      active: true,
    },
  ];
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log("\n================================================================");
  console.log("  DESHAL ERP — APPLICATION NAVIGATION & TAB ROUTING TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: TAB ROUTE RESOLUTION & FALLBACK ---
  console.log("\n--- TEST 1: TAB ROUTE RESOLUTION & FALLBACK ---");
  assert(resolveValidTabRoute('pos') === 'pos', 'Resolves valid "pos" tab route');
  assert(resolveValidTabRoute('CRM') === 'crm', 'Resolves uppercase "CRM" to lowercase "crm"');
  assert(resolveValidTabRoute('unknown-tab') === 'home', 'Falls back invalid tab route to "home"');
  assert(resolveValidTabRoute(undefined) === 'home', 'Falls back undefined tab route to "home"');

  // --- TEST 2: RECENT TABS HISTORY MANAGEMENT ---
  console.log("\n--- TEST 2: RECENT TABS HISTORY MANAGEMENT ---");
  let history: string[] = [];
  history = updateRecentTabsHistory(history, 'pos');
  assert(history.length === 1 && history[0] === 'pos', 'Pushes "pos" to empty recent history');

  history = updateRecentTabsHistory(history, 'inventory');
  assert(history[0] === 'inventory' && history[1] === 'pos', 'Pushes "inventory" to top of recent history');

  history = updateRecentTabsHistory(history, 'pos');
  assert(history[0] === 'pos' && history[1] === 'inventory', 'Deduplicates "pos" and moves it to top');

  // --- TEST 3: BREADCRUMBS TRAIL BUILDING ---
  console.log("\n--- TEST 3: BREADCRUMBS TRAIL BUILDING ---");
  const rtlCrmBreadcrumb = buildTabBreadcrumbs('crm', true);
  assert(rtlCrmBreadcrumb[0].label === 'إدارة العملاء CRM', 'Builds RTL Arabic breadcrumb label for CRM');

  const ltrCrmBreadcrumb = buildTabBreadcrumbs('crm', false);
  assert(ltrCrmBreadcrumb[0].label === 'CRM & Customers', 'Builds LTR English breadcrumb label for CRM');

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
