import { AttendanceMovementLog, AttendanceRecord, Employee } from "../../types";
import { recordKioskAttendance, RecordKioskAttendanceResult } from "./recordKioskAttendance";
import {
  KioskAttendanceStoragePort,
  KioskAttendanceRemotePort
} from "../ports/kioskAttendancePort";

export const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export interface SaveKioskAttendanceOptions {
  companyId?: string;
  storageAdapter?: KioskAttendanceStoragePort;
  remoteAdapter?: KioskAttendanceRemotePort;
  currentAttendanceRecords?: AttendanceRecord[];
  currentMovementLogs?: AttendanceMovementLog[];
  currentEmployees?: Employee[];
}

/**
 * Application service for recording a kiosk attendance movement log,
 * updating local storage, handling offline queueing, and dispatching
 * remote mutations if online.
 * 
 * Preserves 100% of existing behavior via application ports.
 */
export function saveKioskAttendance(
  log: AttendanceMovementLog,
  options?: SaveKioskAttendanceOptions
): RecordKioskAttendanceResult {
  const cId = options?.companyId || DEFAULT_COMPANY_ID;
  const storage = options?.storageAdapter;
  const remote = options?.remoteAdapter;

  const currentAtt = options?.currentAttendanceRecords || (storage ? storage.loadAttendanceRecords() : []);
  const currentLogs = options?.currentMovementLogs || (storage ? storage.loadAttendanceMovementLogs() : []);
  const currentEmps = options?.currentEmployees || (storage ? storage.loadEmployees() : []);

  const result = recordKioskAttendance({
    log,
    movementLogs: currentLogs,
    attendanceList: currentAtt,
    employeesList: currentEmps,
  });

  if (storage) {
    storage.saveAttendanceMovementLogs(result.updatedMovementLogs);
    if (result.updatedAttendance !== currentAtt) {
      storage.saveAttendanceRecords(result.updatedAttendance);
    }
  }

  if (remote && remote.isConfigured()) {
    if (!remote.isOnline()) {
      remote.enqueueOfflineMutation({
        entityType: "ATTENDANCE_MOVEMENT_LOG",
        action: "UPSERT",
        payload: log,
        companyId: cId,
      });
    } else {
      remote.addAttendanceMovementLog(log, cId).catch(console.error);
    }
  }

  return result;
}
