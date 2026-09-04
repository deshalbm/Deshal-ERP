import React, { useState, useMemo } from "react";
import {
  Employee,
  EmployeeRole,
  EmployeeStatus,
  EmployeePermission,
  Branch,
  CompanySettings,
  ContractType,
  AttendanceRecord,
  AttendanceStatus,
  PayrollSlip,
  PayrollStatus,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  ReceiptVoucher,
  PaymentMethod,
  LineItem,
  KioskDevice,
  MovementTypeConfig,
  AttendanceMovementLog,
  AttendanceAdjustment,
  EmployeePinRecord
} from "../types";
import {
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSION_CONFIG
} from "../utils/storage";
import {
  loadMovementTypes,
  saveMovementTypes,
  loadKioskDevices,
  saveKioskDevices,
  loadAttendanceMovementLogs,
  saveAttendanceMovementLogs,
  loadAttendanceAdjustments,
  saveAttendanceAdjustments,
  loadActiveKioskDeviceId,
  saveActiveKioskDeviceId
} from "../utils/attendanceStorage";
import { useERPData } from "../contexts/ERPDataContext";
import { ensureValidUuid } from "../utils/uuid";
import {
  loadEmployeePins,
  setEmployeePin,
  unlockEmployeePin
} from "../utils/kioskSecurity";
import { syncUserAccountFromEmployee } from "../utils/authManager";
import { sendWelcomeCredentialsEmail } from "../lib/email/resendService";
import * as hrSvc from "../lib/supabase/hrService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { enqueueOfflineMutation } from "../lib/supabase/syncService";
import { EmployeeMovementDashboard } from "./kiosk/EmployeeMovementDashboard";
import { AttendanceKioskModal } from "./kiosk/AttendanceKioskModal";
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Check,
  X,
  Copy,
  DollarSign,
  Briefcase,
  Layers,
  Lock,
  Unlock,
  Key,
  FileText,
  Printer,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  FileSignature,
  Send,
  Plus,
  CalendarDays,
  FileSpreadsheet,
  Banknote,
  TrendingUp,
  LogIn,
  LogOut,
  Filter,
  CheckCheck,
  Receipt,
  Eye,
  EyeOff,
  Sliders,
  Coins,
  Wallet,
  AlertTriangle,
  Tablet,
  RefreshCw,
  Hash
} from "lucide-react";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import { OfficialPayslipModal } from "./OfficialPayslipModal";
import { IndividualSalaryDisbursementModal } from "./IndividualSalaryDisbursementModal";
import { InstantBonusModal } from "./InstantBonusModal";
import { RequestsDashboard } from "./requests/RequestsDashboard";
import { numberToWords } from "../utils/numberToWords";
import {
  loadEmploymentContracts,
  saveEmploymentContracts,
  loadPerformanceReviews,
  savePerformanceReviews,
  loadPerformanceGoals,
  savePerformanceGoals,
  loadEmployeeKPIs,
  saveEmployeeKPIs,
  loadTrainingCourses,
  saveTrainingCourses,
  loadEmployeeTrainingRecords,
  saveEmployeeTrainingRecords,
  loadEmployeeCertificates,
  saveEmployeeCertificates,
  loadDisciplinaryActions,
  saveDisciplinaryActions,
  loadEmployeeRecognitions,
  saveEmployeeRecognitions,
  loadEmployeeCareerHistories,
  saveEmployeeCareerHistories,
  loadEmployeeDocuments,
  saveEmployeeDocuments,
  loadEmployeeGreetings,
  saveEmployeeGreetings
} from "../utils/hrStorage";
import {
  EmploymentContract,
  PerformanceReview,
  PerformanceGoal,
  EmployeeKPI,
  TrainingCourse,
  EmployeeTrainingRecord,
  EmployeeCertificate,
  DisciplinaryAction,
  EmployeeRecognition,
  EmployeeCareerHistory,
  EmployeeDocumentRecord,
  EmployeeEventGreeting
} from "../types/hr";
import { EmploymentContractsManager } from "./hr/EmploymentContractsManager";
import { PerformanceManager } from "./hr/PerformanceManager";
import { TrainingManager } from "./hr/TrainingManager";
import { DisciplinaryManager } from "./hr/DisciplinaryManager";
import { RecognitionManager } from "./hr/RecognitionManager";
import { CareerHistoryManager } from "./hr/CareerHistoryManager";
import { EmployeeDocumentsManager } from "./hr/EmployeeDocumentsManager";
import { EmployeeEventsCenter } from "./hr/EmployeeEventsCenter";
import { Employee360Modal } from "./hr/Employee360Modal";

export interface EmployeesManagerProps {
  employees: Employee[];
  branches?: Branch[];
  companySettings: CompanySettings;
  activeEmployeeId?: string;
  attendanceRecords?: AttendanceRecord[];
  payrollSlips?: PayrollSlip[];
  leaveRequests?: LeaveRequest[];
  vouchers?: ReceiptVoucher[];
  onSaveEmployees: (employees: Employee[]) => void;
  onSaveAttendance?: (records: AttendanceRecord[]) => void;
  onSavePayrollSlips?: (slips: PayrollSlip[]) => void;
  onSaveLeaveRequests?: (requests: LeaveRequest[]) => void;
  onSelectActiveEmployee?: (id: string) => void;
  onSaveVouchers?: (vouchers: ReceiptVoucher[]) => void;
  onViewVoucher?: (voucher: ReceiptVoucher) => void;
  onAuditLog?: (action: string, module: string, targetId: string, targetName: string, detailsAr: string, detailsEn: string) => void;
}

const ROLE_LABELS: Record<EmployeeRole, { ar: string; en: string; color: string; bg: string }> = {
  ADMIN: { ar: "مدير عام / مسؤول النظام", en: "System Administrator", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  MANAGER: { ar: "مدير فرع / تنفيذي", en: "Branch Manager", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  ACCOUNTANT: { ar: "محاسب مالي معتمد", en: "Senior Accountant", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  SALES: { ar: "مسؤول مبيعات ومشاريع", en: "Sales Executive", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  STOREKEEPER: { ar: "أمين مستودعات ومخازن", en: "Storekeeper / Inventory", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  RECEPTIONIST: { ar: "استقبال وخدمة عملاء", en: "Customer Service", color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
  COLLABORATOR: { ar: "متعاون خارجي / مستشار", en: "External Collaborator", color: "text-blue-800", bg: "bg-blue-50 border-blue-300" },
  AUDITOR: { ar: "مراقب / مدقق حسابات", en: "Financial Auditor", color: "text-amber-800", bg: "bg-amber-50 border-amber-300" },
  CUSTOM: { ar: "صلاحيات مخصصة", en: "Custom Permissions", color: "text-slate-700", bg: "bg-slate-100 border-slate-300" }
};

const STATUS_LABELS: Record<EmployeeStatus, { ar: string; color: string; bg: string; icon: any }> = {
  ACTIVE: { ar: "على رأس العمل (نشط)", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  ON_LEAVE: { ar: "في إجازة رسمية", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock },
  INACTIVE: { ar: "غير نشط", color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: XCircle },
  SUSPENDED: { ar: "موقوف مؤقتاً", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: AlertCircle }
};

const DEPARTMENTS = [
  "الإدارة العليا",
  "المالية والمحاسبة",
  "المستودعات واللوجستيات",
  "المبيعات والمشاريع",
  "خدمة العملاء والاستقبال",
  "تقنية المعلومات والشبكات",
  "المشتريات والتوريد"
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
];

export const EmployeesManager: React.FC<EmployeesManagerProps> = ({
  employees,
  branches = [],
  companySettings,
  activeEmployeeId = "emp-1",
  attendanceRecords = [],
  payrollSlips = [],
  leaveRequests = [],
  vouchers = [],
  onSaveEmployees,
  onSaveAttendance,
  onSavePayrollSlips,
  onSaveLeaveRequests,
  onSelectActiveEmployee,
  onSaveVouchers,
  onViewVoucher,
  onAuditLog
}) => {
  const { t, language, dir, isRTL } = useLanguage();

  // Primary Suite Tabs: Staff | Contracts | Performance | Training | Disciplinary | Recognition | Career | Documents | Events | Payroll | Attendance | Leaves | Kiosk Movements | Requests
  const [suiteTab, setSuiteTab] = useState<
    | "staff"
    | "contracts"
    | "performance"
    | "training"
    | "disciplinary"
    | "recognition"
    | "career"
    | "documents"
    | "events"
    | "payroll"
    | "attendance"
    | "leaves"
    | "kiosk_movements"
    | "requests"
  >("staff");

  // New HR Suites State
  const [contractsList, setContractsList] = useState<EmploymentContract[]>(() => loadEmploymentContracts());
  const [reviewsList, setReviewsList] = useState<PerformanceReview[]>(() => loadPerformanceReviews());
  const [goalsList, setGoalsList] = useState<PerformanceGoal[]>(() => loadPerformanceGoals());
  const [kpisList, setKpisList] = useState<EmployeeKPI[]>(() => loadEmployeeKPIs());
  const [coursesList, setCoursesList] = useState<TrainingCourse[]>(() => loadTrainingCourses());
  const [trainingRecordsList, setTrainingRecordsList] = useState<EmployeeTrainingRecord[]>(() => loadEmployeeTrainingRecords());
  const [certificatesList, setCertificatesList] = useState<EmployeeCertificate[]>(() => loadEmployeeCertificates());
  const [disciplinaryList, setDisciplinaryList] = useState<DisciplinaryAction[]>(() => loadDisciplinaryActions());
  const [recognitionsList, setRecognitionsList] = useState<EmployeeRecognition[]>(() => loadEmployeeRecognitions());
  const [careerHistoriesList, setCareerHistoriesList] = useState<EmployeeCareerHistory[]>(() => loadEmployeeCareerHistories());
  const [documentsList, setDocumentsList] = useState<EmployeeDocumentRecord[]>(() => loadEmployeeDocuments());
  const [greetingsList, setGreetingsList] = useState<EmployeeEventGreeting[]>(() => loadEmployeeGreetings());

  // 360 View State
  const [selected360EmployeeId, setSelected360EmployeeId] = useState<string | null>(null);
  const [is360ModalOpen, setIs360ModalOpen] = useState<boolean>(false);

  const handleOpen360Modal = (empId: string) => {
    setSelected360EmployeeId(empId);
    setIs360ModalOpen(true);
  };

  const handleSaveContract = (contract: EmploymentContract) => {
    const exists = contractsList.some((c) => c.id === contract.id);
    const updated = exists ? contractsList.map((c) => (c.id === contract.id ? contract : c)) : [contract, ...contractsList];
    setContractsList(updated);
    saveEmploymentContracts(updated);
  };

  const handleSaveReview = (review: PerformanceReview) => {
    const exists = reviewsList.some((r) => r.id === review.id);
    const updated = exists ? reviewsList.map((r) => (r.id === review.id ? review : r)) : [review, ...reviewsList];
    setReviewsList(updated);
    savePerformanceReviews(updated);
  };

  const handleSaveGoal = (goal: PerformanceGoal) => {
    const exists = goalsList.some((g) => g.id === goal.id);
    const updated = exists ? goalsList.map((g) => (g.id === goal.id ? goal : g)) : [goal, ...goalsList];
    setGoalsList(updated);
    savePerformanceGoals(updated);
  };

  const handleSaveKPI = (kpi: EmployeeKPI) => {
    const exists = kpisList.some((k) => k.id === kpi.id);
    const updated = exists ? kpisList.map((k) => (k.id === kpi.id ? kpi : k)) : [kpi, ...kpisList];
    setKpisList(updated);
    saveEmployeeKPIs(updated);
  };

  const handleSaveCourse = (course: TrainingCourse) => {
    const exists = coursesList.some((c) => c.id === course.id);
    const updated = exists ? coursesList.map((c) => (c.id === course.id ? course : c)) : [course, ...coursesList];
    setCoursesList(updated);
    saveTrainingCourses(updated);
  };

  const handleSaveTrainingRecord = (record: EmployeeTrainingRecord) => {
    const exists = trainingRecordsList.some((r) => r.id === record.id);
    const updated = exists ? trainingRecordsList.map((r) => (r.id === record.id ? record : r)) : [record, ...trainingRecordsList];
    setTrainingRecordsList(updated);
    saveEmployeeTrainingRecords(updated);
  };

  const handleSaveCertificate = (cert: EmployeeCertificate) => {
    const exists = certificatesList.some((c) => c.id === cert.id);
    const updated = exists ? certificatesList.map((c) => (c.id === cert.id ? cert : c)) : [cert, ...certificatesList];
    setCertificatesList(updated);
    saveEmployeeCertificates(updated);
  };

  const handleSaveDisciplinary = (action: DisciplinaryAction) => {
    const exists = disciplinaryList.some((d) => d.id === action.id);
    const updated = exists ? disciplinaryList.map((d) => (d.id === action.id ? action : d)) : [action, ...disciplinaryList];
    setDisciplinaryList(updated);
    saveDisciplinaryActions(updated);
  };

  const handleSaveRecognition = (rec: EmployeeRecognition) => {
    const exists = recognitionsList.some((r) => r.id === rec.id);
    const updated = exists ? recognitionsList.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...recognitionsList];
    setRecognitionsList(updated);
    saveEmployeeRecognitions(updated);
  };

  const handleSaveCareerHistory = (ch: EmployeeCareerHistory) => {
    const exists = careerHistoriesList.some((c) => c.id === ch.id);
    const updated = exists ? careerHistoriesList.map((c) => (c.id === ch.id ? ch : c)) : [ch, ...careerHistoriesList];
    setCareerHistoriesList(updated);
    saveEmployeeCareerHistories(updated);
  };

  const handleSaveDocument = (doc: EmployeeDocumentRecord) => {
    const exists = documentsList.some((d) => d.id === doc.id);
    const updated = exists ? documentsList.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...documentsList];
    setDocumentsList(updated);
    saveEmployeeDocuments(updated);
  };

  const handleSaveGreeting = (greeting: EmployeeEventGreeting) => {
    const exists = greetingsList.some((g) => g.id === greeting.id);
    const updated = exists ? greetingsList.map((g) => (g.id === greeting.id ? greeting : g)) : [greeting, ...greetingsList];
    setGreetingsList(updated);
    saveEmployeeGreetings(updated);
  };

  // Kiosk & Employee Movements state
  const [kioskDevicesList, setKioskDevicesList] = useState<KioskDevice[]>(() => loadKioskDevices());
  const [movementTypesList, setMovementTypesList] = useState<MovementTypeConfig[]>(() => loadMovementTypes());
  const erpData = useERPData();
  const [movementLogsList, setMovementLogsList] = useState<AttendanceMovementLog[]>(() => erpData?.movementLogsList || loadAttendanceMovementLogs());
  const [adjustmentsList, setAdjustmentsList] = useState<AttendanceAdjustment[]>(() => loadAttendanceAdjustments());
  const [activeKioskDeviceId, setActiveKioskDeviceId] = useState<string>(() => loadActiveKioskDeviceId());
  const [isKioskModalOpen, setIsKioskModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    if (erpData?.movementLogsList && erpData.movementLogsList.length > 0) {
      setMovementLogsList(erpData.movementLogsList);
    }
  }, [erpData?.movementLogsList]);

  const handleSaveKioskDevices = (devs: KioskDevice[]) => {
    setKioskDevicesList(devs);
    saveKioskDevices(devs);
  };

  const handleSaveMovementTypes = (types: MovementTypeConfig[]) => {
    setMovementTypesList(types);
    saveMovementTypes(types);
  };

  const handleSaveMovementLogs = (logs: AttendanceMovementLog[]) => {
    setMovementLogsList(logs);
    saveAttendanceMovementLogs(logs);
    if (erpData?.setMovementLogsList) erpData.setMovementLogsList(logs);
  };

  const handleSaveAdjustments = (adjs: AttendanceAdjustment[]) => {
    setAdjustmentsList(adjs);
    saveAttendanceAdjustments(adjs);
  };

  const handleSaveMovementLogSingle = (newLog: AttendanceMovementLog) => {
    const updated = [newLog, ...movementLogsList];
    setMovementLogsList(updated);
    saveAttendanceMovementLogs(updated);
    if (erpData?.setMovementLogsList) erpData.setMovementLogsList(updated);

    const cId = erpData?.companyId || "00000000-0000-0000-0000-000000000001";
    if (isSupabaseConfigured) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineMutation({ entityType: 'ATTENDANCE_MOVEMENT_LOG', action: 'UPSERT', payload: newLog, companyId: cId });
      } else {
        hrSvc.addAttendanceMovementLog(newLog, cId).catch(console.error);
      }
    }

    // If check-in or check-out, synchronize with classic attendanceRecords list
    if (newLog.movementCategory === "CHECK_IN" || newLog.movementCategory === "CHECK_OUT") {
      const todayStr = newLog.date;
      const targetEmpUuid = ensureValidUuid(newLog.employeeId);
      const existingRec = attendanceRecords.find(
        (r) => (r.employeeId === newLog.employeeId || ensureValidUuid(r.employeeId) === targetEmpUuid) && r.date === todayStr
      );
      let updatedRecords: AttendanceRecord[];
      if (existingRec) {
        updatedRecords = attendanceRecords.map((r) =>
          r.id === existingRec.id
            ? {
                ...r,
                checkIn: newLog.movementCategory === "CHECK_IN" ? newLog.time : r.checkIn,
                checkOut: newLog.movementCategory === "CHECK_OUT" ? newLog.time : r.checkOut,
                status: "PRESENT" as AttendanceStatus
              }
            : r
        );
      } else {
        const emp = employees.find((e) => e.id === newLog.employeeId);
        const newRec: AttendanceRecord = {
          id: `att-rec-${Date.now()}`,
          employeeId: newLog.employeeId,
          employeeCode: newLog.employeeCode || emp?.employeeCode || "EMP-001",
          employeeName: newLog.employeeName,
          jobTitle: emp?.jobTitle,
          department: emp?.department,
          date: todayStr,
          checkIn: newLog.movementCategory === "CHECK_IN" ? newLog.time : undefined,
          checkOut: newLog.movementCategory === "CHECK_OUT" ? newLog.time : undefined,
          status: "PRESENT",
          workingHours: 8,
          overtimeHours: 0,
          lateMinutes: 0,
          branchId: newLog.branchId,
          branchName: newLog.branchName,
          notes: `مسجل عبر كشك الحضور اللوحي (${newLog.deviceName})`
        };
        updatedRecords = [newRec, ...attendanceRecords];
      }
      if (onSaveAttendance) {
        onSaveAttendance(updatedRecords);
      }
    }
  };

  // Filter & Search states for Staff
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal states for Staff Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [modalTab, setModalTab] = useState<"personal" | "permissions" | "financial" | "signature">("personal");
  const [permissionsViewerEmp, setPermissionsViewerEmp] = useState<Employee | null>(null);
  const [deleteConfirmationEmp, setDeleteConfirmationEmp] = useState<Employee | null>(null);

  // Form State for Employee Add / Edit
  const [formData, setFormData] = useState<{
    id?: string;
    employeeCode: string;
    fullName: string;
    fullNameEn: string;
    civilId: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    jobTitle: string;
    department: string;
    branchId: string;
    branchName: string;
    status: EmployeeStatus;
    hireDate: string;
    contractType: ContractType;
    basicSalary: number;
    allowances: number;
    maxSalaryCap?: number;
    maxBonusCap?: number;
    preferredBonusTreasury?: string;
    currency: string;
    bankName: string;
    bankIban: string;
    avatarUrl: string;
    signatureUrl: string;
    permissions: EmployeePermission[];
    notes: string;
    kioskPin: string;
  }>({
    employeeCode: "",
    fullName: "",
    fullNameEn: "",
    civilId: "",
    email: "",
    phone: "",
    role: "SALES",
    jobTitle: "",
    department: "المبيعات والمشاريع",
    branchId: branches[0]?.id || "",
    branchName: branches[0]?.name || "",
    status: "ACTIVE",
    hireDate: new Date().toISOString().split("T")[0],
    contractType: "FULL_TIME",
    basicSalary: 600,
    allowances: 100,
    maxSalaryCap: undefined,
    maxBonusCap: undefined,
    preferredBonusTreasury: "الخزينة النقدية الرئيسية",
    currency: companySettings.currency || "OMR",
    bankName: "بنك مسقط",
    bankIban: "",
    avatarUrl: PRESET_AVATARS[0],
    signatureUrl: "",
    permissions: ROLE_DEFAULT_PERMISSIONS.SALES,
    notes: "",
    kioskPin: ""
  });

  // State for Kiosk PIN management in Add / Edit Staff Modal
  const [existingPinRecord, setExistingPinRecord] = useState<EmployeePinRecord | null>(null);
  const [showPinPlain, setShowPinPlain] = useState<boolean>(false);

  // Payroll State
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>("2026-08");
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState<PayrollSlip | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState<boolean>(false);
  
  // Individual Salary Disbursement & Adjustment State
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState<boolean>(false);
  const [disbursingEmployee, setDisbursingEmployee] = useState<Employee | null>(null);
  const [disbursingSlip, setDisbursingSlip] = useState<PayrollSlip | null>(null);

  // Instant Bonus Disbursement State
  const [isInstantBonusModalOpen, setIsInstantBonusModalOpen] = useState<boolean>(false);
  const [bonusEmployee, setBonusEmployee] = useState<Employee | null>(null);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [quickClockInEmpId, setQuickClockInEmpId] = useState<string>(employees[0]?.id || "");
  const [isAddAttendanceModalOpen, setIsAddAttendanceModalOpen] = useState<boolean>(false);
  const [manualAttForm, setManualAttForm] = useState({
    employeeId: employees[0]?.id || "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "08:00",
    checkOut: "16:00",
    status: "PRESENT" as AttendanceStatus,
    notes: ""
  });

  // Leaves State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: employees[0]?.id || "",
    leaveType: "ANNUAL" as LeaveType,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    daysCount: 7,
    reason: ""
  });

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        emp.fullName.toLowerCase().includes(term) ||
        (emp.fullNameEn && emp.fullNameEn.toLowerCase().includes(term)) ||
        emp.employeeCode.toLowerCase().includes(term) ||
        (emp.civilId && emp.civilId.includes(term)) ||
        emp.phone.includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.jobTitle.toLowerCase().includes(term);

      const matchesBranch =
        selectedBranch === "ALL" || emp.branchId === selectedBranch;

      const matchesRole =
        selectedRole === "ALL" || emp.role === selectedRole;

      const matchesStatus =
        selectedStatus === "ALL" || emp.status === selectedStatus;

      const matchesDepartment =
        selectedDepartment === "ALL" || emp.department === selectedDepartment;

      return matchesSearch && matchesBranch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [employees, searchTerm, selectedBranch, selectedRole, selectedStatus, selectedDepartment]);

  // Financial & Staff Metrics
  const metrics = useMemo(() => {
    const totalCount = employees.length;
    const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
    const onLeaveCount = employees.filter((e) => e.status === "ON_LEAVE").length;
    const totalPayroll = employees
      .filter((e) => e.status === "ACTIVE")
      .reduce((sum, e) => sum + (Number(e.basicSalary) || 0) + (Number(e.allowances) || 0), 0);
    const adminCount = employees.filter((e) => e.role === "ADMIN" || e.role === "MANAGER").length;

    return { totalCount, activeCount, onLeaveCount, totalPayroll, adminCount };
  }, [employees]);

  // Current active employee object
  const currentActiveEmployee = useMemo(() => {
    return employees.find((e) => e.id === activeEmployeeId) || employees[0];
  }, [employees, activeEmployeeId]);

  // Monthly Payroll Slips Filtered
  const currentMonthSlips = useMemo(() => {
    return payrollSlips.filter((s) => s.payrollMonth === selectedPayrollMonth);
  }, [payrollSlips, selectedPayrollMonth]);

  const payrollSummary = useMemo(() => {
    const totalBasic = currentMonthSlips.reduce((sum, s) => sum + Number(s.basicSalary || 0), 0);
    const totalAllowances = currentMonthSlips.reduce(
      (sum, s) =>
        sum +
        Number(s.housingAllowance || 0) +
        Number(s.transportAllowance || 0) +
        Number(s.otherAllowances || 0),
      0
    );
    const totalBonus = currentMonthSlips.reduce((sum, s) => sum + Number(s.bonus || 0), 0);
    const totalDeductions = currentMonthSlips.reduce(
      (sum, s) => sum + Number(s.deductions || 0) + Number(s.socialSecurityDeduction || 0),
      0
    );
    const totalNet = currentMonthSlips.reduce((sum, s) => sum + Number(s.netSalary || 0), 0);
    const paidCount = currentMonthSlips.filter((s) => s.status === "PAID").length;

    return { totalBasic, totalAllowances, totalBonus, totalDeductions, totalNet, paidCount };
  }, [currentMonthSlips]);

  // Today Attendance Stats
  const todayAttendance = useMemo(() => {
    return attendanceRecords.filter((a) => a.date === attendanceDate);
  }, [attendanceRecords, attendanceDate]);

  const attendanceStats = useMemo(() => {
    const present = todayAttendance.filter((a) => a.status === "PRESENT").length;
    const late = todayAttendance.filter((a) => a.status === "LATE").length;
    const onLeave = todayAttendance.filter((a) => a.status === "ON_LEAVE").length;
    const totalToday = todayAttendance.length;
    const activeStaffTotal = employees.filter((e) => e.status === "ACTIVE").length;
    const punctualityRate = activeStaffTotal > 0 ? Math.round((present / activeStaffTotal) * 100) : 100;

    return { present, late, onLeave, totalToday, punctualityRate };
  }, [todayAttendance, employees]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    const nextCodeNumber = employees.length + 1;
    const code = `EMP-${nextCodeNumber.toString().padStart(3, "0")}`;
    const defaultBranch = branches[0];
    const defaultPin = Math.floor(1000 + Math.random() * 9000).toString();

    setFormData({
      employeeCode: code,
      fullName: "",
      fullNameEn: "",
      civilId: "",
      email: "",
      phone: "+968 ",
      role: "SALES",
      jobTitle: "مسؤول مبيعات",
      department: "المبيعات والمشاريع",
      branchId: defaultBranch?.id || "",
      branchName: defaultBranch?.name || "",
      status: "ACTIVE",
      hireDate: new Date().toISOString().split("T")[0],
      contractType: "FULL_TIME",
      basicSalary: 600,
      allowances: 100,
      maxSalaryCap: undefined,
      maxBonusCap: undefined,
      preferredBonusTreasury: "الخزينة النقدية الرئيسية",
      currency: companySettings.currency || "OMR",
      bankName: "بنك مسقط",
      bankIban: "",
      avatarUrl: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
      signatureUrl: "",
      permissions: ROLE_DEFAULT_PERMISSIONS.SALES,
      notes: "",
      kioskPin: defaultPin
    });
    setExistingPinRecord(null);
    setShowPinPlain(true);
    setEditingEmployee(null);
    setModalTab("personal");
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    const allPins = loadEmployeePins();
    const empPinRecord = allPins[emp.id] || null;
    setExistingPinRecord(empPinRecord);
    setShowPinPlain(false);

    setFormData({
      id: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      fullNameEn: emp.fullNameEn || "",
      civilId: emp.civilId || "",
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      jobTitle: emp.jobTitle,
      department: emp.department,
      branchId: emp.branchId || "",
      branchName: emp.branchName || "",
      status: emp.status,
      hireDate: emp.hireDate,
      contractType: emp.contractType || "FULL_TIME",
      basicSalary: emp.basicSalary,
      allowances: emp.allowances,
      maxSalaryCap: emp.maxSalaryCap,
      maxBonusCap: emp.maxBonusCap,
      preferredBonusTreasury: emp.preferredBonusTreasury || "الخزينة النقدية الرئيسية",
      currency: emp.currency || companySettings.currency || "OMR",
      bankName: emp.bankName || "بنك مسقط",
      bankIban: emp.bankIban || "",
      avatarUrl: emp.avatarUrl || PRESET_AVATARS[0],
      signatureUrl: emp.signatureUrl || "",
      permissions: emp.permissions || ROLE_DEFAULT_PERMISSIONS[emp.role] || [],
      notes: emp.notes || "",
      kioskPin: ""
    });
    setModalTab("personal");
    setIsModalOpen(true);
  };

  // Unlock employee PIN from within employee modal
  const handleUnlockEmployeePinInModal = (empId: string) => {
    unlockEmployeePin(empId);
    const allPins = loadEmployeePins();
    setExistingPinRecord(allPins[empId] || null);
    if (onAuditLog) {
      onAuditLog(
        "PIN_UNLOCK",
        "KioskSecurity",
        empId,
        formData.fullName,
        `تم إلغاء قفل رمز PIN للكشك للموظف ${formData.fullName}`,
        `Unlocked Kiosk PIN for employee ${formData.fullName}`
      );
    }
  };

  // Save Employee Form
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    let updatedEmployees: Employee[];
    const now = new Date().toISOString();
    let savedTargetId = "";
    let savedTargetCode = "";
    let savedTargetName = formData.fullName.trim();

    if (editingEmployee) {
      savedTargetId = editingEmployee.id;
      savedTargetCode = formData.employeeCode.trim() || editingEmployee.employeeCode;
      updatedEmployees = employees.map((emp) => {
        if (emp.id === editingEmployee.id) {
          return {
            ...emp,
            employeeCode: formData.employeeCode,
            fullName: formData.fullName.trim(),
            fullNameEn: formData.fullNameEn.trim() || undefined,
            civilId: formData.civilId.trim() || undefined,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            role: formData.role,
            jobTitle: formData.jobTitle.trim(),
            department: formData.department,
            branchId: formData.branchId || undefined,
            branchName: branches.find((b) => b.id === formData.branchId)?.name || formData.branchName || undefined,
            status: formData.status,
            hireDate: formData.hireDate,
            contractType: formData.contractType,
            basicSalary: Number(formData.basicSalary) || 0,
            allowances: Number(formData.allowances) || 0,
            maxSalaryCap: formData.maxSalaryCap ? Number(formData.maxSalaryCap) : undefined,
            maxBonusCap: formData.maxBonusCap ? Number(formData.maxBonusCap) : undefined,
            preferredBonusTreasury: formData.preferredBonusTreasury?.trim() || undefined,
            currency: formData.currency,
            bankName: formData.bankName,
            bankIban: formData.bankIban.trim(),
            avatarUrl: formData.avatarUrl,
            signatureUrl: formData.signatureUrl,
            permissions: formData.permissions,
            notes: formData.notes.trim() || undefined,
            updatedAt: now
          };
        }
        return emp;
      });
    } else {
      const generatedId = `emp-${Date.now()}`;
      savedTargetId = generatedId;
      savedTargetCode = formData.employeeCode.trim() || `EMP-${(employees.length + 1).toString().padStart(3, "0")}`;
      const newEmp: Employee = {
        id: generatedId,
        employeeCode: savedTargetCode,
        fullName: formData.fullName.trim(),
        fullNameEn: formData.fullNameEn.trim() || undefined,
        civilId: formData.civilId.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        jobTitle: formData.jobTitle.trim() || "موظف",
        department: formData.department || "المبيعات والمشاريع",
        branchId: formData.branchId || undefined,
        branchName: branches.find((b) => b.id === formData.branchId)?.name || undefined,
        status: formData.status,
        hireDate: formData.hireDate,
        contractType: formData.contractType,
        basicSalary: Number(formData.basicSalary) || 0,
        allowances: Number(formData.allowances) || 0,
        maxSalaryCap: formData.maxSalaryCap ? Number(formData.maxSalaryCap) : undefined,
        maxBonusCap: formData.maxBonusCap ? Number(formData.maxBonusCap) : undefined,
        preferredBonusTreasury: formData.preferredBonusTreasury?.trim() || undefined,
        currency: formData.currency,
        bankName: formData.bankName,
        bankIban: formData.bankIban.trim(),
        avatarUrl: formData.avatarUrl,
        signatureUrl: formData.signatureUrl,
        permissions: formData.permissions,
        notes: formData.notes.trim() || undefined,
        createdAt: now,
        updatedAt: now
      };
      updatedEmployees = [newEmp, ...employees];
    }

    // If Kiosk PIN is set or updated (minimum 4 digits)
    if (formData.kioskPin && formData.kioskPin.trim().length >= 4) {
      try {
        await setEmployeePin(
          savedTargetId,
          savedTargetCode,
          savedTargetName,
          formData.kioskPin.trim(),
          activeEmployeeId || "admin"
        );
        if (onAuditLog) {
          onAuditLog(
            "PIN_UPDATE",
            "KioskSecurity",
            savedTargetId,
            savedTargetName,
            `تم تعيين/تحديث رمز PIN لكشك الحضور للموظف ${savedTargetName}`,
            `Set/Updated Kiosk PIN for employee ${savedTargetName}`
          );
        }
      } catch (err) {
        console.error("Failed to hash and save Kiosk PIN:", err);
      }
    }

    // Automatically create or update login profile (UserAccount) with email
    const targetEmp = updatedEmployees.find((e) => e.id === savedTargetId);
    if (targetEmp) {
      const userAccount = syncUserAccountFromEmployee(targetEmp);

      // Automatically send welcome/invitation email via Resend if configured
      const resend = companySettings?.resendSettings;
      if (resend?.enabled && resend?.autoSendWelcomeEmail && targetEmp.email && targetEmp.email.includes("@")) {
        sendWelcomeCredentialsEmail(
          resend,
          targetEmp,
          {
            email: targetEmp.email,
            pinCode: formData.kioskPin.trim() || userAccount.pinCode || "1234",
            tempPassword: userAccount.passwordHash || "Emp@1234"
          },
          companySettings?.companyName || "ديشال ERP"
        ).catch((err) => console.error("Auto welcome email send error:", err));
      }
    }

    onSaveEmployees(updatedEmployees);
    setIsModalOpen(false);
  };

  // Open Instant Bonus Modal
  const handleOpenInstantBonus = (emp: Employee) => {
    setBonusEmployee(emp);
    setIsInstantBonusModalOpen(true);
  };

  // Save Instant Bonus & Generate Accounting Voucher linked to Treasury
  const handleSaveInstantBonus = (
    emp: Employee,
    bonusAmount: number,
    reason: string,
    treasuryAccount: string,
    paymentDate: string,
    paymentMethod: string,
    notes?: string
  ) => {
    const currYear = new Date().getFullYear();
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const voucherNum = `PV-BNS-${currYear}-${randSeq}`;
    const curr = companySettings.currency || "OMR";

    const lineItems: LineItem[] = [
      {
        id: `li-bns-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        description: `صرف مكافأة / حافز إنجاز استثنائي - ${reason} للموظف (${emp.fullName} - ${emp.employeeCode})`,
        quantity: 1,
        unitPrice: bonusAmount,
        amount: bonusAmount
      }
    ];

    const newVoucher: ReceiptVoucher = {
      id: `rv-bns-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "PAYMENT",
      voucherNumber: voucherNum,
      referenceNo: `BONUS-${emp.employeeCode}-${Date.now().toString().slice(-4)}`,
      date: paymentDate,
      receivedFrom: companySettings.name || "شركة ديشال المتميزة",
      paidTo: emp.fullName,
      amount: bonusAmount,
      currency: curr,
      amountInWords: numberToWords(bonusAmount, curr, "ar"),
      isCustomWords: false,
      paymentMethod: (paymentMethod as PaymentMethod) || "CASH",
      category: "مكافآت وحوافز إنجاز استثنائية",
      lineItems,
      subtotal: bonusAmount,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: bonusAmount,
      notes: `صرف مكافأة نقدية فورية من (${treasuryAccount}) للموظف ${emp.fullName} (${emp.employeeCode}) - المبرر: ${reason}${notes ? ` - ملاحظات: ${notes}` : ""}`,
      terms: "تم صرف المكافأة واعتمادها مباشرة وخصمها من حساب الخزينة المحدد.",
      customFields: [
        { id: "cf-dept", label: "القسم / الإدارة", value: emp.department },
        { id: "cf-code", label: "الرقم الوظيفي", value: emp.employeeCode },
        { id: "cf-treasury", label: "حساب الخزينة المسحوب منه", value: treasuryAccount },
        { id: "cf-reason", label: "بيان ومبرر المكافأة", value: reason }
      ],
      status: "PAID",
      preparedBy: "شؤون الموظفين والموارد البشرية",
      approvedBy: "الإدارة والاعتماد المالي",
      receivedBy: emp.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onSaveVouchers) {
      const updatedVouchers = [newVoucher, ...(vouchers || [])];
      onSaveVouchers(updatedVouchers);
    }

    if (onAuditLog) {
      onAuditLog(
        "PAYMENT",
        "HR_BONUS",
        newVoucher.id,
        newVoucher.voucherNumber,
        `صرف مكافأة فورية للموظف ${emp.fullName} بمبلغ ${bonusAmount.toFixed(3)} ${curr} من ${treasuryAccount} وتوثيق سند صرف #${newVoucher.voucherNumber}`,
        `Disbursed instant bonus of ${bonusAmount.toFixed(3)} ${curr} for ${emp.fullName} from ${treasuryAccount} with PV #${newVoucher.voucherNumber}`
      );
    }
  };

  // Delete Employee
  const handleDeleteEmployee = () => {
    if (!deleteConfirmationEmp) return;
    const updated = employees.filter((e) => e.id !== deleteConfirmationEmp.id);
    onSaveEmployees(updated);
    setDeleteConfirmationEmp(null);
  };

  // Toggle quick status
  const handleQuickStatusChange = (emp: Employee, newStatus: EmployeeStatus) => {
    const updated = employees.map((e) => (e.id === emp.id ? { ...e, status: newStatus, updatedAt: new Date().toISOString() } : e));
    onSaveEmployees(updated);
  };

  // Generate Monthly Payroll Batch
  const handleGeneratePayrollBatch = () => {
    const activeStaff = employees.filter((e) => e.status === "ACTIVE" || e.status === "ON_LEAVE");
    const newSlips: PayrollSlip[] = activeStaff.map((emp, index) => {
      const basic = Number(emp.basicSalary) || 0;
      const housing = Math.round(Number(emp.allowances) * 0.6) || 100;
      const transport = Math.round(Number(emp.allowances) * 0.4) || 50;
      const socialSecurity = Number((basic * 0.07).toFixed(3)); // 7% PASI
      const bonus = 0;
      const deductions = 0;
      const net = basic + housing + transport + bonus - (socialSecurity + deductions);

      return {
        id: `pay-${selectedPayrollMonth}-${emp.id}`,
        payrollMonth: selectedPayrollMonth,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        fullNameEn: emp.fullNameEn,
        jobTitle: emp.jobTitle,
        department: emp.department,
        civilId: emp.civilId,
        bankName: emp.bankName || "بنك مسقط",
        bankIban: emp.bankIban,
        branchName: emp.branchName || "الفرع الرئيسي",
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: 0,
        bonus,
        deductions,
        socialSecurityDeduction: socialSecurity,
        netSalary: net,
        status: "APPROVED",
        paymentMethod: "BANK_TRANSFER",
        referenceNo: `WPS-OM-${selectedPayrollMonth}-${(index + 1).toString().padStart(2, "0")}`,
        notes: `مسير رواتب شهر ${selectedPayrollMonth}`,
        generatedAt: new Date().toISOString()
      };
    });

    // Merge with existing slips for other months
    const otherSlips = payrollSlips.filter((s) => s.payrollMonth !== selectedPayrollMonth);
    const updated = [...newSlips, ...otherSlips];
    if (onSavePayrollSlips) {
      onSavePayrollSlips(updated);
    }
  };

  // Export WPS File (Wage Protection System for Banks)
  const handleExportWPSFile = () => {
    if (currentMonthSlips.length === 0) return;
    const headers = [
      "Record ID",
      "Employee Code",
      "Civil ID",
      "Employee Name",
      "Bank Name",
      "IBAN",
      "Basic Salary",
      "Allowances",
      "Gross Earnings",
      "Deductions / PASI",
      "Net Salary Payable",
      "Currency",
      "Month Reference"
    ];

    const rows = currentMonthSlips.map((s) => [
      s.referenceNo || s.id,
      s.employeeCode,
      s.civilId || "N/A",
      `"${s.employeeName}"`,
      `"${s.bankName || 'Bank Muscat'}"`,
      s.bankIban || "N/A",
      s.basicSalary.toFixed(3),
      (s.housingAllowance + s.transportAllowance + s.otherAllowances).toFixed(3),
      (s.basicSalary + s.housingAllowance + s.transportAllowance + s.otherAllowances + s.bonus).toFixed(3),
      (s.deductions + s.socialSecurityDeduction).toFixed(3),
      s.netSalary.toFixed(3),
      companySettings.currency || "OMR",
      s.payrollMonth
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Deshal_WPS_Payroll_${selectedPayrollMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to generate official accounting Payment Voucher for salary disbursement
  const createSalaryPaymentVoucher = (slip: PayrollSlip): ReceiptVoucher => {
    const currYear = new Date().getFullYear();
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const voucherNum = `PV-SAL-${currYear}-${randSeq}`;
    const curr = companySettings.currency || "OMR";
    const paymentDate = slip.paymentDate || new Date().toISOString().split("T")[0];

    const lineItems: LineItem[] = [
      {
        id: `li-sal-basic-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        description: `الراتب الأساسي - شهر ${slip.payrollMonth} للموظف (${slip.employeeName} - ${slip.employeeCode})`,
        quantity: 1,
        unitPrice: slip.basicSalary,
        amount: slip.basicSalary
      }
    ];

    const totalAllowances = Number(slip.housingAllowance || 0) + Number(slip.transportAllowance || 0) + Number(slip.otherAllowances || 0);
    if (totalAllowances > 0) {
      lineItems.push({
        id: `li-sal-allow-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        description: `بدلات السكن والمواصلات والبدلات الأخرى (سكن: ${slip.housingAllowance} / نقل: ${slip.transportAllowance})`,
        quantity: 1,
        unitPrice: totalAllowances,
        amount: totalAllowances
      });
    }

    if (Number(slip.bonus || 0) > 0) {
      lineItems.push({
        id: `li-sal-bonus-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        description: `مكافآت وحوافز إنجاز ${slip.bonusReason ? `[البيان: ${slip.bonusReason}]` : ""}`,
        quantity: 1,
        unitPrice: Number(slip.bonus),
        amount: Number(slip.bonus)
      });
    }

    if (Number(slip.socialSecurityDeduction || 0) > 0) {
      lineItems.push({
        id: `li-sal-pasi-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        description: `استقطاع اشتراك التأمينات الاجتماعية (PASI 7%) - حصة الموظف`,
        quantity: 1,
        unitPrice: -Number(slip.socialSecurityDeduction),
        amount: -Number(slip.socialSecurityDeduction)
      });
    }

    if (Number(slip.deductions || 0) > 0) {
      lineItems.push({
        id: `li-sal-deduct-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        description: `خصومات وجزاءات واستقطاع سلف ${slip.deductionReason ? `[السبب: ${slip.deductionReason}]` : ""}`,
        quantity: 1,
        unitPrice: -Number(slip.deductions),
        amount: -Number(slip.deductions)
      });
    }

    const newVoucher: ReceiptVoucher = {
      id: `rv-sal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "PAYMENT",
      voucherNumber: voucherNum,
      referenceNo: slip.referenceNo || `PAY-${slip.payrollMonth}-${slip.employeeCode}`,
      date: paymentDate,
      receivedFrom: companySettings.name || "شركة ديشال المتميزة",
      paidTo: slip.employeeName,
      amount: slip.netSalary,
      currency: curr,
      amountInWords: numberToWords(slip.netSalary, curr, "ar"),
      isCustomWords: false,
      paymentMethod: (slip.paymentMethod as PaymentMethod) || "BANK_TRANSFER",
      category: "رواتب وأجور موظفين",
      lineItems,
      subtotal: slip.netSalary,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: slip.netSalary,
      notes: `صرف مستحقات رواتب شهر ${slip.payrollMonth} للموظف ${slip.employeeName} (${slip.employeeCode}) - المسمى: ${slip.jobTitle}`,
      terms: "تم الصرف والتحويل بموجب مسير الرواتب المعتمد ومطابقة الحسابات البنكية.",
      customFields: [
        { id: "cf-dept", label: "القسم / الإدارة", value: slip.department },
        { id: "cf-code", label: "الرقم الوظيفي", value: slip.employeeCode },
        { id: "cf-bank", label: "البنك / الحساب", value: `${slip.bankName || "بنك مسقط"} - ${slip.bankIban || "—"}` }
      ],
      status: "PAID",
      preparedBy: "شؤون الموظفين والموارد البشرية",
      approvedBy: "الإدارة المالية والاعتماد",
      receivedBy: slip.employeeName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return newVoucher;
  };

  // Open Individual Salary Disbursement Modal
  const handleOpenDisburseModal = (slip?: PayrollSlip, emp?: Employee) => {
    if (slip) {
      setDisbursingSlip(slip);
      const targetEmp = employees.find((e) => e.id === slip.employeeId) || null;
      setDisbursingEmployee(targetEmp);
    } else if (emp) {
      const existingSlip = currentMonthSlips.find((s) => s.employeeId === emp.id) || null;
      setDisbursingSlip(existingSlip);
      setDisbursingEmployee(emp);
    } else {
      // Default to first active employee
      const firstActive = employees.find((e) => e.status === "ACTIVE") || employees[0] || null;
      const existingSlip = firstActive ? currentMonthSlips.find((s) => s.employeeId === firstActive.id) || null : null;
      setDisbursingSlip(existingSlip);
      setDisbursingEmployee(firstActive);
    }
    setIsDisburseModalOpen(true);
  };

  // Save Individual Disbursed Slip & link accounting voucher
  const handleSaveDisbursedSlip = (slip: PayrollSlip, generateVoucher: boolean) => {
    let finalSlip = { ...slip };
    let updatedVouchers = [...(vouchers || [])];

    if (generateVoucher && slip.status === "PAID") {
      const newVoucher = createSalaryPaymentVoucher(slip);
      finalSlip.linkedVoucherId = newVoucher.id;
      finalSlip.linkedVoucherNumber = newVoucher.voucherNumber;
      finalSlip.disbursedBy = "الإدارة المالية";
      updatedVouchers = [newVoucher, ...updatedVouchers];

      if (onSaveVouchers) {
        onSaveVouchers(updatedVouchers);
      }

      if (onAuditLog) {
        onAuditLog(
          "PAYMENT",
          "PAYROLL",
          newVoucher.id,
          newVoucher.voucherNumber,
          `صرف راتب الموظف ${slip.employeeName} (${slip.netSalary.toFixed(3)} ${companySettings.currency || "OMR"}) وتوليد سند صرف #${newVoucher.voucherNumber}`,
          `Disbursed salary for ${slip.employeeName} and generated payment voucher #${newVoucher.voucherNumber}`
        );
      }
    }

    const existingIndex = payrollSlips.findIndex((s) => s.id === finalSlip.id);
    let updatedSlips: PayrollSlip[];
    if (existingIndex >= 0) {
      updatedSlips = payrollSlips.map((s, idx) => (idx === existingIndex ? finalSlip : s));
    } else {
      updatedSlips = [finalSlip, ...payrollSlips];
    }

    if (onSavePayrollSlips) {
      onSavePayrollSlips(updatedSlips);
    }
  };

  // Mark all slips as Paid and generate payment vouchers for all
  const handleMarkAllSlipsPaid = () => {
    let newCreatedVouchers: ReceiptVoucher[] = [];
    const updated = payrollSlips.map((s) => {
      if (s.payrollMonth === selectedPayrollMonth) {
        let slipToUpdate = {
          ...s,
          status: "PAID" as PayrollStatus,
          paymentDate: s.paymentDate || new Date().toISOString().split("T")[0]
        };

        if (!slipToUpdate.linkedVoucherNumber) {
          const v = createSalaryPaymentVoucher(slipToUpdate);
          slipToUpdate.linkedVoucherId = v.id;
          slipToUpdate.linkedVoucherNumber = v.voucherNumber;
          newCreatedVouchers.push(v);
        }
        return slipToUpdate;
      }
      return s;
    });

    if (newCreatedVouchers.length > 0 && onSaveVouchers) {
      onSaveVouchers([...newCreatedVouchers, ...(vouchers || [])]);
    }

    if (onSavePayrollSlips) {
      onSavePayrollSlips(updated);
    }

    if (onAuditLog) {
      onAuditLog(
        "PAYMENT",
        "PAYROLL",
        `payroll-batch-${selectedPayrollMonth}`,
        `مسير رواتب ${selectedPayrollMonth}`,
        `اعتماد وصرف كافة رواتب شهر ${selectedPayrollMonth} وتوليد السندات المحاسبية (${newCreatedVouchers.length} سند جديد)`,
        `Approved & disbursed all salaries for ${selectedPayrollMonth} (${newCreatedVouchers.length} vouchers created)`
      );
    }
  };

  // Quick Clock-in for attendance
  const handleQuickClockIn = () => {
    const emp = employees.find((e) => e.id === quickClockInEmpId);
    if (!emp) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15);
    const lateMinutes = isLate ? (now.getHours() - 8) * 60 + now.getMinutes() : 0;

    const existingIndex = attendanceRecords.findIndex(
      (a) => a.employeeId === emp.id && a.date === attendanceDate
    );

    let updated: AttendanceRecord[];
    if (existingIndex >= 0) {
      updated = attendanceRecords.map((a, idx) => {
        if (idx === existingIndex) {
          return {
            ...a,
            checkIn: a.checkIn || timeStr,
            checkOut: a.checkIn ? timeStr : a.checkOut,
            status: a.status === "ABSENT" ? (isLate ? "LATE" : "PRESENT") : a.status,
            workingHours: a.checkIn ? 8 : a.workingHours
          };
        }
        return a;
      });
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeCode: emp.employeeCode,
        jobTitle: emp.jobTitle,
        department: emp.department,
        date: attendanceDate,
        checkIn: timeStr,
        status: isLate ? "LATE" : "PRESENT",
        workingHours: 8,
        overtimeHours: 0,
        lateMinutes,
        branchId: emp.branchId,
        branchName: emp.branchName || "الفرع الرئيسي",
        notes: isLate ? `تأخير ${lateMinutes} دقيقة` : "حضور في الموعد"
      };
      updated = [newRec, ...attendanceRecords];
    }

    if (onSaveAttendance) {
      onSaveAttendance(updated);
    }
  };

  // Save manual attendance
  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === manualAttForm.employeeId);
    if (!emp) return;

    const newRec: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      jobTitle: emp.jobTitle,
      department: emp.department,
      date: manualAttForm.date,
      checkIn: manualAttForm.checkIn,
      checkOut: manualAttForm.checkOut,
      status: manualAttForm.status,
      workingHours: 8,
      overtimeHours: 0,
      lateMinutes: manualAttForm.status === "LATE" ? 30 : 0,
      branchId: emp.branchId,
      branchName: emp.branchName,
      notes: manualAttForm.notes.trim() || undefined
    };

    const updated = [newRec, ...attendanceRecords];
    if (onSaveAttendance) {
      onSaveAttendance(updated);
    }
    setIsAddAttendanceModalOpen(false);
  };

  // Submit Leave Request
  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === leaveForm.employeeId);
    if (!emp) return;

    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      jobTitle: emp.jobTitle,
      department: emp.department,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      daysCount: Number(leaveForm.daysCount) || 1,
      reason: leaveForm.reason.trim(),
      status: "APPROVED",
      appliedAt: new Date().toISOString(),
      reviewedBy: "إدارة الموارد البشرية"
    };

    const updated = [newReq, ...leaveRequests];
    if (onSaveLeaveRequests) {
      onSaveLeaveRequests(updated);
    }
    setIsLeaveModalOpen(false);
  };

  // Approve / Reject Leave
  const handleUpdateLeaveStatus = (leaveId: string, newStatus: LeaveStatus) => {
    const updated = leaveRequests.map((l) =>
      l.id === leaveId
        ? {
            ...l,
            status: newStatus,
            reviewedBy: currentActiveEmployee.fullName,
            reviewedAt: new Date().toISOString()
          }
        : l
    );
    if (onSaveLeaveRequests) {
      onSaveLeaveRequests(updated);
    }
  };

  // Export Staff Directory to CSV
  const handleExportStaffCSV = () => {
    const headers = [
      "Employee Code",
      "Full Name",
      "English Name",
      "Civil ID",
      "Role",
      "Job Title",
      "Department",
      "Branch",
      "Status",
      "Hire Date",
      "Basic Salary",
      "Allowances",
      "Total Compensation",
      "Bank",
      "IBAN",
      "Phone",
      "Email"
    ];

    const rows = employees.map((e) => [
      e.employeeCode,
      `"${e.fullName}"`,
      `"${e.fullNameEn || ''}"`,
      e.civilId || "",
      e.role,
      `"${e.jobTitle}"`,
      `"${e.department}"`,
      `"${e.branchName || ''}"`,
      e.status,
      e.hireDate,
      e.basicSalary,
      e.allowances,
      e.basicSalary + e.allowances,
      `"${e.bankName || ''}"`,
      e.bankIban || "",
      e.phone,
      e.email
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Deshal_Employees_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12" dir={dir}>
      
      {/* 1. Header & Suite Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {language === "ar" ? "ديشال لإدارة الموارد البشرية والرواتب" : "Deshal HR & Payroll Management"}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Deshal HR
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {language === "ar"
                  ? "سجل الكادر، مسيرات الرواتب وحماية الأجور (WPS)، وبصمة الحضور والانصراف ومصفوفة الصلاحيات"
                  : "Staff profiles, payroll WPS engine, attendance logs, leave management & RBAC security"}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsKioskModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all cursor-pointer shadow-2xs"
              title="فتح شاشة الكشك اللوحي للتحقق والحضور"
            >
              <Tablet className="w-4 h-4 text-amber-600" />
              <span>{language === "ar" ? "فتح كشك الحضور (Kiosk)" : "Launch Kiosk"}</span>
            </button>

            {suiteTab === "staff" && (
              <>
                <button
                  onClick={handleExportStaffCSV}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{language === "ar" ? "تصدير الكادر (Excel)" : "Export Staff"}</span>
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === "ar" ? "إضافة موظف جديد" : "Add Employee"}</span>
                </button>
              </>
            )}

            {suiteTab === "payroll" && (
              <>
                <button
                  onClick={handleExportWPSFile}
                  disabled={currentMonthSlips.length === 0}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>{language === "ar" ? "تصدير ملف حماية الأجور (WPS)" : "Export WPS File"}</span>
                </button>
                <button
                  onClick={handleGeneratePayrollBatch}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-xs transition-colors cursor-pointer"
                >
                  <Banknote className="w-4 h-4" />
                  <span>{language === "ar" ? "توليد مسير رواتب الشهر" : "Generate Payroll"}</span>
                </button>
              </>
            )}

            {suiteTab === "attendance" && (
              <button
                onClick={() => setIsAddAttendanceModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === "ar" ? "تسجيل حضور يدوي" : "Add Attendance Log"}</span>
              </button>
            )}

            {suiteTab === "leaves" && (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === "ar" ? "تقديم طلب إجازة" : "Request Leave"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Suite Tabs (Staff | Contracts | Performance | Training | Disciplinary | Recognition | Career | Documents | Events | Payroll | Attendance | Leaves | Kiosk Movements | Requests) */}
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse border-t border-slate-200 mt-6 pt-4 overflow-x-auto no-scrollbar pb-1">
          {/* Staff Directory */}
          <button
            onClick={() => setSuiteTab("staff")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "staff"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "دليل الكادر" : "Staff"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "staff" ? "bg-indigo-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {employees.length}
            </span>
          </button>

          {/* Contracts */}
          <button
            onClick={() => setSuiteTab("contracts")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "contracts"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileSignature className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === "ar" ? "العقود ونهاية الخدمة" : "Contracts & EOSB"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "contracts" ? "bg-indigo-800 text-white" : "bg-blue-100 text-blue-800"}`}>
              {contractsList.length}
            </span>
          </button>

          {/* Performance & KPIs */}
          <button
            onClick={() => setSuiteTab("performance")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "performance"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === "ar" ? "تقييم الأداء والمؤشرات" : "Performance"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "performance" ? "bg-indigo-800 text-white" : "bg-emerald-100 text-emerald-800"}`}>
              {reviewsList.length}
            </span>
          </button>

          {/* Training */}
          <button
            onClick={() => setSuiteTab("training")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "training"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === "ar" ? "التدريب والتطوير" : "Training"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "training" ? "bg-indigo-800 text-white" : "bg-amber-100 text-amber-800"}`}>
              {coursesList.length}
            </span>
          </button>

          {/* Disciplinary */}
          <button
            onClick={() => setSuiteTab("disciplinary")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "disciplinary"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === "ar" ? "الجزاءات والتحقيق" : "Disciplinary"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "disciplinary" ? "bg-indigo-800 text-white" : "bg-rose-100 text-rose-800"}`}>
              {disciplinaryList.length}
            </span>
          </button>

          {/* Recognition */}
          <button
            onClick={() => setSuiteTab("recognition")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "recognition"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === "ar" ? "التحفيز والتميز" : "Recognition"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "recognition" ? "bg-indigo-800 text-white" : "bg-purple-100 text-purple-800"}`}>
              {recognitionsList.length}
            </span>
          </button>

          {/* Career History */}
          <button
            onClick={() => setSuiteTab("career")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "career"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === "ar" ? "التدرج والمسار" : "Career"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "career" ? "bg-indigo-800 text-white" : "bg-cyan-100 text-cyan-800"}`}>
              {careerHistoriesList.length}
            </span>
          </button>

          {/* Documents */}
          <button
            onClick={() => setSuiteTab("documents")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "documents"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === "ar" ? "أرشيف الوثائق" : "Documents"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "documents" ? "bg-indigo-800 text-white" : "bg-indigo-100 text-indigo-800"}`}>
              {documentsList.length}
            </span>
          </button>

          {/* Events */}
          <button
            onClick={() => setSuiteTab("events")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "events"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span>{language === "ar" ? "المناسبات والتهاني" : "Events"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "events" ? "bg-indigo-800 text-white" : "bg-pink-100 text-pink-800"}`}>
              {greetingsList.length}
            </span>
          </button>

          {/* Kiosk */}
          <button
            onClick={() => setSuiteTab("kiosk_movements")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "kiosk_movements"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Tablet className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === "ar" ? "كشك الحركة (Kiosk)" : "Kiosk"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "kiosk_movements" ? "bg-indigo-800 text-white" : "bg-amber-100 text-amber-800"}`}>
              {movementLogsList.length}
            </span>
          </button>

          {/* Payroll */}
          <button
            onClick={() => setSuiteTab("payroll")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "payroll"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === "ar" ? "مسيرات الرواتب (WPS)" : "Payroll"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "payroll" ? "bg-indigo-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {currentMonthSlips.length}
            </span>
          </button>

          {/* Attendance */}
          <button
            onClick={() => setSuiteTab("attendance")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "attendance"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === "ar" ? "سجلات الحضور" : "Attendance"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "attendance" ? "bg-indigo-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {todayAttendance.length}
            </span>
          </button>

          {/* Leaves */}
          <button
            onClick={() => setSuiteTab("leaves")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "leaves"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-orange-400" />
            <span>{language === "ar" ? "الإجازات" : "Leaves"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "leaves" ? "bg-indigo-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {leaveRequests.length}
            </span>
          </button>

          {/* Requests */}
          <button
            onClick={() => setSuiteTab("requests")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all shrink-0 cursor-pointer ${
              suiteTab === "requests"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === "ar" ? "النماذج والطلبات" : "Requests"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${suiteTab === "requests" ? "bg-indigo-800 text-white" : "bg-emerald-100 text-emerald-800"}`}>
              {language === "ar" ? "ذكي" : "Smart"}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF DIRECTORY & PROFILES */}
      {/* ========================================================================= */}
      {suiteTab === "staff" && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{language === "ar" ? "إجمالي الكادر" : "Total Staff"}</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalCount}</p>
              <span className="text-[11px] text-slate-400 block mt-0.5">{language === "ar" ? "موظف مسجل" : "registered staff"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{language === "ar" ? "على رأس العمل" : "Active Staff"}</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">{metrics.activeCount}</p>
              <span className="text-[11px] text-slate-400 block mt-0.5">{language === "ar" ? "جاهزون للعمليات" : "operational staff"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{language === "ar" ? "في إجازة رسمية" : "On Leave"}</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600 mt-2">{metrics.onLeaveCount}</p>
              <span className="text-[11px] text-slate-400 block mt-0.5">{language === "ar" ? "إجازات معتمدة" : "approved leaves"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{language === "ar" ? "إجمالي الرواتب الشهرية" : "Monthly Payroll"}</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {metrics.totalPayroll.toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-500">{companySettings.currency || "OMR"}</span>
              </p>
              <span className="text-[11px] text-slate-400 block mt-0.5">{language === "ar" ? "الأساسي + البدلات" : "base + allowances"}</span>
            </div>
          </div>

          {/* Search & Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === "ar" ? "البحث بالاسم، الرقم الوظيفي، المدني، الهاتف، أو المسمى..." : "Search by name, code, phone, role..."}
                  className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Branch Filter */}
              <div>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">{language === "ar" ? "جميع الفروع" : "All Branches"}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">{language === "ar" ? "جميع الأدوار الوظيفية" : "All Roles"}</option>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {language === "ar" ? v.ar : v.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">{language === "ar" ? "جميع الحالات" : "All Statuses"}</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.ar}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Employees List Grid / Table */}
          {filteredEmployees.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">
                {language === "ar" ? "لا يوجد موظفون مطابقون لخيارات البحث" : "No matching employees found"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === "ar" ? "جرّب تغيير فلاتر البحث أو إضافة موظف جديد" : "Try clearing search filters or add a new staff profile"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => {
                const roleInfo = ROLE_LABELS[emp.role] || ROLE_LABELS.CUSTOM;
                const statusInfo = STATUS_LABELS[emp.status] || STATUS_LABELS.ACTIVE;
                const isActiveSessionUser = emp.id === activeEmployeeId;

                return (
                  <div
                    key={emp.id}
                    className={`bg-white rounded-2xl border transition-all hover:shadow-md p-5 flex flex-col justify-between relative overflow-hidden ${
                      isActiveSessionUser ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"
                    }`}
                  >
                    {/* Active Session Badge */}
                    {isActiveSessionUser && (
                      <div className="absolute top-0 end-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-xl rtl:rounded-bl-none rtl:rounded-br-xl">
                        {language === "ar" ? "المستخدم النشط حالياً" : "Active Session"}
                      </div>
                    )}

                    <div>
                      {/* Top Row: Avatar & Basic Info */}
                      <div className="flex items-start space-x-3.5 rtl:space-x-reverse">
                        <img
                          src={emp.avatarUrl || PRESET_AVATARS[0]}
                          alt={emp.fullName}
                          className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <h3 className="font-bold text-sm text-slate-900 truncate">{emp.fullName}</h3>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold">
                              {emp.employeeCode}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-700 font-medium truncate mt-0.5">{emp.jobTitle}</p>
                          <p className="text-[11px] text-slate-400 truncate">{emp.department}</p>
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex items-center flex-wrap gap-1.5 mt-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${roleInfo.bg} ${roleInfo.color}`}>
                          {language === "ar" ? roleInfo.ar : roleInfo.en}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.ar}
                        </span>
                        {emp.branchName && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                            {emp.branchName}
                          </span>
                        )}
                      </div>

                      {/* Contact & Financial Details */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{language === "ar" ? "الهاتف:" : "Phone:"}</span>
                          <span className="font-mono text-slate-800">{emp.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{language === "ar" ? "الراتب والبدلات:" : "Compensation:"}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {(Number(emp.basicSalary) + Number(emp.allowances)).toFixed(3)} {emp.currency || "OMR"}
                          </span>
                        </div>

                        {/* Financial Caps & Governance Badges */}
                        {(emp.maxSalaryCap !== undefined || emp.maxBonusCap !== undefined) && (
                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">{language === "ar" ? "سقف الراتب الشهري:" : "Salary Cap:"}</span>
                              <span className="font-mono font-bold text-slate-800">
                                {emp.maxSalaryCap ? `${emp.maxSalaryCap.toFixed(3)} ${emp.currency || "OMR"}` : (language === "ar" ? "غير محدد" : "Uncapped")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">{language === "ar" ? "سقف المكافأة:" : "Bonus Cap:"}</span>
                              <span className="font-mono font-bold text-amber-700">
                                {emp.maxBonusCap ? `${emp.maxBonusCap.toFixed(3)} ${emp.currency || "OMR"}` : (language === "ar" ? "غير محدد" : "Uncapped")}
                              </span>
                            </div>
                            {emp.preferredBonusTreasury && (
                              <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-200/60 text-slate-500">
                                <span>{language === "ar" ? "خزينة المكافآت:" : "Bonus Treasury:"}</span>
                                <span className="font-semibold text-slate-700 truncate max-w-[130px]">{emp.preferredBonusTreasury}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {emp.bankIban && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400">{language === "ar" ? "الآيبان:" : "IBAN:"}</span>
                            <span className="font-mono text-[10px] text-slate-700 truncate max-w-[150px]">{emp.bankIban}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        {/* 360 Degree Profile Action */}
                        <button
                          type="button"
                          onClick={() => handleOpen360Modal(emp.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 rtl:space-x-reverse shadow-2xs"
                          title={language === "ar" ? "فتح الملف الشامل 360° للموظف بكافة أقسامه" : "Open 360° Comprehensive Profile"}
                        >
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{language === "ar" ? "ملف 360°" : "360°"}</span>
                        </button>

                        {/* Instant Bonus Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenInstantBonus(emp)}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 rtl:space-x-reverse shadow-2xs"
                          title={language === "ar" ? "صرف مكافأة استثنائية فورية للموظف وربطها بسند خزينة" : "Disburse Instant Bonus with Treasury Voucher"}
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-600" />
                          <span>{language === "ar" ? "مكافأة فورية" : "Bonus"}</span>
                        </button>

                        {onSelectActiveEmployee && !isActiveSessionUser && (
                          <button
                            onClick={() => onSelectActiveEmployee(emp.id)}
                            className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="تعيين كمستخدم للنظام الحالي"
                          >
                            {language === "ar" ? "نشط" : "Active"}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="تعديل بيانات وسقوفات الموظف"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmationEmp(emp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYROLL & WPS ENGINE */}
      {/* ========================================================================= */}
      {suiteTab === "payroll" && (
        <div className="space-y-6">
          {/* Payroll Header Bar & Month Picker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === "ar" ? "مسيرات الرواتب الشهرية والتحكم الفردي بالصرف (WPS)" : "Monthly Payroll & Individual Salary Control"}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === "ar"
                    ? "التحكم في صرف الرواتب فردياً، تسجيل المكافآت والخصومات بمبرراتها، وتوليد سندات الصرف المحاسبية"
                    : "Individual salary control, bonuses/deductions with notes, and accounting voucher generation"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <label className="text-xs font-bold text-slate-500">{language === "ar" ? "الشهر المالي:" : "Month:"}</label>
                <input
                  type="month"
                  value={selectedPayrollMonth}
                  onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Individual Disburse Button */}
              <button
                onClick={() => handleOpenDisburseModal()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors shadow-xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "صرف وتعديل راتب موظف فردي" : "Individual Salary Control"}</span>
              </button>

              {currentMonthSlips.length > 0 && (
                <>
                  <button
                    onClick={handleExportWPSFile}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 rtl:space-x-reverse transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === "ar" ? "تصدير WPS" : "Export WPS"}</span>
                  </button>

                  <button
                    onClick={handleMarkAllSlipsPaid}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 rtl:space-x-reverse transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{language === "ar" ? "اعتماد وصرف الكل وتوليد السندات" : "Disburse All & Issue Vouchers"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Payroll Financial Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === "ar" ? "الرواتب الأساسية" : "Basic Salaries"}</span>
              <p className="text-lg font-black text-slate-900 mt-1">{payrollSummary.totalBasic.toFixed(3)}</p>
              <span className="text-[10px] text-slate-400 font-bold">{companySettings.currency || "OMR"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === "ar" ? "إجمالي البدلات" : "Total Allowances"}</span>
              <p className="text-lg font-black text-slate-900 mt-1">{payrollSummary.totalAllowances.toFixed(3)}</p>
              <span className="text-[10px] text-slate-400 font-bold">{companySettings.currency || "OMR"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === "ar" ? "الحوافز والمكافآت" : "Incentives / Bonus"}</span>
              <p className="text-lg font-black text-emerald-600 mt-1">+{payrollSummary.totalBonus.toFixed(3)}</p>
              <span className="text-[10px] text-slate-400 font-bold">{companySettings.currency || "OMR"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === "ar" ? "الخصومات والتأمينات (PASI)" : "Deductions & PASI"}</span>
              <p className="text-lg font-black text-rose-600 mt-1">-{payrollSummary.totalDeductions.toFixed(3)}</p>
              <span className="text-[10px] text-slate-400 font-bold">{companySettings.currency || "OMR"}</span>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-xs">
              <span className="text-indigo-800 block text-[10px] font-bold uppercase">{language === "ar" ? "صافي المستحق للصرف" : "Net Payable"}</span>
              <p className="text-xl font-black text-indigo-950 mt-1">{payrollSummary.totalNet.toFixed(3)}</p>
              <span className="text-[10px] text-indigo-600 font-bold">{companySettings.currency || "OMR"}</span>
            </div>
          </div>

          {/* Payroll Slips Table */}
          {currentMonthSlips.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <Banknote className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">
                {language === "ar" ? `لم يتم إنشاء مسير رواتب لشهر ${selectedPayrollMonth} بعد` : `No payroll generated for ${selectedPayrollMonth}`}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {language === "ar"
                  ? "يمكنك توليد مسير الرواتب الشهري لكافة الموظفين دفعة واحدة، أو صرف وتعديل راتب موظف فردي وتسجيل مكافآته وخصوماته وسنده المحاسبي فوراً."
                  : "You can batch generate payroll for all staff, or disburse and adjust individual employee salary with bonus/deduction records and accounting vouchers."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleGeneratePayrollBatch}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === "ar" ? "توليد مسير الرواتب الآن" : "Generate Payroll Batch Now"}</span>
                </button>
                <button
                  onClick={() => handleOpenDisburseModal()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{language === "ar" ? "صرف راتب فردي لموظف محدد" : "Disburse Individual Salary"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3 text-start">{language === "ar" ? "الموظف والتوثيق" : "Employee & Voucher"}</th>
                      <th className="px-4 py-3 text-start">{language === "ar" ? "الرقم المدني / البنك" : "Civil ID / Bank"}</th>
                      <th className="px-4 py-3 text-end">{language === "ar" ? "الأساسي" : "Basic"}</th>
                      <th className="px-4 py-3 text-end">{language === "ar" ? "البدلات" : "Allowances"}</th>
                      <th className="px-4 py-3 text-end">{language === "ar" ? "المكافآت" : "Bonuses"}</th>
                      <th className="px-4 py-3 text-end">{language === "ar" ? "الاستقطاعات والتأمينات" : "Deductions & PASI"}</th>
                      <th className="px-4 py-3 text-end">{language === "ar" ? "صافي الراتب" : "Net Pay"}</th>
                      <th className="px-4 py-3 text-center">{language === "ar" ? "حالة الصرف" : "Status"}</th>
                      <th className="px-4 py-3 text-center">{language === "ar" ? "الإجراءات والتحكم" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {currentMonthSlips.map((slip) => {
                      const linkedV = vouchers?.find(
                        (v) => (slip.linkedVoucherId && v.id === slip.linkedVoucherId) || (slip.linkedVoucherNumber && v.voucherNumber === slip.linkedVoucherNumber)
                      );

                      return (
                        <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{slip.employeeName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{slip.employeeCode} - {slip.jobTitle}</div>
                            {slip.linkedVoucherNumber && (
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (linkedV && onViewVoucher) {
                                      onViewVoucher(linkedV);
                                    }
                                  }}
                                  className="inline-flex items-center space-x-1 rtl:space-x-reverse px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-mono font-bold rounded-md text-[10px] transition-colors cursor-pointer"
                                  title={language === "ar" ? "عرض سند الصرف المحاسبي" : "View Payment Voucher"}
                                >
                                  <Receipt className="w-3 h-3 text-indigo-600" />
                                  <span>سند صرف #{slip.linkedVoucherNumber}</span>
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-mono text-slate-700">{slip.civilId || "—"}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{slip.bankName || "بنك مسقط"}</div>
                          </td>

                          <td className="px-4 py-3.5 text-end font-mono font-semibold">
                            {slip.basicSalary.toFixed(3)}
                          </td>

                          <td className="px-4 py-3.5 text-end font-mono text-slate-600">
                            {(slip.housingAllowance + slip.transportAllowance + slip.otherAllowances).toFixed(3)}
                          </td>

                          <td className="px-4 py-3.5 text-end font-mono text-emerald-600 font-semibold">
                            <div>+{slip.bonus.toFixed(3)}</div>
                            {slip.bonusReason && (
                              <div className="text-[10px] text-emerald-700 font-normal truncate max-w-[120px] ml-auto rtl:mr-auto" title={slip.bonusReason}>
                                {slip.bonusReason}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-end font-mono text-rose-600">
                            <div>-{(slip.socialSecurityDeduction + slip.deductions).toFixed(3)}</div>
                            {slip.deductionReason && (
                              <div className="text-[10px] text-rose-700 font-normal truncate max-w-[120px] ml-auto rtl:mr-auto" title={slip.deductionReason}>
                                {slip.deductionReason}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-end font-mono font-black text-indigo-700 text-sm">
                            {slip.netSalary.toFixed(3)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 rtl:space-x-reverse ${
                                slip.status === "PAID"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : slip.status === "APPROVED"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {slip.status === "PAID" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              <span>
                                {slip.status === "PAID"
                                  ? (language === "ar" ? "تم الصرف" : "Paid")
                                  : slip.status === "APPROVED"
                                  ? (language === "ar" ? "معتمد للصرف" : "Approved")
                                  : (language === "ar" ? "مسودة" : "Draft")}
                              </span>
                            </span>
                            {slip.paymentDate && slip.status === "PAID" && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{slip.paymentDate}</div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse">
                              {/* Individual Disburse & Edit Button */}
                              <button
                                onClick={() => handleOpenDisburseModal(slip)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 rtl:space-x-reverse transition-colors cursor-pointer shadow-xs"
                                title={language === "ar" ? "التحكم في الراتب وصرفه فردياً وتسجيل المكافآت أو الخصومات" : "Adjust & Disburse Salary"}
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>{language === "ar" ? "تحكم وصرف" : "Adjust"}</span>
                              </button>

                              {/* Payslip Modal Print */}
                              <button
                                onClick={() => {
                                  setSelectedSlipForPrint(slip);
                                  setIsPayslipModalOpen(true);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 rtl:space-x-reverse transition-colors cursor-pointer"
                                title={language === "ar" ? "طباعة قسيمة الراتب الرسمية" : "Print Official Payslip"}
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{language === "ar" ? "قسيمة" : "Slip"}</span>
                              </button>

                              {/* View Accounting Voucher if linked */}
                              {linkedV && onViewVoucher && (
                                <button
                                  onClick={() => onViewVoucher(linkedV)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                                  title={language === "ar" ? "عرض السند المحاسبي فوراً" : "View Accounting Voucher"}
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ATTENDANCE & TIME TRACKING */}
      {/* ========================================================================= */}
      {suiteTab === "attendance" && (
        <div className="space-y-6">
          {/* Quick Clock-in Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base">{language === "ar" ? "بوابة تسجيل الحضور والانصراف السريع" : "Quick Clock-in / Out Portal"}</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {language === "ar" ? "تسجيل فوري لحركات الدخول والخروج لكافة كوادر وموظفي المؤسسة" : "Instant clock-in / clock-out stamp for all staff members"}
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <select
                  value={quickClockInEmpId}
                  onChange={(e) => setQuickClockInEmpId(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-400 font-medium"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.employeeCode} - {e.fullName} ({e.jobTitle})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleQuickClockIn}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors shadow-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === "ar" ? "تسجيل حضور / انصراف" : "Clock In / Out"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-xs font-bold">{language === "ar" ? "الحاضرون في الموعد" : "On-Time Present"}</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{attendanceStats.present}</p>
              <span className="text-[10px] text-slate-400">{language === "ar" ? "التزام كامل" : "full compliance"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-xs font-bold">{language === "ar" ? "تأخيرات الدوام" : "Late Check-ins"}</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{attendanceStats.late}</p>
              <span className="text-[10px] text-slate-400">{language === "ar" ? "بعد الساعة 8:15 ص" : "after 8:15 AM"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-xs font-bold">{language === "ar" ? "إجازات اليوم" : "On Leave Today"}</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{attendanceStats.onLeave}</p>
              <span className="text-[10px] text-slate-400">{language === "ar" ? "إجازات معتمدة" : "approved leaves"}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-xs font-bold">{language === "ar" ? "نسبة الالتزام بالدوام" : "Punctuality Rate"}</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{attendanceStats.punctualityRate}%</p>
              <span className="text-[10px] text-slate-400">{language === "ar" ? "مؤشر الانضباط العام" : "attendance score"}</span>
            </div>
          </div>

          {/* Attendance Date Filter & Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">{language === "ar" ? "تاريخ السجل:" : "Date:"}</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-start">{language === "ar" ? "الموظف" : "Staff Member"}</th>
                    <th className="px-4 py-3 text-start">{language === "ar" ? "القسم والفرع" : "Dept & Branch"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "وقت الدخول" : "Check-in"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "وقت الخروج" : "Check-out"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "ساعات العمل" : "Hours"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "حالة الدوام" : "Status"}</th>
                    <th className="px-4 py-3 text-start">{language === "ar" ? "ملاحظات" : "Notes"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {todayAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        {language === "ar" ? "لا توجد سجلات حضور مسجلة لهذا اليوم" : "No attendance logs recorded for this day"}
                      </td>
                    </tr>
                  ) : (
                    todayAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{rec.employeeName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{rec.employeeCode} - {rec.jobTitle}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div>{rec.department}</div>
                          <div className="text-[11px] text-slate-400">{rec.branchName || "الفرع الرئيسي"}</div>
                        </td>

                        <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-700">
                          {rec.checkIn || "—"}
                        </td>

                        <td className="px-4 py-3.5 text-center font-mono font-bold text-indigo-700">
                          {rec.checkOut || "—"}
                        </td>

                        <td className="px-4 py-3.5 text-center font-mono">
                          {rec.workingHours} س
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : rec.status === "LATE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {rec.status === "PRESENT" ? "حاضر في الموعد" : rec.status === "LATE" ? "متأخر" : "في إجازة"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {rec.notes || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LEAVES & ABSENCE */}
      {/* ========================================================================= */}
      {suiteTab === "leaves" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">{language === "ar" ? "سجل طلبات الإجازات والغياب" : "Leave & Absence Requests"}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{language === "ar" ? "متابعة طلبات الإجازات السنوية، المرضية، والطارئة مع الموافقات" : "Track leave requests, approvals and staff balances"}</p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 rtl:space-x-reverse transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === "ar" ? "طلب إجازة جديد" : "New Leave Request"}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-start">{language === "ar" ? "الموظف" : "Employee"}</th>
                    <th className="px-4 py-3 text-start">{language === "ar" ? "نوع الإجازة" : "Leave Type"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "من تاريخ" : "From"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "إلى تاريخ" : "To"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "الأيام" : "Days"}</th>
                    <th className="px-4 py-3 text-start">{language === "ar" ? "السبب" : "Reason"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-3 text-center">{language === "ar" ? "الإجراء" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{req.employeeName}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {req.leaveType === "ANNUAL" ? "إجازة سنوية" : req.leaveType === "SICK" ? "إجازة مرضية" : "إجازة طارئة"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">{req.startDate}</td>
                      <td className="px-4 py-3.5 text-center font-mono">{req.endDate}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold">{req.daysCount} يوم</td>
                      <td className="px-4 py-3.5 text-slate-600 text-[11px]">{req.reason || "—"}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status === "APPROVED" ? "معتمدة" : req.status === "REJECTED" ? "مرفوضة" : "قيد المراجعة"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {req.status === "PENDING" && (
                          <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                            <button
                              onClick={() => handleUpdateLeaveStatus(req.id, "APPROVED")}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                            >
                              موافقة
                            </button>
                            <button
                              onClick={() => handleUpdateLeaveStatus(req.id, "REJECTED")}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 transition-colors"
                            >
                              رفض
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: KIOSK MOVEMENTS & AUDIT DASHBOARD */}
      {/* ========================================================================= */}
      {suiteTab === "kiosk_movements" && (
        <EmployeeMovementDashboard
          employees={employees}
          branches={branches}
          companySettings={companySettings}
          devices={kioskDevicesList}
          movementTypes={movementTypesList}
          movementLogs={movementLogsList}
          adjustments={adjustmentsList}
          activeDeviceId={activeKioskDeviceId}
          onSaveDevices={handleSaveKioskDevices}
          onSaveMovementTypes={handleSaveMovementTypes}
          onSaveMovementLogs={handleSaveMovementLogs}
          onSaveAdjustments={handleSaveAdjustments}
          onSelectActiveDevice={(id) => {
            setActiveKioskDeviceId(id);
            saveActiveKioskDeviceId(id);
          }}
          onOpenKioskModal={() => setIsKioskModalOpen(true)}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 6: GENERIC REQUESTS & DYNAMIC FORMS ENGINE */}
      {/* ========================================================================= */}
      {suiteTab === "requests" && (
        <RequestsDashboard
          employees={employees}
          branches={branches}
          currentEmployee={employees.find((e) => e.id === activeEmployeeId)}
          companySettings={companySettings}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 7: EMPLOYMENT CONTRACTS & END OF SERVICE (EOSB) */}
      {/* ========================================================================= */}
      {suiteTab === "contracts" && (
        <EmploymentContractsManager
          contracts={contractsList}
          employees={employees}
          companySettings={companySettings}
          onSaveContract={handleSaveContract}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PERFORMANCE APPRAISALS & KPIS */}
      {/* ========================================================================= */}
      {suiteTab === "performance" && (
        <PerformanceManager
          reviews={reviewsList}
          goals={goalsList}
          kpis={kpisList}
          employees={employees}
          companySettings={companySettings}
          onSaveReview={handleSaveReview}
          onSaveGoal={handleSaveGoal}
          onSaveKPI={handleSaveKPI}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 9: TRAINING PROGRAMS & SKILLS */}
      {/* ========================================================================= */}
      {suiteTab === "training" && (
        <TrainingManager
          courses={coursesList}
          trainingRecords={trainingRecordsList}
          certificates={certificatesList}
          employees={employees}
          companySettings={companySettings}
          onSaveCourse={handleSaveCourse}
          onSaveTrainingRecord={handleSaveTrainingRecord}
          onSaveCertificate={handleSaveCertificate}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 10: DISCIPLINARY ACTIONS & AUDIT */}
      {/* ========================================================================= */}
      {suiteTab === "disciplinary" && (
        <DisciplinaryManager
          disciplinaryActions={disciplinaryList}
          employees={employees}
          companySettings={companySettings}
          onSaveDisciplinaryAction={handleSaveDisciplinary}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 11: RECOGNITIONS & AWARDS */}
      {/* ========================================================================= */}
      {suiteTab === "recognition" && (
        <RecognitionManager
          recognitions={recognitionsList}
          employees={employees}
          companySettings={companySettings}
          onSaveRecognition={handleSaveRecognition}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 12: CAREER TIMELINE & PROMOTIONS */}
      {/* ========================================================================= */}
      {suiteTab === "career" && (
        <CareerHistoryManager
          careerHistories={careerHistoriesList}
          employees={employees}
          companySettings={companySettings}
          onSaveCareerHistory={handleSaveCareerHistory}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 13: CONFIDENTIAL DOCUMENTS ARCHIVE */}
      {/* ========================================================================= */}
      {suiteTab === "documents" && (
        <EmployeeDocumentsManager
          documents={documentsList}
          employees={employees}
          companySettings={companySettings}
          onSaveDocument={handleSaveDocument}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 14: CELEBRATIONS, EVENTS & WHATSAPP GREETINGS */}
      {/* ========================================================================= */}
      {suiteTab === "events" && (
        <EmployeeEventsCenter
          employees={employees}
          greetings={greetingsList}
          companySettings={companySettings}
          onSaveGreeting={handleSaveGreeting}
          onOpen360Modal={handleOpen360Modal}
          onAuditLog={onAuditLog}
        />
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Official Payslip Modal */}
      <OfficialPayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        slip={selectedSlipForPrint}
        companySettings={companySettings}
      />

      {/* 2. Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingEmployee ? (language === "ar" ? "تعديل بيانات الموظف والصلاحيات" : "Edit Staff Profile") : (language === "ar" ? "إضافة موظف جديد وتعيين الصلاحيات" : "Add New Employee")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEmployee} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الاسم الكامل (عربي) *" : "Full Name (Arabic) *"}</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="محمد بن عبد الله الشحي"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الاسم بالإنجليزية" : "Full Name (English)"}</label>
                  <input
                    type="text"
                    value={formData.fullNameEn}
                    onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
                    placeholder="Said Rashid Al-Shehhi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الرقم الوظيفي *" : "Employee Code *"}</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الرقم المدني" : "Civil / National ID"}</label>
                  <input
                    type="text"
                    value={formData.civilId}
                    onChange={(e) => setFormData({ ...formData, civilId: e.target.value })}
                    placeholder="109847291"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "المسمى الوظيفي *" : "Job Title *"}</label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="مدير المبيعات والعقود"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "القسم / الإدارة" : "Department"}</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الدور والصلاحية *" : "Role & RBAC *"}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as EmployeeRole;
                      setFormData({
                        ...formData,
                        role: newRole,
                        permissions: ROLE_DEFAULT_PERMISSIONS[newRole] || []
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {language === "ar" ? v.ar : v.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الفرع المخصص" : "Assigned Branch"}</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الراتب الأساسي *" : "Basic Salary *"}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "إجمالي البدلات" : "Allowances"}</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "البنك المعتمد" : "Bank Name"}</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="بنك مسقط / بنك ظفار"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "رقم الحساب الدولي (IBAN)" : "Bank IBAN"}</label>
                  <input
                    type="text"
                    value={formData.bankIban}
                    onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
                    placeholder="OM4500010000000012345678901"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+968 99482019"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="said@digititech.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

              </div>

              {/* Kiosk PIN Code Management Section */}
              <div className="bg-linear-to-r from-indigo-50/80 via-white to-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-950">
                    <Key className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-extrabold">
                      {language === "ar" ? "رمز PIN السريع لكشك الحضور اللوحي (Kiosk PIN)" : "Tablet Kiosk Fast PIN Code"}
                    </h4>
                  </div>
                  {existingPinRecord ? (
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                      {existingPinRecord.isLocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <Lock className="w-3 h-3 me-1" />
                          {language === "ar" ? "الرمز مقفل أمنياً" : "PIN Locked"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 me-1" />
                          {language === "ar" ? "مفعّل ومحمي بتشفير Hash" : "Active & Hash Encrypted"}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <Sparkles className="w-3 h-3 me-1" />
                      {language === "ar" ? "رمز جديد" : "New PIN"}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === "ar"
                    ? "رمز من 4 إلى 6 أرقام يستخدمه الموظف للتعريف السريع وتسجيل الحركات على شاشة الكشك التفاعلية دون الحاجة لكتابة كلمات مرور معقدة."
                    : "4-6 digit numeric PIN used for swift identity verification and clocking on the tablet kiosk."}
                </p>

                {existingPinRecord?.isLocked && (
                  <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{language === "ar" ? "تم قفل رمز الـ PIN بسبب محاولات غير مصرح بها متكررة." : "PIN locked due to excessive failed attempts."}</span>
                    </div>
                    {formData.id && (
                      <button
                        type="button"
                        onClick={() => handleUnlockEmployeePinInModal(formData.id!)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1 rtl:space-x-reverse"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>{language === "ar" ? "إلغاء القفل الآن" : "Unlock PIN"}</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === "ar" ? "رمز PIN (4 إلى 6 أرقام)" : "PIN Code (4-6 digits)"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPinPlain ? "text" : "password"}
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={formData.kioskPin}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setFormData({ ...formData, kioskPin: digitsOnly });
                        }}
                        placeholder={
                          existingPinRecord
                            ? (language === "ar" ? "●●●● (اتركه فارغاً للإبقاء عليه)" : "●●●● (Leave blank to keep)")
                            : (language === "ar" ? "مثال: 1234" : "e.g. 1234")
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest text-indigo-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPinPlain(!showPinPlain)}
                        className="absolute end-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title={showPinPlain ? "إخفاء الرمز" : "إظهار الرمز"}
                      >
                        {showPinPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end space-x-2 rtl:space-x-reverse">
                    <button
                      type="button"
                      onClick={() => {
                        const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                        setFormData({ ...formData, kioskPin: randomPin });
                        setShowPinPlain(true);
                      }}
                      className="px-3 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 rtl:space-x-reverse"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{language === "ar" ? "توليد رمز تلقائي" : "Generate PIN"}</span>
                    </button>
                    {existingPinRecord && (
                      <span className="text-[10px] text-slate-400 pb-2">
                        {language === "ar" ? "آخر تحديث: " + existingPinRecord.updatedAt.split("T")[0] : "Updated: " + existingPinRecord.updatedAt.split("T")[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Governance & Caps Section */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3 mt-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-slate-800">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold">
                    {language === "ar" ? "سقف الرواتب والمكافآت وخزينة الصرف (الحوكمة المالية)" : "Financial Caps & Bonus Treasury Control"}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  {language === "ar"
                    ? "تحديد سقف أقصى للرواتب والمكافآت لمنع تجاوز الميزانية، وتحديد خزينة أو حساب الصرف التلقائي لسندات الخزينة."
                    : "Set maximum caps for monthly payroll and bonuses to prevent over-budgeting, and set preferred treasury for vouchers."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === "ar" ? "سقف الراتب الشهري الأقصى" : "Max Monthly Salary Cap"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="مثال: 1500 (اختياري)"
                        value={formData.maxSalaryCap !== undefined ? formData.maxSalaryCap : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, maxSalaryCap: val === "" ? undefined : parseFloat(val) });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute end-3 top-2.5 text-[10px] font-bold text-slate-400">
                        {companySettings.currency || "OMR"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === "ar" ? "سقف المكافأة الواحدة الأقصى" : "Max Bonus Cap"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="مثال: 300 (اختياري)"
                        value={formData.maxBonusCap !== undefined ? formData.maxBonusCap : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, maxBonusCap: val === "" ? undefined : parseFloat(val) });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-amber-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute end-3 top-2.5 text-[10px] font-bold text-slate-400">
                        {companySettings.currency || "OMR"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === "ar" ? "خزينة صرف المكافآت المعتمدة" : "Bonus Treasury Account"}
                    </label>
                    <select
                      value={formData.preferredBonusTreasury || "الخزينة النقدية الرئيسية"}
                      onChange={(e) => setFormData({ ...formData, preferredBonusTreasury: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="الخزينة النقدية الرئيسية">الخزينة النقدية الرئيسية (Main Cash)</option>
                      <option value="حساب بنك مسقط الجاري">حساب بنك مسقط الجاري (Bank Muscat)</option>
                      <option value="حساب بنك ظفار التجاري">حساب بنك ظفار التجاري (Bank Dhofar)</option>
                      <option value="العهدة النقدية للموارد البشرية">العهدة النقدية للموارد البشرية (Petty Cash)</option>
                      <option value="خزينة الفرع الميداني">خزينة الفرع الميداني (Branch Treasury)</option>
                    </select>
                  </div>
                </div>
              </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2 rtl:space-x-reverse shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {language === "ar" ? "حفظ البيانات" : "Save Employee"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 3. Manual Attendance Modal */}
      {isAddAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <h3 className="font-bold text-sm">{language === "ar" ? "تسجيل حضور وانصراف يدوي" : "Manual Attendance Stamp"}</h3>
              <button type="button" onClick={() => setIsAddAttendanceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الموظف" : "Staff Member"}</label>
                <select
                  value={manualAttForm.employeeId}
                  onChange={(e) => setManualAttForm({ ...manualAttForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.employeeCode} - {e.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "التاريخ" : "Date"}</label>
                <input
                  type="date"
                  value={manualAttForm.date}
                  onChange={(e) => setManualAttForm({ ...manualAttForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "وقت الدخول" : "Check-in"}</label>
                  <input
                    type="time"
                    value={manualAttForm.checkIn}
                    onChange={(e) => setManualAttForm({ ...manualAttForm, checkIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "وقت الخروج" : "Check-out"}</label>
                  <input
                    type="time"
                    value={manualAttForm.checkOut}
                    onChange={(e) => setManualAttForm({ ...manualAttForm, checkOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "حالة الدوام" : "Status"}</label>
                <select
                  value={manualAttForm.status}
                  onChange={(e) => setManualAttForm({ ...manualAttForm, status: e.target.value as AttendanceStatus })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="PRESENT">حاضر في الموعد (Present)</option>
                  <option value="LATE">متأخر (Late)</option>
                  <option value="ON_LEAVE">في إجازة (On Leave)</option>
                  <option value="MISSION">مهمة عمل خارجية (Mission)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "ملاحظات" : "Notes"}</label>
                <input
                  type="text"
                  value={manualAttForm.notes}
                  onChange={(e) => setManualAttForm({ ...manualAttForm, notes: e.target.value })}
                  placeholder="سبب التأخير أو طبيعة المهمة"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              </div>

              <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 rtl:space-x-reverse shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddAttendanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  تسجيل الحضور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Request Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <h3 className="font-bold text-sm">{language === "ar" ? "تقديم طلب إجازة رسمي" : "Submit Leave Request"}</h3>
              <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "الموظف مقدم الطلب" : "Staff Member"}</label>
                <select
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.employeeCode} - {e.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "نوع الإجازة" : "Leave Type"}</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                >
                  <option value="ANNUAL">إجازة اعتيادية سنوية</option>
                  <option value="SICK">إجازة مرضية معتمدة</option>
                  <option value="EMERGENCY">إجازة طارئة</option>
                  <option value="UNPAID">إجازة بدون راتب</option>
                  <option value="HAJJ">إجازة حج</option>
                  <option value="MATERNITY">إجازة أمومة ورعاية</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "تاريخ البداية" : "Start Date"}</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "تاريخ النهاية" : "End Date"}</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "عدد الأيام" : "Days Count"}</label>
                <input
                  type="number"
                  min="1"
                  value={leaveForm.daysCount}
                  onChange={(e) => setLeaveForm({ ...leaveForm, daysCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{language === "ar" ? "سبب الإجازة" : "Reason"}</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="إجازة سنوية اعتيادية"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              </div>

              <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 rtl:space-x-reverse shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  اعتماد الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteConfirmationEmp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === "ar" ? "حذف الموظف من النظام؟" : "Delete Employee Profile?"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === "ar"
                  ? `هل أنت متأكد من رغبتك في حذف الموظف «${deleteConfirmationEmp.fullName}»؟`
                  : `Are you sure you want to delete ${deleteConfirmationEmp.fullName}?`}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse pt-2">
              <button
                onClick={() => setDeleteConfirmationEmp(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {language === "ar" ? "تراجع" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteEmployee}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                {language === "ar" ? "نعم، حذف الموظف" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Individual Salary Disbursement & Adjustment Modal */}
      <IndividualSalaryDisbursementModal
        isOpen={isDisburseModalOpen}
        onClose={() => {
          setIsDisburseModalOpen(false);
          setDisbursingSlip(null);
          setDisbursingEmployee(null);
        }}
        payrollSlip={disbursingSlip}
        employee={disbursingEmployee}
        employees={employees}
        currentMonth={selectedPayrollMonth}
        companySettings={companySettings}
        onSaveSlip={handleSaveDisbursedSlip}
        onViewVoucher={(voucherId) => {
          const v = vouchers?.find((item) => item.id === voucherId || item.voucherNumber === voucherId);
          if (v && onViewVoucher) {
            setIsDisburseModalOpen(false);
            onViewVoucher(v);
          }
        }}
      />

      {/* 7. Instant Bonus Disbursement & Treasury Voucher Modal */}
      <InstantBonusModal
        isOpen={isInstantBonusModalOpen}
        onClose={() => {
          setIsInstantBonusModalOpen(false);
          setBonusEmployee(null);
        }}
        employee={bonusEmployee}
        companySettings={companySettings}
        onDisburseBonus={handleSaveInstantBonus}
        onViewVoucher={(voucherId) => {
          const v = vouchers?.find((item) => item.id === voucherId || item.voucherNumber === voucherId);
          if (v && onViewVoucher) {
            setIsInstantBonusModalOpen(false);
            onViewVoucher(v);
          }
        }}
      />

      {/* 8. Attendance Tablet Kiosk Modal */}
      <AttendanceKioskModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        employees={employees}
        branches={branches}
        companySettings={companySettings}
        kioskDevices={kioskDevicesList}
        movementTypes={movementTypesList}
        movementLogs={movementLogsList}
        activeDeviceId={activeKioskDeviceId}
        onSaveMovementLog={handleSaveMovementLogSingle}
        onAuditLog={onAuditLog}
      />

      {/* 9. Comprehensive Employee 360 Profile Modal */}
      <Employee360Modal
        isOpen={is360ModalOpen}
        onClose={() => {
          setIs360ModalOpen(false);
          setSelected360EmployeeId(null);
        }}
        employeeId={selected360EmployeeId}
        employees={employees}
        contracts={contractsList}
        attendanceRecords={attendanceRecords}
        payrollSlips={payrollSlips}
        leaveRequests={leaveRequests}
        reviews={reviewsList}
        goals={goalsList}
        kpis={kpisList}
        courses={coursesList}
        trainingRecords={trainingRecordsList}
        certificates={certificatesList}
        disciplinaryActions={disciplinaryList}
        recognitions={recognitionsList}
        careerHistories={careerHistoriesList}
        documents={documentsList}
        greetings={greetingsList}
        companySettings={companySettings}
      />

    </div>
  );
};
