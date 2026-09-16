/**
 * Document Security, Verification QR & Official Stamp Engine — Deshal ERP
 * Pure Domain Layer: Standardized document serial numbering, QR code verification payloads,
 * authenticity checksum verification, and official stamp application policy.
 */

import { PublicInvoiceVerification } from '../../types/common';

export type DocumentTypeKey =
  | 'INVOICE'
  | 'PURCHASE'
  | 'RECEIPT_VOUCHER'
  | 'PAYMENT_VOUCHER'
  | 'SPACE_BOOKING'
  | 'LEASE_CONTRACT'
  | 'EMPLOYEE_REQUEST';

export interface DocumentQRInput {
  documentType: DocumentTypeKey;
  documentNumber: string;
  issueDate: string; // YYYY-MM-DD
  issuerName: string;
  issuerTaxId?: string;
  totalAmount: number;
  taxAmount: number;
  currency?: string;
}

export interface DocumentQRPayloadResult {
  verificationCode: string;
  verificationUrl: string;
  qrPayloadString: string;
}

export interface StampPolicyResult {
  requiresStamp: boolean;
  requiresDigitalSignature: boolean;
  reason: string;
}

/**
 * Formats standardized document reference serial numbers (e.g., INV-2026-0001, PO-2026-0042).
 */
export function formatDocumentReference(
  docType: DocumentTypeKey,
  sequenceNumber: number,
  year?: number,
  nowMs: number = Date.now()
): string {
  const currentYear = year ?? new Date(nowMs).getFullYear();
  let prefix = 'DOC';
  switch (docType) {
    case 'INVOICE':
      prefix = 'INV';
      break;
    case 'PURCHASE':
      prefix = 'PO';
      break;
    case 'RECEIPT_VOUCHER':
      prefix = 'RV';
      break;
    case 'PAYMENT_VOUCHER':
      prefix = 'PV';
      break;
    case 'SPACE_BOOKING':
      prefix = 'BK';
      break;
    case 'LEASE_CONTRACT':
      prefix = 'CNT';
      break;
    case 'EMPLOYEE_REQUEST':
      prefix = 'REQ';
      break;
  }

  const seqStr = String(Math.max(1, Number(sequenceNumber) || 1)).padStart(4, '0');
  return `${prefix}-${currentYear}-${seqStr}`;
}

/**
 * Calculates a deterministic verification checksum for a document based on its core attributes.
 */
export function calculateDocumentChecksum(
  documentNumber: string,
  issueDate: string,
  totalAmount: number,
  issuerTaxId: string = ''
): string {
  const roundedTotal = (Math.round(totalAmount * 1000) / 1000).toFixed(3);
  const rawStr = `${documentNumber.trim()}|${issueDate.trim()}|${roundedTotal}|${issuerTaxId.trim()}`;

  let hash = 0;
  for (let i = 0; i < rawStr.length; i++) {
    const char = rawStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const positiveHex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `V-${positiveHex}`;
}

/**
 * Generates public verification code, verification URL, and QR code string payload.
 */
export function generateDocumentQRPayload(
  input: DocumentQRInput,
  baseUrl: string = 'https://erp.deshalbm.com'
): DocumentQRPayloadResult {
  const roundedTotal = Math.round((Number(input.totalAmount) || 0) * 1000) / 1000;
  const roundedTax = Math.round((Number(input.taxAmount) || 0) * 1000) / 1000;
  const currency = input.currency || 'OMR';

  const verificationCode = calculateDocumentChecksum(
    input.documentNumber,
    input.issueDate,
    roundedTotal,
    input.issuerTaxId || ''
  );

  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const verificationUrl = `${cleanBaseUrl}/verify?code=${verificationCode}&doc=${encodeURIComponent(
    input.documentNumber
  )}`;

  const qrPayloadString = [
    `ISSUER:${input.issuerName}`,
    `TAX_ID:${input.issuerTaxId || 'N/A'}`,
    `DOC:${input.documentNumber}`,
    `DATE:${input.issueDate}`,
    `TOTAL:${roundedTotal.toFixed(3)} ${currency}`,
    `TAX:${roundedTax.toFixed(3)} ${currency}`,
    `CODE:${verificationCode}`,
  ].join('\n');

  return {
    verificationCode,
    verificationUrl,
    qrPayloadString,
  };
}

/**
 * Verifies document authenticity against a provided verification code and input attributes.
 */
export function verifyDocumentAuthenticity(
  verificationCode: string,
  input: DocumentQRInput
): PublicInvoiceVerification {
  const expectedCode = calculateDocumentChecksum(
    input.documentNumber,
    input.issueDate,
    input.totalAmount,
    input.issuerTaxId || ''
  );

  const isValid = verificationCode.trim().toUpperCase() === expectedCode.trim().toUpperCase();

  if (!isValid) {
    return {
      valid: false,
      message: 'رمز التحقق غير متطابق أو تم تعديل البيانات الأصلية للمستند',
    };
  }

  const roundedTotal = Math.round((Number(input.totalAmount) || 0) * 1000) / 1000;
  const roundedTax = Math.round((Number(input.taxAmount) || 0) * 1000) / 1000;

  return {
    valid: true,
    documentType: input.documentType === 'INVOICE' ? 'INVOICE' : 'VOUCHER',
    documentNumber: input.documentNumber,
    issueDate: input.issueDate,
    companyName: input.issuerName,
    totalAmount: roundedTotal,
    taxAmount: roundedTax,
    currency: input.currency || 'OMR',
    status: 'AUTHENTICATED',
    message: 'المستند موثق ومعتمد رسمياً من نظام ديشال ERP',
  };
}

/**
 * Evaluates whether official stamp and digital signature are required according to company policy.
 */
export function evaluateStampPolicy(
  docType: DocumentTypeKey,
  totalAmount: number = 0,
  isApproved: boolean = true
): StampPolicyResult {
  if (!isApproved) {
    return {
      requiresStamp: false,
      requiresDigitalSignature: false,
      reason: 'المستند غير معتمد رسمياً بعد',
    };
  }

  if (docType === 'INVOICE' || docType === 'RECEIPT_VOUCHER' || docType === 'LEASE_CONTRACT') {
    return {
      requiresStamp: true,
      requiresDigitalSignature: true,
      reason: 'مستند مالي/قانوني رسمي يقتضي الختم والتوقيع الرقمي',
    };
  }

  if (docType === 'PAYMENT_VOUCHER' || docType === 'PURCHASE') {
    const isHighValue = totalAmount >= 500;
    return {
      requiresStamp: true,
      requiresDigitalSignature: isHighValue,
      reason: isHighValue
        ? 'سند ذو قيمة عالية يقتضي الختم والتوقيع الرقمي'
        : 'سند يقتضي الختم الرسمي',
    };
  }

  return {
    requiresStamp: false,
    requiresDigitalSignature: false,
    reason: 'مستند إداري داخلي لا يتطلب ختماً مالياً رسمياً',
  };
}
