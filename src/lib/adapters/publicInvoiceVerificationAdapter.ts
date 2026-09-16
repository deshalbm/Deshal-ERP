import type { PublicInvoiceVerificationPort } from '../../application/ports/publicInvoiceVerificationPort';
import { verifyInvoiceOrVoucher as supabaseVerifyInvoiceOrVoucher } from '../supabase/qrVerificationService';
import type { PublicInvoiceVerification } from '../../types';

export const defaultPublicInvoiceVerificationAdapter: PublicInvoiceVerificationPort = {
  verifyInvoiceOrVoucher(invoiceId: string, token: string): Promise<PublicInvoiceVerification> {
    return supabaseVerifyInvoiceOrVoucher(invoiceId, token);
  }
};
