import React from 'react';
import { MapPin, Phone, Building2, Lock, Menu, ArrowLeft } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface WebsiteHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentLang: 'ar' | 'en';
  onToggleLang: (lang: 'ar' | 'en') => void;
  onNavigateToERP?: () => void;
  onOpenMobileMenu?: () => void;
}

export const WebsiteHeader: React.FC<WebsiteHeaderProps> = ({
  currentPath,
  onNavigate,
  currentLang,
  onToggleLang,
  onNavigateToERP,
  onOpenMobileMenu
}) => {
  const isAr = currentLang === 'ar';

  const navLinks = [
    { path: '/', label: isAr ? 'الرئيسية' : 'Home' },
    { path: '/about', label: isAr ? 'من نحن' : 'About Us' },
    { path: '/services', label: isAr ? 'خدماتنا' : 'Services' },
    { path: '/business-center', label: isAr ? 'مركز الأعمال' : 'Business Center' },
    { path: '/studio', label: isAr ? 'الاستوديو' : 'Studio' },
    { path: '/training', label: isAr ? 'التدريب' : 'Training' },
    { path: '/blog', label: isAr ? 'المدونة والمعرفة' : 'Blog & Knowledge' },
    { path: '/contact', label: isAr ? 'اتصل بنا' : 'Contact Us' }
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-3">
        
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="xl:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
          title={isAr ? 'القائمة الرئيسية' : 'Main Menu'}
        >
          <Menu className="w-5 h-5 text-[#002e69]" />
        </button>

        {/* Brand Identity */}
        <div 
          onClick={() => onNavigate('/')} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <img
            src="/assets/images/deshal_logo.png"
            alt="الدليل الشامل"
            className="h-10 w-auto object-contain"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div className="flex flex-col text-right">
            <span className="font-extrabold text-lg sm:text-xl text-[#002e69] leading-tight group-hover:text-[#14448c] transition-colors">
              {isAr ? 'الدليل الشامل' : 'Al Daleel Al Shamil'}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {isAr ? 'لاستشارات إدارة المشاريع | صحار' : 'Project Management Consultancies | Sohar'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center space-x-reverse space-x-1">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path || 
              (currentPath === '' && link.path === '/') ||
              (link.path === '/blog' && (currentPath === '/knowledge' || currentPath === '/blogs'));
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isActive 
                    ? 'text-[#002e69] bg-blue-50 border border-blue-100' 
                    : 'text-slate-600 hover:text-[#002e69] hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Location, Language & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-[#006d33]" />
            <span>{isAr ? 'صحار، عُمان' : 'Sohar, Oman'}</span>
          </div>

          <LanguageSwitcher currentLang={currentLang} onToggleLang={onToggleLang} />

          {/* Go to ERP Button */}
          {onNavigateToERP && (
            <button
              onClick={onNavigateToERP}
              className="inline-flex items-center gap-1.5 bg-[#006d33] hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 sm:px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0"
              title={isAr ? 'الدخول لنظام ERP' : 'Access ERP Portal'}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAr ? 'دخول النظام (ERP)' : 'Go to ERP'}</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('/contact')}
            className="hidden sm:inline-flex items-center justify-center bg-[#002e69] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl hover:bg-[#14448c] transition-all shadow-md shrink-0"
          >
            {isAr ? 'حجز موعد' : 'Book'}
          </button>
        </div>
      </div>

      {/* Persistent Secondary Navigation Bar for Tablet & Small Screens */}
      <div className="xl:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50 gap-2 scrollbar-none">
        {navLinks.map((link) => {
          const isActive = currentPath === link.path || 
            (currentPath === '' && link.path === '/') ||
            (link.path === '/blog' && (currentPath === '/knowledge' || currentPath === '/blogs'));
          return (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-[#002e69] text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
