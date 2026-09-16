import { syncCustomerFromVoucher } from "../application/crm/syncCustomerFromVoucher";
import { defaultCustomerRepositoryAdapter } from "../lib/adapters/customerRepositoryAdapter";
import { loadCustomers, saveCustomers } from "../utils/storage/customersStorage";
import { Customer, ReceiptVoucher } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — CRM CUSTOMER SYNCHRONIZATION SERVICE TEST SUITE");
console.log("================================================================\n");

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

// Mock LocalStorage in Node environment if absent
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

// Clear storage before starting test suite
saveCustomers([]);

// TEST 1: New Customer Creation from Receipt Voucher
console.log("--- TEST 1: NEW CUSTOMER CREATION ---");
const voucher1: Partial<ReceiptVoucher> = {
  voucherNumber: "V-2026-001",
  receivedFrom: "شركة النور للتجارة",
  payerPhone: "96891234567",
  payerEmail: "info@alnoor.om",
  payerAddress: "صحار, سلطنة عمان",
  payerTaxId: "OM12345678",
  totalAmount: 500,
  currency: "OMR"
};

const result1 = syncCustomerFromVoucher(voucher1, [], { repository: defaultCustomerRepositoryAdapter });
assert(result1.length === 1, "Creates 1 new customer record");
assert(result1[0].name === "شركة النور للتجارة", "Customer name matches receivedFrom");
assert(result1[0].phone === "96891234567", "Customer phone matches payerPhone");
assert(result1[0].email === "info@alnoor.om", "Customer email matches payerEmail");
assert(result1[0].taxId === "OM12345678", "Customer taxId matches payerTaxId");
assert(result1[0].type === "CORPORATE", "Customer default type is CORPORATE");
assert(result1[0].status === "ACTIVE", "Customer default status is ACTIVE");

// TEST 2: Interaction Creation & ID Format
console.log("\n--- TEST 2: INTERACTION CREATION & ID FORMAT ---");
assert(result1[0].interactions.length === 1, "Creates 1 interaction entry");
assert(result1[0].interactions[0].type === "VOUCHER_ISSUED", "Interaction type is VOUCHER_ISSUED");
assert(result1[0].interactions[0].id.startsWith("act-"), "Interaction ID uses act- prefix");
assert(result1[0].interactions[0].notes.includes("500 OMR"), "Interaction notes record voucher amount and currency");

// TEST 3: Case-Insensitive Customer Matching
console.log("\n--- TEST 3: CASE-INSENSITIVE NAME MATCHING ---");
const voucher2: Partial<ReceiptVoucher> = {
  voucherNumber: "V-2026-002",
  receivedFrom: "شركة النور للتجارة", // Exact match
  payerPhone: "96891234567",
  totalAmount: 250
};

const result2 = syncCustomerFromVoucher(voucher2, result1, { repository: defaultCustomerRepositoryAdapter });
assert(result2.length === 1, "Does not duplicate customer when name matches");

const voucher3: Partial<ReceiptVoucher> = {
  voucherNumber: "V-2026-003",
  receivedFrom: "Al-Noor Trading",
  payerPhone: "96890000000"
};
const result3 = syncCustomerFromVoucher(voucher3, result2, { repository: defaultCustomerRepositoryAdapter });
assert(result3.length === 2, "Creates new customer when name is distinct");

const voucher4: Partial<ReceiptVoucher> = {
  voucherNumber: "V-2026-004",
  receivedFrom: "al-noor trading", // Case-insensitive match for "Al-Noor Trading"
  payerPhone: "96890000001"
};
const result4 = syncCustomerFromVoucher(voucher4, result3, { repository: defaultCustomerRepositoryAdapter });
assert(result4.length === 2, "Matches existing customer case-insensitively without duplicating");

// TEST 4: Customer Merge / Update Behavior
console.log("\n--- TEST 4: CUSTOMER MERGE / UPDATE BEHAVIOR ---");
const voucherUpdate: Partial<ReceiptVoucher> = {
  voucherNumber: "V-2026-005",
  receivedFrom: "Al-Noor Trading",
  payerPhone: "96899998888", // Updated phone
  payerEmail: "newemail@alnoor.om" // Updated email
};
const result5 = syncCustomerFromVoucher(voucherUpdate, result4, { repository: defaultCustomerRepositoryAdapter });
const updatedCustomer = result5.find((c) => c.name === "Al-Noor Trading");
assert(updatedCustomer !== undefined, "Finds updated customer");
assert(updatedCustomer?.phone === "96899998888", "Updates customer phone when changed");
assert(updatedCustomer?.email === "newemail@alnoor.om", "Updates customer email when changed");

// TEST 5: Customer List Ordering (Newest First)
console.log("\n--- TEST 5: CUSTOMER LIST ORDERING ---");
const voucher6: Partial<ReceiptVoucher> = {
  voucherNumber: "V-2026-006",
  receivedFrom: "شركة الباطنة للخدمات"
};
const result6 = syncCustomerFromVoucher(voucher6, result5, { repository: defaultCustomerRepositoryAdapter });
assert(result6.length === 3, "Total customers is now 3");
assert(result6[0].name === "شركة الباطنة للخدمات", "Newest customer is prepended to top of list");

// TEST 6: LocalStorage Persistence Integrity
console.log("\n--- TEST 6: STORAGE PERSISTENCE INTEGRITY ---");
const persisted = loadCustomers();
assert(persisted.length === 3, "Persists updated customer list to localStorage under rv_studio_customers_list");
assert(persisted[0].name === "شركة الباطنة للخدمات", "Persisted top customer matches in-memory result");

// TEST 7: Invalid / Empty Customer Scenarios
console.log("\n--- TEST 7: EMPTY / INVALID VOUCHER SCENARIOS ---");
const emptyVoucher: Partial<ReceiptVoucher> = {
  receivedFrom: ""
};
const result7 = syncCustomerFromVoucher(emptyVoucher, result6);
assert(result7.length === 3, "Ignores empty receivedFrom string without modifying list");

const whitespaceVoucher: Partial<ReceiptVoucher> = {
  receivedFrom: "   "
};
const result8 = syncCustomerFromVoucher(whitespaceVoucher, result7);
assert(result8.length === 3, "Ignores whitespace-only receivedFrom string");

const undefinedVoucher: Partial<ReceiptVoucher> = {};
const result9 = syncCustomerFromVoucher(undefinedVoucher, result8);
assert(result9.length === 3, "Ignores undefined receivedFrom");

// TEST 8: Representative Existing Customer Data Regression
console.log("\n--- TEST 8: EXISTING DATA REGRESSION ---");
const existingCust: Customer = {
  id: "cust-101",
  name: "شركة ظفار للطاقة",
  contactPerson: "سالم الحضري",
  phone: "96895551111",
  email: "dhofar@energy.om",
  address: "صلالة, عمان",
  city: "صلالة",
  country: "سلطنة عمان",
  type: "CORPORATE",
  status: "ACTIVE",
  interactions: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};
const result10 = syncCustomerFromVoucher(
  { receivedFrom: "شركة ظفار للطاقة" },
  [existingCust]
);
assert(result10.length === 1, "Preserves existing customer array without duplicating");
assert(result10[0].contactPerson === "سالم الحضري", "Preserves existing fields (contactPerson)");
assert(result10[0].city === "صلالة", "Preserves existing city");

// SUMMARY
console.log(`\n========================================================`);
console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`========================================================\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
