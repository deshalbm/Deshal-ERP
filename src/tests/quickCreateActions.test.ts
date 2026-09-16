import { resolveQuickCreateTab } from "../application/navigation/resolveQuickCreateTab";
import { createPaymentVoucherFromPurchase } from "../application/vouchers/createPaymentVoucherFromPurchase";
import { PurchaseInvoice } from "../types";
import { saveVouchers, loadVouchers, saveCompanySettings, loadCompanySettings } from "../utils/storage";

console.log("\n================================================================");
console.log("  DESHAL ERP — QUICK CREATE & VOUCHER ACTIONS UNIT TEST SUITE");
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

// 1. Mock LocalStorage in Node environment if absent
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

// Seed initial settings
saveCompanySettings({
  ...loadCompanySettings(),
  defaultCurrency: "OMR",
  companyName: "شركة ديشال"
});
saveVouchers([]);

// TEST 1: Quick Create Action Routing Map
console.log("--- TEST 1: Quick Create Action Routing Map ---");
assert(resolveQuickCreateTab("receipt") === "editor", "Action 'receipt' routes to 'editor'");
assert(resolveQuickCreateTab("tax-invoice") === "editor", "Action 'tax-invoice' routes to 'editor'");
assert(resolveQuickCreateTab("tax_invoice") === "editor", "Action 'tax_invoice' routes to 'editor'");
assert(resolveQuickCreateTab("payment") === "editor", "Action 'payment' routes to 'editor'");
assert(resolveQuickCreateTab("quotation") === "editor", "Action 'quotation' routes to 'editor'");
assert(resolveQuickCreateTab("petty-cash") === "editor", "Action 'petty-cash' routes to 'editor'");
assert(resolveQuickCreateTab("journal-entry") === "accounting", "Action 'journal-entry' routes to 'accounting'");
assert(resolveQuickCreateTab("customer") === "crm", "Action 'customer' routes to 'crm'");
assert(resolveQuickCreateTab("supplier") === "purchases", "Action 'supplier' routes to 'purchases'");
assert(resolveQuickCreateTab("inventory-item") === "inventory", "Action 'inventory-item' routes to 'inventory'");
assert(resolveQuickCreateTab("employee") === "employees", "Action 'employee' routes to 'employees'");
assert(resolveQuickCreateTab("space-booking") === "spaces", "Action 'space-booking' routes to 'spaces'");
assert(resolveQuickCreateTab("unknown-action") === "home", "Unknown action falls back to 'home'");

// TEST 2: Create Payment Voucher from Purchase Invoice
console.log("\n--- TEST 2: Create Payment Voucher from Purchase ---");

const samplePurchase: PurchaseInvoice = {
  id: "purch-101",
  purchaseNumber: "PO-2026-009",
  supplierInvoiceNo: "INV-SUPP-882",
  supplierId: "supp-01",
  supplierName: "شركة الخليج للتوريدات التقنية",
  date: "2026-09-10",
  warehouse: "المستودع الرئيسي",
  items: [
    {
      id: "pi-1",
      name: "شاشة لمس 55 بوصة للكشك",
      quantity: 2,
      unitCost: 150,
      amount: 300,
      unit: "جهاز"
    },
    {
      id: "pi-2",
      name: "حساس قارئ بصمة حراري",
      quantity: 5,
      unitCost: 20,
      amount: 100,
      unit: "قطعة"
    }
  ],
  subtotal: 400,
  taxRate: 5,
  taxAmount: 20,
  discountAmount: 0,
  shippingFee: 0,
  totalAmount: 420,
  currency: "OMR",
  paymentStatus: "UNPAID",
  paymentMethod: "BANK_TRANSFER",
  status: "RECEIVED",
  autoUpdateStock: true,
  createdAt: "2026-09-10T10:00:00Z",
  updatedAt: "2026-09-10T10:00:00Z"
};

const createdVoucher = createPaymentVoucherFromPurchase(samplePurchase, {
  existingVouchers: loadVouchers(),
  companySettings: loadCompanySettings(),
  onSaveVouchers: saveVouchers
});

assert(createdVoucher.type === "PAYMENT", "Voucher type is PAYMENT");
assert(createdVoucher.receivedFrom === "شركة الخليج للتوريدات التقنية", "Voucher receivedFrom matches supplier name");
assert(createdVoucher.totalAmount === 420, "Total amount matches purchase totalAmount (420 OMR)");
assert(createdVoucher.subtotal === 400, "Subtotal matches purchase subtotal (400 OMR)");
assert(createdVoucher.taxAmount === 20, "Tax amount matches purchase taxAmount (20 OMR)");
assert(createdVoucher.currency === "OMR", "Currency matches purchase currency");
assert(createdVoucher.lineItems.length === 2, "Line items mapped (2 items)");
assert(createdVoucher.lineItems[0].description.includes("شاشة لمس"), "First line item description formatted");
assert(createdVoucher.amountInWords.length > 0, "Amount in words generated");

// Check persistence
const persistedVouchers = loadVouchers();
assert(persistedVouchers.length === 1, "Voucher persisted to localStorage list");
assert(persistedVouchers[0].id === createdVoucher.id, "Persisted voucher ID matches created voucher");

// SUMMARY
console.log(`\n========================================================`);
console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`========================================================\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
