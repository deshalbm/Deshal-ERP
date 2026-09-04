import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Zap,
  ShieldCheck,
  Award,
  Download,
  Printer,
  Sliders,
  Layers,
  BarChart3,
  Building2,
  User,
  Calendar,
  AlertTriangle,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Inbox,
  Sparkles,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import {
  EmployeeRequest,
  RequestTypeConfig,
  DocumentTemplate,
  Employee,
  Branch,
  RequestStatus,
  RequestCategory
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import {
  loadEmployeeRequests,
  loadRequestTypes,
  saveRequestTypes,
  loadDocumentTemplates,
  calculateRequestStats,
  processApprovalDecision,
  saveEmployeeRequests
} from '../../utils/requestsStorage';
import { upsertEmployeeRequest, deleteEmployeeRequest } from '../../lib/supabase/requestsService';
import { GeneratedDocumentModal } from './GeneratedDocumentModal';
import { SubmitRequestModal } from './SubmitRequestModal';
import { RequestDetailsModal } from './RequestDetailsModal';
import { ApprovalActionModal } from './ApprovalActionModal';
import { RequestTypeBuilderModal } from './RequestTypeBuilderModal';

interface RequestsDashboardProps {
  employees: Employee[];
  branches: Branch[];
  currentEmployee?: Employee;
  companySettings?: any;
}

export const RequestsDashboard: React.FC<RequestsDashboardProps> = ({
  employees = [],
  branches = [],
  currentEmployee,
  companySettings
}) => {
  const { language } = useLanguage();

  // Storage State
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestTypeConfig[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'my_requests' | 'approvals_inbox' | 'all_requests' | 'type_builder' | 'templates'
  >('my_requests');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<EmployeeRequest | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<any | null>(null);
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<EmployeeRequest | null>(null);
  const [isTypeBuilderOpen, setIsTypeBuilderOpen] = useState<boolean>(false);
  const [editingTypeConfig, setEditingTypeConfig] = useState<RequestTypeConfig | null>(null);

  // Current logged in actor simulation (default to active employee or HR Admin)
  const currentActor = {
    id: currentEmployee?.id || 'emp-current',
    name: currentEmployee?.fullName || 'علي المهري',
    role: currentEmployee?.jobTitle?.includes('مدير') ? 'مدير القسم' : 'إدارة الموارد البشرية (HR)'
  };

  // Load initial data
  useEffect(() => {
    setRequests(loadEmployeeRequests());
    setRequestTypes(loadRequestTypes());
    setDocumentTemplates(loadDocumentTemplates());
  }, []);

  const stats = calculateRequestStats(requests);

  // Refresh lists helper
  const refreshRequests = () => {
    setRequests(loadEmployeeRequests());
  };

  // Handle Approvals Decision
  const handleApprovalDecision = (
    requestId: string,
    decision: 'APPROVE' | 'REJECT' | 'RETURN',
    comments?: string
  ) => {
    const updated = processApprovalDecision(
      requestId,
      decision,
      currentActor,
      comments,
      companySettings
    );
    if (updated) {
      refreshRequests();
      if (selectedRequestForDetails?.id === requestId) {
        setSelectedRequestForDetails(updated);
      }
    }
  };

  // Handle Save Request Type (Builder)
  const handleSaveTypeConfig = (savedType: RequestTypeConfig) => {
    const existingIdx = requestTypes.findIndex((t) => t.id === savedType.id);
    let updatedList: RequestTypeConfig[] = [];
    if (existingIdx >= 0) {
      updatedList = [...requestTypes];
      updatedList[existingIdx] = savedType;
    } else {
      updatedList = [savedType, ...requestTypes];
    }
    setRequestTypes(updatedList);
    saveRequestTypes(updatedList);
  };

  // Filter requests based on tab & criteria
  const getFilteredRequests = () => {
    return requests.filter((req) => {
      // Tab specific segregation
      if (activeTab === 'my_requests') {
        if (currentEmployee?.id && req.employeeId !== currentEmployee.id) {
          // If viewing my requests tab, prioritize requests belonging to current employee if matched
          // But allow viewing all in demo if emp matches or if fallback
        }
      } else if (activeTab === 'approvals_inbox') {
        if (req.status !== 'PENDING_APPROVAL' && req.status !== 'UNDER_REVIEW') {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const typeCfg = requestTypes.find((t) => t.id === req.typeId);
        if (typeCfg && typeCfg.category !== categoryFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = req.requestNumber.toLowerCase().includes(q);
        const matchName = req.employeeName.toLowerCase().includes(q);
        const matchType = req.typeNameAr.toLowerCase().includes(q) || req.typeNameEn.toLowerCase().includes(q);
        if (!matchNumber && !matchName && !matchType) return false;
      }

      return true;
    });
  };

  const filteredRequestsList = getFilteredRequests();
  const pendingApprovalsCount = requests.filter(
    (r) => r.status === 'PENDING_APPROVAL' || r.status === 'UNDER_REVIEW'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Requests */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{stats.totalRequests}</p>
          <span className="text-[10px] text-slate-400 font-bold block">{language === 'ar' ? 'سجل كافة الحركات' : 'All logged requests'}</span>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold">{language === 'ar' ? 'بانتظار الاعتماد' : 'Pending Approval'}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-950 font-mono">{stats.pendingApproval}</p>
          <span className="text-[10px] text-amber-700 font-bold block">{language === 'ar' ? 'تحتاج اتخاذ قرار' : 'Action required'}</span>
        </div>

        {/* Auto Approved Instant */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold">{language === 'ar' ? 'إصدار تلقائي فوري ⚡' : 'Auto Approved'}</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">{stats.autoApprovedCount}</p>
          <span className="text-[10px] text-emerald-700 font-bold block">{language === 'ar' ? 'شهادات موثقة آلياً' : 'Instant certificates'}</span>
        </div>

        {/* Completed & Issued */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[11px] font-bold">{language === 'ar' ? 'مكتملة ومصدرة' : 'Completed'}</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-950 font-mono">{stats.completedCount}</p>
          <span className="text-[10px] text-indigo-700 font-bold block">{language === 'ar' ? 'مع وثيقة رقمية QR' : 'With QR verification'}</span>
        </div>

        {/* SLA Compliance */}
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">{language === 'ar' ? 'التزام SLA' : 'SLA Compliance'}</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{stats.slaComplianceRate}%</p>
          <span className="text-[10px] text-slate-400 font-bold block">
            {language === 'ar' ? 'متوسط الإنجاز:' : 'Avg time:'} {stats.avgProcessingHours}h
          </span>
        </div>
      </div>

      {/* Main Suite Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            {/* 1. My Requests Tab */}
            <button
              onClick={() => {
                setActiveTab('my_requests');
                setStatusFilter('ALL');
              }}
              className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 rtl:space-x-reverse ${
                activeTab === 'my_requests'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{language === 'ar' ? 'طلباتي (بوابة الموظف)' : 'My Requests'}</span>
            </button>

            {/* 2. Approvals Inbox Tab */}
            <button
              onClick={() => {
                setActiveTab('approvals_inbox');
                setStatusFilter('ALL');
              }}
              className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 rtl:space-x-reverse ${
                activeTab === 'approvals_inbox'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>{language === 'ar' ? 'صندوق الموافقات والمهام' : 'Approvals Inbox'}</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {/* 3. All Organization Requests */}
            <button
              onClick={() => {
                setActiveTab('all_requests');
                setStatusFilter('ALL');
              }}
              className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 rtl:space-x-reverse ${
                activeTab === 'all_requests'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'ar' ? 'السجل العام للطلبات والرقابة' : 'All Requests'}</span>
            </button>

            {/* 4. Request Types Dynamic Builder */}
            <button
              onClick={() => setActiveTab('type_builder')}
              className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 rtl:space-x-reverse ${
                activeTab === 'type_builder'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{language === 'ar' ? 'إدارة وتصميم أنواع الطلبات (Builder)' : 'Request Types & Forms'}</span>
            </button>

            {/* 5. Document Templates */}
            <button
              onClick={() => setActiveTab('templates')}
              className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 rtl:space-x-reverse ${
                activeTab === 'templates'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{language === 'ar' ? 'قوالب المستندات والشهادات' : 'Document Templates'}</span>
            </button>
          </div>

          {/* New Request Action Button */}
          <div className="pb-3 flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 rtl:space-x-reverse shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'تقديم طلب جديد' : 'New Request'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1, 2, 3: Requests Table & Filters */}
        {(activeTab === 'my_requests' || activeTab === 'approvals_inbox' || activeTab === 'all_requests') && (
          <div className="p-6 space-y-4">
            {/* Filter Pills and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
              {/* Status Filter Buttons */}
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {[
                  { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
                  { id: 'PENDING_APPROVAL', labelAr: 'بانتظار الموافقة', labelEn: 'Pending' },
                  { id: 'COMPLETED', labelAr: 'مكتملة ومصدرة', labelEn: 'Completed' },
                  { id: 'RETURNED', labelAr: 'معادة للتعديل', labelEn: 'Returned' },
                  { id: 'REJECTED', labelAr: 'مرفوضة', labelEn: 'Rejected' },
                  { id: 'CANCELLED', labelAr: 'ملغية', labelEn: 'Cancelled' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === s.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {language === 'ar' ? s.labelAr : s.labelEn}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث بالرقم أو الموظف أو النوع...' : 'Search by request # or name...'}
                  className="w-full px-3.5 py-2 pe-9 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute end-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Requests Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'رقم الطلب' : 'Request #'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'نوع الطلب' : 'Request Type'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'الموظف مقدم الطلب' : 'Employee'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'تاريخ التقديم' : 'Submitted At'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'المرحلة والحالة' : 'Status & Stage'}</th>
                    <th className="py-3 px-4 text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRequestsList.map((req) => {
                    const isCompleted = req.status === 'COMPLETED';
                    const isPending = req.status === 'PENDING_APPROVAL' || req.status === 'UNDER_REVIEW';
                    const isReturned = req.status === 'RETURNED';
                    const isRejected = req.status === 'REJECTED';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Request Number */}
                        <td className="py-3 px-4 font-mono font-black text-indigo-900">
                          <button
                            onClick={() => setSelectedRequestForDetails(req)}
                            className="hover:underline cursor-pointer"
                          >
                            {req.requestNumber}
                          </button>
                        </td>

                        {/* Request Type Name */}
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <span>{language === 'ar' ? req.typeNameAr : req.typeNameEn}</span>
                            {req.generatedDocument && (
                              <span className="p-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200" title="مستند صادر موثق">
                                <Award className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Employee Name */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{req.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {req.employeeCode} - {req.department}
                          </div>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {new Date(req.submittedAt).toLocaleDateString(language === 'ar' ? 'ar-OM' : 'en-US')}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          {isCompleted && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 me-1 text-emerald-600" />
                              {language === 'ar' ? 'مكتمل ومصدر' : 'Completed'}
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 me-1 text-amber-600" />
                              {language === 'ar' ? 'بانتظار الاعتماد' : 'Pending Approval'}
                            </span>
                          )}
                          {isReturned && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                              <RotateCcw className="w-3 h-3 me-1 text-orange-600" />
                              {language === 'ar' ? 'معاد للتعديل' : 'Returned'}
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 me-1 text-rose-600" />
                              {language === 'ar' ? 'مرفوض' : 'Rejected'}
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end space-x-1.5 rtl:space-x-reverse">
                            {/* If document is generated -> Print button */}
                            {req.generatedDocument && (
                              <button
                                onClick={() => setSelectedDocForPreview(req.generatedDocument)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                title={language === 'ar' ? 'معاينة وطباعة المستند الرسمي' : 'Print Document'}
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}

                            {/* If approver inbox -> Quick Approve button */}
                            {isPending && (
                              <button
                                onClick={() => setSelectedRequestForApproval(req)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 font-bold transition-colors cursor-pointer"
                              >
                                {language === 'ar' ? 'اعتماد / قرار' : 'Decision'}
                              </button>
                            )}

                            {/* View Details */}
                            <button
                              onClick={() => setSelectedRequestForDetails(req)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              {language === 'ar' ? 'التفاصيل' : 'Details'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredRequestsList.length === 0 && (
                <div className="text-center py-12 bg-white">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    {language === 'ar' ? 'لا توجد طلبات مطابقة لمعايير البحث الحالية' : 'No matching requests found'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'ar' ? 'يمكنك تقديم طلب جديد بالضغط على زر "تقديم طلب جديد"' : 'Submit a request to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Dynamic Request Types Builder Manager */}
        {activeTab === 'type_builder' && (
          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-900 text-white p-5 rounded-2xl">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-300" />
                  <span>{language === 'ar' ? 'منظومة إدارة أنواع الطلبات والنماذج (Request Engine)' : 'Request Types Engine'}</span>
                </h4>
                <p className="text-xs text-indigo-200 mt-1">
                  {language === 'ar'
                    ? 'أنشئ وعدّل نماذج وحقول الطلبات وسلاسل الاعتماد دون كتابة كود برمجي'
                    : 'Create and configure custom form fields and approval stages dynamically'}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTypeConfig(null);
                  setIsTypeBuilderOpen(true);
                }}
                className="px-4 py-2 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>{language === 'ar' ? 'إنشاء نوع طلب جديد' : 'New Request Type'}</span>
              </button>
            </div>

            {/* Grid of Configured Request Types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requestTypes.map((typeCfg) => (
                <div
                  key={typeCfg.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md font-mono text-[10px] font-bold">
                        {typeCfg.code}
                      </span>
                      {typeCfg.isAutoApproved ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {language === 'ar' ? 'فوري تلقائي' : 'Instant Auto'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {typeCfg.workflowStages.length} {language === 'ar' ? 'مراحل' : 'stages'}
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-sm text-slate-900">
                      {language === 'ar' ? typeCfg.nameAr : typeCfg.nameEn}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {language === 'ar' ? typeCfg.descriptionAr : typeCfg.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      {typeCfg.fields.length} {language === 'ar' ? 'حقول بالنموذج' : 'fields'}
                    </span>

                    <button
                      onClick={() => {
                        setEditingTypeConfig(typeCfg);
                        setIsTypeBuilderOpen(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {language === 'ar' ? 'تعديل النموذج وسير العمل' : 'Edit Config'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Document Templates */}
        {activeTab === 'templates' && (
          <div className="p-6 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  {language === 'ar' ? 'قوالب الشهادات والمستندات الرسمية المعتمدة' : 'Official Document Templates'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'قوالب جاهزة ومتوافقة مع المعايير العمانية الرسمية، تدمج تلقائياً بيانات الموظف والراتب وتصدر برموز QR مشفرة'
                    : 'Certified bilingual templates with QR verification and automatic field mapping'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {tpl.code}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900">{tpl.nameAr}</h4>
                    <p className="text-xs text-indigo-700 font-mono mt-0.5">{tpl.nameEn}</p>
                    <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                      {tpl.bodyTemplateAr.substring(0, 120)}...
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-emerald-700 font-bold">QR Security ✓</span>
                    <span className="text-slate-400 font-bold">
                      {tpl.hasOfficialStamp ? (language === 'ar' ? 'ختم رسمي' : 'Official Seal') : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Submit Request Modal */}
      <SubmitRequestModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        requestTypes={requestTypes}
        employees={employees}
        branches={branches}
        currentEmployee={currentEmployee}
        companySettings={companySettings}
        onSuccess={(newReq) => {
          refreshRequests();
          setSelectedRequestForDetails(newReq);
        }}
      />

      {/* 2. Request Details Modal */}
      <RequestDetailsModal
        isOpen={Boolean(selectedRequestForDetails)}
        onClose={() => setSelectedRequestForDetails(null)}
        request={selectedRequestForDetails}
        requestTypes={requestTypes}
        currentUser={currentActor}
        onOpenDocument={(doc) => setSelectedDocForPreview(doc)}
        onOpenApprovalModal={(req) => setSelectedRequestForApproval(req)}
        onUpdate={(updated) => {
          refreshRequests();
          setSelectedRequestForDetails(updated);
        }}
      />

      {/* 3. Generated Official Document Preview & Print Modal */}
      <GeneratedDocumentModal
        isOpen={Boolean(selectedDocForPreview)}
        onClose={() => setSelectedDocForPreview(null)}
        document={selectedDocForPreview}
        companySettings={companySettings}
      />

      {/* 4. Approval Action Modal */}
      <ApprovalActionModal
        isOpen={Boolean(selectedRequestForApproval)}
        onClose={() => setSelectedRequestForApproval(null)}
        request={selectedRequestForApproval}
        currentApprover={currentActor}
        onDecision={handleApprovalDecision}
      />

      {/* 5. Request Type Builder Modal */}
      <RequestTypeBuilderModal
        isOpen={isTypeBuilderOpen}
        onClose={() => {
          setIsTypeBuilderOpen(false);
          setEditingTypeConfig(null);
        }}
        editingType={editingTypeConfig}
        documentTemplates={documentTemplates}
        onSave={handleSaveTypeConfig}
      />
    </div>
  );
};
