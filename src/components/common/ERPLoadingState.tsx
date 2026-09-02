import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface ERPLoadingStateProps {
  labelAr?: string;
  labelEn?: string;
  minHeight?: string;
  className?: string;
}

export const ERPLoadingState: React.FC<ERPLoadingStateProps> = ({
  labelAr,
  labelEn,
  minHeight = 'min-h-[240px]',
  className = ''
}) => {
  const { isRTL } = useLanguage();

  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-200/60 ${minHeight} ${className}`}
    >
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-xs sm:text-sm font-bold text-slate-700">
        {isRTL ? labelAr || 'جاري تحميل البيانات...' : labelEn || 'Loading data...'}
      </p>
    </div>
  );
};
