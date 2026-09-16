import { AttendanceMovementLog, AttendanceRecord, Employee } from "../../types";

export interface KioskAttendanceStoragePort {
  loadAttendanceRecords: () => AttendanceRecord[];
  loadAttendanceMovementLogs: () => AttendanceMovementLog[];
  loadEmployees: () => Employee[];
  saveAttendanceMovementLogs: (logs: AttendanceMovementLog[]) => void;
  saveAttendanceRecords: (records: AttendanceRecord[]) => void;
}

export interface KioskAttendanceRemotePort {
  isConfigured: () => boolean;
  isOnline: () => boolean;
  enqueueOfflineMutation: (payload: { entityType: string; action: string; payload: any; companyId: string }) => void;
  addAttendanceMovementLog: (log: AttendanceMovementLog, companyId: string) => Promise<{ success: boolean; error?: string; }>;
}
