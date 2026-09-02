import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Building2,
  GitBranch,
  Tablet,
  Bell,
  Languages,
  ChevronDown,
  Shield,
  LogOut,
  Settings,
  Check,
  Building
} from 'lucide-react';
import { AuthSession, Branch, CompanySettings } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

export interface TopNavBarProps {
  activeTab?: string;
  onNavigateTab: (tab: any) => void;
  onToggleSidebar: () => void;
  companySettings?: CompanySettings;
  branches?: Branch[];
  activeBranchId?: string;
  onSelectBranch?: (branchId: string) => void;
  onOpenAttendanceKiosk?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  session?: AuthSession | null;
  userName?: string;
  onOpenSecuritySettings?: () => void;
  onLogout?: () => void;
  // Backward compatibility optional props (not rendered to keep top bar minimalist)
  breadcrumbs?: any;
  onOpenCommandPalette?: () => void;
  onOpenQuickCreate?: () => void;
  onOpenContextualHelp?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenPreferences?: () => void;
  onLockScreen?: () => void;
  favorites?: string[];
  recentTabs?: string[];
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  onNavigateTab,
  onToggleSidebar,
  companySettings,
  branches = [],
  activeBranchId,
  onSelectBranch,
  onOpenAttendanceKiosk,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  session,
  userName = 'المشرف',
  onOpenCommandPalette,
  onOpenQuickCreate,
  onOpenContextualHelp,
  onOpenSecuritySettings,
  onLogout
}) => {
  const { language, setLanguage, isRTL } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(target)) {
        setShowBranchMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const companyDisplayName = companySettings?.companyName || (isRTL ? 'مؤسسة ديشال ERP' : 'Deshal Enterprise ERP');

  return (
    <header
      id="erp-top-navbar"
      className="bg-white border-b border-slate-200/90 text-slate-900 sticky top-0 z-30 shadow-2xs print:hidden w-full transition-all"
    >
      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* =========================================================================
            1. اسم وشعار البرنامج + الشركة والفرع (Left Side in LTR, Right in RTL)
           ========================================================================= */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Mobile Sidebar Toggle Button */}
          <button
            id="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 border border-slate-200 lg:hidden"
            title={isRTL ? 'القائمة الجانبية' : 'Toggle Sidebar'}
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* 1. اسم وشعار البرنامج (App Logo & Name) */}
          <button
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group text-start shrink-0"
            title={isRTL ? 'العودة للرئيسية' : 'Go to Home'}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-xs flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 tracking-tight">
                  {isRTL ? 'ديشال ERP' : 'Deshal ERP'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px] md:max-w-[180px]">
                {companyDisplayName}
              </p>
            </div>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* 2. الشركة والفرع (Company & Branch Selector) */}
          {branches.length > 0 && (
            <div className="relative" ref={branchMenuRef}>
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/90 transition-all text-xs font-bold cursor-pointer shadow-2xs"
                title={isRTL ? 'تبديل الفرع النشط' : 'Switch Active Branch'}
              >
                <div className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <GitBranch className="w-3.5 h-3.5" />
                </div>
                <div className="text-start hidden sm:block">
                  <span className="block text-[10px] text-slate-500 font-medium leading-none">
                    {isRTL ? 'الفرع النشط' : 'Active Branch'}
                  </span>
                  <span className="block text-xs font-black text-slate-900 leading-tight truncate max-w-[130px]">
                    {activeBranch ? (isRTL ? activeBranch.name : activeBranch.nameEn || activeBranch.name) : (isRTL ? 'الفرع الرئيسي' : 'Main Branch')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ms-0.5" />
              </button>

              {/* Branch Selector Dropdown */}
              {showBranchMenu && (
                <div className="absolute start-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      {isRTL ? 'الفروع المتاحة للمؤسسة' : 'Company Branches'}
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                      {companyDisplayName}
                    </p>
                  </div>

                  <div className="py-1 max-h-56 overflow-y-auto">
                    {branches.map((b) => {
                      const isSelected = activeBranch && activeBranch.id === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            if (onSelectBranch) onSelectBranch(b.id);
                            setShowBranchMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-start text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <p className="truncate">{isRTL ? b.name : b.nameEn || b.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{b.code || b.city}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            2. العناصر المطلوبة بالجانب الآخر: Productivity Actions | Kiosk | Notifications | Language | User
           ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Quick Command Palette Trigger (Ctrl + K) */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 text-xs font-bold transition-all cursor-pointer"
              title={isRTL ? 'لوحة الأوامر والبحث (Ctrl + K)' : 'Command Palette (Ctrl + K)'}
            >
              <span className="text-slate-500">{isRTL ? 'بحث سريع...' : 'Quick search...'}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-600 rounded-md border border-slate-300 font-bold shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Quick Create Button (+ Create) */}
          {onOpenQuickCreate && (
            <button
              onClick={onOpenQuickCreate}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              title={isRTL ? 'إنشاء سريعة' : 'Quick Create'}
            >
              <span className="text-base leading-none font-black">+</span>
              <span className="hidden sm:inline">{isRTL ? 'إنشاء' : 'Create'}</span>
            </button>
          )}

          {/* Contextual Help Trigger (? Help) */}
          {onOpenContextualHelp && (
            <button
              onClick={onOpenContextualHelp}
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer font-bold text-xs flex items-center gap-1"
              title={isRTL ? 'المساعدة السياقية والدليل' : 'Contextual Help'}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-black text-[11px] flex items-center justify-center">?</span>
              <span className="hidden xl:inline">{isRTL ? 'مساعدة' : 'Help'}</span>
            </button>
          )}
          
          {/* 3. وضع الكشك اللوحي (Kiosk Mode) */}
          {onOpenAttendanceKiosk && (
            <button
              id="kiosk-mode-top-btn"
              onClick={onOpenAttendanceKiosk}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 transition-all text-xs font-bold shadow-2xs cursor-pointer"
              title={isRTL ? 'وضع الكشك اللوحي للحضور والانصراف' : 'Attendance Kiosk Mode'}
            >
              <Tablet className="w-4 h-4 text-teal-600" />
              <span className="hidden md:inline">{isRTL ? 'وضع الكشك' : 'Kiosk Mode'}</span>
            </button>
          )}

          {/* 4. مركز التنبيهات (Notifications) */}
          {onOpenNotifications && (
            <button
              id="notifications-center-btn"
              onClick={onOpenNotifications}
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer relative"
              title={isRTL ? 'مركز التنبيهات والإشعارات' : 'Notifications Center'}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* 5. مبدل اللغة (Language Switcher) */}
          <button
            id="language-toggle-top-btn"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer text-xs font-black"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Languages className="w-4 h-4 text-slate-500" />
            <span className="uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* 6. المستخدم (User Profile & Account Dropdown) */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="user-profile-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
              title={isRTL ? 'قائمة المستخدم' : 'User Menu'}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                {userName.charAt(0)}
              </div>
              <div className="text-start hidden xl:block">
                <p className="text-xs font-black text-slate-900 leading-tight truncate max-w-[100px]">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-500 leading-none">
                  {session?.role ? (session.role === 'ADMIN' ? (isRTL ? 'مدير النظام' : 'Admin') : session.role) : (isRTL ? 'المشرف' : 'Manager')}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* User Profile Menu */}
            {showUserMenu && (
              <div className="absolute end-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-900">{userName}</p>
                  <p className="text-[11px] text-slate-500">
                    {session?.role ? (session.role === 'ADMIN' ? (isRTL ? 'مدير النظام (Admin)' : 'System Admin') : session.role) : (isRTL ? 'مستخدم مصرح' : 'Authorized User')}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigateTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-start text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{isRTL ? 'إعدادات النظام والشركة' : 'System Settings'}</span>
                  </button>

                  {onOpenSecuritySettings && (
                    <button
                      onClick={() => {
                        onOpenSecuritySettings();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-start text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-indigo-500" />
                      <span>{isRTL ? 'الأمان والصلاحيات' : 'Security & Roles'}</span>
                    </button>
                  )}
                </div>

                {onLogout && (
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-start text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isRTL ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
