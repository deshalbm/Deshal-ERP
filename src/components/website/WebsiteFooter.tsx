import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, Globe } from 'lucide-react';

interface WebsiteFooterProps {
  onNavigate: (path: string) => void;
  currentLang: 'ar' | 'en';
}

export const WebsiteFooter: React.FC<WebsiteFooterProps> = ({ onNavigate, currentLang }) => {
  const isAr = currentLang === 'ar';

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 font-sans">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
          {/* Brand Bio */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#006d33] flex items-center justify-center text-white font-extrabold text-base shadow-inner">
                د
              </div>
              <span className="font-extrabold text-xl text-white">
                {isAr ? 'الدليل الشامل لاستشارات إدارة المشاريع' : 'Al Daleel Al Shamil Consultancies'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              {isAr
                ? 'منظومة استشارية وتنموية متكاملة في ولاية صحار بسلطنة عُمان. نقدم استشارات إدارة المشاريع المعتمدة، دراسات الجدوى الاقتصادية، وحلول بيئة الأعمال الحاضنة.'
                : 'Integrated management consultancy and business incubation ecosystem in Sohar, Sultanate of Oman.'}
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'ترخيص رسمي معتمد • ولاية صحار' : 'Official License • Sohar'}</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-bold text-white text-sm block">{isAr ? 'روابط المنظومة' : 'Ecosystem Navigation'}</span>
            <ul className="space-y-2.5 text-slate-400">
              <li><button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">{isAr ? 'الرئيسية' : 'Home'}</button></li>
              <li><button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">{isAr ? 'من نحن' : 'About Us'}</button></li>
              <li><button onClick={() => onNavigate('/services')} className="hover:text-white transition-colors">{isAr ? 'الخدمات الاستشارية' : 'Consulting Services'}</button></li>
              <li><button onClick={() => onNavigate('/business-center')} className="hover:text-white transition-colors">{isAr ? 'مركز الأعمال بصحار' : 'Sohar Business Center'}</button></li>
              <li><button onClick={() => onNavigate('/studio')} className="hover:text-white transition-colors">{isAr ? 'استوديو البودكاست' : 'Podcast Studio'}</button></li>
              <li><button onClick={() => onNavigate('/training')} className="hover:text-white transition-colors">{isAr ? 'التدريب والورش' : 'Training & Academy'}</button></li>
              <li><button onClick={() => onNavigate('/blog')} className="hover:text-white transition-colors">{isAr ? 'المدونة الاستثمارية ومركز المعرفة' : 'Blog & Knowledge Hub'}</button></li>
              <li><button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">{isAr ? 'حجز موعد وتواصل' : 'Contact & Booking'}</button></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-bold text-white text-sm block">{isAr ? 'المقر وساعات العمل' : 'Location & Contacts'}</span>
            <div className="space-y-2.5 text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#006d33] shrink-0 mt-0.5" />
                <span>{isAr ? 'ولاية صحار، محافظة شمال الباطنة، بالقرب من غرفة تجارة وصناعة عُمان وميناء صحار' : 'Sohar, Al Batinah North, near Chamber of Commerce & Sohar Port'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span dir="ltr">+968 2684 0000 / +968 9000 0000</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>info@alshamil.om</span>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#006d33] shrink-0" />
                <span>https://alshamil.om/</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs gap-4">
          <span>
            {isAr 
              ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} شركة الدليل الشامل لاستشارات إدارة المشاريع — صحار، سلطنة عُمان.`
              : `All Rights Reserved © ${new Date().getFullYear()} Al Daleel Al Shamil Project Management Consultancies — Sohar, Oman.`}
          </span>
          <span className="text-slate-400">
            {isAr ? 'منظومة الأعمال الرقمية المترابطة' : 'Integrated Digital Ecosystem'}
          </span>
        </div>
      </div>
    </footer>
  );
};
