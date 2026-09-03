import { AuditLogEntry, AuditAction, AuditModule } from "../types";

const STORAGE_KEY = "rv_studio_audit_logs";

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export function loadAuditLogs(): AuditLogEntry[] {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load audit logs from localStorage:", e);
  }
  return [];
}

export function saveAuditLogs(logs: AuditLogEntry[]): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 1000))); // Keep last 1000 logs
    }
  } catch (e) {
    console.error("Failed to save audit logs to localStorage:", e);
  }
}

export function logActivity(
  entry: Omit<AuditLogEntry, "id" | "timestamp">,
  currentLogs?: AuditLogEntry[]
): AuditLogEntry[] {
  const existing = currentLogs || loadAuditLogs();
  const newLog: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString()
  };

  const updated = [newLog, ...existing];
  saveAuditLogs(updated);

  // Asynchronously push to Supabase audit_logs
  import('../lib/supabase/auditService').then((svc) => {
    svc.logToSupabase(newLog, '00000000-0000-0000-0000-000000000001').catch(console.error);
  }).catch(console.error);

  return updated;
}

export function clearAuditLogs(): AuditLogEntry[] {
  const empty: AuditLogEntry[] = [];
  saveAuditLogs(empty);
  return empty;
}

export function exportAuditLogsToCsv(logs: AuditLogEntry[]): void {
  if (!logs || logs.length === 0) return;

  const headers = [
    "ID",
    "Timestamp (ISO)",
    "Action",
    "Module",
    "Entity Name",
    "Description (AR)",
    "Description (EN)",
    "Performed By",
    "Role",
    "Branch",
    "Details"
  ];

  const escapeCsv = (val: string | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map((log) => [
    escapeCsv(log.id),
    escapeCsv(log.timestamp),
    escapeCsv(log.action),
    escapeCsv(log.module),
    escapeCsv(log.entityName || ""),
    escapeCsv(log.descriptionAr),
    escapeCsv(log.descriptionEn),
    escapeCsv(log.performedByName),
    escapeCsv(log.performedByRole || ""),
    escapeCsv(log.branchName || ""),
    escapeCsv(log.details || "")
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Audit_Activity_Logs_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
