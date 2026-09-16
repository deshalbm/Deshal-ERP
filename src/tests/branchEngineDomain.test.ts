/**
 * Characterization Unit Test Suite — Multi-Branch Locations & Hierarchy Engine
 * Verifies main headquarters protection rules, default warehouse resolution,
 * inter-branch transfer rules, and branch performance summary metrics.
 */

import {
  validateBranchStatusChange,
  resolveBranchWarehouse,
  validateInterBranchTransfer,
  calculateBranchPerformanceSummary,
} from '../domain/branches/branchEngine';
import { Branch } from '../types/common';

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
  console.log("  DESHAL ERP — MULTI-BRANCH LOCATIONS & HIERARCHY TEST SUITE");
  console.log("================================================================");

  const mainBranch: Branch = {
    id: "b-mct",
    code: "BR-MCT-01",
    name: "فرع مسقط الرئيسي",
    isMain: true,
    phone: "90000000",
    email: "muscat@deshalbm.com",
    address: "غلا - مسقط",
    city: "Muscat",
    country: "Oman",
    status: "ACTIVE",
    defaultWarehouse: "WH-MCT-MAIN",
    createdAt: "",
    updatedAt: ""
  };

  const satelliteBranch: Branch = {
    id: "b-soh",
    code: "BR-SOH-02",
    name: "فرع صحار",
    isMain: false,
    phone: "91111111",
    email: "sohar@deshalbm.com",
    address: "صحار الصناعية",
    city: "Sohar",
    country: "Oman",
    status: "ACTIVE",
    defaultWarehouse: "",
    createdAt: "",
    updatedAt: ""
  };

  const inactiveBranch: Branch = {
    ...satelliteBranch,
    id: "b-sal",
    code: "BR-SAL-03",
    name: "فرع صلالة",
    status: "INACTIVE"
  };

  // --- TEST 1: MAIN HEADQUARTERS PROTECTION ---
  console.log("\n--- TEST 1: MAIN HEADQUARTERS PROTECTION ---");
  const mainDeactivate = validateBranchStatusChange(mainBranch, 'INACTIVE');
  assert(mainDeactivate.isValid === false, "Rejects deactivating main headquarters branch");

  const satelliteDeactivate = validateBranchStatusChange(satelliteBranch, 'INACTIVE');
  assert(satelliteDeactivate.isValid === true, "Allows deactivating non-main satellite branch");

  // --- TEST 2: DEFAULT WAREHOUSE RESOLUTION ---
  console.log("\n--- TEST 2: DEFAULT WAREHOUSE RESOLUTION ---");
  assert(resolveBranchWarehouse(mainBranch) === "WH-MCT-MAIN", "Resolves explicit default warehouse WH-MCT-MAIN");
  assert(resolveBranchWarehouse(satelliteBranch) === "WH-BR-SOH-02", "Resolves code fallback warehouse WH-BR-SOH-02");

  // --- TEST 3: INTER-BRANCH TRANSFER VALIDATION ---
  console.log("\n--- TEST 3: INTER-BRANCH TRANSFER VALIDATION ---");
  const validTransfer = validateInterBranchTransfer(mainBranch, satelliteBranch);
  assert(validTransfer.isValid === true, "Valid transfer between active Muscat and Sohar branches");

  const sameBranchTransfer = validateInterBranchTransfer(mainBranch, mainBranch);
  assert(sameBranchTransfer.isValid === false, "Fails transfer between same branch");

  const inactiveTransfer = validateInterBranchTransfer(mainBranch, inactiveBranch);
  assert(inactiveTransfer.isValid === false, "Fails transfer to INACTIVE branch");

  // --- TEST 4: BRANCH PERFORMANCE SUMMARY ANALYTICS ---
  console.log("\n--- TEST 4: BRANCH PERFORMANCE SUMMARY ANALYTICS ---");
  const transactions = [
    { branchId: "b-mct", totalAmount: 100 },
    { branchId: "b-mct", totalAmount: 200 },
    { branchId: "b-soh", totalAmount: 50 },
  ];

  const summary = calculateBranchPerformanceSummary([mainBranch, satelliteBranch], transactions);
  const muscatMetric = summary.find(s => s.branchId === "b-mct");
  assert(muscatMetric?.totalSales === 300, "Muscat branch total sales is 300.000 OMR");
  assert(muscatMetric?.transactionsCount === 2, "Muscat branch transaction count is 2");
  assert(muscatMetric?.averageTransactionValue === 150, "Muscat average transaction value is 150.000 OMR");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
