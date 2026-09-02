import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  ReceiptVoucher,
  Customer,
  InventoryItem,
  PurchaseInvoice,
  CompanySettings
} from "../types";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";
import { useLanguage } from "../utils/LanguageContext";
import {
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Boxes,
  Users,
  CheckCircle2,
  Activity,
  PieChart as PieIcon
} from "lucide-react";

interface DashboardAnalyticsProps {
  vouchers: ReceiptVoucher[];
  purchases?: PurchaseInvoice[];
  inventory?: InventoryItem[];
  customers?: Customer[];
  companySettings?: CompanySettings;
}

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  vouchers,
  purchases = [],
  inventory = [],
  customers = [],
  companySettings = DEFAULT_COMPANY_SETTINGS
}) => {
  const { language, t, isRTL } = useLanguage();
  const [timeRange, setTimeRange] = useState<"30DAYS" | "6MONTHS" | "YEAR" | "ALL">("6MONTHS");
  const currency = companySettings?.defaultCurrency || vouchers[0]?.currency || "OMR";

  // Calculate Monthly Trends Data
  const monthlyTrendsData = useMemo(() => {
    // Group receipts and payments by month
    const monthlyMap: Record<
      string,
      { monthKey: string; name: string; income: number; expenses: number; net: number }
    > = {};

    // Seed recent 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
      const name = language === "ar" ? `${MONTH_NAMES_AR[monthIdx]} ${year}` : `${MONTH_NAMES_EN[monthIdx]} ${year}`;
      monthlyMap[key] = { monthKey: key, name, income: 0, expenses: 0, net: 0 };
    }

    // Aggregate vouchers
    vouchers.forEach((v) => {
      if (!v.date) return;
      const dateParts = v.date.split("-");
      if (dateParts.length < 2) return;
      const key = `${dateParts[0]}-${dateParts[1]}`;
      const amount = v.totalAmount || v.amount || 0;

      if (!monthlyMap[key]) {
        const monthIdx = parseInt(dateParts[1], 10) - 1;
        const name =
          language === "ar"
            ? `${MONTH_NAMES_AR[monthIdx] || dateParts[1]} ${dateParts[0]}`
            : `${MONTH_NAMES_EN[monthIdx] || dateParts[1]} ${dateParts[0]}`;
        monthlyMap[key] = { monthKey: key, name, income: 0, expenses: 0, net: 0 };
      }

      if (v.type === "RECEIPT" || v.type === "TAX_INVOICE") {
        monthlyMap[key].income += amount;
      } else if (v.type === "PAYMENT" || v.type === "PETTY_CASH") {
        monthlyMap[key].expenses += amount;
      }
    });

    // Aggregate purchases into expenses
    purchases.forEach((p) => {
      if (!p.date) return;
      const dateParts = p.date.split("-");
      if (dateParts.length < 2) return;
      const key = `${dateParts[0]}-${dateParts[1]}`;
      const amount = p.totalAmount || 0;

      if (monthlyMap[key]) {
        monthlyMap[key].expenses += amount;
      }
    });

    // Calculate net and sort chronologically
    const sorted = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((item) => ({
        ...item,
        income: Math.round(item.income * 100) / 100,
        expenses: Math.round(item.expenses * 100) / 100,
        net: Math.round((item.income - item.expenses) * 100) / 100
      }));

    if (timeRange === "30DAYS") {
      return sorted.slice(-2);
    } else if (timeRange === "6MONTHS") {
      return sorted.slice(-6);
    } else if (timeRange === "YEAR") {
      return sorted.slice(-12);
    }
    return sorted;
  }, [vouchers, purchases, language, timeRange]);

  // Category Breakdown Data for Pie Chart
  const categoryData = useMemo(() => {
    const catMap: Record<string, { name: string; value: number; count: number }> = {};

    inventory.forEach((item) => {
      const cat = item.category || (language === "ar" ? "أخرى" : "General");
      const val = item.quantity * item.sellingPrice;
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, value: 0, count: 0 };
      }
      catMap[cat].value += val;
      catMap[cat].count += item.quantity;
    });

    // If no inventory, seed from vouchers
    if (Object.keys(catMap).length === 0) {
      return [
        { name: language === "ar" ? "شاشات تفاعلية ذكية" : "Interactive Screens", value: 12500, count: 15 },
        { name: language === "ar" ? "كاميرات مراقبة 4K" : "4K CCTV Systems", value: 8900, count: 48 },
        { name: language === "ar" ? "شبكات وسيرفرات" : "Networking & Servers", value: 6400, count: 22 },
        { name: language === "ar" ? "كابلات وتمديدات" : "Cables & Wiring", value: 2100, count: 65 }
      ];
    }

    return Object.values(catMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [inventory, language]);

  // Top Products / Items by Sales & Stock Value
  const topProductsData = useMemo(() => {
    if (inventory.length > 0) {
      return [...inventory]
        .sort((a, b) => b.quantity * b.sellingPrice - a.quantity * a.sellingPrice)
        .slice(0, 5)
        .map((item) => ({
          name: item.name.length > 25 ? `${item.name.substring(0, 25)}...` : item.name,
          fullName: item.name,
          sku: item.sku,
          stock: item.quantity,
          value: Math.round(item.quantity * item.sellingPrice),
          cost: Math.round(item.quantity * item.costPrice)
        }));
    }

    return [
      { name: "شاشة تفاعلية 85 بوصة 4K", fullName: "شاشة تفاعلية 85 بوصة", sku: "SCR-85", stock: 8, value: 7600, cost: 5200 },
      { name: "كاميرا مراقبة شبكية 4K IP", fullName: "كاميرا مراقبة شبكية 4K IP", sku: "CAM-4K", stock: 45, value: 2160, cost: 1282 },
      { name: "سويتش شبكات 24 منفذ PoE", fullName: "سويتش شبكات 24 منفذ PoE", sku: "SW-24P", stock: 18, value: 2340, cost: 1350 },
      { name: "جهاز تسجيل شبكي NVR 32CH", fullName: "جهاز تسجيل شبكي NVR 32CH", sku: "NVR-32", stock: 12, value: 2220, cost: 1380 },
      { name: "كابينة خادم راك Rack 42U", fullName: "كابينة خادم راك Rack 42U", sku: "RCK-42", stock: 3, value: 870, cost: 540 }
    ];
  }, [inventory]);

  // Payment Method Breakdown
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {
      BANK_TRANSFER: 0,
      CASH: 0,
      CREDIT_CARD: 0,
      CHEQUE: 0
    };

    vouchers.forEach((v) => {
      const m = v.paymentMethod || "BANK_TRANSFER";
      methods[m] = (methods[m] || 0) + (v.totalAmount || v.amount || 0);
    });

    const methodLabels: Record<string, { ar: string; en: string }> = {
      BANK_TRANSFER: { ar: "تحويل بنكي", en: "Bank Transfer" },
      CASH: { ar: "نقداً (كاش)", en: "Cash" },
      CREDIT_CARD: { ar: "بطاقة دفع إلكتروني", en: "Card Payment" },
      CHEQUE: { ar: "شيك مصرفي", en: "Cheque" }
    };

    return Object.entries(methods).map(([key, val]) => ({
      key,
      name: language === "ar" ? methodLabels[key]?.ar || key : methodLabels[key]?.en || key,
      value: Math.round(val * 100) / 100
    }));
  }, [vouchers, language]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 font-sans">
          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold">
                {entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="dashboard-analytics-section" className="space-y-6 pt-2">
      {/* Section Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{t("dashboardAnalytics")}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                {t("liveDataSync")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{t("analyticsSubtitle")}</p>
          </div>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setTimeRange("30DAYS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === "30DAYS" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("last30Days")}
          </button>
          <button
            onClick={() => setTimeRange("6MONTHS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === "6MONTHS" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {language === "ar" ? "آخر 6 أشهر" : "Last 6 Mos"}
          </button>
          <button
            onClick={() => setTimeRange("YEAR")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === "YEAR" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {language === "ar" ? "السنة الحالية" : "Current Year"}
          </button>
          <button
            onClick={() => setTimeRange("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === "ALL" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("allTime")}
          </button>
        </div>
      </div>

      {/* Main Charts Grid: 1. Cashflow Trends AreaChart, 2. Category PieChart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue & Cashflow Trends (Takes 2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">{t("revenueTrends")}</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">({currency})</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => <span className="text-xs font-semibold text-slate-600">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name={t("monthlyIncome")}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={t("monthlyExpenses")}
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-700 font-medium block">{t("monthlyIncome")}</span>
              <span className="text-sm font-bold text-emerald-950 font-mono">
                {monthlyTrendsData.reduce((acc, curr) => acc + curr.income, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
            <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
              <span className="text-[11px] text-rose-700 font-medium block">{t("monthlyExpenses")}</span>
              <span className="text-sm font-bold text-rose-950 font-mono">
                {monthlyTrendsData.reduce((acc, curr) => acc + curr.expenses, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
            <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="text-[11px] text-indigo-700 font-medium block">{t("netMargin")}</span>
              <span className="text-sm font-bold text-indigo-950 font-mono">
                {(
                  monthlyTrendsData.reduce((acc, curr) => acc + curr.income, 0) -
                  monthlyTrendsData.reduce((acc, curr) => acc + curr.expenses, 0)
                ).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Category & Stock Value Distribution (1 Column Donut Chart) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">{t("categoryDistribution")}</h3>
            </div>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-medium truncate max-w-[140px]">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {cat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Row: 1. Top Selling Products BarChart, 2. Payment Methods & Customer Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top-Selling Products Horizontal Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">{t("topSellingProducts")}</h3>
            </div>
            <span className="text-xs text-indigo-600 font-semibold">{t("inventoryValuation")}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProductsData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  width={120}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name={t("sellingPrice")} fill="#4f46e5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown & Recent Customer Activity Stream */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">{t("paymentMethodBreakdown")}</h3>
            </div>
          </div>

          {/* Payment Method Progress Bars */}
          <div className="space-y-3 pt-1">
            {paymentMethodData.map((item, idx) => {
              const totalAll = paymentMethodData.reduce((acc, curr) => acc + curr.value, 0) || 1;
              const percentage = Math.round((item.value / totalAll) * 100);

              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer Activity Snapshot */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                {t("recentCustomerActivity")}
              </span>
            </div>

            <div className="space-y-2">
              {customers.slice(0, 3).map((cust) => (
                <div
                  key={cust.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{cust.name}</p>
                      <p className="text-[11px] text-slate-400">{cust.city || "سلطنة عمان"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    {cust.status === "ACTIVE" ? t("active") : t("lead")}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
