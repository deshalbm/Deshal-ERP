import React, { useState, useEffect, useRef } from "react";
import {
  Receipt,
  Printer,
  FileDown,
  Settings,
  History,
  Sparkles,
  PlusCircle,
  Eye,
  Edit3,
  Download,
  Users,
  Home,
  Boxes,
  ShoppingCart,
  Building2,
  Languages,
  UserCheck,
  Shield,
  Lock,
  LogOut,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  Repeat,
  Menu,
  Layers,
  Truck,
  MoreHorizontal,
  FileText,
  FileCheck,
  Tablet,
  BookOpen
} from "lucide-react";
import { AuthSession } from "../types";
import { useLanguage } from "../utils/LanguageContext";

interface HeaderNavbarProps {
  activeTab: "home" | "pos" | "accounting" | "spaces" | "contracts" | "services" | "portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" | "inventory" | "purchases" | "branches" | "employees" | "schedules" | "settings";
  setActiveTab: (tab: "home" | "pos" | "accounting" | "spaces" | "contracts" | "services" | "portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" | "inventory" | "purchases" | "branches" | "employees" | "schedules" | "settings") => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onNewVoucher: () => void;
  onOpenAiAssistant: () => void;
  onOpenAttendanceKiosk?: () => void;
  onOpenDrawer: () => void;
  onTriggerInstall?: () => void;
  isInstallable?: boolean;
  activeVoucherNumber: string;
  session?: AuthSession | null;
  onOpenSecuritySettings?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  onExportPdf,
  onNewVoucher,
  onOpenAiAssistant,
  onOpenAttendanceKiosk,
  onOpenDrawer,
  onTriggerInstall,
  isInstallable = false,
  activeVoucherNumber,
  session,
  onOpenSecuritySettings,
  onLockScreen,
  onLogout
}) => {
  const { language, setLanguage, isRTL, t } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  
  // Dropdown States
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showFinanceDropdown, setShowFinanceDropdown] = useState<boolean>(false);
  const [showSpacesDropdown, setShowSpacesDropdown] = useState<boolean>(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState<boolean>(false);
  const [showSupplyDropdown, setShowSupplyDropdown] = useState<boolean>(false);
  const [showQuickActionsDropdown, setShowQuickActionsDropdown] = useState<boolean>(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const financeDropdownRef = useRef<HTMLDivElement>(null);
  const spacesDropdownRef = useRef<HTMLDivElement>(null);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const supplyDropdownRef = useRef<HTMLDivElement>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Close all dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
      if (financeDropdownRef.current && !financeDropdownRef.current.contains(target)) {
        setShowFinanceDropdown(false);
      }
      if (spacesDropdownRef.current && !spacesDropdownRef.current.contains(target)) {
        setShowSpacesDropdown(false);
      }
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(target)) {
        setShowServicesDropdown(false);
      }
      if (supplyDropdownRef.current && !supplyDropdownRef.current.contains(target)) {
        setShowSupplyDropdown(false);
      }
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(target)) {
        setShowQuickActionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helpers to detect active category
  const isFinanceActive = ["pos", "doc-wizard", "editor", "preview", "history", "schedules"].includes(activeTab);
  const isSpacesActive = ["spaces", "contracts"].includes(activeTab);
  const isServicesActive = ["services", "portal"].includes(activeTab);
  const isSupplyActive = ["inventory", "purchases", "branches"].includes(activeTab);

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs print:hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
          
          {/* Section 1: Logo & All Apps Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse shrink-0">
            
            {/* Mobile / Tablet Drawer Toggle Button */}
            <button
              onClick={onOpenDrawer}
              className="p-1.5 sm:p-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 lg:hidden transition-colors cursor-pointer"
              title={language === "ar" ? "القائمة الكاملة للأقسام" : "All Modules Menu"}
              aria-label="Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Title & Logo */}
            <button
              onClick={() => setActiveTab("home")}
              className="flex items-center space-x-2 sm:space-x-2.5 rtl:space-x-reverse text-start rtl:text-end cursor-pointer group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl shadow-xs flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <span className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-slate-900 font-sans">
                    {language === "ar" ? (
                      <>دشال<span className="text-indigo-600"> ERP</span></>
                    ) : (
                      <>Deshal<span className="text-indigo-600"> ERP</span></>
                    )}
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                    Business
                  </span>
                  {/* Connectivity Status Dot */}
                  <span 
                    title={isOnline ? t("online") : t("offline")}
                    className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`}
                  />
                </div>
                <p className="hidden md:block text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                  {language === "ar" ? "إدارة الأعمال المتكاملة" : "Business Management ERP"}
                </p>
              </div>
            </button>

            {/* Desktop "All Modules" Trigger Button */}
            <button
              onClick={onOpenDrawer}
              className="hidden xl:flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
              title={language === "ar" ? "عرض شجرة الأقسام بالكامل" : "View all modules"}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "ar" ? "المجموعات" : "Suites"}</span>
            </button>
          </div>

          {/* Section 2: Desktop Ergonomic Navigation Menu (Grouped Deshal Suites) */}
          <nav className="hidden lg:flex items-center space-x-1 rtl:space-x-reverse bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-medium shrink-0">
            
            {/* 1. Home Dashboard */}
            <button
              onClick={() => setActiveTab("home")}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Home className={`w-3.5 h-3.5 ${activeTab === "home" ? "text-indigo-600" : "text-slate-500"}`} />
              <span>{t("tabHome")}</span>
            </button>

            {/* General Ledger & Accounts Direct Button */}
            <button
              onClick={() => setActiveTab("accounting")}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "accounting"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${activeTab === "accounting" ? "text-indigo-600" : "text-slate-500"}`} />
              <span>{language === "ar" ? "القيود والتقارير المالية" : "General Ledger"}</span>
            </button>

            {/* 2. Deshal Finance Suite Dropdown */}
            <div className="relative" ref={financeDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFinanceDropdown(!showFinanceDropdown);
                  setShowSpacesDropdown(false);
                  setShowServicesDropdown(false);
                  setShowSupplyDropdown(false);
                }}
                className={`flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isFinanceActive
                    ? "bg-white text-indigo-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Receipt className={`w-3.5 h-3.5 ${isFinanceActive ? "text-indigo-600" : "text-slate-500"}`} />
                <span>{language === "ar" ? "دشال المالية" : "Deshal Finance"}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showFinanceDropdown ? "rotate-180" : ""}`} />
              </button>

              {showFinanceDropdown && (
                <div className={`absolute ${isRTL ? "right-0" : "left-0"} mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-slate-800`}>
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{language === "ar" ? "مجموعة دشال المالية" : "Deshal Finance Suite"}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-indigo-50 text-indigo-700 rounded font-bold">Finance</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("pos");
                      setShowFinanceDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "pos" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                        <span className="text-xs font-semibold">{t("tabPos")}</span>
                        <span className="px-1 py-0.2 text-[9px] bg-emerald-100 text-emerald-800 rounded font-bold">Fast POS</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "كاشير فوري وطباعة حرارية" : "Instant cashier & barcode POS"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("doc-wizard");
                      setShowFinanceDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "doc-wizard" ? "bg-purple-50/70 text-purple-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                        <span className="text-xs font-semibold">{t("tabDocWizard")}</span>
                        <span className="px-1 py-0.2 text-[9px] bg-purple-100 text-purple-700 rounded font-bold">Smart</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "معالج خطوة بخطوة ذكي" : "Step-by-step wizard"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("editor");
                      setShowFinanceDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "editor" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t("tabEditor")}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "محرر تفصيلي متقدم" : "Advanced full form editor"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("preview");
                      setShowFinanceDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "preview" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 shrink-0">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t("tabPreview")}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "معاينة الطباعة وتصدير PDF" : "Print preview & PDF export"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("history");
                      setShowFinanceDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "history" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t("tabHistory")}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "أرشيف السندات وسجل العمليات" : "Vouchers archive & search"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("accounting");
                      setShowFinanceDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "accounting" ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                        <span className="text-xs font-bold text-indigo-950">
                          {language === "ar" ? "دفتر الأستاذ والتقارير المالية" : "General Ledger & Accounts"}
                        </span>
                        <span className="px-1 py-0.2 text-[9px] bg-emerald-100 text-emerald-800 rounded font-bold">IFRS</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {language === "ar"
                          ? "القيود المزدوجة، ميزان المراجعة، P&L والميزانية"
                          : "Double-entry journals, ledger & balance sheet"}
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setActiveTab("schedules");
                      setShowFinanceDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "schedules" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                        <span className="text-xs font-semibold">{t("tabSchedules")}</span>
                        <span className="px-1 py-0.2 text-[9px] bg-indigo-100 text-indigo-700 rounded font-bold">Auto</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "أتمتة التحصيل الدوري" : "Recurring billing schedules"}</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Deshal Spaces Suite Dropdown */}
            <div className="relative" ref={spacesDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowSpacesDropdown(!showSpacesDropdown);
                  setShowFinanceDropdown(false);
                  setShowServicesDropdown(false);
                  setShowSupplyDropdown(false);
                }}
                className={`flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isSpacesActive
                    ? "bg-white text-indigo-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isSpacesActive ? "text-indigo-600" : "text-slate-500"}`} />
                <span>{language === "ar" ? "دشال المساحات" : "Deshal Spaces"}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSpacesDropdown ? "rotate-180" : ""}`} />
              </button>

              {showSpacesDropdown && (
                <div className={`absolute ${isRTL ? "right-0" : "left-0"} mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-slate-800`}>
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{language === "ar" ? "مجموعة دشال للمساحات" : "Deshal Spaces Suite"}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-blue-50 text-blue-700 rounded font-bold">Spaces</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("spaces");
                      setShowSpacesDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "spaces" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{language === "ar" ? "حجز القاعات ومساحات العمل" : "Spaces & Halls Booking"}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "القاعات، المكاتب، والحجز الزمني" : "Rooms, boardrooms & hourly booking"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("contracts");
                      setShowSpacesDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "contracts" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{language === "ar" ? "عقود الإيجار والمستأجرين" : "Lease Contracts & Tenants"}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "العقود، الأقساط، والضمان المالي" : "Contracts, installments & deposits"}</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Deshal Services Suite Dropdown */}
            <div className="relative" ref={servicesDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowServicesDropdown(!showServicesDropdown);
                  setShowFinanceDropdown(false);
                  setShowSpacesDropdown(false);
                  setShowSupplyDropdown(false);
                }}
                className={`flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isServicesActive
                    ? "bg-white text-indigo-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${isServicesActive ? "text-indigo-600" : "text-slate-500"}`} />
                <span>{language === "ar" ? "دشال الخدمات" : "Deshal Services"}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showServicesDropdown ? "rotate-180" : ""}`} />
              </button>

              {showServicesDropdown && (
                <div className={`absolute ${isRTL ? "right-0" : "left-0"} mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-slate-800`}>
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{language === "ar" ? "مجموعة دشال للخدمات" : "Deshal Services Suite"}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-purple-50 text-purple-700 rounded font-bold">Services</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("services");
                      setShowServicesDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "services" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{language === "ar" ? "الخدمات الاستشارية والباقات" : "Consulting & Packages"}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "باقات المشتركين وحصص الساعات" : "Membership quotas & services"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("portal");
                      setShowServicesDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "portal" ? "bg-purple-50/70 text-purple-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{language === "ar" ? "بوابة الحجز الذكية" : "Client Booking Portal"}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "حجز مباشر للعملاء والمستأجرين" : "Direct booking for clients"}</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Deshal CRM Tab */}
            <button
              onClick={() => setActiveTab("crm")}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "crm"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === "crm" ? "text-indigo-600" : "text-slate-500"}`} />
              <span>{language === "ar" ? "دشال العملاء" : "Deshal CRM"}</span>
            </button>

            {/* 6. Deshal Supply Suite Dropdown */}
            <div className="relative" ref={supplyDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowSupplyDropdown(!showSupplyDropdown);
                  setShowFinanceDropdown(false);
                  setShowSpacesDropdown(false);
                  setShowServicesDropdown(false);
                }}
                className={`flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isSupplyActive
                    ? "bg-white text-indigo-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Boxes className={`w-3.5 h-3.5 ${isSupplyActive ? "text-indigo-600" : "text-slate-500"}`} />
                <span>{language === "ar" ? "دشال المخزون" : "Deshal Supply"}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSupplyDropdown ? "rotate-180" : ""}`} />
              </button>

              {showSupplyDropdown && (
                <div className={`absolute ${isRTL ? "right-0" : "left-0"} mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-slate-800`}>
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{language === "ar" ? "مجموعة دشال للمخزون والتوريد" : "Deshal Supply Suite"}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-cyan-50 text-cyan-700 rounded font-bold">Supply</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("inventory");
                      setShowSupplyDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "inventory" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t("tabInventory")}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "الأصناف، الكميات، والباركود" : "Stock items, alerts & barcodes"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("purchases");
                      setShowSupplyDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "purchases" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t("tabPurchases")}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "فواتير المشتريات والموردين" : "Supplier invoices & orders"}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("branches");
                      setShowSupplyDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse transition-colors cursor-pointer ${
                      activeTab === "branches" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t("tabBranches")}</p>
                      <p className="text-[10px] text-slate-400">{language === "ar" ? "شبكة الفروع ومناقلات المخزون" : "Branches & stock transfers"}</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 7. Deshal HR & Payroll Tab */}
            <button
              onClick={() => setActiveTab("employees")}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "employees"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${activeTab === "employees" ? "text-indigo-600" : "text-slate-500"}`} />
              <span>{language === "ar" ? "ديشال الموارد والرواتب" : "Deshal HR & Payroll"}</span>
            </button>

            {/* 8. Settings Tab */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${activeTab === "settings" ? "text-indigo-600" : "text-slate-500"}`} />
              <span>{t("tabSettings")}</span>
            </button>
          </nav>

          {/* Section 3: Right Actions Group (Clean, Responsive, No Horizontal Cutoff) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse shrink-0">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setLanguage("ar")}
                className={`px-1.5 sm:px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  language === "ar"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="التحويل للغة العربية"
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-1.5 sm:px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {/* Attendance Kiosk Quick Launcher */}
            {onOpenAttendanceKiosk && (
              <button
                onClick={onOpenAttendanceKiosk}
                title={language === "ar" ? "فتح كشك الحضور والانصراف اللوحي (Kiosk)" : "Launch Attendance Tablet Kiosk"}
                className="flex items-center space-x-1 rtl:space-x-reverse p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer shadow-2xs"
              >
                <Tablet className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xl:inline">{language === "ar" ? "كشك الحضور" : "Kiosk"}</span>
              </button>
            )}

            {/* AI Assistant Quick Trigger */}
            <button
              onClick={onOpenAiAssistant}
              title={t("quickAiAssist")}
              className="flex items-center space-x-1 rtl:space-x-reverse p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xl:inline">{t("quickAiAssist")}</span>
            </button>

            {/* Desktop Direct Action Buttons */}
            <div className="hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse">
              {/* Print Button */}
              <button
                onClick={onPrint}
                title={t("print")}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex items-center space-x-1 rtl:space-x-reverse"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden 2xl:inline">{t("print")}</span>
              </button>

              {/* Export PDF Button */}
              <button
                onClick={onExportPdf}
                title={t("exportPdf")}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer flex items-center space-x-1 rtl:space-x-reverse"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">{t("exportPdf")}</span>
              </button>

              {/* New Voucher Button */}
              <button
                onClick={onNewVoucher}
                title={t("newVoucher")}
                className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t("newVoucher")}</span>
              </button>
            </div>

            {/* Compact Screen Quick Actions Dropdown (sm & mobile) */}
            <div className="sm:hidden relative" ref={actionsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowQuickActionsDropdown(!showQuickActionsDropdown)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                title="إجراءات سريعة"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showQuickActionsDropdown && (
                <div className={`absolute ${isRTL ? "left-0" : "right-0"} mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in`}>
                  <button
                    onClick={() => {
                      onNewVoucher();
                      setShowQuickActionsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-start rtl:text-end text-xs font-bold text-slate-900 hover:bg-slate-50 flex items-center space-x-2 rtl:space-x-reverse"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>{t("newVoucher")}</span>
                  </button>
                  <button
                    onClick={() => {
                      onPrint();
                      setShowQuickActionsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-start rtl:text-end text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 rtl:space-x-reverse"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>{t("print")}</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportPdf();
                      setShowQuickActionsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-start rtl:text-end text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 rtl:space-x-reverse"
                  >
                    <FileDown className="w-4 h-4 text-indigo-600" />
                    <span>{t("exportPdf")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Authenticated User Profile Pill & Dropdown */}
            {session && (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse p-1 sm:ps-2 pe-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-white transition-all cursor-pointer shadow-xs"
                >
                  <img
                    src={session.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                    alt={session.user.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0"
                  />
                  <div className="text-start rtl:text-end hidden xl:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[90px]">
                      {language === "ar" ? session.user.fullName.split(" ")[0] : session.user.fullNameEn?.split(" ")[0] || session.user.fullName.split(" ")[0]}
                    </p>
                    <p className="text-[9px] text-indigo-600 font-semibold leading-none">{session.user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Profile Dropdown Menu (Strictly positioned to avoid window overflow) */}
                {showUserDropdown && (
                  <div className={`absolute ${isRTL ? "left-0" : "right-0"} mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 text-slate-800`}>
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center space-x-3 rtl:space-x-reverse">
                      <img
                        src={session.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                        alt={session.user.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {language === "ar" ? session.user.fullName : session.user.fullNameEn || session.user.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate font-mono">{session.user.email}</p>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {session.user.role}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {onOpenSecuritySettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenSecuritySettings();
                          }}
                          className="w-full px-4 py-2 text-xs text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse text-slate-700 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{t("securitySettings")}</p>
                            <p className="text-[10px] text-slate-400">{language === "ar" ? "تغيير كلمة المرور، PIN، والمصادقة" : "Change password, PIN & 2FA"}</p>
                          </div>
                        </button>
                      )}

                      {onLockScreen && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onLockScreen();
                          }}
                          className="w-full px-4 py-2 text-xs text-start rtl:text-end hover:bg-slate-50 flex items-center space-x-2.5 rtl:space-x-reverse text-slate-700 transition-colors cursor-pointer"
                        >
                          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{t("lockScreen")}</p>
                            <p className="text-[10px] text-slate-400">{language === "ar" ? "تأمين الشاشة برمز PIN السريع" : "Protect screen with PIN"}</p>
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onLogout();
                          }}
                          className="w-full px-4 py-2 text-xs text-start rtl:text-end hover:bg-rose-50 flex items-center space-x-2.5 rtl:space-x-reverse text-rose-600 transition-colors cursor-pointer font-semibold"
                        >
                          <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{t("logout")}</span>
                        </button>
                      )}
                    </div>
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
