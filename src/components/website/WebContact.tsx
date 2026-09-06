import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Calendar, Building2, User, FileText, ArrowRight } from 'lucide-react';
import { Customer } from '../../types';
import { loadCustomers, saveCustomers } from '../../utils/storage';

interface WebContactProps {
  onNavigate: (tab: string) => void;
  prefilledInterest?: string;
}

export const WebContact: React.FC<WebContactProps> = ({ onNavigate, prefilledInterest }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    serviceInterest: prefilledInterest || 'استشارات التأسيس ودراسة الجدوى',
    notes: '',
    preferredDate: '',
    preferredTime: '10:00'
  });

  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('الرجاء إدخال الاسم ورقم الهاتف على الأقل للتواصل.');
      return;
    }

    try {
      // Create ERP Customer / Lead Entry
      const customers = loadCustomers();
      const newLead: Customer = {
        id: `CUST-WEB-${Date.now()}`,
        name: formData.name.trim(),
        contactPerson: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: 'صحار، سلطنة عُمان',
        city: 'صحار',
        type: formData.company ? 'CORPORATE' : 'INDIVIDUAL',
        status: 'LEAD',
        notes: `[طلب من الموقع الإلكتروني] الخدمة المهتم بها: ${formData.serviceInterest}. التاريخ المفضل: ${formData.preferredDate} الساعة ${formData.preferredTime}. ملاحظات: ${formData.notes}`,
        tags: ['موقع إلكتروني', 'طلب استشارة', 'صحار'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCustomers([newLead, ...customers]);
      setSubmitted(true);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء حفظ الطلب. الرجاء المحاولة مرة أخرى.');
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4 font-sans text-right" dir="rtl">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-[#006d33] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">تم استلام طلبك بنجاح</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002e69]">تم تأكيد طلب حجز جلستك الاستشارية!</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              شكراً لتواصلك مع منظومة الدليل الشامل. تم تسجيل طلبك وتوجيهه إلى فريق مستشارينا في صحار، وسيتواصل معك أحد المستشارين خلال 24 ساعة.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-md mx-auto text-xs text-slate-700 space-y-2 text-right">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">الاسم:</span>
              <span className="font-bold">{formData.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">رقم الهاتف:</span>
              <span className="font-bold">{formData.phone}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">الخدمة المطلوبة:</span>
              <span className="font-bold text-[#006d33]">{formData.serviceInterest}</span>
            </div>
            {formData.preferredDate && (
              <div className="flex justify-between">
                <span className="text-slate-500">الموعد المقترح:</span>
                <span className="font-bold">{formData.preferredDate} ({formData.preferredTime})</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="bg-[#002e69] text-white font-bold px-6 py-3 rounded-xl text-xs hover:bg-[#14448c] transition-all shadow-md"
            >
              العودة للرئيسية
            </button>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-xl text-xs hover:bg-slate-200 transition-all"
            >
              إرسال طلب آخر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-12 pb-12 font-sans text-right" dir="rtl">
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#002e69] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
          <Phone className="w-4 h-4 text-[#006d33]" />
          <span>تواصل معنا وحجز موعد • صحار</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#002e69] leading-tight">
          تواصل مع خبراء <span className="text-[#006d33]">الدليل الشامل</span> — <br />
          خطوتك الأولى نحو قرارات استثمارية وإدارية واثقة.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          يسرنا استقبالك في مقرنا الرئيسي بولاية صحار أو تقديم الجلسات الاستشارية افتراضياً عبر Google Meet و Teams.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CONTACT INFO CARD */}
        <div className="lg:col-span-5 bg-[#002e69] text-white rounded-3xl p-8 space-y-8 shadow-xl">
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#8df9a5] bg-blue-900 px-3 py-1 rounded-full">بيانات التواصل المباشر</span>
            <h3 className="text-2xl font-bold">مقر الشركة في صحار</h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              محافظة شمال الباطنة، ولاية صحار، الشارع التجاري بالقرب من غرفة تجارة وصناعة عُمان وميناء صحار.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <Phone className="w-5 h-5 text-[#8df9a5] shrink-0" />
              <div>
                <span className="text-blue-200 block">الهاتف الرئيسي الموحد:</span>
                <span className="font-bold text-sm text-white" dir="ltr">+968 2684 0000 / +968 9000 0000</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <Mail className="w-5 h-5 text-[#8df9a5] shrink-0" />
              <div>
                <span className="text-blue-200 block">البريد الإلكتروني الرسمي:</span>
                <span className="font-bold text-sm text-white" dir="ltr">info@alshamil.om</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <Clock className="w-5 h-5 text-[#8df9a5] shrink-0" />
              <div>
                <span className="text-blue-200 block">أوقات العمل الرسمية:</span>
                <span className="font-bold text-white">الأحد - الخميس: 8:00 صباحاً - 5:00 مساءً</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOOKING FORM */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-[#002e69]">نموذج حجز استشارة أو مساحة أعمال</h3>
            <p className="text-xs text-slate-500">قم بتعبئة البيانات وسيقوم فريقنا بتأكيد الموعد وإرسال دعوة الحضور.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: سالم بن حمد العبري"
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">رقم الهاتف / الواتساب *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="968XXXXXXXX+"
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">اسم الشركة / المشروع (إن وجد)</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="اسم مؤسستك أو مشروعك الناشئ"
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">الخدمة أو المساحة المهتم بها</label>
              <select
                value={formData.serviceInterest}
                onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none bg-white"
              >
                <option value="استشارات التأسيس ودراسة الجدوى">استشارات التأسيس ودراسة الجدوى الاقتصادية</option>
                <option value="إدارة المشاريع وحوكمة العمليات PMP">إدارة المشاريع وحوكمة العمليات (PMP)</option>
                <option value="حجز مكتب تنفيذي في صحار">حجز مكتب تنفيذي في مركز الأعمال بصحار</option>
                <option value="حجز قاعة اجتماعات ذكية">حجز قاعة اجتماعات ذكية</option>
                <option value="حجز استوديو البودكاست والإنتاج">حجز استوديو البودكاست والإنتاج المرئي</option>
                <option value="التسجيل في البرامج التدريبية">التسجيل في البرامج التدريبية وأكاديمية PMP</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">التاريخ المفضل</label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">الوقت المفضل</label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none bg-white"
                >
                  <option value="09:00">09:00 صباحاً</option>
                  <option value="11:00">11:00 صباحاً</option>
                  <option value="14:00">02:00 ظهراً</option>
                  <option value="16:00">04:00 عصراً</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">تفاصيل الاستفسار / الملاحظات</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="اكتب نبذة عن مشروعك أو استفسارك هنا..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#002e69] focus:outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-[#006d33] hover:bg-emerald-600 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md inline-flex items-center justify-center gap-2 text-sm pt-3"
            >
              <Send className="w-4 h-4" />
              <span>إرسال طلب الحجز والتأكيد</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
