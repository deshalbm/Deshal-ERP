/**
 * Purchases Service — Supabase CRUD
 * Maps between app PurchaseInvoice / ReceiptVoucher types (src/types.ts) and Supabase tables.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { PurchaseInvoice, ReceiptVoucher } from '../../types';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

// ──────────────────────────────────────────────
// Purchase Invoices (mapped to purchase_orders)
// ──────────────────────────────────────────────

export async function getPurchases(companyId: string): Promise<PurchaseInvoice[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('purchase_orders') as any)
    .select('*, purchase_order_lines(*)')
    .eq('company_id', validCompanyId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[PurchasesService] getPurchases:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToPurchaseInvoice);
}

export async function upsertPurchase(
  purchase: PurchaseInvoice,
  companyId: string
): Promise<{ success: boolean; data?: PurchaseInvoice; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);
  const row = {
    id: ensureValidUuid(purchase.id),
    company_id: validCompanyId,
    supplier_id: ensureNullableUuid(purchase.supplierId),
    supplier_name: purchase.supplierName ?? '',
    order_number: purchase.purchaseNumber,
    order_date: purchase.date,
    expected_delivery_date: purchase.dueDate ?? null,
    status: purchase.status ?? 'DRAFT',
    subtotal: purchase.subtotal ?? 0,
    tax_amount: purchase.taxAmount ?? 0,
    total_amount: purchase.totalAmount ?? 0,
    warehouse: purchase.warehouse ?? '',
    branch_id: ensureNullableUuid(purchase.branchId),
    branch_name: purchase.branchName ?? '',
    notes: purchase.notes ?? '',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('purchase_orders') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Upsert lines if provided
  if (purchase.items && purchase.items.length > 0) {
    const lines = purchase.items.map((item) => ({
      id: ensureValidUuid(item.id),
      purchase_order_id: data.id,
      product_id: ensureNullableUuid(item.itemId),
      product_name: item.name ?? '',
      quantity: item.quantity,
      unit_price: item.unitCost,
      amount: item.amount,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('purchase_order_lines') as any)
      .upsert(lines, { onConflict: 'id' });
  }

  return { success: true, data: mapRowToPurchaseInvoice(data) };
}

export const upsertPurchaseInvoice = upsertPurchase;

export async function deletePurchase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validId = ensureNullableUuid(id);
  if (!validId) return { success: true };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('purchase_orders') as any)
    .select('status')
    .eq('id', validId)
    .maybeSingle();

  if (existing && existing.status !== 'DRAFT') {
    return { success: false, error: 'لا يمكن حذف أوامر الشراء المعتمدة أو المستلمة.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('purchase_orders') as any).delete().eq('id', validId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Vouchers / Invoices (mapped to invoices table)
// ──────────────────────────────────────────────

export async function getVouchers(companyId: string): Promise<ReceiptVoucher[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('invoices') as any)
    .select('*')
    .eq('company_id', validCompanyId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[PurchasesService] getVouchers:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToVoucher);
}

export async function upsertVoucher(
  voucher: ReceiptVoucher,
  companyId: string
): Promise<{ success: boolean; data?: ReceiptVoucher; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);
  const row = {
    id: ensureValidUuid(voucher.id),
    company_id: validCompanyId,
    voucher_number: voucher.voucherNumber,
    reference_no: voucher.referenceNo,
    voucher_date: voucher.date,
    due_date: voucher.dueDate ?? null,
    voucher_type: voucher.type,
    status: voucher.status ?? 'ISSUED',
    amount: voucher.amount ?? 0,
    currency: voucher.currency ?? 'OMR',
    payment_method: voucher.paymentMethod ?? 'CASH',
    received_from: voucher.receivedFrom ?? '',
    paid_to: voucher.paidTo ?? '',
    category: voucher.category ?? '',
    notes: voucher.notes ?? '',
    branch_id: voucher.branchId ?? null,
    branch_name: voucher.branchName ?? '',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('invoices') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToVoucher(data) };
}

export async function deleteVoucher(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  const validId = ensureNullableUuid(id);
  if (!validId) return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('invoices') as any).delete().eq('id', validId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────

// Mappers
// ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToPurchaseInvoice(row: any): PurchaseInvoice {
  return {
    id: row.id,
    purchaseNumber: row.order_number ?? row.purchase_number ?? '',
    supplierInvoiceNo: row.supplier_invoice_no ?? '',
    supplierId: row.supplier_id ?? '',
    supplierName: row.supplier_name ?? '',
    supplierPhone: row.supplier_phone ?? '',
    supplierEmail: row.supplier_email ?? '',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    date: row.order_date ?? row.date,
    dueDate: row.expected_delivery_date ?? row.due_date ?? '',
    warehouse: row.warehouse ?? '',
    subtotal: row.subtotal ?? 0,
    taxRate: row.tax_rate ?? 0,
    taxAmount: row.tax_amount ?? 0,
    discountAmount: row.discount_amount ?? 0,
    shippingFee: row.shipping_fee ?? 0,
    totalAmount: row.total_amount ?? 0,
    currency: row.currency ?? 'OMR',
    status: row.status ?? 'DRAFT',
    paymentStatus: row.payment_status ?? 'UNPAID',
    paymentMethod: row.payment_method ?? 'CASH',
    notes: row.notes ?? '',
    autoUpdateStock: row.auto_update_stock ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (row.purchase_order_lines ?? []).map((l: any) => ({
      id: l.id,
      itemId: l.product_id,
      name: l.product_name ?? l.description ?? '',
      quantity: l.quantity,
      unitCost: l.unit_price ?? l.unit_cost ?? 0,
      amount: l.amount ?? l.total_price ?? 0,
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToVoucher(row: any): ReceiptVoucher {
  return {
    id: row.id,
    type: row.voucher_type ?? row.type ?? 'RECEIPT',
    voucherNumber: row.voucher_number ?? row.invoice_number ?? '',
    referenceNo: row.reference_no ?? '',
    date: row.voucher_date ?? row.invoice_date,
    dueDate: row.due_date ?? '',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    receivedFrom: row.received_from ?? '',
    paidTo: row.paid_to ?? '',
    amount: row.amount ?? row.total_amount ?? 0,
    currency: row.currency ?? 'OMR',
    amountInWords: row.amount_in_words ?? '',
    isCustomWords: false,
    paymentMethod: row.payment_method ?? 'CASH',
    category: row.category ?? '',
    lineItems: row.line_items ?? [],
    subtotal: row.subtotal ?? row.amount ?? 0,
    taxRate: row.tax_rate ?? 0,
    taxAmount: row.tax_amount ?? 0,
    discountAmount: row.discount_amount ?? 0,
    totalAmount: row.total_amount ?? row.amount ?? 0,
    notes: row.notes ?? '',
    terms: row.terms ?? '',
    customFields: row.custom_fields ?? [],
    status: row.status ?? 'ISSUED',
    preparedBy: row.prepared_by ?? '',
    approvedBy: row.approved_by ?? '',
    receivedBy: row.received_by ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}
