/**
 * Unit Tests for erpDataLoader application service
 * Verifies safe loading, error mapping, cancellation, and local fallback handling.
 */

import { fetchAllERPData } from '../application/services/erpDataLoader';
import { mapSupabaseError } from '../lib/supabase/errorMapper';

console.log('\n================================================================');
console.log('  DESHAL ERP — ERP DATA LOADER SERVICE UNIT TEST SUITE');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  // [Test 1] Unauthenticated / empty company ID returns fallback batch
  console.log('[Test 1] Unauthenticated / empty company ID handling');
  const batch1 = await fetchAllERPData('');
  assert(Array.isArray(batch1.customers), 'Customers is an array');
  assert(Array.isArray(batch1.employees), 'Employees is an array');
  assert(Array.isArray(batch1.inventory), 'Inventory is an array');
  assert(Array.isArray(batch1.vouchers), 'Vouchers is an array');
  assert(batch1.errors.length === 0, 'No errors returned for empty company load');

  // [Test 2] AbortSignal cancellation
  console.log('\n[Test 2] AbortSignal cancellation before/during fetch');
  const controller = new AbortController();
  controller.abort();
  const batch2 = await fetchAllERPData('company-123', controller.signal);
  assert(batch2.customers.length === 0, 'Aborted fetch returns empty fallback array');
  assert(batch2.errors.length === 0, 'Aborted fetch does not register unhandled error');

  // [Test 3] Error mapping for database errors
  console.log('\n[Test 3] Error mapping verification for API failures');
  const mappedErr1 = mapSupabaseError({ status: 400, message: 'invalid input syntax for type uuid' });
  assert(mappedErr1.code === 'INVALID_REQUEST', 'HTTP 400 mapped to INVALID_REQUEST');

  const mappedErr2 = mapSupabaseError({ status: 401, message: 'JWT expired' });
  assert(mappedErr2.code === 'AUTH_SESSION_EXPIRED', 'HTTP 401 mapped to AUTH_SESSION_EXPIRED');

  const mappedErr3 = mapSupabaseError({ status: 403, message: 'permission denied' });
  assert(mappedErr3.code === 'PERMISSION_DENIED', 'HTTP 403 mapped to PERMISSION_DENIED');

  const mappedErr4 = mapSupabaseError({ status: 500, message: 'relation products does not exist' });
  assert(mappedErr4.code === 'INVALID_REQUEST' || mappedErr4.code === 'DATABASE_ERROR', 'HTTP 500 mapped cleanly');

  // Summary
  console.log(`\n================================================================`);
  console.log(`  RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log(`================================================================\n`);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exitCode = 1;
});
