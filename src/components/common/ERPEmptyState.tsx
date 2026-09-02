import React from 'react';
import { PlusCircle, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface ERPEmptyStateProps {
  icon: React.ElementType;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionLabelAr?: string;
  actionLabelEn?: string;
  onAction?: () => void;
  learnMoreTopic?: string;
  onLearnMore?: () => void;
  className?: string;
}

export const ERPEmptyState: React.FC<ERPEmptyStateProps> = ({
  icon: Icon,
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
  actionLabelAr,
  actionLabelEn,
  onAction,
  learnMoreTopic,
  onLearnMore,
  className = ''
}) => {
  const { isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-3xl bg-slate-50/80 border border-dashed border-slate-200 flex flex-col items-center justify-center max-w-xl mx-auto my-6 animate-in fade-in duration-200 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-xs mb-4">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5">
        {isRTL ? titleAr : titleEn}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed mb-6">
        {isRTL ? descriptionAr : descriptionEn}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onAction && actionLabelAr && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isRTL ? actionLabelAr : actionLabelEn}</span>
          </button>
        )}

        {onLearnMore && (
          <button
            onClick={onLearnMore}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>{isRTL ? 'معرفة المزيد' : 'Learn More'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
