import React, { useState, useMemo } from 'react';
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
  FileCheck
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
}

interface SidebarGroup {
  id: string;
  groupKey: string;
  titleAr: string;
  titleEn: string;
  badge?: string;
  badgeColor?: string;
  items: SidebarNavItem[];
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
  const { isRTL } = useLanguage();
  const [isHoverExpanded, setIsHoverExpanded] = useState<boolean>(false);

  // Effective collapsed state: true only if collapsed AND not currently expanded by mouse hover
  const effectiveCollapsed = isCollapsed && !isHoverExpanded;

  const ChevronIcon = isRTL
    ? isCollapsed
      ? ChevronLeft
      : ChevronRight
    : isCollapsed
    ? ChevronRight
    : ChevronLeft;

  const groupedNavItems: SidebarGroup[] = useMemo(
    () => [
      {
        id: 'group_core',
        groupKey: 'DESHAL CORE',
        titleAr: 'الرئيسية والنظام',
        titleEn: 'Deshal Core',
        items: [
          {
            id: 'home',
            labelAr: 'الرئيسية ومساحة العمل',
            labelEn: 'ERP Workspace',
            icon: TrendingUp
          }
        ]
      },
      {
        id: 'group_finance',
        groupKey: 'DESHAL FINANCE',
        titleAr: 'المالية والمحاسبة',
        titleEn: 'Deshal Finance',
        items: [
          {
            id: 'accounting',
            labelAr: 'المحاسبة والأستاذ العام',
            labelEn: 'General Ledger',
            icon: BookOpen
          },
          {
            id: 'history',
            labelAr: 'سجل السندات والفواتير',
            labelEn: 'Voucher History',
            badge: counts.vouchers,
            icon: FileText
          }
        ]
      },
      {
        id: 'group_sales',
        groupKey: 'DESHAL SALES & CRM',
        titleAr: 'المبيعات والعملاء',
        titleEn: 'Deshal Sales',
        items: [
          {
            id: 'pos',
            labelAr: 'نقطة البيع (POS)',
            labelEn: 'Point of Sale (POS)',
            icon: CreditCard
          },
          {
            id: 'crm',
            labelAr: 'إدارة العملاء والعلاقات',
            labelEn: 'CRM & Customers',
            icon: Users,
            badge: counts.customers
          }
        ]
      },
      {
        id: 'group_supply',
        groupKey: 'DESHAL SUPPLY & INVENTORY',
        titleAr: 'المخزون والمشتريات',
        titleEn: 'Deshal Supply Chain',
        items: [
          {
            id: 'inventory',
            labelAr: 'المخزون والمستودعات',
            labelEn: 'Inventory',
            badge: counts.lowStock ? `${counts.lowStock} نقص` : undefined,
            badgeColor: 'bg-rose-500 text-white',
            icon: Boxes
          },
          {
            id: 'purchases',
            labelAr: 'المشتريات والموردين',
            labelEn: 'Purchases & Vendors',
            icon: Truck
          }
        ]
      },
      {
        id: 'group_hr',
        groupKey: 'DESHAL HR & PEOPLE',
        titleAr: 'الموارد البشرية والرواتب',
        titleEn: 'Deshal HR',
        items: [
          {
            id: 'employees',
            labelAr: 'الموارد البشرية والرواتب',
            labelEn: 'HR & Payroll',
            badge: counts.employees,
            icon: UserCheck
          }
        ]
      },
      {
        id: 'group_spaces',
        groupKey: 'DESHAL SPACES & REAL ESTATE',
        titleAr: 'المساحات والعقارات',
        titleEn: 'Deshal Spaces',
        items: [
          {
            id: 'spaces',
            labelAr: 'المساحات التأجيرية',
            labelEn: 'Rental Spaces',
            icon: Building2
          },
          {
            id: 'contracts',
            labelAr: 'عقود الإيجار والخدمات',
            labelEn: 'Leases & Contracts',
            icon: FileCheck
          }
        ]
      },
      {
        id: 'group_admin',
        groupKey: 'DESHAL ADMIN & SUPPORT',
        titleAr: 'النظام والمساندة',
        titleEn: 'Deshal Admin',
        items: [
          {
            id: 'help',
            labelAr: 'مركز المساعدة والدليل',
            labelEn: 'Help & User Guide',
            icon: HelpCircle
          },
          {
            id: 'settings',
            labelAr: 'إعدادات النظام والمؤسسة',
            labelEn: 'System Settings',
            icon: Settings
          }
        ]
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
        onMouseEnter={() => {
          if (isCollapsed) setIsHoverExpanded(true);
        }}
        onMouseLeave={() => {
          setIsHoverExpanded(false);
        }}
        className={`fixed top-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-md text-slate-100 flex flex-col border-e border-slate-800 transition-all duration-300 ease-in-out print:hidden shadow-xl ${
          isRTL ? 'right-0' : 'left-0'
        } ${
          isOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        } ${
          effectiveCollapsed ? 'w-20' : 'w-64 sm:w-72 shadow-2xl z-50'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shrink-0">
              D
            </div>
            {!effectiveCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-base tracking-tight text-white truncate">
                    Deshal ERP
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    V2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate font-medium">
                  {isRTL ? 'أنظمة الإدارة المتكاملة' : 'Integrated ERP Suite'}
                </p>
              </div>
            )}
          </div>

          {/* Close for mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar">
          {groupedNavItems.map((group) => (
            <div key={group.id} className="space-y-1">
              {/* Group Section Header */}
              {!effectiveCollapsed ? (
                <div className="px-3 pt-1 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-indigo-400 uppercase">
                    {isRTL ? group.titleAr : group.titleEn}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {group.groupKey}
                  </span>
                </div>
              ) : (
                <div className="w-full flex justify-center py-1">
                  <div className="w-8 h-[1px] bg-slate-800" />
                </div>
              )}

              {/* Group Navigation Items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                      setIsHoverExpanded(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-start font-bold transition-all cursor-pointer group relative ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    } ${effectiveCollapsed ? 'justify-center px-0' : ''}`}
                    title={effectiveCollapsed ? (isRTL ? item.labelAr : item.labelEn) : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                      }`}
                    />

                    {!effectiveCollapsed && (
                      <span className="text-xs sm:text-sm truncate flex-1">
                        {isRTL ? item.labelAr : item.labelEn}
                      </span>
                    )}

                    {!effectiveCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          item.badgeColor || (isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Dot Indicator for Collapsed Mode when active */}
                    {effectiveCollapsed && isActive && (
                      <div className="absolute end-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Onboarding Trigger */}
        {onOpenOnboarding && !effectiveCollapsed && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
            <button
              onClick={() => {
                onOpenOnboarding();
                setIsHoverExpanded(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-linear-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 text-white text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isRTL ? 'معالج التهيئة السريعة' : 'Setup Onboarding'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-300 rtl:rotate-180" />
            </button>
          </div>
        )}

        {/* Desktop Pin / Collapse Toggle Bar */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800 text-slate-400 text-xs shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer font-semibold"
            title={isCollapsed ? 'تثبيت/توسيع القائمة' : 'طَي القائمة الجانبية'}
          >
            <ChevronIcon className="w-4 h-4 text-indigo-400" />
            {!effectiveCollapsed && (
              <span className="text-xs text-slate-300">
                {isCollapsed
                  ? isRTL
                    ? 'تثبيت القائمة مفتوحة'
                    : 'Pin Expanded Sidebar'
                  : isRTL
                  ? 'طَي القائمة تلقائياً'
                  : 'Collapse Sidebar'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
