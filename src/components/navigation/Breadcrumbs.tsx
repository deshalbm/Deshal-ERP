import React from 'react';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface BreadcrumbItem {
  label: string;
  tab?: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigateHome: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigateHome }) => {
  const { isRTL } = useLanguage();
  const SeparatorIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav
      id="erp-breadcrumbs-nav"
      aria-label="Breadcrumb"
      className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-slate-500 overflow-x-auto py-1 rtl:space-x-reverse no-scrollbar"
    >
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors cursor-pointer shrink-0"
        title={isRTL ? "الرئيسية" : "Home"}
      >
        <Home className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />
        <span className="hidden xs:inline">{isRTL ? "الرئيسية" : "Home"}</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1 || item.active;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <SeparatorIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {isLast ? (
              <span
                className="font-bold text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded-md shrink-0 truncate max-w-[180px] sm:max-w-[260px]"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="hover:text-indigo-600 transition-colors font-medium shrink-0 truncate max-w-[140px] cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
