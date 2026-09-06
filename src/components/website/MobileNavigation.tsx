import React from 'react';
import { Compass, FileText, Building2, Mic, School, BookOpen, Phone, X, Lock } from 'lucide-react';

interface MobileNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentLang: 'ar' | 'en';
  onNavigateToERP?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onClose,
  currentLang,
  onNavigateToERP
}) => {
  if (!isOpen) return null;

  const isAr = currentLang === 'ar';

  const navItems = [
    { path: '/', label: isAr ? 'الرئيسية' : 'Home', icon: Compass },
    { path: '/about', label: isAr ? 'عن الشركة' : 'About Us', icon: Compass },
    { path: '/services', label: isAr ? 'الخدمات الاستشارية' : 'Services', icon: FileText },
    { path: '/business-center', label: isAr ? 'مركز الأعمال بصحار' : 'Business Center', icon: Building2 },
    { path: '/studio', label: isAr ? 'استوديو البودكاست' : 'Podcast Studio', icon: Mic },
    { path: '/training', label: isAr ? 'التدريب والورش' : 'Training', icon: School },
    { path: '/blog', label: isAr ? 'المدونة ومركز المعرفة' : 'Blog & Knowledge Hub', icon: BookOpen },
    { path: '/contact', label: isAr ? 'حجز موعد وتواصل' : 'Contact Us', icon: Phone }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex justify-end">
      <div className="bg-white w-4/5 max-w-sm h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between text-right" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="font-extrabold text-[#002e69] text-base">{isAr ? 'القائمة الرئيسية للموقع' : 'Website Navigation'}</span>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive ? 'bg-[#002e69] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#006d33]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          {onNavigateToERP && (
            <button
              onClick={() => {
                onClose();
                onNavigateToERP();
              }}
              className="w-full bg-[#006d33] hover:bg-emerald-600 text-white font-extrabold py-3 rounded-xl text-xs text-center shadow-md flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isAr ? 'دخول نظام Deshal ERP' : 'Go to ERP System'}</span>
            </button>
          )}

          <button
            onClick={() => {
              onNavigate('/contact');
              onClose();
            }}
            className="w-full bg-[#002e69] text-white font-bold py-3 rounded-xl text-xs text-center shadow-xs"
          >
            {isAr ? 'حجز جلسة استشارية' : 'Book Consultation'}
          </button>
        </div>
      </div>
    </div>
  );
};
