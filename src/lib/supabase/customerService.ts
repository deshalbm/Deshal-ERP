/**
 * Customer Service — Supabase CRUD, Server-side Search & Pagination
 * Maps between app Customer type (src/types.ts) and Supabase 'customers' table.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { Customer } from '../../types';
import { enqueueOperation } from '../offline/indexedDBQueue';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

export function normalizePhone(phone: string): string {
  if (!phone || !phone.trim()) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('968')) {
    return '+' + digits;
  } else if (digits.length === 8) {
    return '+968' + digits;
  } else if (digits.length > 8) {
    return '+' + digits;
  }
  return digits;
}

// ──────────────────────────────────────────────
// Read & Server-side Search with Pagination
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

export async function searchCustomersServerSide(
  companyId: string,
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<{ customers: Customer[]; total: number }> {
  if (!isSupabaseConfigured) return { customers: [], total: 0 };

  const validCompanyId = ensureValidUuid(companyId);
  const offset = (page - 1) * limit;

  let req = (supabase.from('customers') as any)
    .select('*', { count: 'exact' })
    .eq('company_id', validCompanyId);

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    req = req.or(`name.ilike.${q},phone.ilike.${q},email.ilike.${q},contact_person.ilike.${q}`);
  }

  const { data, count, error } = await req
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[CustomerService] searchCustomersServerSide:', error.message);
    return { customers: [], total: 0 };
  }

  return {
    customers: (data ?? []).map(mapRowToCustomer),
    total: count ?? 0,
  };
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

export async function checkPhoneExists(companyId: string, phone: string, excludeCustomerId?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !phone) return false;

  const normalized = normalizePhone(phone);
  if (!normalized) return false;

  const validCompanyId = ensureValidUuid(companyId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let req = (supabase.from('customers') as any)
    .select('id')
    .eq('company_id', validCompanyId)
    .or(`phone.eq.${phone},normalized_phone.eq.${normalized}`);

  if (excludeCustomerId) {
    const validExclude = ensureNullableUuid(excludeCustomerId);
    if (validExclude) {
      req = req.neq('id', validExclude);
    }
  }

  const { data, error } = await req.maybeSingle();
  if (error) return false;
  return !!data;
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
  const normalizedCustomer = {
    ...customer,
    id: validCustomerId,
    normalizedPhone: normalizePhone(customer.phone),
  };

  // Check phone uniqueness if phone is provided
  if (normalizedCustomer.phone) {
    const isDuplicate = await checkPhoneExists(validCompanyId, normalizedCustomer.phone, validCustomerId);
    if (isDuplicate) {
      return {
        success: false,
        error: `رقم الهاتف (${normalizedCustomer.phone}) مسجل مسبقاً لعميل آخر. رقم الهاتف هو المفتاح الأساسي لمنع التكرار.`,
      };
    }
  }

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
    console.error('[CustomerService] Supabase upsert error:', error.message);
    return { success: false, error: error.message, data: normalizedCustomer };
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
    console.error('[CustomerService] Supabase delete error:', error.message);
    return { success: false, error: error.message };
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
    normalizedPhone: row.normalized_phone ?? normalizePhone(row.phone ?? ''),
    address: row.address ?? '',
    city: row.city ?? '',
    governorate: row.governorate ?? '',
    country: row.country ?? 'سلطنة عمان',
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
    normalized_phone: customer.normalizedPhone || normalizePhone(customer.phone),
    address: customer.address,
    city: customer.city,
    governorate: customer.governorate ?? '',
    country: customer.country ?? 'سلطنة عمان',
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
