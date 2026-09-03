import React, { useState } from 'react';
import { EmployeeRecognition, RecognitionType } from '../../types/hr';
import { Employee } from '../../types';
import {
  Award,
  Trophy,
  Star,
  Plus,
  HeartHandshake,
  DollarSign,
  Sparkles,
  Eye,
  Gift,
  Printer
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface RecognitionManagerProps {
  recognitions?: EmployeeRecognition[];
  employees?: Employee[];
  companySettings?: any;
  onSaveRecognition?: (rec: EmployeeRecognition) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const RecognitionManager: React.FC<RecognitionManagerProps> = ({
  recognitions = [],
  employees = [],
  companySettings,
  onSaveRecognition,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeRecognitions = recognitions || [];
  const safeEmployees = employees || [];
  const handleOpen360Action = onOpen360Modal || onOpen360;

  // Form State
  const [formData, setFormData] = useState<Partial<EmployeeRecognition>>({
    type: 'EMPLOYEE_OF_THE_MONTH',
    title: '',
    description: '',
    awardDate: new Date().toISOString().substring(0, 10),
    monetaryReward: 100,
    currency: 'OMR',
    badgeIcon: 'Trophy',
    isPublic: true
  });

  const handleOpenNew = () => {
    const emp = safeEmployees[0];
    setFormData({
      id: `rec-${Date.now()}`,
      employeeId: emp ? emp.id : '',
      employeeCode: emp ? emp.employeeCode : '',
      employeeName: emp ? emp.fullName : '',
      jobTitle: emp ? emp.jobTitle : '',
      department: emp ? emp.department : '',
      type: 'EMPLOYEE_OF_THE_MONTH',
      title: 'موظف الشهر المتميز',
      description: 'تقديراً للأداء الاستثنائي وخدمة العملاء والالتزام العالي.',
      awardDate: new Date().toISOString().substring(0, 10),
      awardedBy: 'emp-1',
      awardedByName: 'إدارة الموارد البشرية',
      monetaryReward: 150,
      currency: 'OMR',
      badgeIcon: 'Trophy',
      isPublic: true,
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.title) return;

    const rec: EmployeeRecognition = {
      id: formData.id || `rec-${Date.now()}`,
      employeeId: formData.employeeId!,
      employeeCode: formData.employeeCode || '',
      employeeName: formData.employeeName || '',
      jobTitle: formData.jobTitle || '',
      department: formData.department || '',
      type: (formData.type as RecognitionType) || 'EMPLOYEE_OF_THE_MONTH',
      title: formData.title!,
      description: formData.description || '',
      awardDate: formData.awardDate || new Date().toISOString().substring(0, 10),
      awardedBy: formData.awardedBy || 'emp-1',
      awardedByName: formData.awardedByName || 'إدارة الموارد البشرية',
      monetaryReward: Number(formData.monetaryReward || 0),
      currency: formData.currency || 'OMR',
      badgeIcon: formData.badgeIcon || 'Trophy',
      isPublic: true,
      createdAt: new Date().toISOString()
    };

    if (onSaveRecognition) {
      onSaveRecognition(rec);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي أوسمة التكريم</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{safeRecognitions.length}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">مكافآت التميز المحفزة</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {safeRecognitions.reduce((acc, curr) => acc + (curr?.monetaryReward || 0), 0)} OMR
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Gift className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-100 font-medium block">تكريم كادر وظيفي</span>
            <button
              onClick={handleOpenNew}
              className="mt-2 px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة تكريم جديد
            </button>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Recognition Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeRecognitions.map((rec) => (
          <div
            key={rec.id}
            className="bg-white p-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/20 to-amber-100/10 shadow-sm space-y-4 text-xs relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shadow-inner">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                  <p className="text-slate-500 font-medium">الموظف: {rec.employeeName} • {rec.jobTitle}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800">
                {rec.awardDate}
              </span>
            </div>

            <p className="text-slate-700 leading-relaxed text-[11px]">{rec.description}</p>

            {rec.monetaryReward && rec.monetaryReward > 0 && (
              <div className="flex items-center justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 font-bold text-amber-900">
                <span className="flex items-center gap-1">
                  <Gift className="w-4 h-4 text-amber-600" />
                  مكافأة تميز نقدية:
                </span>
                <span>{rec.monetaryReward} {rec.currency || 'OMR'}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-amber-100 text-[11px]">
              <span>منح بواسطة: {rec.awardedByName}</span>
              {handleOpen360Action && (
                <button
                  onClick={() => handleOpen360Action(rec.employeeId)}
                  className="text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  عرض الملف الشامل
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                منح تكريم أو وسام تميز
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
                <label className="block text-slate-700 font-bold mb-1">الموظف المكرم</label>
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
                        jobTitle: emp.jobTitle,
                        department: emp.department
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
                <label className="block text-slate-700 font-bold mb-1">نوع التكريم</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="EMPLOYEE_OF_THE_MONTH">موظف الشهر (Employee of the Month)</option>
                  <option value="ACHIEVEMENT_AWARD">درع الإنجاز والتميز (Achievement Award)</option>
                  <option value="THANK_YOU_LETTER">رسالة شكر وتقدير (Thank You Letter)</option>
                  <option value="APPRECIATION_CERTIFICATE">شهادة تقدير (Appreciation Certificate)</option>
                  <option value="BONUS_REWARD">مكافأة تشجيعية (Bonus Reward)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">عنوان التكريم والوسام</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="مثال: موظف الشهر المتميز - أغسطس 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تفاصيل ومبررات التكريم</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="نص التقدير وأبرز الإنجازات..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المكافأة النقدية (OMR)</label>
                  <input
                    type="number"
                    value={formData.monetaryReward || 0}
                    onChange={(e) => setFormData({ ...formData, monetaryReward: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ المنح</label>
                  <input
                    type="date"
                    value={formData.awardDate}
                    onChange={(e) => setFormData({ ...formData, awardDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-200"
                >
                  اعتماد التكريم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
