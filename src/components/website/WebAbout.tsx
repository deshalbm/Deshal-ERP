import React from 'react';
import { Award, ShieldCheck, MapPin, Target, Compass, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface WebAboutProps {
  onNavigate: (tab: string) => void;
}

export const WebAbout: React.FC<WebAboutProps> = ({ onNavigate }) => {
  return (
    <div className="w-full flex flex-col space-y-12 pb-12 font-sans text-right" dir="rtl">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#002e69] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
          <Compass className="w-4 h-4 text-[#006d33]" />
          <span>عن الشركة • صحار، سلطنة عُمان</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#002e69] leading-tight">
          نبني بيئة الأعمال التي تمكّن <span className="text-[#006d33]">الطموح</span> في عُمان.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          تأسست شركة الدليل الشامل لاستشارات إدارة المشاريع في ولاية صحار لتكون المرجع الاستشاري والإداري الأول الذي يجمع بين التخطيط الاستراتيجي، دراسات الجدوى الاقتصادية، وتجهيز مساحات العمل الحاضنة.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-[#002e69]">رؤية 2040</span>
            <span className="text-xs text-slate-500 block">مواكبة المحور الاقتصادي والتنموي</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-[#006d33]">صحار</span>
            <span className="text-xs text-slate-500 block">المركز الاستراتيجي والبوابة البحرية</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-[#002e69]">معايير PMP</span>
            <span className="text-xs text-slate-500 block">إدارة المشاريع بالاحترافية المعتمدة</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-[#006d33]">بيئة كاملة</span>
            <span className="text-xs text-slate-500 block">حاضنة متكاملة ومراكز أعمال</span>
          </div>
        </div>
      </div>

      {/* STRATEGIC PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#002e69] flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#002e69]">الرؤية</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            أن نكون الشريك الاستشاري والتشغيلي المفضل والمنظومة الأولى لتمكين المستثمرين ورواد الأعمال في سلطنة عُمان والمنطقة الإقليمية.
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#006d33] flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#002e69]">الرسالة</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            تقديم استشارات إدارة مشاريع عالية الجودة، وتوفير بيئة مكتبية وإعلامية وتدريبية متكاملة تضمن نجاح المشاريع من التأسيس إلى التوسع.
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#002e69] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#002e69]">القيم المؤسسية</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            النزاهة، الحوكمة الدقيقة، الابتكار في حلول الأعمال، والالتزام المطلق بتحقيق القيمة المضافة لشركائنا.
          </p>
        </div>
      </div>

      {/* LEADERSHIP & GOVERNANCE */}
      <div className="bg-[#002e69] text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-bold text-[#8df9a5] bg-blue-900 px-3 py-1 rounded-full">القيادة والخبرة العُمانية</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold">منظومة تُدار بكفاءات وطنية عالية</h2>
          <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
            يمتلك فريق العمل خبرات تزيد عن 15 عاماً في قطاع الاستشارات الاستثمارية والتنفيذية والتطوير العقاري والإداري بمحافظة شمال الباطنة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl space-y-2">
            <span className="text-lg font-bold text-white block">استشارات تأسيس الشركات</span>
            <span className="text-xs text-blue-200 leading-relaxed block">دعم إجراءات منصة استثمر بسهولة والتراخيص الصناعية والتجارية.</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl space-y-2">
            <span className="text-lg font-bold text-white block">دراسات الجدوى المعتمدة</span>
            <span className="text-xs text-blue-200 leading-relaxed block">تحليلات مالية وفنية مقبولة لدى بنك التنمية العماني وهيئة ريادة.</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl space-y-2">
            <span className="text-lg font-bold text-white block">إدارة المشاريع الميدانية</span>
            <span className="text-xs text-blue-200 leading-relaxed block">متابعة تنفيذية ودقيقة لمراحل الإنشاء والتشغيل.</span>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={() => onNavigate('contact')}
            className="bg-[#006d33] hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
          >
            <span>احجز جلسة استشارية مع قيادة الفريق</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
