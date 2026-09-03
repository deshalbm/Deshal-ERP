/**
 * Requests & Approvals Service — Supabase CRUD
 * Maps between app EmployeeRequest (src/types/requests.ts) and Supabase 'requests' & 'request_types' tables.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { EmployeeRequest } from '../../types/requests';

export async function getEmployeeRequests(companyId: string): Promise<EmployeeRequest[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('requests') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[RequestsService] getEmployeeRequests:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToEmployeeRequest);
}

export async function upsertEmployeeRequest(
  request: EmployeeRequest,
  companyId: string
): Promise<{ success: boolean; data?: EmployeeRequest; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const row = {
    id: request.id,
    company_id: companyId,
    request_number: request.requestNumber,
    submitted_by_employee_id: request.employeeId,
    request_type_id: request.typeId,
    status: request.status,
    field_values: {
      employeeName: request.employeeName,
      employeeNameEn: request.employeeNameEn,
      employeeCode: request.employeeCode,
      employeeJobTitle: request.employeeJobTitle,
      department: request.department,
      branchId: request.branchId,
      branchName: request.branchName,
      typeCode: request.typeCode,
      typeNameAr: request.typeNameAr,
      typeNameEn: request.typeNameEn,
      typeCategory: request.typeCategory,
      priority: request.priority,
      currentStageIndex: request.currentStageIndex,
      values: request.values,
      timeline: request.timeline,
      approvals: request.approvals,
      attachments: request.attachments,
      comments: request.comments,
      generatedDocument: request.generatedDocument,
      slaDeadline: request.slaDeadline,
      submittedAt: request.submittedAt,
    },
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('requests') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToEmployeeRequest(data) };
}

export async function deleteEmployeeRequest(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('requests') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToEmployeeRequest(row: any): EmployeeRequest {
  const f = row.field_values ?? {};
  return {
    id: row.id,
    requestNumber: row.request_number ?? '',
    typeId: row.request_type_id ?? '',
    typeCode: f.typeCode ?? 'REQ-GENERIC',
    typeNameAr: f.typeNameAr ?? 'طلب عام',
    typeNameEn: f.typeNameEn ?? 'Generic Request',
    typeCategory: f.typeCategory ?? 'OTHER',
    employeeId: row.submitted_by_employee_id ?? f.employeeId ?? '',
    employeeCode: f.employeeCode ?? '',
    employeeName: f.employeeName ?? '',
    employeeNameEn: f.employeeNameEn ?? '',
    employeeJobTitle: f.employeeJobTitle ?? '',
    department: f.department ?? '',
    branchId: f.branchId ?? '',
    branchName: f.branchName ?? '',
    status: row.status ?? 'SUBMITTED',
    priority: f.priority ?? 'MEDIUM',
    currentStageIndex: f.currentStageIndex ?? 0,
    values: f.values ?? {},
    approvals: f.approvals ?? [],
    timeline: f.timeline ?? [],
    attachments: f.attachments ?? [],
    comments: f.comments ?? [],
    generatedDocument: f.generatedDocument ?? undefined,
    slaDeadline: f.slaDeadline ?? undefined,
    submittedAt: f.submittedAt ?? row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}
