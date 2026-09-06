import React from 'react';
import { Building2, MapPin, Users, Calendar, Wifi, ShieldCheck, Coffee, Monitor, CheckCircle2, ArrowLeft } from 'lucide-react';
import { loadRentalSpaces } from '../../utils/storage';

interface WebBusinessCenterProps {
  onNavigate: (tab: string) => void;
  onBookSpace?: (spaceType: string) => void;
}

export const WebBusinessCenter: React.FC<WebBusinessCenterProps> = ({ onNavigate, onBookSpace }) => {
  const erpSpaces = loadRentalSpaces();

  const spaceTypes = [
    {
      id: 'exec_office',
      title: 'مكاتب تنفيذية خاصة (Executive Offices)',
      desc: 'مكاتب مغلقة مؤثثة بالكامل بأرقى أثاث مكتبي، مجهزة بشبكة أنترنت فائقة السرعة، خدمات طباعة، وعناوين تجارية معتمدة.',
      price: 'ابتداءً من 120 ر.ع / شهرياً',
      features: ['تأثيث مكتبي فاخر', 'دخول 24/7 بمنظومة أمنية', 'عنوان تجاري معتمد للترخيص', 'خدمات ضيافة واستقبال']
    },
    {
      id: 'coworking',
      title: 'مساحات عمل مشتركة (Shared Coworking)',
      desc: 'مكاتب مرنة في بيئة هادئة ومحفزة للتركيز، مثالية للرواد والمستشارين والمستثمرين المستقلين.',
      price: 'ابتداءً من 35 ر.ع / شهرياً',
      features: ['إنترنت ألياف بصرية سرعة 1Gbps', 'استخدام المطبخ والضيافة', 'خصم على قاعات الاجتماعات', 'شبكة تشبيك ورواد أعمال']
    },
    {
      id: 'meeting_rooms',
      title: 'قاعات اجتماعات ذكية (Smart Boardrooms)',
      desc: 'قاعات اجتماعات تتسع من 6 إلى 25 شخصاً مجهزة بشاشات عرض تفاعلية، أجهزة عقد المؤتمرات المرئية، وعزل صوتي كامل.',
      price: 'ابتداءً من 10 ر.ع / ساعة',
      features: ['عرض تفاعلي HD 75 بوصة', 'أنظمة صوتية وعزل ضوضاء', 'ضيافة قهوة وشاي فاخرة', 'تكييف وتحكم بدرجة الحرارة']
    },
    {
      id: 'virtual_office',
      title: 'المكاتب الافتراضية والعنوان التجاري',
      desc: 'حصول مشروعك على عنوان مرخص رسمياً في صحار مع خدمة استلام الطرود والرسائل والرد الهاتفي باسم منطمتك.',
      price: 'ابتداءً من 25 ر.ع / شهرياً',
      features: ['سجل تجاري وعنوان مرخص', 'إدارة وتوجيه البريد والطرود', 'استقبال المكالمات وإخطار فورية', 'ساعات مجانية لقاعات الاجتماعات']
    }
  ];

  return (
    <div className="w-full flex flex-col space-y-12 pb-12 font-sans text-right" dir="rtl">
      {/* HERO BANNER */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#002e69] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
          <Building2 className="w-4 h-4 text-[#006d33]" />
          <span>مركز الأعمال بصحار • فلج القبائل بالقرب من الميناء</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#002e69] leading-tight">
          مركز الدليل الشامل للأعمال — <br />
          <span className="text-[#006d33]">مساحتك التنفيذية الأرقى للريادة والنمو في صحار.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          يوفر مركز الأعمال حلولاً مكتبية متكاملة تتكيف مع احتياجات عملك، بدءاً من المكاتب الافتراضية إلى الأجنحة التنفيذية وقاعات الاجتماعات الذكية.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#006d33]" />
            <span className="font-semibold">إنترنت فائقة السرعة</span>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-[#002e69]" />
            <span className="font-semibold">ضيافة واستقبال راقٍ</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#006d33]" />
            <span className="font-semibold">دخول آمن 24/7</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#002e69]" />
            <span className="font-semibold">موقع صحار الاستراتيجي</span>
          </div>
        </div>
      </div>

      {/* SPACE OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {spaceTypes.map((space) => (
          <div key={space.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#002e69]">{space.title}</h3>
                <span className="text-xs font-bold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">{space.price}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{space.desc}</p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">المميزات والتسهيلات:</span>
                <div className="grid grid-cols-2 gap-2">
                  {space.features.map((f, i) => (
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
                if (onBookSpace) onBookSpace(space.title);
                else onNavigate('contact');
              }}
              className="w-full bg-[#002e69] hover:bg-[#14448c] text-white font-bold py-3 rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2 text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>احجز هذا المساحة الآن</span>
            </button>
          </div>
        ))}
      </div>

      {/* SYNCED ERP SPACES LIST */}
      {erpSpaces.length > 0 && (
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#002e69]">المساحات والقاعات المسجلة في ERP</h3>
            <span className="text-xs text-slate-500 font-semibold">{erpSpaces.length} مساحة موثقة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {erpSpaces.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#002e69]">{s.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'AVAILABLE' ? 'bg-emerald-100 text-[#006d33]' : 'bg-amber-100 text-amber-800'}`}>
                    {s.status === 'AVAILABLE' ? 'متاح' : 'محجوز'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{s.type} • سعة {s.capacity || '4'} أشخاص</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-800">{s.hourlyRate || s.monthlyRate} ر.ع</span>
                  <button
                    onClick={() => {
                      if (onBookSpace) onBookSpace(s.name);
                      else onNavigate('contact');
                    }}
                    className="text-[#002e69] font-bold hover:underline"
                  >
                    حجز →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
