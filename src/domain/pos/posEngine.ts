/**
 * POS & Cash Register Session Engine — Deshal ERP
 * Pure Domain Layer: Cart line item calculations, order totals with VAT/discounts,
 * payment validation, cash change math, shift reconciliation, and refund payloads.
 */

import {
  CashierShift,
  CashMovement,
  POSOrder,
  POSOrderItem,
  POSPaymentMethod,
  POSPaymentSplit,
} from '../../types/pos';

export interface POSItemInput {
  unitPrice: number;
  quantity: number;
  discount?: number;
  taxRate?: number;
}

export interface POSItemResult {
  subtotal: number;
  discount: number;
  taxableBase: number;
  taxAmount: number;
  total: number;
}

export interface POSOrderTotalsResult {
  subtotal: number;
  itemsDiscount: number;
  orderDiscount: number;
  totalDiscount: number;
  taxableBase: number;
  taxAmount: number;
  totalAmount: number;
}

export interface POSPaymentValidationResult {
  isValid: boolean;
  changeDue: number;
  errorMessage?: string;
}

export interface ShiftReconciliationResult {
  shiftId: string;
  openingCash: number;
  totalSalesCash: number;
  totalSalesCard: number;
  totalSalesCredit: number;
  totalSalesOnline: number;
  totalSalesBank: number;
  totalReturns: number;
  totalDiscounts: number;
  totalTax: number;
  totalNetSales: number;
  ordersCount: number;
  netCashMovements: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
}

/**
 * Calculates item totals (subtotal, discount, tax, total amount) with OMR 3-decimal precision.
 */
export function calculatePOSItemTotals(
  unitPrice: number,
  quantity: number,
  discount: number = 0,
  taxRate: number = 5
): POSItemResult {
  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(unitPrice) || 0);
  const disc = Math.max(0, Number(discount) || 0);
  const rate = Math.max(0, Number(taxRate) || 0);

  const subtotal = Math.round(qty * price * 1000) / 1000;
  const taxableBase = Math.round(Math.max(0, subtotal - disc) * 1000) / 1000;
  const taxAmount = Math.round(taxableBase * (rate / 100) * 1000) / 1000;
  const total = Math.round((taxableBase + taxAmount) * 1000) / 1000;

  return {
    subtotal,
    discount: disc,
    taxableBase,
    taxAmount,
    total,
  };
}

/**
 * Computes order-level subtotal, item discounts, order discount, VAT, and grand total.
 */
export function calculatePOSOrderTotals(
  items: POSItemInput[],
  discountType: 'PERCENT' | 'FIXED' = 'FIXED',
  discountValue: number = 0,
  overallTaxRate: number = 5
): POSOrderTotalsResult {
  let subtotal = 0;
  let itemsDiscount = 0;
  let totalTaxAmount = 0;

  items.forEach((item) => {
    const res = calculatePOSItemTotals(
      item.unitPrice,
      item.quantity,
      item.discount || 0,
      item.taxRate !== undefined ? item.taxRate : overallTaxRate
    );
    subtotal += res.subtotal;
    itemsDiscount += res.discount;
    totalTaxAmount += res.taxAmount;
  });

  subtotal = Math.round(subtotal * 1000) / 1000;
  itemsDiscount = Math.round(itemsDiscount * 1000) / 1000;

  const rawOrderDiscount = discountType === 'PERCENT'
    ? (Math.max(0, subtotal - itemsDiscount) * Math.max(0, discountValue)) / 100
    : Math.max(0, discountValue);

  const orderDiscount = Math.round(rawOrderDiscount * 1000) / 1000;
  const totalDiscount = Math.round((itemsDiscount + orderDiscount) * 1000) / 1000;
  const taxableBase = Math.round(Math.max(0, subtotal - totalDiscount) * 1000) / 1000;
  const taxAmount = Math.round(taxableBase * (overallTaxRate / 100) * 1000) / 1000;
  const totalAmount = Math.round((taxableBase + taxAmount) * 1000) / 1000;

  return {
    subtotal,
    itemsDiscount,
    orderDiscount,
    totalDiscount,
    taxableBase,
    taxAmount,
    totalAmount,
  };
}

/**
 * Validates payment method details and computes cash change due.
 */
export function validatePOSPaymentAndChange(
  totalAmount: number,
  paymentMethod: POSPaymentMethod,
  cashReceived: number = 0,
  splitPayments?: POSPaymentSplit[]
): POSPaymentValidationResult {
  const total = Math.max(0, Number(totalAmount) || 0);

  if (paymentMethod === 'SPLIT') {
    if (!splitPayments || splitPayments.length === 0) {
      return { isValid: false, changeDue: 0, errorMessage: 'Split payment details are required' };
    }
    const sumSplits = splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const roundedSum = Math.round(sumSplits * 1000) / 1000;
    if (Math.abs(roundedSum - total) > 0.001) {
      return {
        isValid: false,
        changeDue: 0,
        errorMessage: `Split payment sum (${roundedSum} OMR) does not match total amount (${total} OMR)`,
      };
    }
    return { isValid: true, changeDue: 0 };
  }

  if (paymentMethod === 'CASH') {
    const received = Math.max(0, Number(cashReceived) || 0);
    if (received < total) {
      return {
        isValid: false,
        changeDue: 0,
        errorMessage: `Cash received (${received} OMR) is less than total amount (${total} OMR)`,
      };
    }
    const changeDue = Math.round((received - total) * 1000) / 1000;
    return { isValid: true, changeDue };
  }

  return { isValid: true, changeDue: 0 };
}

/**
 * Reconciles a cashier shift by computing sales breakdown, net cash movements, expected cash, and variance.
 */
export function reconcileCashierShift(
  shift: CashierShift,
  orders: POSOrder[],
  actualClosingCash?: number
): ShiftReconciliationResult {
  const shiftOrders = orders.filter(
    (o) => o.shiftId === shift.id || (o.cashierId === shift.cashierId && o.date >= shift.openedAt.substring(0, 10))
  );

  let totalSalesCash = 0;
  let totalSalesCard = 0;
  let totalSalesCredit = 0;
  let totalSalesOnline = 0;
  let totalSalesBank = 0;
  let totalReturns = 0;
  let totalDiscounts = 0;
  let totalTax = 0;
  let totalNetSales = 0;

  shiftOrders.forEach((ord) => {
    if (ord.status === 'REFUNDED' || ord.isRefunded) {
      totalReturns += ord.totalAmount;
      return;
    }

    if (ord.status === 'CANCELLED') {
      return;
    }

    totalNetSales += ord.totalAmount;
    totalDiscounts += ord.discountAmount || 0;
    totalTax += ord.taxAmount || 0;

    if (ord.paymentMethod === 'CASH') {
      totalSalesCash += ord.totalAmount;
    } else if (ord.paymentMethod === 'CARD') {
      totalSalesCard += ord.totalAmount;
    } else if (ord.paymentMethod === 'CREDIT') {
      totalSalesCredit += ord.totalAmount;
    } else if (ord.paymentMethod === 'ONLINE') {
      totalSalesOnline += ord.totalAmount;
    } else if (ord.paymentMethod === 'BANK_TRANSFER') {
      totalSalesBank += ord.totalAmount;
    } else if (ord.paymentMethod === 'SPLIT' && ord.splitPayments) {
      ord.splitPayments.forEach((sp) => {
        if (sp.method === 'CASH') totalSalesCash += sp.amount;
        else if (sp.method === 'CREDIT_CARD') totalSalesCard += sp.amount;
        else if (sp.method === 'BANK_TRANSFER') totalSalesBank += sp.amount;
        else totalSalesCredit += sp.amount;
      });
    }
  });

  let netCashMovements = 0;
  if (shift.cashMovements && shift.cashMovements.length > 0) {
    shift.cashMovements.forEach((m) => {
      if (m.type === 'IN') netCashMovements += m.amount;
      else if (m.type === 'OUT') netCashMovements -= m.amount;
    });
  }

  const openingCash = Math.max(0, Number(shift.openingCash) || 0);
  const expectedCash = Math.round((openingCash + totalSalesCash + netCashMovements - totalReturns) * 1000) / 1000;
  const actualCash = actualClosingCash !== undefined ? Math.max(0, Number(actualClosingCash) || 0) : shift.actualCash;
  const difference = actualCash !== undefined ? Math.round((actualCash - expectedCash) * 1000) / 1000 : undefined;

  return {
    shiftId: shift.id,
    openingCash,
    totalSalesCash: Math.round(totalSalesCash * 1000) / 1000,
    totalSalesCard: Math.round(totalSalesCard * 1000) / 1000,
    totalSalesCredit: Math.round(totalSalesCredit * 1000) / 1000,
    totalSalesOnline: Math.round(totalSalesOnline * 1000) / 1000,
    totalSalesBank: Math.round(totalSalesBank * 1000) / 1000,
    totalReturns: Math.round(totalReturns * 1000) / 1000,
    totalDiscounts: Math.round(totalDiscounts * 1000) / 1000,
    totalTax: Math.round(totalTax * 1000) / 1000,
    totalNetSales: Math.round(totalNetSales * 1000) / 1000,
    ordersCount: shiftOrders.filter((o) => o.status === 'COMPLETED').length,
    netCashMovements: Math.round(netCashMovements * 1000) / 1000,
    expectedCash,
    actualCash,
    difference,
  };
}

/**
 * Generates a refund POS order payload for a completed order.
 */
export function generatePOSRefundPayload(
  originalOrder: POSOrder,
  refundReason: string,
  nowMs: number = Date.now()
): POSOrder {
  const refundItems: POSOrderItem[] = originalOrder.items.map((it) => ({
    ...it,
    id: `ref-item-${it.id}`,
    quantity: -Math.abs(it.quantity),
    total: -Math.abs(it.total),
    taxAmount: -Math.abs(it.taxAmount),
  }));

  const now = new Date(nowMs);
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  return {
    ...originalOrder,
    id: `ref-${originalOrder.id}-${nowMs}`,
    orderNumber: `REF-${originalOrder.orderNumber}`,
    date: dateStr,
    time: timeStr,
    items: refundItems,
    subtotal: -Math.abs(originalOrder.subtotal),
    taxAmount: -Math.abs(originalOrder.taxAmount),
    discountAmount: -Math.abs(originalOrder.discountAmount),
    totalAmount: -Math.abs(originalOrder.totalAmount),
    cashReceived: 0,
    changeDue: 0,
    status: 'REFUNDED',
    isRefunded: true,
    refundedOrderId: originalOrder.id,
    refundReason,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
