import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLang: 'ar' | 'en';
  onToggleLang: (lang: 'ar' | 'en') => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onToggleLang }) => {
  return (
    <button
      onClick={() => onToggleLang(currentLang === 'ar' ? 'en' : 'ar')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs"
      title={currentLang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
    >
      <Globe className="w-3.5 h-3.5 text-[#002e69]" />
      <span>{currentLang === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};
