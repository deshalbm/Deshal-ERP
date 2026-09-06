import React from 'react';
import { Mic, Video, Sparkles, CheckCircle2, Calendar, Radio, ArrowLeft } from 'lucide-react';

interface WebStudioProps {
  onNavigate: (tab: string) => void;
  onBookService?: (serviceName: string) => void;
}

export const WebStudio: React.FC<WebStudioProps> = ({ onNavigate, onBookService }) => {
  return (
    <div className="w-full flex flex-col space-y-12 pb-12 font-sans text-right" dir="rtl">
      {/* HERO BANNER */}
      <div className="bg-[#002e69] text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-900 text-[#8df9a5] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
          <Mic className="w-4 h-4" />
          <span>استوديو الدليل الشامل الصوتي والمرئي • صحار</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black leading-tight">
          بيئتك المتكاملة لصناعة محتوى استثنائي <br />
          <span className="text-[#8df9a5]">وبودكاست يليق بعلامتك التجارية.</span>
        </h1>

        <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-3xl">
          أول استوديو بودكاست وتصوير مرئي احترافي مجهز بأحدث كاميرات وميكروفونات الإنتاج بصحار، مع حلول مونتاج وتوجيه محتوى مخصصة للمؤسسات والرواد.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          <button
            onClick={() => {
              if (onBookService) onBookService('حجز استوديو البودكاست');
              else onNavigate('contact');
            }}
            className="bg-[#006d33] hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md inline-flex items-center gap-2 text-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>احجز الجلسة التسجيلية الآن</span>
          </button>
        </div>
      </div>

      {/* STUDIO FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#002e69] flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#002e69]">معدات صوتية احترافية</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            ميكروفونات Shure SM7B معالجة رقمياً عبر أجهزة Rodecaster Pro II لعزل إلكتروني تام وتناغم صوتي إذاعي.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#006d33] flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#002e69]">تصوير متعدد الكاميرات 4K</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            منظومة كاميرات Sony Cinema مع إضاءة Godox وسيناريو إخراج ديناميكي يضمن تغطية بودكاست ومقابلات عالية الجودة.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#002e69] flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#002e69]">خدمات المونتاج والإخراج</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            فريق مونتاج متمكن لإخراج الحلقات، اقتطاع الريلز والحلقات القصيرة، وإعداد الهوية البصرية للبرامج.
          </p>
        </div>
      </div>

      {/* STUDIO PACKAGES */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6">
        <h3 className="text-xl font-bold text-[#002e69]">باقات حجز الاستوديو</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#002e69] bg-blue-50 px-3 py-1 rounded-full">تسجيل صبيحة / ساعة</span>
              <h4 className="text-lg font-bold text-slate-900">باقة التسجيل الصوتي</h4>
              <span className="text-2xl font-extrabold text-[#006d33] block">15 ر.ع / ساعة</span>
              <p className="text-xs text-slate-500">حجز الاستوديو مع مهندس صوت وتسليم الملفات الصوتية الخام.</p>
            </div>
            <button
              onClick={() => {
                if (onBookService) onBookService('باقة التسجيل الصوتي');
                else onNavigate('contact');
              }}
              className="w-full bg-[#002e69] hover:bg-[#14448c] text-white font-bold py-2.5 rounded-xl transition-colors text-xs"
            >
              احجز الآن
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-[#006d33] shadow-md space-y-4 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-6 bg-[#006d33] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full">الأكثر طلباً</div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">بودكاست مرئي متكامل</span>
              <h4 className="text-lg font-bold text-slate-900">باقة البودكاست المرئي 4K</h4>
              <span className="text-2xl font-extrabold text-[#006d33] block">35 ر.ع / ساعة</span>
              <p className="text-xs text-slate-500">تسجيل صوت وصورة 3 كاميرات، مهندس صوت وفني إضاءة وتسليم الفيديو المخرج.</p>
            </div>
            <button
              onClick={() => {
                if (onBookService) onBookService('باقة البودكاست المرئي 4K');
                else onNavigate('contact');
              }}
              className="w-full bg-[#006d33] hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-colors text-xs"
            >
              احجز الآن
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#002e69] bg-blue-50 px-3 py-1 rounded-full">برنامج كامل 6 حلقات</span>
              <h4 className="text-lg font-bold text-slate-900">باقة الموسم المؤسسي</h4>
              <span className="text-2xl font-extrabold text-[#006d33] block">180 ر.ع / موسم</span>
              <p className="text-xs text-slate-500">إنتاج موسم كامل مع الهندسة الصوتية، المونتاج، واقتطاع 12 مقطع قصير للميديا.</p>
            </div>
            <button
              onClick={() => {
                if (onBookService) onBookService('باقة الموسم المؤسسي للبودكاست');
                else onNavigate('contact');
              }}
              className="w-full bg-[#002e69] hover:bg-[#14448c] text-white font-bold py-2.5 rounded-xl transition-colors text-xs"
            >
              طلب عرض سعر للموسم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
