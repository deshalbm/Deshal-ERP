import React from 'react';
import { useLanguage } from '../../utils/LanguageContext';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'draft'
  | 'posted'
  | 'active'
  | 'expired'
  | 'paid'
  | 'pending';

export interface StatusBadgeProps {
  status?: string;
  variant?: StatusVariant;
  label?: string;
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  className = '',
  dot = true
}) => {
  const { isRTL } = useLanguage();

  // Normalize status string if variant is not explicitly provided
  let effectiveVariant: StatusVariant = variant || 'neutral';
  let displayText = label || status || '';

  if (!variant && status) {
    const s = status.toUpperCase();
    if (['ACTIVE', 'PAID', 'POSTED', 'COMPLETED', 'APPROVED', 'PRESENT', 'SUCCESS'].includes(s)) {
      effectiveVariant = 'success';
      if (!label) {
        if (s === 'ACTIVE') displayText = isRTL ? 'نشط' : 'Active';
        else if (s === 'PAID') displayText = isRTL ? 'مدفوع' : 'Paid';
        else if (s === 'POSTED') displayText = isRTL ? 'مرحّل' : 'Posted';
        else if (s === 'COMPLETED') displayText = isRTL ? 'مكتمل' : 'Completed';
        else if (s === 'APPROVED') displayText = isRTL ? 'معتمد' : 'Approved';
      }
    } else if (['PENDING', 'WARNING', 'EXPIRING_SOON', 'DRAFT', 'ON_LEAVE', 'PARTIAL'].includes(s)) {
      effectiveVariant = 'warning';
      if (!label) {
        if (s === 'PENDING') displayText = isRTL ? 'قيد الانتظار' : 'Pending';
        else if (s === 'DRAFT') displayText = isRTL ? 'مسودة' : 'Draft';
        else if (s === 'PARTIAL') displayText = isRTL ? 'سداد جزئي' : 'Partial';
      }
    } else if (['CANCELLED', 'EXPIRED', 'REJECTED', 'ABSENT', 'ERROR', 'INACTIVE', 'OUT_OF_STOCK'].includes(s)) {
      effectiveVariant = 'error';
      if (!label) {
        if (s === 'CANCELLED') displayText = isRTL ? 'ملغي' : 'Cancelled';
        else if (s === 'EXPIRED') displayText = isRTL ? 'منتهي' : 'Expired';
        else if (s === 'INACTIVE') displayText = isRTL ? 'معطل' : 'Inactive';
        else if (s === 'OUT_OF_STOCK') displayText = isRTL ? 'نفد المخزون' : 'Out of Stock';
      }
    } else if (['INFO', 'REVERSED', 'REFUNDED'].includes(s)) {
      effectiveVariant = 'info';
      if (!label) {
        if (s === 'REVERSED') displayText = isRTL ? 'معكوس' : 'Reversed';
        else if (s === 'REFUNDED') displayText = isRTL ? 'مسترجع' : 'Refunded';
      }
    }
  }

  const colorStyles: Record<StatusVariant, { badge: string; dot: string }> = {
    success: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500'
    },
    warning: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
      dot: 'bg-amber-500'
    },
    error: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500'
    },
    info: {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      dot: 'bg-indigo-500'
    },
    purple: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
      dot: 'bg-purple-500'
    },
    neutral: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    },
    draft: {
      badge: 'bg-slate-100 text-slate-600 border-slate-300',
      dot: 'bg-slate-400'
    },
    posted: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      dot: 'bg-emerald-600'
    },
    active: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    expired: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500'
    },
    paid: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    pending: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500'
    }
  };

  const style = colorStyles[effectiveVariant] || colorStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.badge} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      <span className="truncate">{displayText}</span>
    </span>
  );
};
