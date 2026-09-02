import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface ERPAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const ERPAlert: React.FC<ERPAlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const variantStyles: Record<AlertVariant, { container: string; icon: React.ElementType; iconClass: string; titleClass: string }> = {
    info: {
      container: 'bg-indigo-50/90 text-indigo-900 border-indigo-200/80',
      icon: Info,
      iconClass: 'text-indigo-600',
      titleClass: 'text-indigo-950 font-bold'
    },
    success: {
      container: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80',
      icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      titleClass: 'text-emerald-950 font-bold'
    },
    warning: {
      container: 'bg-amber-50/90 text-amber-900 border-amber-200/80',
      icon: AlertTriangle,
      iconClass: 'text-amber-600',
      titleClass: 'text-amber-950 font-bold'
    },
    error: {
      container: 'bg-rose-50/90 text-rose-900 border-rose-200/80',
      icon: XCircle,
      iconClass: 'text-rose-600',
      titleClass: 'text-rose-950 font-bold'
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 transition-all ${style.container} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconClass}`} />

      <div className="flex-1 min-w-0 text-xs sm:text-sm">
        {title && <h4 className={`mb-0.5 ${style.titleClass}`}>{title}</h4>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
