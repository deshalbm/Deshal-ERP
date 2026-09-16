import { AttendanceMovementLog, AttendanceRecord, Employee } from "../../types";

export interface RecordKioskAttendanceParams {
  log: AttendanceMovementLog;
  movementLogs: AttendanceMovementLog[];
  attendanceList: AttendanceRecord[];
  employeesList: Employee[];
}

export interface RecordKioskAttendanceResult {
  updatedMovementLogs: AttendanceMovementLog[];
  updatedAttendance: AttendanceRecord[];
  newAttendanceRecordCreated?: AttendanceRecord;
  updatedAttendanceRecord?: AttendanceRecord;
}

/**
 * Pure Application Use Case for recording a Kiosk Attendance movement log
 * and updating or creating the corresponding daily AttendanceRecord.
 * 
 * Preserves 100% of existing business algorithm from App.tsx handleSaveGlobalMovementLogSingle.
 */
export function recordKioskAttendance(
  params: RecordKioskAttendanceParams
): RecordKioskAttendanceResult {
  const { log, movementLogs, attendanceList, employeesList } = params;

  // 1. Prepend movement log
  const updatedMovementLogs = [log, ...movementLogs];

  // 2. Mux daily attendance record if category is CHECK_IN or CHECK_OUT
  if (log.movementCategory !== "CHECK_IN" && log.movementCategory !== "CHECK_OUT") {
    return {
      updatedMovementLogs,
      updatedAttendance: attendanceList,
    };
  }

  const todayStr = log.date || new Date().toISOString().split("T")[0];
  const existingRec = attendanceList.find(
    (r) => r.employeeId === log.employeeId && r.date === todayStr
  );

  if (existingRec) {
    let updatedTargetRec: AttendanceRecord | undefined;
    const updatedAttendance = attendanceList.map((r) => {
      if (r.id === existingRec.id) {
        updatedTargetRec = {
          ...r,
          checkIn: log.movementCategory === "CHECK_IN" ? (log.time || r.checkIn) : r.checkIn,
          checkOut: log.movementCategory === "CHECK_OUT" ? (log.time || r.checkOut) : r.checkOut,
          status: "PRESENT" as const,
        };
        return updatedTargetRec;
      }
      return r;
    });

    return {
      updatedMovementLogs,
      updatedAttendance,
      updatedAttendanceRecord: updatedTargetRec,
    };
  } else {
    const emp = employeesList.find((e) => e.id === log.employeeId);
    const newRec: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: log.employeeId,
      employeeCode: log.employeeCode || emp?.employeeCode || "EMP-001",
      employeeName: log.employeeName,
      jobTitle: emp?.jobTitle,
      department: emp?.department,
      date: todayStr,
      checkIn: log.movementCategory === "CHECK_IN" ? log.time : "08:00",
      checkOut: log.movementCategory === "CHECK_OUT" ? log.time : undefined,
      status: "PRESENT",
      workingHours: 8,
      overtimeHours: 0,
      lateMinutes: 0,
      branchId: log.branchId,
      branchName: log.branchName,
      notes: `مسجل تلقائياً عبر الكشك اللوحي (${log.deviceName || "Kiosk"})`,
    };

    return {
      updatedMovementLogs,
      updatedAttendance: [newRec, ...attendanceList],
      newAttendanceRecordCreated: newRec,
    };
  }
}
