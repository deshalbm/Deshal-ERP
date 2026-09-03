/**
 * Audit Service — Supabase
 * Uses AuditLogEntry from src/types.ts exactly.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { AuditLogEntry } from '../../types';

export async function logToSupabase(
  entry: AuditLogEntry,
  companyId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Fire and forget — don't block the UI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.from('audit_logs') as any)
    .insert({
      id: entry.id,
      company_id: companyId,
      module: entry.module,
      action: entry.action,
      entity_id: entry.entityId ?? null,
      entity_name: entry.entityName ?? '',
      description_ar: entry.descriptionAr,
      description_en: entry.descriptionEn,
      details: entry.details ?? '',
      performed_by_name: entry.performedByName,
      performed_by_role: entry.performedByRole ?? '',
      performed_by_employee_id: entry.performedByEmployeeId ?? null,
      branch_name: entry.branchName ?? '',
      ip_address: entry.ipAddress ?? null,
      metadata: entry.metadata ?? {},
      performed_at: entry.timestamp,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then(({ error }: any) => {
      if (error) {
        console.warn('[AuditService] Failed to write audit log:', error.message);
      }
    });
}

export async function getAuditLogs(
  companyId: string,
  limit = 500
): Promise<AuditLogEntry[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('audit_logs') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AuditService] getAuditLogs:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): AuditLogEntry => ({
    id: row.id,
    timestamp: row.performed_at ?? new Date().toISOString(),
    action: row.action,
    module: row.module,
    entityId: row.entity_id ?? undefined,
    entityName: row.entity_name ?? '',
    descriptionAr: row.description_ar ?? '',
    descriptionEn: row.description_en ?? '',
    details: row.details ?? '',
    performedByName: row.performed_by_name ?? '',
    performedByRole: row.performed_by_role ?? undefined,
    performedByEmployeeId: row.performed_by_employee_id ?? undefined,
    branchName: row.branch_name ?? '',
    ipAddress: row.ip_address ?? undefined,
    metadata: row.metadata ?? {},
  }));
}
