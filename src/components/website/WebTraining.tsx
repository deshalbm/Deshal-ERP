import React from 'react';
import { School, Award, Users, BookOpen, Calendar, CheckCircle2, ArrowLeft } from 'lucide-react';

interface WebTrainingProps {
  onNavigate: (tab: string) => void;
  onBookService?: (serviceName: string) => void;
}

export const WebTraining: React.FC<WebTrainingProps> = ({ onNavigate, onBookService }) => {
  const courses = [
    {
      id: 'pmp_course',
      title: 'إدارة المشاريع الاحترافية (PMP® Certification Prep)',
      hours: '35 ساعة معتمدة',
      audience: 'مدراء المشاريع والمهندسون والمستشارون',
      desc: 'برنامج تدريبي مكثف يؤهلك لاجتياز اختبار إدارة المشاريع الاحترافية الصادر عن معهد PMI أمريكا، وتطبيق أفضل الممارسات الميدانية.'
    },
    {
      id: 'feasibility_finance',
      title: 'إعداد الجدوى المالية والتحليل الاقتصادي للمشاريع',
      hours: '20 ساعة تدريبية',
      audience: 'رواد الأعمال والمستثمرون والمحللون الماليون',
      desc: 'ورشة عمل تطبيقية تمنحك مهارات حساب المؤشرات المالية (NPV, IRR, Payback Period) وإعداد خطة العمل التمويلية.'
    },
    {
      id: 'agile_scrum',
      title: 'إدارة المشاريع المرنة Agile & Scrum Governance',
      hours: '16 ساعة معتمدة',
      audience: 'فرق التطوير والابتكار والمؤسسات النامية',
      desc: 'التحول إلى منهجيات العمل السريعة المرنة وتوجيه فرق العمل لإنجاز الدورات التشغيلية بكفاءة وتكيف عالٍ.'
    }
  ];

  return (
    <div className="w-full flex flex-col space-y-12 pb-12 font-sans text-right" dir="rtl">
      {/* HERO BANNER */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-[#006d33] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
          <School className="w-4 h-4" />
          <span>أكاديمية التدريب المهني وتطوير الكوادر • صحار</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#002e69] leading-tight">
          نصنع الكفاءات القيادية ونُمكّن فرق العمل لصناعة <br />
          <span className="text-[#006d33]">أثر حقيقي ومستدام.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          تقدم أكاديمية الدليل الشامل برامج تدريبية تخصصية معتمدة تمزج بين المنهجيات العالمية (PMI) والواقع التشغيلي لسوق العمل العماني.
        </p>
      </div>

      {/* COURSES LIST */}
      <div className="space-y-6">
        <h3 className="text-2xl font-extrabold text-[#002e69]">البرامج والورش التدريبية القادمة</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">{c.hours}</span>
                <h4 className="text-lg font-bold text-[#002e69]">{c.title}</h4>
                <p className="text-xs text-slate-500 font-semibold">الفئة المستهدفة: {c.audience}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{c.desc}</p>
              </div>

              <button
                onClick={() => {
                  if (onBookService) onBookService(c.title);
                  else onNavigate('contact');
                }}
                className="w-full bg-[#002e69] hover:bg-[#14448c] text-white font-bold py-3 rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2 text-xs"
              >
                <span>التسجيل في الدورة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
