import React from 'react';
import { 
  Building2, 
  MapPin, 
  Award, 
  CheckCircle2, 
  ArrowLeft, 
  Flag, 
  Compass, 
  Sparkles, 
  Users, 
  Mic, 
  TrendingUp, 
  School, 
  ShieldCheck, 
  Calendar, 
  BookOpen, 
  ChevronLeft,
  Briefcase
} from 'lucide-react';

interface WebHomeProps {
  onNavigate: (tab: string) => void;
  onBookSpace?: (spaceType?: string) => void;
  onBookService?: (serviceName?: string) => void;
}

export const WebHome: React.FC<WebHomeProps> = ({ onNavigate, onBookSpace, onBookService }) => {
  return (
    <div className="w-full flex flex-col space-y-16 pb-12 font-sans text-right" dir="rtl">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-sm">
        {/* Architectural Rings Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center -translate-y-8">
          <svg className="w-[750px] h-[750px] text-[#002e69]" fill="none" viewBox="0 0 800 800">
            <circle cx="400" cy="400" r="380" stroke="currentColor" strokeDasharray="6 6" strokeWidth="1.5" />
            <circle cx="400" cy="400" r="310" stroke="currentColor" strokeWidth="1" />
            <circle cx="400" cy="400" r="240" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" />
            <circle cx="400" cy="400" r="170" stroke="currentColor" strokeWidth="1" />
            <circle cx="400" cy="400" r="100" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Text & Positioning */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              <div className="inline-flex items-center gap-2 bg-slate-100 text-[#002e69] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006d33] animate-pulse"></span>
                <span>شريك التأسيس والإدارة والنمو في سلطنة عُمان • صحار</span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-lg font-extrabold text-[#006d33]">
                  <span>ابدأ.</span>
                  <span>ابنِ.</span>
                  <span>اعمل.</span>
                  <span>انمُ.</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-[#002e69] leading-tight tracking-tight">
                  كل ما يحتاجه عملك،<br />
                  <span className="text-slate-700">في منظومة واحدة.</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                الدليل الشامل لاستشارات إدارة المشاريع — منظومة متكاملة من الخدمات والحلول المساندة للأعمال، صُممت لترافق رواد الأعمال والمستثمرين والشركات في كل خطوة من التأسيس إلى التوسع القيادي في قلب عاصمة عُمان الصناعية صحار.
              </p>

              {/* Dual Strategic Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center justify-center gap-2 bg-[#002e69] text-white font-bold px-6 py-3.5 rounded-xl hover:bg-[#14448c] transition-all shadow-md"
                >
                  <span>احجز جلستك الاستشارية</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('business-center')}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 text-[#002e69] font-bold px-6 py-3.5 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <Building2 className="w-4 h-4 text-[#006d33]" />
                  <span>مركز الأعمال في صحار</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#006d33]" />
                  <span className="font-semibold">ترخيص استشاري رسمي معتمد</span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#002e69]" />
                  <span className="font-semibold">محافظة شمال الباطنة، صحار</span>
                </div>
              </div>
            </div>

            {/* Interactive Visual Graphic */}
            <div className="lg:col-span-5 relative">
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-lg relative overflow-hidden flex flex-col items-center">
                <div className="relative w-64 h-64 rounded-full flex items-center justify-center bg-white border border-slate-200 shadow-inner my-4">
                  <div className="w-40 h-40 rounded-full bg-[#002e69] flex flex-col items-center justify-center text-center text-white shadow-lg p-3">
                    <Sparkles className="w-8 h-8 text-[#8df9a5] mb-1" />
                    <span className="text-base font-bold">المنظومة</span>
                    <span className="text-xs text-blue-200">صحار • عُمان</span>
                  </div>
                </div>

                <div className="text-center pt-2 max-w-xs">
                  <span className="text-xs text-[#006d33] font-bold uppercase tracking-wider block mb-1">منظومة الأعمال المترابطة</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    نجمع لك الاستشارات التنفيذية، التجهيز المكتبي، الإنتاج الإعلامي، وتمكين الكوادر تحت سقفٍ مؤسسي رصين.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-right">
              <div className="flex flex-col space-y-1">
                <span className="text-3xl font-extrabold text-[#002e69]">+15</span>
                <span className="text-sm font-bold text-slate-800">خدمة تخصصية متصلة</span>
                <span className="text-xs text-slate-500">تغطي كامل دورة حياة المشروع</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-3xl font-extrabold text-[#006d33]">100%</span>
                <span className="text-sm font-bold text-slate-800">مركز أعمال متكامل بصحار</span>
                <span className="text-xs text-slate-500">مكاتب تنفيذية وقاعات مجهزة</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-3xl font-extrabold text-[#002e69]">معتمد</span>
                <span className="text-sm font-bold text-slate-800">استشارات إدارة مشاريع</span>
                <span className="text-xs text-slate-500">وفق أعلى معايير الحوكمة العمانية</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-3xl font-extrabold text-[#006d33]">بيئة نمو</span>
                <span className="text-sm font-bold text-slate-800">ملتقى المستثمرين والرواد</span>
                <span className="text-xs text-slate-500">حاضنة مساندة وشبكة شركاء</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY & BRAND STORY */}
      <section className="w-full bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 bg-slate-800 text-[#8df9a5] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
              <Sparkles className="w-4 h-4" />
              <span>فلسفة الدليل الشامل</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white">
              أكثر من شركة استشارات.<br />
              <span className="text-[#8df9a5]">منظومة موحّدة للأعمال.</span>
            </h2>
            <div className="w-16 h-1 bg-[#006d33] rounded-full"></div>
            <p className="text-base text-slate-300 leading-relaxed font-medium">
              "لا تحتاج إلى التعامل مع سبع جهات متفرقة لتأسيس وتشغيل مشروعك... تحتاج إلى منظومة واحدة تدرك متطلبات أعمالك، وتختصر عليك الوقت والجهد والتكلفة."
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conventional Model */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">النموذج التقليدي المشتت</h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>تشتت القرارات بين مكاتب التأسيس والمحاسبة والتسويق.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>أعباء مالية مضاعفة لاستئجار مقرات عمل منفصلة.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>تأخر الإطلاق التجاري بسبب غياب خطة موحدة.</span>
                </li>
              </ul>
            </div>

            {/* Ecosystem Advantage */}
            <div className="bg-[#002e69] p-6 rounded-2xl border border-blue-800 space-y-4 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-[#006d33] flex items-center justify-center text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">منظومة الدليل الشامل</h3>
              <ul className="space-y-3 text-xs text-blue-100">
                <li className="flex items-start gap-2">
                  <span className="text-[#8df9a5]">✓</span>
                  <span>خطة تنفيذية ودراسة جدوى ترتبط مباشرة بإدارة التشغيل.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8df9a5]">✓</span>
                  <span>مكاتب فورية مجهزة وقاعات اجتماعات جاهزة في صحار.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8df9a5]">✓</span>
                  <span>استوديو بودكاست وإنتاج إعلامي لبناء هوية عملك.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6 PILLARS BENTO GRID */}
      <section className="w-full space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-[#002e69] px-4 py-1.5 rounded-full text-xs font-bold">
            <Flag className="w-4 h-4 text-[#006d33]" />
            <span>مسار رحلة الأعمال المتكاملة</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002e69]">
            أركان المنظومة الستة — رفيقك في كل محطة
          </h2>
          <p className="text-sm text-slate-600">
            بنينا خدماتنا وفق دورة نمو حقيقية ومنطقية، لتلبي احتياج المستثمر والريادي في سلطنة عُمان.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 01 */}
          <div 
            onClick={() => onNavigate('services')} 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#002e69] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#002e69] bg-blue-50 px-3 py-1 rounded-full">01 • ابدأ</span>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#002e69] flex items-center justify-center">
                  <Flag className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#002e69]">التأسيس ودراسات الجدوى</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تحويل الرؤى الاستثمارية إلى خطط أعمال متكاملة، ودراسات جدوى اقتصادية معمقة، وتسهيل الإجراءات التنظيمية.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#002e69] pt-2 border-t border-slate-100">
              <span>استشارات التأسيس والتراخيص</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 02 */}
          <div 
            onClick={() => onNavigate('services')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#006d33] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">02 • ابنِ</span>
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#006d33] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#006d33]">إدارة المشاريع والحوكمة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                إرساء المنهجيات القيادية للمشاريع (PMP)، تقييم المخاطر، ضبط الميزانيات، وحوكمة العمليات التشغيلية.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#006d33] pt-2 border-t border-slate-100">
              <span>استشارات الإدارة التشغيلية</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 03 */}
          <div 
            onClick={() => onNavigate('business-center')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#002e69] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#002e69] bg-blue-50 px-3 py-1 rounded-full">03 • اعمل</span>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#002e69] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#002e69]">مركز رجال الأعمال بصحار</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                مكاتب تنفيذية خاصة ومساحات عمل مشتركة فاخرة، قاعات اجتماعات مرئية، وخدمات سكرتارية وتجهيزات فندقية.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#002e69] pt-2 border-t border-slate-100">
              <span>مساحات وحلول مكتبية</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 04 */}
          <div 
            onClick={() => onNavigate('training')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#006d33] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">04 • تعلّم</span>
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#006d33] flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#006d33]">التدريب المهني وتطوير الكوادر</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                برامج تدريبية متقدمة في قيادة المشاريع، الإدارة المالية، وتنمية مهارات الكوادر الوطنية.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#006d33] pt-2 border-t border-slate-100">
              <span>أكاديمية التدريب والورش</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 05 */}
          <div 
            onClick={() => onNavigate('studio')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#002e69] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#002e69] bg-blue-50 px-3 py-1 rounded-full">05 • أنشئ</span>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#002e69] flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#002e69]">الاستوديو والإنتاج الإعلامي</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                استوديو متطور مجهز لتسجيل البودكاست المؤسسي، التصوير التجاري، وبناء الهويات الرقمية للشركات.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#002e69] pt-2 border-t border-slate-100">
              <span>استوديو المحتوى والإعلام</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 06 */}
          <div 
            onClick={() => onNavigate('knowledge-hub')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#006d33] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">06 • انمُ</span>
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#006d33] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#006d33]">تسريع الأعمال وشبكة الاستثمار</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ربط أصحاب المشاريع بشبكة من المستثمرين، فتح قنوات التوريد والتوسع الإقليمي، والمدونة الاستثمارية.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#006d33] pt-2 border-t border-slate-100">
              <span>مركز المعرفة والمدونة</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* SOHAR BUSINESS CENTER SPOTLIGHT */}
      <section className="w-full bg-[#002e69] text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-900 text-[#8df9a5] px-4 py-1.5 rounded-full text-xs font-bold">
              <Building2 className="w-4 h-4" />
              <span>مركز الدليل الشامل لخدمات رجال الأعمال في صحار</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              بيئة العمل التي تليق بطموحك المؤسسي في صحار
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              صُمم مركز الأعمال ليكون الوجهة المثالية للشركات المحلية والدولية، والمستثمرين، وأصحاب المشاريع الراغبين في تأسيس حضور راسخ ومتميز بمحافظة شمال الباطنة.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl space-y-1">
                <span className="text-sm font-bold text-white block">مكاتب تنفيذية خاصة</span>
                <span className="text-xs text-blue-200">مجهزة بالكامل بأعلى معايير الخصوصية</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl space-y-1">
                <span className="text-sm font-bold text-white block">قاعات اجتماعات ذكية</span>
                <span className="text-xs text-blue-200">شاشات تفاعلية وتقنيات مؤتمرات مرئية</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl space-y-1">
                <span className="text-sm font-bold text-white block">استوديو بودكاست وتصوير</span>
                <span className="text-xs text-blue-200">عزل صوتي ومعدات إنتاج احترافية</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl space-y-1">
                <span className="text-sm font-bold text-white block">سكرتارية وضيافة راقية</span>
                <span className="text-xs text-blue-200">استقبال رسمي وخدمات دعم لوجستي</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (onBookSpace) onBookSpace("مكتب تنفيذي");
                  else onNavigate('business-center');
                }}
                className="bg-[#006d33] hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>احجز مكتبك أو قاعتك الآن</span>
              </button>
              <span className="text-xs text-blue-200">صحار، فلج القبائل، بالقرب من الميناء والمنطقة الحرة</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center items-center">
            <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-4 w-full">
              <span className="text-xs font-bold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">حاضنة مساندة</span>
              <h3 className="text-xl font-bold text-[#002e69]">طلب استشارة أولية مجانية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                 احصل على جلسة تشخيصية مدتها 30 دقيقة مع خبراء إدارة المشاريع والتأسيس في صحار.
              </p>
              <button
                onClick={() => onNavigate('contact')}
                className="w-full bg-[#002e69] hover:bg-[#14448c] text-white font-bold py-3 rounded-xl transition-colors shadow-md text-sm"
              >
                احجز موعد الاستشارة الآن
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
