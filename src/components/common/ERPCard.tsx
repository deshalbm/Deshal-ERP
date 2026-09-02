import React from 'react';

export interface ERPCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
}

export const ERPCard: React.FC<ERPCardProps> = ({
  title,
  subtitle,
  action,
  footer,
  children,
  className = '',
  bodyClassName = '',
  headerClassName = ''
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div className="min-w-0">
            {typeof title === 'string' ? (
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h3>
            ) : (
              title
            )}
            {typeof subtitle === 'string' ? (
              <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>
            ) : (
              subtitle
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100">{footer}</div>
      )}
    </div>
  );
};
