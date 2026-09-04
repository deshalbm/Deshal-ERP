/**
 * Audit Service — Supabase
 * Uses AuditLogEntry from src/types.ts exactly.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { AuditLogEntry } from '../../types';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

export async function logToSupabase(
  entry: AuditLogEntry,
  companyId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const validCompanyId = ensureValidUuid(companyId);
  const validId = ensureValidUuid(entry.id);
  const validEntityId = ensureNullableUuid(entry.entityId);

  // Fire and forget — don't block the UI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.from('audit_logs') as any)
    .insert({
      id: validId,
      company_id: validCompanyId,
      action: entry.action || 'SYSTEM',
      domain: entry.module || 'SYSTEM',
      entity_id: validEntityId,
      entity_type: entry.module || 'SYSTEM',
      details: entry.details || entry.descriptionAr || entry.descriptionEn || entry.action || 'Audit log',
      ip_address: entry.ipAddress ?? null,
      metadata: {
        module: entry.module,
        entityName: entry.entityName,
        descriptionAr: entry.descriptionAr,
        descriptionEn: entry.descriptionEn,
        performedByName: entry.performedByName,
        performedByRole: entry.performedByRole,
        performedByEmployeeId: entry.performedByEmployeeId,
        branchName: entry.branchName,
        timestamp: entry.timestamp,
        ...(entry.metadata ?? {}),
      },
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

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('audit_logs') as any)
    .select('*')
    .eq('company_id', validCompanyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes('JWT issued at future') || error.message.includes('JWT expired')) {
      console.warn('[AuditService] Future-dated or invalid JWT token detected. Clearing stale auth session...');
      supabase.auth.signOut().catch(() => {});
    } else {
      console.error('[AuditService] getAuditLogs:', error.message);
    }
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): AuditLogEntry => {
    const meta = row.metadata ?? {};
    return {
      id: row.id,
      timestamp: meta.timestamp ?? row.created_at ?? new Date().toISOString(),
      action: row.action ?? 'SYSTEM',
      module: row.domain ?? row.entity_type ?? meta.module ?? 'SYSTEM',
      entityId: row.entity_id ?? undefined,
      entityName: meta.entityName ?? '',
      descriptionAr: meta.descriptionAr ?? row.details ?? '',
      descriptionEn: meta.descriptionEn ?? row.details ?? '',
      details: row.details ?? '',
      performedByName: meta.performedByName ?? '',
      performedByRole: meta.performedByRole ?? undefined,
      performedByEmployeeId: meta.performedByEmployeeId ?? undefined,
      branchName: meta.branchName ?? '',
      ipAddress: row.ip_address ?? undefined,
      metadata: meta,
    };
  });
}
