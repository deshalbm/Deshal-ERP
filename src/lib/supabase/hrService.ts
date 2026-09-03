/**
 * HR Service — Supabase CRUD
 * Uses exact AttendanceRecord, PayrollSlip, LeaveRequest, AttendanceMovementLog types from src/types.ts
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  AttendanceRecord,
  PayrollSlip,
  LeaveRequest,
  AttendanceMovementLog,
} from '../../types';

// ──────────────────────────────────────────────
// Attendance Records
// ──────────────────────────────────────────────

export async function getAttendanceRecords(
  companyId: string,
  employeeId?: string
): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('attendance_records') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('attendance_date', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[HRService] getAttendanceRecords:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): AttendanceRecord => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name ?? '',
    employeeCode: row.employee_code ?? '',
    jobTitle: row.job_title ?? '',
    department: row.department ?? '',
    date: row.attendance_date ?? row.date,
    checkIn: row.check_in_time ?? row.check_in,
    checkOut: row.check_out_time ?? row.check_out,
    status: row.status ?? 'PRESENT',
    workingHours: row.worked_hours ?? row.working_hours ?? 0,
    overtimeHours: row.overtime_hours ?? 0,
    lateMinutes: row.late_minutes ?? 0,
    branchId: row.branch_id,
    branchName: row.branch_name,
    notes: row.notes ?? '',
  }));
}

export async function upsertAttendanceRecord(
  record: AttendanceRecord,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('attendance_records') as any)
    .upsert(
      {
        id: record.id,
        company_id: companyId,
        employee_id: record.employeeId,
        employee_name: record.employeeName,
        employee_code: record.employeeCode,
        attendance_date: record.date,
        check_in_time: record.checkIn ?? null,
        check_out_time: record.checkOut ?? null,
        status: record.status,
        worked_hours: record.workingHours ?? 0,
        overtime_hours: record.overtimeHours ?? 0,
        late_minutes: record.lateMinutes ?? 0,
        branch_id: record.branchId ?? null,
        branch_name: record.branchName ?? '',
        notes: record.notes ?? '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Attendance Movement Logs (Kiosk)
// ──────────────────────────────────────────────

export async function getAttendanceMovementLogs(
  companyId: string,
  limit = 500
): Promise<AttendanceMovementLog[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('attendance_movement_logs') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[HRService] getAttendanceMovementLogs:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): AttendanceMovementLog => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code ?? '',
    employeeName: row.employee_name ?? '',
    department: row.department ?? '',
    jobTitle: row.job_title ?? '',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    movementTypeCode: row.movement_type ?? '',
    movementTypeNameAr: row.movement_type_name_ar ?? '',
    movementTypeNameEn: row.movement_type_name_en ?? '',
    movementCategory: row.category ?? 'OFFICE',
    timestamp: row.timestamp ?? new Date().toISOString(),
    date: row.date ?? new Date().toISOString().split('T')[0],
    time: row.time ?? new Date().toISOString().split('T')[1].slice(0, 5),
    photoUrl: row.photo_url ?? '',
    deviceId: row.device_id ?? '',
    deviceName: row.device_name ?? '',
    syncStatus: row.sync_status ?? 'SYNCED',
    notes: row.notes ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
  }));
}

export async function addAttendanceMovementLog(
  log: AttendanceMovementLog,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('attendance_movement_logs') as any).insert({
    id: log.id,
    company_id: companyId,
    employee_id: log.employeeId,
    employee_code: log.employeeCode,
    employee_name: log.employeeName,
    department: log.department,
    job_title: log.jobTitle,
    branch_id: log.branchId,
    branch_name: log.branchName,
    movement_type: log.movementTypeCode,
    movement_type_name_ar: log.movementTypeNameAr,
    movement_type_name_en: log.movementTypeNameEn,
    category: log.movementCategory,
    timestamp: log.timestamp,
    date: log.date,
    time: log.time,
    photo_url: log.photoUrl,
    device_id: log.deviceId,
    device_name: log.deviceName,
    sync_status: log.syncStatus,
    notes: log.notes ?? '',
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Payroll Slips
// ──────────────────────────────────────────────

export async function getPayrollSlips(companyId: string): Promise<PayrollSlip[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('payroll_slips') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('payroll_month', { ascending: false });

  if (error) {
    console.error('[HRService] getPayrollSlips:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): PayrollSlip => ({
    id: row.id,
    payrollMonth: row.payroll_month ?? '',
    employeeId: row.employee_id,
    employeeCode: row.employee_code ?? '',
    employeeName: row.employee_name ?? '',
    fullNameEn: row.full_name_en ?? '',
    jobTitle: row.job_title ?? '',
    department: row.department ?? '',
    civilId: row.civil_id ?? '',
    bankName: row.bank_name ?? '',
    bankIban: row.bank_iban ?? '',
    branchName: row.branch_name ?? '',
    basicSalary: row.basic_salary ?? 0,
    housingAllowance: row.housing_allowance ?? 0,
    transportAllowance: row.transport_allowance ?? 0,
    otherAllowances: row.other_allowances ?? 0,
    bonus: row.bonus ?? 0,
    deductions: row.deductions ?? 0,
    socialSecurityDeduction: row.social_security_deduction ?? 0,
    netSalary: row.net_salary ?? 0,
    status: row.status ?? 'DRAFT',
    paymentDate: row.payment_date ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    notes: row.notes ?? '',
    generatedAt: row.generated_at ?? new Date().toISOString(),
  }));
}

export async function upsertPayrollSlip(
  slip: PayrollSlip,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('payroll_slips') as any)
    .upsert(
      {
        id: slip.id,
        company_id: companyId,
        payroll_month: slip.payrollMonth,
        employee_id: slip.employeeId,
        employee_code: slip.employeeCode,
        employee_name: slip.employeeName,
        full_name_en: slip.fullNameEn,
        job_title: slip.jobTitle,
        department: slip.department,
        civil_id: slip.civilId,
        bank_name: slip.bankName,
        bank_iban: slip.bankIban,
        branch_name: slip.branchName,
        basic_salary: slip.basicSalary ?? 0,
        housing_allowance: slip.housingAllowance ?? 0,
        transport_allowance: slip.transportAllowance ?? 0,
        other_allowances: slip.otherAllowances ?? 0,
        bonus: slip.bonus ?? 0,
        deductions: slip.deductions ?? 0,
        social_security_deduction: slip.socialSecurityDeduction ?? 0,
        net_salary: slip.netSalary ?? 0,
        status: slip.status ?? 'DRAFT',
        payment_date: slip.paymentDate ?? null,
        payment_method: slip.paymentMethod ?? null,
        notes: slip.notes ?? '',
        generated_at: slip.generatedAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Leave Requests
// ──────────────────────────────────────────────

export async function getLeaveRequests(companyId: string): Promise<LeaveRequest[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('leave_requests') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[HRService] getLeaveRequests:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): LeaveRequest => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name ?? '',
    employeeCode: row.employee_code ?? '',
    jobTitle: row.job_title ?? '',
    department: row.department ?? '',
    leaveType: row.leave_type ?? 'ANNUAL',
    startDate: row.start_date,
    endDate: row.end_date,
    daysCount: row.days_count ?? row.total_days ?? 0,
    reason: row.reason ?? '',
    status: row.status ?? 'PENDING',
    appliedAt: row.applied_at ?? row.created_at ?? new Date().toISOString(),
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNotes: row.review_notes ?? undefined,
  }));
}

export async function upsertLeaveRequest(
  req: LeaveRequest,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('leave_requests') as any)
    .upsert(
      {
        id: req.id,
        company_id: companyId,
        employee_id: req.employeeId,
        employee_name: req.employeeName,
        employee_code: req.employeeCode,
        job_title: req.jobTitle,
        department: req.department,
        leave_type: req.leaveType,
        start_date: req.startDate,
        end_date: req.endDate,
        days_count: req.daysCount ?? 0,
        reason: req.reason ?? '',
        status: req.status ?? 'PENDING',
        applied_at: req.appliedAt ?? new Date().toISOString(),
        reviewed_by: req.reviewedBy ?? null,
        reviewed_at: req.reviewedAt ?? null,
        review_notes: req.reviewNotes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}
