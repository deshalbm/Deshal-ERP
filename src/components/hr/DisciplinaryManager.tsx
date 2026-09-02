import React, { useState } from 'react';
import { DisciplinaryAction, DisciplinaryType } from '../../types/hr';
import { Employee } from '../../types';
import {
  AlertTriangle,
  ShieldAlert,
  Plus,
  Search,
  Eye,
  FileText,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface DisciplinaryManagerProps {
  disciplinaryActions?: DisciplinaryAction[];
  employees?: Employee[];
  companySettings?: any;
  onSaveAction?: (action: DisciplinaryAction) => void;
  onSaveDisciplinaryAction?: (action: DisciplinaryAction) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const DisciplinaryManager: React.FC<DisciplinaryManagerProps> = ({
  disciplinaryActions = [],
  employees = [],
  companySettings,
  onSaveAction,
  onSaveDisciplinaryAction,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DisciplinaryAction | null>(null);

  const safeActions = disciplinaryActions || [];
  const safeEmployees = employees || [];
  const handleSaveCallback = onSaveDisciplinaryAction || onSaveAction;
  const handleOpen360Action = onOpen360Modal || onOpen360;

  // Form State
  const [formData, setFormData] = useState<Partial<DisciplinaryAction>>({
    type: 'WRITTEN_WARNING',
    violationDate: new Date().toISOString().substring(0, 10),
    issueDate: new Date().toISOString().substring(0, 10),
    reason: '',
    details: '',
    penaltyDetails: '',
    employeeAcknowledged: false,
    status: 'EXECUTED',
    isNonDeletableAudit: true
  });

  const handleOpenNew = () => {
    const emp = safeEmployees[0];
    setFormData({
      id: `disc-${Date.now()}`,
      actionNumber: `DISC-${new Date().getFullYear()}-${String(safeActions.length + 1).padStart(3, '0')}`,
      employeeId: emp ? emp.id : '',
      employeeCode: emp ? emp.employeeCode : '',
      employeeName: emp ? emp.fullName : '',
      department: emp ? emp.department : '',
      branchName: emp ? emp.branchName : 'فرع صحار الرئيسي',
      type: 'WRITTEN_WARNING',
      violationDate: new Date().toISOString().substring(0, 10),
      issueDate: new Date().toISOString().substring(0, 10),
      issuedBy: 'emp-1',
      issuedByName: 'سعيد بن راشد الشحي',
      issuedByRole: 'المدير التنفيذي العام',
      reason: '',
      details: '',
      penaltyDetails: '',
      employeeExplanation: '',
      employeeAcknowledged: false,
      status: 'EXECUTED',
      approvedBy: 'سعيد بن راشد الشحي',
      approvedAt: new Date().toISOString(),
      isNonDeletableAudit: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setSelectedAction(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.reason) return;

    const actionToSave: DisciplinaryAction = {
      id: selectedAction ? selectedAction.id : (formData.id || `disc-${Date.now()}`),
      actionNumber: formData.actionNumber || `DISC-${Date.now()}`,
      employeeId: formData.employeeId!,
      employeeCode: formData.employeeCode || '',
      employeeName: formData.employeeName || '',
      department: formData.department || '',
      branchName: formData.branchName,
      type: (formData.type as DisciplinaryType) || 'WRITTEN_WARNING',
      violationDate: formData.violationDate || new Date().toISOString().substring(0, 10),
      issueDate: formData.issueDate || new Date().toISOString().substring(0, 10),
      issuedBy: formData.issuedBy || 'emp-1',
      issuedByName: formData.issuedByName || 'سعيد بن راشد الشحي',
      issuedByRole: formData.issuedByRole || 'المدير التنفيذي العام',
      reason: formData.reason!,
      details: formData.details || '',
      penaltyDetails: formData.penaltyDetails || '',
      employeeExplanation: formData.employeeExplanation,
      employeeAcknowledged: true,
      status: 'EXECUTED',
      approvedBy: 'سعيد بن راشد الشحي',
      approvedAt: new Date().toISOString(),
      isNonDeletableAudit: true,
      createdAt: selectedAction ? selectedAction.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (handleSaveCallback) {
      handleSaveCallback(actionToSave);
    }
    setIsModalOpen(false);
  };

  const filtered = safeActions.filter(
    (a) =>
      (a?.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a?.actionNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a?.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي الجزاءات والملاحظات</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{safeActions.length}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">سجل تدقيق غير قابل للحذف</span>
            <span className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              سجل محمي وموثق قانونياً
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-200 font-medium block">إصدار إشعار رسمي</span>
            <button
              onClick={handleOpenNew}
              className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إصدار إشعار إداري
            </button>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-300" />
          </div>
        </div>
      </div>

      {/* Disciplinary List */}
      <div className="space-y-4">
        {filtered.map((action) => (
          <div key={action.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-rose-50 text-rose-700 rounded-lg font-mono font-bold">
                  {action.actionNumber}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{action.employeeName} ({action.employeeCode})</h4>
                  <p className="text-slate-500">{action.department} • تاريخ المخالفة: {action.violationDate}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full font-bold bg-rose-100 text-rose-800">
                {action.type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-800">سبب المخالفة والوقائع:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {action.reason}
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-800">الإجراء التأديبي والجزاء:</span>
                <p className="text-slate-600 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-rose-900">
                  {action.penaltyDetails}
                </p>
              </div>
            </div>

            {action.employeeExplanation && (
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-1 text-blue-950">
                <span className="font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  رد وإيضاح الموظف المسجل:
                </span>
                <p className="text-slate-700 italic">{action.employeeExplanation}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-100">
              <span>صدر بواسطة: {action.issuedByName} ({action.issuedByRole})</span>
              {handleOpen360Action && (
                <button
                  onClick={() => handleOpen360Action(action.employeeId)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  عرض الملف الشامل 360°
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Disciplinary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                إصدار إشعار إداري / جزاء رسمي
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الموظف المعني</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => {
                      const emp = safeEmployees.find((x) => x.id === e.target.value);
                      if (emp) {
                        setFormData({
                          ...formData,
                          employeeId: emp.id,
                          employeeCode: emp.employeeCode,
                          employeeName: emp.fullName,
                          department: emp.department,
                          branchName: emp.branchName
                        });
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    {safeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع الإجراء الإداري</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="VERBAL_NOTICE">ملاحظة شفهية (Verbal Notice)</option>
                    <option value="WRITTEN_WARNING">إنذار كتابي (Written Warning)</option>
                    <option value="FINAL_WARNING">إنذار نهائي (Final Warning)</option>
                    <option value="INFRACTION">مخالفة إدارية (Infraction)</option>
                    <option value="ADMINISTRATIVE_PENALTY">جزاء إداري (Penalty)</option>
                    <option value="SALARY_DEDUCTION">خصم من الراتب (Salary Deduction)</option>
                    <option value="SUSPENSION">إيقاف مؤقت (Suspension)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ وقوع المخالفة</label>
                  <input
                    type="date"
                    value={formData.violationDate}
                    onChange={(e) => setFormData({ ...formData, violationDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ إصدار الإشعار</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب ومبرر المخالفة</label>
                <textarea
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="وصف تفصيلي للواقعة والمخالفة..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الجزاء والإجراء الإداري المطبق</label>
                <textarea
                  rows={2}
                  value={formData.penaltyDetails}
                  onChange={(e) => setFormData({ ...formData, penaltyDetails: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="التنبيه، الخصم أو الإجراء المتخذ..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رد وإيضاح الموظف (اختياري)</label>
                <textarea
                  rows={2}
                  value={formData.employeeExplanation || ''}
                  onChange={(e) => setFormData({ ...formData, employeeExplanation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="إيضاح الموظف أو مبرراته..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-200"
                >
                  اعتماد وتوثيق الإشعار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
