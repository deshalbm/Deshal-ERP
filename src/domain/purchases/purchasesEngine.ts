/**
 * Purchases & Supplier Order Processing Engine — Deshal ERP
 * Pure Domain Layer: Purchase item amount calculation, invoice totals with VAT & shipping,
 * payment status evaluation, stock receipt delta generation, and summary analytics.
 */

import { PurchaseInvoice, PurchaseItem, PurchasePaymentStatus, PurchaseStatus } from '../../types/purchases';

export interface PurchaseItemInput {
  unitCost: number;
  quantity: number;
  amount?: number;
}

export interface PurchaseTotalsResult {
  subtotal: number;
  discountAmount: number;
  taxableBase: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
}

export interface PurchaseStockReceiptDelta {
  itemId?: string;
  sku?: string;
  name: string;
  quantityReceived: number;
  unitCost: number;
}

export interface PurchasesSummaryAnalytics {
  totalInvoicesCount: number;
  totalSpending: number;
  totalUnpaidLiabilities: number;
  receivedCount: number;
  orderedCount: number;
  draftCount: number;
  cancelledCount: number;
}

/**
 * Calculates line amount for a purchase item (quantity * unitCost), rounded to 3 decimal places (OMR standard).
 */
export function calculatePurchaseItemAmount(quantity: number, unitCost: number): number {
  const qty = Math.max(0, Number(quantity) || 0);
  const cost = Math.max(0, Number(unitCost) || 0);
  return Math.round(qty * cost * 1000) / 1000;
}

/**
 * Computes purchase invoice subtotal, tax base, VAT amount, shipping fee, and grand total.
 */
export function calculatePurchaseInvoiceTotals(
  items: PurchaseItemInput[],
  taxRate: number = 5, // Default Oman VAT rate 5%
  discountAmount: number = 0,
  shippingFee: number = 0
): PurchaseTotalsResult {
  let subtotal = 0;

  items.forEach((item) => {
    const itemAmount = item.amount !== undefined && item.amount >= 0
      ? item.amount
      : calculatePurchaseItemAmount(item.quantity, item.unitCost);
    subtotal += itemAmount;
  });

  subtotal = Math.round(subtotal * 1000) / 1000;
  const safeDiscount = Math.max(0, Number(discountAmount) || 0);
  const safeShipping = Math.max(0, Number(shippingFee) || 0);
  const safeTaxRate = Math.max(0, Number(taxRate) || 0);

  const taxableBase = Math.round(Math.max(0, subtotal - safeDiscount) * 1000) / 1000;
  const taxAmount = Math.round(taxableBase * (safeTaxRate / 100) * 1000) / 1000;
  const totalAmount = Math.round((taxableBase + taxAmount + safeShipping) * 1000) / 1000;

  return {
    subtotal,
    discountAmount: safeDiscount,
    taxableBase,
    taxAmount,
    shippingFee: safeShipping,
    totalAmount,
  };
}

/**
 * Evaluates payment status based on total invoice amount vs cumulative paid amount.
 */
export function evaluatePurchasePaymentStatus(totalAmount: number, paidAmount: number): PurchasePaymentStatus {
  const total = Math.max(0, Number(totalAmount) || 0);
  const paid = Math.max(0, Number(paidAmount) || 0);

  if (paid <= 0) {
    return 'UNPAID';
  }
  if (paid >= total && total > 0) {
    return 'PAID';
  }
  return 'PARTIAL';
}

/**
 * Generates inventory receipt deltas for a purchase invoice if status is RECEIVED and autoUpdateStock is enabled.
 */
export function calculatePurchaseStockReceiptDelta(invoice: {
  status: PurchaseStatus;
  autoUpdateStock: boolean;
  items: PurchaseItem[];
}): PurchaseStockReceiptDelta[] {
  if (invoice.status !== 'RECEIVED' || !invoice.autoUpdateStock) {
    return [];
  }

  return invoice.items.map((item) => ({
    itemId: item.itemId,
    sku: item.sku,
    name: item.name,
    quantityReceived: Math.max(0, Number(item.quantity) || 0),
    unitCost: Math.max(0, Number(item.unitCost) || 0),
  }));
}

/**
 * Computes summary analytics across a collection of purchase invoices.
 */
export function calculatePurchasesSummaryAnalytics(invoices: PurchaseInvoice[]): PurchasesSummaryAnalytics {
  let totalSpending = 0;
  let totalUnpaidLiabilities = 0;
  let receivedCount = 0;
  let orderedCount = 0;
  let draftCount = 0;
  let cancelledCount = 0;

  invoices.forEach((inv) => {
    const totals = calculatePurchaseInvoiceTotals(
      inv.items,
      inv.taxRate,
      inv.discountAmount,
      inv.shippingFee
    );

    const invoiceTotal = inv.totalAmount !== undefined && inv.totalAmount >= 0 ? inv.totalAmount : totals.totalAmount;

    if (inv.status !== 'CANCELLED') {
      totalSpending += invoiceTotal;
      if (inv.paymentStatus === 'UNPAID') {
        totalUnpaidLiabilities += invoiceTotal;
      } else if (inv.paymentStatus === 'PARTIAL') {
        totalUnpaidLiabilities += invoiceTotal / 2;
      }
    }

    switch (inv.status) {
      case 'RECEIVED':
        receivedCount++;
        break;
      case 'ORDERED':
        orderedCount++;
        break;
      case 'DRAFT':
        draftCount++;
        break;
      case 'CANCELLED':
        cancelledCount++;
        break;
    }
  });

  return {
    totalInvoicesCount: invoices.length,
    totalSpending: Math.round(totalSpending * 1000) / 1000,
    totalUnpaidLiabilities: Math.round(totalUnpaidLiabilities * 1000) / 1000,
    receivedCount,
    orderedCount,
    draftCount,
    cancelledCount,
  };
}
