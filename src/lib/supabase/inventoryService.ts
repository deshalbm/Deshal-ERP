/**
 * Inventory Service — Supabase CRUD
 * Maps between app InventoryItem / StockMovement / StockTransfer types and Supabase tables.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { InventoryItem, StockMovement, StockTransfer } from '../../types';

// ──────────────────────────────────────────────
// Products (Inventory Items)
// ──────────────────────────────────────────────

export async function getInventoryItems(companyId: string): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('products') as any)
    .select('*, stock_balances(*)')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('[InventoryService] getInventoryItems:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToInventoryItem);
}

export async function upsertInventoryItem(
  item: InventoryItem,
  companyId: string
): Promise<{ success: boolean; data?: InventoryItem; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const row = mapInventoryItemToRow(item, companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('products') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToInventoryItem(data) };
}

export async function deleteInventoryItem(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('products') as any)
    .update({ status: 'OUT_OF_STOCK', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Stock Movements
// ──────────────────────────────────────────────

export async function getStockMovements(companyId: string): Promise<StockMovement[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('inventory_transactions') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('[InventoryService] getStockMovements:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToStockMovement);
}

export async function addStockMovement(
  movement: StockMovement,
  companyId: string
): Promise<{ success: boolean; data?: StockMovement; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const row = {
    id: movement.id,
    company_id: companyId,
    product_id: movement.itemId,
    product_sku: movement.itemSku,
    product_name: movement.itemName,
    transaction_type: movement.type,
    quantity: movement.quantity,
    previous_quantity: movement.previousQuantity ?? 0,
    new_quantity: movement.newQuantity ?? 0,
    reference_no: movement.referenceNo ?? '',
    warehouse: movement.warehouse ?? '',
    branch_id: movement.branchId ?? null,
    branch_name: movement.branchName ?? '',
    transaction_date: movement.date ?? new Date().toISOString(),
    notes: movement.notes ?? '',
    created_by_name: movement.createdByName ?? '',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('inventory_transactions') as any)
    .insert(row)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToStockMovement(data) };
}

// ──────────────────────────────────────────────
// Stock Transfers
// ──────────────────────────────────────────────

export async function getStockTransfers(companyId: string): Promise<StockTransfer[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('stock_transfers') as any)
    .select('*, stock_transfer_lines(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[InventoryService] getStockTransfers:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): StockTransfer => ({
    id: row.id,
    transferNumber: row.transfer_number ?? '',
    date: row.transfer_date ?? row.created_at ?? new Date().toISOString(),
    fromBranchId: row.from_branch_id ?? '',
    fromBranchName: row.from_branch_name ?? '',
    fromWarehouse: row.from_warehouse ?? '',
    toBranchId: row.to_branch_id ?? '',
    toBranchName: row.to_branch_name ?? '',
    toWarehouse: row.to_warehouse ?? '',
    status: row.status ?? 'PENDING',
    notes: row.notes ?? '',
    transferByName: row.transfer_by_name ?? '',
    receivedByName: row.received_by_name ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (row.stock_transfer_lines ?? []).map((line: any) => ({
      itemId: line.product_id ?? '',
      sku: line.product_sku ?? '',
      name: line.product_name ?? '',
      quantity: line.quantity_requested ?? line.quantity ?? 0,
      unit: line.unit ?? 'PCS',
    })),
  }));
}

// ──────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToInventoryItem(row: any): InventoryItem {
  const totalStock = Array.isArray(row.stock_balances)
    ? row.stock_balances.reduce((sum: number, b: any) => sum + (b.quantity_on_hand ?? 0), 0)
    : (row.quantity ?? 0);

  return {
    id: row.id,
    sku: row.sku ?? '',
    barcode: row.barcode ?? '',
    name: row.name ?? '',
    category: row.category ?? '',
    warehouse: row.warehouse ?? '',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    location: row.location ?? '',
    unit: row.unit ?? 'PCS',
    quantity: totalStock,
    minAlertQuantity: row.reorder_level ?? row.min_alert_quantity ?? 5,
    costPrice: row.cost_price ?? 0,
    sellingPrice: row.selling_price ?? 0,
    supplierName: row.supplier_name ?? '',
    description: row.description ?? '',
    imageUrl: row.image_url ?? '',
    status: row.status ?? (totalStock > 5 ? 'IN_STOCK' : totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK'),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInventoryItemToRow(item: InventoryItem, companyId: string): Record<string, any> {
  return {
    id: item.id,
    company_id: companyId,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    category: item.category,
    warehouse: item.warehouse,
    branch_id: item.branchId,
    branch_name: item.branchName,
    location: item.location,
    unit: item.unit,
    quantity: item.quantity ?? 0,
    reorder_level: item.minAlertQuantity ?? 5,
    cost_price: item.costPrice ?? 0,
    selling_price: item.sellingPrice ?? 0,
    supplier_name: item.supplierName,
    description: item.description,
    image_url: item.imageUrl,
    status: item.status,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToStockMovement(row: any): StockMovement {
  return {
    id: row.id,
    itemId: row.product_id,
    itemSku: row.product_sku ?? '',
    itemName: row.product_name ?? '',
    type: row.transaction_type ?? 'ADJUSTMENT_IN',
    quantity: row.quantity ?? 0,
    previousQuantity: row.previous_quantity ?? 0,
    newQuantity: row.new_quantity ?? 0,
    referenceNo: row.reference_no ?? '',
    warehouse: row.warehouse ?? '',
    branchId: row.branch_id,
    branchName: row.branch_name,
    date: row.transaction_date ?? row.created_at ?? new Date().toISOString(),
    notes: row.notes ?? '',
    createdByName: row.created_by_name ?? '',
  };
}
