/**
 * Customer Service — Supabase CRUD
 * Maps between app Customer type (src/types.ts) and Supabase 'customers' table.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { Customer } from '../../types';
import { enqueueOperation } from '../offline/indexedDBQueue';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

// ──────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────

export async function getCustomers(companyId: string): Promise<Customer[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('customers') as any)
    .select('*')
    .eq('company_id', validCompanyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CustomerService] getCustomers:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToCustomer);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (!isSupabaseConfigured) return null;

  const validId = ensureNullableUuid(id);
  if (!validId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('customers') as any)
    .select('*')
    .eq('id', validId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToCustomer(data);
}

// ──────────────────────────────────────────────
// Write
// ──────────────────────────────────────────────

export async function upsertCustomer(
  customer: Customer,
  companyId: string
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);
  const validCustomerId = ensureValidUuid(customer.id);
  const normalizedCustomer = { ...customer, id: validCustomerId };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOperation({
      entity_type: 'CUSTOMER',
      entity_id: validCustomerId,
      action: 'UPSERT',
      payload: normalizedCustomer,
      company_id: validCompanyId,
    }).catch(console.error);
    return { success: true, data: normalizedCustomer };
  }

  const row = mapCustomerToRow(normalizedCustomer, validCompanyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('customers') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    await enqueueOperation({
      entity_type: 'CUSTOMER',
      entity_id: validCustomerId,
      action: 'UPSERT',
      payload: normalizedCustomer,
      company_id: validCompanyId,
    }).catch(console.error);
    return { success: true, data: normalizedCustomer };
  }
  return { success: true, data: mapRowToCustomer(data) };
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validId = ensureNullableUuid(id);
  if (!validId) return { success: true };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOperation({
      entity_type: 'CUSTOMER',
      entity_id: validId,
      action: 'DELETE',
      payload: { id: validId },
      company_id: '00000000-0000-0000-0000-000000000001',
    }).catch(console.error);
    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('customers') as any).delete().eq('id', validId);
  if (error) {
    await enqueueOperation({
      entity_type: 'CUSTOMER',
      entity_id: validId,
      action: 'DELETE',
      payload: { id: validId },
      company_id: '00000000-0000-0000-0000-000000000001',
    }).catch(console.error);
    return { success: true };
  }
  return { success: true };
}

// ──────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name ?? '',
    contactPerson: row.contact_person ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    country: row.country ?? '',
    taxId: row.tax_id ?? '',
    crNumber: row.cr_number ?? '',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    type: row.customer_type ?? 'INDIVIDUAL',
    status: row.status ?? 'ACTIVE',
    notes: row.notes ?? '',
    tags: row.tags ?? [],
    creditLimit: row.credit_limit ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomerToRow(customer: Customer, companyId: string): Record<string, any> {
  return {
    id: ensureValidUuid(customer.id),
    company_id: ensureValidUuid(companyId),
    name: customer.name,
    contact_person: customer.contactPerson ?? '',
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    country: customer.country,
    tax_id: customer.taxId,
    cr_number: customer.crNumber,
    branch_id: ensureNullableUuid(customer.branchId),
    branch_name: customer.branchName,
    customer_type: customer.type,
    status: customer.status,
    notes: customer.notes,
    tags: customer.tags ?? [],
    credit_limit: customer.creditLimit ?? 0,
    updated_at: new Date().toISOString(),
  };
}
