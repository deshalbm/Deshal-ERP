/**
 * Workspace Customization Storage & Supabase Sync Engine — Deshal ERP
 * Handles user-customized workspace quick launchers, action buttons, and report cards.
 * Dual-persistence: Instant LocalStorage cache + Supabase PostgreSQL database table.
 */

import {
  WorkspaceConfig,
  QuickLauncherId,
  QuickActionId,
  ReportWidgetId
} from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase/client";

const WORKSPACE_CONFIG_STORAGE_KEY_PREFIX = "deshal_workspace_config_v1";

// Catalog of all available quick launchers
export interface QuickLauncherMetadata {
  id: QuickLauncherId;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  iconName: string;
  badgeAr?: string;
  badgeEn?: string;
  colorTheme: string; // Tailwind gradient/color class
}

export const ALL_QUICK_LAUNCHERS: QuickLauncherMetadata[] = [
  {
    id: "pos",
    labelAr: "نقطة البيع (POS)",
    labelEn: "POS Terminal",
    descAr: "مبيعات سريعة وباركود وفواتير فورية.",
    descEn: "Retail checkout with instant barcodes.",
    iconName: "ShoppingCart",
    badgeAr: "نظام الكاشير المباشر",
    badgeEn: "Live POS",
    colorTheme: "from-indigo-700 via-indigo-600 to-indigo-800"
  },
  {
    id: "accounting",
    labelAr: "دفتر الأستاذ والتقارير",
    labelEn: "General Ledger",
    descAr: "القيود المزدوجة، ميزان المراجعة، الأرباح والخسائر والميزانية.",
    descEn: "Double entry, trial balance, P&L, balance sheet & audit trail.",
    iconName: "BookOpen",
    badgeAr: "المحاسبة المتقدمة",
    badgeEn: "IFRS GL",
    colorTheme: "from-emerald-800 via-teal-800 to-slate-900"
  },
  {
    id: "spaces",
    labelAr: "حجز القاعات ومساحات العمل",
    labelEn: "Spaces & Meeting Halls",
    descAr: "تأجير قاعات التدريب والاجتماعات بالساعة أو الشهر آلياً.",
    descEn: "Rent training halls and meeting desks hourly or monthly.",
    iconName: "Building2",
    badgeAr: "نظام حجز ذكي",
    badgeEn: "Smart Booking",
    colorTheme: "from-blue-700 via-indigo-700 to-indigo-900"
  },
  {
    id: "doc-wizard",
    labelAr: "معالج السندات الذكي",
    labelEn: "Doc Wizard",
    descAr: "إنشاء سندات واختيار النماذج الضريبية والمعتمدة بنقرة واحدة.",
    descEn: "Generate tax-compliant vouchers with dynamic wizard templates.",
    iconName: "Sparkles",
    badgeAr: "معالج السندات",
    badgeEn: "Doc Wizard",
    colorTheme: "from-purple-700 via-indigo-700 to-slate-900"
  },
  {
    id: "inventory",
    labelAr: "المخزون والمخازن",
    labelEn: "Inventory System",
    descAr: "تتبع جرد المواد والمنتجات، أرقام SKU والتنبيهات عند انخفاض الكميات.",
    descEn: "Stock balances, barcode items, SKU tracking & reorder alerts.",
    iconName: "Boxes",
    badgeAr: "المخزون",
    badgeEn: "Stock",
    colorTheme: "from-amber-600 to-orange-700"
  },
  {
    id: "purchases",
    labelAr: "إدارة المشتريات",
    labelEn: "Purchases & POs",
    descAr: "تسجيل فواتير المشتريات، الموردين وتكاليف الشحن والخصومات.",
    descEn: "Vendor invoices, purchase orders, shipping fees & stock receiving.",
    iconName: "ShoppingCart",
    badgeAr: "المشتريات",
    badgeEn: "Procurement",
    colorTheme: "from-indigo-600 to-blue-800"
  },
  {
    id: "branches",
    labelAr: "الفروع والمستودعات",
    labelEn: "Branches & Outlets",
    descAr: "إدارة الفروع المتعددة ومناقلات البضائع بين المخازن.",
    descEn: "Multi-branch setup, stock transfers & warehouse dispatch.",
    iconName: "Building2",
    badgeAr: "الفروع",
    badgeEn: "Outlets",
    colorTheme: "from-emerald-700 to-teal-900"
  },
  {
    id: "schedules",
    labelAr: "الأقساط والجدولة",
    labelEn: "Recurring Schedules",
    descAr: "إدارة أقساط العقارات، السيارات، الاشتراكات الدورية والفواتير.",
    descEn: "Car & property lease installments, recurring bills & auto invoices.",
    iconName: "Repeat",
    badgeAr: "الجدولة",
    badgeEn: "Automated",
    colorTheme: "from-purple-600 to-indigo-800"
  },
  {
    id: "crm",
    labelAr: "إدارة العملاء CRM",
    labelEn: "CRM Directory",
    descAr: "سجل العملاء، الاتصالات، تصنيف الشركات ومتابعة المبيعات.",
    descEn: "Client records, phone contacts, lead stages & transaction logs.",
    iconName: "Users",
    badgeAr: "العملاء",
    badgeEn: "CRM",
    colorTheme: "from-sky-600 to-indigo-800"
  },
  {
    id: "employees",
    labelAr: "الموارد البشرية والرواتب",
    labelEn: "HR & Employees",
    descAr: "إدارة الموظفين، الرواتب، الإجازات والحضور وساعات العمل.",
    descEn: "Employee profiles, monthly payroll, leave approvals & attendance.",
    iconName: "Users",
    badgeAr: "الموارد البشرية",
    badgeEn: "Personnel",
    colorTheme: "from-rose-600 to-pink-800"
  },
  {
    id: "requests",
    labelAr: "طلبات الموافقات",
    labelEn: "Approval Requests",
    descAr: "إدارة طلبات الصرف، السلف، الإجازات والتفويضات الإدارية.",
    descEn: "Financial petty cash requests, advance payment & leave workflows.",
    iconName: "FileCheck",
    badgeAr: "الطلبات",
    badgeEn: "Requests",
    colorTheme: "from-cyan-700 to-blue-900"
  },
  {
    id: "settings",
    labelAr: "إعدادات النظام والشركة",
    labelEn: "System Settings",
    descAr: "بيانات الشركة، الشعارات، الفوترة الضريبية وإعدادات الواتساب.",
    descEn: "Company branding, VAT numbers, default currency & WhatsApp setup.",
    iconName: "Settings",
    badgeAr: "الإعدادات",
    badgeEn: "Settings",
    colorTheme: "from-slate-700 to-slate-900"
  }
];

// Catalog of quick action buttons
export interface QuickActionMetadata {
  id: QuickActionId;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  badgeAr: string;
  badgeEn: string;
  iconName: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const ALL_QUICK_ACTIONS: QuickActionMetadata[] = [
  {
    id: "RECEIPT",
    labelAr: "سند قبض مالي",
    labelEn: "Receipt Voucher",
    descAr: "استلام مبالغ نقدية أو تحويلات بنكية من العملاء وإصدار إيصال معتمد.",
    descEn: "Collect cash or bank transfers from clients with certified receipts.",
    badgeAr: "تسجيل إيرادات",
    badgeEn: "Income Collection",
    iconName: "ArrowDownLeft",
    bgClass: "hover:bg-emerald-50/50",
    textClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    borderClass: "hover:border-emerald-300"
  },
  {
    id: "TAX_INVOICE",
    labelAr: "فاتورة ضريبية إلكترونية",
    labelEn: "Tax Invoice",
    descAr: "فاتورة مبيعات مفصلة مع حساب ضريبة القيمة المضافة (VAT) ورمز QR.",
    descEn: "Itemized billing with automated VAT calculations and verification QR.",
    badgeAr: "فوترة إلكترونية + ضريبة",
    badgeEn: "E-Invoicing + VAT",
    iconName: "FileText",
    bgClass: "hover:bg-blue-50/50",
    textClass: "text-blue-700 bg-blue-50 border-blue-200",
    borderClass: "hover:border-blue-300"
  },
  {
    id: "QUOTATION",
    labelAr: "عرض سعر رسمية",
    labelEn: "Quotation Proposal",
    descAr: "تقديم مقترح مالي للعملاء بالبنود والأسعار والشروط التعاقدية.",
    descEn: "Official quotes with custom terms, unit prices, and validity period.",
    badgeAr: "عروض الأسعار والصفقات",
    badgeEn: "Proposals & Bids",
    iconName: "FileSpreadsheet",
    bgClass: "hover:bg-purple-50/50",
    textClass: "text-purple-700 bg-purple-50 border-purple-200",
    borderClass: "hover:border-purple-300"
  },
  {
    id: "PAYMENT",
    labelAr: "سند صرف مالي",
    labelEn: "Payment Voucher",
    descAr: "توثيق المبالغ المدفوعة للموردين، الإيجارات، والرواتب والمصروفات.",
    descEn: "Document payments made to suppliers, rents, salaries, and operational costs.",
    badgeAr: "تسجيل مصروفات / موردين",
    badgeEn: "Vendor Payouts",
    iconName: "ArrowUpRight",
    bgClass: "hover:bg-rose-50/50",
    textClass: "text-rose-700 bg-rose-50 border-rose-200",
    borderClass: "hover:border-rose-300"
  },
  {
    id: "PETTY_CASH",
    labelAr: "مصروفات نثرية",
    labelEn: "Petty Cash Voucher",
    descAr: "توثيق النثريات اليومية والدفعات النقدية الصغيرة السريعة.",
    descEn: "Record daily petty cash outflows and minor office operational costs.",
    badgeAr: "مصروفات صغيرة",
    badgeEn: "Petty Cash",
    iconName: "Wallet",
    bgClass: "hover:bg-amber-50/50",
    textClass: "text-amber-700 bg-amber-50 border-amber-200",
    borderClass: "hover:border-amber-300"
  }
];

// Catalog of report sections and widgets
export interface ReportWidgetMetadata {
  id: ReportWidgetId;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  categoryAr: string;
  categoryEn: string;
  iconName: string;
}

export const ALL_REPORT_WIDGETS: ReportWidgetMetadata[] = [
  {
    id: "kpi_collections",
    labelAr: "إجمالي المقبوضات والسندات",
    labelEn: "Total Collections KPI",
    descAr: "عرض إجمالي المبالغ المستلمة من العملاء والسندات المكتملة.",
    descEn: "Displays total collected revenue and paid receipt vouchers.",
    categoryAr: "المؤشرات الماليّة",
    categoryEn: "Financial KPIs",
    iconName: "ArrowDownLeft"
  },
  {
    id: "kpi_payments",
    labelAr: "إجمالي المدفوعات والمصروفات",
    labelEn: "Total Payments KPI",
    descAr: "عرض إجمالي المبالغ المصروفة للموردين والنثريات.",
    descEn: "Displays operational outflows and vendor payments.",
    categoryAr: "المؤشرات الماليّة",
    categoryEn: "Financial KPIs",
    iconName: "ArrowUpRight"
  },
  {
    id: "kpi_purchases",
    labelAr: "إجمالي فواتير المشتريات",
    labelEn: "Total Purchase POs",
    descAr: "عرض التكلفة الإجمالية لفواتير الشراء المسجلة.",
    descEn: "Summary of vendor purchase order invoices.",
    categoryAr: "المؤشرات الماليّة",
    categoryEn: "Financial KPIs",
    iconName: "ShoppingCart"
  },
  {
    id: "kpi_inventory",
    labelAr: "تقييم المخزون المالي",
    labelEn: "Inventory Valuation KPI",
    descAr: "عرض القيمة الماليّة الإجمالية لجميع الأصناف المتاحة في المخازن.",
    descEn: "Valuation of current in-stock goods across warehouses.",
    categoryAr: "المؤشرات الماليّة",
    categoryEn: "Financial KPIs",
    iconName: "Boxes"
  },
  {
    id: "smart_alerts",
    labelAr: "مركز التنبيهات والالتزامات الذكي",
    labelEn: "Smart Due Dates Alerts Center",
    descAr: "شريط ملخص الفواتير المستحقة، عقود الإيجار، والأقساط القادمة.",
    descEn: "Smart notification banner for overdue invoices, lease contracts & bills.",
    categoryAr: "التنبيهات التشغيلية",
    categoryEn: "Operational Alerts",
    iconName: "Clock"
  },
  {
    id: "visual_analytics",
    labelAr: "التحليلات والمؤشرات الرسمية (Visual Analytics)",
    labelEn: "Visual Charts & Analytics",
    descAr: "رسوم بيانية لمقارنة الإيرادات بالمصروفات، وتوزيع حالات المستندات.",
    descEn: "Recharts visualizations of financial cashflows and status distribution.",
    categoryAr: "الرسوم والتحليلات",
    categoryEn: "Charts & Visuals",
    iconName: "TrendingUp"
  },
  {
    id: "recent_vouchers",
    labelAr: "جدول أحدث المستندات والعمليات",
    labelEn: "Recent Vouchers List",
    descAr: "قائمة بآخر 5 مستندات صادرة مع التفاصيل وإمكانية المعاينة.",
    descEn: "Interactive log of recent transactions with view shortcuts.",
    categoryAr: "السجلات المباشرة",
    categoryEn: "Live Logs",
    iconName: "Receipt"
  },
  {
    id: "customer_directory",
    labelAr: "دليل العملاء السريع (CRM Quick Directory)",
    labelEn: "CRM Quick Directory",
    descAr: "قائمة سريعة بأبرز العملاء لإصدار سند مباشر لهم بنقرة واحدة.",
    descEn: "Top active customer list with quick voucher creation buttons.",
    categoryAr: "السجلات المباشرة",
    categoryEn: "Live Logs",
    iconName: "Users"
  }
];

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  quickLaunchers: ["pos", "accounting", "spaces", "doc-wizard", "inventory", "purchases", "branches", "schedules"],
  quickActions: ["RECEIPT", "TAX_INVOICE", "QUOTATION", "PAYMENT"],
  reportWidgets: [
    "kpi_collections",
    "kpi_payments",
    "kpi_purchases",
    "kpi_inventory",
    "smart_alerts",
    "visual_analytics",
    "recent_vouchers",
    "customer_directory"
  ]
};

function getStorageKey(userId?: string): string {
  return userId
    ? `${WORKSPACE_CONFIG_STORAGE_KEY_PREFIX}_${userId.trim()}`
    : `${WORKSPACE_CONFIG_STORAGE_KEY_PREFIX}_default`;
}

/**
 * Loads workspace config synchronously from localStorage cache
 */
export function loadWorkspaceConfigFromLocal(userId?: string): WorkspaceConfig {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceConfig;
      if (parsed && Array.isArray(parsed.quickLaunchers) && Array.isArray(parsed.reportWidgets)) {
        return {
          userId,
          quickLaunchers: parsed.quickLaunchers.length > 0 ? parsed.quickLaunchers : DEFAULT_WORKSPACE_CONFIG.quickLaunchers,
          quickActions: Array.isArray(parsed.quickActions) && parsed.quickActions.length > 0 ? parsed.quickActions : DEFAULT_WORKSPACE_CONFIG.quickActions,
          reportWidgets: parsed.reportWidgets.length > 0 ? parsed.reportWidgets : DEFAULT_WORKSPACE_CONFIG.reportWidgets,
          updatedAt: parsed.updatedAt
        };
      }
    }
  } catch (e) {
    console.warn("Failed to load workspace config from local storage:", e);
  }
  return { ...DEFAULT_WORKSPACE_CONFIG, userId };
}

/**
 * Saves workspace config synchronously to localStorage cache
 */
export function saveWorkspaceConfigToLocal(config: WorkspaceConfig, userId?: string): void {
  try {
    const key = getStorageKey(userId);
    const updated = {
      ...config,
      userId,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save workspace config to local storage:", e);
  }
}

/**
 * Asynchronously loads workspace config from Supabase DB `user_workspace_preferences` table.
 * Falls back to local storage cache if network is unavailable or table is missing.
 */
export async function fetchWorkspaceConfigFromSupabase(
  userId: string,
  userEmail?: string
): Promise<WorkspaceConfig> {
  const localConfig = loadWorkspaceConfigFromLocal(userId);

  if (!isSupabaseConfigured || !userId) {
    return localConfig;
  }

  try {
    const { data, error } = await (supabase.from("user_workspace_preferences") as any)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Supabase fetch workspace preferences error:", error.message);
      return localConfig;
    }

    if (data && data.config) {
      const dbConfig = data.config as WorkspaceConfig;
      const merged: WorkspaceConfig = {
        userId,
        userEmail: userEmail || data.user_email || undefined,
        quickLaunchers: Array.isArray(dbConfig.quickLaunchers) && dbConfig.quickLaunchers.length > 0 ? dbConfig.quickLaunchers : DEFAULT_WORKSPACE_CONFIG.quickLaunchers,
        quickActions: Array.isArray(dbConfig.quickActions) && dbConfig.quickActions.length > 0 ? dbConfig.quickActions : DEFAULT_WORKSPACE_CONFIG.quickActions,
        reportWidgets: Array.isArray(dbConfig.reportWidgets) && dbConfig.reportWidgets.length > 0 ? dbConfig.reportWidgets : DEFAULT_WORKSPACE_CONFIG.reportWidgets,
        updatedAt: data.updated_at || dbConfig.updatedAt
      };
      // Mirror to local cache
      saveWorkspaceConfigToLocal(merged, userId);
      return merged;
    }
  } catch (err) {
    console.warn("Exception fetching workspace preferences from Supabase:", err);
  }

  return localConfig;
}

/**
 * Asynchronously saves workspace config to Supabase DB `user_workspace_preferences` table AND local storage.
 */
export async function saveWorkspaceConfigToSupabase(
  config: WorkspaceConfig,
  userId: string,
  userEmail?: string
): Promise<{ success: boolean; message?: string }> {
  // First update local cache for instant UI responsiveness
  saveWorkspaceConfigToLocal(config, userId);

  if (!isSupabaseConfigured || !userId) {
    return { success: true, message: "تم الحفظ محلياً." };
  }

  try {
    const payload = {
      user_id: userId,
      user_email: userEmail || config.userEmail || null,
      config: {
        quickLaunchers: config.quickLaunchers,
        quickActions: config.quickActions,
        reportWidgets: config.reportWidgets,
        updatedAt: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabase.from("user_workspace_preferences") as any).upsert(
      payload,
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Failed to save workspace preferences to Supabase DB:", error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: "تم الحفظ بنجاح في قاعدة البيانات PostgreSQL وعلى الجهاز!" };
  } catch (err: any) {
    console.error("Exception saving workspace preferences to Supabase:", err);
    return { success: false, message: err.message || "حدث خطأ أثناء الاتصال بقاعدة البيانات" };
  }
}

/**
 * Resets workspace config to factory defaults across LocalStorage and Supabase DB.
 */
export async function resetWorkspaceConfig(
  userId?: string,
  userEmail?: string
): Promise<WorkspaceConfig> {
  const defaultConfig: WorkspaceConfig = {
    ...DEFAULT_WORKSPACE_CONFIG,
    userId,
    userEmail,
    updatedAt: new Date().toISOString()
  };

  saveWorkspaceConfigToLocal(defaultConfig, userId);

  if (isSupabaseConfigured && userId) {
    await saveWorkspaceConfigToSupabase(defaultConfig, userId, userEmail);
  }

  return defaultConfig;
}
