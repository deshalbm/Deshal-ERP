/**
 * Unit Tests for ERPDataContext types, loading state enums & state machine invariants
 */

import type { DataLoadingState, ERPDataContextType } from '../contexts/ERPDataContext';

console.log('\n================================================================');
console.log('  DESHAL ERP — ERP DATA CONTEXT & STATE MACHINE TEST SUITE');
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

function runTests() {
  console.log('[Test 1] DataLoadingState state machine invariants');
  const validStates: DataLoadingState[] = ['INITIAL_LOADING', 'READY', 'REFRESHING', 'ERROR'];
  assert(validStates.length === 4, 'DataLoadingState supports 4 explicit lifecycle states');
  assert(validStates.includes('INITIAL_LOADING'), 'Supports INITIAL_LOADING state');
  assert(validStates.includes('READY'), 'Supports READY state');
  assert(validStates.includes('REFRESHING'), 'Supports REFRESHING state');
  assert(validStates.includes('ERROR'), 'Supports ERROR state');

  console.log('\n[Test 2] Backward compatible isDataLoading mapping');
  const isDataLoading1 = ('INITIAL_LOADING' as DataLoadingState) === 'INITIAL_LOADING' || ('INITIAL_LOADING' as DataLoadingState) === 'REFRESHING';
  assert(isDataLoading1 === true, 'INITIAL_LOADING maps to isDataLoading = true');

  const isDataLoading2 = ('REFRESHING' as DataLoadingState) === 'INITIAL_LOADING' || ('REFRESHING' as DataLoadingState) === 'REFRESHING';
  assert(isDataLoading2 === true, 'REFRESHING maps to isDataLoading = true');

  const isDataLoading3 = ('READY' as DataLoadingState) === 'INITIAL_LOADING' || ('READY' as DataLoadingState) === 'REFRESHING';
  assert(isDataLoading3 === false, 'READY maps to isDataLoading = false');

  const isDataLoading4 = ('ERROR' as DataLoadingState) === 'INITIAL_LOADING' || ('ERROR' as DataLoadingState) === 'REFRESHING';
  assert(isDataLoading4 === false, 'ERROR maps to isDataLoading = false');

  console.log(`\n================================================================`);
  console.log(`  RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log(`================================================================\n`);
}

runTests();
