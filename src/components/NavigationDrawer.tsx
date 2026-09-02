import React, { useState, useMemo, useEffect } from "react";
import {
  Home,
  ShoppingCart,
  Sparkles,
  Edit3,
  Eye,
  History,
  Boxes,
  Users,
  Building2,
  Repeat,
  Settings,
  X,
  Search,
  PlusCircle,
  MessageSquare,
  ShieldCheck,
  Lock,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Printer,
  FileDown,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  Package,
  Truck,
  UserCheck,
  CreditCard,
  QrCode,
  FileCheck,
  FileCheck2,
  Tablet,
  BookOpen,
  Scale
} from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import { AuthSession } from "../types";

export type NavTabType = "home" | "pos" | "accounting" | "spaces" | "contracts" | "services" | "portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" | "inventory" | "purchases" | "branches" | "employees" | "requests" | "schedules" | "settings";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  onNewVoucher: () => void;
  onOpenAiAssistant: () => void;
  onOpenAttendanceKiosk?: () => void;
  onOpenSecuritySettings?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
  session?: AuthSession | null;
  vouchersCount?: number;
  inventoryCount?: number;
  customersCount?: number;
  employeesCount?: number;
}

interface MenuItem {
  id: NavTabType;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  colorClass: string;
  bgClass: string;
}

interface MenuCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  items: MenuItem[];
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onNewVoucher,
  onOpenAiAssistant,
  onOpenAttendanceKiosk,
  onOpenSecuritySettings,
  onLockScreen,
  onLogout,
  session,
  vouchersCount = 0,
  inventoryCount = 0,
  customersCount = 0,
  employeesCount = 0
}) => {
  const { language, setLanguage, isRTL, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Track expanded categories state (collapsed by default: {})
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const categories: MenuCategory[] = useMemo(() => [
    {
      id: "finance",
      titleAr: "دشال المالية (Deshal Finance)",
      titleEn: "Deshal Finance Suite",
      icon: CreditCard,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      items: [
        {
          id: "home",
          labelAr: "لوحة التحكم المالية",
          labelEn: "Finance Dashboard",
          descAr: "نظرة عامة على الإيرادات والمصروفات ومؤشرات الأداء",
          descEn: "Revenue, expenses & key performance analytics",
          icon: Home,
          colorClass: "text-indigo-600",
          bgClass: "bg-indigo-50"
        },
        {
          id: "pos",
          labelAr: "كاشير ونقطة البيع السريعة (POS)",
          labelEn: "Quick POS Register",
          descAr: "كاشير فوري مع ماسح الباركود والطباعة الحرارية",
          descEn: "Instant barcode checkout & thermal receipt printing",
          icon: ShoppingCart,
          badge: language === "ar" ? "كاشير سريع" : "POS Quick",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          colorClass: "text-emerald-600",
          bgClass: "bg-emerald-50"
        },
        {
          id: "doc-wizard",
          labelAr: "معالج السندات والفواتير الذكي",
          labelEn: "Smart Doc Wizard",
          descAr: "إنشاء سندات قبض، صرف، فواتير وعروض أسعار في 4 خطوات",
          descEn: "Create receipts, payments, tax invoices & quotes in 4 steps",
          icon: Sparkles,
          badge: language === "ar" ? "معالج ذكي" : "Smart",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
          colorClass: "text-purple-600",
          bgClass: "bg-purple-50"
        },
        {
          id: "editor",
          labelAr: "محرر السندات المتقدم",
          labelEn: "Full Voucher Editor",
          descAr: "تعديل تفاصيل السند، الحقول المخصصة، البنود، والضرائب",
          descEn: "Edit document items, custom fields, taxes & signatures",
          icon: Edit3,
          colorClass: "text-blue-600",
          bgClass: "bg-blue-50"
        },
        {
          id: "preview",
          labelAr: "المعاينة والطباعة المباشرة",
          labelEn: "Preview & Printing",
          descAr: "معاينة تصميم السند، طباعة حرارية A4، وتصدير PDF",
          descEn: "Preview layout, print thermal/A4, & export high-res PDF",
          icon: Eye,
          colorClass: "text-teal-600",
          bgClass: "bg-teal-50"
        },
        {
          id: "history",
          labelAr: "سجل السندات والأرشيف",
          labelEn: "Vouchers & Archive",
          descAr: "البحث، التصفية، الطباعة الجماعية، وتصدير إكسل",
          descEn: "Search, filter, batch print & Excel export",
          icon: History,
          badge: vouchersCount > 0 ? `${vouchersCount}` : undefined,
          badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
          colorClass: "text-amber-600",
          bgClass: "bg-amber-50"
        },
        {
          id: "schedules",
          labelAr: "التحصيل والأقساط الدورية",
          labelEn: "Recurring Billing Schedules",
          descAr: "أتمتة إصدار السندات المتكررة للاشتراكات والإيجارات",
          descEn: "Automate recurring billing for subscriptions & rent",
          icon: Repeat,
          badge: language === "ar" ? "جدولة دورية" : "Auto-Pilot",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          colorClass: "text-indigo-600",
          bgClass: "bg-indigo-50"
        }
      ]
    },
    {
      id: "accounting",
      titleAr: "دشال المحاسبة والمالية (Deshal Accounting)",
      titleEn: "Deshal Accounting Suite",
      icon: BookOpen,
      colorClass: "text-indigo-600",
      bgClass: "bg-indigo-50",
      items: [
        {
          id: "accounting",
          labelAr: "دفتر الأستاذ والتقارير المالية (General Ledger & Accounts)",
          labelEn: "General Ledger & Financial Statements",
          descAr: "القيود اليومية المزدوجة، قيود التسوية، ميزان المراجعة، قائمة الدخل، الميزانية العمومية وسجل التدقيق",
          descEn: "Double-entry general journal, adjusting entries, trial balance, P&L, balance sheet & audit trail",
          icon: BookOpen,
          badge: language === "ar" ? "محاسبة معتمدة" : "Double-Entry",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          colorClass: "text-indigo-600",
          bgClass: "bg-indigo-50"
        }
      ]
    },
    {
      id: "spaces",
      titleAr: "دشال المساحات (Deshal Spaces)",
      titleEn: "Deshal Spaces Suite",
      icon: Building2,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
      items: [
        {
          id: "spaces",
          labelAr: "حجز القاعات ومساحات العمل",
          labelEn: "Spaces & Halls Booking",
          descAr: "تأجير قاعات التدريب، الاجتماعات والمكاتب بالساعة أو الشهر",
          descEn: "Rent training halls, boardrooms & coworking offices",
          icon: Building2,
          badge: language === "ar" ? "حجز ذكي" : "Smart Booking",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          colorClass: "text-indigo-600",
          bgClass: "bg-indigo-50"
        },
        {
          id: "contracts",
          labelAr: "عقود الإيجار والمستأجرين",
          labelEn: "Lease Contracts & Tenants",
          descAr: "صياغة العقود، التوقيع الرقمي، جدولة الأقساط، والضمانات المالية",
          descEn: "Contract drafting, e-signatures, installment billing & deposits",
          icon: FileCheck,
          badge: language === "ar" ? "عقود وتأجير" : "Leasing",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          colorClass: "text-indigo-600",
          bgClass: "bg-indigo-50"
        }
      ]
    },
    {
      id: "services",
      titleAr: "دشال الخدمات (Deshal Services)",
      titleEn: "Deshal Services Suite",
      icon: Layers,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50",
      items: [
        {
          id: "services",
          labelAr: "الخدمات الاستشارية وباقات المشتركين",
          labelEn: "Services & Tenant Packages",
          descAr: "كتالوج المحاسبة، التسويق، الاستوديو، المواقع وباقات المستأجرين والحصص",
          descEn: "Accounting, marketing, media studio, HR & tenant memberships & quotas",
          icon: Layers,
          badge: language === "ar" ? "باقات وحصص" : "Quota Engine",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
          colorClass: "text-purple-600",
          bgClass: "bg-purple-50"
        },
        {
          id: "portal",
          labelAr: "بوابة الحجز الذكية للعملاء",
          labelEn: "Client Booking Portal",
          descAr: "واجهة حجز الاستشارات، الخدمات الإدارية وقاعات الاجتماعات",
          descEn: "Client portal for booking advisory services & smart spaces",
          icon: Sparkles,
          badge: language === "ar" ? "بوابة العملاء" : "Client Portal",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
          colorClass: "text-purple-600",
          bgClass: "bg-purple-50"
        }
      ]
    },
    {
      id: "crm",
      titleAr: "دشال العملاء (Deshal CRM)",
      titleEn: "Deshal CRM Suite",
      icon: Users,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      items: [
        {
          id: "crm",
          labelAr: "دليل العملاء والمستأجرين 360°",
          labelEn: "Customers & Tenants CRM 360°",
          descAr: "سجلات العملاء، عقودهم، باقاتهم، استهلاك الحصص، وكشوف الحسابات",
          descEn: "Client & tenant profiles, contracts, package quotas & account statements",
          icon: Users,
          badge: customersCount > 0 ? `${customersCount} عميل` : undefined,
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          colorClass: "text-emerald-600",
          bgClass: "bg-emerald-50"
        }
      ]
    },
    {
      id: "supply",
      titleAr: "دشال المخزون والتوريد (Deshal Supply)",
      titleEn: "Deshal Supply Suite",
      icon: Boxes,
      colorClass: "text-cyan-600",
      bgClass: "bg-cyan-50",
      items: [
        {
          id: "inventory",
          labelAr: "إدارة المخزون والأصناف",
          labelEn: "Inventory Management",
          descAr: "تتبع الكميات، تنبيهات النواقص، وتوليد الباركود",
          descEn: "Stock balance, low stock alerts & barcode generation",
          icon: Boxes,
          badge: inventoryCount > 0 ? `${inventoryCount} صنف` : undefined,
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          colorClass: "text-blue-600",
          bgClass: "bg-blue-50"
        },
        {
          id: "purchases",
          labelAr: "فواتير المشتريات والموردين",
          labelEn: "Purchases & Suppliers",
          descAr: "تسجيل فواتير التوريد، حساب التكلفة، وسداد الموردين",
          descEn: "Purchase invoices, costing & supplier payments",
          icon: Truck,
          colorClass: "text-cyan-600",
          bgClass: "bg-cyan-50"
        },
        {
          id: "branches",
          labelAr: "شبكة الفروع والمناقلات",
          labelEn: "Branches & Transfers",
          descAr: "إدارة الفروع المتعددة ومناقلات المخزون بين المستودعات",
          descEn: "Multi-branch control & inter-warehouse stock dispatch",
          icon: Building2,
          colorClass: "text-rose-600",
          bgClass: "bg-rose-50"
        }
      ]
    },
    {
      id: "hr",
      titleAr: "ديشال الموارد البشرية والرواتب (Deshal HR)",
      titleEn: "Deshal HR & Payroll Suite",
      icon: UserCheck,
      colorClass: "text-indigo-600",
      bgClass: "bg-indigo-50",
      items: [
        {
          id: "employees",
          labelAr: "الموارد البشرية، الرواتب والملف الشامل 360°",
          labelEn: "HRMS, 360° Staff, Payroll & Performance",
          descAr: "سجل الكادر والملف الشامل، العقود ونهاية الخدمة، تقييم الأداء، التدريب، الجزاءات، التحفيز، الوثائق، الرواتب وبصمة الكشك",
          descEn: "360° Staff profiles, contracts & EOSB, KPIs, training, disciplinary, recognition, documents, payroll WPS & kiosk",
          icon: Users,
          badge: employeesCount && employeesCount > 0 ? `${employeesCount} موظف` : undefined,
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          colorClass: "text-indigo-600",
          bgClass: "bg-indigo-50"
        },
        {
          id: "requests",
          labelAr: "إدارة الطلبات والنماذج الذكية (Request Engine)",
          labelEn: "Requests & Forms Engine",
          descAr: "نظام عام لطلبات الموظفين، بناء النماذج الديناميكية، سلاسل الاعتماد وإصدار الشهادات الرسمية الموثقة بـ QR",
          descEn: "Generic request engine, dynamic form builder, approval workflows & QR verified certificates",
          icon: FileCheck2,
          badge: language === "ar" ? "نظام الطلبات الذكي" : "Request Engine",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          colorClass: "text-emerald-600",
          bgClass: "bg-emerald-50"
        }
      ]
    },
    {
      id: "settings",
      titleAr: "إعدادات النظام والأمان (Deshal Settings)",
      titleEn: "System & Security Settings",
      icon: Settings,
      colorClass: "text-slate-600",
      bgClass: "bg-slate-100",
      items: [
        {
          id: "settings",
          labelAr: "إعدادات المؤسسة والتصميم",
          labelEn: "Company Settings & Identity",
          descAr: "الشعار، الألوان، العملات، الحسابات البنكية، والموظفين",
          descEn: "Logo, colors, multi-currency, bank accounts & staff",
          icon: Settings,
          colorClass: "text-slate-700",
          bgClass: "bg-slate-100"
        }
      ]
    }
  ], [language, vouchersCount, inventoryCount, customersCount, employeesCount]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    categories.forEach(cat => {
      allExpanded[cat.id] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Filter items by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();

    return categories
      .map(category => {
        const matchingItems = category.items.filter(item => {
          return (
            item.labelAr.toLowerCase().includes(q) ||
            item.labelEn.toLowerCase().includes(q) ||
            item.descAr.toLowerCase().includes(q) ||
            item.descEn.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            category.titleAr.toLowerCase().includes(q) ||
            category.titleEn.toLowerCase().includes(q)
          );
        });
        return {
          ...category,
          items: matchingItems
        };
      })
      .filter(category => category.items.length > 0);
  }, [categories, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden print:hidden animate-in fade-in duration-200">
      {/* Dark Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Slide-over Drawer Container */}
      <div
        className={`fixed inset-y-0 ${
          isRTL ? "right-0" : "left-0"
        } max-w-full flex pl-0 pr-0 z-50`}
      >
        <div
          className={`w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col h-full transform transition-transform ease-out duration-300 ${
            isRTL ? "animate-in slide-in-from-right" : "animate-in slide-in-from-left"
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {language === "ar" ? "منظومة دشال لإدارة الأعمال" : "Deshal Business ERP Suites"}
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                    ERP
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {language === "ar" ? "الوصول السريع لجميع المجموعات والأقسام" : "Quick access to all Deshal suites & modules"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              title={language === "ar" ? "إغلاق القائمة" : "Close menu"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box & Collapse Controls */}
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-white shrink-0 space-y-2">
            <div className="relative">
              <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isRTL ? "right-3" : "left-3"}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "ar" ? "ابحث عن قسم، أداة، أو مجموعة..." : "Search module, tool or suite..."}
                className={`w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl py-2.5 ${
                  isRTL ? "pr-9 pl-8" : "pl-9 pr-8"
                } text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-2.5 ${isRTL ? "left-3" : "right-3"} text-slate-400 hover:text-slate-600 p-0.5`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Expand / Collapse All Controls */}
            {!searchQuery && (
              <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 font-medium">
                <span>{language === "ar" ? "المجموعات الرئيسية للمنظومة" : "Main ERP Suites"}</span>
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-600 font-semibold">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="hover:underline hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {language === "ar" ? "توسيع الكل" : "Expand All"}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="hover:underline hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {language === "ar" ? "طي الكل" : "Collapse All"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Categories List with Collapsible Sections */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">{language === "ar" ? "لم يتم العثور على نتائج" : "No modules found"}</p>
                <p className="text-xs mt-1 text-slate-400">
                  {language === "ar" ? "جرب البحث بكلمات أخرى" : "Try searching with different terms"}
                </p>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSearching = searchQuery.trim().length > 0;
                // If searching, keep expanded; otherwise check expandedCategories state (collapsed by default)
                const hasActiveTab = category.items.some(item => item.id === activeTab);
                const isExpanded = isSearching || Boolean(expandedCategories[category.id]);
                const CategoryIcon = category.icon;

                return (
                  <div 
                    key={category.id} 
                    className="bg-slate-50/80 border border-slate-200/90 rounded-2xl overflow-hidden transition-all shadow-2xs"
                  >
                    {/* Collapsible Group Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50 flex items-center justify-between text-start rtl:text-end transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${category.bgClass} ${category.colorClass}`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {language === "ar" ? category.titleAr : category.titleEn}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                        {hasActiveTab && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" title={language === "ar" ? "القسم النشط حالياً" : "Active module"} />
                        )}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                          {category.items.length}
                        </span>
                        <div className="text-slate-400 p-0.5">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 transition-transform text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 transition-transform" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Collapsible Content / Sub-Items */}
                    {isExpanded && (
                      <div className="p-2 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-1 animate-in fade-in duration-150">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;

                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                onSelectTab(item.id);
                                onClose();
                              }}
                              className={`w-full text-start p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group border ${
                                isActive
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                  : "bg-white hover:bg-slate-100/80 border-slate-200/60 hover:border-slate-300 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                    isActive ? "bg-white/20 text-white" : `${item.bgClass} ${item.colorClass}`
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                                    <span className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-900"}`}>
                                      {language === "ar" ? item.labelAr : item.labelEn}
                                    </span>
                                    {item.badge && (
                                      <span className={`px-1 py-0.2 text-[9px] font-bold rounded-md border ${
                                        isActive ? "bg-white/20 text-white border-white/30" : (item.badgeColor || "bg-slate-100 text-slate-600")
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[10px] truncate mt-0.5 max-w-[200px] sm:max-w-xs ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                                    {language === "ar" ? item.descAr : item.descEn}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center ps-2">
                                {isActive ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <ChevronRight className={`w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-transform ${isRTL ? "rotate-180" : ""}`} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Quick Actions Card */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/80 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">
                  {language === "ar" ? "إجراءات سريعة فورية" : "Quick Actions"}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-white/80 px-2 py-0.5 rounded-md">
                  Shortcut
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onNewVoucher();
                    onClose();
                  }}
                  className="py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-all shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{language === "ar" ? "سند جديد" : "New Voucher"}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAiAssistant();
                    onClose();
                  }}
                  className="py-2 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === "ar" ? "مساعد الذكاء" : "AI Assist"}</span>
                </button>

                {onOpenAttendanceKiosk && (
                  <button
                    onClick={() => {
                      onOpenAttendanceKiosk();
                      onClose();
                    }}
                    className="col-span-2 sm:col-span-1 py-2 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-all shadow-xs cursor-pointer"
                  >
                    <Tablet className="w-3.5 h-3.5 text-amber-200" />
                    <span>{language === "ar" ? "كشك الحضور" : "Kiosk"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer / Account Info */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 space-y-3">
            {session && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                  <img
                    src={session.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                    alt={session.user.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {session.user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{session.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 rtl:space-x-reverse shrink-0">
                  {onLockScreen && (
                    <button
                      onClick={() => {
                        onClose();
                        onLockScreen();
                      }}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                      title={language === "ar" ? "قفل الشاشة" : "Lock Screen"}
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title={language === "ar" ? "تسجيل الخروج" : "Logout"}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Language & Info Switcher */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
              <span>{language === "ar" ? "دشال لإدارة الأعمال ERP v2.5" : "Deshal Business ERP v2.5"}</span>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <button
                  onClick={() => setLanguage("ar")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    language === "ar" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    language === "en" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
