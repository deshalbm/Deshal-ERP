import { AuditLoggerPort } from "../../application/ports/auditLoggerPort";
import { loadAuditLogs, saveAuditLogs } from "../../utils/auditLogger";

export const defaultAuditLoggerAdapter: AuditLoggerPort = {
  loadAuditLogs,
  saveAuditLogs,
  logToRemote: async (entry, companyId) => {
    if (typeof window !== "undefined") {
      const svc = await import("../supabase/auditService");
      await svc.logToSupabase(entry, companyId);
    }
  }
};
