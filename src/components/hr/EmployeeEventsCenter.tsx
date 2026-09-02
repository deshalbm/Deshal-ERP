import React, { useState } from 'react';
import { EmployeeEventGreeting, EmployeeEventType } from '../../types/hr';
import { Employee } from '../../types';
import {
  Sparkles,
  Cake,
  Calendar,
  Send,
  MessageCircle,
  Share2,
  Heart,
  Award,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface EmployeeEventsCenterProps {
  greetings?: EmployeeEventGreeting[];
  employees?: Employee[];
  companySettings?: any;
  onSaveGreeting?: (greeting: EmployeeEventGreeting) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const EmployeeEventsCenter: React.FC<EmployeeEventsCenterProps> = ({
  greetings = [],
  employees = [],
  companySettings,
  onSaveGreeting,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeGreetings = greetings || [];
  const safeEmployees = employees || [];
  const handleOpen360Action = onOpen360Modal || onOpen360;

  // Form State
  const [formData, setFormData] = useState<Partial<EmployeeEventGreeting>>({
    eventType: 'WORK_ANNIVERSARY',
    eventDate: new Date().toISOString().substring(0, 10),
    greetingMessage: '',
    isAutomated: true,
    status: 'UPCOMING'
  });

  const handleOpenNew = () => {
    const emp = safeEmployees[0];
    setFormData({
      id: `grt-${Date.now()}`,
      employeeId: emp ? emp.id : '',
      employeeName: emp ? emp.fullName : '',
      employeePhone: emp?.phone || '',
      employeeEmail: emp?.email || '',
      eventType: 'WORK_ANNIVERSARY',
      eventDate: new Date().toISOString().substring(0, 10),
      milestoneYears: 1,
      greetingMessage: 'أسرة ديشال تهنئك بمناسبة ذكرى انضمامك السنوية ونتمنى لك دوام التقدم والنجاح!',
      isAutomated: true,
      status: 'UPCOMING'
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.greetingMessage) return;

    const grt: EmployeeEventGreeting = {
      id: formData.id || `grt-${Date.now()}`,
      employeeId: formData.employeeId!,
      employeeName: formData.employeeName || '',
      employeePhone: formData.employeePhone,
      employeeEmail: formData.employeeEmail,
      eventType: (formData.eventType as EmployeeEventType) || 'WORK_ANNIVERSARY',
      eventDate: formData.eventDate || new Date().toISOString().substring(0, 10),
      milestoneYears: formData.milestoneYears,
      greetingMessage: formData.greetingMessage!,
      isAutomated: true,
      status: 'UPCOMING'
    };

    if (onSaveGreeting) {
      onSaveGreeting(grt);
    }
    setIsModalOpen(false);
  };

  const handleSendWhatsApp = (grt: EmployeeEventGreeting) => {
    if (!grt.employeePhone) return;
    const cleanPhone = grt.employeePhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(grt.greetingMessage)}`;
    window.open(url, '_blank');

    if (onSaveGreeting) {
      onSaveGreeting({
        ...grt,
        status: 'SENT',
        sentAt: new Date().toISOString(),
        sentChannel: 'WHATSAPP'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">مناسبات الموظفين القادمة</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {safeGreetings.filter((g) => g?.status === 'UPCOMING').length}
            </span>
          </div>
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
            <Cake className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">تهاني ومباركات تم إرسالها</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {safeGreetings.filter((g) => g?.status === 'SENT').length}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-indigo-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-pink-200 font-medium block">تهنئة مخصصة</span>
            <button
              onClick={handleOpenNew}
              className="mt-2 px-3.5 py-1.5 bg-white text-rose-900 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إنشاء رسالة تهنئة
            </button>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Greetings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeGreetings.map((grt) => (
          <div
            key={grt.id}
            className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3 text-xs bg-gradient-to-br from-white to-pink-50/20"
          >
            <div className="flex items-center justify-between border-b border-rose-50 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                  {grt.eventType === 'BIRTHDAY' ? <Cake className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{grt.employeeName}</h4>
                  <span className="text-slate-400 text-[11px]">
                    {grt.eventType === 'BIRTHDAY'
                      ? '🎂 عيد ميلاد'
                      : grt.eventType === 'WORK_ANNIVERSARY'
                      ? `🏆 ذكرى التعيين السنوية (${grt.milestoneYears || 1} سنوات)`
                      : '✨ مناسبة خاصة'}
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  grt.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'
                }`}
              >
                {grt.status === 'SENT' ? 'تم الإرسال' : 'قادمة'}
              </span>
            </div>

            <p className="text-slate-700 leading-relaxed text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{grt.greetingMessage}"
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-rose-50 text-[11px]">
              <span className="text-slate-400 font-mono">الموعد: {grt.eventDate}</span>
              <button
                onClick={() => handleSendWhatsApp(grt)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-200"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                إرسال عبر WhatsApp
              </button>
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
                <Cake className="w-5 h-5 text-pink-600" />
                جدولة رسالة تهنئة ومناسبة للموظف
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
                        employeePhone: emp.phone,
                        employeeEmail: emp.email
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع المناسبة</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="WORK_ANNIVERSARY">ذكرى التعيين السنوية</option>
                    <option value="BIRTHDAY">عيد الميلاد</option>
                    <option value="MILESTONE_YEARS">إكمال سنوات خدمة متميزة</option>
                    <option value="PROMOTION">تهنئة بالترقية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ المناسبة</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نص رسالة التهنئة</label>
                <textarea
                  rows={3}
                  value={formData.greetingMessage}
                  onChange={(e) => setFormData({ ...formData, greetingMessage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="صياغة عبارات التهنئة والمباركة..."
                  required
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
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md shadow-pink-200"
                >
                  حفظ المناسبة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
