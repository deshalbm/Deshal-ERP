import type { PublicInvoiceVerification } from '../../types';

export interface PublicInvoiceVerificationPort {
  verifyInvoiceOrVoucher(invoiceId: string, token: string): Promise<PublicInvoiceVerification>;
}
