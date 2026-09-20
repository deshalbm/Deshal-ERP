import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import {
  Employee,
  AttendanceRecord,
  PayrollSlip,
  LeaveRequest,
  KioskDevice,
  AttendanceMovementLog
} from "../types";
import {
  loadEmployees,
  saveEmployees,
  loadAttendanceRecords,
  saveAttendanceRecords,
  loadPayrollSlips,
  savePayrollSlips,
  loadLeaveRequests,
  saveLeaveRequests,
  loadActiveEmployeeId,
  saveActiveEmployeeId
} from "../utils/storage";
import {
  loadKioskDevices,
  saveKioskDevices,
  loadAttendanceMovementLogs,
  saveAttendanceMovementLogs
} from "../utils/attendanceStorage";
import { useERPData } from "./ERPDataContext";
import * as employeeSvc from "../lib/supabase/employeeService";
import * as hrSvc from "../lib/supabase/hrService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { enqueueOfflineMutation } from "../lib/supabase/syncService";
import { recordKioskAttendance } from "../application/hr/recordKioskAttendance";
import { resolveCompanyId } from "../utils/uuid";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export interface HRContextState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payrollSlips: PayrollSlip[];
  leaveRequests: LeaveRequest[];
  kioskDevices: KioskDevice[];
  movementLogs: AttendanceMovementLog[];
  activeEmployeeId: string;
}

export interface HRContextActions {
  saveEmployees: (employees: Employee[]) => void;
  saveAttendance: (records: AttendanceRecord[]) => void;
  savePayrollSlips: (slips: PayrollSlip[]) => void;
  saveLeaveRequests: (requests: LeaveRequest[]) => void;
  saveKioskDevices: (devices: KioskDevice[]) => void;
  selectActiveEmployee: (id: string) => void;
  saveMovementLogSingle: (log: AttendanceMovementLog) => void;
  setEmployeesList: (employees: Employee[]) => void;
  setAttendanceList: (records: AttendanceRecord[]) => void;
  setPayrollSlipsList: (slips: PayrollSlip[]) => void;
  setLeaveRequestsList: (requests: LeaveRequest[]) => void;
  setKioskDevicesList: (devices: KioskDevice[]) => void;
  setMovementLogsList: (logs: AttendanceMovementLog[]) => void;
}

export interface HRContextValue {
  state: HRContextState;
  actions: HRContextActions;
  getActiveEmployee: () => Employee;
}

const HRContext = createContext<HRContextValue | null>(null);

export interface HRProviderProps {
  children: React.ReactNode;
  initialEmployees?: Employee[];
  initialAttendance?: AttendanceRecord[];
  initialPayrollSlips?: PayrollSlip[];
  initialLeaveRequests?: LeaveRequest[];
  initialKioskDevices?: KioskDevice[];
  initialMovementLogs?: AttendanceMovementLog[];
  initialActiveEmployeeId?: string;
  onAuditLog?: (
    action: any,
    module: any,
    entityId: string,
    entityName: string,
    descAr: string,
    descEn: string,
    details?: string
  ) => void;
}

export const HRProvider: React.FC<HRProviderProps> = ({
  children,
  initialEmployees,
  initialAttendance,
  initialPayrollSlips,
  initialLeaveRequests,
  initialKioskDevices,
  initialMovementLogs,
  initialActiveEmployeeId,
  onAuditLog
}) => {
  const erpData = useERPData();

  const [internalEmployees, setInternalEmployees] = useState<Employee[]>(() => {
    if (initialEmployees) return initialEmployees;
    if (erpData?.employeesList && erpData.employeesList.length > 0) {
      return erpData.employeesList;
    }
    return loadEmployees();
  });

  const [internalAttendance, setInternalAttendance] = useState<AttendanceRecord[]>(() => {
    if (initialAttendance) return initialAttendance;
    if (erpData?.attendanceList && erpData.attendanceList.length > 0) {
      return erpData.attendanceList;
    }
    return loadAttendanceRecords();
  });

  const [internalPayrollSlips, setInternalPayrollSlips] = useState<PayrollSlip[]>(() => {
    if (initialPayrollSlips) return initialPayrollSlips;
    if (erpData?.payrollSlipsList && erpData.payrollSlipsList.length > 0) {
      return erpData.payrollSlipsList;
    }
    return loadPayrollSlips();
  });

  const [internalLeaveRequests, setInternalLeaveRequests] = useState<LeaveRequest[]>(() => {
    if (initialLeaveRequests) return initialLeaveRequests;
    if (erpData?.leaveRequestsList && erpData.leaveRequestsList.length > 0) {
      return erpData.leaveRequestsList;
    }
    return loadLeaveRequests();
  });

  const [internalKioskDevices, setInternalKioskDevices] = useState<KioskDevice[]>(() => {
    if (initialKioskDevices) return initialKioskDevices;
    return loadKioskDevices();
  });

  const [internalMovementLogs, setInternalMovementLogs] = useState<AttendanceMovementLog[]>(() => {
    if (initialMovementLogs) return initialMovementLogs;
    if (erpData?.movementLogsList && erpData.movementLogsList.length > 0) {
      return erpData.movementLogsList;
    }
    return loadAttendanceMovementLogs();
  });

  const [internalActiveEmployeeId, setInternalActiveEmployeeId] = useState<string>(() => {
    if (initialActiveEmployeeId) return initialActiveEmployeeId;
    return loadActiveEmployeeId();
  });

  // Sync to ERPDataContext (One-Way Bridge: HRContext -> ERPDataContext)
  useEffect(() => {
    if (erpData?.setEmployeesList) erpData.setEmployeesList(internalEmployees);
  }, [internalEmployees, erpData]);

  useEffect(() => {
    if (erpData?.setAttendanceList) erpData.setAttendanceList(internalAttendance);
  }, [internalAttendance, erpData]);

  useEffect(() => {
    if (erpData?.setPayrollSlipsList) erpData.setPayrollSlipsList(internalPayrollSlips);
  }, [internalPayrollSlips, erpData]);

  useEffect(() => {
    if (erpData?.setLeaveRequestsList) erpData.setLeaveRequestsList(internalLeaveRequests);
  }, [internalLeaveRequests, erpData]);

  useEffect(() => {
    if (erpData?.setMovementLogsList) erpData.setMovementLogsList(internalMovementLogs);
  }, [internalMovementLogs, erpData]);

  const companyId = resolveCompanyId(erpData?.companyId);

  const saveEmployeesAction = useCallback(
    (employees: Employee[]) => {
      setInternalEmployees(employees);
      saveEmployees(employees);

      if (isSupabaseConfigured && companyId) {
        Promise.all(employees.map((emp) => employeeSvc.upsertEmployee(emp, companyId))).catch(console.error);
      }

      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "SETTINGS",
          "employees-list",
          "سجل الموظفين والصلاحيات",
          `تحديث قائمة الموظفين وتعيين الصلاحيات (${employees.length} موظف)`,
          `Updated employees directory and role permissions (${employees.length} staff)`
        );
      }
    },
    [companyId, onAuditLog]
  );

  const saveAttendanceAction = useCallback(
    (records: AttendanceRecord[]) => {
      setInternalAttendance(records);
      saveAttendanceRecords(records);

      if (isSupabaseConfigured && companyId) {
        Promise.all(records.map((r) => hrSvc.upsertAttendanceRecord(r, companyId))).catch(console.error);
      }

      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "SETTINGS",
          "attendance-records",
          "سجلات الحضور والانصراف",
          `تحديث سجلات الحضور والانصراف (${records.length} حركة)`,
          `Updated attendance & time-tracking logs (${records.length} records)`
        );
      }
    },
    [companyId, onAuditLog]
  );

  const savePayrollSlipsAction = useCallback(
    (slips: PayrollSlip[]) => {
      setInternalPayrollSlips(slips);
      savePayrollSlips(slips);

      if (isSupabaseConfigured && companyId) {
        Promise.all(slips.map((s) => hrSvc.upsertPayrollSlip(s, companyId))).catch(console.error);
      }

      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "SETTINGS",
          "payroll-slips",
          "مسيرات الرواتب وحماية الأجور",
          `تحديث مسيرات الرواتب الشهرية (${slips.length} قسيمة)`,
          `Updated monthly payroll batches and slips (${slips.length} slips)`
        );
      }
    },
    [companyId, onAuditLog]
  );

  const saveLeaveRequestsAction = useCallback(
    (requests: LeaveRequest[]) => {
      setInternalLeaveRequests(requests);
      saveLeaveRequests(requests);

      if (isSupabaseConfigured && companyId) {
        Promise.all(requests.map((r) => hrSvc.upsertLeaveRequest(r, companyId))).catch(console.error);
      }

      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "SETTINGS",
          "leave-requests",
          "طلبات الإجازات والغياب",
          `تحديث سجلات وطلبات الإجازات (${requests.length} طلب)`,
          `Updated leave requests and absence records (${requests.length} requests)`
        );
      }
    },
    [companyId, onAuditLog]
  );

  const saveKioskDevicesAction = useCallback((devices: KioskDevice[]) => {
    setInternalKioskDevices(devices);
    saveKioskDevices(devices);
  }, []);

  const selectActiveEmployeeAction = useCallback((id: string) => {
    setInternalActiveEmployeeId(id);
    saveActiveEmployeeId(id);
  }, []);

  const saveMovementLogSingleAction = useCallback(
    (log: AttendanceMovementLog) => {
      // Execute pure application use case logic
      const result = recordKioskAttendance({
        log,
        movementLogs: internalMovementLogs,
        attendanceList: internalAttendance,
        employeesList: internalEmployees,
      });

      // Persist movement logs
      setInternalMovementLogs(result.updatedMovementLogs);
      saveAttendanceMovementLogs(result.updatedMovementLogs);

      // Supabase & Offline queue handling
      if (isSupabaseConfigured) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          enqueueOfflineMutation({
            entityType: "ATTENDANCE_MOVEMENT_LOG",
            action: "UPSERT",
            payload: log,
            companyId,
          });
        } else {
          hrSvc.addAttendanceMovementLog(log, companyId).catch(console.error);
        }
      }

      // Persist daily attendance record if changed
      if (result.updatedAttendance !== internalAttendance) {
        saveAttendanceAction(result.updatedAttendance);
      }
    },
    [internalMovementLogs, internalAttendance, internalEmployees, companyId, saveAttendanceAction]
  );

  const getActiveEmployee = useCallback((): Employee => {
    return (
      internalEmployees.find((e) => e.id === internalActiveEmployeeId) ||
      internalEmployees[0] ||
      ({
        id: "emp-curr",
        nameAr: "المستخدم",
        nameEn: "User",
        role: "مدير النظام",
      } as any)
    );
  }, [internalEmployees, internalActiveEmployeeId]);

  const value = useMemo<HRContextValue>(
    () => ({
      state: {
        employees: internalEmployees,
        attendance: internalAttendance,
        payrollSlips: internalPayrollSlips,
        leaveRequests: internalLeaveRequests,
        kioskDevices: internalKioskDevices,
        movementLogs: internalMovementLogs,
        activeEmployeeId: internalActiveEmployeeId,
      },
      actions: {
        saveEmployees: saveEmployeesAction,
        saveAttendance: saveAttendanceAction,
        savePayrollSlips: savePayrollSlipsAction,
        saveLeaveRequests: saveLeaveRequestsAction,
        saveKioskDevices: saveKioskDevicesAction,
        selectActiveEmployee: selectActiveEmployeeAction,
        saveMovementLogSingle: saveMovementLogSingleAction,
        setEmployeesList: setInternalEmployees,
        setAttendanceList: setInternalAttendance,
        setPayrollSlipsList: setInternalPayrollSlips,
        setLeaveRequestsList: setInternalLeaveRequests,
        setKioskDevicesList: setInternalKioskDevices,
        setMovementLogsList: setInternalMovementLogs,
      },
      getActiveEmployee,
    }),
    [
      internalEmployees,
      internalAttendance,
      internalPayrollSlips,
      internalLeaveRequests,
      internalKioskDevices,
      internalMovementLogs,
      internalActiveEmployeeId,
      saveEmployeesAction,
      saveAttendanceAction,
      savePayrollSlipsAction,
      saveLeaveRequestsAction,
      saveKioskDevicesAction,
      selectActiveEmployeeAction,
      saveMovementLogSingleAction,
      getActiveEmployee,
    ]
  );

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};

export function useHR(): HRContextValue {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error("useHR must be used within an HRProvider");
  }
  return context;
}
