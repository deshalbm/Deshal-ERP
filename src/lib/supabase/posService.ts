/**
 * POS Service — Supabase CRUD
 * Maps POS Orders, POS Order Items, Cashier Shifts, and Held Carts to Supabase tables.
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  POSOrder,
  POSOrderItem,
  CashierShift,
  POSHeldCart,
} from '../../types';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

// ──────────────────────────────────────────────
// POS Orders
// ──────────────────────────────────────────────

export async function getPOSOrders(companyId: string): Promise<POSOrder[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('pos_orders') as any)
    .select('*, pos_order_items(*)')
    .eq('company_id', validCompanyId)
    .order('order_date', { ascending: false });

  if (error) {
    console.error('[POSService] getPOSOrders:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToPOSOrder);
}

export async function upsertPOSOrder(
  order: POSOrder,
  companyId: string
): Promise<{ success: boolean; data?: POSOrder; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);

  const row = {
    id: ensureValidUuid(order.id),
    company_id: validCompanyId,
    branch_id: ensureNullableUuid(order.branchId),
    order_number: order.orderNumber,
    cashier_id: ensureNullableUuid(order.cashierId),
    cashier_name: order.cashierName ?? '',
    customer_id: ensureNullableUuid(order.customerId),
    customer_name: order.customerName ?? '',
    order_date: order.date ?? order.createdAt ?? new Date().toISOString(),
    status: order.status ?? 'COMPLETED',
    payment_method: order.paymentMethod ?? 'CASH',
    subtotal: order.subtotal ?? 0,
    discount_amount: order.discountAmount ?? 0,
    tax_amount: order.taxAmount ?? 0,
    total_amount: order.totalAmount ?? 0,
    amount_tendered: order.cashReceived ?? 0,
    change_amount: order.changeDue ?? 0,
    shift_id: ensureNullableUuid(order.shiftId),
    notes: order.notes ?? '',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('pos_orders') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Upsert lines if provided
  if (order.items && order.items.length > 0) {
    const lines = order.items.map((item: POSOrderItem) => ({
      id: ensureValidUuid(item.id),
      pos_order_id: data.id,
      product_id: ensureNullableUuid(item.itemId),
      description: item.name ?? '',
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_percent: item.discount ?? 0,
      tax_rate: item.taxRate ?? 0,
      total_price: item.total ?? (item.quantity * item.unitPrice),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('pos_order_items') as any).upsert(lines, { onConflict: 'id' });
  }

  return { success: true, data: mapRowToPOSOrder(data) };
}

// ──────────────────────────────────────────────
// Cashier Shifts
// ──────────────────────────────────────────────

export async function getCashierShifts(companyId: string): Promise<CashierShift[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cashier_shifts') as any)
    .select('*')
    .eq('company_id', validCompanyId)
    .order('opened_at', { ascending: false });

  if (error) {
    console.error('[POSService] getCashierShifts:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToCashierShift);
}

export async function upsertCashierShift(
  shift: CashierShift,
  companyId: string
): Promise<{ success: boolean; data?: CashierShift; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);

  const row = {
    id: ensureValidUuid(shift.id),
    company_id: validCompanyId,
    branch_id: ensureNullableUuid(shift.branchId),
    cashier_id: ensureNullableUuid(shift.cashierId),
    cashier_name: shift.cashierName ?? '',
    shift_number: shift.shiftNumber,
    opened_at: shift.openedAt,
    closed_at: shift.closedAt ?? null,
    opening_cash: shift.openingCash ?? 0,
    closing_cash: shift.actualCash ?? null,
    expected_cash: shift.expectedCash ?? null,
    cash_difference: shift.difference ?? null,
    total_sales: shift.totalNetSales ?? 0,
    total_refunds: shift.totalReturns ?? 0,
    total_transactions: shift.ordersCount ?? 0,
    status: shift.status ?? 'OPEN',
    notes: shift.notes ?? '',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cashier_shifts') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToCashierShift(data) };
}

// ──────────────────────────────────────────────
// Held Carts
// ──────────────────────────────────────────────

export async function getHeldCarts(companyId: string): Promise<POSHeldCart[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('pos_orders') as any)
    .select('*, pos_order_items(*)')
    .eq('company_id', companyId)
    .eq('status', 'HELD')
    .order('order_date', { ascending: false });

  if (error) {
    console.error('[POSService] getHeldCarts:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): POSHeldCart => ({
    id: row.id,
    cartNumber: parseInt(row.order_number ?? '1', 10) || 1,
    label: row.customer_name ?? 'سلة معلقة',
    customerName: row.customer_name ?? '',
    items: (row.pos_order_items ?? []).map(mapRowToPOSOrderItem),
    discountType: 'FIXED',
    discountValue: row.discount_amount ?? 0,
    notes: row.notes ?? '',
    heldAt: row.order_date ?? new Date().toISOString(),
  }));
}

// ──────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToPOSOrder(row: any): POSOrder {
  return {
    id: row.id,
    orderNumber: row.order_number ?? '',
    date: (row.order_date ?? '').split('T')[0] || new Date().toISOString().split('T')[0],
    time: (row.order_date ?? '').split('T')[1]?.substring(0, 8) || '00:00:00',
    branchId: row.branch_id ?? '',
    branchName: '',
    warehouse: '',
    cashierId: row.cashier_id ?? '',
    cashierName: row.cashier_name ?? '',
    customerId: row.customer_id ?? '',
    customerName: row.customer_name ?? '',
    status: row.status ?? 'COMPLETED',
    paymentMethod: row.payment_method ?? 'CASH',
    subtotal: row.subtotal ?? 0,
    taxRate: 5,
    taxAmount: row.tax_amount ?? 0,
    discountType: 'FIXED',
    discountValue: row.discount_amount ?? 0,
    discountAmount: row.discount_amount ?? 0,
    totalAmount: row.total_amount ?? 0,
    currency: 'OMR',
    cashReceived: row.amount_tendered ?? 0,
    changeDue: row.change_amount ?? 0,
    shiftId: row.shift_id ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (row.pos_order_items ?? []).map(mapRowToPOSOrderItem),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToPOSOrderItem(row: any): POSOrderItem {
  return {
    id: row.id,
    itemId: row.product_id ?? '',
    name: row.description ?? '',
    quantity: row.quantity ?? 1,
    unitPrice: row.unit_price ?? 0,
    discount: row.discount_percent ?? 0,
    taxRate: row.tax_rate ?? 0,
    taxAmount: 0,
    total: row.total_price ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToCashierShift(row: any): CashierShift {
  return {
    id: row.id,
    shiftNumber: row.shift_number ?? '',
    branchId: row.branch_id ?? '',
    branchName: '',
    cashierId: row.cashier_id ?? '',
    cashierName: row.cashier_name ?? '',
    openedAt: row.opened_at,
    closedAt: row.closed_at ?? undefined,
    openingCash: row.opening_cash ?? 0,
    actualCash: row.closing_cash ?? undefined,
    expectedCash: row.expected_cash ?? 0,
    difference: row.cash_difference ?? undefined,
    totalSalesCash: 0,
    totalSalesCard: 0,
    totalSalesCredit: 0,
    totalSalesOnline: 0,
    totalSalesBank: 0,
    totalReturns: row.total_refunds ?? 0,
    totalDiscounts: 0,
    totalTax: 0,
    totalNetSales: row.total_sales ?? 0,
    ordersCount: row.total_transactions ?? 0,
    cashMovements: [],
    status: row.status ?? 'OPEN',
    notes: row.notes ?? '',
  };
}
