import {
  RentalSpace,
  SpaceBooking,
  ConsultingService,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
  ContractClause,
  LeaseContract
} from "../../types";

const SPACES_STORAGE_KEY = "rv_studio_rental_spaces";
const BOOKINGS_STORAGE_KEY = "rv_studio_space_bookings";
const SERVICES_STORAGE_KEY = "rv_studio_consulting_services";
const MEMBERSHIPS_STORAGE_KEY = "rv_studio_membership_packages";
const SUBSCRIPTIONS_STORAGE_KEY = "rv_studio_tenant_subscriptions";
const SERVICE_BOOKINGS_STORAGE_KEY = "rv_studio_service_bookings";
const CONTRACTS_STORAGE_KEY = "rv_studio_lease_contracts";

export const DEFAULT_RENTAL_SPACES: RentalSpace[] = [
  {
    id: "space-1",
    code: "HALL-101",
    name: "قاعة الابتكار والتدريب الكبرى",
    nameEn: "Grand Innovation & Training Hall",
    type: "TRAINING_HALL",
    branchId: "branch-1",
    branchName: "الفرع الرئيسي - مسقط",
    capacity: 45,
    floorLocation: "الطابق الأول - الجناح الشرقي",
    hourlyRate: 18,
    dailyRate: 120,
    monthlyRate: 1800,
    currency: "OMR",
    minBookingHours: 2,
    amenities: ["wifi", "smart_screen", "projector", "coffee", "sound", "whiteboard", "mic", "podium"],
    images: ["https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800"],
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
    status: "AVAILABLE",
    color: "#6366f1",
    description: "قاعة مجهزة بأحدث تقنيات العرض والشاشات الذكية ونظام صوتي لاسلكي مثالية للدورات التدريبية والمحاضرات.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "space-2",
    code: "MEET-201",
    name: "قاعة الاجتماعات التنفيذية VIP",
    nameEn: "Executive VIP Boardroom",
    type: "MEETING_ROOM",
    branchId: "branch-1",
    branchName: "الفرع الرئيسي - مسقط",
    capacity: 14,
    floorLocation: "الطابق الثاني - غرفة 204",
    hourlyRate: 12,
    dailyRate: 75,
    monthlyRate: 1100,
    currency: "OMR",
    minBookingHours: 1,
    amenities: ["wifi", "smart_screen", "coffee", "sound", "whiteboard", "ac"],
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"],
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    status: "AVAILABLE",
    color: "#0ea5e9",
    description: "طاولة اجتماعات فاخرة مجهزة بـ Video Conference وشاشة تفاعلية 75 بوصة مع ضيافة قهوة وشاي مميزة.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "space-3",
    code: "OFFICE-301",
    name: "مكتب خاص مجهز لرواد الأعمال",
    nameEn: "Private Executive Office",
    type: "PRIVATE_OFFICE",
    branchId: "branch-1",
    branchName: "الفرع الرئيسي - مسقط",
    capacity: 4,
    floorLocation: "الطابق الثالث - مكتب 301",
    hourlyRate: 8,
    dailyRate: 45,
    monthlyRate: 450,
    currency: "OMR",
    minBookingHours: 1,
    amenities: ["wifi", "coffee", "ac", "printer", "private_key"],
    images: ["https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800"],
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800",
    status: "AVAILABLE",
    color: "#10b981",
    description: "مكتب تنفيذي مؤثث بالكامل هادئ ومريح للمدراء والاستشاريين مع مدخل خاص وإنترنت فائق السرعة.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "space-4",
    code: "DESK-F1",
    name: "مساحة عمل مشتركة مرنة (Hot Desk)",
    nameEn: "Flex Coworking Hot Desk",
    type: "COWORKING_DESK",
    branchId: "branch-1",
    branchName: "الفرع الرئيسي - مسقط",
    capacity: 1,
    floorLocation: "الصالات المفتوحة - الطابق الأرضي",
    hourlyRate: 3,
    dailyRate: 15,
    monthlyRate: 95,
    currency: "OMR",
    minBookingHours: 1,
    amenities: ["wifi", "coffee", "power_outlet"],
    images: ["https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800"],
    imageUrl: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800",
    status: "AVAILABLE",
    color: "#f59e0b",
    description: "مكتب عمل فردي في بيئة أعمال حيوية ومحفزة للإنتاجية مع وصول غير محدود لبار القهوة والإنترنت.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "space-5",
    code: "EVENT-GROUND",
    name: "مساحة الفعاليات والملتقيات المفتوحة",
    nameEn: "Open Multi-Purpose Event Space",
    type: "EVENT_SPACE",
    branchId: "branch-2",
    branchName: "فرع صلالة - مجمع الأعمال",
    capacity: 100,
    floorLocation: "البهو الرئيسي - الطابق الأرضي",
    hourlyRate: 35,
    dailyRate: 250,
    monthlyRate: 3200,
    currency: "OMR",
    minBookingHours: 3,
    amenities: ["wifi", "projector", "sound", "mic", "podium", "coffee", "lighting"],
    images: ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=800"],
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
    status: "AVAILABLE",
    color: "#ec4899",
    description: "مساحة واسعة متعددة الاستخدامات لإقامة المعارض، الهاكاثونات، إطلاق المنتجات والملتقيات الحوارية.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_SPACE_BOOKINGS: SpaceBooking[] = [];

export function loadRentalSpaces(): RentalSpace[] {
  try {
    const raw = localStorage.getItem(SPACES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load rental spaces:", e);
  }
  saveRentalSpaces(DEFAULT_RENTAL_SPACES);
  return DEFAULT_RENTAL_SPACES;
}

export function saveRentalSpaces(spaces: RentalSpace[]): void {
  try {
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));
  } catch (e) {
    console.error("Failed to save rental spaces:", e);
  }
}

export function loadSpaceBookings(): SpaceBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load space bookings:", e);
  }
  saveSpaceBookings(DEFAULT_SPACE_BOOKINGS);
  return DEFAULT_SPACE_BOOKINGS;
}

export function saveSpaceBookings(bookings: SpaceBooking[]): void {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error("Failed to save space bookings:", e);
  }
}

export const DEFAULT_CONSULTING_SERVICES: ConsultingService[] = [
  {
    id: "srv-acc-01",
    code: "SRV-ACC-01",
    name: "مسك الدفاتر المحاسبية وإعداد القوائم المالية",
    nameEn: "Bookkeeping & Financial Statements Preparation",
    category: "ACCOUNTING",
    shortDescription: "تسجيل العمليات اليومية، ميزان المراجعة، قائمة الدخل والمركز المالي وفق المعايير الدولية IFRS.",
    fullDescription: "خدمة محاسبية احترافية تشمل تسجيل القيود، مطابقة كشوف الحسابات البنكية، ضبط الأصول والإهلاك، وإصدار تقارير الأداء المالي الشهرية والسنوية.",
    pricingModel: "MONTHLY_RETAINER",
    basePrice: 150,
    currency: "OMR",
    estimatedDuration: "شهري مستمر",
    deliveryTime: "تقارير شهرية قبل يوم 5 من كل شهر",
    deliverables: ["ميزان المراجعة الشهري", "قائمة الأرباح والخسائر", "الميزانية العمومية", "تقرير التدفقات النقدية"],
    requirements: ["فواتير المبيعات والمشتريات", "كشوف الحسابات البنكية", "سجل الأصول"],
    includedInTenantPackage: true,
    icon: "Calculator",
    color: "#059669",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-acc-02",
    code: "SRV-ACC-02",
    name: "إعداد وتقديم إقرارات ضريبة القيمة المضافة (VAT)",
    nameEn: "VAT Return Filing & Tax Advisory",
    category: "ACCOUNTING",
    shortDescription: "حساب ضريبة المدخلات والمخرجات، مراجعة الفواتير الضريبية وتقديم الإقرار لجهاز الضرائب العماني.",
    pricingModel: "PER_TRANSACTION",
    basePrice: 45,
    currency: "OMR",
    estimatedDuration: "إقرار ربع سنوي",
    deliveryTime: "خلال 48 ساعة من اكتمال المستندات",
    deliverables: ["ملف احتساب الضريبة المعتمد", "إيصال التقديم لجهاز الضرائب", "تقرير فحص الامتثال الضريبي"],
    requirements: ["فواتير ضريبة المخرجات", "فواتير المشتريات الضريبية"],
    includedInTenantPackage: true,
    icon: "Receipt",
    color: "#10b981",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_MEMBERSHIP_PACKAGES: MembershipPackage[] = [
  {
    id: "pkg-startup-tenant",
    code: "PKG-STARTUP",
    name: "باقة رواد الأعمال والمستأجرين الأساسية",
    nameEn: "Startup & Tenant Starter Membership",
    tier: "STARTUP",
    monthlyFee: 95,
    currency: "OMR",
    freeMeetingRoomHoursPerMonth: 20,
    freeMediaStudioHoursPerMonth: 2,
    freeConsultationSessionsPerMonth: 2,
    discountOnExtraServicesPercent: 15,
    features: [
      "20 ساعة مجانية شهرياً لقاعات الاجتماعات ومساحات العمل",
      "ساعتان مجانيتان في استوديو التسجيل الإعلامي والبودكاست",
      "جلستان استشاريتان مجانيتان شهرياً (محاسبة، تسويق، أو PRO)",
      "خصم 15% على كافة الخدمات الإضافية وتطوير المواقع",
      "إنترنت فائق السرعة واستقبال ضيافة مجاني للشاي والقهوة",
      "أولوية الحجز عبر المنصة الذكية"
    ],
    color: "#0284c7",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_TENANT_SUBSCRIPTIONS: TenantSubscription[] = [];
export const DEFAULT_SERVICE_BOOKINGS: ServiceBooking[] = [];

export function loadConsultingServices(): ConsultingService[] {
  try {
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load consulting services:", e);
  }
  saveConsultingServices(DEFAULT_CONSULTING_SERVICES);
  return DEFAULT_CONSULTING_SERVICES;
}

export function saveConsultingServices(services: ConsultingService[]): void {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  } catch (e) {
    console.error("Failed to save consulting services:", e);
  }
}

export function loadMembershipPackages(): MembershipPackage[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load membership packages:", e);
  }
  saveMembershipPackages(DEFAULT_MEMBERSHIP_PACKAGES);
  return DEFAULT_MEMBERSHIP_PACKAGES;
}

export function saveMembershipPackages(packages: MembershipPackage[]): void {
  try {
    localStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error("Failed to save membership packages:", e);
  }
}

export function loadTenantSubscriptions(): TenantSubscription[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load tenant subscriptions:", e);
  }
  saveTenantSubscriptions(DEFAULT_TENANT_SUBSCRIPTIONS);
  return DEFAULT_TENANT_SUBSCRIPTIONS;
}

export function saveTenantSubscriptions(subscriptions: TenantSubscription[]): void {
  try {
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error("Failed to save tenant subscriptions:", e);
  }
}

export function loadServiceBookings(): ServiceBooking[] {
  try {
    const raw = localStorage.getItem(SERVICE_BOOKINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load service bookings:", e);
  }
  saveServiceBookings(DEFAULT_SERVICE_BOOKINGS);
  return DEFAULT_SERVICE_BOOKINGS;
}

export function saveServiceBookings(bookings: ServiceBooking[]): void {
  try {
    localStorage.setItem(SERVICE_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error("Failed to save service bookings:", e);
  }
}

export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: "cl-1",
    titleAr: "البند الأول: الغرض من الاستخدام والعين المؤجرة",
    titleEn: "Clause 1: Permitted Use & Leased Premises",
    contentAr: "يقر المستأجر بأنه عاين الوحدة والمساحة المؤجرة وملحقاتها المعاينة النافية للجهالة شرعاً وقانوناً وتسلمها بحالة ممتازة وصالحة للغرض المخصص لها كأنشطة تجارية ومهنية وإدارية نظامية، ويتعهد بعدم استخدامها في أي غرض يخالف النظام والآداب العامة أو القوانين المعمول بها في سلطنة عمان.",
    contentEn: "The Lessee acknowledges inspection of the leased premises and its fixtures, accepting it in prime operational condition for commercial and professional business purposes.",
    isMandatory: true,
    order: 1
  }
];

export const DEFAULT_LEASE_CONTRACTS: LeaseContract[] = [];

export function loadLeaseContracts(): LeaseContract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load lease contracts:", e);
  }
  saveLeaseContracts(DEFAULT_LEASE_CONTRACTS);
  return DEFAULT_LEASE_CONTRACTS;
}

export function saveLeaseContracts(contracts: LeaseContract[]): void {
  try {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.error("Failed to save lease contracts:", e);
  }
}
