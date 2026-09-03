/**
 * Supplier Service — Supabase CRUD
 * Maps between app Supplier type (src/types.ts) and Supabase 'suppliers' table.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { Supplier } from '../../types';

export async function getSuppliers(companyId: string): Promise<Supplier[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('suppliers') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('[SupplierService] getSuppliers:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToSupplier);
}

export async function upsertSupplier(
  supplier: Supplier,
  companyId: string
): Promise<{ success: boolean; data?: Supplier; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const row = {
    id: supplier.id,
    company_id: companyId,
    name: supplier.name,
    contact_person: supplier.contactPerson ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    address: supplier.address ?? '',
    city: supplier.city ?? '',
    tax_id: supplier.taxId ?? '',
    cr_number: supplier.crNumber ?? '',
    category: supplier.category ?? '',
    notes: supplier.notes ?? '',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('suppliers') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToSupplier(data) };
}

export async function deleteSupplier(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('suppliers') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name ?? '',
    contactPerson: row.contact_person ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    taxId: row.tax_id ?? '',
    crNumber: row.cr_number ?? '',
    category: row.category ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}
