/**
 * QR Verification Service — Public Invoice & Voucher Verification
 */

import { supabase, isSupabaseConfigured } from './client';
import type { PublicInvoiceVerification } from '../../types';
import { ensureNullableUuid } from '../../utils/uuid';

export async function verifyInvoiceOrVoucher(
  invoiceId: string,
  token: string
): Promise<PublicInvoiceVerification> {
  const validInvoiceId = ensureNullableUuid(invoiceId);
  const validToken = ensureNullableUuid(token);

  if (!validInvoiceId || !validToken) {
    return {
      valid: false,
      message: 'معرّف المستند أو رمز التحقق غير صالح.',
    };
  }

  if (!isSupabaseConfigured) {
    return {
      valid: true,
      documentType: 'INVOICE',
      documentNumber: 'INV-LOCAL-001',
      issueDate: new Date().toISOString().split('T')[0],
      companyName: 'ديشال لإدارة الأعمال',
      totalAmount: 150,
      taxAmount: 7.5,
      currency: 'OMR',
      status: 'ISSUED',
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_public_invoice_verification', {
      p_invoice_id: validInvoiceId,
      p_token: validToken,
    });

    if (error || !data) {
      console.error('[QRVerificationService] get_public_invoice_verification error:', error?.message);
      return {
        valid: false,
        message: 'فشلت عملية التحقق من رمز الفاتورة.',
      };
    }

    return data as PublicInvoiceVerification;
  } catch (e: any) {
    console.error('[QRVerificationService] Exception:', e);
    return {
      valid: false,
      message: 'حدث خطأ غير متوقع أثناء التحقق.',
    };
  }
}
