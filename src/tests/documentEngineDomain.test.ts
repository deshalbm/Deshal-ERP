/**
 * Characterization Unit Test Suite — Document Security, Verification QR & Official Stamp Engine
 * Verifies document reference serial formatting, QR code verification payloads,
 * authenticity checksum verification, and official stamp application policy.
 */

import {
  formatDocumentReference,
  calculateDocumentChecksum,
  generateDocumentQRPayload,
  verifyDocumentAuthenticity,
  evaluateStampPolicy,
  DocumentQRInput,
} from '../domain/documents/documentEngine';

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
  console.log("  DESHAL ERP — DOCUMENT SECURITY & VERIFICATION QR TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: SERIAL REFERENCE NUMBER FORMATTING ---
  console.log("\n--- TEST 1: SERIAL REFERENCE NUMBER FORMATTING ---");
  assert(formatDocumentReference('INVOICE', 1, 2026) === 'INV-2026-0001', "Formats invoice serial INV-2026-0001");
  assert(formatDocumentReference('PURCHASE', 42, 2026) === 'PO-2026-0042', "Formats purchase serial PO-2026-0042");
  assert(formatDocumentReference('RECEIPT_VOUCHER', 850, 2026) === 'RV-2026-0850', "Formats receipt voucher serial RV-2026-0850");
  assert(formatDocumentReference('LEASE_CONTRACT', 5, 2026) === 'CNT-2026-0005', "Formats lease contract serial CNT-2026-0005");

  // --- TEST 2: QR CODE VERIFICATION PAYLOAD GENERATION ---
  console.log("\n--- TEST 2: QR CODE VERIFICATION PAYLOAD GENERATION ---");
  const docInput: DocumentQRInput = {
    documentType: 'INVOICE',
    documentNumber: 'INV-2026-0001',
    issueDate: '2026-01-15',
    issuerName: 'Deshal Business Management LLC',
    issuerTaxId: 'OM-12345678',
    totalAmount: 257,
    taxAmount: 12,
    currency: 'OMR',
  };

  const payload = generateDocumentQRPayload(docInput, 'https://erp.deshalbm.com');
  assert(payload.verificationCode.startsWith('V-'), "Verification code starts with 'V-' prefix");
  assert(payload.verificationUrl.includes('/verify?code='), "Verification URL includes /verify?code=");
  assert(payload.qrPayloadString.includes('ISSUER:Deshal Business Management LLC'), "QR payload string contains issuer name");
  assert(payload.qrPayloadString.includes('TOTAL:257.000 OMR'), "QR payload string formats total amount with 3 decimals");

  // --- TEST 3: DOCUMENT AUTHENTICITY VERIFICATION ---
  console.log("\n--- TEST 3: DOCUMENT AUTHENTICITY VERIFICATION ---");
  const validRes = verifyDocumentAuthenticity(payload.verificationCode, docInput);
  assert(validRes.valid === true, "Valid verification code passes authenticity check");
  assert(validRes.status === 'AUTHENTICATED', "Verification status is AUTHENTICATED");

  const tamperedRes = verifyDocumentAuthenticity('V-TAMPERED', docInput);
  assert(tamperedRes.valid === false, "Fails authenticity check for invalid/tampered verification code");

  // --- TEST 4: OFFICIAL STAMP & SIGNATURE POLICY ---
  console.log("\n--- TEST 4: OFFICIAL STAMP & SIGNATURE POLICY ---");
  const invoicePolicy = evaluateStampPolicy('INVOICE', 257, true);
  assert(invoicePolicy.requiresStamp === true, "Invoice requires official stamp");
  assert(invoicePolicy.requiresDigitalSignature === true, "Invoice requires digital signature");

  const unapprovedPolicy = evaluateStampPolicy('INVOICE', 257, false);
  assert(unapprovedPolicy.requiresStamp === false, "Unapproved document rejects official stamp");

  const lowValuePurchase = evaluateStampPolicy('PURCHASE', 100, true);
  assert(lowValuePurchase.requiresStamp === true, "Purchase requires stamp");
  assert(lowValuePurchase.requiresDigitalSignature === false, "Low value purchase (< 500 OMR) does not require digital signature");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
