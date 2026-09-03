/**
 * Employee Service — Supabase CRUD
 * Maps between app Employee type (src/types.ts) and Supabase 'employees' table.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { Employee } from '../../types';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

// ──────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────

export async function getEmployees(companyId: string): Promise<Employee[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('employees') as any)
    .select('*')
    .eq('company_id', validCompanyId)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('[EmployeeService] getEmployees:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToEmployee);
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  if (!isSupabaseConfigured) return null;

  const validId = ensureNullableUuid(id);
  if (!validId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('employees') as any)
    .select('*')
    .eq('id', validId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToEmployee(data);
}

// ──────────────────────────────────────────────
// Write
// ──────────────────────────────────────────────

export async function upsertEmployee(
  employee: Employee,
  companyId: string
): Promise<{ success: boolean; data?: Employee; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);
  const row = mapEmployeeToRow(employee, validCompanyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('employees') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToEmployee(data) };
}

export async function deleteEmployee(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validId = ensureNullableUuid(id);
  if (!validId) return { success: true };

  // Soft delete — update status to INACTIVE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('employees') as any)
    .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
    .eq('id', validId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToEmployee(row: any): Employee {
  return {
    id: row.id,
    employeeCode: row.employee_code ?? row.employee_number ?? '',
    fullName: row.full_name ?? '',
    fullNameEn: row.full_name_en ?? '',
    civilId: row.civil_id ?? row.national_id ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    role: row.role ?? 'EMPLOYEE',
    jobTitle: row.job_title ?? '',
    department: row.department ?? '',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    status: row.status ?? 'ACTIVE',
    hireDate: row.hire_date ?? '',
    contractType: row.contract_type ?? 'FULL_TIME',
    basicSalary: row.basic_salary ?? 0,
    allowances: row.allowances ?? 0,
    currency: row.currency ?? 'OMR',
    bankName: row.bank_name ?? '',
    bankIban: row.bank_iban ?? row.iban ?? '',
    avatarUrl: row.avatar_url ?? '',
    signatureUrl: row.signature_url ?? '',
    permissions: row.permissions ?? [],
    notes: row.notes ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEmployeeToRow(employee: Employee, companyId: string): Record<string, any> {
  return {
    id: ensureValidUuid(employee.id),
    company_id: ensureValidUuid(companyId),
    employee_code: employee.employeeCode,
    full_name: employee.fullName,
    full_name_en: employee.fullNameEn,
    civil_id: employee.civilId,
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    job_title: employee.jobTitle,
    department: employee.department,
    branch_id: ensureNullableUuid(employee.branchId),
    branch_name: employee.branchName,
    status: employee.status,
    hire_date: employee.hireDate || null,
    contract_type: employee.contractType,
    basic_salary: employee.basicSalary ?? 0,
    allowances: employee.allowances ?? 0,
    currency: employee.currency ?? 'OMR',
    bank_name: employee.bankName,
    bank_iban: employee.bankIban,
    avatar_url: employee.avatarUrl,
    signature_url: employee.signatureUrl,
    permissions: employee.permissions ?? [],
    notes: employee.notes,
    updated_at: new Date().toISOString(),
  };
}
