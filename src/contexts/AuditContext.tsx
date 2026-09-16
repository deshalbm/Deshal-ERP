import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { AuditLogEntry, AuditAction, AuditModule } from "../types";
import {
  loadAuditLogs,
  clearAuditLogs as clearAuditLogsStorage
} from "../utils/auditLogger";
import { getActiveBranch } from "../application/masterData/getActiveBranch";
import { getActiveEmployee } from "../application/hr/getActiveEmployee";
import { logUserActivity } from "../application/audit/logUserActivity";

export interface AuditState {
  auditLogsList: AuditLogEntry[];
}

export interface AuditActions {
  triggerAuditLog: (
    action: AuditAction | string,
    module: AuditModule | string,
    entityId: string,
    entityName: string,
    descAr: string,
    descEn: string,
    details?: string
  ) => void;
  clearAuditLogs: () => void;
  setAuditLogsList: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
}

export interface AuditContextValue {
  state: AuditState;
  actions: AuditActions;
}

const AuditContext = createContext<AuditContextValue | null>(null);

export interface AuditProviderProps {
  children: React.ReactNode;
}

export const AuditProvider: React.FC<AuditProviderProps> = ({ children }) => {
  const [auditLogsList, setAuditLogsList] = useState<AuditLogEntry[]>(() => loadAuditLogs());

  const triggerAuditLog = useCallback(
    (
      action: any,
      module: any,
      entityId: string,
      entityName: string,
      descAr: string,
      descEn: string,
      details?: string
    ) => {
      const emp = getActiveEmployee();
      const branch = getActiveBranch();
      const newLogEntry = {
        action,
        module,
        entityId,
        entityName,
        descriptionAr: descAr,
        descriptionEn: descEn,
        details: details || "",
        performedByName: emp.fullName || (emp as any).nameAr || "المستخدم",
        performedByRole: emp.role,
        performedByEmployeeId: emp.id,
        branchName: (branch as any).name || (branch as any).nameAr || ""
      };
      setAuditLogsList((prev) => logUserActivity(newLogEntry, prev));
    },
    []
  );

  const handleClearAuditLogs = useCallback(() => {
    const empty = clearAuditLogsStorage();
    setAuditLogsList(empty);
  }, []);

  const value = useMemo<AuditContextValue>(
    () => ({
      state: { auditLogsList },
      actions: {
        triggerAuditLog,
        clearAuditLogs: handleClearAuditLogs,
        setAuditLogsList
      }
    }),
    [auditLogsList, triggerAuditLog, handleClearAuditLogs]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
};

export const useAudit = (): AuditContextValue => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error("useAudit must be used within an AuditProvider");
  }
  return context;
};
