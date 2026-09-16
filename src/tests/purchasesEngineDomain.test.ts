/**
 * Characterization Unit Test Suite — Purchases & Supplier Order Processing Engine
 * Verifies purchase line calculations, invoice totals with VAT & shipping,
 * payment status evaluations, stock receipt deltas, and summary analytics.
 */

import {
  calculatePurchaseItemAmount,
  calculatePurchaseInvoiceTotals,
  evaluatePurchasePaymentStatus,
  calculatePurchaseStockReceiptDelta,
  calculatePurchasesSummaryAnalytics,
  PurchaseItemInput,
} from '../domain/purchases/purchasesEngine';
import { PurchaseInvoice } from '../types/purchases';

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
  console.log("  DESHAL ERP — PURCHASES & SUPPLIER ENGINE UNIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: PURCHASE ITEM AMOUNT CALCULATION ---
  console.log("\n--- TEST 1: PURCHASE ITEM AMOUNT CALCULATION ---");
  assert(calculatePurchaseItemAmount(10, 5.5) === 55, "10 items @ 5.500 OMR = 55.000 OMR");
  assert(calculatePurchaseItemAmount(3, 12.333) === 36.999, "3 items @ 12.333 OMR = 36.999 OMR (rounded)");
  assert(calculatePurchaseItemAmount(0, 50) === 0, "0 quantity returns 0 amount");

  // --- TEST 2: PURCHASE INVOICE TOTALS CALCULATION ---
  console.log("\n--- TEST 2: PURCHASE INVOICE TOTALS CALCULATION ---");
  const items: PurchaseItemInput[] = [
    { quantity: 10, unitCost: 20 }, // 200 OMR
    { quantity: 5, unitCost: 10 },  // 50 OMR
  ];
  // Subtotal = 250 OMR. Discount = 10 OMR. Tax Base = 240 OMR. Tax 5% = 12 OMR. Shipping = 5 OMR. Total = 257 OMR.
  const totals = calculatePurchaseInvoiceTotals(items, 5, 10, 5);
  assert(totals.subtotal === 250, "Subtotal is 250.000 OMR");
  assert(totals.discountAmount === 10, "Discount is 10.000 OMR");
  assert(totals.taxableBase === 240, "Taxable base is 240.000 OMR");
  assert(totals.taxAmount === 12, "5% VAT on 240 OMR is 12.000 OMR");
  assert(totals.shippingFee === 5, "Shipping fee is 5.000 OMR");
  assert(totals.totalAmount === 257, "Grand total is 257.000 OMR");

  // --- TEST 3: PAYMENT STATUS EVALUATION ---
  console.log("\n--- TEST 3: PAYMENT STATUS EVALUATION ---");
  assert(evaluatePurchasePaymentStatus(257, 0) === 'UNPAID', "0 paid on 257 OMR evaluates to UNPAID");
  assert(evaluatePurchasePaymentStatus(257, 100) === 'PARTIAL', "100 paid on 257 OMR evaluates to PARTIAL");
  assert(evaluatePurchasePaymentStatus(257, 257) === 'PAID', "Full payment evaluates to PAID");
  assert(evaluatePurchasePaymentStatus(257, 300) === 'PAID', "Overpayment evaluates to PAID");

  // --- TEST 4: STOCK RECEIPT DELTA EVALUATION ---
  console.log("\n--- TEST 4: STOCK RECEIPT DELTA EVALUATION ---");
  const mockInvoice: PurchaseInvoice = {
    id: "po-1",
    purchaseNumber: "PO-2026-001",
    supplierName: "Oman Cables SAOG",
    date: "2026-01-15",
    warehouse: "Main",
    items: [
      { id: "pi-1", itemId: "item-1", sku: "CBL-01", name: "Copper Wire", quantity: 50, unitCost: 4, amount: 200 }
    ],
    subtotal: 200,
    taxRate: 5,
    taxAmount: 10,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 210,
    currency: "OMR",
    paymentStatus: "UNPAID",
    paymentMethod: "BANK_TRANSFER",
    status: "RECEIVED",
    autoUpdateStock: true,
    createdAt: "",
    updatedAt: ""
  };

  const deltasReceived = calculatePurchaseStockReceiptDelta(mockInvoice);
  assert(deltasReceived.length === 1, "Returns 1 stock receipt delta for RECEIVED auto-update invoice");
  assert(deltasReceived[0].quantityReceived === 50, "Quantity received is 50");

  const mockDraftInvoice: PurchaseInvoice = {
    ...mockInvoice,
    status: "DRAFT"
  };
  const deltasDraft = calculatePurchaseStockReceiptDelta(mockDraftInvoice);
  assert(deltasDraft.length === 0, "Returns 0 deltas for DRAFT invoice");

  // --- TEST 5: PURCHASES SUMMARY ANALYTICS ---
  console.log("\n--- TEST 5: PURCHASES SUMMARY ANALYTICS ---");
  const invoices: PurchaseInvoice[] = [
    mockInvoice, // total 210, RECEIVED, UNPAID
    {
      ...mockInvoice,
      id: "po-2",
      status: "ORDERED",
      paymentStatus: "PAID",
      totalAmount: 100
    },
    {
      ...mockInvoice,
      id: "po-3",
      status: "CANCELLED",
      paymentStatus: "UNPAID",
      totalAmount: 500
    }
  ];

  const analytics = calculatePurchasesSummaryAnalytics(invoices);
  assert(analytics.totalInvoicesCount === 3, "Counts 3 total purchase invoices");
  assert(analytics.receivedCount === 1, "Counts 1 RECEIVED order");
  assert(analytics.orderedCount === 1, "Counts 1 ORDERED order");
  assert(analytics.cancelledCount === 1, "Counts 1 CANCELLED order");
  assert(analytics.totalSpending === 310, "Total spending excludes cancelled invoice (210 + 100 = 310 OMR)");
  assert(analytics.totalUnpaidLiabilities === 210, "Total unpaid liabilities equals 210 OMR");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
