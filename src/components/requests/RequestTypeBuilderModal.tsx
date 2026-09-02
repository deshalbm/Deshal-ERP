import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  Sparkles,
  Sliders,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Clock,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import {
  RequestTypeConfig,
  RequestFormField,
  WorkflowStage,
  RequestCategory,
  RequestPriority,
  FormFieldType,
  WorkflowApproverType,
  DocumentTemplate
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface RequestTypeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingType: RequestTypeConfig | null;
  documentTemplates: DocumentTemplate[];
  onSave: (savedType: RequestTypeConfig) => void;
}

export const RequestTypeBuilderModal: React.FC<RequestTypeBuilderModalProps> = ({
  isOpen,
  onClose,
  editingType,
  documentTemplates,
  onSave
}) => {
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'general' | 'form_builder' | 'workflow'>('general');

  // Form State
  const [formData, setFormData] = useState<RequestTypeConfig>(() => {
    if (editingType) return JSON.parse(JSON.stringify(editingType));
    return {
      id: `req-type-${Date.now()}`,
      code: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      category: 'ADMINISTRATIVE' as RequestCategory,
      icon: 'FileText',
      color: 'indigo',
      order: 10,
      isActive: true,
      requiresApproval: true,
      isAutoApproved: false,
      allowsCancellation: true,
      allowsResubmit: true,
      slaHours: 24,
      defaultPriority: 'MEDIUM' as RequestPriority,
      fields: [
        {
          id: 'purpose',
          labelAr: 'الغرض وسبب الطلب',
          labelEn: 'Purpose / Reason',
          type: 'text',
          required: true,
          order: 1,
          width: 'full'
        }
      ],
      workflowStages: [
        {
          stageIndex: 0,
          stageNameAr: 'موافقة المشرف المباشر',
          stageNameEn: 'Direct Supervisor Approval',
          approverType: 'DIRECT_MANAGER',
          slaHours: 24,
          isFinalApproval: true
        }
      ],
      documentTemplateId: '',
      generateDocumentOn: 'NEVER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [newOptionLabelAr, setNewOptionLabelAr] = useState<string>('');
  const [newOptionLabelEn, setNewOptionLabelEn] = useState<string>('');
  const [newOptionValue, setNewOptionValue] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Save handler
  const handleSaveAll = () => {
    if (!formData.nameAr.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال اسم نوع الطلب بالعربية' : 'Please enter request type name in Arabic');
      setActiveTab('general');
      return;
    }
    if (formData.fields.length === 0) {
      setError(language === 'ar' ? 'يجب إضافة حقل واحد على الأقل في نموذج الطلب' : 'Add at least one field to the form');
      setActiveTab('form_builder');
      return;
    }

    const prepared = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    onSave(prepared);
    onClose();
  };

  // Add field
  const handleAddField = () => {
    const newField: RequestFormField = {
      id: `field_${Date.now()}`,
      labelAr: language === 'ar' ? 'حقل جديد' : 'New Field',
      labelEn: 'New Field',
      type: 'text',
      required: false,
      order: formData.fields.length + 1,
      width: 'half'
    };
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setEditingFieldIndex(formData.fields.length);
  };

  // Delete field
  const handleDeleteField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
    if (editingFieldIndex === index) setEditingFieldIndex(null);
  };

  // Move field up/down
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= formData.fields.length) return;

    const list = [...formData.fields];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // update orders
    list.forEach((f, idx) => {
      f.order = idx + 1;
    });

    setFormData((prev) => ({ ...prev, fields: list }));
    if (editingFieldIndex === index) setEditingFieldIndex(targetIdx);
  };

  // Add stage to workflow
  const handleAddStage = () => {
    const newStage: WorkflowStage = {
      stageIndex: formData.workflowStages.length,
      stageNameAr: `مرحلة اعتماد ${formData.workflowStages.length + 1}`,
      stageNameEn: `Approval Stage ${formData.workflowStages.length + 1}`,
      approverType: 'HR',
      slaHours: 24,
      isFinalApproval: true
    };
    setFormData((prev) => ({
      ...prev,
      workflowStages: [...prev.workflowStages, newStage]
    }));
  };

  // Delete stage
  const handleDeleteStage = (index: number) => {
    const updated = formData.workflowStages
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, stageIndex: idx }));
    setFormData((prev) => ({ ...prev, workflowStages: updated }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {editingType
                  ? (language === 'ar' ? 'تعديل نوع ونموذج الطلب' : 'Edit Request Type & Form')
                  : (language === 'ar' ? 'منشئ أنواع الطلبات والنماذج الذكي (Request Builder)' : 'Request Type & Form Builder')}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'تخصيص الحقول وسير العمل وقوالب المستندات دون الحاجة لكتابة كود برمجي'
                  : 'Configure dynamic forms, workflows and documents without code'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Builder Tabs */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse px-6 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? '1. الإعدادات العامة والربط' : '1. General Settings'}
          </button>

          <button
            onClick={() => setActiveTab('form_builder')}
            className={`py-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'form_builder'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? '2. بناء حقول النموذج (Form Builder)' : '2. Form Fields Builder'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono">
              {formData.fields.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? '3. مسار وسير العمل (Workflow & Approvals)' : '3. Workflow & Approvals'}</span>
            {formData.isAutoApproved ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {language === 'ar' ? 'تلقائي' : 'Auto'}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {formData.workflowStages.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: GENERAL CONFIG */}
          {/* ========================================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1">
                    {language === 'ar' ? 'اسم الطلب (بالعربية)' : 'Request Name (Arabic)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: طلب شهادة راتب موثقة"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1">
                    {language === 'ar' ? 'اسم الطلب (بالإنجليزية)' : 'Request Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Salary Certificate Request"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1">
                    {language === 'ar' ? 'التصنيف الرئيسي للطلب' : 'Category'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RequestCategory })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden"
                  >
                    <option value="DOCUMENTS">{language === 'ar' ? 'شهادات ومستندات رسمية (DOCUMENTS)' : 'Documents & Certificates'}</option>
                    <option value="FINANCIAL">{language === 'ar' ? 'مالية وسلفيات (FINANCIAL)' : 'Financial & Loans'}</option>
                    <option value="ADMINISTRATIVE">{language === 'ar' ? 'إدارية وخروج ومهمات (ADMIN)' : 'Administrative & Exit'}</option>
                    <option value="ASSETS">{language === 'ar' ? 'عهد وأجهزة تقنية (ASSETS)' : 'Assets & Equipment'}</option>
                    <option value="PROCUREMENT">{language === 'ar' ? 'شراء ومشتريات (PROCUREMENT)' : 'Procurement & Purchases'}</option>
                    <option value="HR">{language === 'ar' ? 'شؤون موظفين وتحديث بيانات (HR)' : 'HR & Profile Updates'}</option>
                    <option value="CUSTOM">{language === 'ar' ? 'نوع مخصص آخر (CUSTOM)' : 'Custom Request'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1">
                    {language === 'ar' ? 'الرمز التعريفي (Code)' : 'Code'}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="REQ-SALARY"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-900 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">
                  {language === 'ar' ? 'وصف تفصيلي للطلب والغرض منه' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="اكتب شرحاً مختصراً يظهر للموظف عند تقديم الطلب..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-hidden"
                />
              </div>

              {/* Document Template Linking & Auto Approval */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'ar' ? 'ربط قوالب المستندات والإصدار الفوري' : 'Document Template Linking'}</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {language === 'ar' ? 'قالب المستند المرتبط (Document Template)' : 'Linked Template'}
                    </label>
                    <select
                      value={formData.documentTemplateId || ''}
                      onChange={(e) => setFormData({ ...formData, documentTemplateId: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden"
                    >
                      <option value="">{language === 'ar' ? '-- بدون مستند رسمي مخرج --' : '-- None (No Document Output) --'}</option>
                      {documentTemplates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.nameAr} ({tpl.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {language === 'ar' ? 'توقيت توليد المستند' : 'Generate Document When'}
                    </label>
                    <select
                      value={formData.generateDocumentOn || 'NEVER'}
                      onChange={(e) => setFormData({ ...formData, generateDocumentOn: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden"
                    >
                      <option value="NEVER">{language === 'ar' ? 'لا يتم توليد مستند (طلب إداري عادي)' : 'Never'}</option>
                      <option value="AUTO_APPROVAL">{language === 'ar' ? 'توليد فوري تلقائي عند التقديم' : 'On Auto-Approval'}</option>
                      <option value="FINAL_APPROVAL">{language === 'ar' ? 'توليد بعد الاعتماد والموافقة النهائية' : 'On Final Approval'}</option>
                    </select>
                  </div>
                </div>

                {/* Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAutoApproved}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isAutoApproved: e.target.checked,
                          requiresApproval: !e.target.checked,
                          generateDocumentOn: e.target.checked && formData.documentTemplateId ? 'AUTO_APPROVAL' : formData.generateDocumentOn
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {language === 'ar' ? 'اعتماد فوري تلقائي ⚡' : 'Auto-Approval ⚡'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {language === 'ar' ? 'بدون انتظار موافقة الإدارة' : 'No approval needed'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowsCancellation}
                      onChange={(e) => setFormData({ ...formData, allowsCancellation: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {language === 'ar' ? 'السماح بالإلغاء' : 'Allow Cancel'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {language === 'ar' ? 'قبل الاعتماد النهائي' : 'Before completion'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {language === 'ar' ? 'مفعل ومتاح للموظفين' : 'Active & Available'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formData.isActive ? (language === 'ar' ? 'نشط بالكتالوج' : 'Visible in catalog') : (language === 'ar' ? 'معطل مؤقتاً' : 'Disabled')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FORM BUILDER */}
          {/* ========================================================================= */}
          {activeTab === 'form_builder' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {language === 'ar' ? 'حقول النموذج الديناميكي' : 'Dynamic Form Fields'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'ar' ? 'أضف الحقول المخصصة ورتبها وحدد شروطها' : 'Add custom fields, types and order'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة حقل جديد' : 'Add Field'}</span>
                </button>
              </div>

              {/* Fields List */}
              <div className="space-y-3">
                {formData.fields.map((field, idx) => {
                  const isEditingThis = editingFieldIndex === idx;

                  return (
                    <div
                      key={field.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isEditingThis
                          ? 'bg-indigo-50/40 border-indigo-400 ring-2 ring-indigo-100'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      {/* Field Summary Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">
                              {field.labelAr || field.labelEn || (language === 'ar' ? 'حقل بدون اسم' : 'Unnamed field')}
                              {field.required && <span className="text-rose-500 font-black ms-1">*</span>}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-700">
                              Type: {field.type} | ID: {field.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveField(idx, 'up')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-white cursor-pointer"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formData.fields.length - 1}
                            onClick={() => handleMoveField(idx, 'down')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-white cursor-pointer"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFieldIndex(isEditingThis ? null : idx)}
                            className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                          >
                            {isEditingThis ? (language === 'ar' ? 'إخفاء' : 'Collapse') : (language === 'ar' ? 'تعديل الخصائص' : 'Edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Field Detailed Editor Form (Expanded) */}
                      {isEditingThis && (
                        <div className="mt-4 pt-4 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              {language === 'ar' ? 'عنوان الحقل (عربي)' : 'Label (Arabic)'}
                            </label>
                            <input
                              type="text"
                              value={field.labelAr}
                              onChange={(e) => {
                                const list = [...formData.fields];
                                list[idx].labelAr = e.target.value;
                                setFormData({ ...formData, fields: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              {language === 'ar' ? 'نوع الحقل (Field Type)' : 'Type'}
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) => {
                                const list = [...formData.fields];
                                list[idx].type = e.target.value as FormFieldType;
                                setFormData({ ...formData, fields: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                            >
                              <option value="text">نص عادي (Text)</option>
                              <option value="textarea">نص متعدد الأسطر (Textarea)</option>
                              <option value="number">رقم (Number)</option>
                              <option value="currency">مبلغ مالي (Currency)</option>
                              <option value="date">تاريخ (Date)</option>
                              <option value="datetime">تاريخ ووقت (Date & Time)</option>
                              <option value="dropdown">قائمة منسدلة (Dropdown)</option>
                              <option value="radio">اختيار مفرد (Radio)</option>
                              <option value="checkbox">خانة اختيار (Checkbox)</option>
                              <option value="attachment">مرفق ملف (Attachment)</option>
                              <option value="employee">اختيار موظف (Employee)</option>
                              <option value="branch">اختيار فرع (Branch)</option>
                              <option value="email">بريد إلكتروني (Email)</option>
                              <option value="phone">رقم هاتف (Phone)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              {language === 'ar' ? 'عرض الحقل بالنموذج' : 'Width'}
                            </label>
                            <select
                              value={field.width || 'half'}
                              onChange={(e) => {
                                const list = [...formData.fields];
                                list[idx].width = e.target.value as any;
                                setFormData({ ...formData, fields: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                            >
                              <option value="full">عرض كامل (Full Width)</option>
                              <option value="half">نصف العرض (Half Width)</option>
                              <option value="third">ثلث العرض (1/3 Width)</option>
                            </select>
                          </div>

                          <div className="flex items-center pt-5">
                            <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => {
                                  const list = [...formData.fields];
                                  list[idx].required = e.target.checked;
                                  setFormData({ ...formData, fields: list });
                                }}
                                className="w-4 h-4 rounded text-rose-600"
                              />
                              <span className="text-xs font-bold text-slate-800">
                                {language === 'ar' ? 'حقل إجباري (Required)' : 'Required Field'}
                              </span>
                            </label>
                          </div>

                          {/* Options Manager for Dropdown/Radio */}
                          {(field.type === 'dropdown' || field.type === 'radio') && (
                            <div className="col-span-full p-3 bg-white border border-slate-200 rounded-xl space-y-2 mt-2">
                              <span className="text-[11px] font-bold text-slate-700 block">
                                {language === 'ar' ? 'خيارات القائمة المتاحة (Options):' : 'Available Options:'}
                              </span>

                              <div className="flex flex-wrap gap-2">
                                {(field.options || []).map((opt, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                                  >
                                    <span>{opt.labelAr}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = [...formData.fields];
                                        list[idx].options = (list[idx].options || []).filter((_, i) => i !== optIdx);
                                        setFormData({ ...formData, fields: list });
                                      }}
                                      className="text-slate-400 hover:text-rose-600"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder={language === 'ar' ? 'نص الخيار الجديد...' : 'Option label...'}
                                  value={newOptionLabelAr}
                                  onChange={(e) => setNewOptionLabelAr(e.target.value)}
                                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1 outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newOptionLabelAr.trim()) return;
                                    const list = [...formData.fields];
                                    const opts = list[idx].options || [];
                                    opts.push({
                                      labelAr: newOptionLabelAr.trim(),
                                      labelEn: newOptionLabelAr.trim(),
                                      value: newOptionLabelAr.trim()
                                    });
                                    list[idx].options = opts;
                                    setFormData({ ...formData, fields: list });
                                    setNewOptionLabelAr('');
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  + {language === 'ar' ? 'إضافة خيار' : 'Add'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: WORKFLOW STAGES */}
          {/* ========================================================================= */}
          {activeTab === 'workflow' && (
            <div className="space-y-5">
              {formData.isAutoApproved ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <Zap className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-sm text-emerald-950">
                    {language === 'ar' ? 'هذا الطلب معرف كاعتماد تلقائي فوري (Auto-Approved)' : 'Auto-Approval Enabled'}
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    {language === 'ar'
                      ? 'لا يحتاج هذا الطلب لمراحل موافقة بشرية، بل يتم تدقيقه واعتماده وإصدار مستنداته آلياً فور تقديمه من الموظف.'
                      : 'Requests of this type are automatically approved and completed instantly.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        {language === 'ar' ? 'مراحل ومسارات الاعتماد المتسلسلة (Multi-Stage Workflow)' : 'Workflow Stages'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {language === 'ar' ? 'حدد تسلسل الموافقات والمسؤول عن كل مرحلة' : 'Configure approval steps in order'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddStage}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'ar' ? 'إضافة مرحلة موافقة' : 'Add Stage'}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.workflowStages.map((stage, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center font-mono">
                            {sIdx + 1}
                          </span>
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={stage.stageNameAr}
                              onChange={(e) => {
                                const list = [...formData.workflowStages];
                                list[sIdx].stageNameAr = e.target.value;
                                setFormData({ ...formData, workflowStages: list });
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-hidden"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">
                                {language === 'ar' ? 'الموافق:' : 'Approver:'}
                              </span>
                              <select
                                value={stage.approverType}
                                onChange={(e) => {
                                  const list = [...formData.workflowStages];
                                  list[sIdx].approverType = e.target.value as WorkflowApproverType;
                                  setFormData({ ...formData, workflowStages: list });
                                }}
                                className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-indigo-900 outline-hidden"
                              >
                                <option value="DIRECT_MANAGER">المدير المباشر (Direct Manager)</option>
                                <option value="DEPARTMENT_MANAGER">مدير القسم / الدائرة (Dept Manager)</option>
                                <option value="HR">إدارة الموارد البشرية (HR)</option>
                                <option value="FINANCE">الإدارة المالية والمحاسبة (Finance)</option>
                                <option value="ADMINISTRATIVE">الإدارة العامة والمدير التنفيذي (Admin)</option>
                                <option value="SPECIFIC_ROLE">صلاحية محددة (Role Based)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="text-[11px] text-slate-400">SLA:</span>
                          <input
                            type="number"
                            value={stage.slaHours || 24}
                            onChange={(e) => {
                              const list = [...formData.workflowStages];
                              list[sIdx].slaHours = Number(e.target.value);
                              setFormData({ ...formData, workflowStages: list });
                            }}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                          />
                          <span className="text-[10px] text-slate-400">h</span>

                          <button
                            type="button"
                            onClick={() => handleDeleteStage(sIdx)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.workflowStages.length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-400">
                        {language === 'ar' ? 'لم يتم إضافة مراحل اعتماد بعد' : 'No workflow stages added'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 rtl:space-x-reverse shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ نوع الطلب والنموذج' : 'Save Request Type'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
