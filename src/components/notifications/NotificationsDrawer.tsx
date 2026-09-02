import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Boxes,
  FileText,
  DollarSign,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface ERPNotification {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  time: string;
  targetTab?: string;
  icon?: React.ElementType;
}

export interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ERPNotification[];
  onNavigateTab: (tab: any) => void;
  onClearAll?: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onNavigateTab,
  onClearAll
}) => {
  const { isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (!isOpen) return null;

  return (
    <div
      id="notifications-drawer-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="notifications-drawer-panel"
        className={`w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ${
          isRTL ? 'animate-in slide-in-from-left' : 'animate-in slide-in-from-right'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isRTL ? 'مركز التنبيهات والإشعارات' : 'Notifications & Alerts'}
              </h3>
              <p className="text-xs text-slate-500">
                {notifications.length > 0
                  ? isRTL
                    ? `لديك ${notifications.length} تنبيهات تحتاج للمتابعة`
                    : `You have ${notifications.length} active notifications`
                  : isRTL
                  ? 'لا توجد تنبيهات جديدة'
                  : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onClearAll && notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {isRTL ? 'مسح الكل' : 'Clear All'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">
                {isRTL ? 'كل شيء على ما يرام!' : 'All Clear!'}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                {isRTL
                  ? 'لا توجد تنبيهات عاجلة بخصوص المخزون، أو المستندات، أو الفترات المحاسبية حالياً.'
                  : 'No pending alerts for low stock, unposted journals, or expiring leases.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = notif.icon || AlertCircle;
              const typeClasses = {
                warning: 'bg-amber-50/80 border-amber-200/90 text-amber-800',
                error: 'bg-rose-50/80 border-rose-200/90 text-rose-800',
                info: 'bg-indigo-50/80 border-indigo-200/90 text-indigo-800',
                success: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-800'
              }[notif.type];

              const iconBgClasses = {
                warning: 'bg-amber-100 text-amber-600',
                error: 'bg-rose-100 text-rose-600',
                info: 'bg-indigo-100 text-indigo-600',
                success: 'bg-emerald-100 text-emerald-600'
              }[notif.type];

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all ${typeClasses} flex flex-col gap-2`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBgClasses}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {isRTL ? notif.titleAr : notif.titleEn}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {isRTL ? notif.descAr : notif.descEn}
                      </p>
                    </div>
                  </div>

                  {notif.targetTab && (
                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        onClick={() => {
                          onNavigateTab(notif.targetTab);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
                      >
                        <span>{isRTL ? 'عرض والتصرف' : 'View & Take Action'}</span>
                        <ArrowIcon className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
