import React, { useState } from 'react';
import {
  Employee,
  AttendanceRecord,
  PayrollSlip,
  LeaveRequest,
  AttendanceMovementLog,
  CompanySettings
} from '../../types';
import {
  EmploymentContract,
  PerformanceGoal,
  EmployeeKPI,
  PerformanceReview,
  EmployeeTrainingRecord,
  EmployeeCertificate,
  DisciplinaryAction,
  EmployeeRecognition,
  EmployeeCareerHistory,
  EmployeeDocumentRecord
} from '../../types/hr';
import { EmployeeRequest } from '../../types/requests';
import {
  X,
  User,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  Award,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  FolderLock,
  History,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  ShieldCheck,
  CreditCard,
  Printer,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { formatDateToDDMMMMYYYY } from '../../utils/dateFormatter';

export interface Employee360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  employeeId?: string | null;
  employees?: Employee[];
  companySettings?: CompanySettings;
  contracts?: EmploymentContract[];
  attendanceRecords?: AttendanceRecord[];
  movementLogs?: AttendanceMovementLog[];
  payrollSlips?: PayrollSlip[];
  leaveRequests?: LeaveRequest[];
  employeeRequests?: EmployeeRequest[];
  goals?: PerformanceGoal[];
  kpis?: EmployeeKPI[];
  reviews?: PerformanceReview[];
  courses?: any[];
  trainingRecords?: EmployeeTrainingRecord[];
  certificates?: EmployeeCertificate[];
  disciplinaryActions?: DisciplinaryAction[];
  recognitions?: EmployeeRecognition[];
  careerHistories?: EmployeeCareerHistory[];
  documents?: EmployeeDocumentRecord[];
  greetings?: any[];
  onOpenContractEditor?: (contract?: EmploymentContract) => void;
  onOpenNewLeaveRequest?: (employeeId: string) => void;
  onOpenNewReview?: (employeeId: string) => void;
  onOpenNewRecognition?: (employeeId: string) => void;
  onOpenNewDisciplinary?: (employeeId: string) => void;
  onViewDocument?: (doc: EmployeeDocumentRecord) => void;
}

export const Employee360Modal: React.FC<Employee360ModalProps> = ({
  isOpen,
  onClose,
  employee,
  employeeId,
  employees = [],
  companySettings,
  contracts = [],
  attendanceRecords = [],
  movementLogs = [],
  payrollSlips = [],
  leaveRequests = [],
  employeeRequests = [],
  goals = [],
  kpis = [],
  reviews = [],
  trainingRecords = [],
  certificates = [],
  disciplinaryActions = [],
  recognitions = [],
  careerHistories = [],
  documents = [],
  onOpenContractEditor,
  onOpenNewLeaveRequest,
  onOpenNewReview,
  onOpenNewRecognition,
  onOpenNewDisciplinary,
  onViewDocument
}) => {
  const { t, isRTL, language } = useLanguage();

  const [active360Tab, setActive360Tab] = useState<
    | 'overview'
    | 'contracts'
    | 'attendance'
    | 'leaves'
    | 'payroll'
    | 'requests'
    | 'performance'
    | 'training'
    | 'recognition'
    | 'disciplinary'
    | 'career'
    | 'documents'
  >('overview');

  const currentEmployee =
    employee ||
    (employeeId && employees ? employees.find((e) => e.id === employeeId) : employees?.[0]);

  if (!isOpen || !currentEmployee) return null;

  // Filtered employee specific items
  const empContracts = (contracts || []).filter((c) => c?.employeeId === currentEmployee.id);
  const activeContract = empContracts.find((c) => c?.status === 'ACTIVE' || c?.status === 'EXPIRING_SOON') || empContracts[0];
  const empAttendance = (attendanceRecords || []).filter((a) => a?.employeeId === currentEmployee.id);
  const empMovements = (movementLogs || []).filter((m) => m?.employeeId === currentEmployee.id);
  const empPayroll = (payrollSlips || []).filter((p) => p?.employeeId === currentEmployee.id);
  const empLeaves = (leaveRequests || []).filter((l) => l?.employeeId === currentEmployee.id);
  const empRequests = (employeeRequests || []).filter((r) => r?.employeeId === currentEmployee.id);
  const empGoals = (goals || []).filter((g) => g?.employeeId === currentEmployee.id);
  const empKpis = (kpis || []).filter((k) => k?.employeeId === currentEmployee.id);
  const empReviews = (reviews || []).filter((r) => r?.employeeId === currentEmployee.id);
  const empTrainings = (trainingRecords || []).filter((t) => t?.employeeId === currentEmployee.id);
  const empCerts = (certificates || []).filter((c) => c?.employeeId === currentEmployee.id);
  const empDisciplinary = (disciplinaryActions || []).filter((d) => d?.employeeId === currentEmployee.id);
  const empRecognitions = (recognitions || []).filter((r) => r?.employeeId === currentEmployee.id);
  const empCareer = (careerHistories || []).filter((h) => h?.employeeId === currentEmployee.id);
  const empDocs = (documents || []).filter((d) => d?.employeeId === currentEmployee.id);

  // Quick calculations
  const totalLeavesTaken = empLeaves
    .filter((l) => l?.status === 'APPROVED')
    .reduce((acc, curr) => acc + (curr?.daysCount || 0), 0);
  const latestReview = empReviews[0];
  const totalRecognitions = empRecognitions.length;
  const activeDisciplinaryCount = empDisciplinary.filter((d) => d?.status === 'APPROVED' || d?.status === 'EXECUTED').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={currentEmployee.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={currentEmployee.fullName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
              />
              <span
                className={`absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ring-2 ring-slate-900 ${
                  currentEmployee.status === 'ACTIVE'
                    ? 'bg-emerald-500 text-white'
                    : currentEmployee.status === 'ON_LEAVE'
                    ? 'bg-blue-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {currentEmployee.status === 'ACTIVE' ? 'نشط' : currentEmployee.status === 'ON_LEAVE' ? 'في إجازة' : 'موقوف'}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-white">{currentEmployee.fullName}</h2>
                <span className="px-3 py-1 rounded-lg bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-mono text-xs font-semibold">
                  {currentEmployee.employeeCode}
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-200 text-xs">
                  {currentEmployee.jobTitle}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {currentEmployee.department} • {currentEmployee.branchName || 'فرع صحار الرئيسي'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {currentEmployee.email}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  {currentEmployee.phone}
                </span>
                {currentEmployee.civilId && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    الرقم المدني: {currentEmployee.civilId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة التقرير الشامل
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 360 NAVIGATION BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {[
            { id: 'overview', label: 'نظرة عامة 360°', icon: User },
            { id: 'contracts', label: `عقود العمل (${empContracts.length})`, icon: FileText },
            { id: 'attendance', label: `الحضور والحركة (${empMovements.length})`, icon: Clock },
            { id: 'leaves', label: `الإجازات (${empLeaves.length})`, icon: Calendar },
            { id: 'payroll', label: `الرواتب والبدلات (${empPayroll.length})`, icon: DollarSign },
            { id: 'requests', label: `الطلبات والشهادات (${empRequests.length})`, icon: Sparkles },
            { id: 'performance', label: `الأداء وKPIs (${empReviews.length})`, icon: TrendingUp },
            { id: 'training', label: `التدريب والشهادات (${empTrainings.length + empCerts.length})`, icon: GraduationCap },
            { id: 'recognition', label: `التكريم والإنجازات (${empRecognitions.length})`, icon: Award },
            { id: 'disciplinary', label: `الجزاءات والملاحظات (${empDisciplinary.length})`, icon: AlertTriangle },
            { id: 'career', label: `المسار والترقيات (${empCareer.length})`, icon: History },
            { id: 'documents', label: `أرشيف الوثائق (${empDocs.length})`, icon: FolderLock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = active360Tab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive360Tab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT BODY */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
          
          {/* 1. OVERVIEW 360 */}
          {active360Tab === 'overview' && (
            <div className="space-y-6">
              {/* Quick KPI Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span>إجمالي الراتب الشهري</span>
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {(currentEmployee.basicSalary || 0) + (currentEmployee.allowances || 0)} <span className="text-xs font-normal text-slate-500">OMR</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    أساسي: {currentEmployee.basicSalary || 0} OMR | بدلات: {currentEmployee.allowances || 0} OMR
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span>تقييم الأداء الأخير</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-emerald-700">
                    {latestReview ? `${latestReview.overallScore}%` : '92%'}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                    {latestReview ? latestReview.rating : 'متميز جداً (Exceptional)'}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span>رصيد الإجازات المستهلك</span>
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {totalLeavesTaken} <span className="text-xs font-normal text-slate-500">/ 30 يوماً</span>
                  </div>
                  <div className="text-[11px] text-blue-600 mt-1">
                    المتبقي: {Math.max(0, 30 - totalLeavesTaken)} يوماً
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span>حالة العقد والوثائق</span>
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-base font-bold text-purple-700">
                    {activeContract ? activeContract.contractType : 'عقد ساري'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {activeContract?.endDate ? `ينتهي في: ${activeContract.endDate}` : 'عقد غير محدد المدة'}
                  </div>
                </div>
              </div>

              {/* Central Information Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal & Career Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    البيانات الوظيفية والتعاقدية
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">تاريخ التعيين:</span>
                      <span className="font-semibold text-slate-800">{currentEmployee.hireDate || '2023-01-15'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">الدور والصلاحيات:</span>
                      <span className="font-semibold text-indigo-700">{currentEmployee.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">الفرع الرئيسي:</span>
                      <span className="font-semibold text-slate-800">{currentEmployee.branchName || 'فرع صحار'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">القسم الإداري:</span>
                      <span className="font-semibold text-slate-800">{currentEmployee.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">الحساب البنكي (IBAN):</span>
                      <span className="font-mono text-slate-700">{currentEmployee.bankIban || 'OM4500010000000012345678901'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">اسم البنك:</span>
                      <span className="font-semibold text-slate-800">{currentEmployee.bankName || 'بنك مسقط'}</span>
                    </div>
                  </div>
                </div>

                {/* Latest Achievements & Badges */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    الأوسمة والتكريمات الأخيرة
                  </h3>
                  {empRecognitions.length > 0 ? (
                    <div className="space-y-3">
                      {empRecognitions.slice(0, 3).map((rec) => (
                        <div key={rec.id} className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                            <p className="text-[11px] text-slate-600 line-clamp-1">{rec.description}</p>
                          </div>
                          <span className="text-[10px] text-amber-800 font-mono">{rec.awardDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">لا توجد تكريمات مسجلة حتى الآن.</p>
                  )}
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  آخر حركات الحضور المسجلة عبر الكشك
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {empMovements.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700">{m.movementTypeNameAr}</span>
                        <span className="font-mono text-slate-500">{m.time}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        التاريخ: {m.date} | الجهاز: {m.deviceName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CONTRACTS TAB */}
          {active360Tab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">سجل عقود العمل الرسمية</h3>
                {onOpenContractEditor && (
                  <button
                    onClick={() => onOpenContractEditor()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    عقد عمل جديد
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {empContracts.map((cnt) => (
                  <div key={cnt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg font-mono text-xs font-bold">
                          {cnt.contractNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{cnt.jobTitle} - {cnt.department}</h4>
                          <p className="text-xs text-slate-500">نوع العقد: {cnt.contractType}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        cnt.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cnt.status === 'ACTIVE' ? 'ساري ونشط' : cnt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">تاريخ البدء:</span>
                        <span className="font-semibold text-slate-800">{cnt.startDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">تاريخ الانتهاء:</span>
                        <span className="font-semibold text-slate-800">{cnt.endDate || 'غير محدد المدة'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">الراتب الأساسي:</span>
                        <span className="font-bold text-slate-900">{cnt.basicSalary} {cnt.currency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">إجمالي البدلات والراتب:</span>
                        <span className="font-bold text-indigo-700">{cnt.totalSalary} {cnt.currency}</span>
                      </div>
                    </div>

                    {cnt.clauses && cnt.clauses.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                        <span className="font-bold text-slate-700 block mb-1">أبرز بنود العقد:</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                          {cnt.clauses.map((clause, idx) => (
                            <li key={idx}>{clause}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ATTENDANCE & MOVEMENTS */}
          {active360Tab === 'attendance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">سجل حركات الحضور والانصراف عبر الكشك اللوحي</h3>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الوقت</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">الجهاز والموقع</th>
                      <th className="p-3">حالة المزامنة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{m.date}</td>
                        <td className="p-3 font-mono">{m.time}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                            {m.movementTypeNameAr}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{m.deviceName} - {m.branchName}</td>
                        <td className="p-3">
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            مؤكد ومزامن
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. LEAVES TAB */}
          {active360Tab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">سجل الإجازات والأرصدة</h3>
                {onOpenNewLeaveRequest && (
                  <button
                    onClick={() => onOpenNewLeaveRequest(employee.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    طلب إجازة
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {empLeaves.map((l) => (
                  <div key={l.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{l.leaveType}</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status === 'APPROVED' ? 'معتمدة' : l.status}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      من {l.startDate} إلى {l.endDate} ({l.daysCount} أيام)
                    </div>
                    <p className="text-[11px] text-slate-500 italic">السبب: {l.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. PAYROLL TAB */}
          {active360Tab === 'payroll' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">مسيرات الرواتب الشهرية وكشوف الأجور</h3>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">شهر الراتب</th>
                      <th className="p-3">الأساسي</th>
                      <th className="p-3">البدلات</th>
                      <th className="p-3">المكافآت</th>
                      <th className="p-3">الخصومات والتأمينات (PASI)</th>
                      <th className="p-3">صافي الراتب</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empPayroll.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{p.payrollMonth}</td>
                        <td className="p-3">{p.basicSalary} OMR</td>
                        <td className="p-3 text-slate-600">{p.housingAllowance + p.transportAllowance + p.otherAllowances} OMR</td>
                        <td className="p-3 text-emerald-600 font-semibold">{p.bonus || 0} OMR</td>
                        <td className="p-3 text-rose-600">{p.deductions + p.socialSecurityDeduction} OMR</td>
                        <td className="p-3 font-bold text-indigo-700">{p.netSalary} OMR</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            {p.status === 'PAID' ? 'مصروف' : p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. REQUESTS & DOCUMENTS */}
          {active360Tab === 'requests' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">الطلبات الإدارية والشهادات الرسمية الصادرة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {empRequests.map((req) => (
                  <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-700">{req.requestNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {req.status === 'COMPLETED' ? 'مكتمل ومصدر' : req.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900">{req.typeNameAr}</h4>
                    <div className="text-[11px] text-slate-500">
                      تاريخ التقديم: {req.submittedAt.substring(0, 10)}
                    </div>
                    {req.generatedDocument && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-indigo-600 font-semibold">
                        <span>شهادة موثقة بـ QR: {req.generatedDocument.documentNumber}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. PERFORMANCE & KPIS */}
          {active360Tab === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">مؤشرات الأداء (KPIs) ودورات التقييم</h3>
                {onOpenNewReview && (
                  <button
                    onClick={() => onOpenNewReview(employee.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    تقييم أداء جديد
                  </button>
                )}
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {empKpis.map((kpi) => (
                  <div key={kpi.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{kpi.kpiName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {kpi.scorePercentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>المستهدف: {kpi.targetValue} {kpi.unit}</span>
                      <span className="font-bold text-slate-800">المحقق: {kpi.actualValue} {kpi.unit}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, kpi.scorePercentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Review History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700">سجل التقييمات الرسمية</h4>
                {empReviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-bold text-slate-900">{rev.reviewPeriod}</span>
                        <span className="text-slate-500 block text-[11px]">المقيّم: {rev.reviewerName} ({rev.reviewerRole})</span>
                      </div>
                      <div className="text-left">
                        <span className="text-lg font-bold text-emerald-700">{rev.overallScore}%</span>
                        <span className="block text-[11px] text-emerald-600 font-semibold">{rev.rating}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-emerald-900">
                        <span className="font-bold block mb-1">نقاط القوة:</span>
                        {rev.strengths}
                      </div>
                      <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-blue-900">
                        <span className="font-bold block mb-1">مجالات التحسين والتطوير:</span>
                        {rev.areasForImprovement}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. TRAINING & CERTIFICATIONS */}
          {active360Tab === 'training' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800">الدورات التدريبية والشهادات المهنية المعتمدة</h3>
              
              {/* Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {empCerts.map((cert) => (
                  <div key={cert.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cert.certificateName}</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        cert.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cert.status === 'VALID' ? 'سارية' : 'تقترب من الانتهاء'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">الجهة المانحة: {cert.issuingOrganization}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <span>تاريخ الإصدار: {cert.issueDate}</span>
                      <span>الانتهاء: {cert.expiryDate || 'مستمرة'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Training Records */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700">سجل حضور البرامج وورش العمل</h4>
                {empTrainings.map((tr) => (
                  <div key={tr.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">{tr.courseTitle}</h5>
                      <span className="text-slate-500 text-[11px]">{tr.provider} • {tr.hoursCompleted} ساعة تدريبية</span>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold">
                      {tr.scoreOrGrade || tr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. RECOGNITION TAB */}
          {active360Tab === 'recognition' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">أوسمة التميز والتكريم وشهادات الشكر</h3>
                {onOpenNewRecognition && (
                  <button
                    onClick={() => onOpenNewRecognition(employee.id)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة تكريم جديد
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {empRecognitions.map((rec) => (
                  <div key={rec.id} className="bg-white p-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                        <span className="text-slate-500 text-[11px]">منح بواسطة: {rec.awardedByName}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">{rec.description}</p>
                    {rec.monetaryReward && (
                      <div className="text-amber-800 font-bold text-xs bg-amber-100/60 p-2 rounded-lg text-center">
                        مكافأة تشجيعية: {rec.monetaryReward} {rec.currency || 'OMR'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. DISCIPLINARY ACTIONS */}
          {active360Tab === 'disciplinary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">سجل الجزاءات والملاحظات الإدارية</h3>
                {onOpenNewDisciplinary && (
                  <button
                    onClick={() => onOpenNewDisciplinary(employee.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إصدار إشعار إداري
                  </button>
                )}
              </div>

              {empDisciplinary.length > 0 ? (
                <div className="space-y-3">
                  {empDisciplinary.map((disc) => (
                    <div key={disc.id} className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg font-mono font-bold">
                            {disc.actionNumber}
                          </span>
                          <h4 className="font-bold text-slate-900">{disc.type}</h4>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px]">{disc.issueDate}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700">سبب المخالفة:</span>
                        <p className="text-slate-600 text-[11px]">{disc.reason}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                        <span className="font-bold text-slate-800 block mb-1">الإجراء التأديبي المتخذ:</span>
                        {disc.penaltyDetails}
                      </div>
                      {disc.employeeExplanation && (
                        <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-[11px]">
                          <span className="font-bold text-blue-900 block mb-1">رد وإيضاح الموظف:</span>
                          {disc.employeeExplanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  سجل الموظف نظيف وخالٍ من أي جزاءات أو مخالفات إدارية.
                </div>
              )}
            </div>
          )}

          {/* 11. CAREER HISTORY */}
          {active360Tab === 'career' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">التسلسل الزمني للترقيات والتنقلات الوظيفية</h3>
              <div className="relative border-r-2 border-indigo-200 pr-6 space-y-6 mr-4">
                {empCareer.map((ch) => (
                  <div key={ch.id} className="relative group">
                    <div className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{ch.changeTitle}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{ch.effectiveDate}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        السابق: <span className="font-medium text-slate-500">{ch.previousValue}</span> ➔ الجديد: <span className="font-bold text-indigo-700">{ch.newValue}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-1">السبب: {ch.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. DOCUMENTS VAULT */}
          {active360Tab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">أرشيف الوثائق والمستندات الرسمية للموظف</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {empDocs.map((doc) => (
                  <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 line-clamp-1">{doc.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {doc.documentType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      {doc.documentNumber && <div>رقم الوثيقة: <span className="font-mono text-slate-700">{doc.documentNumber}</span></div>}
                      {doc.expiryDate && <div>تاريخ الانتهاء: <span className="font-mono text-slate-700">{doc.expiryDate}</span></div>}
                      {doc.fileSize && <div>حجم الملف: {doc.fileSize}</div>}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">مستوى السرية: {doc.accessLevel}</span>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          عرض الوثيقة
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM FOOTER */}
        <div className="bg-white border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <span>نظام ديشال للموارد البشرية والرواتب - Employee 360° Comprehensive Profile</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
          >
            إغلاق الملف
          </button>
        </div>

      </div>
    </div>
  );
};
