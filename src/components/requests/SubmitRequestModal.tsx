import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  User,
  Paperclip,
  ArrowRight,
  Receipt,
  Award,
  Globe2,
  Coins,
  Laptop,
  ShoppingCart,
  DoorOpen,
  UserCheck
} from 'lucide-react';
import { RequestTypeConfig, Employee, Branch, EmployeeRequest, RequestCategory } from '../../types';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import { createEmployeeRequest } from '../../utils/requestsStorage';
import { useLanguage } from '../../utils/LanguageContext';

interface SubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestTypes: RequestTypeConfig[];
  employees: Employee[];
  branches: Branch[];
  currentEmployee?: Employee;
  companySettings?: any;
  onSuccess: (newReq: EmployeeRequest) => void;
}

// Icon mapping helper
const getCategoryIcon = (category: RequestCategory) => {
  switch (category) {
    case 'DOCUMENTS':
      return FileCheck2;
    case 'FINANCIAL':
      return Coins;
    case 'ASSETS':
      return Laptop;
    case 'PROCUREMENT':
      return ShoppingCart;
    case 'ADMINISTRATIVE':
      return DoorOpen;
    case 'HR':
      return UserCheck;
    default:
      return FileText;
  }
};

export const SubmitRequestModal: React.FC<SubmitRequestModalProps> = ({
  isOpen,
  onClose,
  requestTypes,
  employees,
  branches,
  currentEmployee,
  companySettings,
  onSuccess
}) => {
  const { language } = useLanguage();

  const [step, setStep] = useState<'SELECT_TYPE' | 'FILL_FORM' | 'SUCCESS'>('SELECT_TYPE');
  const [selectedType, setSelectedType] = useState<RequestTypeConfig | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    currentEmployee?.id || employees[0]?.id || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [createdRequest, setCreatedRequest] = useState<EmployeeRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync selected employee
  useEffect(() => {
    if (currentEmployee?.id) {
      setSelectedEmployeeId(currentEmployee.id);
    } else if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [currentEmployee, employees]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_TYPE');
      setSelectedType(null);
      setFormValues({});
      setFormErrors({});
      setCreatedRequest(null);
      setIsSubmitting(false);
      setSearchQuery('');
      setSelectedCategory('ALL');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  // Filter request types
  const filteredTypes = requestTypes.filter((t) => {
    if (!t.isActive) return false;
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName =
        t.nameAr.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.descriptionAr.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  const handleSelectType = (typeConfig: RequestTypeConfig) => {
    setSelectedType(typeConfig);
    // Initialize default values for fields
    const initialVals: Record<string, any> = {};
    (typeConfig.fields || []).forEach((f) => {
      if (f.defaultValue !== undefined) {
        initialVals[f.id] = f.defaultValue;
      }
    });
    setFormValues(initialVals);
    setFormErrors({});
    setStep('FILL_FORM');
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear field error on edit
    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Validate dynamic fields
  const validateForm = (): boolean => {
    if (!selectedType) return false;
    const errors: Record<string, string> = {};

    selectedType.fields.forEach((field) => {
      const val = formValues[field.id];

      // Check required
      if (field.required) {
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (typeof val === 'object' && !val.fileName)
        ) {
          errors[field.id] =
            language === 'ar' ? 'هذا الحقل إجباري لإتمام الطلب' : 'This field is required';
        }
      }

      // Check min/max for numbers
      if (field.type === 'number' || field.type === 'currency') {
        if (val !== undefined && val !== '') {
          if (field.validation?.min !== undefined && Number(val) < field.validation.min) {
            errors[field.id] =
              language === 'ar'
                ? `الحد الأدنى المسموح به هو ${field.validation.min}`
                : `Minimum allowed value is ${field.validation.min}`;
          }
          if (field.validation?.max !== undefined && Number(val) > field.validation.max) {
            errors[field.id] =
              language === 'ar'
                ? `الحد الأقصى المسموح به هو ${field.validation.max}`
                : `Maximum allowed value is ${field.validation.max}`;
          }
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit request handler
  const handleSubmit = () => {
    if (!selectedType || !activeEmployee) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Collect attachments from fields
      const attachmentsList: Array<{ fileName: string; fileSize: number; fileType: string; dataUrl?: string }> = [];
      Object.keys(formValues).forEach((key) => {
        const val = formValues[key];
        if (val && typeof val === 'object' && val.fileName) {
          attachmentsList.push(val);
        }
      });

      const newReq = createEmployeeRequest(
        selectedType,
        activeEmployee,
        formValues,
        attachmentsList,
        companySettings
      );

      setCreatedRequest(newReq);
      setStep('SUCCESS');
      onSuccess(newReq);
    } catch (err) {
      console.error('Error submitting request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {step === 'SELECT_TYPE' && (language === 'ar' ? 'تقديم طلب ونموذج جديد' : 'Submit New Request')}
                {step === 'FILL_FORM' && selectedType && (language === 'ar' ? selectedType.nameAr : selectedType.nameEn)}
                {step === 'SUCCESS' && (language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Request Submitted Successfully')}
              </h3>
              <p className="text-xs text-slate-500">
                {step === 'SELECT_TYPE' && (language === 'ar' ? 'اختر نوع الطلب أو المستند المطلوب من القائمة المصنفة' : 'Select request type from the catalog')}
                {step === 'FILL_FORM' && (language === 'ar' ? 'يرجى تعبئة الحقول والمرفقات المطلوبة أدناه' : 'Fill required dynamic fields')}
                {step === 'SUCCESS' && (language === 'ar' ? 'تم تسجيل حركات الطلب ومسارات الاعتماد' : 'Request logged in workflow engine')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {step === 'FILL_FORM' && (
              <button
                type="button"
                onClick={() => setStep('SELECT_TYPE')}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'ar' ? '← العودة للأنواع' : '← Back to Types'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: SELECT REQUEST TYPE FROM CATALOG */}
          {/* ========================================================================= */}
          {step === 'SELECT_TYPE' && (
            <div className="space-y-6">
              {/* Employee Selection Bar */}
              <div className="bg-indigo-50/60 border border-indigo-100/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {activeEmployee ? activeEmployee.fullName.charAt(0) : 'U'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-indigo-700 block">
                      {language === 'ar' ? 'الموظف مقدم الطلب (Applicant Profile)' : 'Applicant Profile'}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-950">
                      {activeEmployee?.fullName} ({activeEmployee?.employeeCode}) - {activeEmployee?.jobTitle}
                    </span>
                  </div>
                </div>

                {employees.length > 1 && (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap">
                      {language === 'ar' ? 'تغيير الموظف:' : 'Change:'}
                    </span>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Category Pills */}
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
                  {[
                    { id: 'ALL', labelAr: 'الكل', labelEn: 'All Types' },
                    { id: 'DOCUMENTS', labelAr: 'المستندات والشهادات', labelEn: 'Documents' },
                    { id: 'FINANCIAL', labelAr: 'المالية والسلفيات', labelEn: 'Financial' },
                    { id: 'ADMINISTRATIVE', labelAr: 'إدارية وخروج', labelEn: 'Admin' },
                    { id: 'ASSETS', labelAr: 'العهد والأجهزة', labelEn: 'Assets' },
                    { id: 'PROCUREMENT', labelAr: 'الشراء والمشتريات', labelEn: 'Procurement' },
                    { id: 'HR', labelAr: 'الموارد البشرية', labelEn: 'HR' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {language === 'ar' ? cat.labelAr : cat.labelEn}
                    </button>
                  ))}
                </div>

                {/* Search Field */}
                <div className="relative w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'بحث في أنواع الطلبات...' : 'Search request types...'}
                    className="w-full px-3.5 py-2 pe-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute end-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Grid of Request Types Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredTypes.map((typeConfig) => {
                  const IconComponent = getCategoryIcon(typeConfig.category);

                  return (
                    <div
                      key={typeConfig.id}
                      onClick={() => handleSelectType(typeConfig)}
                      className="group p-4 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="p-2.5 bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 rounded-xl transition-colors">
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            {typeConfig.isAutoApproved ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Zap className="w-3 h-3 me-0.5 text-emerald-600" />
                                {language === 'ar' ? 'إصدار فوري تلقائي' : 'Instant Auto'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 me-0.5 text-amber-600" />
                                {typeConfig.slaHours} {language === 'ar' ? 'ساعة SLA' : 'hrs'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-950 transition-colors">
                          {language === 'ar' ? typeConfig.nameAr : typeConfig.nameEn}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {language === 'ar' ? typeConfig.descriptionAr : typeConfig.descriptionEn}
                        </p>
                      </div>

                      {/* Bottom Footer Details */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-indigo-600 font-bold">
                        <span>
                          {typeConfig.fields.length} {language === 'ar' ? 'حقول مطلوبة' : 'fields'}
                        </span>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse text-indigo-600">
                          <span>{language === 'ar' ? 'تعبئة النموذج' : 'Fill Form'}</span>
                          {language === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTypes.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    {language === 'ar' ? 'لا توجد أنواع طلبات مطابقة لبحثك' : 'No matching request types found'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: FILL DYNAMIC FORM */}
          {/* ========================================================================= */}
          {step === 'FILL_FORM' && selectedType && (
            <div className="space-y-6">
              {/* Type Summary Banner */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-extrabold font-mono">
                      {selectedType.code}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {language === 'ar' ? selectedType.nameAr : selectedType.nameEn}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'ar' ? selectedType.descriptionAr : selectedType.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                  {selectedType.isAutoApproved ? (
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 text-xs font-bold">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'ar' ? 'اعتماد وإصدار تلقائي فوري' : 'Auto-Approved System'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-indigo-900 text-xs font-bold">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>
                        {selectedType.workflowStages.length} {language === 'ar' ? 'مراحل اعتماد' : 'stages'} (SLA: {selectedType.slaHours}h)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <h5 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                  {language === 'ar' ? 'بيانات وحقول الطلب المطلوبة' : 'Required Form Details'}
                </h5>

                <DynamicFormRenderer
                  fields={selectedType.fields}
                  values={formValues}
                  onChange={handleFieldChange}
                  errors={formErrors}
                  employees={employees}
                  branches={branches}
                />
              </div>

              {/* Workflow Path Preview if requires approvals */}
              {!selectedType.isAutoApproved && selectedType.workflowStages.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-700 block">
                    {language === 'ar' ? 'مسار الاعتماد المتسلسل لهذا الطلب (Workflow Routing):' : 'Workflow Approval Sequence:'}
                  </span>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto py-1">
                    {selectedType.workflowStages.map((stage, idx) => (
                      <div key={idx} className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{language === 'ar' ? stage.stageNameAr : stage.stageNameEn}</span>
                        </div>
                        {idx < selectedType.workflowStages.length - 1 && (
                          <span className="text-slate-400 font-bold">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUCCESS CONFIRMATION */}
          {/* ========================================================================= */}
          {step === 'SUCCESS' && createdRequest && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  {language === 'ar' ? 'تم تسجيل وتقديم الطلب بنجاح!' : 'Request Logged Successfully!'}
                </h4>
                <p className="text-xs font-bold text-slate-500 font-mono">
                  {language === 'ar' ? 'الرقم المرجعي للطلب:' : 'Reference Number:'}{' '}
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{createdRequest.requestNumber}</span>
                </p>
              </div>

              {/* Status Box */}
              <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl text-start space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">{language === 'ar' ? 'نوع الطلب:' : 'Request Type:'}</span>
                  <span className="font-extrabold text-slate-900">{createdRequest.typeNameAr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">{language === 'ar' ? 'الحالة الحالية:' : 'Current Status:'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    {createdRequest.status === 'COMPLETED' ? (language === 'ar' ? 'مكتمل ومصدر' : 'Completed') : (language === 'ar' ? 'قيد المراجعة والاعتماد' : 'Pending Approval')}
                  </span>
                </div>
                {createdRequest.generatedDocument && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-500">{language === 'ar' ? 'رقم المستند الصادر:' : 'Document No:'}</span>
                    <span className="font-mono font-black text-indigo-700">{createdRequest.generatedDocument.documentNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          {step === 'SELECT_TYPE' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}

          {step === 'FILL_FORM' && (
            <>
              <button
                type="button"
                onClick={() => setStep('SELECT_TYPE')}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'الرجوع' : 'Back'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 rtl:space-x-reverse shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? language === 'ar' ? 'جاري التقديم...' : 'Submitting...'
                    : language === 'ar' ? 'إرسال وتثبيت الطلب' : 'Submit Request'}
                </span>
              </button>
            </>
          )}

          {step === 'SUCCESS' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {language === 'ar' ? 'إغلاق والعودة للسجل' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
