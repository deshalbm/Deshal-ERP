import React from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  List,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface ActionToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  filterComponent?: React.ReactNode;
  children?: React.ReactNode;
  totalCount?: number;
  totalCountLabel?: string;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  onAddNew,
  addNewLabel,
  onExportExcel,
  onExportPdf,
  onPrint,
  onRefresh,
  viewMode,
  onViewModeChange,
  filterComponent,
  children,
  totalCount,
  totalCountLabel
}) => {
  const { isRTL } = useLanguage();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-3 mb-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search & Counter */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder || (isRTL ? 'بحث سريع...' : 'Quick search...')}
              className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs sm:text-sm text-slate-900 transition-all outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {totalCount !== undefined && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shrink-0">
              <span>{totalCountLabel || (isRTL ? 'العدد الإجمالي:' : 'Total:')}</span>
              <span className="text-indigo-600 font-mono font-black">{totalCount}</span>
            </div>
          )}
        </div>

        {/* Action Buttons & Utilities */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* View Mode Toggle */}
          {viewMode && onViewModeChange && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title={isRTL ? 'عرض كجدول' : 'Table View'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title={isRTL ? 'عرض كبطاقات' : 'Cards View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title={isRTL ? 'تحديث البيانات' : 'Refresh'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Export & Print Controls */}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer"
              title={isRTL ? 'تصدير إكسل' : 'Export Excel'}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          )}

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-rose-700 transition-colors cursor-pointer"
              title={isRTL ? 'تصدير PDF' : 'Export PDF'}
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {onPrint && (
            <button
              onClick={onPrint}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title={isRTL ? 'طباعة القائمة' : 'Print List'}
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {/* Add New Primary Button */}
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{addNewLabel || (isRTL ? 'إضافة جديد' : 'Add New')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Filters Row / Children */}
      {(filterComponent || children) && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {filterComponent}
          {children}
        </div>
      )}
    </div>
  );
};
