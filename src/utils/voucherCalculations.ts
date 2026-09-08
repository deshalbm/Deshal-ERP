/**
 * Voucher Calculation Engine — Deshal ERP
 * Extracted pure calculation rules for subtotal, VAT, discounts, line-items, and double-entry balance checks.
 */

export interface VoucherLineItemInput {
  unitPrice: number;
  quantity: number;
  discount?: number;
  taxRate?: number;
}

export interface VoucherTotalsResult {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Calculates line item totals including VAT and discounts.
 */
export function calculateLineItemAmount(item: VoucherLineItemInput): { amount: number; taxAmount: number } {
  const qty = Math.max(0, Number(item.quantity) || 0);
  const price = Math.max(0, Number(item.unitPrice) || 0);
  const discount = Math.max(0, Number(item.discount) || 0);
  const taxRate = Math.max(0, Number(item.taxRate) || 0);

  const rawSubtotal = Math.max(0, price * qty - discount);
  const taxAmount = Math.round(rawSubtotal * (taxRate / 100) * 1000) / 1000;
  const amount = Math.round((rawSubtotal + taxAmount) * 1000) / 1000;

  return { amount, taxAmount };
}

/**
 * Computes voucher-level subtotal, total discount, VAT, and final total amount.
 */
export function calculateVoucherTotals(
  items: VoucherLineItemInput[],
  overallTaxRate: number = 0,
  overallDiscount: number = 0
): VoucherTotalsResult {
  let subtotal = 0;
  let totalLineDiscount = 0;
  let totalLineTax = 0;

  items.forEach((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const disc = Math.max(0, Number(item.discount) || 0);
    const lineSubtotal = qty * price;

    subtotal += lineSubtotal;
    totalLineDiscount += disc;

    const { taxAmount } = calculateLineItemAmount(item);
    totalLineTax += taxAmount;
  });

  const totalDiscount = Math.round((totalLineDiscount + Math.max(0, Number(overallDiscount) || 0)) * 1000) / 1000;
  const taxableBase = Math.max(0, subtotal - totalDiscount);
  const overallTax = overallTaxRate > 0 ? Math.round(taxableBase * (overallTaxRate / 100) * 1000) / 1000 : totalLineTax;
  const totalAmount = Math.round((taxableBase + overallTax) * 1000) / 1000;

  return {
    subtotal: Math.round(subtotal * 1000) / 1000,
    discountAmount: totalDiscount,
    taxAmount: Math.round(overallTax * 1000) / 1000,
    totalAmount,
  };
}

/**
 * Validates double-entry accounting balance invariant (Debits == Credits).
 */
export function isJournalBalanced(debits: number, credits: number, precision: number = 0.001): boolean {
  return Math.abs((Number(debits) || 0) - (Number(credits) || 0)) < precision;
}
