import React, { useState } from 'react';
import {
  Upload,
  Calendar,
  Clock,
  User,
  Building2,
  Building,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Paperclip,
  Check,
  AlertCircle,
  FileText,
  X
} from 'lucide-react';
import { RequestFormField, Employee, Branch } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface DynamicFormRendererProps {
  fields: RequestFormField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
  employees?: Employee[];
  branches?: Branch[];
  readOnly?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  employees = [],
  branches = [],
  readOnly = false
}) => {
  const { language } = useLanguage();

  // Helper to evaluate conditional visibility
  const isFieldVisible = (field: RequestFormField): boolean => {
    if (!field.conditional) return true;
    const { dependsOnFieldId, operator, value } = field.conditional;
    const parentVal = values[dependsOnFieldId];

    switch (operator) {
      case 'EQUALS':
        return parentVal === value;
      case 'NOT_EQUALS':
        return parentVal !== value;
      case 'CONTAINS':
        return Array.isArray(parentVal)
          ? parentVal.includes(value)
          : String(parentVal || '').includes(String(value));
      case 'GREATER_THAN':
        return Number(parentVal) > Number(value);
      case 'IS_NOT_EMPTY':
        return parentVal !== undefined && parentVal !== null && parentVal !== '';
      default:
        return true;
    }
  };

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Handle single file attachment upload
  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange(fieldId, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {sortedFields.map((field) => {
        if (!isFieldVisible(field)) return null;

        const val = values[field.id] !== undefined ? values[field.id] : field.defaultValue || '';
        const error = errors[field.id];

        // Grid span class based on field width
        let colSpan = 'col-span-1 sm:col-span-2 lg:col-span-6'; // full width default
        if (field.width === 'half') {
          colSpan = 'col-span-1 sm:col-span-1 lg:col-span-3';
        } else if (field.width === 'third') {
          colSpan = 'col-span-1 sm:col-span-1 lg:col-span-2';
        }

        const label = language === 'ar' ? field.labelAr : field.labelEn;
        const placeholder =
          language === 'ar'
            ? field.placeholderAr || field.labelAr
            : field.placeholderEn || field.labelEn;
        const helpText = language === 'ar' ? field.helpTextAr : field.helpTextEn;

        return (
          <div key={field.id} className={`${colSpan} space-y-1.5`}>
            {/* Field Header: Label & Required Star */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                <span>{label}</span>
                {field.required && <span className="text-rose-500 font-black">*</span>}
              </label>

              {helpText && (
                <div className="group relative flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute end-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg z-20">
                    {helpText}
                  </div>
                </div>
              )}
            </div>

            {/* Field Inputs by Type */}
            {field.type === 'text' && (
              <input
                type="text"
                disabled={readOnly}
                value={val}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                } rounded-xl text-xs font-medium text-slate-800 transition-all outline-hidden disabled:bg-slate-50 disabled:text-slate-500`}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                rows={3}
                disabled={readOnly}
                value={val}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                } rounded-xl text-xs font-medium text-slate-800 transition-all outline-hidden disabled:bg-slate-50 disabled:text-slate-500 resize-y`}
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                disabled={readOnly}
                min={field.validation?.min}
                max={field.validation?.max}
                value={val}
                onChange={(e) => onChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                } rounded-xl text-xs font-bold font-mono text-slate-800 transition-all outline-hidden disabled:bg-slate-50`}
              />
            )}

            {field.type === 'currency' && (
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  disabled={readOnly}
                  min={field.validation?.min}
                  max={field.validation?.max}
                  value={val}
                  onChange={(e) => onChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={placeholder}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                  } rounded-xl text-xs font-bold font-mono text-slate-800 transition-all outline-hidden disabled:bg-slate-50`}
                />
                <span className="absolute end-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  {language === 'ar' ? 'ر.ع' : 'OMR'}
                </span>
              </div>
            )}

            {field.type === 'date' && (
              <div className="relative">
                <input
                  type="date"
                  disabled={readOnly}
                  value={val}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                  } rounded-xl text-xs font-bold font-mono text-slate-800 transition-all outline-hidden disabled:bg-slate-50`}
                />
              </div>
            )}

            {field.type === 'datetime' && (
              <input
                type="datetime-local"
                disabled={readOnly}
                value={val}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                } rounded-xl text-xs font-bold font-mono text-slate-800 transition-all outline-hidden disabled:bg-slate-50`}
              />
            )}

            {field.type === 'dropdown' && (
              <select
                disabled={readOnly}
                value={val}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                } rounded-xl text-xs font-bold text-slate-800 transition-all outline-hidden disabled:bg-slate-50`}
              >
                <option value="">{language === 'ar' ? '-- اختر من القائمة --' : '-- Select an Option --'}</option>
                {(field.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {language === 'ar' ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'radio' && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {(field.options || []).map((opt) => {
                  const isChecked = val === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      disabled={readOnly}
                      onClick={() => onChange(field.id, opt.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isChecked ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                        {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span>{language === 'ar' ? opt.labelAr : opt.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-start space-x-2.5 rtl:space-x-reverse pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={Boolean(val)}
                  onChange={(e) => onChange(field.id, e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700 leading-snug">
                  {placeholder || label}
                </span>
              </label>
            )}

            {field.type === 'employee' && (
              <select
                disabled={readOnly}
                value={val}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden"
              >
                <option value="">{language === 'ar' ? '-- اختر الموظف --' : '-- Select Employee --'}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode}) - {emp.jobTitle}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'branch' && (
              <select
                disabled={readOnly}
                value={val}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden"
              >
                <option value="">{language === 'ar' ? '-- اختر الفرع --' : '-- Select Branch --'}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            )}

            {field.type === 'email' && (
              <div className="relative">
                <input
                  type="email"
                  disabled={readOnly}
                  value={val}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
              </div>
            )}

            {field.type === 'phone' && (
              <div className="relative">
                <input
                  type="tel"
                  disabled={readOnly}
                  value={val}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 outline-hidden"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
              </div>
            )}

            {field.type === 'attachment' && (
              <div>
                {val && typeof val === 'object' && val.fileName ? (
                  <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-900 font-bold truncate">
                      <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">{val.fileName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({Math.round((val.fileSize || 0) / 1024)} KB)
                      </span>
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onChange(field.id, null)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">
                      {language === 'ar' ? 'انقر لرفع الملف أو المستند الداعم' : 'Click to upload attachment'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PDF, PNG, JPG (الحد الأقصى 10MB)
                    </span>
                    <input
                      type="file"
                      disabled={readOnly}
                      className="hidden"
                      onChange={(e) => handleFileUpload(field.id, e)}
                    />
                  </label>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
