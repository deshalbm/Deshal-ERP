import React, { useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  BookOpen,
  Users,
  Truck,
  Boxes,
  UserCheck,
  Building2,
  FileText,
  Settings,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  FileCheck,
  Tablet,
  Printer
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { AuthSession } from '../../types';

export interface PrimarySidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  session?: AuthSession | null;
  counts?: {
    vouchers?: number;
    inventory?: number;
    customers?: number;
    employees?: number;
    lowStock?: number;
  };
  onOpenOnboarding?: () => void;
}

interface SidebarNavItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  category: 'core' | 'operations' | 'admin';
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  activeTab,
  onSelectTab,
  session,
  counts = {
    vouchers: 0,
    inventory: 0,
    customers: 0,
    employees: 0,
    lowStock: 0
  },
  onOpenOnboarding
}) => {
  const { isRTL, language } = useLanguage();
  const ChevronIcon = isRTL ? (isCollapsed ? ChevronLeft : ChevronRight) : (isCollapsed ? ChevronRight : ChevronLeft);

  const navItems: SidebarNavItem[] = useMemo(
    () => [
      {
        id: 'home',
        labelAr: 'الرئيسية ومساحة العمل',
        labelEn: 'ERP Workspace',
        icon: TrendingUp,
        category: 'core'
      },
      {
        id: 'pos',
        labelAr: 'نقطة البيع (POS)',
        labelEn: 'Point of Sale (POS)',
        icon: CreditCard,
        category: 'operations'
      },
      {
        id: 'accounting',
        labelAr: 'المحاسبة والأستاذ العام',
        labelEn: 'General Ledger',
        icon: BookOpen,
        category: 'core'
      },
      {
        id: 'crm',
        labelAr: 'العملاء وعلاقات العملاء',
        labelEn: 'CRM & Customers',
        icon: Users,
        badge: counts.customers,
        category: 'operations'
      },
      {
        id: 'inventory',
        labelAr: 'المخزون والمستودعات',
        labelEn: 'Inventory',
        badge: counts.lowStock ? `${counts.lowStock} نقص` : undefined,
        badgeColor: 'bg-rose-500 text-white',
        icon: Boxes,
        category: 'operations'
      },
      {
        id: 'purchases',
        labelAr: 'المشتريات والموردين',
        labelEn: 'Purchases & Vendors',
        icon: Truck,
        category: 'operations'
      },
      {
        id: 'employees',
        labelAr: 'الموارد البشرية والرواتب',
        labelEn: 'HR & Payroll',
        badge: counts.employees,
        icon: UserCheck,
        category: 'operations'
      },
      {
        id: 'spaces',
        labelAr: 'المساحات التأجيرية',
        labelEn: 'Rental Spaces',
        icon: Building2,
        category: 'operations'
      },
      {
        id: 'contracts',
        labelAr: 'عقود الإيجار والخدمات',
        labelEn: 'Leases & Contracts',
        icon: FileCheck,
        category: 'operations'
      },
      {
        id: 'history',
        labelAr: 'سجل السندات والفواتير',
        labelEn: 'Voucher History',
        badge: counts.vouchers,
        icon: FileText,
        category: 'operations'
      },
      {
        id: 'help',
        labelAr: 'مركز المساعدة والدليل',
        labelEn: 'Help & User Guide',
        icon: HelpCircle,
        category: 'admin'
      },
      {
        id: 'settings',
        labelAr: 'إعدادات النظام والمؤسسة',
        labelEn: 'System Settings',
        icon: Settings,
        category: 'admin'
      }
    ],
    [counts]
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="erp-primary-sidebar"
        className={`fixed top-0 bottom-0 z-40 bg-slate-900 text-slate-100 flex flex-col border-e border-slate-800 transition-all duration-300 ease-in-out print:hidden ${
          isRTL ? 'right-0' : 'left-0'
        } ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
          isCollapsed ? 'w-20' : 'w-64 sm:w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shrink-0">
              D
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-base tracking-tight text-white truncate">
                    Deshal ERP
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    V2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {isRTL ? 'نظام الإدارة المتكامل' : 'Enterprise Suite'}
                </p>
              </div>
            )}
          </div>

          {/* Close for mobile, Collapse for desktop */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-start font-bold transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? (isRTL ? item.labelAr : item.labelEn) : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />

                {!isCollapsed && (
                  <span className="text-xs sm:text-sm truncate flex-1">
                    {isRTL ? item.labelAr : item.labelEn}
                  </span>
                )}

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      item.badgeColor || (isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Onboarding Trigger */}
        {onOpenOnboarding && !isCollapsed && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40">
            <button
              onClick={onOpenOnboarding}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-linear-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 text-white text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isRTL ? 'معالج التهيئة السريعة' : 'Setup Onboarding'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-300 rtl:rotate-180" />
            </button>
          </div>
        )}

        {/* Desktop Collapse Toggle Bar */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800 text-slate-400 text-xs">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronIcon className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
