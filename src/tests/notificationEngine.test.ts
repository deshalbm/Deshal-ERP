import { generateSystemNotifications } from "../domain/notifications/notificationEngine";
import { InventoryItem, LeaseContract, JournalEntry } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — NOTIFICATION ENGINE DOMAIN UNIT TEST SUITE");
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

// [Test 1] Empty inputs return empty notification list
console.log("[Test 1] Empty Inputs Handling");
const emptyResult = generateSystemNotifications([], [], []);
assert(Array.isArray(emptyResult) && emptyResult.length === 0, "Empty inputs return empty notifications array");

// [Test 2] Low Stock Alert Trigger & Formatting
console.log("\n[Test 2] Low Stock Alert Evaluation");
const lowStockInventory: InventoryItem[] = [
  { id: "item-1", sku: "SKU-1", name: "شاشة ذكية", category: "إلكترونيات", warehouse: "الصحار", unit: "قطعة", quantity: 2, minAlertQuantity: 5, costPrice: 100, sellingPrice: 150, status: "LOW_STOCK", createdAt: "", updatedAt: "" },
  { id: "item-2", sku: "SKU-2", name: "كاميرات مراقبة", category: "أجهزة", warehouse: "الصحار", unit: "قطعة", quantity: 1, minAlertQuantity: 3, costPrice: 50, sellingPrice: 80, status: "LOW_STOCK", createdAt: "", updatedAt: "" }
];
const lowStockResult = generateSystemNotifications(lowStockInventory, [], []);
assert(lowStockResult.length === 1, "Generates exactly 1 low-stock notification");
assert(lowStockResult[0].id === "alert-low-stock", "Notification ID is exact: alert-low-stock");
assert(lowStockResult[0].type === "warning", "Notification type is warning");
assert(lowStockResult[0].targetTab === "inventory", "Target tab is inventory");
assert(lowStockResult[0].titleAr.includes("2 صنف"), "Arabic title contains exact count (2 صنف)");
assert(lowStockResult[0].descAr.includes("شاشة ذكية، كاميرات مراقبة"), "Arabic description includes first 2 item names");

// [Test 3] No Low Stock Alert When Inventory Sufficient
console.log("\n[Test 3] Sufficient Inventory Evaluation");
const sufficientInventory: InventoryItem[] = [
  { id: "item-1", sku: "SKU-1", name: "شاشة ذكية", category: "إلكترونيات", warehouse: "الصحار", unit: "قطعة", quantity: 10, minAlertQuantity: 5, costPrice: 100, sellingPrice: 150, status: "IN_STOCK", createdAt: "", updatedAt: "" }
];
const sufficientResult = generateSystemNotifications(sufficientInventory, [], []);
assert(sufficientResult.length === 0, "No notification generated when stock > minAlertQuantity");

// [Test 4] Pending Lease Installments Alert
console.log("\n[Test 4] Pending Lease Installments Evaluation");
const contractsWithPending: LeaseContract[] = [
  {
    id: "lc-1",
    contractNumber: "LC-2026-001",
    titleAr: "عقد مكتب 101",
    contractType: "COMMERCIAL_OFFICE",
    status: "ACTIVE",
    spaceId: "sp-1",
    spaceCode: "OFFICE-101",
    spaceName: "مكتب A1",
    spaceType: "PRIVATE_OFFICE",
    branchId: "branch-main",
    branchName: "صحار",
    lessorCompanyName: "ديشال",
    lessorCrNumber: "12345",
    lessorTaxNumber: "OM123",
    lessorRepresentative: "مدير العام",
    lessorPhone: "+96877627500",
    lessorEmail: "info@deshalbm.com",
    lessorAddress: "صحار",
    tenantName: "شركة الابتكار",
    tenantType: "CORPORATE",
    tenantSignatoryName: "أحمد",
    tenantPhone: "+96891234567",
    tenantEmail: "tenant@example.com",
    tenantAddress: "صحار",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    durationMonths: 12,
    noticePeriodDays: 30,
    autoRenew: false,
    totalRentAmount: 1200,
    discountAmount: 0,
    taxRate: 5,
    taxAmount: 60,
    finalContractValue: 1260,
    currency: "OMR",
    paymentFrequency: "MONTHLY",
    includedAmenities: {
      highSpeedInternet: true, electricityAndWater: true, centralAirConditioning: true,
      dailyCleaningService: true, receptionAndMailHandling: true, smartAccessControl: true,
      maintenanceSupport: true, beverageAndCoffeeStation: true
    },
    securityDeposit: { depositAmount: 100, currency: "OMR", status: "HELD_IN_CUSTODY" },
    installments: [
      { id: "p-1", installmentNumber: 1, titleAr: "قسط يناير", dueDate: "2026-01-01", amount: 100, taxRate: 5, taxAmount: 5, totalAmount: 105, currency: "OMR", status: "PAID" },
      { id: "p-2", installmentNumber: 2, titleAr: "قسط فبراير", dueDate: "2026-02-01", amount: 100, taxRate: 5, taxAmount: 5, totalAmount: 105, currency: "OMR", status: "PENDING" }
    ],
    monthlyFreeMeetingRoomHours: 10,
    monthlyFreeMediaStudioHours: 2,
    monthlyFreeConsultations: 1,
    tenantDiscountOnExtraServicesPercent: 10,
    clauses: [],
    isDigitallySigned: true,
    documents: [],
    preparedByName: "مدير النظام",
    createdAt: "",
    updatedAt: ""
  }
];
const leaseResult = generateSystemNotifications([], contractsWithPending, []);
assert(leaseResult.length === 1, "Generates exactly 1 pending lease notification");
assert(leaseResult[0].id === "alert-pending-installments", "Notification ID is exact: alert-pending-installments");
assert(leaseResult[0].targetTab === "contracts", "Target tab is contracts");

// [Test 5] No Notification For Non-PENDING Installments
console.log("\n[Test 5] Paid Lease Installments Evaluation");
const contractsPaid: LeaseContract[] = [
  {
    ...contractsWithPending[0],
    installments: [
      { id: "p-1", installmentNumber: 1, titleAr: "قسط يناير", dueDate: "2026-01-01", amount: 100, taxRate: 5, taxAmount: 5, totalAmount: 105, currency: "OMR", status: "PAID" }
    ]
  }
];
const paidLeaseResult = generateSystemNotifications([], contractsPaid, []);
assert(paidLeaseResult.length === 0, "No notification generated for paid lease installments");

// [Test 6] Draft Journal Entries Alert
console.log("\n[Test 6] Draft Journal Entries Evaluation");
const draftJournalEntries: JournalEntry[] = [
  { id: "je-1", entryNumber: "JE-001", date: "2026-09-09", descriptionAr: "قيد افتتاحي", descriptionEn: "Opening entry", lines: [], status: "DRAFT", totalDebit: 100, totalCredit: 100, type: "STANDARD", isBalanced: true, createdBy: "admin", createdAt: "", updatedAt: "" },
  { id: "je-2", entryNumber: "JE-002", date: "2026-09-09", descriptionAr: "مبيعات", descriptionEn: "Sales", lines: [], status: "POSTED", totalDebit: 200, totalCredit: 200, type: "STANDARD", isBalanced: true, createdBy: "admin", createdAt: "", updatedAt: "" }
];
const draftResult = generateSystemNotifications([], [], draftJournalEntries);
assert(draftResult.length === 1, "Generates exactly 1 draft journal entry notification");
assert(draftResult[0].id === "alert-draft-entries", "Notification ID is exact: alert-draft-entries");
assert(draftResult[0].targetTab === "accounting", "Target tab is accounting");

// [Test 7] No Notification For Non-DRAFT Journal Entries
console.log("\n[Test 7] Posted Journal Entries Evaluation");
const postedEntries: JournalEntry[] = [
  { id: "je-2", entryNumber: "JE-002", date: "2026-09-09", descriptionAr: "مبيعات", descriptionEn: "Sales", lines: [], status: "POSTED", totalDebit: 200, totalCredit: 200, type: "STANDARD", isBalanced: true, createdBy: "admin", createdAt: "", updatedAt: "" }
];
const postedResult = generateSystemNotifications([], [], postedEntries);
assert(postedResult.length === 0, "No notification generated for posted journal entries");

// [Test 8] Simultaneous Multiple Categories & Ordering Check
console.log("\n[Test 8] Simultaneous Categories & Exact Ordering Check");
const combinedResult = generateSystemNotifications(lowStockInventory, contractsWithPending, draftJournalEntries);
assert(combinedResult.length === 3, "Generates all 3 notifications simultaneously");
assert(combinedResult[0].id === "alert-low-stock", "First notification is alert-low-stock");
assert(combinedResult[1].id === "alert-pending-installments", "Second notification is alert-pending-installments");
assert(combinedResult[2].id === "alert-draft-entries", "Third notification is alert-draft-entries");

console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
