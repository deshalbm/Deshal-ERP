import { createNewVoucherState } from "../domain/vouchers/voucherFactory";
import { ReceiptVoucher, CompanySettings } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — VOUCHER FACTORY DOMAIN UNIT TEST SUITE");
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

const mockCompanySettings: Partial<CompanySettings> = {
  defaultCurrency: "OMR",
  termsAndConditions: "الشروط الرسمية المعتمدة",
  authorizedSignatoryName: "مدير شركة ديشال"
};

// [Test 1] Receipt Voucher Creation
console.log("[Test 1] Receipt Voucher Creation & Defaults");
const receiptVoucher = createNewVoucherState("RECEIPT", [], mockCompanySettings);
assert(receiptVoucher.type === "RECEIPT", "Voucher type is RECEIPT");
assert(receiptVoucher.voucherNumber.startsWith("RV-"), "Voucher number prefix is RV-");
assert(receiptVoucher.taxRate === 0, "Receipt Voucher has 0% tax rate by default");
assert(receiptVoucher.totalAmount === 250, "Total amount matches subtotal (250 OMR)");
assert(typeof receiptVoucher.amountInWords === "string" && receiptVoucher.amountInWords.length > 0, "Amount in words is non-empty string");

// [Test 2] Tax Invoice Creation & 5% VAT Math
console.log("\n[Test 2] Tax Invoice Creation & 5% VAT Calculation");
const taxInvoice = createNewVoucherState("TAX_INVOICE", [], mockCompanySettings);
assert(taxInvoice.type === "TAX_INVOICE", "Voucher type is TAX_INVOICE");
assert(taxInvoice.voucherNumber.startsWith("INV-"), "Invoice voucher number prefix is INV-");
assert(taxInvoice.taxRate === 5, "Tax Invoice applies 5% VAT tax rate");
assert(taxInvoice.subtotal === 250, "Subtotal is 250 OMR");
assert(taxInvoice.taxAmount === 12.5, "5% VAT tax amount on 250 OMR is 12.5 OMR");
assert(taxInvoice.totalAmount === 262.5, "Total amount is 262.5 OMR (subtotal + VAT)");

// [Test 3] Payment Voucher Creation
console.log("\n[Test 3] Payment Voucher Creation");
const paymentVoucher = createNewVoucherState("PAYMENT", [], mockCompanySettings);
assert(paymentVoucher.type === "PAYMENT", "Voucher type is PAYMENT");
assert(paymentVoucher.voucherNumber.startsWith("PV-"), "Payment Voucher prefix is PV-");
assert(paymentVoucher.receivedFrom === "مؤسسة التوريدات والخدمات العامة", "Default client name for PAYMENT voucher");

// [Test 4] Document Number Auto-Increment Sequence
console.log("\n[Test 4] Document Number Auto-Increment Sequence");
const currentYear = new Date().getFullYear();
const mockHistory: ReceiptVoucher[] = [
  { ...receiptVoucher, voucherNumber: `RV-${currentYear}-0805` },
  { ...receiptVoucher, voucherNumber: `INV-${currentYear}-0812` }
];
const nextVoucher = createNewVoucherState("RECEIPT", mockHistory, mockCompanySettings);
assert(nextVoucher.voucherNumber === `RV-${currentYear}-0813`, "Sequence auto-increments from max existing (812 -> 0813)");

// [Test 5] Date and Due Date Initialization
console.log("\n[Test 5] Date & Due Date Initialization");
const todayStr = new Date().toISOString().split("T")[0];
assert(receiptVoucher.date === todayStr, `Voucher date equals today (${todayStr})`);
assert(taxInvoice.dueDate !== undefined, "Tax Invoice has a 15-day due date set");

// [Test 6] Currency Handling
console.log("\n[Test 6] Currency Handling");
const usdSettings: Partial<CompanySettings> = { defaultCurrency: "USD" };
const usdVoucher = createNewVoucherState("RECEIPT", [], usdSettings);
assert(usdVoucher.currency === "USD", "Currency respects company defaultCurrency (USD)");

console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
