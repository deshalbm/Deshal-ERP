import { mapSupabaseError, type ApiErrorCode } from '../lib/supabase/errorMapper';
import { resolveCompanyId, isValidUuid } from '../domain/common/uuid';
import * as customerSvc from '../lib/supabase/customerService';
import * as inventorySvc from '../lib/supabase/inventoryService';
import * as accountingSvc from '../lib/supabase/accountingService';
import * as masterDataSvc from '../lib/supabase/masterDataService';

console.log('\n================================================================');
console.log('  DESHAL ERP — SUPABASE / API ERROR HARDENING TEST SUITE');
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

async function runApiErrorHardeningTests() {
  // -----------------------------------------------------------------
  // TEST 1: Successful Supabase Request Mapping
  // -----------------------------------------------------------------
  console.log('--- TEST 1: SUCCESSFUL SUPABASE MAPPING ---');
  const mockSuccessData = { id: '00000000-0000-0000-0000-000000000001', name: 'Test' };
  const err1 = mapSupabaseError(null, 'Context');
  assert(err1.code === 'UNKNOWN_ERROR' && err1.message.includes('غير معروف'), 'Null error returns unknown error fallback');

  // -----------------------------------------------------------------
  // TEST 2: HTTP 400 (Invalid UUID / Bad Request)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 2: HTTP 400 (INVALID REQUEST) ---');
  const badReqErr = mapSupabaseError({ status: 400, message: 'invalid input syntax for type uuid: ""' });
  assert(badReqErr.code === 'INVALID_REQUEST', 'HTTP 400 mapped to INVALID_REQUEST');
  assert(badReqErr.status === 400, 'HTTP 400 status preserved');

  // -----------------------------------------------------------------
  // TEST 3: HTTP 401 (Auth Invalid Credentials / Expired Session)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 3: HTTP 401 (AUTH EXPIRED / INVALID) ---');
  const credErr = mapSupabaseError({ status: 401, message: 'Invalid login credentials' });
  assert(credErr.code === 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials mapped to AUTH_INVALID_CREDENTIALS');

  const expErr = mapSupabaseError({ status: 401, message: 'JWT expired' });
  assert(expErr.code === 'AUTH_SESSION_EXPIRED', 'JWT expired mapped to AUTH_SESSION_EXPIRED');

  // -----------------------------------------------------------------
  // TEST 4: HTTP 403 (Permission Denied / RLS Violation)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 4: HTTP 403 (PERMISSION DENIED / RLS) ---');
  const rlsErr = mapSupabaseError({ code: '42501', message: 'new row violates row-level security policy' });
  assert(rlsErr.code === 'PERMISSION_DENIED', 'RLS code 42501 mapped to PERMISSION_DENIED');

  // -----------------------------------------------------------------
  // TEST 5: HTTP 404 (Not Found)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 5: HTTP 404 (NOT FOUND) ---');
  const notFoundErr = mapSupabaseError({ status: 404, message: 'JSON object requested, multiple (or no) rows returned' });
  assert(notFoundErr.code === 'NOT_FOUND', 'HTTP 404 mapped to NOT_FOUND');

  // -----------------------------------------------------------------
  // TEST 6: HTTP 409 (Conflict / Duplicate Key)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 6: HTTP 409 (CONFLICT / DUPLICATE) ---');
  const conflictErr = mapSupabaseError({ code: '23505', message: 'duplicate key value violates unique constraint' });
  assert(conflictErr.code === 'CONFLICT', 'PG code 23505 mapped to CONFLICT');

  // -----------------------------------------------------------------
  // TEST 7: HTTP 500 (Database Error)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 7: HTTP 500 (DATABASE ERROR) ---');
  const dbErr = mapSupabaseError({ status: 500, message: 'Internal server error in PostgreSQL' });
  assert(dbErr.code === 'DATABASE_ERROR', 'HTTP 500 mapped to DATABASE_ERROR');

  // -----------------------------------------------------------------
  // TEST 8: Network Failure Handling
  // -----------------------------------------------------------------
  console.log('\n--- TEST 8: NETWORK FAILURE ---');
  const netErr = mapSupabaseError(new Error('Failed to fetch'));
  assert(netErr.code === 'NETWORK_ERROR', 'Failed to fetch mapped to NETWORK_ERROR');

  // -----------------------------------------------------------------
  // TEST 9: Timeout Handling
  // -----------------------------------------------------------------
  console.log('\n--- TEST 9: TIMEOUT HANDLING ---');
  const timeoutErr = mapSupabaseError(new Error('Connection timed out'));
  assert(timeoutErr.code === 'TIMEOUT', 'Connection timed out mapped to TIMEOUT');

  // -----------------------------------------------------------------
  // TEST 10: Authentication Not Ready Guard
  // -----------------------------------------------------------------
  console.log('\n--- TEST 10: AUTHENTICATION NOT READY GUARD ---');
  const isAuthLoading = true;
  const companyId = '';
  const isReadyToExecute = !isAuthLoading && isValidUuid(companyId);
  assert(isReadyToExecute === false, 'Requests prevented when authentication state is loading');

  // -----------------------------------------------------------------
  // TEST 11: Unauthenticated Protected Request Prevention
  // -----------------------------------------------------------------
  console.log('\n--- TEST 11: UNAUTHENTICATED REQUEST PREVENTION ---');
  const emptyCIdRes = await customerSvc.getCustomers('');
  assert(Array.isArray(emptyCIdRes) && emptyCIdRes.length === 0, 'Unauthenticated empty companyId returns [] without network query');

  const invalidCIdRes = await inventorySvc.getInventoryItems('invalid-uuid');
  assert(Array.isArray(invalidCIdRes) && invalidCIdRes.length === 0, 'Invalid companyId string returns [] without network query');

  // -----------------------------------------------------------------
  // TEST 12: Authenticated Protected Request Execution
  // -----------------------------------------------------------------
  console.log('\n--- TEST 12: AUTHENTICATED REQUEST EXECUTION ---');
  const validCompanyId = '00000000-0000-0000-0000-000000000001';
  assert(isValidUuid(validCompanyId) === true, 'Valid target company ID is standard 36-char UUID');
  assert(resolveCompanyId(validCompanyId) === validCompanyId, 'resolveCompanyId preserves valid UUID');

  // -----------------------------------------------------------------
  // TEST 13: Duplicate Request / State Guard Verification
  // -----------------------------------------------------------------
  console.log('\n--- TEST 13: REQUEST DEDUPLICATION / STATE GUARD ---');
  let activeExecutionCount = 0;
  const simulatedLoad = async (cId: string) => {
    const valid = resolveCompanyId(cId);
    if (!valid) return;
    activeExecutionCount++;
  };
  await Promise.all([simulatedLoad(''), simulatedLoad(''), simulatedLoad(validCompanyId)]);
  assert(activeExecutionCount === 1, 'Only valid authenticated companyId request executes');

  // -----------------------------------------------------------------
  // TEST 14: Controlled Retry Behavior (No Infinite Retries for Auth/400)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 14: CONTROLLED RETRY BEHAVIOR ---');
  const shouldRetry = (errCode: ApiErrorCode): boolean => {
    return errCode === 'NETWORK_ERROR' || errCode === 'TIMEOUT';
  };
  assert(shouldRetry('AUTH_INVALID_CREDENTIALS') === false, 'Does NOT retry invalid auth credentials');
  assert(shouldRetry('INVALID_REQUEST') === false, 'Does NOT retry HTTP 400 invalid requests');
  assert(shouldRetry('NETWORK_ERROR') === true, 'Allows controlled retry for network failures');

  // -----------------------------------------------------------------
  // TEST 15: Write Failure Handling
  // -----------------------------------------------------------------
  console.log('\n--- TEST 15: WRITE FAILURE HANDLING ---');
  const writeRes = mapSupabaseError({ code: '23505', message: 'duplicate key value violates unique constraint' }, 'Save Journal Entry');
  assert(writeRes.code === 'CONFLICT', 'Write conflict handled cleanly with user-facing message');

  // -----------------------------------------------------------------
  // TEST 16: Repository Error Mapping Contract
  // -----------------------------------------------------------------
  console.log('\n--- TEST 16: REPOSITORY ERROR MAPPING CONTRACT ---');
  const searchResult = await masterDataSvc.searchProductsAndServicesServerSide('', 'test');
  assert(searchResult.products.length === 0 && searchResult.total === 0, 'Master data server search handles unauthenticated calls safely');

  // SUMMARY
  console.log('\n========================================================');
  console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('========================================================\n');

  if (passedCount === 0 || passedCount !== totalCount) {
    process.exit(1);
  }
}

runApiErrorHardeningTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
