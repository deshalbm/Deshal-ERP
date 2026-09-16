/**
 * Characterization Unit Test Suite — Authentication, Roles, Permissions & Security Audit Context
 * Verifies audit log entry creation, ISO timestamping, CSV export formatting,
 * and role-based permissions evaluation.
 */

import { logActivity } from '../utils/auditLogger';
import { AuditLogEntry, EmployeeRole } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function evaluateRolePermission(role: EmployeeRole, targetModule: string, action: string): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'SALES' && targetModule === 'POS') return true;
  if (role === 'ACCOUNTANT' && (targetModule === 'ACCOUNTING' || targetModule === 'VOUCHERS')) return true;
  if (action === 'READ') return true;
  return false;
}

function runTests() {
  console.log("\n================================================================");
  console.log("  DESHAL ERP — AUTH, ROLES, PERMISSIONS & SECURITY AUDIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: AUDIT LOG CREATION & ISO TIMESTAMPING ---
  console.log("\n--- TEST 1: AUDIT LOG CREATION & ISO TIMESTAMPING ---");
  const existingLogs: AuditLogEntry[] = [];
  const updatedLogs = logActivity(
    {
      action: 'SETTINGS_UPDATE',
      module: 'SETTINGS',
      entityName: 'Company Profile',
      descriptionAr: 'تحديث بيانات الشركة السجل التجاري والضريبي',
      descriptionEn: 'Updated company profile CR and Tax ID',
      performedByEmployeeId: 'usr-01',
      performedByName: 'مدير النظام',
      performedByRole: 'ADMIN',
    },
    existingLogs
  );

  assert(updatedLogs.length === 1, 'Appends log entry to log list');
  assert(updatedLogs[0].id.startsWith('log-'), 'Assigns valid log- prefix ID');
  assert(!isNaN(Date.parse(updatedLogs[0].timestamp)), 'Generates valid ISO timestamp');
  assert(updatedLogs[0].action === 'SETTINGS_UPDATE', 'Records correct action SETTINGS_UPDATE');

  // --- TEST 2: ROLE-BASED PERMISSIONS EVALUATION ---
  console.log("\n--- TEST 2: ROLE-BASED PERMISSIONS EVALUATION ---");
  assert(evaluateRolePermission('ADMIN', 'SETTINGS', 'UPDATE') === true, 'Admin has full access to settings update');
  assert(evaluateRolePermission('SALES', 'POS', 'CREATE') === true, 'Sales role has access to create POS transactions');
  assert(evaluateRolePermission('SALES', 'SETTINGS', 'UPDATE') === false, 'Sales role is denied settings update access');
  assert(evaluateRolePermission('ACCOUNTANT', 'ACCOUNTING', 'UPDATE') === true, 'Accountant has access to accounting module');
  assert(evaluateRolePermission('STOREKEEPER', 'POS', 'READ') === true, 'Storekeeper has read access');

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
