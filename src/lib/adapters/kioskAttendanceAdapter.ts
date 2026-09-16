import {
  KioskAttendanceStoragePort,
  KioskAttendanceRemotePort
} from "../../application/ports/kioskAttendancePort";
import {
  loadAttendanceRecords,
  loadEmployees,
  saveAttendanceRecords
} from "../../utils/storage";
import {
  loadAttendanceMovementLogs,
  saveAttendanceMovementLogs
} from "../../utils/attendanceStorage";
import { isSupabaseConfigured } from "../supabase/client";
import { enqueueOfflineMutation } from "../supabase/syncService";
import * as hrSvc from "../supabase/hrService";

export const defaultKioskAttendanceStorageAdapter: KioskAttendanceStoragePort = {
  loadAttendanceRecords,
  loadAttendanceMovementLogs,
  loadEmployees,
  saveAttendanceMovementLogs,
  saveAttendanceRecords
};

export const defaultKioskAttendanceRemoteAdapter: KioskAttendanceRemotePort = {
  isConfigured: () => isSupabaseConfigured,
  isOnline: () => typeof navigator !== "undefined" ? navigator.onLine : true,
  enqueueOfflineMutation,
  addAttendanceMovementLog: (log, companyId) => hrSvc.addAttendanceMovementLog(log, companyId)
};
