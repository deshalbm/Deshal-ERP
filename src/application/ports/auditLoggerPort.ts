import { AuditLogEntry } from "../../types";

export interface AuditLoggerPort {
  loadAuditLogs: () => AuditLogEntry[];
  saveAuditLogs: (logs: AuditLogEntry[]) => void;
  logToRemote?: (entry: AuditLogEntry, companyId: string) => Promise<void>;
}
