import type { PublicInvoiceVerificationPort } from '../ports/publicInvoiceVerificationPort';
import type { PublicInvoiceVerification } from '../../types';

export async function verifyPublicInvoice(
  invoiceId: string,
  token: string,
  verificationAdapter?: PublicInvoiceVerificationPort
): Promise<PublicInvoiceVerification> {
  if (!verificationAdapter) {
    return { valid: false, message: 'Verification adapter not provided.' };
  }
  return verificationAdapter.verifyInvoiceOrVoucher(invoiceId, token);
}
