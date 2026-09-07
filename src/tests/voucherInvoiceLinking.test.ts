/**
 * Deshal ERP — Receipt Voucher Invoice Linking & Balance Calculation Unit Tests
 */

import { saveVouchers, loadVouchers } from '../utils/storage';
import type { ReceiptVoucher } from '../types';

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

// Mock localStorage for node environment
if (typeof global.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function runVoucherInvoiceLinkingTests() {
  console.log('\n================================================================');
  console.log('  DESHAL ERP — VOUCHER INVOICE LINKING & BALANCE TEST SUITE');
  console.log('================================================================\n');

  // [Test 1] Paid & Remaining Balance Calculations
  console.log('[Test 1] Paid Amount & Remaining Balance Calculation');
  const sampleVoucher: ReceiptVoucher = {
    id: 'rec-test-101',
    type: 'RECEIPT',
    voucherNumber: 'REC-2026-9001',
    referenceNo: '',
    date: '2026-09-07',
    receivedFrom: 'مركز الدليل الشامل',
    amount: 1000,
    subtotal: 1000,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 1000,
    paidAmount: 400,
    remainingAmount: 600,
    currency: 'OMR',
    amountInWords: 'أربعمائة ريال عماني',
    isCustomWords: false,
    paymentMethod: 'BANK_TRANSFER',
    category: 'عام',
    lineItems: [
      { id: 'li-1', description: 'شاشة تفاعلية ذكية', quantity: 1, unitPrice: 1000, amount: 1000 }
    ],
    notes: 'دفعة مقدمة',
    terms: '',
    preparedBy: 'المحاسب',
    approvedBy: 'المدير المالي',
    receivedBy: 'المستلم',
    status: 'ISSUED',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
    customFields: []
  };

  const calculatedRemaining = Math.max(0, sampleVoucher.totalAmount - (sampleVoucher.paidAmount || 0));
  assert(calculatedRemaining === 600, 'Remaining amount for 1000 total with 400 paid is 600 OMR');
  assert(sampleVoucher.paidAmount === 400, 'Paid amount is accurately set to 400 OMR');

  // [Test 2] Linking Receipt Voucher to Existing Tax Invoice
  console.log('\n[Test 2] Linking Receipt Voucher to Existing Tax Invoice');
  const existingInvoice: ReceiptVoucher = {
    ...sampleVoucher,
    id: 'inv-existing-888',
    type: 'TAX_INVOICE',
    voucherNumber: 'INV-2026-8888',
    notes: 'فاتورة ضريبية أصلية'
  };

  const linkedReceipt: ReceiptVoucher = {
    ...sampleVoucher,
    id: 'rec-linked-902',
    voucherNumber: 'REC-2026-9002',
    linkedInvoiceId: existingInvoice.id,
    linkedInvoiceNumber: existingInvoice.voucherNumber
  };

  assert(linkedReceipt.linkedInvoiceId === 'inv-existing-888', 'Receipt voucher holds linked invoice ID');
  assert(linkedReceipt.linkedInvoiceNumber === 'INV-2026-8888', 'Receipt voucher holds linked invoice number string');

  // [Test 3] Auto-Generate Matching Tax Invoice on Save
  console.log('\n[Test 3] Auto-Generate Matching Tax Invoice upon Saving');
  const autoGenReceipt: ReceiptVoucher = {
    ...sampleVoucher,
    id: 'rec-autogen-903',
    voucherNumber: 'REC-2026-9003',
    autoGenerateInvoice: true,
    linkedInvoiceId: undefined,
    linkedInvoiceNumber: undefined
  };

  saveVouchers([autoGenReceipt]);
  const savedVouchers = loadVouchers();
  const foundReceipt = savedVouchers.find((v) => v.id === 'rec-autogen-903');
  const foundAutoInvoice = savedVouchers.find((v) => v.type === 'TAX_INVOICE' && v.referenceNo === 'REC-2026-9003');

  assert(foundReceipt !== undefined, 'Receipt voucher was saved successfully');
  assert(foundReceipt?.linkedInvoiceId !== undefined, 'Receipt voucher was populated with auto-generated invoice ID');
  assert(foundReceipt?.linkedInvoiceNumber !== undefined, 'Receipt voucher was populated with auto-generated invoice number');
  assert(foundAutoInvoice !== undefined, 'Matching TAX_INVOICE voucher was automatically issued upon saving receipt');

  console.log(`\n----------------------------------------------------------------`);
  console.log(`Test Execution Summary: ${passedCount}/${totalCount} tests passed.`);
  console.log(`----------------------------------------------------------------\n`);

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runVoucherInvoiceLinkingTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
