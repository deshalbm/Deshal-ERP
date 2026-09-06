import React from 'react';
import { ChevronLeft, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  tabId?: string;
  url?: string;
}

interface WebsiteBreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (tabId: string) => void;
}

export const WebsiteBreadcrumbs: React.FC<WebsiteBreadcrumbsProps> = ({ items, onNavigate }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="مسار التصفح" className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 rounded-lg mb-6">
      <ol className="flex items-center flex-wrap gap-2 list-none m-0 p-0" dir="rtl">
        <li className="flex items-center gap-1.5">
          <button
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-1 text-[#002e69] hover:underline transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>الرئيسية</span>
          </button>
        </li>
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {idx === items.length - 1 ? (
              <span className="text-slate-900 font-bold" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => item.tabId && onNavigate?.(item.tabId)}
                className="text-[#002e69] hover:underline transition-colors"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
