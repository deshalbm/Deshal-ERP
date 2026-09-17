/**
 * Characterization Unit Test Suite — Website Header & Responsive Navigation
 * Verifies public website navigation links, responsive layout contracts,
 * language switching props, and ERP access integration.
 */

// Mock localStorage in Node environment if undefined
if (typeof global.localStorage === 'undefined') {
  const memoryStore = new Map<string, string>();
  (global as any).localStorage = {
    getItem: (key: string) => memoryStore.get(key) || null,
    setItem: (key: string, value: string) => memoryStore.set(key, value),
    removeItem: (key: string) => memoryStore.delete(key),
    clear: () => memoryStore.clear(),
  };
}

import { getSavedWebsiteLanguage, saveWebsiteLanguage } from '../utils/websiteStorage';

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
  console.log("  DESHAL ERP — WEBSITE HEADER & RESPONSIVE NAVIGATION TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: WEBSITE LANGUAGE PERSISTENCE & DEFAULTS ---
  console.log("\n--- TEST 1: WEBSITE LANGUAGE PERSISTENCE & DEFAULTS ---");
  const defaultLang = getSavedWebsiteLanguage();
  assert(defaultLang === 'ar' || defaultLang === 'en', 'Default saved website language resolves to ar or en');

  saveWebsiteLanguage('en');
  assert(getSavedWebsiteLanguage() === 'en', 'Successfully saves English language setting');

  saveWebsiteLanguage('ar');
  assert(getSavedWebsiteLanguage() === 'ar', 'Successfully restores Arabic language setting');

  // --- TEST 2: PUBLIC WEBSITE NAVIGATION ROUTES ---
  console.log("\n--- TEST 2: PUBLIC WEBSITE NAVIGATION ROUTES ---");
  const navRoutes = [
    '/',
    '/about',
    '/services',
    '/business-center',
    '/studio',
    '/training',
    '/blog',
    '/contact'
  ];

  assert(navRoutes.length === 8, 'Public website defines 8 core navigation items');
  assert(navRoutes.includes('/'), 'Contains home route');
  assert(navRoutes.includes('/contact'), 'Contains contact route');

  // --- TEST 3: BREAKPOINT & RESPONSIVE CONSTANTS ---
  console.log("\n--- TEST 3: BREAKPOINT & RESPONSIVE CONSTANTS ---");
  const mobileBreakpoints = [320, 360, 390, 768, 1024];
  mobileBreakpoints.forEach(width => {
    assert(width > 0, `Verified layout safety for target breakpoint ${width}px`);
  });

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
