import React, { useState, useMemo } from "react";
import {
  ConsultingService,
  RentalSpace,
  SpaceBooking,
  ServiceBooking,
  TenantSubscription,
  MembershipPackage,
  Customer,
  Branch,
  ServiceCategory
} from "../types";
import {
  Briefcase,
  Layers,
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  Users,
  Mic,
  Tv,
  Wifi,
  Coffee,
  HelpCircle,
  Share2,
  ChevronRight,
  ShieldCheck,
  Award,
  DollarSign
} from "lucide-react";

interface ClientBookingPortalProps {
  services: ConsultingService[];
  spaces: RentalSpace[];
  subscriptions: TenantSubscription[];
  customers: Customer[];
  branches: Branch[];
  packages?: MembershipPackage[];
  onBookService: (service: ConsultingService) => void;
  onBookSpace: (space: RentalSpace) => void;
  onNavigateTab?: (tab: any) => void;
}

const CATEGORY_MAP: Record<ServiceCategory, { label: string; icon: string }> = {
  ACCOUNTING: { label: "خدمات محاسبية وضرائب", icon: "Receipt" },
  MARKETING: { label: "تسويق وإعلانات", icon: "TrendingUp" },
  MEDIA_STUDIO: { label: "استوديو وبودكاست", icon: "Mic" },
  CONTENT_CREATION: { label: "صناعة محتوى وفيديو", icon: "Video" },
  SOCIAL_MEDIA: { label: "إدارة حسابات التواصل", icon: "Globe" },
  WEB_DEVELOPMENT: { label: "مواقع ومتاجر إلكترونية", icon: "ShoppingCart" },
  HR_MANAGEMENT: { label: "شؤون موظفين وWPS", icon: "Users" },
  BUSINESS_SETUP: { label: "تأسيس أعمال وشركات", icon: "Building" },
  PRO_SERVICES: { label: "خدمات PRO ومعاملات", icon: "FileCheck" },
  CONSULTING: { label: "استشارات إدارية ودراسات", icon: "Award" },
  CUSTOM: { label: "خدمات إدارية مساندة", icon: "Briefcase" }
};

export const ClientBookingPortal: React.FC<ClientBookingPortalProps> = ({
  services,
  spaces,
  subscriptions,
  customers,
  branches,
  onBookService,
  onBookSpace
}) => {
  const [bookingMode, setBookingMode] = useState<"SERVICES" | "SPACES">("SERVICES");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Tenant / Client Identification
  const [tenantLookupPhone, setTenantLookupPhone] = useState<string>("");
  const [identifiedSubscription, setIdentifiedSubscription] = useState<TenantSubscription | null>(null);

  // Check tenant by phone
  const handleTenantLookup = (phone: string) => {
    setTenantLookupPhone(phone);
    if (!phone.trim()) {
      setIdentifiedSubscription(null);
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const found = subscriptions.find(
      (s) => s.customerPhone.replace(/\D/g, "").includes(cleanPhone) || s.customerName.toLowerCase().includes(phone.toLowerCase())
    );
    setIdentifiedSubscription(found || null);
  };

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (s.status !== "ACTIVE" && s.status !== "POPULAR") return false;
      const matchCat = selectedCategory === "ALL" || s.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  // Filtered Spaces
  const filteredSpaces = useMemo(() => {
    return spaces.filter((sp) => {
      const matchSearch =
        searchQuery === "" ||
        sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sp.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [spaces, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Hero Banner with Smart Tenant Quota Recognition */}
      <div className="bg-gradient-to-l from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-white/10 text-indigo-200 text-xs font-bold rounded-full border border-white/15 inline-flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                البوابة الذكية لخدمات ومساحات الأعمال
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                احجز استشاراتك، خدماتك الإدارية، وقاعات الاجتماعات
              </h1>
              <p className="text-sm text-indigo-100 mt-1.5 max-w-2xl leading-relaxed">
                مرحباً بك في منظومة خدمات الأعمال المتكاملة. يمكنك حجز استشارات المحاسبة والتسويق وتأسيس الشركات، أو حجز القاعات والاستوديو مستفيداً من رصيدك المجاني المتاح في باقتك.
              </p>
            </div>

            {/* Quick Mode Toggle */}
            <div className="bg-white/10 p-1.5 rounded-2xl border border-white/20 flex items-center shrink-0 self-start md:self-auto">
              <button
                onClick={() => setBookingMode("SERVICES")}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                  bookingMode === "SERVICES"
                    ? "bg-white text-indigo-900 shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                الخدمات والاستشارات
              </button>
              <button
                onClick={() => setBookingMode("SPACES")}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                  bookingMode === "SPACES"
                    ? "bg-white text-indigo-900 shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                القاعات والاستوديو
              </button>
            </div>
          </div>

          {/* Tenant Subscription Lookup Box */}
          <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <User className="w-4 h-4 text-indigo-300 shrink-0" />
              <input
                type="text"
                placeholder="أدخل رقم هاتفك أو اسمك للتحقق من باقة الساعات المجانية..."
                value={tenantLookupPhone}
                onChange={(e) => handleTenantLookup(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs placeholder:text-indigo-200 text-white focus:outline-none focus:bg-white/20"
              />
            </div>

            {identifiedSubscription ? (
              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-2 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-200">
                    مرحباً {identifiedSubscription.customerName} ({identifiedSubscription.packageName})
                  </div>
                  <div className="text-emerald-100 text-[11px] mt-0.5">
                    الرصيد المتبقي: <strong>{Math.max(0, identifiedSubscription.meetingRoomHoursQuota - identifiedSubscription.meetingRoomHoursUsed)}</strong> س قاعات | <strong>{Math.max(0, identifiedSubscription.consultationSessionsQuota - identifiedSubscription.consultationSessionsUsed)}</strong> استشارات مجانية
                  </div>
                </div>
              </div>
            ) : tenantLookupPhone.trim() ? (
              <span className="text-xs text-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                لم يتم العثور على باقة نشطة - سيتم تطبيق الأسعار القياسية
              </span>
            ) : (
              <span className="text-xs text-indigo-200">
                💡 هل أنت مستأجر في المركز؟ أدخل رقمك للتمتع بساعات واستشارات مجانية
              </span>
            )}
          </div>

        </div>
      </div>

      {/* ---------------- SECTION 1: SERVICES BOOKING ---------------- */}
      {bookingMode === "SERVICES" && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في الخدمات والاستشارات المتوفرة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                جميع الخدمات ({services.length})
              </button>
              {Object.keys(CATEGORY_MAP).map((cat) => {
                const count = services.filter((s) => s.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {CATEGORY_MAP[cat as ServiceCategory].label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => {
              const hasFreeConsultationQuota =
                identifiedSubscription &&
                service.includedInTenantPackage &&
                Math.max(0, identifiedSubscription.consultationSessionsQuota - identifiedSubscription.consultationSessionsUsed) > 0;

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                        {CATEGORY_MAP[service.category]?.label || service.category}
                      </span>

                      {service.includedInTenantPackage && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          مشمول بالباقات
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {service.shortDescription}
                      </p>
                    </div>

                    {/* Deliverables preview */}
                    {service.deliverables && service.deliverables.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <span className="text-[11px] font-bold text-slate-500 block">ماذا تشمل الخدمة:</span>
                        {service.deliverables.slice(0, 2).map((d, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing & Booking Button */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {hasFreeConsultationQuota ? (
                        <div>
                          <span className="text-[10px] text-emerald-700 font-bold block">مغطاة برصيد باقتك</span>
                          <span className="text-base font-extrabold text-emerald-600">
                            0.000 ر.ع <span className="text-xs line-through text-slate-400">{service.basePrice} ر.ع</span>
                          </span>
                        </div>
                      ) : identifiedSubscription?.discountOnExtraServicesPercent ? (
                        <div>
                          <span className="text-[10px] text-indigo-700 font-bold block">
                            خصم المشترك ({identifiedSubscription.discountOnExtraServicesPercent}%)
                          </span>
                          <span className="text-base font-extrabold text-indigo-700">
                            {(service.basePrice * (1 - identifiedSubscription.discountOnExtraServicesPercent / 100)).toFixed(3)} {service.currency}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-400 block">القيمة الأساسية</span>
                          <span className="text-base font-extrabold text-slate-900">
                            {service.basePrice.toFixed(3)} {service.currency}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onBookService(service)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                        hasFreeConsultationQuota
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {hasFreeConsultationQuota ? "احجز بالرصيد المجاني" : "احجز الآن"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: SPACES & MEETING ROOMS BOOKING ---------------- */}
      {bookingMode === "SPACES" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpaces.map((space) => {
              const remainingFreeMeetingHours = identifiedSubscription
                ? Math.max(0, identifiedSubscription.meetingRoomHoursQuota - identifiedSubscription.meetingRoomHoursUsed)
                : 0;

              return (
                <div
                  key={space.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Space Image / Header */}
                    <div className="h-44 relative bg-slate-100 overflow-hidden">
                      {space.images && space.images[0] ? (
                        <img
                          src={space.images[0]}
                          alt={space.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                          <Layers className="w-12 h-12" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        {space.type === "MEETING_ROOM"
                          ? "قاعة اجتماعات"
                          : space.type === "CONFERENCE_HALL"
                          ? "قاعة مؤتمرات"
                          : space.type === "MEDIA_STUDIO"
                          ? "استوديو إعلامي وبودكاست"
                          : "مكتب خاص"}
                      </div>

                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        سعة {space.capacity} شخص
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {space.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {space.description}
                      </p>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        {space.amenities?.map((amenity, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            ✓ {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Booking */}
                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {remainingFreeMeetingHours > 0 ? (
                          <div>
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              مغطى بالساعات المجانية
                            </span>
                            <span className="text-base font-extrabold text-emerald-600">
                              0.000 ر.ع / س <span className="text-xs line-through text-slate-400">{space.hourlyRate} ر.ع</span>
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] text-slate-400 block">السعر بالساعة</span>
                            <span className="text-base font-extrabold text-indigo-700">
                              {space.hourlyRate.toFixed(3)} ر.ع
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onBookSpace(space)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                          remainingFreeMeetingHours > 0
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {remainingFreeMeetingHours > 0 ? "احجز بالساعات المجانية" : "احجز القاعة"}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
