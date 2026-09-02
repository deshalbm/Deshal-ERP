import React, { useState, useMemo } from "react";
import {
  ConsultingService,
  ServiceCategory,
  PricingModel,
  ServiceStatus,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
  Customer,
  Branch,
  AuthSession,
  ReceiptVoucher
} from "../types";
import {
  Briefcase,
  Layers,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Award,
  Mic,
  Camera,
  Video,
  FileText,
  Globe,
  ShoppingCart,
  Users,
  Building,
  FileCheck,
  ShieldCheck,
  PieChart,
  DollarSign,
  Receipt,
  Calendar,
  Eye,
  ExternalLink,
  ChevronDown,
  UserCheck,
  HelpCircle,
  Tag,
  BarChart2,
  X
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

interface ServicesManagerProps {
  services: ConsultingService[];
  packages: MembershipPackage[];
  subscriptions: TenantSubscription[];
  bookings: ServiceBooking[];
  customers: Customer[];
  branches: Branch[];
  session: AuthSession | null;
  onSaveService: (service: ConsultingService) => void;
  onDeleteService: (serviceId: string) => void;
  onSavePackage: (pkg: MembershipPackage) => void;
  onSaveSubscription: (sub: TenantSubscription) => void;
  onDeleteSubscription: (subId: string) => void;
  onSaveBooking: (booking: ServiceBooking) => void;
  onOpenBookingModal: (service?: ConsultingService) => void;
  onOpenSubscriptionModal: (sub?: TenantSubscription) => void;
  onGenerateVoucherForServiceBooking: (booking: ServiceBooking) => void;
}

const CATEGORY_MAP: Record<
  ServiceCategory,
  { label: string; labelEn: string; icon: any; color: string; bg: string }
> = {
  ACCOUNTING: {
    label: "محاسبة وضرائب",
    labelEn: "Accounting & Tax",
    icon: Receipt,
    color: "#059669",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  MARKETING: {
    label: "تسويق وحملات",
    labelEn: "Marketing & Growth",
    icon: TrendingUp,
    color: "#2563eb",
    bg: "bg-blue-50 text-blue-700 border-blue-200"
  },
  MEDIA_STUDIO: {
    label: "استوديو وبودكاست",
    labelEn: "Media Studio & Podcast",
    icon: Mic,
    color: "#7c3aed",
    bg: "bg-purple-50 text-purple-700 border-purple-200"
  },
  CONTENT_CREATION: {
    label: "صناعة محتوى ومونتاج",
    labelEn: "Content Creation",
    icon: Video,
    color: "#db2777",
    bg: "bg-pink-50 text-pink-700 border-pink-200"
  },
  SOCIAL_MEDIA: {
    label: "إدارة التواصل الاجتماعي",
    labelEn: "Social Media Management",
    icon: Globe,
    color: "#0891b2",
    bg: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  WEB_DEVELOPMENT: {
    label: "مواقع ومتاجر إلكترونية",
    labelEn: "Web Development",
    icon: ShoppingCart,
    color: "#4f46e5",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  HR_MANAGEMENT: {
    label: "شؤون موظفين وWPS",
    labelEn: "HR & Payroll",
    icon: Users,
    color: "#d97706",
    bg: "bg-amber-50 text-amber-700 border-amber-200"
  },
  BUSINESS_SETUP: {
    label: "تأسيس أعمال وشركات",
    labelEn: "Business Setup",
    icon: Building,
    color: "#0d9488",
    bg: "bg-teal-50 text-teal-700 border-teal-200"
  },
  PRO_SERVICES: {
    label: "خدمات PRO ومعاملات",
    labelEn: "PRO & Gov Relations",
    icon: FileCheck,
    color: "#ea580c",
    bg: "bg-orange-50 text-orange-700 border-orange-200"
  },
  CONSULTING: {
    label: "استشارات إدارية وجدوى",
    labelEn: "Management Advisory",
    icon: Award,
    color: "#6366f1",
    bg: "bg-violet-50 text-violet-700 border-violet-200"
  },
  CUSTOM: {
    label: "خدمات إدارية أخرى",
    labelEn: "Custom Services",
    icon: Briefcase,
    color: "#475569",
    bg: "bg-slate-50 text-slate-700 border-slate-200"
  }
};

const PRICING_MODEL_MAP: Record<PricingModel, string> = {
  FIXED_PRICE: "سعر ثابت / مشروع",
  HOURLY: "بالساعة",
  MONTHLY_RETAINER: "اشتراك شهري",
  PER_CONSULTATION: "لكل جلسة استشارية",
  PER_TRANSACTION: "لكل معاملة / إجراء"
};

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#ea580c"];

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  packages,
  subscriptions,
  bookings,
  customers,
  branches,
  session,
  onSaveService,
  onDeleteService,
  onSavePackage,
  onSaveSubscription,
  onDeleteSubscription,
  onSaveBooking,
  onOpenBookingModal,
  onOpenSubscriptionModal,
  onGenerateVoucherForServiceBooking
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "subscriptions" | "bookings" | "analytics">(
    "catalog"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Service Edit / Add Form Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ConsultingService | null>(null);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = categoryFilter === "ALL" || s.category === categoryFilter;
      const matchSearch =
        searchQuery === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, categoryFilter, searchQuery]);

  // Handle open service form
  const handleOpenAddService = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: ConsultingService) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  // Analytics Metrics
  const analyticsData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    services.forEach((s) => {
      const catLabel = CATEGORY_MAP[s.category]?.label || s.category;
      categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + 1;
    });

    const categoryPie = Object.keys(categoryCounts).map((k) => ({
      name: k,
      value: categoryCounts[k]
    }));

    // Subscriptions quota utilization
    const quotaComparison = subscriptions.map((sub) => ({
      name: sub.customerName.length > 15 ? sub.customerName.substring(0, 15) + "..." : sub.customerName,
      meetingQuota: sub.meetingRoomHoursQuota,
      meetingUsed: sub.meetingRoomHoursUsed,
      consultQuota: sub.consultationSessionsQuota,
      consultUsed: sub.consultationSessionsUsed
    }));

    const totalActiveSubs = subscriptions.filter((s) => s.status === "ACTIVE").length;
    const totalBookings = bookings.length;
    const freeQuotaBookings = bookings.filter((b) => b.isCoveredByMembership).length;
    const paidBookingsRevenue = bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);

    return {
      categoryPie,
      quotaComparison,
      totalActiveSubs,
      totalBookings,
      freeQuotaBookings,
      paidBookingsRevenue
    };
  }, [services, subscriptions, bookings]);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Metrics Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Briefcase className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                نظام إدارة الخدمات الاستشارية وباقات المستأجرين
              </h2>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              إدارة خدمات المحاسبة، التسويق، الاستوديو، المواقع، الـ PRO وتأسيس الأعمال مع تتبع الساعات والاستشارات المجانية لباقات المستأجرين.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onOpenBookingModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              حجز خدمة / استشارة
            </button>
            <button
              onClick={() => onOpenSubscriptionModal()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              اشتراك مستأجر جديد
            </button>
            <button
              onClick={handleOpenAddService}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة خدمة جديدة
            </button>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
            <span className="text-xs text-slate-400 block">إجمالي الخدمات المتاحة</span>
            <span className="text-xl font-bold text-white mt-1 block">{services.length} خدمة</span>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
            <span className="text-xs text-purple-300 block">المستأجرين المشتركين بالباقات</span>
            <span className="text-xl font-bold text-purple-200 mt-1 block">
              {analyticsData.totalActiveSubs} مستأجر نشط
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
            <span className="text-xs text-emerald-300 block">الاستشارات المجانية المستفادة</span>
            <span className="text-xl font-bold text-emerald-200 mt-1 block">
              {analyticsData.freeQuotaBookings} جلسة مغطاة
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
            <span className="text-xs text-blue-300 block">إيرادات الخدمات المحققة</span>
            <span className="text-xl font-bold text-blue-200 mt-1 block">
              {analyticsData.paidBookingsRevenue.toFixed(3)} ر.ع
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "catalog"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          كتالوج الخدمات ({services.length})
        </button>

        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "subscriptions"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          باقات واشتراكات المستأجرين ({subscriptions.length})
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "bookings"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          سجل طلبات وحجوزات الخدمات ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "analytics"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          التحليلات والمؤشرات
        </button>
      </div>

      {/* ---------------- TAB 1: SERVICES CATALOG ---------------- */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في اسم أو كود أو تفاصيل الخدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === "ALL"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                الكل ({services.length})
              </button>
              {Object.keys(CATEGORY_MAP).map((cat) => {
                const info = CATEGORY_MAP[cat as ServiceCategory];
                const count = services.filter((s) => s.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {info.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const catInfo = CATEGORY_MAP[service.category] || CATEGORY_MAP.CUSTOM;
              const IconComp = catInfo.icon || Briefcase;

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${catInfo.bg}`}>
                        <IconComp className="w-3.5 h-3.5" />
                        {catInfo.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {service.includedInTenantPackage && (
                          <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            مشمولة بالباقة
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono font-medium">
                          {service.code}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {service.name}
                      </h3>
                      {service.nameEn && (
                        <p className="text-xs text-slate-400 font-sans mt-0.5">{service.nameEn}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                        {service.shortDescription}
                      </p>
                    </div>

                    {/* Deliverables tags */}
                    {service.deliverables && service.deliverables.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                          المخرجات المعتمدة:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {service.deliverables.slice(0, 3).map((d, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                            >
                              ✓ {d}
                            </span>
                          ))}
                          {service.deliverables.length > 3 && (
                            <span className="text-[10px] text-slate-400 px-1 py-0.5">
                              +{service.deliverables.length - 3} أخرى
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing & Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {PRICING_MODEL_MAP[service.pricingModel] || "السعر"}
                      </span>
                      <span className="text-base font-extrabold text-indigo-700">
                        {service.basePrice.toFixed(3)} {service.currency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenBookingModal(service)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                        title="حجز الخدمة الآن"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        حجز
                      </button>
                      <button
                        onClick={() => handleOpenEditService(service)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="تعديل الخدمة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الخدمة "${service.name}"؟`)) {
                            onDeleteService(service.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="حذف الخدمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">لا توجد خدمات مطابقة</h3>
              <p className="text-xs text-slate-500 mt-1">
                جرب تغيير خيارات البحث أو تصفية الفئات، أو أضف خدمة جديدة الآن.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: TENANT SUBSCRIPTIONS ---------------- */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          
          {/* Packages Showcase */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                باقات المستأجرين المعتمدة (المزايا والحصص الشهرية)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                        {pkg.code}
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {pkg.monthlyFee} {pkg.currency} <span className="text-xs font-normal text-slate-500">/ شهر</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base">{pkg.name}</h4>

                    {/* Quota Highlights */}
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs border border-slate-100">
                      <div className="flex items-center justify-between font-bold text-indigo-700">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          قاعات اجتماعات ومساحات:
                        </span>
                        <span>{pkg.freeMeetingRoomHoursPerMonth} ساعة مجاناً</span>
                      </div>

                      <div className="flex items-center justify-between text-purple-700 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5" />
                          استوديو إعلامي وبودكاست:
                        </span>
                        <span>{pkg.freeMediaStudioHoursPerMonth} ساعات مجاناً</span>
                      </div>

                      <div className="flex items-center justify-between text-emerald-700 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          استشارات استراتيجية:
                        </span>
                        <span>{pkg.freeConsultationSessionsPerMonth} استشارات مجانية</span>
                      </div>

                      <div className="flex items-center justify-between text-blue-700 font-semibold pt-1 border-t border-slate-200">
                        <span>خصم الخدمات الإضافية:</span>
                        <span>{pkg.discountOnExtraServicesPercent}% خصم</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onOpenSubscriptionModal()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      تطبيق الباقة لمستأجر جديد
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Subscriptions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">سجل اشتراكات المستأجرين وتتبع الأرصدة</h3>
              </div>
              <button
                onClick={() => onOpenSubscriptionModal()}
                className="px-3.5 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة اشتراك مستأجر
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">المستأجر / الشركة</th>
                    <th className="p-3.5">الباقة والرسوم</th>
                    <th className="p-3.5">رصيد قاعات الاجتماعات</th>
                    <th className="p-3.5">رصيد الاستوديو الإعلامي</th>
                    <th className="p-3.5">رصيد الاستشارات المجانية</th>
                    <th className="p-3.5">تاريخ التجديد</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map((sub) => {
                    const meetingRem = Math.max(0, sub.meetingRoomHoursQuota - sub.meetingRoomHoursUsed);
                    const meetingPercent = Math.min(100, (sub.meetingRoomHoursUsed / (sub.meetingRoomHoursQuota || 1)) * 100);

                    const studioRem = Math.max(0, sub.mediaStudioHoursQuota - sub.mediaStudioHoursUsed);
                    const consultRem = Math.max(0, sub.consultationSessionsQuota - sub.consultationSessionsUsed);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{sub.customerName}</div>
                          <div className="text-[11px] text-slate-400 font-normal font-mono">{sub.customerPhone}</div>
                        </td>

                        <td className="p-3.5">
                          <span className="font-semibold text-indigo-700 block">{sub.packageName}</span>
                          <span className="text-[11px] text-slate-500 font-bold">
                            {sub.monthlyFee} {sub.currency} / شهر
                          </span>
                        </td>

                        {/* Meeting Room Quota Bar */}
                        <td className="p-3.5 min-w-[160px]">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                            <span>{sub.meetingRoomHoursUsed} / {sub.meetingRoomHoursQuota} س</span>
                            <span className={meetingRem > 0 ? "text-emerald-600" : "text-rose-600"}>
                              (متبقي {meetingRem})
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                meetingPercent > 80 ? "bg-rose-500" : "bg-indigo-600"
                              }`}
                              style={{ width: `${meetingPercent}%` }}
                            />
                          </div>
                        </td>

                        {/* Studio Quota */}
                        <td className="p-3.5">
                          <span className="font-bold text-purple-700">
                            {sub.mediaStudioHoursUsed} / {sub.mediaStudioHoursQuota} س
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            (متبقي {studioRem} س)
                          </span>
                        </td>

                        {/* Consultations Quota */}
                        <td className="p-3.5">
                          <span className="font-bold text-emerald-700">
                            {sub.consultationSessionsUsed} / {sub.consultationSessionsQuota} جلسة
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            (متبقي {consultRem} جلسة)
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-slate-600">
                          {sub.endDate}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              sub.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : sub.status === "EXPIRED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {sub.status === "ACTIVE" ? "نشط" : sub.status === "EXPIRED" ? "منتهي" : "موقوف"}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenSubscriptionModal(sub)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="تعديل الاشتراك والرصيد"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف اشتراك "${sub.customerName}"؟`)) {
                                  onDeleteSubscription(sub.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف الاشتراك"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ---------------- TAB 3: SERVICE BOOKINGS ---------------- */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">سجل طلبات الخدمات والاستشارات الاستراتيجية</h3>
              </div>
              <button
                onClick={() => onOpenBookingModal()}
                className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                حجز جديد
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">رقم الحجز</th>
                    <th className="p-3.5">الخدمة المطلوبة</th>
                    <th className="p-3.5">العميل / المستأجر</th>
                    <th className="p-3.5">الموعد والتوقيت</th>
                    <th className="p-3.5">نوع التقديم</th>
                    <th className="p-3.5">القيمة / التغطية</th>
                    <th className="p-3.5">حالة الطلب</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => {
                    const catInfo = CATEGORY_MAP[b.category] || CATEGORY_MAP.CUSTOM;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {b.bookingNumber}
                        </td>

                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{b.serviceName}</span>
                          <span className="text-[10px] text-indigo-600 font-semibold">
                            {catInfo.label}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{b.customerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{b.customerPhone}</div>
                        </td>

                        <td className="p-3.5 font-mono text-slate-700">
                          <div>{b.preferredDate}</div>
                          <div className="text-[11px] text-slate-400">{b.preferredTime} ({b.duration})</div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {b.consultationType === "IN_PERSON"
                              ? "حضورياً بالمركز"
                              : b.consultationType === "ONLINE_MEETING"
                              ? "أونلاين (Google Meet)"
                              : b.consultationType === "OFFICE_VISIT"
                              ? "زيارة ميدانية"
                              : "تقرير ومخرجات"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {b.isCoveredByMembership ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block text-[11px]">
                              ✓ رصيد استشارة مجانية
                            </span>
                          ) : (
                            <span className="font-extrabold text-indigo-700">
                              {b.finalAmount.toFixed(3)} {b.currency}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              b.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-800"
                                : b.status === "IN_PROGRESS"
                                ? "bg-purple-100 text-purple-800"
                                : b.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.status === "CONFIRMED"
                              ? "مؤكد"
                              : b.status === "COMPLETED"
                              ? "مكتمل"
                              : b.status === "IN_PROGRESS"
                              ? "قيد التنفيذ"
                              : b.status === "CANCELLED"
                              ? "ملغي"
                              : "جديد"}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {b.finalAmount > 0 && !b.linkedVoucherId && (
                              <button
                                onClick={() => onGenerateVoucherForServiceBooking(b)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-md text-[11px] font-bold transition-colors flex items-center gap-1"
                                title="إصدار سند قبض وفاتورة رسمية"
                              >
                                <Receipt className="w-3 h-3" />
                                إصدار سند
                              </button>
                            )}

                            {b.status !== "COMPLETED" && (
                              <button
                                onClick={() =>
                                  onSaveBooking({
                                    ...b,
                                    status: "COMPLETED",
                                    updatedAt: new Date().toISOString()
                                  })
                                }
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md text-[11px] font-bold transition-colors"
                                title="تحديد كمكتمل"
                              >
                                إتمام
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 4: ANALYTICS ---------------- */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Services Categories Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                توزيع الخدمات حسب القطاعات الاستشارية والإدارية
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={analyticsData.categoryPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analyticsData.categoryPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Tenant Quota Utilization */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                استهلاك المستأجرين لساعات قاعات الاجتماعات (ساعات مستخدمة مقابل الحصة)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.quotaComparison}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="meetingQuota" name="الحصة المعتمدة" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meetingUsed" name="الساعات المستغلة" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- EDIT / ADD SERVICE MODAL ---------------- */}
      {isServiceModalOpen && (
        <ServiceFormModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          service={editingService}
          onSave={(srv) => {
            onSaveService(srv);
            setIsServiceModalOpen(false);
          }}
        />
      )}

    </div>
  );
};

// ----------------------------------------------------
// SUB-COMPONENT: SERVICE ADD/EDIT MODAL
// ----------------------------------------------------

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ConsultingService | null;
  onSave: (service: ConsultingService) => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  service,
  onSave
}) => {
  const [code, setCode] = useState<string>(service?.code || `SRV-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState<string>(service?.name || "");
  const [nameEn, setNameEn] = useState<string>(service?.nameEn || "");
  const [category, setCategory] = useState<ServiceCategory>(service?.category || "ACCOUNTING");
  const [shortDescription, setShortDescription] = useState<string>(service?.shortDescription || "");
  const [fullDescription, setFullDescription] = useState<string>(service?.fullDescription || "");
  const [pricingModel, setPricingModel] = useState<PricingModel>(service?.pricingModel || "FIXED_PRICE");
  const [basePrice, setBasePrice] = useState<number>(service?.basePrice || 50);
  const [currency, setCurrency] = useState<string>(service?.currency || "OMR");
  const [estimatedDuration, setEstimatedDuration] = useState<string>(service?.estimatedDuration || "جلسة 60 دقيقة");
  const [deliveryTime, setDeliveryTime] = useState<string>(service?.deliveryTime || "خلال 48 ساعة");
  const [deliverablesText, setDeliverablesText] = useState<string>(
    service?.deliverables?.join("\n") || "مخرجات الخدمة والتقرير المعتمد"
  );
  const [includedInTenantPackage, setIncludedInTenantPackage] = useState<boolean>(
    service ? service.includedInTenantPackage : true
  );
  const [status, setStatus] = useState<ServiceStatus>(service?.status || "ACTIVE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortDescription.trim()) return;

    const deliverables = deliverablesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const saved: ConsultingService = {
      id: service?.id || `srv-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      category: category,
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim() || undefined,
      pricingModel: pricingModel,
      basePrice: Number(basePrice),
      currency: currency,
      estimatedDuration: estimatedDuration.trim() || undefined,
      deliveryTime: deliveryTime.trim() || undefined,
      deliverables: deliverables,
      includedInTenantPackage: includedInTenantPackage,
      icon: "Briefcase",
      color: "#4f46e5",
      status: status,
      createdAt: service?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-l from-indigo-700 to-blue-600 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold">
            {service ? "تعديل الخدمة الاستشارية / الإدارية" : "إضافة خدمة استشارية وإدارية جديدة"}
          </h3>
          <p className="text-xs text-indigo-100 mt-0.5">
            إعداد تفاصيل الخدمة، التسعير، ومخرجات التسليم وإمكانية شمولها في باقات المستأجرين
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود الخدمة</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">تصنيف الخدمة *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white font-medium"
              >
                {Object.keys(CATEGORY_MAP).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_MAP[cat as ServiceCategory].label} ({CATEGORY_MAP[cat as ServiceCategory].labelEn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الخدمة بالعربية *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مسك الدفاتر المحاسبية"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الخدمة بالإنجليزية (اختياري)</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Bookkeeping & Accounts"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">وصف مختصر للخدمة *</label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="ملخص يوضح الفائدة المباشرة للعميل..."
              rows={2}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
              required
            />
          </div>

          {/* Pricing Model & Price */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نموذج التسعير</label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value as PricingModel)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
              >
                {Object.keys(PRICING_MODEL_MAP).map((pm) => (
                  <option key={pm} value={pm}>
                    {PRICING_MODEL_MAP[pm as PricingModel]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">السعر الأساسي (ر.ع)</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المدة المقدرة</label>
              <input
                type="text"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="مثال: جلسة 60 دقيقة"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              مخرجات الخدمة المعتمدة (اكتب كل بند في سطر مستقل)
            </label>
            <textarea
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              rows={3}
              placeholder="قائمة الدخل&#10;الميزانية العمومية&#10;تقرير التدفقات"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-sans"
            />
          </div>

          {/* Tenant Package Eligibility */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-emerald-900 block">
                مشمولة كاستشارة مجانية في باقات المستأجرين
              </span>
              <span className="text-[11px] text-emerald-700">
                يمكن للمستأجرين الاستفادة من رصيد استشاراتهم الشهرية المجانية لحجز هذه الخدمة
              </span>
            </div>
            <input
              type="checkbox"
              checked={includedInTenantPackage}
              onChange={(e) => setIncludedInTenantPackage(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors"
            >
              حفظ الخدمة
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
