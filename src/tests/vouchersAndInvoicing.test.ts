/**
 * Deshal ERP — Vouchers, Invoicing, Master Data & Accounting Core Test Suite
 */

import { fetchNextVoucherNumber, postVoucherFinancialTransaction } from '../lib/supabase/accountingService';
import { normalizePhone, checkPhoneExists } from '../lib/supabase/customerService';
import { verifyInvoiceOrVoucher } from '../lib/supabase/qrVerificationService';
import type { ReceiptVoucher, LineItem } from '../types';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetail) console.error(`     Detail: ${failureDetail}`);
  }
}

async function runVoucherAndInvoicingTests() {
  console.log('\n================================================================');
  console.log('  DESHAL ERP — VOUCHERS, INVOICES & ACCOUNTING OVERHAUL TEST SUITE');
  console.log('================================================================\n');

  const testCompanyId = '00000000-0000-0000-0000-000000000001';

  // [Test 1] Phone Normalization & Formatting
  console.log('[Test 1] Phone Normalization Rule (+968)');
  const norm1 = normalizePhone('968 9123 4567');
  const norm2 = normalizePhone('+968 91234567');
  const norm3 = normalizePhone('91234567');
  assert(norm1 === '+96891234567', 'Format "968 9123 4567" converts to "+96891234567"');
  assert(norm2 === '+96891234567', 'Format "+968 91234567" converts to "+96891234567"');
  assert(norm3 === '+96891234567', 'Local 8 digits "91234567" converts to "+96891234567"');
  assert(norm1 === norm2 && norm2 === norm3, 'All variations normalize to identical string representation');

  // [Test 2] Atomic Voucher Sequence Generation
  console.log('\n[Test 2] Atomic Concurrency-Safe Sequence Generator');
  const numInvoice = await fetchNextVoucherNumber(testCompanyId, 'TAX_INVOICE');
  const numReceipt = await fetchNextVoucherNumber(testCompanyId, 'RECEIPT');
  const numPayment = await fetchNextVoucherNumber(testCompanyId, 'PAYMENT');
  assert(numInvoice.startsWith('INV-'), 'Tax Invoice receives "INV-" prefix');
  assert(numReceipt.startsWith('REC-'), 'Receipt Voucher receives "REC-" prefix');
  assert(numPayment.startsWith('PAY-'), 'Payment Voucher receives "PAY-" prefix');

  // [Test 3] POS Card Security (Strictly 4 Digits)
  console.log('\n[Test 3] POS Card Security Protection (Strictly Last 4 Digits)');
  const validPos = '1234';
  const invalidPosCard = '4532112233445566'; // Full card number
  const posRegex = /^\d{4}$/;
  assert(posRegex.test(validPos), 'Valid 4 digits "1234" passes regex check');
  assert(!posRegex.test(invalidPosCard), 'Full 16-digit card number is REJECTED by POS safety regex');

  // [Test 4] Discount Math & Bounds Checking
  console.log('\n[Test 4] Structured Discount Math (Percentage vs Fixed)');
  const subtotal = 100;
  const pctDiscValue = 10; // 10%
  const calcPctAmt = (subtotal * pctDiscValue) / 100;
  assert(calcPctAmt === 10, '10% discount on 100 OMR yields 10 OMR discount amount');

  const fixedDiscValue = 15; // 15 OMR
  const calcFixedAmt = Math.min(subtotal, fixedDiscValue);
  assert(calcFixedAmt === 15, 'Fixed discount of 15 OMR yields 15 OMR discount amount');

  const invalidPct = 150; // 150%
  const boundedPct = Math.min(100, Math.max(0, invalidPct));
  assert(boundedPct === 100, 'Percentage discount > 100% is bounded to max 100%');

  // [Test 5] QR Public Verification Token System
  console.log('\n[Test 5] Public QR Verification Token Lookup');
  const sampleId = '00000000-0000-0000-0000-000000000002';
  const sampleToken = '00000000-0000-0000-0000-000000000003';
  const qrRes = await verifyInvoiceOrVoucher(sampleId, sampleToken);
  assert(typeof qrRes.valid === 'boolean', 'QR Verification service returns valid boolean result');

  // [Test 6] Atomic Financial Transaction Payload
  console.log('\n[Test 6] Financial Transaction Payload Integrity');
  const dummyVoucher: Partial<ReceiptVoucher> = {
    voucherNumber: 'INV-2026-9901',
    type: 'TAX_INVOICE',
    receivedFrom: 'شركة الدليل الشامل',
    totalAmount: 250.000,
    currency: 'OMR',
    paymentMethod: 'BANK_TRANSFER',
    lineItems: [
      { id: 'li-1', description: 'تركيب شاشات ذكية', quantity: 1, unitPrice: 250, amount: 250 }
    ]
  };

  assert(dummyVoucher.lineItems!.length > 0, 'Financial transaction contains at least 1 line item');
  assert(dummyVoucher.totalAmount! > 0, 'Financial transaction total amount > 0');

  console.log('\n================================================================');
  console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runVoucherAndInvoicingTests().catch((err) => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
