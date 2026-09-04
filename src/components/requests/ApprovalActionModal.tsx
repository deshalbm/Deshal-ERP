import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Send,
  ShieldCheck,
  FileText,
  User,
  Clock
} from 'lucide-react';
import { EmployeeRequest } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: EmployeeRequest | null;
  currentApprover: { id: string; name: string; role: string; avatar?: string };
  onDecision: (
    requestId: string,
    decision: 'APPROVE' | 'REJECT' | 'RETURN',
    comments?: string
  ) => void;
}

export const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  isOpen,
  onClose,
  request,
  currentApprover,
  onDecision
}) => {
  const { language } = useLanguage();
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE');
  const [comments, setComments] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen || !request) return null;

  const currentStage = request.approvals[request.currentStageIndex || 0];

  const handleSubmit = () => {
    if ((decision === 'REJECT' || decision === 'RETURN') && !comments.trim()) {
      setError(
        language === 'ar'
          ? 'يرجى كتابة سبب الرفض أو توضيح التعديلات المطلوبة من الموظف'
          : 'Please provide reason for rejection or revision notes'
      );
      return;
    }

    onDecision(request.id, decision, comments.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {language === 'ar' ? 'اتخاذ قرار الاعتماد والمراجعة' : 'Review & Approval Decision'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {request.requestNumber} - {request.typeNameAr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Request Overview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">{language === 'ar' ? 'الموظف مقدم الطلب:' : 'Requester:'}</span>
              <span className="font-extrabold text-slate-900">{request.employeeName} ({request.employeeCode})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">{language === 'ar' ? 'القسم / الفرع:' : 'Dept / Branch:'}</span>
              <span className="font-medium text-slate-700">{request.department} - {request.branchName || 'الرئيسي'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">{language === 'ar' ? 'مرحلة الاعتماد:' : 'Approval Stage:'}</span>
              <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md">
                {currentStage?.stageNameAr || (language === 'ar' ? 'المرحلة الحالية' : 'Current Stage')}
              </span>
            </div>
          </div>

          {/* Decision Selector Options (3 Buttons) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 block">
              {language === 'ar' ? 'حدد القرار الإداري:' : 'Select Decision:'}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Approve */}
              <button
                type="button"
                onClick={() => {
                  setDecision('APPROVE');
                  setError('');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                  decision === 'APPROVE'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${decision === 'APPROVE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-black">{language === 'ar' ? 'اعتماد وموافقة' : 'Approve'}</span>
              </button>

              {/* 2. Return for Edit */}
              <button
                type="button"
                onClick={() => {
                  setDecision('RETURN');
                  setError('');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                  decision === 'RETURN'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className={`w-5 h-5 ${decision === 'RETURN' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs font-black">{language === 'ar' ? 'إعادة للتعديل' : 'Return for Edit'}</span>
              </button>

              {/* 3. Reject */}
              <button
                type="button"
                onClick={() => {
                  setDecision('REJECT');
                  setError('');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                  decision === 'REJECT'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-200 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className={`w-5 h-5 ${decision === 'REJECT' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-xs font-black">{language === 'ar' ? 'رفض الطلب' : 'Reject'}</span>
              </button>
            </div>
          </div>

          {/* Decision Comments / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>
                {decision === 'APPROVE' && (language === 'ar' ? 'ملاحظات الاعتماد (اختياري):' : 'Approval notes (Optional):')}
                {decision === 'RETURN' && (language === 'ar' ? 'التعديلات والبيانات المطلوبة من الموظف (إجباري):' : 'Required Revisions (Mandatory):')}
                {decision === 'REJECT' && (language === 'ar' ? 'أسباب رفض الطلب (إجباري):' : 'Rejection Reason (Mandatory):')}
              </span>
              {decision !== 'APPROVE' && <span className="text-rose-500 font-black">*</span>}
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                decision === 'APPROVE'
                  ? language === 'ar' ? 'اكتب أي توجيهات أو ملاحظات للموظف إن وجدت...' : 'Enter approval notes if any...'
                  : decision === 'RETURN'
                  ? language === 'ar' ? 'وضح للموظف الحقول أو المرفقات المطلوب تعديلها...' : 'Specify details needing revision...'
                  : language === 'ar' ? 'وضح أسباب عدم إمكانية تلبية الطلب حالياً...' : 'State the reason for rejection...'
              }
              className={`w-full px-3.5 py-2.5 bg-white border ${
                error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
              } rounded-2xl text-xs text-slate-800 outline-hidden resize-none`}
            />
            {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
          </div>

          {/* Approver ID Stamp */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'ar' ? 'المعتمد الحالي:' : 'Approver:'} <strong>{currentApprover.name}</strong></span>
            </div>
            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
              {currentApprover.role}
            </span>
          </div>
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
            onClick={handleSubmit}
            className={`px-6 py-2.5 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 rtl:space-x-reverse shadow-md transition-all cursor-pointer ${
              decision === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : decision === 'RETURN'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {decision === 'APPROVE' && (language === 'ar' ? 'تأكيد الاعتماد' : 'Confirm Approval')}
              {decision === 'RETURN' && (language === 'ar' ? 'إعادة الطلب' : 'Return Request')}
              {decision === 'REJECT' && (language === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
