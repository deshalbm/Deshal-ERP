import {
  clearAllLocalStorage,
  loadVouchers,
  loadStockMovements,
  loadTransfers,
  loadRecurringSchedules,
  loadEmployees,
  loadAttendanceRecords,
  loadPayrollSlips,
  loadLeaveRequests,
  loadCustomers,
  loadInventory,
  loadSuppliers,
  loadPurchases,
  loadRentalSpaces,
  loadConsultingServices,
  loadMembershipPackages,
  loadTenantSubscriptions,
  loadLeaseContracts,
  loadPOSOrders,
  loadCashierShifts,
  loadEmployeeRequests
} from '../utils/storage';
import {
  loadCRMLeads,
  loadCRMOpportunities,
  loadCRMActivities
} from '../utils/storage/crmStorage';
import {
  loadKioskDevices
} from '../utils/attendanceStorage';

console.log("\n================================================================");
console.log("  DESHAL ERP — EMPTY STORAGE SEED REMOVAL TEST SUITE");
console.log("================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assertEqual(actual: any, expected: any, message: string) {
  totalCount++;
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  if (match) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message} (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    process.exitCode = 1;
  }
}

clearAllLocalStorage();

assertEqual(loadVouchers(), [], 'Vouchers return empty array [] when storage is uninitialized');
assertEqual(loadStockMovements(), [], 'Stock Movements return empty array [] when storage is uninitialized');
assertEqual(loadTransfers(), [], 'Transfers return empty array [] when storage is uninitialized');
assertEqual(loadRecurringSchedules(), [], 'Recurring Schedules return empty array [] when storage is uninitialized');
assertEqual(loadEmployees(), [], 'Employees return [] when storage is uninitialized');
assertEqual(loadAttendanceRecords(), [], 'Attendance records return [] when uninitialized');
assertEqual(loadPayrollSlips(), [], 'Payroll slips return [] when uninitialized');
assertEqual(loadLeaveRequests(), [], 'Leave requests return [] when uninitialized');
assertEqual(loadCustomers(), [], 'Customers return [] when uninitialized');
assertEqual(loadInventory(), [], 'Inventory returns [] when uninitialized');
assertEqual(loadSuppliers(), [], 'Suppliers return [] when uninitialized');
assertEqual(loadPurchases(), [], 'Purchases return [] when uninitialized');
assertEqual(loadRentalSpaces(), [], 'Spaces return [] when uninitialized');
assertEqual(loadConsultingServices(), [], 'Services return [] when uninitialized');
assertEqual(loadMembershipPackages(), [], 'Packages return [] when uninitialized');
assertEqual(loadTenantSubscriptions(), [], 'Tenant Subscriptions return [] when uninitialized');
assertEqual(loadLeaseContracts(), [], 'Lease Contracts return [] when uninitialized');
assertEqual(loadPOSOrders(), [], 'POS Orders return [] when uninitialized');
assertEqual(loadCashierShifts(), [], 'Cashier Shifts return [] when uninitialized');
assertEqual(loadCRMLeads(), [], 'CRM Leads return [] when uninitialized');
assertEqual(loadCRMOpportunities(), [], 'CRM Opportunities return [] when uninitialized');
assertEqual(loadCRMActivities(), [], 'CRM Activities return [] when uninitialized');
assertEqual(loadKioskDevices(), [], 'Kiosk devices return [] when uninitialized');
assertEqual(loadEmployeeRequests(), [], 'Employee requests return [] when uninitialized');

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
