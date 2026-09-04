import React, { useState, useMemo } from "react";
import {
  Employee,
  Branch,
  CompanySettings,
  KioskDevice,
  MovementTypeConfig,
  AttendanceMovementLog,
  AttendanceAdjustment,
  EmployeePinRecord,
  EmployeeMovementStatus,
  MovementCategory
} from "../../types";
import {
  calculateEmployeeCurrentStatus,
  EmployeeLiveStatusInfo
} from "../../utils/attendanceStorage";
import {
  setEmployeePin,
  loadEmployeePins,
  saveEmployeePins,
  generateSalt,
  hashPin
} from "../../utils/kioskSecurity";
import {
  Clock,
  Calendar,
  Users,
  Building2,
  Search,
  Filter,
  Tablet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Download,
  Printer,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Car,
  Coffee,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Radio
} from "lucide-react";
import { formatDateToDDMMMMYYYY } from "../../utils/dateFormatter";

export interface EmployeeMovementDashboardProps {
  employees?: Employee[];
  branches?: Branch[];
  companySettings?: CompanySettings;
  kioskDevices?: KioskDevice[];
  devices?: KioskDevice[];
  movementTypes?: MovementTypeConfig[];
  movementLogs?: AttendanceMovementLog[];
  adjustments?: AttendanceAdjustment[];
  activeDeviceId?: string;
  currentUserId?: string;
  userPermissions?: string[];
  onOpenKioskModal?: () => void;
  onSaveKioskDevices?: (devices: KioskDevice[]) => void;
  onSaveDevices?: (devices: KioskDevice[]) => void;
  onSaveMovementTypes?: (types: MovementTypeConfig[]) => void;
  onSaveMovementLogs?: (logs: AttendanceMovementLog[]) => void;
  onSaveAdjustments?: (adjustments: AttendanceAdjustment[]) => void;
  onSelectActiveDevice?: (id: string) => void;
  onAuditLog?: (action: string, module: string, targetId: string, targetName: string, detailsAr: string, detailsEn: string) => void;
}

export const EmployeeMovementDashboard: React.FC<EmployeeMovementDashboardProps> = ({
  employees = [],
  branches = [],
  companySettings = {
    companyNameAr: "ديشال",
    companyNameEn: "Deshal",
    taxNumber: "",
    commercialRegister: "",
    phone: "",
    email: "",
    address: "",
    currency: "OMR",
    fiscalYearStart: "01-01"
  },
  kioskDevices,
  devices,
  movementTypes = [],
  movementLogs = [],
  adjustments = [],
  activeDeviceId,
  currentUserId = "emp-1",
  userPermissions = [],
  onOpenKioskModal = () => {},
  onSaveKioskDevices,
  onSaveDevices,
  onSaveMovementTypes = (_types: MovementTypeConfig[]) => {},
  onSaveMovementLogs = (_logs: AttendanceMovementLog[]) => {},
  onSaveAdjustments = (_adjustments: AttendanceAdjustment[]) => {},
  onSelectActiveDevice,
  onAuditLog
}) => {
  const safeKioskDevices = kioskDevices || devices || [];
  const handleSaveKioskDevices = onSaveKioskDevices || onSaveDevices || (() => {});
  // Navigation Subtabs
  const [activeTab, setActiveTab] = useState<"live_presence" | "movement_logs" | "adjustments" | "devices" | "movement_types" | "pin_mgmt">("live_presence");

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);

  // Privacy: View Attendance Photos (defaults to true if user has permission or admin)
  const canViewPhotos = userPermissions.length === 0 || userPermissions.includes("attendance_photos");
  const [isPhotoPrivacyMasked, setIsPhotoPrivacyMasked] = useState<boolean>(!canViewPhotos);

  // Modal: Add / Edit Kiosk Device
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<KioskDevice | null>(null);
  const [deviceFormData, setDeviceFormData] = useState<{
    deviceCode: string;
    name: string;
    branchId: string;
    location: string;
    model: string;
    notes: string;
  }>({
    deviceCode: "",
    name: "",
    branchId: branches[0]?.id || "",
    location: "",
    model: "Apple iPad 10th Gen",
    notes: ""
  });

  // Modal: Add / Edit Movement Type
  const [isMovementTypeModalOpen, setIsMovementTypeModalOpen] = useState<boolean>(false);
  const [editingMovementType, setEditingMovementType] = useState<MovementTypeConfig | null>(null);
  const [movementTypeFormData, setMovementTypeFormData] = useState<{
    code: string;
    labelAr: string;
    labelEn: string;
    category: MovementCategory;
    iconName: string;
    color: string;
    requiresPhoto: boolean;
    requiresReason: boolean;
    requiresApproval: boolean;
    isActive: boolean;
  }>({
    code: "",
    labelAr: "",
    labelEn: "",
    category: "CUSTOM",
    iconName: "Clock",
    color: "#6366f1",
    requiresPhoto: true,
    requiresReason: false,
    requiresApproval: false,
    isActive: true
  });

  // Modal: Request Attendance Adjustment
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjustmentTargetLog, setAdjustmentTargetLog] = useState<AttendanceMovementLog | null>(null);
  const [adjustmentFormData, setAdjustmentFormData] = useState<{
    employeeId: string;
    date: string;
    newMovementType: string;
    newTime: string;
    reason: string;
  }>({
    employeeId: employees[0]?.id || "",
    date: new Date().toISOString().split("T")[0],
    newMovementType: "تسجيل حضور (بداية الدوام)",
    newTime: "08:00",
    reason: ""
  });

  // Modal: PIN Management
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [targetPinEmployee, setTargetPinEmployee] = useState<Employee | null>(null);
  const [newPinValue, setNewPinValue] = useState<string>("");
  const [pinSuccessMessage, setPinSuccessMessage] = useState<string>("");
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Calculate live statuses for all employees
  const employeesWithLiveStatus = useMemo(() => {
    return employees.map((emp) => {
      const statusInfo = calculateEmployeeCurrentStatus(emp.id, movementLogs, dateFilter);
      return {
        ...emp,
        liveStatusInfo: statusInfo
      };
    });
  }, [employees, movementLogs, dateFilter]);

  // Aggregate Status Counts for today
  const statusCounts = useMemo(() => {
    let inOffice = 0;
    let onMission = 0;
    let onBreak = 0;
    let emergency = 0;
    let outOfOffice = 0;

    employeesWithLiveStatus.forEach((e) => {
      if (e.status === "INACTIVE" || e.status === "SUSPENDED") return;
      switch (e.liveStatusInfo.status) {
        case "IN_OFFICE":
          inOffice++;
          break;
        case "ON_MISSION":
          onMission++;
          break;
        case "ON_BREAK":
          onBreak++;
          break;
        case "EMERGENCY":
          emergency++;
          break;
        case "OUT_OF_OFFICE":
        default:
          outOfOffice++;
          break;
      }
    });

    return { inOffice, onMission, onBreak, emergency, outOfOffice, total: employees.length };
  }, [employeesWithLiveStatus, employees.length]);

  // Filtered employees for live presence
  const filteredEmployees = useMemo(() => {
    return employeesWithLiveStatus.filter((emp) => {
      if (selectedBranch !== "ALL" && emp.branchId !== selectedBranch) return false;
      if (selectedDepartment !== "ALL" && emp.department !== selectedDepartment) return false;
      if (selectedStatusFilter !== "ALL" && emp.liveStatusInfo.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.fullName.toLowerCase().includes(q) || (emp.fullNameEn && emp.fullNameEn.toLowerCase().includes(q));
        const matchCode = emp.employeeCode.toLowerCase().includes(q);
        const matchJob = emp.jobTitle.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchJob) return false;
      }
      return true;
    });
  }, [employeesWithLiveStatus, selectedBranch, selectedDepartment, selectedStatusFilter, searchQuery]);

  // Filtered Movement Logs
  const filteredLogs = useMemo(() => {
    return movementLogs
      .filter((log) => {
        if (dateFilter && log.date !== dateFilter) return false;
        if (selectedBranch !== "ALL" && log.branchId !== selectedBranch) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = log.employeeName.toLowerCase().includes(q);
          const matchCode = log.employeeCode.toLowerCase().includes(q);
          const matchDevice = log.deviceName.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchDevice) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [movementLogs, dateFilter, selectedBranch, searchQuery]);

  // Handle Save Device
  const handleSaveDevice = () => {
    if (!deviceFormData.deviceCode.trim() || !deviceFormData.name.trim()) return;

    const branch = branches.find((b) => b.id === deviceFormData.branchId);
    const branchName = branch ? branch.name : "المقر العام";

    if (editingDevice) {
      const updated = safeKioskDevices.map((d) =>
        d.id === editingDevice.id
          ? {
              ...d,
              deviceCode: deviceFormData.deviceCode,
              name: deviceFormData.name,
              branchId: deviceFormData.branchId,
              branchName,
              location: deviceFormData.location,
              model: deviceFormData.model,
              notes: deviceFormData.notes,
              updatedAt: new Date().toISOString()
            }
          : d
      );
      handleSaveKioskDevices(updated);
      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "ATTENDANCE_KIOSK",
          editingDevice.id,
          deviceFormData.name,
          `تحديث بيانات جهاز الكشك: ${deviceFormData.name}`,
          `Updated kiosk device: ${deviceFormData.name}`
        );
      }
    } else {
      const newDev: KioskDevice = {
        id: `dev-${Date.now()}`,
        deviceCode: deviceFormData.deviceCode,
        name: deviceFormData.name,
        branchId: deviceFormData.branchId,
        branchName,
        location: deviceFormData.location,
        deviceToken: `dsh_tok_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
        status: "ACTIVE",
        lastPing: new Date().toISOString(),
        model: deviceFormData.model,
        appVersion: "Deshal Kiosk v3.4",
        isLocked: false,
        notes: deviceFormData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      handleSaveKioskDevices([...safeKioskDevices, newDev]);
      if (onAuditLog) {
        onAuditLog(
          "DEVICE_ENROLL",
          "ATTENDANCE_KIOSK",
          newDev.id,
          newDev.name,
          `تسجيل وربط جهاز كشك جديد: ${newDev.name} (${newDev.deviceCode})`,
          `Enrolled new kiosk device: ${newDev.name} (${newDev.deviceCode})`
        );
      }
    }

    setIsDeviceModalOpen(false);
    setEditingDevice(null);
  };

  // Toggle Remote Lock on Device
  const handleToggleDeviceStatus = (device: KioskDevice) => {
    const newStatus = device.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const updated = safeKioskDevices.map((d) =>
      d.id === device.id ? { ...d, status: newStatus, isLocked: newStatus === "SUSPENDED", updatedAt: new Date().toISOString() } : d
    );
    handleSaveKioskDevices(updated);

    if (onAuditLog) {
      onAuditLog(
        "STATUS_CHANGE",
        "ATTENDANCE_KIOSK",
        device.id,
        device.name,
        `تغيير حالة جهاز الكشك ${device.name} إلى ${newStatus === "ACTIVE" ? "مفعل" : "معلق عن بعد"}`,
        `Changed kiosk device ${device.name} status to ${newStatus}`
      );
    }
  };

  // Regenerate Device Token
  const handleRegenerateToken = (device: KioskDevice) => {
    const newToken = `dsh_tok_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const updated = safeKioskDevices.map((d) =>
      d.id === device.id ? { ...d, deviceToken: newToken, updatedAt: new Date().toISOString() } : d
    );
    handleSaveKioskDevices(updated);
    if (onAuditLog) {
      onAuditLog(
        "UPDATE",
        "ATTENDANCE_KIOSK",
        device.id,
        device.name,
        `تجديد التوكن الأمني لجهاز الكشك: ${device.name}`,
        `Regenerated security token for kiosk: ${device.name}`
      );
    }
  };

  // Handle Save PIN
  const handleSavePin = async () => {
    if (!targetPinEmployee || newPinValue.length !== 4) return;

    await setEmployeePin(
      targetPinEmployee.id,
      targetPinEmployee.employeeCode,
      targetPinEmployee.fullName,
      newPinValue,
      currentUserId
    );

    setPinSuccessMessage(`تم تعيين وتشفير رمز الـPIN الجديد للموظف (${targetPinEmployee.fullName}) بنجاح!`);
    if (onAuditLog) {
      onAuditLog(
        "PIN_CHANGE",
        "ATTENDANCE_KIOSK",
        targetPinEmployee.id,
        targetPinEmployee.fullName,
        `تغيير وتشفير رمز PIN للموظف ${targetPinEmployee.fullName}`,
        `Changed and hashed PIN for employee ${targetPinEmployee.fullName}`
      );
    }

    setTimeout(() => {
      setIsPinModalOpen(false);
      setTargetPinEmployee(null);
      setNewPinValue("");
      setPinSuccessMessage("");
    }, 1500);
  };

  // Handle Save Movement Adjustment Request
  const handleSaveAdjustment = () => {
    if (!adjustmentFormData.reason.trim()) return;

    const emp = employees.find((e) => e.id === adjustmentFormData.employeeId);
    if (!emp) return;

    const newAdj: AttendanceAdjustment = {
      id: `adj-${Date.now()}`,
      logId: adjustmentTargetLog?.id,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      date: adjustmentFormData.date,
      originalMovementType: adjustmentTargetLog?.movementTypeNameAr || "غير مسجل",
      newMovementType: adjustmentFormData.newMovementType,
      originalTime: adjustmentTargetLog?.time || "--:--",
      newTime: adjustmentFormData.newTime,
      reason: adjustmentFormData.reason.trim(),
      requestedBy: "مدير النظام",
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    onSaveAdjustments([newAdj, ...adjustments]);
    if (onAuditLog) {
      onAuditLog(
        "ATTENDANCE_ADJUST",
        "ATTENDANCE_KIOSK",
        newAdj.id,
        emp.fullName,
        `تقديم طلب تصحيح حضور للموظف ${emp.fullName} بتاريخ ${adjustmentFormData.date}`,
        `Submitted attendance adjustment request for ${emp.fullName}`
      );
    }

    setIsAdjustmentModalOpen(false);
    setAdjustmentTargetLog(null);
    setAdjustmentFormData({
      employeeId: employees[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      newMovementType: "تسجيل حضور (بداية الدوام)",
      newTime: "08:00",
      reason: ""
    });
  };

  // Approve / Reject Adjustment
  const handleReviewAdjustment = (adjustment: AttendanceAdjustment, status: "APPROVED" | "REJECTED") => {
    const updated = adjustments.map((adj) =>
      adj.id === adjustment.id
        ? {
            ...adj,
            status,
            approvedBy: "مدير النظام",
            reviewedAt: new Date().toISOString(),
            reviewNotes: status === "APPROVED" ? "تم الاعتماد والتعديل في السجل الرسمي" : "تم رفض الطلب لعدم كفاية المبررات"
          }
        : adj
    );
    onSaveAdjustments(updated);

    if (onAuditLog) {
      onAuditLog(
        "UPDATE",
        "ATTENDANCE_KIOSK",
        adjustment.id,
        adjustment.employeeName,
        `اعتماد طلب تعديل الحضور (${status === "APPROVED" ? "موافقة" : "رفض"}) للموظف ${adjustment.employeeName}`,
        `Reviewed attendance adjustment (${status}) for ${adjustment.employeeName}`
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Top Banner: Real-time Metric Cards & Launch Kiosk Button */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              الجيل الثالث (v3.4)
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              تحديث لحظي
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">
            نظام الحضور والانصراف وحركة الموظفين (Attendance Kiosk)
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            منظومة متكاملة لإدارة دوام وحركة الموظفين عبر أجهزة iPad والتابلت اللوحية، بالتحقق عبر الـ PIN المشفر، التصوير التلقائي الموثق، وتتبع المهام الخارجية والاستراحات.
          </p>
        </div>

        {/* Big Launch Tablet Kiosk Button */}
        <button
          onClick={onOpenKioskModal}
          className="group px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-3 shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Tablet className="w-6 h-6 text-slate-950" />
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800">وضع التابلت اللوحي</div>
            <div className="text-base font-extrabold">فتح كشك الحضور (Kiosk)</div>
          </div>
        </button>
      </div>

      {/* Live Presence Statistics Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* In Office */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{statusCounts.inOffice}</div>
            <div className="text-xs font-bold text-slate-600">داخل مقر العمل</div>
            <div className="text-[10px] text-slate-400">على رأس العمل الآن</div>
          </div>
        </div>

        {/* On Business Mission */}
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-700">{statusCounts.onMission}</div>
            <div className="text-xs font-bold text-slate-600">في مهمة خارجية</div>
            <div className="text-[10px] text-slate-400">اجتماعات وزيارات ميدانية</div>
          </div>
        </div>

        {/* On Break */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{statusCounts.onBreak}</div>
            <div className="text-xs font-bold text-slate-600">في استراحة عمل</div>
            <div className="text-[10px] text-slate-400">استراحة أو غداء</div>
          </div>
        </div>

        {/* Emergency */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700">{statusCounts.emergency}</div>
            <div className="text-xs font-bold text-slate-600">ظرف طارئ</div>
            <div className="text-[10px] text-slate-400">إشعار طوارئ معتمد</div>
          </div>
        </div>

        {/* Out of Office */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-700">{statusCounts.outOfOffice}</div>
            <div className="text-xs font-bold text-slate-600">انصرف / لم يحضر</div>
            <div className="text-[10px] text-slate-400">خارج أوقات الدوام</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("live_presence")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === "live_presence"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            التواجد اللحظي للموظفين ({filteredEmployees.length})
          </button>

          <button
            onClick={() => setActiveTab("movement_logs")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === "movement_logs"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Clock className="w-4 h-4 text-blue-400" />
            سجل الحركات اليومي ({filteredLogs.length})
          </button>

          <button
            onClick={() => setActiveTab("adjustments")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === "adjustments"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Edit2 className="w-4 h-4 text-amber-400" />
            طلبات تصحيح السجلات ({adjustments.filter((a) => a.status === "PENDING").length} معلقة)
          </button>

          <button
            onClick={() => setActiveTab("devices")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === "devices"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Tablet className="w-4 h-4 text-indigo-400" />
            أجهزة الكشك اللوحية ({safeKioskDevices.length})
          </button>

          <button
            onClick={() => setActiveTab("movement_types")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === "movement_types"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            أنواع الحركات والسياسات
          </button>
        </div>

        {/* Global Photo Privacy Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPhotoPrivacyMasked(!isPhotoPrivacyMasked)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              isPhotoPrivacyMasked
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}
            title="حماية خصوصية صور الموظفين الملتقطة بالكشك"
          >
            {isPhotoPrivacyMasked ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
            {isPhotoPrivacyMasked ? "حماية الخصوصية مفعلة (تمويه الصور)" : "عرض الصور كاملة"}
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Branch, Department, Date, Search) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الرقم الوظيفي..."
              className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Branch Select */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">جميع الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {activeTab === "devices" && (
            <button
              onClick={() => {
                setEditingDevice(null);
                setDeviceFormData({
                  deviceCode: `KIOSK-${branches[0]?.code || "SOH"}-${safeKioskDevices.length + 1}`,
                  name: `تابلت جديد - ${branches[0]?.name || ""}`,
                  branchId: branches[0]?.id || "",
                  location: "مدخل الاستقبال",
                  model: "Apple iPad 10th Gen",
                  notes: ""
                });
                setIsDeviceModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              تسجيل جهاز كشك جديد
            </button>
          )}

          {activeTab === "adjustments" && (
            <button
              onClick={() => {
                setAdjustmentTargetLog(null);
                setAdjustmentFormData({
                  employeeId: employees[0]?.id || "",
                  date: new Date().toISOString().split("T")[0],
                  newMovementType: "تسجيل حضور (بداية الدوام)",
                  newTime: "08:00",
                  reason: ""
                });
                setIsAdjustmentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              طلب تصحيح حركة حضور
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE PRESENCE OVERVIEW (لوحة التواجد اللحظي للموظفين) */}
      {/* ========================================================================= */}
      {activeTab === "live_presence" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const info = emp.liveStatusInfo;
            const isOnlineNow = info.status === "IN_OFFICE";
            const isOnMission = info.status === "ON_MISSION";
            const isOnBreak = info.status === "ON_BREAK";
            const isEmergency = info.status === "EMERGENCY";

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                {/* Top Status Stripe */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1.5 ${
                    isOnlineNow
                      ? "bg-emerald-500"
                      : isOnMission
                      ? "bg-blue-500"
                      : isOnBreak
                      ? "bg-amber-500"
                      : isEmergency
                      ? "bg-rose-500"
                      : "bg-slate-300"
                  }`}
                />

                <div>
                  {/* Header: Photo + Info + Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.fullName}
                          className={`w-14 h-14 rounded-2xl object-cover border-2 ${
                            isPhotoPrivacyMasked ? "blur-[2px]" : ""
                          } ${
                            isOnlineNow
                              ? "border-emerald-400"
                              : isOnMission
                              ? "border-blue-400"
                              : "border-slate-200"
                          }`}
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            isOnlineNow
                              ? "bg-emerald-500 animate-pulse"
                              : isOnMission
                              ? "bg-blue-500"
                              : isOnBreak
                              ? "bg-amber-500"
                              : isEmergency
                              ? "bg-rose-500"
                              : "bg-slate-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{emp.fullName}</h4>
                        <div className="text-xs text-slate-500 font-mono">{emp.employeeCode}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{emp.jobTitle}</div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${info.badgeBg} ${info.badgeColor}`}
                    >
                      {info.statusLabelAr}
                    </span>
                  </div>

                  {/* Movement Details */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>الفرع والقسم:</span>
                      <span className="font-semibold text-slate-800">{emp.branchName} - {emp.department}</span>
                    </div>

                    {info.checkedInTime && (
                      <div className="flex justify-between text-slate-600">
                        <span>وقت الحضور اليوم:</span>
                        <span className="font-mono font-bold text-emerald-700">{info.checkedInTime}</span>
                      </div>
                    )}

                    {info.lastLog && (
                      <div className="flex justify-between text-slate-600">
                        <span>آخر حركة مسجلة:</span>
                        <span className="font-semibold text-slate-800">
                          {info.lastLog.movementTypeNameAr} ({info.lastLog.time})
                        </span>
                      </div>
                    )}

                    {(isOnMission || isOnBreak || isEmergency) && info.elapsedTimeString && (
                      <div className="flex justify-between font-bold text-amber-700 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60">
                        <span>المدة المنقضية بالخارج:</span>
                        <span className="font-mono">{info.elapsedTimeString}</span>
                      </div>
                    )}

                    {info.lastLog?.reason && (
                      <div className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200">
                        "{info.lastLog.reason}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Manage PIN & Request Adjustment */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      setTargetPinEmployee(emp);
                      setNewPinValue("");
                      setPinSuccessMessage("");
                      setIsPinModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                    إدارة PIN الكشك
                  </button>

                  <button
                    onClick={() => {
                      setAdjustmentTargetLog(info.lastLog || null);
                      setAdjustmentFormData({
                        employeeId: emp.id,
                        date: dateFilter,
                        newMovementType: "تسجيل حضور (بداية الدوام)",
                        newTime: info.lastLog?.time || "08:00",
                        reason: ""
                      });
                      setIsAdjustmentModalOpen(true);
                    }}
                    className="text-slate-600 hover:text-amber-600 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    تصحيح حركة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MOVEMENT LOGS FEED (سجل الحركات اللحظية مع الصور) */}
      {/* ========================================================================= */}
      {activeTab === "movement_logs" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              سجل حركات اليوم ({filteredLogs.length} حركة مسجلة)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              تاريخ السجل: {formatDateToDDMMMMYYYY(dateFilter)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">صورة التحقق</th>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">نوع الحركة</th>
                  <th className="p-3.5">الوقت</th>
                  <th className="p-3.5">الجهاز والموقع</th>
                  <th className="p-3.5">حالة المزامنة</th>
                  <th className="p-3.5">ملاحظات / السبب</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      لا توجد حركات مسجلة في هذا التاريخ المحدد.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isCheckIn = log.movementCategory === "CHECK_IN";
                    const isCheckOut = log.movementCategory === "CHECK_OUT";
                    const isMission = log.movementCategory === "MISSION_OUT" || log.movementCategory === "MISSION_IN";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Snapshot Photo with Privacy Mask */}
                        <td className="p-3.5">
                          <div className="relative group w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={log.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                              alt={log.employeeName}
                              className={`w-full h-full object-cover transition-all ${
                                isPhotoPrivacyMasked ? "blur-sm" : ""
                              }`}
                            />
                          </div>
                        </td>

                        {/* Employee */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{log.employeeName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{log.employeeCode} | {log.jobTitle}</div>
                        </td>

                        {/* Movement Type */}
                        <td className="p-3.5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                              isCheckIn
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isCheckOut
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : isMission
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {isCheckIn && <LogIn className="w-3.5 h-3.5" />}
                            {isCheckOut && <LogOut className="w-3.5 h-3.5" />}
                            {isMission && <Car className="w-3.5 h-3.5" />}
                            {log.movementTypeNameAr}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {log.time}
                        </td>

                        {/* Device & Branch */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-700">{log.deviceName}</div>
                          <div className="text-[11px] text-slate-400">{log.branchName} ({log.location})</div>
                        </td>

                        {/* Sync Status */}
                        <td className="p-3.5">
                          {log.syncStatus === "SYNCED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              متزامن لحظياً
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                              تخزين محلي مؤقت
                            </span>
                          )}
                        </td>

                        {/* Notes / Reason */}
                        <td className="p-3.5 text-slate-600 max-w-xs">
                          {log.reason ? (
                            <span className="italic text-slate-700">"{log.reason}"</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setAdjustmentTargetLog(log);
                              setAdjustmentFormData({
                                employeeId: log.employeeId,
                                date: log.date,
                                newMovementType: log.movementTypeNameAr,
                                newTime: log.time,
                                reason: ""
                              });
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="طلب تصحيح أو تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ATTENDANCE ADJUSTMENTS (طلبات تصحيح السجلات والاعتماد) */}
      {/* ========================================================================= */}
      {activeTab === "adjustments" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                سجل طلبات تصحيح وتعديل الحركات (Attendance Adjustments)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تُحفظ كافة التعديلات بسجل تدقيقي منفصل لضمان الحوكمة وعدم حذف التاريخ الأصلي
              </p>
            </div>
            <button
              onClick={() => {
                setAdjustmentTargetLog(null);
                setAdjustmentFormData({
                  employeeId: employees[0]?.id || "",
                  date: new Date().toISOString().split("T")[0],
                  newMovementType: "تسجيل حضور (بداية الدوام)",
                  newTime: "08:00",
                  reason: ""
                });
                setIsAdjustmentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              طلب تصحيح جديد
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">القيمة السابقة</th>
                  <th className="p-3.5">القيمة المصححة المطلوبة</th>
                  <th className="p-3.5">سبب التصحيح</th>
                  <th className="p-3.5">مقدم الطلب</th>
                  <th className="p-3.5">حالة الاعتماد</th>
                  <th className="p-3.5 text-center">إجراء المراجعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      لا توجد طلبات تصحيح مسجلة حالياً.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{adj.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{adj.employeeCode}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{adj.date}</td>
                      <td className="p-3.5 text-slate-500">
                        <div>{adj.originalMovementType || "غير محدد"}</div>
                        <div className="font-mono text-[11px]">({adj.originalTime || "--:--"})</div>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700">
                        <div>{adj.newMovementType}</div>
                        <div className="font-mono text-xs">({adj.newTime})</div>
                      </td>
                      <td className="p-3.5 text-slate-700 max-w-xs">{adj.reason}</td>
                      <td className="p-3.5 text-slate-600">{adj.requestedBy}</td>
                      <td className="p-3.5">
                        {adj.status === "APPROVED" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            معتمد
                          </span>
                        )}
                        {adj.status === "REJECTED" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            مرفوض
                          </span>
                        )}
                        {adj.status === "PENDING" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            بانتظار الاعتماد
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {adj.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleReviewAdjustment(adj, "APPROVED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm"
                            >
                              موافقة
                            </button>
                            <button
                              onClick={() => handleReviewAdjustment(adj, "REJECTED")}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px]"
                            >
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {adj.approvedBy ? `بواسطة: ${adj.approvedBy}` : "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KIOSK DEVICES MANAGER (إدارة الأجهزة اللوحية وتأمينها) */}
      {/* ========================================================================= */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {safeKioskDevices.map((dev) => {
            const isActive = dev.status === "ACTIVE";
            const isCopied = copiedTokenId === dev.id;

            return (
              <div
                key={dev.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                  isActive ? "border-slate-200" : "border-rose-200 bg-rose-50/20"
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          isActive ? "bg-indigo-50 text-indigo-600" : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        <Tablet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{dev.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">{dev.deviceCode}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {isActive ? "نشط ومفعل" : "معلق عن بعد"}
                    </span>
                  </div>

                  {/* Device Specs */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-2 mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>الفرع:</span>
                      <span className="font-semibold text-slate-800">{dev.branchName}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>الموقع الدقيق:</span>
                      <span className="font-semibold text-slate-800">{dev.location}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>نوع الجهاز:</span>
                      <span className="font-semibold text-slate-800">{dev.model}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>عنوان IP:</span>
                      <span className="font-mono text-slate-700">{dev.ipAddress || "192.168.1.10"}</span>
                    </div>
                  </div>

                  {/* Device Token */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      التوكن الأمني المشفر (Device Token):
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                      <span className="truncate flex-1">{dev.deviceToken}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(dev.deviceToken);
                          setCopiedTokenId(dev.id);
                          setTimeout(() => setCopiedTokenId(null), 2000);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-indigo-600"
                        title="نسخ التوكن"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleToggleDeviceStatus(dev)}
                    className={`font-bold flex items-center gap-1 transition-colors ${
                      isActive ? "text-rose-600 hover:text-rose-800" : "text-emerald-600 hover:text-emerald-800"
                    }`}
                  >
                    {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {isActive ? "قفل الجهاز عن بعد" : "تفعيل الجهاز"}
                  </button>

                  <button
                    onClick={() => handleRegenerateToken(dev)}
                    className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                    title="إعادة توليد التوكن"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    تجديد التوكن
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MOVEMENT TYPES CONFIGURATOR (إدارة وتخصيص أنواع الحركات) */}
      {/* ========================================================================= */}
      {activeTab === "movement_types" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                أنواع الحركات الإدارية وسياسات الكشك
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تخصيص الخيارات المتاحة للموظفين على شاشة الكشك مع قواعد طلب الصور وتفاصيل الأسباب
              </p>
            </div>

            <button
              onClick={() => {
                setEditingMovementType(null);
                setMovementTypeFormData({
                  code: `CUSTOM_${Date.now()}`,
                  labelAr: "حركة مخصصة جديدة",
                  labelEn: "Custom Movement",
                  category: "CUSTOM",
                  iconName: "Clock",
                  color: "#8b5cf6",
                  requiresPhoto: true,
                  requiresReason: false,
                  requiresApproval: false,
                  isActive: true
                });
                setIsMovementTypeModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              إضافة نوع حركة جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {movementTypes.map((type) => (
              <div
                key={type.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                      style={{ backgroundColor: type.color }}
                    >
                      <Clock className="w-5 h-5" />
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        type.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {type.isActive ? "مفعل بالكشك" : "معطل"}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">{type.labelAr}</h4>
                  <div className="text-xs text-slate-400 font-mono mb-3">{type.labelEn}</div>

                  <div className="space-y-1 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>التقاط صورة إلزامي:</span>
                      <span className={type.requiresPhoto ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {type.requiresPhoto ? "نعم" : "اختياري"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>كتابة سبب الخروج:</span>
                      <span className={type.requiresReason ? "text-amber-600 font-bold" : "text-slate-400"}>
                        {type.requiresReason ? "مطلوب" : "لا"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/80 text-xs">
                  <button
                    onClick={() => {
                      const updated = movementTypes.map((m) =>
                        m.id === type.id ? { ...m, isActive: !m.isActive } : m
                      );
                      onSaveMovementTypes(updated);
                    }}
                    className="text-slate-600 hover:text-indigo-600 font-bold"
                  >
                    {type.isActive ? "تعطيل الخيار" : "تفعيل الخيار"}
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">{type.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SET / RESET EMPLOYEE PIN (تعيين وتشفير PIN الموظف) */}
      {/* ========================================================================= */}
      {isPinModalOpen && targetPinEmployee && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-right animate-scaleUp">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">تعيين رمز PIN للكشك</h3>
                  <p className="text-xs text-slate-500">للموظف: {targetPinEmployee.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {pinSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {pinSuccessMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    معايير الأمان والتشفير:
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px]">
                    <li>رمز PIN يتكون من 4 أرقام سرية للموظف.</li>
                    <li>يتم حفظ الرمز كـ Salted Hash (SHA-256) لمنع استرجاع النص الصريح.</li>
                    <li>يتم إلغاء قفل الحساب تلقائياً عند حفظ الرمز الجديد.</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    أدخل رمز PIN الجديد (4 أرقام):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={newPinValue}
                      onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                        setNewPinValue(randomPin);
                      }}
                      className="px-3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0"
                    >
                      توليد عشوائي
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={newPinValue.length !== 4}
                    onClick={handleSavePin}
                    className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    حفظ وتشفير الـ PIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REQUEST ATTENDANCE ADJUSTMENT (طلب تصحيح حركة) */}
      {/* ========================================================================= */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-right animate-scaleUp">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">طلب تصحيح / تعديل حركة حضور</h3>
                  <p className="text-xs text-slate-500">يخضع لموافقة واعتماد إدارة الموارد البشرية</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Employee */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف المعني:</label>
                <select
                  value={adjustmentFormData.employeeId}
                  onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, employeeId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode}) - {e.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={adjustmentFormData.date}
                    onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الوقت المصحح الفعلي:</label>
                  <input
                    type="time"
                    value={adjustmentFormData.newTime}
                    onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, newTime: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Movement Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الحركة المصححة:</label>
                <select
                  value={adjustmentFormData.newMovementType}
                  onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, newMovementType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {movementTypes.map((m) => (
                    <option key={m.id} value={m.labelAr}>
                      {m.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  سبب وتبرير طلب التصحيح (مطلوب):
                </label>
                <textarea
                  rows={3}
                  value={adjustmentFormData.reason}
                  onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, reason: e.target.value })}
                  placeholder="مثال: نسيت تسجيل البصمة بالكشك بسبب تسليم شحنة فور وصولي للمستودع..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!adjustmentFormData.reason.trim()}
                  onClick={handleSaveAdjustment}
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold shadow"
                >
                  إرسال الطلب للاعتماد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT KIOSK DEVICE (تسجيل جهاز كشك لوحي جديد) */}
      {/* ========================================================================= */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-right animate-scaleUp">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Tablet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDevice ? "تعديل جهاز الكشك" : "تسجيل جهاز كشك لوحي جديد"}
                  </h3>
                  <p className="text-xs text-slate-500">ربط جهاز iPad أو Android Tablet بالنظام</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الجهاز:</label>
                <input
                  type="text"
                  value={deviceFormData.name}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, name: e.target.value })}
                  placeholder="مثال: آيباد الاستقبال - صحار"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الجهاز:</label>
                  <input
                    type="text"
                    value={deviceFormData.deviceCode}
                    onChange={(e) => setDeviceFormData({ ...deviceFormData, deviceCode: e.target.value })}
                    placeholder="KIOSK-01"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفرع التابع له:</label>
                  <select
                    value={deviceFormData.branchId}
                    onChange={(e) => setDeviceFormData({ ...deviceFormData, branchId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الموقع المحدد (داخل المقر):</label>
                <input
                  type="text"
                  value={deviceFormData.location}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, location: e.target.value })}
                  placeholder="مثال: مدخل الاستقبال الرئيسي، بوابة المستودع A"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">موديل ونوع الجهاز:</label>
                <input
                  type="text"
                  value={deviceFormData.model}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, model: e.target.value })}
                  placeholder="Apple iPad Pro 11 / Samsung Tab"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!deviceFormData.name.trim() || !deviceFormData.deviceCode.trim()}
                  onClick={handleSaveDevice}
                  className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow"
                >
                  حفظ وتسجيل الجهاز
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
