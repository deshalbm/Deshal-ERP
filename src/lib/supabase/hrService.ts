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
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

// ──────────────────────────────────────────────
// Attendance Records
// ──────────────────────────────────────────────

export async function getAttendanceRecords(
  companyId: string,
  employeeId?: string
): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured) return [];

  const cId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('attendance_records') as any)
    .select('*')
    .eq('company_id', cId)
    .order('attendance_date', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', ensureValidUuid(employeeId));
  }

  const { data, error } = await query;
  if (error) {
    console.error('[HRService] getAttendanceRecords:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): AttendanceRecord => {
    let checkInStr: string | undefined = undefined;
    if (row.check_in_at) {
      checkInStr = typeof row.check_in_at === 'string' && row.check_in_at.includes('T')
        ? row.check_in_at.split('T')[1].slice(0, 5)
        : String(row.check_in_at);
    } else if (row.check_in_time || row.check_in) {
      checkInStr = row.check_in_time ?? row.check_in;
    }

    let checkOutStr: string | undefined = undefined;
    if (row.check_out_at) {
      checkOutStr = typeof row.check_out_at === 'string' && row.check_out_at.includes('T')
        ? row.check_out_at.split('T')[1].slice(0, 5)
        : String(row.check_out_at);
    } else if (row.check_out_time || row.check_out) {
      checkOutStr = row.check_out_time ?? row.check_out;
    }

    const totalMinutes = row.total_work_minutes ?? row.worked_hours ?? row.working_hours ?? 0;
    const workingHours = typeof totalMinutes === 'number' && totalMinutes > 24
      ? Math.round((totalMinutes / 60) * 100) / 100
      : Number(totalMinutes) || 0;

    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name ?? '',
      employeeCode: row.employee_code ?? '',
      jobTitle: row.job_title ?? '',
      department: row.department ?? '',
      date: row.attendance_date ?? row.date,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      status: row.status ?? 'PRESENT',
      workingHours,
      overtimeHours: row.overtime_hours ?? (row.overtime_minutes ? Math.round((row.overtime_minutes / 60) * 100) / 100 : 0),
      lateMinutes: row.late_minutes ?? 0,
      branchId: row.branch_id,
      branchName: row.branch_name,
      notes: row.notes ?? '',
    };
  });
}

export async function upsertAttendanceRecord(
  record: AttendanceRecord,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const cId = ensureValidUuid(companyId);
  const recId = ensureValidUuid(record.id);
  const empId = ensureValidUuid(record.employeeId);
  const branchId = ensureNullableUuid(record.branchId);

  const dateStr = record.date || new Date().toISOString().split('T')[0];

  const checkInIso = record.checkIn
    ? (record.checkIn.includes('T') ? record.checkIn : `${dateStr}T${record.checkIn.length === 5 ? record.checkIn + ':00' : record.checkIn}Z`)
    : null;

  const checkOutIso = record.checkOut
    ? (record.checkOut.includes('T') ? record.checkOut : `${dateStr}T${record.checkOut.length === 5 ? record.checkOut + ':00' : record.checkOut}Z`)
    : null;

  const workMinutes = Math.round((record.workingHours || 0) * 60);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('attendance_records') as any)
    .upsert(
      {
        id: recId,
        company_id: cId,
        employee_id: empId,
        branch_id: branchId,
        attendance_date: dateStr,
        check_in_at: checkInIso,
        check_out_at: checkOutIso,
        status: record.status || 'PRESENT',
        total_work_minutes: workMinutes,
        regular_work_minutes: workMinutes,
        overtime_minutes: Math.round((record.overtimeHours || 0) * 60),
        late_minutes: record.lateMinutes || 0,
        source: 'KIOSK',
        notes: record.notes ?? '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('[HRService] upsertAttendanceRecord error:', error.message);
    return { success: false, error: error.message };
  }
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

  const cId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('attendance_movement_logs') as any)
    .select('*')
    .eq('company_id', cId)
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
    movementTypeCode: row.movement_type_code ?? row.movement_type ?? '',
    movementTypeNameAr: row.movement_type_name_ar ?? '',
    movementTypeNameEn: row.movement_type_name_en ?? '',
    movementCategory: row.movement_category ?? row.category ?? 'CHECK_IN',
    timestamp: row.timestamp ?? new Date().toISOString(),
    date: row.date ?? new Date().toISOString().split('T')[0],
    time: row.time ?? '08:00',
    photoUrl: row.photo_url ?? '',
    deviceId: row.kiosk_device_id ?? row.device_id ?? '',
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

  const cId = ensureValidUuid(companyId);
  const logId = ensureValidUuid(log.id);
  const empId = ensureValidUuid(log.employeeId);
  const deviceId = ensureNullableUuid(log.deviceId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('attendance_movement_logs') as any).upsert({
    id: logId,
    company_id: cId,
    employee_id: empId,
    kiosk_device_id: deviceId,
    movement_type_code: log.movementTypeCode || log.movementCategory || 'CHECK_IN',
    movement_category: log.movementCategory || 'CHECK_IN',
    timestamp: log.timestamp || new Date().toISOString(),
    date: log.date || new Date().toISOString().split('T')[0],
    time: log.time || '08:00:00',
    photo_url: log.photoUrl || null,
    reason: log.reason || null,
    sync_status: log.syncStatus || 'SYNCED',
    created_at: log.createdAt || new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) {
    console.error('[HRService] addAttendanceMovementLog error:', error.message);
    return { success: false, error: error.message };
  }
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
    .order('month', { ascending: false });

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
