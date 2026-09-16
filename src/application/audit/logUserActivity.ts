import { AuditLogEntry } from "../../types";
import { AuditLoggerPort } from "../ports/auditLoggerPort";

export type NewAuditLogInput = Omit<AuditLogEntry, "id" | "timestamp">;

export interface LogUserActivityOptions {
  adapter?: AuditLoggerPort;
  nowMs?: number;
  companyId?: string;
}

export function logUserActivity(
  entry: NewAuditLogInput,
  currentLogs?: AuditLogEntry[],
  options?: LogUserActivityOptions
): AuditLogEntry[] {
  const adapter = options?.adapter;
  const companyId = options?.companyId || "00000000-0000-0000-0000-000000000001";
  const nowMs = options?.nowMs || Date.now();
  const existing = currentLogs || (adapter ? adapter.loadAuditLogs() : []);

  const newLog: AuditLogEntry = {
    ...entry,
    id: `log-${nowMs}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date(nowMs).toISOString()
  };

  const updated = [newLog, ...existing];
  if (adapter) {
    adapter.saveAuditLogs(updated);
    if (adapter.logToRemote) {
      adapter.logToRemote(newLog, companyId).catch(console.error);
    }
  }

  return updated;
}
