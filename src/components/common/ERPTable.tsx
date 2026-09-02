import React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { ERPEmptyState, ERPEmptyStateProps } from './ERPEmptyState';
import { ERPLoadingState } from './ERPLoadingState';

export interface Column<T> {
  key: string;
  headerAr: string;
  headerEn: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  className?: string;
}

export interface ERPTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyState?: Partial<ERPEmptyStateProps>;
  isRTL?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  className?: string;
}

export function ERPTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  isRTL = true,
  sortColumn,
  sortDirection,
  onSort,
  className = ''
}: ERPTableProps<T>) {
  if (isLoading) {
    return <ERPLoadingState />;
  }

  if (!data || data.length === 0) {
    if (emptyState && emptyState.icon) {
      return (
        <ERPEmptyState
          icon={emptyState.icon}
          titleAr={emptyState.titleAr || 'لا توجد سجلات'}
          titleEn={emptyState.titleEn || 'No records found'}
          descriptionAr={emptyState.descriptionAr || 'لم يتم إدراج أي بيانات في هذه القائمة بعد.'}
          descriptionEn={emptyState.descriptionEn || 'There are no records listed in this view yet.'}
          actionLabelAr={emptyState.actionLabelAr}
          actionLabelEn={emptyState.actionLabelEn}
          onAction={emptyState.onAction}
        />
      );
    }
  }

  const alignStyles = {
    start: 'text-start',
    center: 'text-center',
    end: 'text-end'
  };

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all ${className}`}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-start text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider select-none">
            <tr>
              {columns.map((col) => {
                const alignClass = alignStyles[col.align || 'start'];

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`py-3.5 px-4 ${alignClass} ${col.className || ''}`}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <span>{isRTL ? col.headerAr : col.headerEn}</span>
                        {sortColumn === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-60" />
                        )}
                      </button>
                    ) : (
                      <span>{isRTL ? col.headerAr : col.headerEn}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, idx) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {columns.map((col) => {
                  const alignClass = alignStyles[col.align || 'start'];
                  return (
                    <td
                      key={`${keyExtractor(row)}-${col.key}`}
                      className={`py-3 px-4 ${alignClass} ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(row, idx)
                        : (row as any)[col.key] !== undefined
                        ? String((row as any)[col.key])
                        : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
