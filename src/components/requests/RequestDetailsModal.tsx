import React, { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Download,
  Printer,
  User,
  Building2,
  Calendar,
  Paperclip,
  MessageSquare,
  Send,
  Ban,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  Lock
} from 'lucide-react';
import { EmployeeRequest, RequestTypeConfig } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import { addRequestComment, cancelEmployeeRequest } from '../../utils/requestsStorage';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: EmployeeRequest | null;
  requestTypes: RequestTypeConfig[];
  currentUser: { id: string; name: string; role: string; avatar?: string };
  onOpenDocument: (doc: any) => void;
  onOpenApprovalModal: (req: EmployeeRequest) => void;
  onOpenResubmitModal?: (req: EmployeeRequest) => void;
  onUpdate: (updatedReq: EmployeeRequest) => void;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  requestTypes,
  currentUser,
  onOpenDocument,
  onOpenApprovalModal,
  onOpenResubmitModal,
  onUpdate
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'comments' | 'attachments'>('details');
  const [newComment, setNewComment] = useState<string>('');

  if (!isOpen || !request) return null;

  const typeConfig = requestTypes.find((t) => t.id === request.typeId);

  // Check if current user is the requester
  const isRequester = currentUser.id === request.employeeId;

  // Check if current user can approve (Manager / HR / Finance / Admin)
  const canApprove =
    request.status === 'PENDING_APPROVAL' || request.status === 'UNDER_REVIEW';

  // Format Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          labelAr: 'مكتمل ومصدر',
          labelEn: 'Completed'
        };
      case 'PENDING_APPROVAL':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Clock,
          labelAr: 'بانتظار الموافقة',
          labelEn: 'Pending Approval'
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: Clock,
          labelAr: 'قيد المراجعة والتدقيق',
          labelEn: 'Under Review'
        };
      case 'RETURNED':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: RotateCcw,
          labelAr: 'معاد للتعديل',
          labelEn: 'Returned'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: XCircle,
          labelAr: 'مرفوض',
          labelEn: 'Rejected'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Ban,
          labelAr: 'ملغي',
          labelEn: 'Cancelled'
        };
      default:
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          labelAr: status,
          labelEn: status
        };
    }
  };

  const statusBadge = getStatusBadge(request.status);
  const StatusIcon = statusBadge.icon;

  // Handle adding comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const updated = addRequestComment(request.id, currentUser, newComment.trim());
    if (updated) {
      onUpdate(updated);
      setNewComment('');
    }
  };

  // Handle Cancel Request
  const handleCancel = () => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this request?')) {
      const updated = cancelEmployeeRequest(request.id, currentUser, 'إلغاء بناء على رغبة الموظف');
      if (updated) {
        onUpdate(updated);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  {request.requestNumber}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {language === 'ar' ? request.typeNameAr : request.typeNameEn}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar' ? 'مقدم الطلب:' : 'Requester:'} <strong>{request.employeeName}</strong> ({request.employeeCode}) - {request.department}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Status Pill */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${statusBadge.bg}`}>
              <StatusIcon className="w-3.5 h-3.5 me-1" />
              {language === 'ar' ? statusBadge.labelAr : statusBadge.labelEn}
            </span>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Strip */}
        <div className="px-6 py-3 bg-indigo-900 text-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse text-xs">
            <span className="text-indigo-200">
              {language === 'ar' ? 'تاريخ التقديم:' : 'Submitted:'} <strong>{new Date(request.submittedAt).toLocaleString(language === 'ar' ? 'ar-OM' : 'en-US')}</strong>
            </span>
            {request.slaDeadline && (
              <span className="text-amber-300 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                SLA: {new Date(request.slaDeadline).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Official Document View Button */}
            {request.generatedDocument && (
              <button
                onClick={() => onOpenDocument(request.generatedDocument)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'معاينة وطباعة المستند الرسمي (PDF)' : 'Print Official Document'}</span>
              </button>
            )}

            {/* Approver Decision Action */}
            {canApprove && (
              <button
                onClick={() => onOpenApprovalModal(request)}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'اتخاذ قرار الاعتماد' : 'Take Action'}</span>
              </button>
            )}

            {/* Requester Resubmit Button if returned */}
            {isRequester && request.status === 'RETURNED' && onOpenResubmitModal && (
              <button
                onClick={() => onOpenResubmitModal(request)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تعديل وإعادة التقديم' : 'Edit & Resubmit'}</span>
              </button>
            )}

            {/* Requester Cancel Button */}
            {isRequester && request.status !== 'COMPLETED' && request.status !== 'REJECTED' && request.status !== 'CANCELLED' && (
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-rose-500/30 hover:bg-rose-600 text-white border border-rose-400/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء الطلب' : 'Cancel'}
              </button>
            )}
          </div>
        </div>

        {/* Workflow Stepper / Progress Bar (If Multi-stage) */}
        {request.approvals && request.approvals.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80">
            <span className="text-[11px] font-extrabold text-slate-600 block mb-2">
              {language === 'ar' ? 'مسار وسجل الموافقات المعتمد (Approval Stages):' : 'Approval Sequence:'}
            </span>
            <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto pb-1">
              {request.approvals.map((stage, idx) => {
                const isCurrent = idx === request.currentStageIndex && request.status === 'PENDING_APPROVAL';
                const isApproved = stage.status === 'APPROVED';
                const isRejected = stage.status === 'REJECTED';
                const isReturned = stage.status === 'RETURNED';

                let badgeColor = 'bg-white border-slate-200 text-slate-600';
                if (isApproved) badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs';
                else if (isRejected) badgeColor = 'bg-rose-50 border-rose-300 text-rose-900';
                else if (isReturned) badgeColor = 'bg-amber-50 border-amber-300 text-amber-900';
                else if (isCurrent) badgeColor = 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-200';

                return (
                  <div key={idx} className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                    <div className={`p-2.5 rounded-2xl border flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold ${badgeColor}`}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-slate-200/80">
                        {isApproved ? '✓' : isRejected ? '✗' : idx + 1}
                      </div>
                      <div>
                        <p className="leading-tight">{stage.stageNameAr}</p>
                        {stage.decisionByUserName && (
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            بواسطة: {stage.decisionByUserName}
                          </p>
                        )}
                      </div>
                    </div>
                    {idx < request.approvals.length - 1 && (
                      <span className="text-slate-300 font-bold">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse px-6 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'بيانات وحقول الطلب' : 'Form Details'}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? 'الجدول الزمني وسجل التدقيق' : 'Audit Timeline'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
              {request.timeline.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? 'المناقشات والملاحظات' : 'Comments & Notes'}</span>
            {request.comments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-mono">
                {request.comments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'attachments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? 'المرفقات والوثائق' : 'Attachments'}</span>
            {request.attachments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                {request.attachments.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: FORM DETAILS */}
          {/* ========================================================================= */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Return / Reject Reason Banner if any */}
              {request.status === 'RETURNED' && request.returnedReason && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 rtl:space-x-reverse text-amber-900 text-xs">
                  <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold block text-sm">
                      {language === 'ar' ? 'توجيهات التعديل المطلوبة من الإدارة:' : 'Revision Requested:'}
                    </strong>
                    <p className="mt-1 leading-relaxed">{request.returnedReason}</p>
                  </div>
                </div>
              )}

              {request.status === 'REJECTED' && request.rejectionReason && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start space-x-3 rtl:space-x-reverse text-rose-900 text-xs">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold block text-sm">
                      {language === 'ar' ? 'أسباب رفض الطلب:' : 'Rejection Reason:'}
                    </strong>
                    <p className="mt-1 leading-relaxed">{request.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Submitted Fields Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(request.values || {}).map(([key, val]) => {
                  // Find field definition if available
                  const fieldDef = typeConfig?.fields.find((f) => f.id === key);
                  const fieldLabel = fieldDef
                    ? language === 'ar' ? fieldDef.labelAr : fieldDef.labelEn
                    : key;

                  // Format value
                  let displayVal = val;
                  if (typeof val === 'boolean') {
                    displayVal = val ? (language === 'ar' ? 'نعم (موافق)' : 'Yes') : (language === 'ar' ? 'لا' : 'No');
                  } else if (val && typeof val === 'object' && 'fileName' in val) {
                    const fileObj = val as { fileName: string; fileSize?: number };
                    displayVal = `${fileObj.fileName} (${Math.round((fileObj.fileSize || 0) / 1024)} KB)`;
                  } else if (val === '' || val === null || val === undefined) {
                    displayVal = '-';
                  }

                  return (
                    <div
                      key={key}
                      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-1"
                    >
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {fieldLabel}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 block break-words">
                        {String(displayVal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: AUDIT TIMELINE */}
          {/* ========================================================================= */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="relative border-s-2 border-slate-200 ms-4 space-y-6">
                {request.timeline.map((event) => (
                  <div key={event.id} className="relative ms-6 space-y-1">
                    {/* Circle Node */}
                    <div className="absolute -start-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">
                        {language === 'ar' ? event.actionLabelAr : event.actionLabelEn}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(event.timestamp).toLocaleString(language === 'ar' ? 'ar-OM' : 'en-US')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {language === 'ar' ? event.detailsAr : event.detailsEn}
                    </p>

                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[10px] text-slate-400 pt-0.5">
                      <User className="w-3 h-3" />
                      <span>{event.actorName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                        {event.actorRole}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: COMMENTS & NOTES */}
          {/* ========================================================================= */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب ملاحظة أو استفسار بخصوص الطلب...' : 'Add a note or comment...'}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 outline-hidden focus:border-indigo-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إرسال' : 'Send'}</span>
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {request.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{comment.authorName}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                          {comment.authorRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleString(language === 'ar' ? 'ar-OM' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{comment.message}</p>
                  </div>
                ))}

                {request.comments.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-400">
                    {language === 'ar' ? 'لا توجد ملاحظات أو استفسارات مسجلة بعد' : 'No comments recorded yet'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ATTACHMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'attachments' && (
            <div className="space-y-3">
              {request.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900">{att.fileName}</h5>
                      <span className="text-[10px] text-slate-400">
                        {Math.round((att.fileSize || 0) / 1024)} KB - {language === 'ar' ? 'بواسطة:' : 'By:'} {att.uploadedBy}
                      </span>
                    </div>
                  </div>

                  {att.dataUrl && (
                    <a
                      href={att.dataUrl}
                      download={att.fileName}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تحميل' : 'Download'}</span>
                    </a>
                  )}
                </div>
              ))}

              {request.attachments.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  {language === 'ar' ? 'لا توجد مرفقات مرتبطة بهذا الطلب' : 'No attachments found'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
