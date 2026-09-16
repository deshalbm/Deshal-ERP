import {
  calculateLineItemAmount,
  calculateVoucherTotals,
  isJournalBalanced,
  VoucherLineItemInput
} from "../domain/vouchers/voucherCalculations";

console.log("\n================================================================");
console.log("  DESHAL ERP — VOUCHER CALCULATION DOMAIN UNIT TEST SUITE");
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

// TEST 1: Line Item Calculation Math
console.log("--- TEST 1: LINE ITEM CALCULATION MATH ---");
const item1: VoucherLineItemInput = { quantity: 2, unitPrice: 50 };
const res1 = calculateLineItemAmount(item1);
assert(res1.amount === 100, "Calculates line item amount without tax or discount (2 * 50 = 100)");
assert(res1.taxAmount === 0, "Tax amount is 0 when taxRate is omitted");

const item2: VoucherLineItemInput = { quantity: 2, unitPrice: 100, taxRate: 5 };
const res2 = calculateLineItemAmount(item2);
assert(res2.taxAmount === 10, "5% VAT on 200 OMR produces 10 OMR tax amount");
assert(res2.amount === 210, "Total line amount is 210 OMR (subtotal 200 + tax 10)");

const item3: VoucherLineItemInput = { quantity: 1, unitPrice: 100, discount: 20, taxRate: 5 };
const res3 = calculateLineItemAmount(item3);
assert(res3.taxAmount === 4, "5% VAT on discounted taxable base (100 - 20 = 80) is 4 OMR");
assert(res3.amount === 84, "Total line amount is 84 OMR (80 + tax 4)");

// TEST 2: Voucher Totals Calculation
console.log("\n--- TEST 2: VOUCHER TOTALS CALCULATION ---");
const items: VoucherLineItemInput[] = [
  { quantity: 2, unitPrice: 100, discount: 10, taxRate: 5 }, // Subtotal: 200, Disc: 10, Tax: 9.5
  { quantity: 1, unitPrice: 50, discount: 0, taxRate: 5 }   // Subtotal: 50, Disc: 0, Tax: 2.5
];
const voucherTotals = calculateVoucherTotals(items);
assert(voucherTotals.subtotal === 250, "Computes correct total subtotal (200 + 50 = 250)");
assert(voucherTotals.discountAmount === 10, "Computes correct total discount (10 OMR)");
assert(voucherTotals.taxAmount === 12, "Computes correct total tax amount (9.5 + 2.5 = 12 OMR)");
assert(voucherTotals.totalAmount === 252, "Computes correct final total amount (250 - 10 + 12 = 252 OMR)");

// TEST 3: Overall Tax Rate & Discount Overrides
console.log("\n--- TEST 3: OVERALL TAX RATE & DISCOUNT OVERRIDES ---");
const overrideTotals = calculateVoucherTotals(items, 5, 20); // Overall 5% VAT, 20 OMR additional discount
// subtotal = 250, total discount = 10 + 20 = 30 OMR. Taxable base = 220 OMR. 5% tax on 220 = 11 OMR. Total = 231 OMR.
assert(overrideTotals.discountAmount === 30, "Applies overall discount on top of line discounts (10 + 20 = 30 OMR)");
assert(overrideTotals.taxAmount === 11, "Applies overall 5% VAT rate on taxable base (220 * 0.05 = 11 OMR)");
assert(overrideTotals.totalAmount === 231, "Calculates total amount with overall tax & discount (220 + 11 = 231 OMR)");

// TEST 4: Double-Entry Journal Balance Check (isJournalBalanced)
console.log("\n--- TEST 4: DOUBLE-ENTRY JOURNAL BALANCE INVARIANT ---");
assert(isJournalBalanced(500, 500), "Confirms equal debits and credits are balanced (500 == 500)");
assert(isJournalBalanced(500.0001, 500.0002), "Confirms debits/credits within precision tolerance (0.001) are balanced");
assert(!isJournalBalanced(500, 505), "Rejects imbalanced debits and credits (500 != 505)");

// TEST 5: Edge Cases & Defensive Invariants
console.log("\n--- TEST 5: EDGE CASES & DEFENSIVE INVARIANTS ---");
const emptyTotals = calculateVoucherTotals([]);
assert(emptyTotals.subtotal === 0, "Returns 0 subtotal for empty line items");
assert(emptyTotals.totalAmount === 0, "Returns 0 totalAmount for empty line items");

const invalidItem: VoucherLineItemInput = { quantity: -5, unitPrice: -100, discount: -10 };
const invalidRes = calculateLineItemAmount(invalidItem);
assert(invalidRes.amount === 0, "Safely clamps negative quantity and price to 0");

// SUMMARY
console.log(`\n========================================================`);
console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`========================================================\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
