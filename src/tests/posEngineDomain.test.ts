/**
 * Characterization Unit Test Suite — POS & Cash Register Session Engine
 * Verifies POS cart line calculations, order totals with VAT/discounts,
 * payment validation, cash change math, shift reconciliation, and refund payloads.
 */

import {
  calculatePOSItemTotals,
  calculatePOSOrderTotals,
  validatePOSPaymentAndChange,
  reconcileCashierShift,
  generatePOSRefundPayload,
  POSItemInput,
} from '../domain/pos/posEngine';
import { CashierShift, POSOrder } from '../types/pos';

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
  console.log("  DESHAL ERP — POS & CASH REGISTER ENGINE UNIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: POS ITEM TOTALS CALCULATION ---
  console.log("\n--- TEST 1: POS ITEM TOTALS CALCULATION ---");
  const item1 = calculatePOSItemTotals(10, 2, 2, 5); // subtotal 20, disc 2, tax base 18, 5% tax = 0.900, total = 18.900
  assert(item1.subtotal === 20, "2 items @ 10 OMR = subtotal 20.000 OMR");
  assert(item1.taxableBase === 18, "Taxable base after 2 OMR discount is 18.000 OMR");
  assert(item1.taxAmount === 0.9, "5% VAT on 18 OMR is 0.900 OMR");
  assert(item1.total === 18.9, "Item grand total is 18.900 OMR");

  // --- TEST 2: POS ORDER TOTALS CALCULATION ---
  console.log("\n--- TEST 2: POS ORDER TOTALS CALCULATION ---");
  const orderItems: POSItemInput[] = [
    { unitPrice: 10, quantity: 2, discount: 0, taxRate: 5 }, // subtotal 20, tax 1.000
    { unitPrice: 50, quantity: 1, discount: 0, taxRate: 5 }, // subtotal 50, tax 2.500
  ];
  // Subtotal = 70. Fixed Order Discount = 10. Tax Base = 60. 5% VAT = 3. Total = 63.
  const totalsFixed = calculatePOSOrderTotals(orderItems, 'FIXED', 10, 5);
  assert(totalsFixed.subtotal === 70, "Order subtotal is 70.000 OMR");
  assert(totalsFixed.orderDiscount === 10, "Order discount is 10.000 OMR");
  assert(totalsFixed.taxableBase === 60, "Taxable base is 60.000 OMR");
  assert(totalsFixed.taxAmount === 3, "5% VAT on 60 OMR is 3.000 OMR");
  assert(totalsFixed.totalAmount === 63, "Grand total is 63.000 OMR");

  // Percentage Order Discount 10% on 70 = 7 OMR discount. Tax Base = 63. 5% VAT = 3.150. Total = 66.150 OMR.
  const totalsPercent = calculatePOSOrderTotals(orderItems, 'PERCENT', 10, 5);
  assert(totalsPercent.orderDiscount === 7, "10% order discount on 70 OMR is 7.000 OMR");
  assert(totalsPercent.taxableBase === 63, "Taxable base is 63.000 OMR");
  assert(totalsPercent.taxAmount === 3.15, "5% VAT on 63 OMR is 3.150 OMR");
  assert(totalsPercent.totalAmount === 66.15, "Grand total is 66.150 OMR");

  // --- TEST 3: PAYMENT & CASH CHANGE VALIDATION ---
  console.log("\n--- TEST 3: PAYMENT & CASH CHANGE VALIDATION ---");
  const validCash = validatePOSPaymentAndChange(63, 'CASH', 70);
  assert(validCash.isValid === true, "Cash payment of 70 OMR for 63 OMR order is valid");
  assert(validCash.changeDue === 7, "Change due is 7.000 OMR");

  const invalidCash = validatePOSPaymentAndChange(63, 'CASH', 50);
  assert(invalidCash.isValid === false, "Fails cash payment when cash received is less than total amount");

  const validSplit = validatePOSPaymentAndChange(63, 'SPLIT', 0, [
    { id: "sp-1", method: "CASH", amount: 30 },
    { id: "sp-2", method: "CREDIT_CARD", amount: 33 },
  ]);
  assert(validSplit.isValid === true, "Valid split payment (30 Cash + 33 Card = 63 OMR)");

  const invalidSplit = validatePOSPaymentAndChange(63, 'SPLIT', 0, [
    { id: "sp-1", method: "CASH", amount: 30 },
    { id: "sp-2", method: "CREDIT_CARD", amount: 20 },
  ]);
  assert(invalidSplit.isValid === false, "Fails split payment when sum (50 OMR) does not match total (63 OMR)");

  // --- TEST 4: CASHIER SHIFT RECONCILIATION ---
  console.log("\n--- TEST 4: CASHIER SHIFT RECONCILIATION ---");
  const mockShift: CashierShift = {
    id: "sh-101",
    shiftNumber: "SH-2026-001",
    cashierId: "u-1",
    cashierName: "Salim Cashier",
    branchId: "b-1",
    branchName: "Muscat Main",
    openedAt: "2026-01-15T08:00:00.000Z",
    openingCash: 50,
    expectedCash: 50,
    totalSalesCash: 0,
    totalSalesCard: 0,
    totalSalesCredit: 0,
    totalSalesOnline: 0,
    totalSalesBank: 0,
    totalReturns: 0,
    totalDiscounts: 0,
    totalTax: 0,
    totalNetSales: 0,
    ordersCount: 0,
    cashMovements: [
      { id: "cm-1", type: "IN", amount: 20, reason: "Float addition", time: "10:00", performedByName: "Manager" },
      { id: "cm-2", type: "OUT", amount: 5, reason: "Petty cash expense", time: "12:00", performedByName: "Salim" }
    ],
    status: "OPEN"
  };

  const mockOrders: POSOrder[] = [
    {
      id: "ord-1",
      orderNumber: "POS-001",
      date: "2026-01-15",
      time: "10:30:00",
      branchId: "b-1",
      branchName: "Muscat",
      warehouse: "Main",
      cashierId: "u-1",
      cashierName: "Salim",
      customerName: "Walk-in",
      items: [],
      subtotal: 100,
      taxRate: 5,
      taxAmount: 5,
      discountType: "FIXED",
      discountValue: 0,
      discountAmount: 0,
      totalAmount: 105,
      currency: "OMR",
      paymentMethod: "CASH",
      cashReceived: 110,
      changeDue: 5,
      status: "COMPLETED",
      shiftId: "sh-101",
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "ord-2",
      orderNumber: "POS-002",
      date: "2026-01-15",
      time: "11:00:00",
      branchId: "b-1",
      branchName: "Muscat",
      warehouse: "Main",
      cashierId: "u-1",
      cashierName: "Salim",
      customerName: "Walk-in",
      items: [],
      subtotal: 50,
      taxRate: 5,
      taxAmount: 2.5,
      discountType: "FIXED",
      discountValue: 0,
      discountAmount: 0,
      totalAmount: 52.5,
      currency: "OMR",
      paymentMethod: "CARD",
      cashReceived: 0,
      changeDue: 0,
      status: "COMPLETED",
      shiftId: "sh-101",
      createdAt: "",
      updatedAt: ""
    }
  ];

  // Expected Cash = openingCash (50) + cashSales (105) + netCashMovements (+15) = 170.000 OMR.
  const recon = reconcileCashierShift(mockShift, mockOrders, 168);
  assert(recon.totalSalesCash === 105, "Cash sales total is 105.000 OMR");
  assert(recon.totalSalesCard === 52.5, "Card sales total is 52.500 OMR");
  assert(recon.netCashMovements === 15, "Net cash movements (+20 -5) = +15.000 OMR");
  assert(recon.expectedCash === 170, "Expected closing cash is 170.000 OMR");
  assert(recon.actualCash === 168, "Actual cash entered is 168.000 OMR");
  assert(recon.difference === -2, "Cash variance difference is -2.000 OMR");

  // --- TEST 5: POS REFUND PAYLOAD GENERATION ---
  console.log("\n--- TEST 5: POS REFUND PAYLOAD GENERATION ---");
  const refundPayload = generatePOSRefundPayload(mockOrders[0], "Customer return");
  assert(refundPayload.status === 'REFUNDED', "Refund order status is REFUNDED");
  assert(refundPayload.isRefunded === true, "Refund flag is true");
  assert(refundPayload.totalAmount === -105, "Refund total amount is -105.000 OMR");
  assert(refundPayload.refundedOrderId === "ord-1", "Links to original order ID ord-1");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
