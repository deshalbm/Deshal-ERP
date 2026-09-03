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
  const { data, error } = await (supabase.from('vouchers') as any)
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
    branch_id: ensureNullableUuid(voucher.branchId),
    branch_name: voucher.branchName ?? '',
    voucher_number: voucher.voucherNumber,
    type: voucher.type ?? 'RECEIPT',
    reference_no: voucher.referenceNo ?? '',
    date: voucher.date,
    due_date: voucher.dueDate ?? null,
    received_from: voucher.receivedFrom ?? '',
    paid_to: voucher.paidTo ?? '',
    payer_email: voucher.payerEmail ?? '',
    payer_phone: voucher.payerPhone ?? '',
    payer_address: voucher.payerAddress ?? '',
    payer_tax_id: voucher.payerTaxId ?? '',
    amount: voucher.amount ?? voucher.totalAmount ?? 0,
    currency: voucher.currency ?? 'OMR',
    amount_in_words: voucher.amountInWords ?? '',
    is_custom_words: voucher.isCustomWords ?? false,
    payment_method: voucher.paymentMethod ?? 'CASH',
    check_number: voucher.checkNumber ?? '',
    bank_name: voucher.bankName ?? '',
    transaction_ref: voucher.transactionRef ?? '',
    category: voucher.category ?? '',
    line_items: voucher.lineItems ?? [],
    subtotal: voucher.subtotal ?? 0,
    tax_rate: voucher.taxRate ?? 0,
    tax_amount: voucher.taxAmount ?? 0,
    discount_rate: voucher.discountRate ?? 0,
    discount_amount: voucher.discountAmount ?? 0,
    total_amount: voucher.totalAmount ?? voucher.amount ?? 0,
    notes: voucher.notes ?? '',
    terms: voucher.terms ?? '',
    custom_fields: voucher.customFields ?? [],
    status: voucher.status ?? 'ISSUED',
    prepared_by: voucher.preparedBy ?? '',
    approved_by: voucher.approvedBy ?? '',
    received_by: voucher.receivedBy ?? '',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('vouchers') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[PurchasesService] upsertVoucher:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: mapRowToVoucher(data) };
}

export async function deleteVoucher(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  const validId = ensureNullableUuid(id);
  if (!validId) return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('vouchers') as any).delete().eq('id', validId);
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
    type: row.type ?? 'RECEIPT',
    voucherNumber: row.voucher_number ?? '',
    referenceNo: row.reference_no ?? '',
    date: row.date,
    dueDate: row.due_date ?? '',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    receivedFrom: row.received_from ?? '',
    paidTo: row.paid_to ?? '',
    payerEmail: row.payer_email ?? '',
    payerPhone: row.payer_phone ?? '',
    payerAddress: row.payer_address ?? '',
    payerTaxId: row.payer_tax_id ?? '',
    amount: row.amount ?? row.total_amount ?? 0,
    currency: row.currency ?? 'OMR',
    amountInWords: row.amount_in_words ?? '',
    isCustomWords: row.is_custom_words ?? false,
    paymentMethod: row.payment_method ?? 'CASH',
    checkNumber: row.check_number ?? '',
    bankName: row.bank_name ?? '',
    transactionRef: row.transaction_ref ?? '',
    category: row.category ?? '',
    lineItems: row.line_items ?? [],
    subtotal: row.subtotal ?? 0,
    taxRate: row.tax_rate ?? 0,
    taxAmount: row.tax_amount ?? 0,
    discountRate: row.discount_rate ?? 0,
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
