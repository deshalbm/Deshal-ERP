import { PaymentMethod } from './common';

export type SpaceType = 
  | 'TRAINING_HALL'    // قاعة تدريب وتأهيل
  | 'MEETING_ROOM'     // قاعة اجتماعات ومؤتمرات
  | 'PRIVATE_OFFICE'   // مكتب تنفيذي خاص
  | 'COWORKING_DESK'   // مساحة عمل مشتركة
  | 'EVENT_SPACE';     // مساحة فعاليات وورش كبرى

export type RentalType = 'HOURLY' | 'DAILY' | 'MONTHLY';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
export type BookingPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface SpaceAmenity {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
}

export interface RentalSpace {
  id: string;
  code: string; // e.g. "HALL-101", "MEET-A", "OFFICE-302"
  name: string;
  nameEn?: string;
  type: SpaceType;
  branchId: string;
  branchName: string;
  capacity: number; // e.g. 30 persons
  floorLocation?: string; // e.g. "الطابق الثاني - الجناح الشرقي"
  
  // Pricing Model
  hourlyRate: number;   // e.g. 15 OMR / hr
  dailyRate: number;    // e.g. 80 OMR / day
  monthlyRate: number;  // e.g. 350 OMR / month
  currency: string;     // e.g. "OMR"
  
  minBookingHours?: number; // default 1
  amenities: string[];      // e.g. ["wifi", "smart_screen", "projector", "coffee", "sound", "whiteboard", "mic"]
  images: string[];
  imageUrl?: string;
  
  status: 'AVAILABLE' | 'MAINTENANCE' | 'BOOKED';
  color?: string;           // Calendar / badge color
  description?: string;
  descriptionEn?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SpaceBooking {
  id: string;
  bookingNumber: string; // e.g. "BK-2026-0001"
  
  // Target Space
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
  branchId: string;
  branchName: string;
  
  // Client Details
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCompany?: string;
  
  // Reservation Period
  rentalType: RentalType;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (e.g. 09:00)
  endDate: string; // YYYY-MM-DD
  endTime?: string; // HH:mm (e.g. 13:00)
  duration: number; // hours, days, or months count
  
  // Financials
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  
  // Operational details
  attendeesCount?: number;
  purpose: string; // e.g. "دورة تدريبية في التسويق الرقمي"
  selectedAmenities?: string[];
  hospitalityNotes?: string;
  
  // Workflow & Status
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  paymentMethod?: PaymentMethod;
  
  // Linked Accounting Voucher
  linkedVoucherId?: string;
  linkedVoucherNumber?: string;
  
  createdByType: 'CLIENT_SELF_SERVICE' | 'STAFF' | 'ADMIN';
  createdByName?: string;
  internalNotes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// CONSULTING & ADMINISTRATIVE SERVICES & MEMBERSHIPS TYPES
// (الخدمات الاستشارية والإدارية وباقات المستأجرين)
// ----------------------------------------------------

export type ServiceCategory =
  | 'ACCOUNTING'         // خدمات محاسبية ومالية وضريبية
  | 'MARKETING'          // خدمات التسويق الرقمي والحملات
  | 'MEDIA_STUDIO'       // استوديو إعلامي وتصوير وبودكاست
  | 'CONTENT_CREATION'   // صناعة المحتوى والكتابة والمونتاج
  | 'SOCIAL_MEDIA'       // إدارة حسابات التواصل الاجتماعي
  | 'WEB_DEVELOPMENT'    // إنشاء المواقع والمتاجر الإلكترونية
  | 'HR_MANAGEMENT'      // شؤون الموظفين والموارد البشرية وWPS
  | 'BUSINESS_SETUP'     // تأسيس الأعمال والشركات والاستثمار
  | 'PRO_SERVICES'       // خدمات الـ PRO ومتابعة المعاملات الحكومية
  | 'CONSULTING'         // استشارات إدارية واستراتيجية ودراسات جدوى
  | 'CUSTOM';            // خدمات مساندة أخرى

export type PricingModel =
  | 'FIXED_PRICE'            // سعر ثابت للخدمة أو المشروع
  | 'HOURLY'                 // بالساعة
  | 'MONTHLY_RETAINER'       // اشتراك شهري متجدد
  | 'PER_CONSULTATION'       // لكل جلسة استشارية
  | 'PER_TRANSACTION';       // لكل معاملة / إجراء

export type ServiceStatus = 'ACTIVE' | 'ARCHIVED' | 'POPULAR';

export interface ConsultingService {
  id: string;
  code: string;               // e.g. "SRV-ACC-01", "SRV-MKT-02", "SRV-PRO-01"
  name: string;               // Service Name in Arabic
  nameEn?: string;            // Service Name in English
  category: ServiceCategory;  // Category
  shortDescription: string;   // Short summary
  fullDescription?: string;   // Detailed breakdown
  pricingModel: PricingModel;
  basePrice: number;          // Base price in OMR
  currency: string;           // default "OMR"
  estimatedDuration?: string; // e.g. "جلسة 60 دقيقة", "3 إلى 5 أيام عمل", "شهري مستمر"
  deliveryTime?: string;      // SLA / turnaround
  deliverables: string[];     // مخرجات الخدمة
  requirements?: string[];    // متطلبات تنفيذ الخدمة
  includedInTenantPackage: boolean; // هل الخدمة مؤهلة كاستشارة مجانية في باقات المستأجرين
  icon: string;               // Lucide icon name
  color: string;              // UI Badge color
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export type MembershipTier = 'BASIC' | 'STARTUP' | 'PRO' | 'ENTERPRISE' | 'TENANT_VIP';

export interface MembershipPackage {
  id: string;
  code: string;               // e.g. "PKG-STARTUP-20", "PKG-VIP-TENANT"
  name: string;               // e.g. "باقة رواد الأعمال والمستأجرين"
  nameEn?: string;
  tier: MembershipTier;
  monthlyFee: number;         // Monthly subscription price
  currency: string;           // "OMR"
  freeMeetingRoomHoursPerMonth: number; // e.g. 20 hours/month for meeting rooms
  freeMediaStudioHoursPerMonth: number; // e.g. 2-4 hours/month for studio
  freeConsultationSessionsPerMonth: number; // e.g. 2-3 free sessions/month
  discountOnExtraServicesPercent: number; // e.g. 15% discount on extra services
  features: string[];
  color: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  subscriptionNumber: string; // e.g. "SUB-2026-001"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  companyName?: string;
  packageId: string;
  packageName: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  
  // Quota Balances for Current Billing Cycle
  meetingRoomHoursQuota: number;
  meetingRoomHoursUsed: number;
  mediaStudioHoursQuota: number;
  mediaStudioHoursUsed: number;
  consultationSessionsQuota: number;
  consultationSessionsUsed: number;

  monthlyFee: number;
  currency: string;
  discountOnExtraServicesPercent: number;
  autoRenew: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConsultationType = 'IN_PERSON' | 'ONLINE_MEETING' | 'OFFICE_VISIT' | 'WRITTEN_REPORT';
export type ServiceBookingStatus = 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ServicePaymentStatus = 'FREE_QUOTA' | 'PAID' | 'UNPAID' | 'PARTIAL';

export interface ServiceBooking {
  id: string;
  bookingNumber: string;      // e.g. "SBK-2026-0001"
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  companyName?: string;
  consultationType: ConsultationType;
  preferredDate: string;      // YYYY-MM-DD
  preferredTime: string;      // HH:mm
  duration: string;           // e.g. "60 دقيقة"
  scopeDetails: string;       // تفاصيل الطلب أو موضوع الاستشارة
  assignedConsultant?: string;// المستشار / المسؤول عن الخدمة
  
  // Membership / Tenant Quota Coverage
  isCoveredByMembership: boolean; // هل تم احتسابها من الرصيد المجاني للمستأجر
  tenantSubscriptionId?: string;
  
  // Pricing
  price: number;
  discount: number;
  finalAmount: number;
  currency: string;
  
  status: ServiceBookingStatus;
  paymentStatus: ServicePaymentStatus;
  paymentMethod?: PaymentMethod;
  
  // Linked Accounting Voucher
  linkedVoucherId?: string;
  linkedVoucherNumber?: string;
  
  meetingLink?: string;       // رابط الاجتماع الافتراضي لو أونلاين
  deliverablesNotes?: string; // ملاحظات ومخرجات التسليم
  
  createdByType: 'CLIENT_SELF_SERVICE' | 'STAFF' | 'ADMIN';
  createdByName?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// LEASE CONTRACTS & TENANT MANAGEMENT TYPES
// (عقود الإيجار وإدارة المستأجرين، الضمانات وجدولة الدفعات)
// ----------------------------------------------------

export type LeaseContractType =
  | 'COMMERCIAL_OFFICE'        // عقد إيجار مكتب تجاري / تنفيذي خاص
  | 'COWORKING_DEDICATED_DESK' // عقد مكتب مخصص بمساحة عمل مشتركة
  | 'FLEX_SPACE'              // عقد مساحة عمل مرنة
  | 'VIRTUAL_OFFICE'          // عقد مكتب افتراضي وترخيص بلدي وسجل تجاري
  | 'EVENT_HALL_RETAINER'     // عقد حجز دوري لقاعات التدريب والفعاليات
  | 'CUSTOM_SPACE';           // عقد مخصص

export type LeaseContractStatus =
  | 'DRAFT'              // مسودة قيد الإعداد
  | 'PENDING_SIGNATURE'  // بانتظار توقيع الأطراف
  | 'ACTIVE'             // ساري ومعتمد
  | 'EXPIRING_SOON'      // ينتهي خلال 30 يوماً
  | 'EXPIRED'            // منتهي
  | 'TERMINATED'         // تم إنهاؤه / فسخه
  | 'RENEWED';           // تم تجديده بعقد جديد

export type PaymentFrequency =
  | 'MONTHLY'       // شهري
  | 'QUARTERLY'     // كل 3 أشهر (ربع سنوي)
  | 'SEMI_ANNUAL'   // كل 6 أشهر (نصف سنوي)
  | 'ANNUAL'        // سنوي
  | 'LUMP_SUM';     // دفعة واحدة مقدماً

export type InstallmentStatus = 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export interface PaymentInstallment {
  id: string;
  installmentNumber: number; // 1, 2, 3...
  titleAr: string;           // e.g. "الدفعة الأولى - الإيجار الشهري لأكتوبر 2026"
  titleEn?: string;
  dueDate: string;           // YYYY-MM-DD
  amount: number;            // Net amount before tax
  taxRate: number;           // e.g. 5%
  taxAmount: number;         // Tax amount
  discountAmount?: number;   // Discount if applicable
  totalAmount: number;       // Final amount to pay
  currency: string;          // OMR
  status: InstallmentStatus;
  paidDate?: string;         // YYYY-MM-DD when paid
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  linkedVoucherId?: string;       // Auto-generated Receipt Voucher ID
  linkedVoucherNumber?: string;   // RV-2026-XXXX
  notes?: string;
}

export type DepositStatus =
  | 'UNPAID'              // لم يُسدد بعد
  | 'HELD_IN_CUSTODY'     // محفوظ كأمانة تأمين مستردة
  | 'PARTIALLY_REFUNDED'  // مسترد جزئياً بعد خصم التلفيات
  | 'FULLY_REFUNDED'      // مسترد بالكامل
  | 'FORFEITED';          // مصادر بالكامل لتعويض أضرار أو إخلال

export interface SecurityDeposit {
  depositAmount: number;
  currency: string;
  status: DepositStatus;
  paidDate?: string;
  paidReceiptVoucherId?: string;
  paidReceiptVoucherNumber?: string;
  heldAccountLedger?: string;
  
  refundedAmount?: number;
  deductedAmount?: number;
  deductionReason?: string;
  refundDate?: string;
  refundPaymentVoucherId?: string;
  refundPaymentVoucherNumber?: string;
  settlementNotes?: string;
}

export type TenantDocumentType =
  | 'CR_CERTIFICATE'      // شهادة السجل التجاري
  | 'CHAMBER_COMMERCE'   // شهادة غرفة التجارة والصناعة
  | 'CIVIL_ID_CARD'       // بطاقة الهوية المدنية / جواز السفر
  | 'MUNICIPAL_LICENSE'   // الترخيص البلدي / عقد الإيجار المعتمد
  | 'VAT_CERTIFICATE'     // شهادة ضريبة القيمة المضافة
  | 'SIGNED_CONTRACT'     // نسخة العقد الموقع إلكترونياً
  | 'HANDOVER_INSPECTION' // محضر استلام وتسليم العين المؤجرة
  | 'PAYMENT_RECEIPT'     // إيصال تحويل / شيك بنكي
  | 'OTHER_ATTACHMENT';   // مستندات أخرى

export interface TenantDocument {
  id: string;
  title: string;
  type: TenantDocumentType;
  fileName: string;
  fileSize?: string;
  fileUrl: string;
  uploadedAt: string;
  expiryDate?: string;
  notes?: string;
}

export interface ContractClause {
  id: string;
  titleAr: string;
  titleEn?: string;
  contentAr: string;
  contentEn?: string;
  isMandatory: boolean;
  order: number;
}

export interface HandoverInspectionItem {
  id: string;
  category: 'FURNITURE' | 'AIR_CONDITIONING' | 'LIGHTING_ELECTRICAL' | 'KEYS_ACCESS_CARDS' | 'PAINT_WALLS' | 'CLEANLINESS';
  titleAr: string;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
  notes?: string;
  photos?: string[];
}

export interface LeaseContract {
  id: string;
  contractNumber: string;
  titleAr: string;
  titleEn?: string;
  contractType: LeaseContractType;
  status: LeaseContractStatus;
  
  lessorCompanyName: string;
  lessorCrNumber: string;
  lessorTaxNumber: string;
  lessorRepresentative: string;
  lessorRepresentativeCivilId?: string;
  lessorRepresentativeTitle?: string;
  lessorPhone: string;
  lessorEmail: string;
  lessorAddress: string;
  lessorStampUrl?: string;
  
  customerId?: string;
  tenantName: string;
  tenantType: 'CORPORATE' | 'INDIVIDUAL';
  tenantCrNumber?: string;
  tenantTaxNumber?: string;
  tenantSignatoryName: string;
  tenantSignatoryCivilId?: string;
  tenantSignatoryTitle?: string;
  tenantPhone: string;
  tenantEmail: string;
  tenantAddress: string;
  
  spaceId: string;
  spaceCode: string;
  spaceName: string;
  spaceType: SpaceType;
  branchId: string;
  branchName: string;
  floorLocation?: string;
  areaSqm?: number;
  capacityPersons?: number;
  accessKeyCardsCount?: number;
  assignedParkingSlots?: string;
  
  startDate: string;
  endDate: string;
  durationMonths: number;
  gracePeriodDays?: number;
  noticePeriodDays: number;
  autoRenew: boolean;
  
  totalRentAmount: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  finalContractValue: number;
  currency: string;
  paymentFrequency: PaymentFrequency;
  
  includedAmenities: {
    highSpeedInternet: boolean;
    electricityAndWater: boolean;
    centralAirConditioning: boolean;
    dailyCleaningService: boolean;
    receptionAndMailHandling: boolean;
    smartAccessControl: boolean;
    maintenanceSupport: boolean;
    beverageAndCoffeeStation: boolean;
  };
  
  securityDeposit: SecurityDeposit;
  installments: PaymentInstallment[];
  
  linkedPackageId?: string;
  packageName?: string;
  monthlyFreeMeetingRoomHours: number;
  monthlyFreeMediaStudioHours: number;
  monthlyFreeConsultations: number;
  tenantDiscountOnExtraServicesPercent: number;
  
  clauses: ContractClause[];
  customTermsNotes?: string;
  
  lessorSignature?: {
    signatureDataUrl: string;
    signatoryName: string;
    signatoryTitle: string;
    signedAt: string;
    ipAddress?: string;
  };
  tenantSignature?: {
    signatureDataUrl: string;
    signatoryName: string;
    signatoryCivilId?: string;
    signedAt: string;
    ipAddress?: string;
    deviceInfo?: string;
  };
  isDigitallySigned: boolean;
  signatureVerificationCode?: string;
  
  documents: TenantDocument[];
  
  handoverDate?: string;
  handoverNotes?: string;
  handoverItems?: HandoverInspectionItem[];
  
  preparedByName: string;
  preparedByRole?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
