import React from 'react';
import { FileText, ShieldCheck, TrendingUp, ArrowLeft, CheckCircle2, Building2, HelpCircle } from 'lucide-react';
import { loadConsultingServices } from '../../utils/storage';

interface WebServicesProps {
  onNavigate: (tab: string) => void;
  onBookService?: (serviceName: string) => void;
}

export const WebServices: React.FC<WebServicesProps> = ({ onNavigate, onBookService }) => {
  const erpServices = loadConsultingServices();

  const primaryServices = [
    {
      id: 'feasibility',
      title: 'دراسات الجدوى الاقتصادية والمعمقة',
      category: 'التأسيس والاستثمار',
      desc: 'إعداد دراسات جدوى مالية وتسويقية وفنية متكاملة تتوافق مع متطلبات بنك التنمية العماني وهيئة ريادة وصناديق التمويل.',
      features: ['تحليل مخاطر السوق', 'التدفقات النقدية المتوقعة', 'نموذج العمل التجاري', 'ملف التقديم للتمويل']
    },
    {
      id: 'pmp_governance',
      title: 'إدارة المشاريع وحوكمة العمليات (PMP)',
      category: 'إدارة تشغيلية',
      desc: 'تطبيق أحدث منهجيات معهد إدارة المشاريع العالمي (PMI) لضمان تنفيذ مشروعك ضمن الوقت والميزانية المحددة.',
      features: ['جداول زمنية ومخططات Gantt', 'إدارة المخاطر والتكاليف', 'تقارير الأداء الميدانية', 'حوكمة العقود والموردين']
    },
    {
      id: 'company_setup',
      title: 'تأسيس الشركات والتراخيص التجارية',
      category: 'التأسيس والامتثال',
      desc: 'تسهيل كافة إجراءات السجل التجاري، التراخيص الصناعية والتجارية عبر منصة استثمر بسهولة والجهات الحكومية بصحار.',
      features: ['تراخيص المنطقة الحرة وميناء صحار', 'صياغة عقود تأسيس الشركات', 'الاستشارات الضريبية والجمركية', 'تصاريح بيئية وبلدية']
    },
    {
      id: 'business_expansion',
      title: 'استشارات التوسع وإعادة الهيكلة',
      category: 'النمو والتوسع',
      desc: 'مساعدة الشركات القائمة على رفع كفاءتها التشغيلية، فتح فروع جديدة في صحار وشمال الباطنة، ودخول أسواق جديدة.',
      features: ['تقييم الأداء المؤسسي', 'خطة إعادة الهيكلة', 'شراكات استراتيجية', 'حلول أتمتة وإدارة ERP']
    }
  ];

  return (
    <div className="w-full flex flex-col space-y-12 pb-12 font-sans text-right" dir="rtl">
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-[#006d33] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
          <FileText className="w-4 h-4" />
          <span>خدماتنا الاستشارية والتنفيذية</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#002e69] leading-tight">
          حلول استشارية متكاملة تواكب رحلة مشروعك <br className="hidden sm:inline" />
          <span className="text-[#006d33]">من الفكرة حتى التوسع.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          نقدم باقة شاملة من الاستشارات الإدارية والمالية والتنظيمية المصممة خصيصاً لخدمة البيئة الاستثمارية في سلطنة عُمان ومحافظة شمال الباطنة.
        </p>
      </div>

      {/* PRIMARY CONSULTING SERVICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {primaryServices.map((service) => (
          <div key={service.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full inline-block">
                {service.category}
              </span>
              <h3 className="text-xl font-bold text-[#002e69]">{service.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{service.desc}</p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">أبرز المحاور والخدمات الفرعية:</span>
                <div className="grid grid-cols-2 gap-2">
                  {service.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006d33] shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onBookService) onBookService(service.title);
                else onNavigate('contact');
              }}
              className="w-full bg-[#002e69] hover:bg-[#14448c] text-white font-bold py-3 rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2 text-sm"
            >
              <span>طلب دراسة أو استشارة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* DYNAMIC ERP SERVICES CATALOG CONNECTION */}
      {erpServices.length > 0 && (
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#002e69]">دليل الخدمات المتاحة في النظام ERP</h3>
            <span className="text-xs text-slate-500 font-semibold">{erpServices.length} خدمة مسجلة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {erpServices.slice(0, 6).map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#002e69]">{s.name}</span>
                  <span className="text-xs font-bold text-[#006d33]">{s.basePrice} {s.currency || 'ر.ع'}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{s.shortDescription || 'خدمة تخصصية مقدمة عبر منظومة الدليل الشامل.'}</p>
                <button
                  onClick={() => {
                    if (onBookService) onBookService(s.name);
                    else onNavigate('contact');
                  }}
                  className="w-full text-xs font-bold text-[#002e69] hover:underline pt-1 text-left block"
                >
                  احجز الخدمة ←
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA BANNER */}
      <div className="bg-[#006d33] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-4xl font-extrabold">هل ترغب في تقييم أولي لمشروعك؟</h2>
        <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto leading-relaxed">
          تواصل مع خبراء التأسيس وإدارة المشاريع في صحار للحصول على استشارة تشخيصية وتحديد الخطة التنفيذية الأنسب لعملك.
        </p>
        <button
          onClick={() => onNavigate('contact')}
          className="bg-white text-[#006d33] font-extrabold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-lg inline-flex items-center gap-2 text-sm"
        >
          <span>احجز جلسة استشارية مجانية (30 دقيقة)</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
