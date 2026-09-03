/**
 * DESHAL ERP - ATTENDANCE & KIOSK PERSISTENCE STORAGE
 * 
 * Manages Kiosk Devices, Dynamic Movement Types, Movement Logs,
 * Attendance Adjustments, and Offline Sync Queue.
 */

import {
  KioskDevice,
  MovementTypeConfig,
  AttendanceMovementLog,
  AttendanceAdjustment,
  EmployeeMovementStatus,
  MovementCategory
} from "../types";

export const KIOSK_STORAGE_KEYS = {
  DEVICES: "deshal_kiosk_devices_v1",
  MOVEMENT_TYPES: "deshal_kiosk_movement_types_v1",
  MOVEMENT_LOGS: "deshal_kiosk_movement_logs_v1",
  ADJUSTMENTS: "deshal_kiosk_adjustments_v1",
  OFFLINE_QUEUE: "deshal_kiosk_offline_queue_v1",
  ACTIVE_DEVICE_ID: "deshal_kiosk_active_device_id_v1",
  IS_KIOSK_MODE: "deshal_is_kiosk_mode_active_v1"
};

// ----------------------------------------------------
// DEFAULT DYNAMIC MOVEMENT TYPES (أنواع الحركات الافتراضية)
// ----------------------------------------------------

export const DEFAULT_MOVEMENT_TYPES: MovementTypeConfig[] = [
  {
    id: "mov-check-in",
    code: "CHECK_IN",
    labelAr: "تسجيل حضور (بداية الدوام)",
    labelEn: "Clock In (Start of Shift)",
    category: "CHECK_IN",
    iconName: "LogIn",
    color: "#10b981", // Emerald Green
    requiresPhoto: true,
    requiresReason: false,
    requiresApproval: false,
    isActive: true,
    order: 1
  },
  {
    id: "mov-check-out",
    code: "CHECK_OUT",
    labelAr: "تسجيل انصراف (نهاية الدوام)",
    labelEn: "Clock Out (End of Shift)",
    category: "CHECK_OUT",
    iconName: "LogOut",
    color: "#ef4444", // Rose Red
    requiresPhoto: true,
    requiresReason: false,
    requiresApproval: false,
    isActive: true,
    order: 2
  },
  {
    id: "mov-mission-out",
    code: "MISSION_OUT",
    labelAr: "خروج في مهمة عمل خارجية",
    labelEn: "Business Mission (Depart)",
    category: "MISSION_OUT",
    iconName: "Car",
    color: "#3b82f6", // Blue
    requiresPhoto: true,
    requiresReason: true,
    requiresApproval: false,
    isActive: true,
    order: 3
  },
  {
    id: "mov-mission-in",
    code: "MISSION_IN",
    labelAr: "العودة من مهمة العمل",
    labelEn: "Return from Business Mission",
    category: "MISSION_IN",
    iconName: "CheckCircle2",
    color: "#6366f1", // Indigo
    requiresPhoto: true,
    requiresReason: false,
    requiresApproval: false,
    isActive: true,
    order: 4
  },
  {
    id: "mov-break-out",
    code: "BREAK_OUT",
    labelAr: "استراحة عمل / غداء",
    labelEn: "Work Break / Lunch",
    category: "BREAK_OUT",
    iconName: "Coffee",
    color: "#f59e0b", // Amber
    requiresPhoto: false,
    requiresReason: false,
    requiresApproval: false,
    isActive: true,
    order: 5
  },
  {
    id: "mov-break-in",
    code: "BREAK_IN",
    labelAr: "العودة من الاستراحة",
    labelEn: "Return from Work Break",
    category: "BREAK_IN",
    iconName: "Clock",
    color: "#14b8a6", // Teal
    requiresPhoto: false,
    requiresReason: false,
    requiresApproval: false,
    isActive: true,
    order: 6
  },
  {
    id: "mov-emergency-out",
    code: "EMERGENCY_OUT",
    labelAr: "خروج طارئ ومفاجئ",
    labelEn: "Emergency Departure",
    category: "EMERGENCY_OUT",
    iconName: "AlertTriangle",
    color: "#dc2626", // Red
    requiresPhoto: true,
    requiresReason: true,
    requiresApproval: true,
    isActive: true,
    order: 7
  },
  {
    id: "mov-emergency-in",
    code: "EMERGENCY_IN",
    labelAr: "العودة من الظرف الطارئ",
    labelEn: "Return from Emergency",
    category: "EMERGENCY_IN",
    iconName: "ShieldCheck",
    color: "#8b5cf6", // Violet
    requiresPhoto: true,
    requiresReason: false,
    requiresApproval: false,
    isActive: true,
    order: 8
  }
];

// ----------------------------------------------------
// DEFAULT KIOSK DEVICES (أجهزة الكشك اللوحية المعتمدة)
// ----------------------------------------------------

export const DEFAULT_KIOSK_DEVICES: KioskDevice[] = [
  {
    id: "dev-sohar-main",
    deviceCode: "KIOSK-SOH-MAIN",
    name: "آيباد الاستقبال الرئيسي - صحار",
    companyName: "ديشال لإدارة الأعمال",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    location: "صالة الاستقبال والمدخل التنفيذي",
    deviceToken: "dsh_kiosk_tok_849204_soh_main",
    activationCode: "DSH-K-849204",
    status: "ACTIVE",
    lastPing: new Date().toISOString(),
    ipAddress: "192.168.1.104",
    model: "Apple iPad Pro 11-inch (M2)",
    appVersion: "Deshal Kiosk v3.4",
    isLocked: false,
    notes: "جهاز كشك معلق على الحائط بمدخل الاستقبال مزود بكاميرا عالية الدقة.",
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: new Date().toISOString()
  },
  {
    id: "dev-sohar-warehouse",
    deviceCode: "KIOSK-SOH-WH",
    name: "تابلت بوابة المستودع المركزي",
    companyName: "ديشال لإدارة الأعمال",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    location: "بوابة المستودع ومنطقة التحميل",
    deviceToken: "dsh_kiosk_tok_738192_soh_wh",
    activationCode: "DSH-K-738192",
    status: "ACTIVE",
    lastPing: new Date().toISOString(),
    ipAddress: "192.168.1.109",
    model: "Samsung Galaxy Tab Active4 Pro",
    appVersion: "Deshal Kiosk v3.4",
    isLocked: false,
    notes: "مخصص لأمناء المخازن والفنيين في مستودع المواد والكابلات.",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: new Date().toISOString()
  },
  {
    id: "dev-muscat-recep",
    deviceCode: "KIOSK-MCT-01",
    name: "آيباد فرع مسقط - غلا",
    companyName: "ديشال لإدارة الأعمال",
    branchId: "branch-muscat",
    branchName: "فرع مسقط - غلا",
    location: "منطقة الاستقبال ومساحات العمل",
    deviceToken: "dsh_kiosk_tok_928174_mct_01",
    activationCode: "DSH-K-928174",
    status: "ACTIVE",
    lastPing: new Date().toISOString(),
    ipAddress: "192.168.2.55",
    model: "Apple iPad 10th Gen",
    appVersion: "Deshal Kiosk v3.4",
    isLocked: false,
    notes: "كشك تسجيل حضور موظفي وزوار فرع مسقط.",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// DEFAULT ATTENDANCE MOVEMENT LOGS (سجل الحركات الأولي)
// ----------------------------------------------------

const TODAY_STR = new Date().toISOString().split("T")[0];

export const DEFAULT_ATTENDANCE_MOVEMENT_LOGS: AttendanceMovementLog[] = [];

// ----------------------------------------------------
// DEFAULT ATTENDANCE ADJUSTMENTS (تعديلات الحركات مع التاريخ)
// ----------------------------------------------------

export const DEFAULT_ATTENDANCE_ADJUSTMENTS: AttendanceAdjustment[] = [];

// ----------------------------------------------------
// LOAD & SAVE STORAGE METHODS
// ----------------------------------------------------

export function loadMovementTypes(): MovementTypeConfig[] {
  try {
    const raw = localStorage.getItem(KIOSK_STORAGE_KEYS.MOVEMENT_TYPES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load movement types:", e);
  }
  saveMovementTypes(DEFAULT_MOVEMENT_TYPES);
  return DEFAULT_MOVEMENT_TYPES;
}

export function saveMovementTypes(types: MovementTypeConfig[]): void {
  try {
    localStorage.setItem(KIOSK_STORAGE_KEYS.MOVEMENT_TYPES, JSON.stringify(types));
  } catch (e) {
    console.error("Failed to save movement types:", e);
  }
}

export function loadKioskDevices(): KioskDevice[] {
  try {
    const raw = localStorage.getItem(KIOSK_STORAGE_KEYS.DEVICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load kiosk devices:", e);
  }
  saveKioskDevices(DEFAULT_KIOSK_DEVICES);
  return DEFAULT_KIOSK_DEVICES;
}

export function saveKioskDevices(devices: KioskDevice[]): void {
  try {
    localStorage.setItem(KIOSK_STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  } catch (e) {
    console.error("Failed to save kiosk devices:", e);
  }
}

export function loadAttendanceMovementLogs(): AttendanceMovementLog[] {
  try {
    const raw = localStorage.getItem(KIOSK_STORAGE_KEYS.MOVEMENT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load movement logs:", e);
  }
  saveAttendanceMovementLogs(DEFAULT_ATTENDANCE_MOVEMENT_LOGS);
  return DEFAULT_ATTENDANCE_MOVEMENT_LOGS;
}

export function saveAttendanceMovementLogs(logs: AttendanceMovementLog[]): void {
  try {
    localStorage.setItem(KIOSK_STORAGE_KEYS.MOVEMENT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save movement logs:", e);
  }
}

export function loadAttendanceAdjustments(): AttendanceAdjustment[] {
  try {
    const raw = localStorage.getItem(KIOSK_STORAGE_KEYS.ADJUSTMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load attendance adjustments:", e);
  }
  saveAttendanceAdjustments(DEFAULT_ATTENDANCE_ADJUSTMENTS);
  return DEFAULT_ATTENDANCE_ADJUSTMENTS;
}

export function saveAttendanceAdjustments(adjustments: AttendanceAdjustment[]): void {
  try {
    localStorage.setItem(KIOSK_STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  } catch (e) {
    console.error("Failed to save attendance adjustments:", e);
  }
}

export function loadActiveKioskDeviceId(): string {
  try {
    const saved = localStorage.getItem(KIOSK_STORAGE_KEYS.ACTIVE_DEVICE_ID);
    if (saved) return saved;
  } catch (e) {
    console.warn("Failed to load active kiosk device id:", e);
  }
  return "dev-sohar-main";
}

export function saveActiveKioskDeviceId(id: string): void {
  try {
    localStorage.setItem(KIOSK_STORAGE_KEYS.ACTIVE_DEVICE_ID, id);
  } catch (e) {
    console.error("Failed to save active kiosk device id:", e);
  }
}

/**
 * Checks if the browser is configured as an active Attendance Kiosk device.
 */
export function loadIsKioskModeEnabled(): boolean {
  try {
    const saved = localStorage.getItem(KIOSK_STORAGE_KEYS.IS_KIOSK_MODE);
    return saved === "true";
  } catch (e) {
    console.warn("Failed to load kiosk mode state:", e);
  }
  return false;
}

/**
 * Activates or deactivates Kiosk mode presentation on this device without wiping device ID or token.
 */
export function saveIsKioskModeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KIOSK_STORAGE_KEYS.IS_KIOSK_MODE, enabled ? "true" : "false");
  } catch (e) {
    console.error("Failed to save kiosk mode state:", e);
  }
}

/**
 * Activates a Kiosk Device using its unique Activation Code
 */
export function activateDeviceByCode(
  activationCode: string,
  devices: KioskDevice[]
): { success: boolean; device?: KioskDevice; errorMessage?: string } {
  const normalized = activationCode.trim().toUpperCase();
  const matched = devices.find(
    (d) =>
      d.activationCode?.toUpperCase() === normalized ||
      d.deviceCode?.toUpperCase() === normalized ||
      d.id === activationCode
  );

  if (!matched) {
    return {
      success: false,
      errorMessage: "كود التفعيل غير صحيح أو الجهاز غير مسجل في النظام. يرجى مراجعة مسؤول النظام."
    };
  }

  if (matched.status !== "ACTIVE") {
    return {
      success: false,
      errorMessage: "هذا الجهاز معلق أو غير نشط في لوحة تحكم ERP."
    };
  }

  saveActiveKioskDeviceId(matched.id);
  saveIsKioskModeEnabled(true);

  return {
    success: true,
    device: matched
  };
}

// ----------------------------------------------------
// OFFLINE QUEUE MANAGEMENT (المزامنة الذاتية في وضع عدم الاتصال)
// ----------------------------------------------------

export interface OfflineSyncItem {
  id: string;
  log: AttendanceMovementLog;
  timestamp: number;
  retryCount: number;
}

export function loadOfflineQueue(): OfflineSyncItem[] {
  try {
    const raw = localStorage.getItem(KIOSK_STORAGE_KEYS.OFFLINE_QUEUE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to load offline queue:", e);
  }
  return [];
}

export function saveOfflineQueue(queue: OfflineSyncItem[]): void {
  try {
    localStorage.setItem(KIOSK_STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save offline queue:", e);
  }
}

export function addToOfflineQueue(log: AttendanceMovementLog): void {
  const queue = loadOfflineQueue();
  queue.push({
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    log,
    timestamp: Date.now(),
    retryCount: 0
  });
  saveOfflineQueue(queue);
}

export function syncOfflineQueueToMain(
  existingLogs: AttendanceMovementLog[]
): { updatedLogs: AttendanceMovementLog[]; syncedCount: number } {
  const queue = loadOfflineQueue();
  if (queue.length === 0) return { updatedLogs: existingLogs, syncedCount: 0 };

  const newLogs = [...existingLogs];
  let synced = 0;

  for (const item of queue) {
    const logItem = { ...item.log, syncStatus: "SYNCED" as const };
    const exists = newLogs.some((l) => l.id === logItem.id);
    if (!exists) {
      newLogs.unshift(logItem);
      synced++;
    }
  }

  saveOfflineQueue([]);
  saveAttendanceMovementLogs(newLogs);
  return { updatedLogs: newLogs, syncedCount: synced };
}

// ----------------------------------------------------
// EMPLOYEE LIVE STATUS CALCULATOR
// ----------------------------------------------------

export interface EmployeeLiveStatusInfo {
  status: EmployeeMovementStatus;
  statusLabelAr: string;
  statusLabelEn: string;
  badgeBg: string;
  badgeColor: string;
  lastLog?: AttendanceMovementLog;
  elapsedMinutes?: number;
  elapsedTimeString?: string;
  checkedInTime?: string;
  checkedOutTime?: string;
}

/**
 * Calculates current real-time movement status of an employee based on today's logs
 */
export function calculateEmployeeCurrentStatus(
  employeeId: string,
  logs: AttendanceMovementLog[],
  targetDate?: string
): EmployeeLiveStatusInfo {
  const dateToUse = targetDate || new Date().toISOString().split("T")[0];
  
  // Filter logs for this employee on target date, sorted chronologically
  const employeeTodayLogs = logs
    .filter((l) => l.employeeId === employeeId && l.date === dateToUse)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (employeeTodayLogs.length === 0) {
    return {
      status: "OUT_OF_OFFICE",
      statusLabelAr: "خارج الدوام / لم يسجل حضور",
      statusLabelEn: "Out of Office (No Record)",
      badgeBg: "bg-slate-100 border-slate-200",
      badgeColor: "text-slate-600"
    };
  }

  const lastLog = employeeTodayLogs[employeeTodayLogs.length - 1];
  const nowMs = Date.now();
  const lastLogMs = new Date(lastLog.timestamp).getTime();
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - lastLogMs) / (60 * 1000)));

  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  const elapsedTimeString = hours > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${mins} دقيقة`;

  const checkInLog = employeeTodayLogs.find((l) => l.movementCategory === "CHECK_IN");
  const checkOutLog = [...employeeTodayLogs].reverse().find((l) => l.movementCategory === "CHECK_OUT");

  switch (lastLog.movementCategory) {
    case "CHECK_IN":
    case "MISSION_IN":
    case "BREAK_IN":
    case "EMERGENCY_IN":
      return {
        status: "IN_OFFICE",
        statusLabelAr: "داخل مقر العمل (على رأس العمل)",
        statusLabelEn: "In Office (Active)",
        badgeBg: "bg-emerald-50 border-emerald-200",
        badgeColor: "text-emerald-700",
        lastLog,
        elapsedMinutes,
        elapsedTimeString,
        checkedInTime: checkInLog?.time
      };

    case "MISSION_OUT":
      return {
        status: "ON_MISSION",
        statusLabelAr: "خارج في مهمة عمل خارجية",
        statusLabelEn: "On Business Mission",
        badgeBg: "bg-blue-50 border-blue-200",
        badgeColor: "text-blue-700",
        lastLog,
        elapsedMinutes,
        elapsedTimeString,
        checkedInTime: checkInLog?.time
      };

    case "EMERGENCY_OUT":
      return {
        status: "EMERGENCY",
        statusLabelAr: "خارج في ظرف طارئ",
        statusLabelEn: "Emergency Out",
        badgeBg: "bg-rose-50 border-rose-200",
        badgeColor: "text-rose-700",
        lastLog,
        elapsedMinutes,
        elapsedTimeString,
        checkedInTime: checkInLog?.time
      };

    case "BREAK_OUT":
      return {
        status: "ON_BREAK",
        statusLabelAr: "في استراحة عمل",
        statusLabelEn: "On Break",
        badgeBg: "bg-amber-50 border-amber-200",
        badgeColor: "text-amber-700",
        lastLog,
        elapsedMinutes,
        elapsedTimeString,
        checkedInTime: checkInLog?.time
      };

    case "CHECK_OUT":
      return {
        status: "OUT_OF_OFFICE",
        statusLabelAr: "انصرف / خارج الدوام",
        statusLabelEn: "Clocked Out",
        badgeBg: "bg-slate-100 border-slate-300",
        badgeColor: "text-slate-700",
        lastLog,
        elapsedMinutes,
        elapsedTimeString,
        checkedInTime: checkInLog?.time,
        checkedOutTime: checkOutLog?.time
      };

    default:
      return {
        status: "IN_OFFICE",
        statusLabelAr: "متواجد بالمقر",
        statusLabelEn: "In Office",
        badgeBg: "bg-emerald-50 border-emerald-200",
        badgeColor: "text-emerald-700",
        lastLog,
        elapsedMinutes,
        elapsedTimeString
      };
  }
}

/**
 * Validate logical sequence of movements
 */
export function validateMovementLogic(
  currentStatus: EmployeeMovementStatus,
  targetCategory: MovementCategory
): { isAllowed: boolean; warning?: string } {
  // If employee is out of office, only CHECK_IN makes initial sense (others give friendly warning)
  if (currentStatus === "OUT_OF_OFFICE" && targetCategory !== "CHECK_IN") {
    return {
      isAllowed: true,
      warning: "ملاحظة: الموظف لم يسجل حضوراً في بداية اليوم، هل تود متابعة تسجيل هذه الحركة؟"
    };
  }

  // If already on mission and selecting MISSION_OUT
  if (currentStatus === "ON_MISSION" && targetCategory === "MISSION_OUT") {
    return {
      isAllowed: true,
      warning: "تنبيه: الموظف مسجل حالياً في مهمة عمل سابقة."
    };
  }

  // If already on break and selecting BREAK_OUT
  if (currentStatus === "ON_BREAK" && targetCategory === "BREAK_OUT") {
    return {
      isAllowed: true,
      warning: "تنبيه: الموظف مسجل حالياً في استراحة سابقة."
    };
  }

  // If returning from mission when not on mission
  if (targetCategory === "MISSION_IN" && currentStatus !== "ON_MISSION") {
    return {
      isAllowed: true,
      warning: "ملاحظة: الموظف لم يكن مسجلاً في مهمة عمل خارجية."
    };
  }

  // If returning from break when not on break
  if (targetCategory === "BREAK_IN" && currentStatus !== "ON_BREAK") {
    return {
      isAllowed: true,
      warning: "ملاحظة: الموظف لم يكن مسجلاً في استراحة عمل."
    };
  }

  return { isAllowed: true };
}
