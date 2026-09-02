import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ERPModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ElementType;
  iconBgColor?: string;
  iconColor?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
}

export const ERPModal: React.FC<ERPModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  children,
  footer,
  maxWidth = '2xl',
  className = ''
}) => {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles: Record<NonNullable<ERPModalProps['maxWidth']>, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full m-4'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:hidden animate-in fade-in duration-200">
      {/* Dark Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Alignment Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-start">
        <div
          className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] ${className}`}
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                {typeof title === 'string' ? (
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h3>
                ) : (
                  title
                )}
                {typeof subtitle === 'string' ? (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>
                ) : (
                  subtitle
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {children}
          </div>

          {/* Modal Footer */}
          {footer && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
