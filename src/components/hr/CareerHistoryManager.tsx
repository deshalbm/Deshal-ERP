import React, { useState } from 'react';
import { EmployeeCareerHistory, CareerChangeType } from '../../types/hr';
import { Employee } from '../../types';
import {
  History,
  TrendingUp,
  Briefcase,
  Plus,
  Search,
  Eye,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface CareerHistoryManagerProps {
  careerHistories?: EmployeeCareerHistory[];
  employees?: Employee[];
  companySettings?: any;
  onSaveCareerChange?: (ch: EmployeeCareerHistory) => void;
  onSaveCareerHistory?: (ch: EmployeeCareerHistory) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const CareerHistoryManager: React.FC<CareerHistoryManagerProps> = ({
  careerHistories = [],
  employees = [],
  companySettings,
  onSaveCareerChange,
  onSaveCareerHistory,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeHistories = careerHistories || [];
  const safeEmployees = employees || [];
  const handleOpen360Action = onOpen360Modal || onOpen360;
  const handleSaveAction = onSaveCareerHistory || onSaveCareerChange;

  // Form State
  const [formData, setFormData] = useState<Partial<EmployeeCareerHistory>>({
    changeType: 'PROMOTION',
    changeTitle: '',
    effectiveDate: new Date().toISOString().substring(0, 10),
    previousValue: '',
    newValue: '',
    reason: '',
    approvedBy: 'emp-1',
    approvedByName: 'إدارة الموارد البشرية'
  });

  const handleOpenNew = () => {
    const emp = safeEmployees[0];
    setFormData({
      id: `ch-${Date.now()}`,
      employeeId: emp ? emp.id : '',
      employeeName: emp ? emp.fullName : '',
      changeType: 'PROMOTION',
      changeTitle: 'ترقية وظيفية وزيادة راتب',
      effectiveDate: new Date().toISOString().substring(0, 10),
      previousValue: emp?.jobTitle || '',
      newValue: '',
      reason: 'نظراً للتميز في الأداء وتحقيق المستهدفات.',
      approvedBy: 'emp-1',
      approvedByName: 'إدارة الموارد البشرية',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.changeTitle) return;

    const ch: EmployeeCareerHistory = {
      id: formData.id || `ch-${Date.now()}`,
      employeeId: formData.employeeId!,
      employeeName: formData.employeeName || '',
      changeType: (formData.changeType as CareerChangeType) || 'PROMOTION',
      changeTitle: formData.changeTitle!,
      effectiveDate: formData.effectiveDate || new Date().toISOString().substring(0, 10),
      previousValue: formData.previousValue || '',
      newValue: formData.newValue || '',
      reason: formData.reason || '',
      approvedBy: formData.approvedBy || 'emp-1',
      approvedByName: formData.approvedByName || 'إدارة الموارد البشرية',
      createdAt: new Date().toISOString()
    };

    if (handleSaveAction) {
      handleSaveAction(ch);
    }
    setIsModalOpen(false);
  };

  const filtered = safeHistories.filter(
    (c) =>
      (c?.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c?.changeTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c?.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي سجلات المسار والترقيات</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{safeHistories.length}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <History className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">ترقيات وتعديلات رواتب</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {safeHistories.filter((c) => c.changeType === 'PROMOTION' || c.changeType === 'SALARY_INCREMENT').length}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-200 font-medium block">تسجيل تعديل وظيفي</span>
            <button
              onClick={handleOpenNew}
              className="mt-2 px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة ترقية / تغيير
            </button>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <Briefcase className="w-6 h-6 text-indigo-300" />
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="w-4 h-4 text-indigo-600" />
          السجل التاريخي للترقيات والتنقلات عبر مسيرة الموظفين
        </h3>

        <div className="relative border-r-2 border-indigo-200 pr-6 space-y-6 mr-4">
          {filtered.map((item) => (
            <div key={item.id} className="relative group text-xs">
              <div className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.changeTitle}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium text-[11px]">
                      {item.changeType}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono">{item.effectiveDate}</span>
                </div>

                <div className="text-slate-700">
                  <span className="font-bold">الموظف: </span>
                  <span className="font-semibold text-indigo-700">{item.employeeName}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">الحالة السابقة:</span>
                    <span className="font-medium text-slate-600">{item.previousValue}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الحالة الجديدة بعد التعديل:</span>
                    <span className="font-bold text-emerald-700">{item.newValue}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>سبب التعديل: {item.reason}</span>
                  {handleOpen360Action && (
                    <button
                      onClick={() => handleOpen360Action(item.employeeId)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      عرض الملف 360°
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                تسجيل ترقية / تعديل وظيفي
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
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
                        employeeName: emp.fullName,
                        previousValue: `${emp.jobTitle} (راتب ${emp.basicSalary} OMR)`
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
                <label className="block text-slate-700 font-bold mb-1">نوع التغيير الوظيفي</label>
                <select
                  value={formData.changeType}
                  onChange={(e) => setFormData({ ...formData, changeType: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="PROMOTION">ترقية وظيفية (Promotion)</option>
                  <option value="SALARY_INCREMENT">زيادة راتب (Salary Increment)</option>
                  <option value="TRANSFER">نقل فرع أو قسم (Transfer)</option>
                  <option value="JOB_TITLE_CHANGE">تعديل مسمى وظيفي (Job Title Change)</option>
                  <option value="DEPARTMENT_TRANSFER">نقل قسم إداري (Department Transfer)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">عنوان التغيير</label>
                <input
                  type="text"
                  value={formData.changeTitle}
                  onChange={(e) => setFormData({ ...formData, changeTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="مثال: ترقية إلى مدير فرع وزيادة راتب"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">القيمة / الوظيفة السابقة</label>
                  <input
                    type="text"
                    value={formData.previousValue}
                    onChange={(e) => setFormData({ ...formData, previousValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">القيمة / الوظيفة الجديدة</label>
                  <input
                    type="text"
                    value={formData.newValue}
                    onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-indigo-700"
                    placeholder="المسمى الجديد والراتب الجديد..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب ومبررات التغيير</label>
                <textarea
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="مبررات الترقية أو النقل..."
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                >
                  اعتماد التعديل في المسار الوظيفي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
