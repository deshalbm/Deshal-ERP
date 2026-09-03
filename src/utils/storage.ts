import {
  CompanySettings,
  DesignTheme,
  ReceiptVoucher,
  Customer,
  InventoryItem,
  StockMovement,
  PurchaseInvoice,
  Supplier,
  Branch,
  StockTransfer,
  Employee,
  EmployeeRole,
  EmployeePermission,
  POSOrder,
  POSOrderItem,
  POSHeldCart,
  CashierShift,
  CashMovement,
  RecurringSchedule,
  RecurringScheduleExecution,
  WhatsAppSettings,
  WhatsAppMessageLog,
  RentalSpace,
  SpaceBooking,
  SpaceType,
  RentalType,
  BookingStatus,
  BookingPaymentStatus,
  ConsultingService,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
  ServiceCategory,
  PricingModel,
  ConsultationType,
  ServiceBookingStatus,
  ServicePaymentStatus,
  LeaseContract,
  PaymentInstallment,
  SecurityDeposit,
  TenantDocument,
  ContractClause,
  HandoverInspectionItem,
  LeaseContractType,
  LeaseContractStatus,
  PaymentFrequency,
  InstallmentStatus,
  DepositStatus,
  AttendanceRecord,
  AttendanceStatus,
  PayrollSlip,
  PayrollStatus,
  LeaveRequest,
  LeaveType,
  LeaveStatus
} from "../types";
import { numberToWords } from "./numberToWords";
import { generateUuid } from "./uuid";

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  enabled: true,
  provider: "baileys",
  serverPreset: "generic_baileys",
  serverUrl: "http://localhost:8000",
  apiKey: "",
  sessionId: "deshal-erp",
  defaultCountryCode: "968",
  includePdfLink: true,
  autoSendOnVoucherCreate: false,
  autoSendOnPOSCheckout: false,
  autoSendOnDueDateReminder: false,
  customHeaderNotice: "ديشال لإدارة الأعمال (Deshal ERP) - إشعار رسمي",
  customFooterNotice: "شكراً لتعاملكم مع منظومة ديشال لإدارة الأعمال والحلول التقنية."
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "ديشال لإدارة الأعمال (Deshal ERP)",
  tagline: "Deshal Business Management & ERP Solutions",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
  logoWidth: 150,
  taxId: "OM-94288394-B",
  crNumber: "CR-1092831",
  address: "لوى - شمال الباطنة",
  cityStateZip: "سلطنة عمان",
  country: "Sultanate of Oman",
  phone: "+968 77438203",
  email: "digititech.com@gmail.com",
  website: "www.digititech.com",
  defaultCurrency: "OMR",
  headerNotice: "سند استلام رسمي - OFFICIAL RECEIPT VOUCHER",
  footerNotice: "شكراً لتعاملكم معنا - Thank you for choosing Deshal Business ERP.",
  termsAndConditions: "1. يعتبر هذا السند إشعاراً رسمياً باستلام المبلغ أو تقديم الخدمة الموضحة.\n2. يسري السند بعد الاعتماد أو الختم المعتمد.\n3. يرجى الإشارة إلى رقم السند في كافة المراسلات الإدارية والمالية.",
  authorizedSignatoryName: "إدارة ديشال للأعمال",
  authorizedSignatoryTitle: "إدارة الشؤون المالية والادارية",
  signatureImageUrl: "",
  stampImageUrl: "",
  bankDetails: {
    bankName: "بنك ظفار (Bank Dhofar)",
    accountName: "ديشال لإدارة الأعمال والحلول التقنية",
    accountNumber: "01041112233001",
    iban: "OM960111000000001041112233001",
    swiftCode: "BKDHOMRUXXX"
  },
  defaultCustomFields: [
    { id: "cf-1", label: "المشروع / Project", defaultValue: "مركز الدليل الشامل", isRequired: false },
    { id: "cf-2", label: "الجهة / Dept", defaultValue: "شبكات وحلول تقنية", isRequired: false }
  ],
  qrCodeContent: "https://www.digititech.com/verify/receipt?rv=RV-2409-0822",
  whatsappSettings: DEFAULT_WHATSAPP_SETTINGS
};

export const DEFAULT_DESIGN_THEME: DesignTheme = {
  templateId: "modern",
  primaryColor: "#4f46e5", // Indigo Sleek Accent
  secondaryColor: "#6366f1", // Slate Indigo
  accentColor: "#10b981", // Emerald
  textColor: "#0f172a",
  backgroundColor: "#ffffff",
  fontFamily: "sans",
  pageSize: "A4",
  showLogo: true,
  showStamp: true,
  showSignatureBlock: true,
  showAmountInWords: true,
  showQrCode: true,
  showWatermark: true,
  watermarkText: "PAID & VERIFIED",
  showBankDetails: true,
  borderStyle: "subtle",
  headerLayout: "split"
};

const DEFAULT_CLIENT = {
  receivedFrom: "شركة الدليل الشامل",
  payerEmail: "info@deshalbm.com",
  payerPhone: "+968 77627500",
  payerAddress: "Maden Building - Sohar - North ALBatinah - Saltunat oman",
  payerTaxId: "OM-TAX-7762",
  currency: "OMR",
  paymentMethod: "BANK_TRANSFER" as const,
  bankName: "بنك ظفار (Bank Dhofar)",
  category: "Professional IT & Network Services",
  status: "PAID" as const,
  preparedBy: "قسم الحسابات",
  approvedBy: "إدارة ديشال للأعمال",
  receivedBy: "شركة الدليل الشامل"
};

const TARGET_DESCRIPTION = "دفعة عن تركيب الكاميرات و شاشات المراقبة و الشاشات التفاعلية الذكية في مركز الدليل الشامل";

const GENERATED_ITEMS = [
  { seq: 802, amount: 500, date: "2026-07-16", ref: "INV-4412", desc: TARGET_DESCRIPTION },
  { seq: 803, amount: 400, date: "2026-07-20", ref: "INV-4413", desc: TARGET_DESCRIPTION },
  { seq: 804, amount: 300, date: "2026-07-20", ref: "INV-4414", desc: TARGET_DESCRIPTION },
  { seq: 805, amount: 523, date: "2026-07-22", ref: "INV-4415", desc: TARGET_DESCRIPTION },
  { seq: 806, amount: 500, date: "2026-07-22", ref: "INV-4416", desc: TARGET_DESCRIPTION },
  { seq: 807, amount: 1000, date: "2026-07-22", ref: "INV-4417", desc: TARGET_DESCRIPTION },
  { seq: 808, amount: 2000, date: "2026-07-23", ref: "INV-4418", desc: TARGET_DESCRIPTION },
  { seq: 809, amount: 500, date: "2026-07-23", ref: "INV-4419", desc: TARGET_DESCRIPTION },
  { seq: 810, amount: 2000, date: "2026-07-24", ref: "INV-4420", desc: TARGET_DESCRIPTION },
  { seq: 811, amount: 500, date: "2026-07-24", ref: "INV-4421", desc: TARGET_DESCRIPTION },
  { seq: 812, amount: 135.345, date: "2026-07-25", ref: "INV-4422", desc: TARGET_DESCRIPTION },
  { seq: 813, amount: 450, date: "2026-07-25", ref: "INV-4423", desc: TARGET_DESCRIPTION },
  { seq: 814, amount: 2000, date: "2026-07-28", ref: "INV-4424", desc: TARGET_DESCRIPTION },
  { seq: 815, amount: 7000, date: "2026-07-29", ref: "INV-4425", desc: TARGET_DESCRIPTION },
  { seq: 816, amount: 2500, date: "2026-07-29", ref: "INV-4426", desc: TARGET_DESCRIPTION },
  { seq: 817, amount: 700, date: "2026-07-30", ref: "INV-4427", desc: TARGET_DESCRIPTION },
  // Additional receipt vouchers for شركة الدليل الشامل starting from receipt no. 0820
  { seq: 820, amount: 2500, date: "2026-08-15", ref: "INV-4428", desc: TARGET_DESCRIPTION },
  { seq: 821, amount: 40, date: "2026-08-14", ref: "INV-4429", desc: TARGET_DESCRIPTION },
  { seq: 822, amount: 1900, date: "2026-08-14", ref: "INV-4430", desc: TARGET_DESCRIPTION },
  { seq: 823, amount: 2500, date: "2026-08-13", ref: "INV-4431", desc: TARGET_DESCRIPTION },
  { seq: 824, amount: 2500, date: "2026-08-12", ref: "INV-4432", desc: TARGET_DESCRIPTION },
  { seq: 825, amount: 347.8, date: "2026-08-11", ref: "INV-4433", desc: TARGET_DESCRIPTION },
  { seq: 826, amount: 2500, date: "2026-08-11", ref: "INV-4434", desc: TARGET_DESCRIPTION },
  { seq: 827, amount: 1000, date: "2026-08-10", ref: "INV-4435", desc: TARGET_DESCRIPTION },
  { seq: 828, amount: 1000, date: "2026-08-10", ref: "INV-4436", desc: TARGET_DESCRIPTION },
  { seq: 829, amount: 7000, date: "2026-08-10", ref: "INV-4437", desc: TARGET_DESCRIPTION },
  { seq: 830, amount: 500, date: "2026-08-10", ref: "INV-4438", desc: TARGET_DESCRIPTION },
  { seq: 831, amount: 1000, date: "2026-08-10", ref: "INV-4439", desc: TARGET_DESCRIPTION },
  { seq: 832, amount: 1500, date: "2026-08-09", ref: "INV-4440", desc: TARGET_DESCRIPTION },
  // Additional receipt vouchers (16-08-2026 to 25-08-2026)
  { seq: 833, amount: 2000, date: "2026-08-25", ref: "INV-4441", desc: TARGET_DESCRIPTION },
  { seq: 834, amount: 2500, date: "2026-08-24", ref: "INV-4442", desc: TARGET_DESCRIPTION },
  { seq: 835, amount: 2231.25, date: "2026-08-23", ref: "INV-4443", desc: TARGET_DESCRIPTION },
  { seq: 836, amount: 225, date: "2026-08-23", ref: "INV-4444", desc: TARGET_DESCRIPTION },
  { seq: 837, amount: 2500, date: "2026-08-22", ref: "INV-4445", desc: TARGET_DESCRIPTION },
  { seq: 838, amount: 2500, date: "2026-08-20", ref: "INV-4446", desc: TARGET_DESCRIPTION },
  { seq: 839, amount: 500, date: "2026-08-19", ref: "INV-4447", desc: TARGET_DESCRIPTION },
  { seq: 840, amount: 2000, date: "2026-08-19", ref: "INV-4448", desc: TARGET_DESCRIPTION },
  { seq: 841, amount: 100, date: "2026-08-18", ref: "INV-4449", desc: TARGET_DESCRIPTION },
  { seq: 842, amount: 507.535, date: "2026-08-18", ref: "INV-4450", desc: TARGET_DESCRIPTION },
  { seq: 843, amount: 2500, date: "2026-08-17", ref: "INV-4451", desc: TARGET_DESCRIPTION },
  { seq: 844, amount: 2500, date: "2026-08-16", ref: "INV-4452", desc: TARGET_DESCRIPTION }
];

export const SAMPLE_VOUCHERS: ReceiptVoucher[] = [];

const STORAGE_KEYS = {
  SETTINGS: "rv_studio_company_settings",
  THEME: "rv_studio_design_theme",
  VOUCHERS: "rv_studio_vouchers_list",
  CUSTOMERS: "rv_studio_customers_list",
  INVENTORY: "rv_studio_inventory_items",
  PURCHASES: "rv_studio_purchases_list",
  SUPPLIERS: "rv_studio_suppliers_list",
  MOVEMENTS: "rv_studio_stock_movements",
  BRANCHES: "rv_studio_branches_list",
  TRANSFERS: "rv_studio_stock_transfers",
  ACTIVE_BRANCH: "rv_studio_active_branch_id",
  EMPLOYEES: "rv_studio_employees_list",
  ACTIVE_EMPLOYEE: "rv_studio_active_employee_id",
  POS_ORDERS: "rv_studio_pos_orders_list",
  POS_HELD_CARTS: "rv_studio_pos_held_carts",
  CASHIER_SHIFTS: "rv_studio_cashier_shifts",
  ACTIVE_SHIFT: "rv_studio_active_shift",
  RECURRING_SCHEDULES: "rv_studio_recurring_schedules",
  WHATSAPP_LOGS: "rv_studio_whatsapp_logs",
  SPACES: "rv_studio_rental_spaces",
  BOOKINGS: "rv_studio_space_bookings",
  SERVICES: "rv_studio_consulting_services",
  MEMBERSHIPS: "rv_studio_membership_packages",
  SUBSCRIPTIONS: "rv_studio_tenant_subscriptions",
  SERVICE_BOOKINGS: "rv_studio_service_bookings",
  CONTRACTS: "rv_studio_lease_contracts",
  ATTENDANCE: "deshal_hr_attendance_records",
  PAYROLL_SLIPS: "deshal_hr_payroll_slips",
  LEAVE_REQUESTS: "deshal_hr_leave_requests"
};

export function clearAllLocalStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      // Also clear accounting storage keys
      localStorage.removeItem("deshal_accounts");
      localStorage.removeItem("deshal_journal_entries");
      localStorage.removeItem("deshal_fiscal_periods");
      localStorage.removeItem("deshal_cost_centers");
      localStorage.removeItem("deshal_audit_logs");
    }
  } catch (e) {
    console.warn("Failed to clear local storage keys:", e);
  }
}

export const DEFAULT_CUSTOMERS: Customer[] = [];

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load customers from localStorage:", e);
  }
  // If not stored, persist default seed customers
  saveCustomers(DEFAULT_CUSTOMERS);
  return DEFAULT_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error("Failed to save customers to localStorage:", e);
  }
}

export function syncCustomerFromVoucher(voucher: Partial<ReceiptVoucher>, currentList?: Customer[]): Customer[] {
  const currentCustomers = currentList || loadCustomers();
  if (!voucher.receivedFrom || !voucher.receivedFrom.trim()) return currentCustomers;
  const name = voucher.receivedFrom.trim();
  const existing = currentCustomers.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );

  const now = new Date().toISOString();

  if (existing) {
    // Update existing customer contact details if provided
    let hasUpdates = false;
    const updated: Customer = {
      ...existing,
      phone: voucher.payerPhone || existing.phone,
      email: voucher.payerEmail || existing.email,
      address: voucher.payerAddress || existing.address,
      taxId: voucher.payerTaxId || existing.taxId,
      updatedAt: now
    };
    if (
      updated.phone !== existing.phone ||
      updated.email !== existing.email ||
      updated.address !== existing.address
    ) {
      hasUpdates = true;
    }
    if (hasUpdates) {
      const updatedList = currentCustomers.map((c) => (c.id === existing.id ? updated : c));
      saveCustomers(updatedList);
      return updatedList;
    }
    return currentCustomers;
  }

  // Create new customer from voucher
  const newCustomer: Customer = {
    id: generateUuid(),
    name: name,
    contactPerson: "",
    phone: voucher.payerPhone || "",
    email: voucher.payerEmail || "",
    address: voucher.payerAddress || "",
    city: "صحار",
    country: "سلطنة عمان",
    taxId: voucher.payerTaxId || "",
    type: "CORPORATE",
    status: "ACTIVE",
    notes: `تمت الإضافة تلقائياً من محرر السندات - سند رقم ${voucher.voucherNumber || ""}`,
    tags: ["سندات مالية"],
    creditLimit: 10000,
    interactions: [
      {
        id: `act-${Date.now()}`,
        date: now,
        type: "VOUCHER_ISSUED",
        title: `إنشاء السند ${voucher.voucherNumber || ""}`,
        notes: `تم إنشاء سند مالي بمبلغ ${voucher.totalAmount || voucher.amount || 0} ${voucher.currency || "OMR"}`,
        createdByName: "النظام"
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  const updatedList = [newCustomer, ...currentCustomers];
  saveCustomers(updatedList);
  return updatedList;
}

export function loadCompanySettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (parsed.signatureImageUrl?.includes("unsplash.com")) {
          parsed.signatureImageUrl = "";
        }
        if (parsed.stampImageUrl?.includes("unsplash.com")) {
          parsed.stampImageUrl = "";
        }
        return {
          ...DEFAULT_COMPANY_SETTINGS,
          ...parsed,
          bankDetails: {
            ...DEFAULT_COMPANY_SETTINGS.bankDetails,
            ...(parsed.bankDetails || {})
          },
          whatsappSettings: {
            ...DEFAULT_WHATSAPP_SETTINGS,
            ...(parsed.whatsappSettings || {})
          }
        };
      }
    }
  } catch (e) {
    console.warn("Failed to load company settings:", e);
  }
  return DEFAULT_COMPANY_SETTINGS;
}

export function saveCompanySettings(settings: CompanySettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save company settings:", e);
  }
}

export function loadDesignTheme(): DesignTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load design theme:", e);
  }
  return DEFAULT_DESIGN_THEME;
}

export function saveDesignTheme(theme: DesignTheme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
  } catch (e) {
    console.error("Failed to save design theme:", e);
  }
}

export function loadVouchers(): ReceiptVoucher[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const settings = loadCompanySettings();
        const defaultCurr = settings.defaultCurrency || "OMR";
        let shouldSave = false;

        // Check if any sample vouchers are missing from stored list
        const existingNumbers = new Set(parsed.map((v: ReceiptVoucher) => v.voucherNumber));
        const missingVouchers = SAMPLE_VOUCHERS.filter((sv) => !existingNumbers.has(sv.voucherNumber));

        let mergedList = [...parsed];
        if (missingVouchers.length > 0) {
          mergedList = [...mergedList, ...missingVouchers];
          shouldSave = true;
        }

        const updatedList = mergedList.map((v: ReceiptVoucher, idx: number) => {
          let voucherNum = v.voucherNumber;
          const curr = (!v.currency || v.currency === "USD") ? defaultCurr : v.currency;
          if (curr !== v.currency) shouldSave = true;

          const updatedLineItems = (v.lineItems && v.lineItems.length > 0)
            ? v.lineItems.map(item => ({ ...item, description: TARGET_DESCRIPTION }))
            : [{ id: `li-${idx + 1}`, description: TARGET_DESCRIPTION, quantity: 1, unitPrice: v.totalAmount || v.amount || 0, amount: v.totalAmount || v.amount || 0 }];

          shouldSave = true;

          return {
            ...v,
            voucherNumber: voucherNum,
            currency: curr,
            lineItems: updatedLineItems,
            amountInWords: v.isCustomWords ? v.amountInWords : numberToWords(v.totalAmount || v.amount || 0, curr)
          };
        });

        if (shouldSave) {
          saveVouchers(updatedList);
        }
        return updatedList;
      }
    }
  } catch (e) {
    console.warn("Failed to load vouchers:", e);
  }
  // Store generated vouchers by default
  saveVouchers(SAMPLE_VOUCHERS);
  return SAMPLE_VOUCHERS;
}

export function saveVouchers(vouchers: ReceiptVoucher[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
  } catch (e) {
    console.error("Failed to save vouchers:", e);
  }
}

// -------------------------------------------------------------------
// INVENTORY & STOCK LOGIC
// -------------------------------------------------------------------

export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [];

export function loadInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load inventory from localStorage:", e);
  }
  saveInventory(DEFAULT_INVENTORY_ITEMS);
  return DEFAULT_INVENTORY_ITEMS;
}

export function saveInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save inventory items:", e);
  }
}

// -------------------------------------------------------------------
// SUPPLIERS LOGIC (الموردون)
// -------------------------------------------------------------------

export const DEFAULT_SUPPLIERS: Supplier[] = [];

export function loadSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load suppliers from localStorage:", e);
  }
  return [];
}

export function saveSuppliers(suppliers: Supplier[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  } catch (e) {
    console.error("Failed to save suppliers:", e);
  }
}

// -------------------------------------------------------------------
// PURCHASES & INVOICES LOGIC (المشتريات)
// -------------------------------------------------------------------

export const DEFAULT_PURCHASES: PurchaseInvoice[] = [];

export function loadPurchases(): PurchaseInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load purchases from localStorage:", e);
  }
  return [];
}

export function savePurchases(purchases: PurchaseInvoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  } catch (e) {
    console.error("Failed to save purchases:", e);
  }
}

// -------------------------------------------------------------------
// STOCK MOVEMENTS LOGIC (حركات المخزون)
// -------------------------------------------------------------------

export const DEFAULT_MOVEMENTS: StockMovement[] = [
  {
    id: "mov-1",
    itemId: "item-1",
    itemSku: "CAM-IP4K-DOME",
    itemName: "كاميرا مراقبة شبكية 4K IP Dome بدقة 8 ميجابكسل",
    type: "PURCHASE_IN",
    quantity: 50,
    previousQuantity: 0,
    newQuantity: 50,
    referenceNo: "PO-2026-0101",
    warehouse: "المستودع الرئيسي - صحار",
    date: "2026-08-10T14:00:00Z",
    notes: "استلام دفعة توريد من فاتورة الشراء PO-2026-0101",
    createdByName: "أمين المستودع"
  },
  {
    id: "mov-2",
    itemId: "item-1",
    itemSku: "CAM-IP4K-DOME",
    itemName: "كاميرا مراقبة شبكية 4K IP Dome بدقة 8 ميجابكسل",
    type: "SALE_OUT",
    quantity: 5,
    previousQuantity: 50,
    newQuantity: 45,
    referenceNo: "RV-2026-0820",
    warehouse: "المستودع الرئيسي - صحار",
    date: "2026-08-15T10:30:00Z",
    notes: "صرف لتركيب مشروع مركز الدليل الشامل",
    createdByName: "فريق التركيبات"
  },
  {
    id: "mov-3",
    itemId: "item-2",
    itemSku: "SCR-TOUCH-85IN",
    itemName: "شاشة تفاعلية ذكية 85 بوصة 4K Ultra HD",
    type: "PURCHASE_IN",
    quantity: 10,
    previousQuantity: 0,
    newQuantity: 10,
    referenceNo: "PO-2026-0102",
    warehouse: "المستودع الرئيسي - صحار",
    date: "2026-08-16T10:00:00Z",
    notes: "استلام شاشات ذكية من شركة النخبة",
    createdByName: "أمين المستودع"
  },
  {
    id: "mov-4",
    itemId: "item-2",
    itemSku: "SCR-TOUCH-85IN",
    itemName: "شاشة تفاعلية ذكية 85 بوصة 4K Ultra HD",
    type: "SALE_OUT",
    quantity: 2,
    previousQuantity: 10,
    newQuantity: 8,
    referenceNo: "RV-2026-0822",
    warehouse: "المستودع الرئيسي - صحار",
    date: "2026-08-18T12:00:00Z",
    notes: "توريد وتركيب قاعة الاجتماعات الرئيسية",
    createdByName: "فريق المشاريع"
  }
];

export function loadStockMovements(): StockMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load stock movements from localStorage:", e);
  }
  saveStockMovements(DEFAULT_MOVEMENTS);
  return DEFAULT_MOVEMENTS;
}

export function saveStockMovements(movements: StockMovement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  } catch (e) {
    console.error("Failed to save stock movements:", e);
  }
}

// -------------------------------------------------------------------
// MULTI-BRANCH LOGIC (إدارة الفروع المتعددة)
// -------------------------------------------------------------------

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "br-sohar",
    code: "BR-SOH-01",
    name: "فرع صحار الرئيسي (المركز العام)",
    nameEn: "Sohar Headquarter Branch",
    isMain: true,
    phone: "+968 77438203",
    email: "sohar@digititech.com",
    address: "مبنى مدن - بجوار مجمع المحاكم - صحار",
    city: "صحار",
    country: "سلطنة عمان",
    taxId: "OM-94288394-B",
    crNumber: "CR-1092831",
    managerName: "م. سعيد المعمري",
    managerPhone: "+968 77438203",
    status: "ACTIVE",
    defaultWarehouse: "المستودع الرئيسي - صحار",
    color: "#4f46e5", // Indigo
    notes: "المقر الإداري والمستودع المركزي لعمليات شمال الباطنة وإدارة المشاريع التقنية والشبكات.",
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z"
  },
  {
    id: "br-muscat",
    code: "BR-MCT-02",
    name: "فرع مسقط - غلا التجارية",
    nameEn: "Muscat Branch - Ghala",
    isMain: false,
    phone: "+968 91234567",
    email: "muscat@digititech.com",
    address: "شارع المعارض - أبراج غلا التجارية - مسقط",
    city: "مسقط",
    country: "سلطنة عمان",
    taxId: "OM-94288394-B",
    crNumber: "CR-1092831-M",
    managerName: "أ. فيصل البلوشي",
    managerPhone: "+968 91234567",
    status: "ACTIVE",
    defaultWarehouse: "مستودع مسقط الإقليمي",
    color: "#0284c7", // Sky Blue
    notes: "فرع العاصمة لتغطية عقود الشركات والمؤسسات الحكومية ومشاريع الشاشات الذكية.",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-08-24T12:00:00Z"
  },
  {
    id: "br-liwa",
    code: "BR-LIW-03",
    name: "فرع لوى وشناص",
    nameEn: "Liwa & Shinas Branch",
    isMain: false,
    phone: "+968 92345678",
    email: "liwa@digititech.com",
    address: "الشارع العام - مقابل المركز الصحي - لوى",
    city: "لوى",
    country: "سلطنة عمان",
    taxId: "OM-94288394-B",
    crNumber: "CR-1092831-L",
    managerName: "م. راشد الشحي",
    managerPhone: "+968 92345678",
    status: "ACTIVE",
    defaultWarehouse: "مخزن المعدات والكابلات - صحار",
    color: "#059669", // Emerald Green
    notes: "خدمة منطقة ميناء صحار الصناعي ولوى وشناص وأعمال الصيانة الميدانية وتمديد الكابلات.",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-08-22T15:00:00Z"
  },
  {
    id: "br-salalah",
    code: "BR-SAL-04",
    name: "فرع صلالة - ظفار",
    nameEn: "Salalah Branch - Dhofar",
    isMain: false,
    phone: "+968 94567890",
    email: "salalah@digititech.com",
    address: "شارع السلام - عوقد الجنوبية - صلالة",
    city: "صلالة",
    country: "سلطنة عمان",
    taxId: "OM-94288394-B",
    crNumber: "CR-1092831-S",
    managerName: "أ. طارق اليافعي",
    managerPhone: "+968 94567890",
    status: "ACTIVE",
    defaultWarehouse: "مستودع صلالة والجنوب",
    color: "#d97706", // Amber
    notes: "فرع محافظة ظفار لتنفيذ المشاريع السياحية والتجارية والحلول الأمنية الذكية.",
    createdAt: "2026-07-20T11:00:00Z",
    updatedAt: "2026-08-20T16:00:00Z"
  }
];

export const DEFAULT_TRANSFERS: StockTransfer[] = [
  {
    id: "tr-1",
    transferNumber: "TR-2026-0001",
    date: "2026-08-21",
    fromBranchId: "br-sohar",
    fromBranchName: "فرع صحار الرئيسي (المركز العام)",
    fromWarehouse: "المستودع الرئيسي - صحار",
    toBranchId: "br-muscat",
    toBranchName: "فرع مسقط - غلا التجارية",
    toWarehouse: "مستودع مسقط الإقليمي",
    items: [
      {
        itemId: "item-1",
        sku: "CAM-IP4K-DOME",
        name: "كاميرا مراقبة شبكية 4K IP Dome بدقة 8 ميجابكسل",
        quantity: 15,
        unit: "حبة"
      },
      {
        itemId: "item-4",
        sku: "SW-POE-24G",
        name: "سويتش شبكات 24 منفذ Gigabit PoE+",
        quantity: 5,
        unit: "جهاز"
      }
    ],
    status: "COMPLETED",
    notes: "تحويل بضائع لتغطية طلبية عميل مؤسسي في مسقط.",
    transferByName: "م. سعيد المعمري",
    receivedByName: "أ. فيصل البلوشي",
    createdAt: "2026-08-21T09:00:00Z",
    updatedAt: "2026-08-21T14:30:00Z"
  }
];

export function loadBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load branches from localStorage:", e);
  }
  saveBranches(DEFAULT_BRANCHES);
  return DEFAULT_BRANCHES;
}

export function saveBranches(branches: Branch[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  } catch (e) {
    console.error("Failed to save branches:", e);
  }
}

export function loadTransfers(): StockTransfer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load transfers from localStorage:", e);
  }
  saveTransfers(DEFAULT_TRANSFERS);
  return DEFAULT_TRANSFERS;
}

export const loadStockTransfers = loadTransfers;

export function saveTransfers(transfers: StockTransfer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  } catch (e) {
    console.error("Failed to save transfers:", e);
  }
}

export const saveStockTransfers = saveTransfers;

export function loadActiveBranchId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH);
    if (saved) return saved;
  } catch (e) {
    console.warn("Failed to load active branch ID:", e);
  }
  return "ALL"; // Default to All Branches
}

export function saveActiveBranchId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BRANCH, id);
  } catch (e) {
    console.error("Failed to save active branch ID:", e);
  }
}

export const ROLE_DEFAULT_PERMISSIONS: Record<EmployeeRole, EmployeePermission[]> = {
  ADMIN: [
    "create_vouchers",
    "edit_vouchers",
    "delete_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "view_reports",
    "manage_inventory",
    "manage_transfers",
    "manage_purchases",
    "manage_suppliers",
    "manage_customers",
    "manage_branches",
    "manage_employees",
    "view_salaries",
    "edit_settings",
    "attendance_view",
    "attendance_create",
    "attendance_edit",
    "attendance_delete",
    "attendance_approve",
    "attendance_reports",
    "attendance_photos",
    "attendance_devices",
    "movement_types_mgmt",
    "employee_pin_mgmt",
    "attendance_settings"
  ],
  MANAGER: [
    "create_vouchers",
    "edit_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "view_reports",
    "manage_inventory",
    "manage_transfers",
    "manage_purchases",
    "manage_suppliers",
    "manage_customers",
    "manage_branches",
    "attendance_view",
    "attendance_create",
    "attendance_approve",
    "attendance_reports",
    "attendance_photos"
  ],
  ACCOUNTANT: [
    "create_vouchers",
    "edit_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "view_reports",
    "manage_purchases",
    "manage_suppliers",
    "manage_customers",
    "view_salaries",
    "attendance_view",
    "attendance_reports"
  ],
  SALES: [
    "create_vouchers",
    "print_export_vouchers",
    "manage_customers",
    "manage_inventory",
    "attendance_create"
  ],
  STOREKEEPER: [
    "manage_inventory",
    "manage_transfers",
    "manage_purchases",
    "attendance_create"
  ],
  RECEPTIONIST: [
    "create_vouchers",
    "print_export_vouchers",
    "manage_customers",
    "attendance_create"
  ],
  CUSTOM: [
    "create_vouchers",
    "print_export_vouchers",
    "attendance_create"
  ]
};

export const PERMISSION_CONFIG: {
  id: EmployeePermission;
  label: string;
  category: "vouchers" | "inventory" | "purchases" | "crm" | "management" | "attendance";
  description: string;
}[] = [
  {
    id: "create_vouchers",
    label: "إنشاء وتحرير السندات والفواتير",
    category: "vouchers",
    description: "إمكانية تحرير سندات القبض والصرف، فواتير ضريبية وعروض أسعار"
  },
  {
    id: "edit_vouchers",
    label: "تعديل السندات المحررة",
    category: "vouchers",
    description: "تعديل المبالغ، البنود، أو الحسابات في السندات السابقة"
  },
  {
    id: "delete_vouchers",
    label: "حذف وإلغاء السندات",
    category: "vouchers",
    description: "صلاحية إلغاء أو حذف سندات القبض والصرف من السجل"
  },
  {
    id: "print_export_vouchers",
    label: "طباعة وتصدير السندات PDF",
    category: "vouchers",
    description: "تنزيل وطباعة السندات بنماذج A4 و A5 والإيصالات الحرارية"
  },
  {
    id: "apply_discounts",
    label: "منح الخصومات والتخفيضات",
    category: "vouchers",
    description: "صلاحية تطبيق خصومات سعرية على السندات والفواتير"
  },
  {
    id: "manage_inventory",
    label: "إدارة المخزون والتسعير",
    category: "inventory",
    description: "إضافة وتعديل المنتجات، تعديل كميات الجرد وتحديث أسعار التكلفة والبيع"
  },
  {
    id: "manage_transfers",
    label: "المناقلات والتحويل المخزني",
    category: "inventory",
    description: "تحويل البضائع والأصناف بين مستودعات وفروع الشركة"
  },
  {
    id: "manage_purchases",
    label: "إدارة المشتريات وفواتير الموردين",
    category: "purchases",
    description: "تسجيل أوامر الشراء، فواتير التوريد، وسندات الصرف للموردين"
  },
  {
    id: "manage_suppliers",
    label: "إدارة الموردين وجهات الاتصال",
    category: "purchases",
    description: "إضافة بيانات الموردين، حساباتهم وأرقام التواصل"
  },
  {
    id: "manage_customers",
    label: "إدارة علاقات العملاء (CRM)",
    category: "crm",
    description: "إضافة وتعديل بيانات العملاء، الحدود الائتمانية، وسجل التفاعلات"
  },
  {
    id: "manage_branches",
    label: "إدارة الفروع والمستودعات",
    category: "management",
    description: "إضافة وتعديل فروع الشركة وبياناتها الإدارية والضريبية"
  },
  {
    id: "manage_employees",
    label: "إدارة الموظفين وتوزيع الصلاحيات",
    category: "management",
    description: "إضافة وتعديل الموظفين، تحديد الأدوار ومنح الصلاحيات"
  },
  {
    id: "view_reports",
    label: "الاطلاع على التقارير المالية والإحصائيات",
    category: "management",
    description: "عرض إجمالي الإيرادات، الأرباح، تقارير الفروع وحركة الأموال"
  },
  {
    id: "view_salaries",
    label: "الاطلاع على الرواتب والبيانات المالية للموظفين",
    category: "management",
    description: "الاطلاع على الرواتب الأساسية، البدلات والحسابات البنكية للموظفين"
  },
  {
    id: "edit_settings",
    label: "تعديل إعدادات الشركة وقوالب الطباعة",
    category: "management",
    description: "تغيير الشعار، الألوان، الختم الرسمي، الحسابات البنكية وبيانات الترويسة"
  },
  // Attendance & Kiosk Management Permissions
  {
    id: "attendance_view",
    label: "عرض سجلات الحركات وحضور الموظفين",
    category: "attendance",
    description: "الاطلاع على الحركات اللحظية، سجلات الحضور، الانصراف والمهمات"
  },
  {
    id: "attendance_create",
    label: "تسجيل حركات الحضور والانصراف (Kiosk)",
    category: "attendance",
    description: "استخدام أجهزة الكشك لتسجيل الحضور، الخروج والمهمات الميدانية"
  },
  {
    id: "attendance_edit",
    label: "طلب تعديل وتصحيح حركات الحضور",
    category: "attendance",
    description: "إنشاء طلبات تعديل لحركات الحضور المنسية أو الخاطئة مع حفظ الأثر التدقيقي"
  },
  {
    id: "attendance_delete",
    label: "حذف أو إلغاء حركات الحضور",
    category: "attendance",
    description: "صلاحية استثنائية لحذف الحركات غير الصحيحة مع التوثيق الرقابي"
  },
  {
    id: "attendance_approve",
    label: "اعتماد حركات وتعديلات الحضور",
    category: "attendance",
    description: "مراجعة واعتماد طلبات تعديل أوقات الحضور والانصراف والمهمات الخارجية"
  },
  {
    id: "attendance_reports",
    label: "تقارير وتحليلات الحضور وساعات العمل",
    category: "attendance",
    description: "تصدير تقارير التأخير، الغياب، ساعات العمل الإضافية وساعات المهمات"
  },
  {
    id: "attendance_photos",
    label: "عرض صور التحقق من الهوية الملتقطة بالكشك",
    category: "attendance",
    description: "صلاحية محمية للاطلاع على الصور الشخصية الملتقطة أثناء تسجيل الحضور"
  },
  {
    id: "attendance_devices",
    label: "إدارة وتأمين أجهزة الكشك اللوحية (Kiosk Devices)",
    category: "attendance",
    description: "تسجيل الأجهزة اللوحية، توليد التوكنات، والقفل أو التعطيل عن بعد"
  },
  {
    id: "movement_types_mgmt",
    label: "إدارة وتخصيص أنواع الحركات الإدارية",
    category: "attendance",
    description: "إضافة وتعديل وتفعيل أنواع الحركات (مهمة عمل، استراحة، طوارئ... إلخ)"
  },
  {
    id: "employee_pin_mgmt",
    label: "إدارة رموز الأمان (PIN) للموظفين",
    category: "attendance",
    description: "توليد وتعيين وإعادة ضبط وتشفير رموز الدخول السرية الخاصة بالموظفين"
  },
  {
    id: "attendance_settings",
    label: "إعدادات وسياسات الحضور والانصراف",
    category: "attendance",
    description: "تعديل قواعد فترات السماح، مهلات القفل الأمني، وحساب ساعات العمل"
  }
];

export const DEFAULT_EMPLOYEES: Employee[] = [];

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load employees from localStorage:", e);
  }
  return [];
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.error("Failed to save employees:", e);
  }
}

export function loadActiveEmployeeId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_EMPLOYEE);
    if (saved) return saved;
  } catch (e) {
    console.warn("Failed to load active employee ID:", e);
  }
  return "emp-1"; // Default to Said Al-Shehhi (Admin)
}

export function saveActiveEmployeeId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EMPLOYEE, id);
  } catch (e) {
    console.error("Failed to save active employee ID:", e);
  }
}

// -------------------------------------------------------------------
// DESHAL HR & PAYROLL (سجلات الحضور، مسيرات الرواتب والإجازات)
// -------------------------------------------------------------------

export const DEFAULT_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: "att-1",
    employeeId: "emp-1",
    employeeName: "سعيد بن راشد الشحي",
    employeeCode: "EMP-001",
    jobTitle: "المدير التنفيذي العام",
    department: "الإدارة العليا",
    date: new Date().toISOString().split("T")[0],
    checkIn: "07:55",
    checkOut: "16:30",
    status: "PRESENT",
    workingHours: 8.5,
    overtimeHours: 0.5,
    lateMinutes: 0,
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    notes: "حضور مبكر واجتماع الإدارة العليا"
  },
  {
    id: "att-2",
    employeeId: "emp-2",
    employeeName: "فاطمة بنت ناصر البلوشي",
    employeeCode: "EMP-002",
    jobTitle: "رئيسة قسم المحاسبة والمالية",
    department: "المالية والمحاسبة",
    date: new Date().toISOString().split("T")[0],
    checkIn: "08:00",
    checkOut: "16:00",
    status: "PRESENT",
    workingHours: 8,
    overtimeHours: 0,
    lateMinutes: 0,
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    notes: "مراجعة القيود المحاسبية الشهرية"
  },
  {
    id: "att-3",
    employeeId: "emp-3",
    employeeName: "طارق بن سالم المعمري",
    employeeCode: "EMP-003",
    jobTitle: "مشرف مبيعات وتنفيذي عقود",
    department: "المبيعات والمشاريع",
    date: new Date().toISOString().split("T")[0],
    checkIn: "08:20",
    checkOut: "17:00",
    status: "LATE",
    workingHours: 8.6,
    overtimeHours: 1,
    lateMinutes: 20,
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    notes: "تأخير 20 دقيقة بسبب زحام مروري"
  },
  {
    id: "att-4",
    employeeId: "emp-4",
    employeeName: "خالد بن خلفان الحوسني",
    employeeCode: "EMP-004",
    jobTitle: "أمين المستودعات المركزية",
    department: "المستودعات واللوجستيات",
    date: new Date().toISOString().split("T")[0],
    checkIn: "07:50",
    checkOut: "16:15",
    status: "PRESENT",
    workingHours: 8.4,
    overtimeHours: 0.25,
    lateMinutes: 0,
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    notes: "استلام شحنة توريد جديدة"
  },
  {
    id: "att-5",
    employeeId: "emp-5",
    employeeName: "مريم بنت حمد الكعبي",
    employeeCode: "EMP-005",
    jobTitle: "مسؤولة الاستقبال والخدمات",
    department: "خدمة العملاء والاستقبال",
    date: new Date().toISOString().split("T")[0],
    checkIn: "08:00",
    checkOut: "16:00",
    status: "PRESENT",
    workingHours: 8,
    overtimeHours: 0,
    lateMinutes: 0,
    branchId: "branch-muscat",
    branchName: "فرع مسقط - الغبرة",
    notes: "استقبال زوار مساحات العمل"
  }
];

export const DEFAULT_PAYROLL_SLIPS: PayrollSlip[] = [
  {
    id: "pay-1",
    payrollMonth: "2026-08",
    employeeId: "emp-1",
    employeeCode: "EMP-001",
    employeeName: "سعيد بن راشد الشحي",
    fullNameEn: "Said Rashid Al-Shehhi",
    jobTitle: "المدير التنفيذي العام",
    department: "الإدارة العليا",
    civilId: "109847291",
    bankName: "بنك مسقط",
    bankIban: "OM4500010000000012345678901",
    branchName: "فرع صحار الرئيسي",
    basicSalary: 1200,
    housingAllowance: 200,
    transportAllowance: 100,
    otherAllowances: 0,
    bonus: 150,
    deductions: 0,
    socialSecurityDeduction: 84, // 7% of basic
    netSalary: 1566,
    status: "PAID",
    paymentDate: "2026-08-27",
    paymentMethod: "BANK_TRANSFER",
    referenceNo: "WPS-OM-2026-08-01",
    notes: "تم التحويل لحساب بنك مسقط عبر نظام حماية الأجور (WPS)",
    generatedAt: "2026-08-25T08:00:00Z"
  },
  {
    id: "pay-2",
    payrollMonth: "2026-08",
    employeeId: "emp-2",
    employeeCode: "EMP-002",
    employeeName: "فاطمة بنت ناصر البلوشي",
    fullNameEn: "Fatima Nasser Al-Balushi",
    jobTitle: "رئيسة قسم المحاسبة والمالية",
    department: "المالية والمحاسبة",
    civilId: "118274910",
    bankName: "بنك ظفار",
    bankIban: "OM960111000000001041112233001",
    branchName: "فرع صحار الرئيسي",
    basicSalary: 850,
    housingAllowance: 100,
    transportAllowance: 50,
    otherAllowances: 0,
    bonus: 50,
    deductions: 0,
    socialSecurityDeduction: 59.5,
    netSalary: 990.5,
    status: "PAID",
    paymentDate: "2026-08-27",
    paymentMethod: "BANK_TRANSFER",
    referenceNo: "WPS-OM-2026-08-02",
    notes: "تم التحويل لحساب بنك ظفار",
    generatedAt: "2026-08-25T08:00:00Z"
  },
  {
    id: "pay-3",
    payrollMonth: "2026-08",
    employeeId: "emp-3",
    employeeCode: "EMP-003",
    employeeName: "طارق بن سالم المعمري",
    fullNameEn: "Tariq Salem Al-Maamari",
    jobTitle: "مشرف مبيعات وتنفيذي عقود",
    department: "المبيعات والمشاريع",
    civilId: "103847294",
    bankName: "البنك الوطني العماني",
    bankIban: "OM2300020000000098765432101",
    branchName: "فرع صحار الرئيسي",
    basicSalary: 650,
    housingAllowance: 80,
    transportAllowance: 40,
    otherAllowances: 0,
    bonus: 80, // Sales commission
    deductions: 10,
    socialSecurityDeduction: 45.5,
    netSalary: 794.5,
    status: "PAID",
    paymentDate: "2026-08-27",
    paymentMethod: "BANK_TRANSFER",
    referenceNo: "WPS-OM-2026-08-03",
    notes: "يشمل عمولة مبيعات وإغلاق عقود جديدة",
    generatedAt: "2026-08-25T08:00:00Z"
  },
  {
    id: "pay-4",
    payrollMonth: "2026-08",
    employeeId: "emp-4",
    employeeCode: "EMP-004",
    employeeName: "خالد بن خلفان الحوسني",
    fullNameEn: "Khalid Khalfan Al-Hosni",
    jobTitle: "أمين المستودعات المركزية",
    department: "المستودعات واللوجستيات",
    civilId: "129847119",
    bankName: "بنك مسقط",
    bankIban: "OM4500010000000055443322110",
    branchName: "فرع صحار الرئيسي",
    basicSalary: 550,
    housingAllowance: 70,
    transportAllowance: 30,
    otherAllowances: 0,
    bonus: 0,
    deductions: 0,
    socialSecurityDeduction: 38.5,
    netSalary: 611.5,
    status: "APPROVED",
    paymentMethod: "BANK_TRANSFER",
    referenceNo: "WPS-OM-2026-08-04",
    notes: "معتمد وجاهز للتحويل",
    generatedAt: "2026-08-25T08:00:00Z"
  },
  {
    id: "pay-5",
    payrollMonth: "2026-08",
    employeeId: "emp-5",
    employeeCode: "EMP-005",
    employeeName: "مريم بنت حمد الكعبي",
    fullNameEn: "Maryam Hamad Al-Kaabi",
    jobTitle: "مسؤولة الاستقبال والخدمات",
    department: "خدمة العملاء والاستقبال",
    civilId: "134857201",
    bankName: "بنك صحار الدولي",
    bankIban: "OM7100050000000011223344556",
    branchName: "فرع مسقط - الغبرة",
    basicSalary: 500,
    housingAllowance: 60,
    transportAllowance: 40,
    otherAllowances: 0,
    bonus: 30,
    deductions: 0,
    socialSecurityDeduction: 35,
    netSalary: 595,
    status: "APPROVED",
    paymentMethod: "BANK_TRANSFER",
    referenceNo: "WPS-OM-2026-08-05",
    notes: "معتمد وجاهز للتحويل",
    generatedAt: "2026-08-25T08:00:00Z"
  }
];

export const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "leave-1",
    employeeId: "emp-3",
    employeeName: "طارق بن سالم المعمري",
    employeeCode: "EMP-003",
    jobTitle: "مشرف مبيعات وتنفيذي عقود",
    department: "المبيعات والمشاريع",
    leaveType: "ANNUAL",
    startDate: "2026-09-10",
    endDate: "2026-09-17",
    daysCount: 7,
    reason: "إجازة سنوية اعتيادية",
    status: "APPROVED",
    appliedAt: "2026-08-20T10:00:00Z",
    reviewedBy: "سعيد بن راشد الشحي",
    reviewedAt: "2026-08-21T09:30:00Z",
    reviewNotes: "تمت الموافقة وتعيين البديل"
  },
  {
    id: "leave-2",
    employeeId: "emp-5",
    employeeName: "مريم بنت حمد الكعبي",
    employeeCode: "EMP-005",
    jobTitle: "مسؤولة الاستقبال والخدمات",
    department: "خدمة العملاء والاستقبال",
    leaveType: "EMERGENCY",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    daysCount: 2,
    reason: "ظرف عائلي طارئ",
    status: "PENDING",
    appliedAt: "2026-08-28T14:15:00Z"
  }
];

export function loadAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load attendance records:", e);
  }
  saveAttendanceRecords(DEFAULT_ATTENDANCE_RECORDS);
  return DEFAULT_ATTENDANCE_RECORDS;
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save attendance records:", e);
  }
}

export function loadPayrollSlips(): PayrollSlip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYROLL_SLIPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load payroll slips:", e);
  }
  savePayrollSlips(DEFAULT_PAYROLL_SLIPS);
  return DEFAULT_PAYROLL_SLIPS;
}

export function savePayrollSlips(slips: PayrollSlip[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYROLL_SLIPS, JSON.stringify(slips));
  } catch (e) {
    console.error("Failed to save payroll slips:", e);
  }
}

export function loadLeaveRequests(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load leave requests:", e);
  }
  saveLeaveRequests(DEFAULT_LEAVE_REQUESTS);
  return DEFAULT_LEAVE_REQUESTS;
}

export function saveLeaveRequests(requests: LeaveRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
  } catch (e) {
    console.error("Failed to save leave requests:", e);
  }
}

// -------------------------------------------------------------------
// POS (POINT OF SALE - مبيعات الكاشير ونقاط البيع) LOGIC & HELPERS
// -------------------------------------------------------------------

export const DEFAULT_POS_ORDERS: POSOrder[] = [
  {
    id: "pos-ord-1",
    orderNumber: "POS-2026-0001",
    voucherNumber: "INV-2026-0850",
    date: "2026-08-25",
    time: "10:15:30",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    warehouse: "المستودع الرئيسي - صحار",
    cashierId: "emp-1",
    cashierName: "سعيد بن راشد الشحي",
    customerId: "cust-1",
    customerName: "شركة الدليل الشامل",
    customerPhone: "+968 77627500",
    customerTaxId: "OM-TAX-7762",
    items: [
      {
        id: "item-pos-1",
        itemId: "item-1",
        sku: "CAM-IP4K-DOME",
        barcode: "629104882001",
        name: "كاميرا مراقبة شبكية 4K IP Dome بدقة 8 ميجابكسل",
        quantity: 2,
        unitPrice: 48.0,
        costPrice: 28.5,
        discount: 0,
        taxRate: 5,
        taxAmount: 4.8,
        total: 100.8,
        unit: "حبة",
        category: "كاميرات مراقبة وأمن"
      },
      {
        id: "item-pos-2",
        itemId: "item-4",
        sku: "SW-POE-24G",
        barcode: "629104882004",
        name: "سويتش شبكات 24 منفذ Gigabit PoE+ مع 4 منافذ SFP 10G",
        quantity: 1,
        unitPrice: 130.0,
        costPrice: 75.0,
        discount: 0,
        taxRate: 5,
        taxAmount: 6.5,
        total: 136.5,
        unit: "جهاز",
        category: "شبكات وربط سحابي"
      }
    ],
    subtotal: 226.0,
    taxRate: 5,
    taxAmount: 11.3,
    discountType: "PERCENT",
    discountValue: 0,
    discountAmount: 0,
    totalAmount: 237.3,
    currency: "OMR",
    paymentMethod: "SPLIT",
    splitPayments: [
      { id: "sp-1", method: "CASH", amount: 100.0 },
      { id: "sp-2", method: "CREDIT_CARD", amount: 137.3, reference: "MADA-99201" }
    ],
    cashReceived: 100.0,
    changeDue: 0,
    status: "COMPLETED",
    shiftId: "shift-001",
    notes: "تم البيع والتسليم المباشر من نقطة بيع فرع صحار",
    createdAt: "2026-08-25T10:15:30Z",
    updatedAt: "2026-08-25T10:15:30Z"
  },
  {
    id: "pos-ord-2",
    orderNumber: "POS-2026-0002",
    voucherNumber: "INV-2026-0851",
    date: "2026-08-25",
    time: "11:40:12",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    warehouse: "المستودع الرئيسي - صحار",
    cashierId: "emp-3",
    cashierName: "خالد بن خلفان المعمري",
    customerId: "cust-2",
    customerName: "مؤسسة الأفق للحلول الذكية",
    customerPhone: "+968 91234567",
    customerTaxId: "OM-TAX-4501",
    items: [
      {
        id: "item-pos-3",
        itemId: "item-2",
        sku: "SCR-TOUCH-85IN",
        barcode: "629104882002",
        name: "شاشة تفاعلية ذكية 85 بوصة 4K Ultra HD بنظام Android/Windows",
        quantity: 1,
        unitPrice: 950.0,
        costPrice: 650.0,
        discount: 50.0,
        taxRate: 5,
        taxAmount: 45.0,
        total: 945.0,
        unit: "شاشة",
        category: "شاشات تفاعلية وذكية"
      }
    ],
    subtotal: 900.0,
    taxRate: 5,
    taxAmount: 45.0,
    discountType: "FIXED",
    discountValue: 50.0,
    discountAmount: 50.0,
    totalAmount: 945.0,
    currency: "OMR",
    paymentMethod: "CARD",
    cashReceived: 945.0,
    changeDue: 0,
    status: "COMPLETED",
    shiftId: "shift-001",
    notes: "شامل خصم خاص للعميل المعتمد",
    createdAt: "2026-08-25T11:40:12Z",
    updatedAt: "2026-08-25T11:40:12Z"
  },
  {
    id: "pos-ord-3",
    orderNumber: "POS-2026-0003",
    voucherNumber: "INV-2026-0852",
    date: "2026-08-26",
    time: "09:20:45",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    warehouse: "المستودع الرئيسي - صحار",
    cashierId: "emp-1",
    cashierName: "سعيد بن راشد الشحي",
    customerName: "عميل نقدي سريع (Walk-in)",
    customerPhone: "+968 98001122",
    items: [
      {
        id: "item-pos-4",
        itemId: "item-5",
        sku: "CBL-CAT6-305M",
        barcode: "629104882005",
        name: "لفة كابل شبكة Cat6 نحاس نقي 100% خارجي 305 متر",
        quantity: 1,
        unitPrice: 52.0,
        costPrice: 32.0,
        discount: 0,
        taxRate: 5,
        taxAmount: 2.6,
        total: 54.6,
        unit: "لفة",
        category: "كابلات وتمديدات"
      }
    ],
    subtotal: 52.0,
    taxRate: 5,
    taxAmount: 2.6,
    discountType: "PERCENT",
    discountValue: 0,
    discountAmount: 0,
    totalAmount: 54.6,
    currency: "OMR",
    paymentMethod: "CASH",
    cashReceived: 60.0,
    changeDue: 5.4,
    status: "COMPLETED",
    shiftId: "shift-002",
    notes: "دفع نقدي فوري - إرجاع الباقي 5.400 ر.ع.",
    createdAt: "2026-08-26T09:20:45Z",
    updatedAt: "2026-08-26T09:20:45Z"
  }
];

export const DEFAULT_CASHIER_SHIFTS: CashierShift[] = [
  {
    id: "shift-001",
    shiftNumber: "SH-2026-001",
    cashierId: "emp-1",
    cashierName: "سعيد بن راشد الشحي",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    openedAt: "2026-08-25T08:00:00Z",
    closedAt: "2026-08-25T17:00:00Z",
    openingCash: 50.0,
    expectedCash: 150.0,
    actualCash: 150.0,
    difference: 0,
    totalSalesCash: 100.0,
    totalSalesCard: 1082.3,
    totalSalesCredit: 0,
    totalSalesOnline: 0,
    totalSalesBank: 0,
    totalReturns: 0,
    totalDiscounts: 50.0,
    totalTax: 56.3,
    totalNetSales: 1182.3,
    ordersCount: 2,
    cashMovements: [],
    status: "CLOSED",
    notes: "إغلاق وردية اليوم السابق - الحسابات مطابقة تماماً بدون عجز أو زيادة."
  },
  {
    id: "shift-002",
    shiftNumber: "SH-2026-002",
    cashierId: "emp-1",
    cashierName: "سعيد بن راشد الشحي",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    openedAt: "2026-08-26T08:00:00Z",
    openingCash: 50.0,
    expectedCash: 104.6,
    totalSalesCash: 54.6,
    totalSalesCard: 0,
    totalSalesCredit: 0,
    totalSalesOnline: 0,
    totalSalesBank: 0,
    totalReturns: 0,
    totalDiscounts: 0,
    totalTax: 2.6,
    totalNetSales: 54.6,
    ordersCount: 1,
    cashMovements: [],
    status: "OPEN",
    notes: "الوردية النشطة حالياً للكاشير."
  }
];

export function loadPOSOrders(): POSOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POS_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load POS orders from localStorage:", e);
  }
  savePOSOrders(DEFAULT_POS_ORDERS);
  return DEFAULT_POS_ORDERS;
}

export function savePOSOrders(orders: POSOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POS_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save POS orders:", e);
  }
}

export function loadPOSHeldCarts(): POSHeldCart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POS_HELD_CARTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load POS held carts:", e);
  }
  return [];
}

export function savePOSHeldCarts(carts: POSHeldCart[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POS_HELD_CARTS, JSON.stringify(carts));
  } catch (e) {
    console.error("Failed to save POS held carts:", e);
  }
}

export function loadCashierShifts(): CashierShift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASHIER_SHIFTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load cashier shifts:", e);
  }
  saveCashierShifts(DEFAULT_CASHIER_SHIFTS);
  return DEFAULT_CASHIER_SHIFTS;
}

export function saveCashierShifts(shifts: CashierShift[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CASHIER_SHIFTS, JSON.stringify(shifts));
  } catch (e) {
    console.error("Failed to save cashier shifts:", e);
  }
}

export function loadActiveShift(): CashierShift | null {
  const allShifts = loadCashierShifts();
  const openShift = allShifts.find((s) => s.status === "OPEN");
  return openShift || null;
}

export const DEFAULT_RECURRING_SCHEDULES: RecurringSchedule[] = [
  {
    id: "rec-1",
    scheduleCode: "REC-2026-001",
    title: "قسط تمويل السيارة - لاندكروزر (شركة التمويل)",
    type: "PAYMENT",
    frequency: "MONTHLY",
    amount: 250,
    currency: "OMR",
    partyName: "شركة مسقط للتمويل وتأجير المركبات",
    partyType: "SUPPLIER",
    partyPhone: "+968 24500000",
    category: "أقساط سيارات وتمويل",
    paymentMethod: "BANK_TRANSFER",
    bankName: "بنك مسقط (Bank Muscat)",
    startDate: "2026-01-15",
    totalOccurrences: 36,
    completedOccurrences: 8,
    nextDueDate: "2026-09-15",
    lastExecutedDate: "2026-08-15",
    autoGenerateVoucher: true,
    reminderDaysBefore: 3,
    status: "ACTIVE",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    description: "القسط الشهري لمركبة العمل - عقد تمويل رقم MFC-9921",
    executions: [
      {
        id: "exec-1",
        voucherId: "voucher-rec-08",
        voucherNumber: "PV-2026-0815",
        executionDate: "2026-08-15",
        dueDate: "2026-08-15",
        amount: 250,
        currency: "OMR",
        status: "POSTED",
        notes: "تم سداد القسط رقم 8 بنجاح عبر تحويل بنكي",
        createdAt: "2026-08-15T10:00:00Z"
      }
    ],
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-08-15T10:00:00Z"
  },
  {
    id: "rec-2",
    scheduleCode: "REC-2026-002",
    title: "إيجار مقر الفرع والمستودع (كل 3 أشهر - ربع سنوي)",
    type: "PAYMENT",
    frequency: "QUARTERLY",
    amount: 1200,
    currency: "OMR",
    partyName: "الشيخ سالم بن راشد المعمري (مالك العقار)",
    partyType: "OTHER",
    partyPhone: "+968 99881122",
    category: "إيجارات ومقرات",
    paymentMethod: "CHECK",
    bankName: "بنك ظفار",
    startDate: "2026-01-01",
    totalOccurrences: 8,
    completedOccurrences: 3,
    nextDueDate: "2026-10-01",
    lastExecutedDate: "2026-07-01",
    autoGenerateVoucher: true,
    reminderDaysBefore: 7,
    status: "ACTIVE",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    description: "إيجار ربع سنوي لمقر الشركة والمستودع - عقد موثق بلدية صحار",
    executions: [
      {
        id: "exec-2",
        voucherId: "voucher-rec-07",
        voucherNumber: "PV-2026-0701",
        executionDate: "2026-07-01",
        dueDate: "2026-07-01",
        amount: 1200,
        currency: "OMR",
        status: "POSTED",
        notes: "سداد شيك إيجار الربع الثالث",
        createdAt: "2026-07-01T09:00:00Z"
      }
    ],
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-07-01T09:00:00Z"
  },
  {
    id: "rec-3",
    scheduleCode: "REC-2026-003",
    title: "فاتورة باقة إنترنت الأعمال والاتصالات الفايبر",
    type: "PAYMENT",
    frequency: "MONTHLY",
    amount: 45,
    currency: "OMR",
    partyName: "الشركة العمانية للاتصالات (عمانتل Omantel)",
    partyType: "SUPPLIER",
    partyPhone: "+968 24242424",
    category: "خدمات إنترنت واتصالات",
    paymentMethod: "ONLINE",
    startDate: "2026-01-01",
    totalOccurrences: 0,
    completedOccurrences: 8,
    nextDueDate: "2026-09-01",
    lastExecutedDate: "2026-08-01",
    autoGenerateVoucher: true,
    reminderDaysBefore: 3,
    status: "ACTIVE",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    description: "اشتراك باقة فايبر الأعمال بسرعة 500Mbps مع عنوان IP ثابت",
    executions: [
      {
        id: "exec-3",
        voucherId: "voucher-rec-08-net",
        voucherNumber: "PV-2026-0801",
        executionDate: "2026-08-01",
        dueDate: "2026-08-01",
        amount: 45,
        currency: "OMR",
        status: "POSTED",
        notes: "سداد إلكتروني عبر بوابة عمانتل",
        createdAt: "2026-08-01T11:00:00Z"
      }
    ],
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-08-01T11:00:00Z"
  },
  {
    id: "rec-4",
    scheduleCode: "REC-2026-004",
    title: "عقد صيانة الكاميرات والشبكات - مركز الدليل الشامل (إيراد دوري)",
    type: "RECEIPT",
    frequency: "MONTHLY",
    amount: 350,
    currency: "OMR",
    partyName: "شركة الدليل الشامل",
    partyType: "CUSTOMER",
    partyPhone: "+968 77627500",
    partyEmail: "info@deshalbm.com",
    category: "عقود صيانة ودعم فني",
    paymentMethod: "BANK_TRANSFER",
    bankName: "بنك ظفار",
    startDate: "2026-01-10",
    totalOccurrences: 24,
    completedOccurrences: 8,
    nextDueDate: "2026-09-10",
    lastExecutedDate: "2026-08-10",
    autoGenerateVoucher: true,
    reminderDaysBefore: 5,
    status: "ACTIVE",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    description: "دفعة عقد الدعم الفني والصيانة الوقائية للشاشات التفاعلية والسيرفرات",
    executions: [
      {
        id: "exec-4",
        voucherId: "voucher-rec-08-desh",
        voucherNumber: "RV-2026-0810",
        executionDate: "2026-08-10",
        dueDate: "2026-08-10",
        amount: 350,
        currency: "OMR",
        status: "POSTED",
        notes: "استلام دفعة الصيانة الشهرية عبر تحويل بنكي",
        createdAt: "2026-08-10T14:00:00Z"
      }
    ],
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-08-10T14:00:00Z"
  },
  {
    id: "rec-5",
    scheduleCode: "REC-2026-005",
    title: "وثيقة التأمين الشامل للمركبات ومستودع الشركة",
    type: "PAYMENT",
    frequency: "ANNUALLY",
    amount: 480,
    currency: "OMR",
    partyName: "شركة ظفار للتأمين",
    partyType: "SUPPLIER",
    category: "تأمين ومخاطر",
    paymentMethod: "BANK_TRANSFER",
    startDate: "2026-04-15",
    totalOccurrences: 5,
    completedOccurrences: 1,
    nextDueDate: "2027-04-15",
    lastExecutedDate: "2026-04-15",
    autoGenerateVoucher: false,
    reminderDaysBefore: 14,
    status: "ACTIVE",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    description: "التأمين السنوي الشامل على أسطول المركبات والمعدات التقنية",
    executions: [
      {
        id: "exec-5",
        voucherId: "voucher-rec-ins-1",
        voucherNumber: "PV-2026-0415",
        executionDate: "2026-04-15",
        dueDate: "2026-04-15",
        amount: 480,
        currency: "OMR",
        status: "POSTED",
        notes: "سداد قسط التأمين السنوي",
        createdAt: "2026-04-15T09:00:00Z"
      }
    ],
    createdAt: "2026-04-15T08:00:00Z",
    updatedAt: "2026-04-15T09:00:00Z"
  }
];

export function loadRecurringSchedules(): RecurringSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECURRING_SCHEDULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load recurring schedules:", e);
  }
  saveRecurringSchedules(DEFAULT_RECURRING_SCHEDULES);
  return DEFAULT_RECURRING_SCHEDULES;
}

export function saveRecurringSchedules(schedules: RecurringSchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECURRING_SCHEDULES, JSON.stringify(schedules));
  } catch (e) {
    console.error("Failed to save recurring schedules:", e);
  }
}

export function loadWhatsAppLogs(): WhatsAppMessageLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WHATSAPP_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load WhatsApp logs:", e);
  }
  return [];
}

export function saveWhatsAppLog(log: WhatsAppMessageLog): void {
  try {
    const logs = loadWhatsAppLogs();
    logs.unshift(log);
    const trimmed = logs.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save WhatsApp log:", e);
  }
}

export function clearWhatsAppLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WHATSAPP_LOGS);
  } catch (e) {
    console.error("Failed to clear WhatsApp logs:", e);
  }
}

// ----------------------------------------------------
// Rental Spaces & Smart Bookings Management
// ----------------------------------------------------

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

export const DEFAULT_SPACE_BOOKINGS: SpaceBooking[] = [
  {
    id: "bk-1001",
    bookingNumber: "BK-2026-0001",
    spaceId: "space-1",
    spaceName: "قاعة الابتكار والتدريب الكبرى",
    spaceType: "TRAINING_HALL",
    branchId: "branch-1",
    branchName: "الفرع الرئيسي - مسقط",
    customerId: "cust-1",
    customerName: "شركة مسقط للحلول الرقمية",
    customerPhone: "+968 9123 4567",
    customerEmail: "training@muscatsolutions.om",
    rentalType: "HOURLY",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endDate: new Date().toISOString().split("T")[0],
    endTime: "13:00",
    duration: 4,
    unitPrice: 18,
    subtotal: 72,
    discountAmount: 0,
    taxAmount: 3.6,
    totalAmount: 75.6,
    currency: "OMR",
    attendeesCount: 28,
    purpose: "برنامج تدريب الذكاء الاصطناعي وإدارة المشاريع",
    selectedAmenities: ["wifi", "smart_screen", "coffee", "sound"],
    hospitalityNotes: "توفير بوفيه شاي وقهوة وتمر عند الساعة 10:30 صباحاً",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod: "BANK_TRANSFER",
    createdByType: "STAFF",
    createdByName: "سالم الحارثي",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "bk-1002",
    bookingNumber: "BK-2026-0002",
    spaceId: "space-2",
    spaceName: "قاعة الاجتماعات التنفيذية VIP",
    spaceType: "MEETING_ROOM",
    branchId: "branch-1",
    branchName: "الفرع الرئيسي - مسقط",
    customerName: "مؤسسة النخبة للاستشارات",
    customerPhone: "+968 9988 7766",
    customerEmail: "info@nokhba-om.com",
    rentalType: "HOURLY",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "14:00",
    endDate: new Date().toISOString().split("T")[0],
    endTime: "17:00",
    duration: 3,
    unitPrice: 12,
    subtotal: 36,
    discountAmount: 0,
    taxAmount: 1.8,
    totalAmount: 37.8,
    currency: "OMR",
    attendeesCount: 10,
    purpose: "اجتماع مجلس الإدارة الربع سنوي",
    selectedAmenities: ["wifi", "smart_screen", "coffee"],
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod: "CREDIT_CARD",
    createdByType: "CLIENT_SELF_SERVICE",
    customerCompany: "مؤسسة النخبة",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function loadRentalSpaces(): RentalSpace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SPACES);
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
    localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(spaces));
  } catch (e) {
    console.error("Failed to save rental spaces:", e);
  }
}

export function loadSpaceBookings(): SpaceBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
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
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error("Failed to save space bookings:", e);
  }
}

// ----------------------------------------------------
// CONSULTING & ADMINISTRATIVE SERVICES DEFAULTS
// (كتالوج الخدمات الاستشارية والإدارية)
// ----------------------------------------------------

export const DEFAULT_CONSULTING_SERVICES: ConsultingService[] = [
  // 1. المحاسبة والمالية
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
  },

  // 2. التسويق الرقمي
  {
    id: "srv-mkt-01",
    code: "SRV-MKT-01",
    name: "إطلاق وإدارة الحملات الإعلانية الممولة (Meta / Google / TikTok)",
    nameEn: "Paid Ads Campaign Management",
    category: "MARKETING",
    shortDescription: "استهداف دقيق للجمهور في سلطنة عمان والخليج، كتابة الإعلانات وتتبع التحويلات لتحقيق أعلى عائد ROI.",
    pricingModel: "MONTHLY_RETAINER",
    basePrice: 180,
    currency: "OMR",
    estimatedDuration: "شهر كامل",
    deliveryTime: "إطلاق الحملات خلال 3 أيام عمل",
    deliverables: ["إعداد البكسل وتتبع التحويل", "تصميم وكتابة 8 إعلانات تفاعلية", "تقرير أسبوعي وشهري بالنتائج والتكلفة"],
    includedInTenantPackage: false,
    icon: "TrendingUp",
    color: "#2563eb",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-mkt-02",
    code: "SRV-MKT-02",
    name: "استشارة خطة التسويق والنمو الاستراتيجي",
    nameEn: "Strategic Marketing & Growth Consultation",
    category: "MARKETING",
    shortDescription: "جلسة استشارية متخصصة لتحليل السوق والمنافسين وتحديد القنوات البيعية الأكثر كفاءة لمنتجاتك.",
    pricingModel: "PER_CONSULTATION",
    basePrice: 35,
    currency: "OMR",
    estimatedDuration: "جلسة 60 دقيقة",
    deliveryTime: "فوري أثناء الجلسة مع تقرير توصيات",
    deliverables: ["خارطة طريق تسويقية لـ 90 يوماً", "تحليل الفئات المستهدفة", "توصيات قنوات الاستحواذ"],
    includedInTenantPackage: true,
    icon: "Target",
    color: "#3b82f6",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 3. الاستوديو الإعلامي والتصوير
  {
    id: "srv-media-01",
    code: "SRV-MED-01",
    name: "جلسة تسجيل بودكاست احترافية مع هندسة الصوت والمونتاج",
    nameEn: "Podcast Recording & Audio Engineering Session",
    category: "MEDIA_STUDIO",
    shortDescription: "استوديو مجهز بالكامل بمايكات Shure SM7B، إضاءة سينمائية، تسجيل فيديو 4K ومونتاج متكامل.",
    pricingModel: "HOURLY",
    basePrice: 40,
    currency: "OMR",
    estimatedDuration: "بالساعة (جلسة إنتاج)",
    deliveryTime: "تسليم الحلقة المجهزة خلال 4 أيام عمل",
    deliverables: ["تسجيل صوتي عالي النقاء", "تسجيل كاميرات متعددة 4K", "مقطع الحلقة الكامل + 3 مقاطع ريلز قصيرة"],
    includedInTenantPackage: true,
    icon: "Mic",
    color: "#8b5cf6",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-media-02",
    code: "SRV-MED-02",
    name: "جلسة تصوير منتجات وشخصيات أعمال (Corporate & Product Shoot)",
    nameEn: "Corporate & Product Photography Studio",
    category: "MEDIA_STUDIO",
    shortDescription: "تصوير احترافي لخلفيات المنتجات البيضاء والإعلانية وصور البورتريه التنفيذية للكوادر الإدارية.",
    pricingModel: "FIXED_PRICE",
    basePrice: 85,
    currency: "OMR",
    estimatedDuration: "جلسة 2 ساعة",
    deliveryTime: "تسليم الصور المعالجة خلال 3 أيام",
    deliverables: ["20 صورة عالية الدقة معالجة بالألوان", "تفريغ خلفيات المنتجات", "حقوق الاستخدام التجاري الكاملة"],
    includedInTenantPackage: true,
    icon: "Camera",
    color: "#a855f7",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 4. صناعة المحتوى والكتابة
  {
    id: "srv-cnt-01",
    code: "SRV-CNT-01",
    name: "صناعة وتعديل مقاطع الفيديو القصيرة (Reels / Shorts / TikTok)",
    nameEn: "Short-Form Video Content & Editing Pack",
    category: "CONTENT_CREATION",
    shortDescription: "كتابة سكريبت جذاب، مؤثرات بصرية وصوتية، ونصوص ديناميكية تضمن زيادة المشاهدات والتفاعل.",
    pricingModel: "FIXED_PRICE",
    basePrice: 60,
    currency: "OMR",
    estimatedDuration: "باقة 5 مقاطع فيديو",
    deliveryTime: "خلال 5 أيام عمل",
    deliverables: ["5 فيديوهات قصيرة ممنتجة بالكامل بجودة 4K", "كتابة سيناريو مخصص", "نصوص وكابشن تفاعلي"],
    includedInTenantPackage: true,
    icon: "Video",
    color: "#ec4899",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-cnt-02",
    code: "SRV-CNT-02",
    name: "صياغة الملف التعريفي للشركة (Company Profile)",
    nameEn: "Corporate Profile Copywriting & Editorial",
    category: "CONTENT_CREATION",
    shortDescription: "كتابة المحتوى المؤسسي للشركة بأسلوب راقٍ ومقنع يشمل الرؤية والرسالة، نبذة الشركة وسرد الخدمات.",
    pricingModel: "FIXED_PRICE",
    basePrice: 90,
    currency: "OMR",
    estimatedDuration: "3 إلى 5 أيام عمل",
    deliveryTime: "تسليم المسودة خلال 3 أيام",
    deliverables: ["محتوى نصي كامل باللغتين العربية والإنجليزية", "صياغة الهيكل التعريفي والخدمات", "مراجعة وتدقيق لغوي"],
    includedInTenantPackage: false,
    icon: "FileText",
    color: "#f43f5e",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 5. إدارة حسابات التواصل الاجتماعي
  {
    id: "srv-soc-01",
    code: "SRV-SOC-01",
    name: "الباقة الشهرية المتكاملة لإدارة حسابات التواصل الاجتماعي",
    nameEn: "Comprehensive Monthly Social Media Management",
    category: "SOCIAL_MEDIA",
    shortDescription: "خطة محتوى شهرية، 16 تصميماً ومنشوراً تفاعلياً، الرد على الرسائل والتعليقات والتقارير الشهرية.",
    pricingModel: "MONTHLY_RETAINER",
    basePrice: 195,
    currency: "OMR",
    estimatedDuration: "شهر كامل",
    deliveryTime: "نشر مجدول منتظم طوال الشهر",
    deliverables: ["16 بوست وريلز احترافي", "إدارة الردود والرسائل الخاصة", "تقرير تحليلي ربع شهري وشهري"],
    includedInTenantPackage: false,
    icon: "Share2",
    color: "#06b6d4",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 6. المواقع والمتاجر الإلكترونية
  {
    id: "srv-web-01",
    code: "SRV-WEB-01",
    name: "تصميم وتطوير موقع إلكتروني تعريفي حديث ومتجاوب",
    nameEn: "Responsive Corporate Website Development",
    category: "WEB_DEVELOPMENT",
    shortDescription: "موقع تفاعلي فائق السرعة، متوافق مع كافة الهواتف، ربط دومين وشهادة أمان SSL، ونموذج تواصل ذكي.",
    pricingModel: "FIXED_PRICE",
    basePrice: 280,
    currency: "OMR",
    estimatedDuration: "7 إلى 10 أيام عمل",
    deliveryTime: "تسليم أولي خلال 5 أيام",
    deliverables: ["موقع تعريفي 5 صفحات", "لوحة تحكم سهلة لإدارة المحتوى", "ربط الدومين والاستضافة المجانية لمدة سنة", "تهيئة لمحركات البحث SEO"],
    includedInTenantPackage: false,
    icon: "Globe",
    color: "#3b82f6",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-web-02",
    code: "SRV-WEB-02",
    name: "إنشاء متجر إلكتروني متكامل مع بوابات الدفع العمانية",
    nameEn: "E-Commerce Store Setup with Omani Payment Gateways",
    category: "WEB_DEVELOPMENT",
    shortDescription: "متجر متكامل يدعم الدفع ببطاقات الخصم المباشر (Benefit/Debit) وبطاقات الائتمان، وربط شركات الشحن والتوصيل.",
    pricingModel: "FIXED_PRICE",
    basePrice: 420,
    currency: "OMR",
    estimatedDuration: "12 إلى 15 يوم عمل",
    deliveryTime: "تسليم نهائي مع تدريب الطاقم",
    deliverables: ["تصميم متجر عصري مخصص", "ربط بوابة الدفع الإلكتروني", "إدخال أول 30 منتجاً مع التصنيفات", "ربط رسائل الواتساب الآلية للطلبات"],
    includedInTenantPackage: false,
    icon: "ShoppingCart",
    color: "#6366f1",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 7. إدارة شؤون الموظفين والموارد البشرية (HR)
  {
    id: "srv-hr-01",
    code: "SRV-HR-01",
    name: "إعداد مسيرات الرواتب الشهرية ونظام حماية الأجور (WPS)",
    nameEn: "Monthly Payroll Processing & WPS Compliance",
    category: "HR_MANAGEMENT",
    shortDescription: "احتساب البدلات والخصومات وساعات العمل الإضافي، وتجهيز ملفات البنوك المتوافقة مع نظام WPS العماني.",
    pricingModel: "MONTHLY_RETAINER",
    basePrice: 65,
    currency: "OMR",
    estimatedDuration: "شهري مستمر",
    deliveryTime: "تجهيز مسير الرواتب قبل يوم 25 من كل شهر",
    deliverables: ["كشف مسير الرواتب المعتمد", "ملف البنك SIF/WPS للتحويل الفوري", "قسائم رواتب الموظفين الرقمية"],
    includedInTenantPackage: true,
    icon: "Users",
    color: "#d97706",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-hr-02",
    code: "SRV-HR-02",
    name: "صياغة عقود العمل واللوائح الداخلية للشركات",
    nameEn: "Employment Contracts & Internal Work Regulations",
    category: "HR_MANAGEMENT",
    shortDescription: "صياغة وتحديث عقود العمل وفق قانون العمل العماني الجديد ولوائح العمل والجزاءات المعتمدة من وزارة العمل.",
    pricingModel: "PER_TRANSACTION",
    basePrice: 50,
    currency: "OMR",
    estimatedDuration: "2 إلى 3 أيام عمل",
    deliveryTime: "تسليم العقود واللوائح بصيغ قابلة للتحرير",
    deliverables: ["نموذج عقد عمل متوافق مع قانون العمل", "لائحة الجزاءات والمكافآت", "إرشادات التسجيل في التأمينات الاجتماعية"],
    includedInTenantPackage: true,
    icon: "Briefcase",
    color: "#b45309",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 8. تأسيس الأعمال والشركات
  {
    id: "srv-biz-01",
    code: "SRV-BIZ-01",
    name: "تأسيس وتسجيل الشركات التجارية واستخراج السجل التجاري",
    nameEn: "Commercial Registration & Company Formation",
    category: "BUSINESS_SETUP",
    shortDescription: "استخراج السجل التجاري (استثمار محلي أو أجنبي بنسبة 100%)، حجز الاسم التجاري، واختيار الأنشطة والتراخيص.",
    pricingModel: "FIXED_PRICE",
    basePrice: 120,
    currency: "OMR",
    estimatedDuration: "3 إلى 5 أيام عمل",
    deliveryTime: "استكمال كافة الإجراءات الرسمية",
    deliverables: ["السجل التجاري وشهادة الانتساب للغرفة", "عقد التأسيس والنظام الأساسي", "شهادة البيانات الرسمية"],
    includedInTenantPackage: false,
    icon: "Building",
    color: "#0f766e",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-biz-02",
    code: "SRV-BIZ-02",
    name: "جلسة استشارية لتأسيس الأعمال وهيكلة الشركات",
    nameEn: "Business Setup & Corporate Structuring Consultation",
    category: "BUSINESS_SETUP",
    shortDescription: "استشارة قانونية وتجارية شاملة لاختيار الشكل القانوني الأنسب، خطة التعمين، وتراخيص الأنشطة الاقتصادية.",
    pricingModel: "PER_CONSULTATION",
    basePrice: 30,
    currency: "OMR",
    estimatedDuration: "جلسة 45 دقيقة",
    deliveryTime: "فوري مع ملخص تنفيذي",
    deliverables: ["تقرير الأنشطة الموصى بها", "دليل الرسوم الحكومية والمتطلبات", "خطة التأسيس والامتثال"],
    includedInTenantPackage: true,
    icon: "Layers",
    color: "#14b8a6",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 9. خدمات الـ PRO ومتابعة المعاملات الحكومية
  {
    id: "srv-pro-01",
    code: "SRV-PRO-01",
    name: "خدمات الـ PRO ومتابعة المعاملات الحكومية الشاملة",
    nameEn: "Government Relations & PRO Services Support",
    category: "PRO_SERVICES",
    shortDescription: "تخليص وتجديد تراخيص البلدية، تصاريح الدفاع المدني، تأشيرات العمل والمقيمين، وتراخيص وزارة التجارة.",
    pricingModel: "PER_TRANSACTION",
    basePrice: 35,
    currency: "OMR",
    estimatedDuration: "حسب نوع المعاملة (24 - 48 ساعة)",
    deliveryTime: "متابعة فورية حتى صدور الترخيص",
    deliverables: ["إتمام المعاملة بنجاح", "استلام التصريح أو الترخيص الرسمي", "إيصالات السداد الحكومية"],
    includedInTenantPackage: true,
    icon: "FileCheck",
    color: "#ea580c",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-pro-02",
    code: "SRV-PRO-02",
    name: "الاشتراك الشهري لخدمات العلاقات الحكومية والـ PRO للمؤسسات",
    nameEn: "Monthly Corporate PRO Retainer Package",
    category: "PRO_SERVICES",
    shortDescription: "إسناد كافة معاملات الشركة الحكومية لفريقنا المتخصص بما يشمل التراخيص والفيز والتصاريح دون عناء المتابعة.",
    pricingModel: "MONTHLY_RETAINER",
    basePrice: 90,
    currency: "OMR",
    estimatedDuration: "شهري مستمر",
    deliveryTime: "خدمة فورية على مدار الشهر",
    deliverables: ["متابعة حتى 10 معاملات حكومية شهرياً", "إشعارات تجديد التراخيص قبل انتهائها", "مندوب مخصص لمراجعة الدوائر"],
    includedInTenantPackage: true,
    icon: "ShieldCheck",
    color: "#f97316",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 10. استشارات إدارية ودراسات جدوى
  {
    id: "srv-cns-01",
    code: "SRV-CNS-01",
    name: "إعداد دراسة جدوى اقتصادية وخطة عمل للمشاريع",
    nameEn: "Economic Feasibility Study & Business Plan",
    category: "CONSULTING",
    shortDescription: "دراسة تسويقية وفنية ومالية مع التوقعات المالية لخمس سنوات للتقديم على بنك التنمية وصناديق التمويل.",
    pricingModel: "FIXED_PRICE",
    basePrice: 250,
    currency: "OMR",
    estimatedDuration: "10 إلى 15 يوم عمل",
    deliveryTime: "تسليم ملف دراسة الجدوى المعتمد",
    deliverables: ["الدراسة السوقية والفنية", "القوائم المالية التقديرية", "مؤشرات الربحية وفترة الاسترداد", "ملف العرض التقديمي للمستثمرين"],
    includedInTenantPackage: false,
    icon: "PieChart",
    color: "#4f46e5",
    status: "POPULAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "srv-cns-02",
    code: "SRV-CNS-02",
    name: "جلسة استشارة إدارية وتطوير نموذج العمل التجاري (Business Model)",
    nameEn: "Executive Business Model & Strategy Consultation",
    category: "CONSULTING",
    shortDescription: "جلسة استراتيجية 1:1 مع مستشار أعمال لتحسين هيكل التكاليف، مصادر الإيرادات وتعظيم القيمة التنافسية.",
    pricingModel: "PER_CONSULTATION",
    basePrice: 40,
    currency: "OMR",
    estimatedDuration: "جلسة 60 دقيقة",
    deliveryTime: "فوري مع مخطط نموذج العمل Canvas",
    deliverables: ["مخطط نموذج العمل التجاري المطور", "توصيات تحسين هوامش الربحية", "خطة عمل تشغيلية"],
    includedInTenantPackage: true,
    icon: "Award",
    color: "#6366f1",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// MEMBERSHIP PACKAGES DEFAULTS (باقات المستأجرين)
// ----------------------------------------------------

export const DEFAULT_MEMBERSHIP_PACKAGES: MembershipPackage[] = [
  {
    id: "pkg-startup-tenant",
    code: "PKG-STARTUP",
    name: "باقة رواد الأعمال والمستأجرين الأساسية",
    nameEn: "Startup & Tenant Starter Membership",
    tier: "STARTUP",
    monthlyFee: 95,
    currency: "OMR",
    freeMeetingRoomHoursPerMonth: 20, // ٢٠ ساعة مجانية في الشهر لقاعات الاجتماعات
    freeMediaStudioHoursPerMonth: 2,  // ساعتان في الاستوديو الإعلامي
    freeConsultationSessionsPerMonth: 2, // جلستان استشاريتان مجانيتان شهرياً
    discountOnExtraServicesPercent: 15, // خصم 15% على باقي الخدمات
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
  },
  {
    id: "pkg-pro-business-tenant",
    code: "PKG-PRO-BIZ",
    name: "باقة الشركات المتقدمة والمستأجرين الاحترافيين",
    nameEn: "Pro Business Tenant Membership",
    tier: "PRO",
    monthlyFee: 165,
    currency: "OMR",
    freeMeetingRoomHoursPerMonth: 35, // ٣٥ ساعة مجانية في الشهر لقاعات الاجتماعات
    freeMediaStudioHoursPerMonth: 6,  // ٦ ساعات في الاستوديو الإعلامي
    freeConsultationSessionsPerMonth: 4, // ٤ استشارات مجانية شهرياً
    discountOnExtraServicesPercent: 25, // خصم 25% على باقي الخدمات
    features: [
      "35 ساعة مجانية شهرياً لقاعات الاجتماعات وقاعة التدريب الكبرى",
      "6 ساعات مجانية في استوديو التصوير الاحترافي والبودكاست",
      "4 جلسات استشارية مجانية شهرياً مع نخبة من الخبراء",
      "خصم 25% على كافة الخدمات المحاسبية، الإعلانية والمواقع",
      "خدمة مسك الدفاتر المحاسبية الأساسية مجاناً ضمن الباقة",
      "دعم PRO ذو أولوية لمعاملات الشركة الحكومية"
    ],
    color: "#7c3aed",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "pkg-elite-vip-tenant",
    code: "PKG-ELITE-VIP",
    name: "باقة المستأجر الذهبي والشركات الكبرى (VIP Elite)",
    nameEn: "VIP Elite Tenant Corporate Package",
    tier: "TENANT_VIP",
    monthlyFee: 260,
    currency: "OMR",
    freeMeetingRoomHoursPerMonth: 50, // ٥٠ ساعة شهرياً
    freeMediaStudioHoursPerMonth: 12, // ١٢ ساعة استوديو
    freeConsultationSessionsPerMonth: 8, // ٨ استشارات وجلسات توجيهية
    discountOnExtraServicesPercent: 35, // خصم 35%
    features: [
      "50 ساعة مجانية شهرياً لجميع القاعات وقاعة VIP التنفيذية",
      "12 ساعة استوديو تصوير وبودكاست مع طاقم هندسة الصوت",
      "8 جلسات استشارية استراتيجية ومالية شهرية مع مستشار مخصص",
      "خصم 35% على كافة الخدمات الرقمية والبرمجية والتسويقية",
      "استضافة وإدارة حسابات التواصل الاجتماعي مجاناً لمدة أسبوعين",
      "دخول 24/7 ومواقف سيارات خاصة لكبار الشخصيات"
    ],
    color: "#d97706",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// TENANT SUBSCRIPTIONS DEFAULTS (اشتراكات المستأجرين الفعلية)
// ----------------------------------------------------

export const DEFAULT_TENANT_SUBSCRIPTIONS: TenantSubscription[] = [
  {
    id: "sub-101",
    subscriptionNumber: "SUB-2026-001",
    customerId: "cust-1",
    customerName: "شركة الدليل الشامل",
    customerPhone: "+968 77627500",
    customerEmail: "info@deshalbm.com",
    companyName: "شركة الدليل الشامل",
    packageId: "pkg-startup-tenant",
    packageName: "باقة رواد الأعمال والمستأجرين الأساسية",
    billingCycle: "MONTHLY",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: "ACTIVE",
    meetingRoomHoursQuota: 20,
    meetingRoomHoursUsed: 7, // 13 hours remaining
    mediaStudioHoursQuota: 2,
    mediaStudioHoursUsed: 1, // 1 hour remaining
    consultationSessionsQuota: 2,
    consultationSessionsUsed: 1, // 1 session remaining
    monthlyFee: 95,
    currency: "OMR",
    discountOnExtraServicesPercent: 15,
    autoRenew: true,
    notes: "مستأجر رئيسي - الطابق الثاني - مكتب رقم 204",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: new Date().toISOString()
  },
  {
    id: "sub-102",
    subscriptionNumber: "SUB-2026-002",
    customerId: "cust-2",
    customerName: "مؤسسة النخبة للاستشارات",
    customerPhone: "+968 9988 7766",
    customerEmail: "info@nokhba-om.com",
    companyName: "مؤسسة النخبة للاستشارات",
    packageId: "pkg-pro-business-tenant",
    packageName: "باقة الشركات المتقدمة والمستأجرين الاحترافيين",
    billingCycle: "MONTHLY",
    startDate: "2026-08-10",
    endDate: "2026-09-09",
    status: "ACTIVE",
    meetingRoomHoursQuota: 35,
    meetingRoomHoursUsed: 12, // 23 hours remaining
    mediaStudioHoursQuota: 6,
    mediaStudioHoursUsed: 2, // 4 hours remaining
    consultationSessionsQuota: 4,
    consultationSessionsUsed: 2, // 2 sessions remaining
    monthlyFee: 165,
    currency: "OMR",
    discountOnExtraServicesPercent: 25,
    autoRenew: true,
    notes: "مستأجر المكتب التنفيذي 301 - تجديد ربع سنوي",
    createdAt: "2026-08-10T09:00:00Z",
    updatedAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// SERVICE BOOKINGS DEFAULTS (حجوزات الخدمات والاستشارات)
// ----------------------------------------------------

export const DEFAULT_SERVICE_BOOKINGS: ServiceBooking[] = [
  {
    id: "sbk-1001",
    bookingNumber: "SBK-2026-0001",
    serviceId: "srv-acc-02",
    serviceName: "إعداد وتقديم إقرارات ضريبة القيمة المضافة (VAT)",
    category: "ACCOUNTING",
    customerId: "cust-1",
    customerName: "شركة الدليل الشامل",
    customerPhone: "+968 77627500",
    customerEmail: "info@deshalbm.com",
    companyName: "شركة الدليل الشامل",
    consultationType: "OFFICE_VISIT",
    preferredDate: new Date().toISOString().split("T")[0],
    preferredTime: "10:30",
    duration: "إقرار ربع سنوي",
    scopeDetails: "تقديم إقرار الربع الثالث لضريبة القيمة المضافة ومراجعة فواتير المشتريات المعفاة.",
    assignedConsultant: "أ. سعيد الشحي - مستشار مالي وضريبي",
    isCoveredByMembership: true, // Covered under free consultation quota!
    tenantSubscriptionId: "sub-101",
    price: 45,
    discount: 45,
    finalAmount: 0,
    currency: "OMR",
    status: "CONFIRMED",
    paymentStatus: "FREE_QUOTA",
    meetingLink: "",
    deliverablesNotes: "تم استلام الفواتير وجارٍ رفع الإقرار إلى بوابة جهاز الضرائب.",
    createdByType: "CLIENT_SELF_SERVICE",
    createdByName: "شركة الدليل الشامل",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "sbk-1002",
    bookingNumber: "SBK-2026-0002",
    serviceId: "srv-media-01",
    serviceName: "جلسة تسجيل بودكاست احترافية مع هندسة الصوت والمونتاج",
    category: "MEDIA_STUDIO",
    customerId: "cust-2",
    customerName: "مؤسسة النخبة للاستشارات",
    customerPhone: "+968 9988 7766",
    customerEmail: "info@nokhba-om.com",
    companyName: "مؤسسة النخبة",
    consultationType: "IN_PERSON",
    preferredDate: new Date().toISOString().split("T")[0],
    preferredTime: "15:00",
    duration: "ساعتان تسجيل ومونتاج",
    scopeDetails: "تسجيل الحلقة الأولى من بودكاست 'رواد الأعمال في عمان' مع تصوير 4K.",
    assignedConsultant: "م. سالم الحارثي - مدير الاستوديو الإعلامي",
    isCoveredByMembership: true, // Deducted 2 hours from media studio quota!
    tenantSubscriptionId: "sub-102",
    price: 80,
    discount: 80,
    finalAmount: 0,
    currency: "OMR",
    status: "CONFIRMED",
    paymentStatus: "FREE_QUOTA",
    deliverablesNotes: "تجهيز المايكات وإعداد الإضاءة الاحترافية قبل الموعد بنصف ساعة.",
    createdByType: "CLIENT_SELF_SERVICE",
    createdByName: "مؤسسة النخبة",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "sbk-1003",
    bookingNumber: "SBK-2026-0003",
    serviceId: "srv-web-01",
    serviceName: "تصميم وتطوير موقع إلكتروني تعريفي حديث ومتجاوب",
    category: "WEB_DEVELOPMENT",
    customerName: "مشاريع الباطنة الحديثة",
    customerPhone: "+968 9234 5678",
    customerEmail: "contact@batinah-modern.om",
    companyName: "مشاريع الباطنة",
    consultationType: "ONLINE_MEETING",
    preferredDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    preferredTime: "11:00",
    duration: "جلسة تخطيط الموقع 45 دقيقة",
    scopeDetails: "الاتفاق على هيكل الموقع الإلكتروني التعريفي واختيار الألوان وربط النطاق الإلكتروني.",
    assignedConsultant: "المهندس / تقنية المعلومات",
    isCoveredByMembership: false,
    price: 280,
    discount: 0,
    finalAmount: 280,
    currency: "OMR",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod: "CREDIT_CARD",
    meetingLink: "https://meet.google.com/deshal-erp-meeting",
    createdByType: "STAFF",
    createdByName: "سعيد الشحي",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// CONSULTING SERVICES & SUBSCRIPTION STORAGE HELPERS
// ----------------------------------------------------

export function loadConsultingServices(): ConsultingService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
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
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  } catch (e) {
    console.error("Failed to save consulting services:", e);
  }
}

export function loadMembershipPackages(): MembershipPackage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
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
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(packages));
  } catch (e) {
    console.error("Failed to save membership packages:", e);
  }
}

export function loadTenantSubscriptions(): TenantSubscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
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
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  } catch (e) {
    console.error("Failed to save tenant subscriptions:", e);
  }
}

export function loadServiceBookings(): ServiceBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_BOOKINGS);
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
    localStorage.setItem(STORAGE_KEYS.SERVICE_BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error("Failed to save service bookings:", e);
  }
}

// ----------------------------------------------------
// DEFAULT LEASE CONTRACT CLAUSES (البنود والشروط النموذجية)
// ----------------------------------------------------

export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: "cl-1",
    titleAr: "البند الأول: الغرض من الاستخدام والعين المؤجرة",
    titleEn: "Clause 1: Permitted Use & Leased Premises",
    contentAr: "يقر المستأجر بأنه عاين الوحدة والمساحة المؤجرة وملحقاتها المعاينة النافية للجهالة شرعاً وقانوناً وتسلمها بحالة ممتازة وصالحة للغرض المخصص لها كأنشطة تجارية ومهنية وإدارية نظامية، ويتعهد بعدم استخدامها في أي غرض يخالف النظام والآداب العامة أو القوانين المعمول بها في سلطنة عمان.",
    contentEn: "The Lessee acknowledges inspection of the leased premises and its fixtures, accepting it in prime operational condition for commercial and professional business purposes.",
    isMandatory: true,
    order: 1
  },
  {
    id: "cl-2",
    titleAr: "البند الثاني: القيمة الإيجارية ومواعيد سداد الأقساط",
    titleEn: "Clause 2: Rental Payments & Due Dates",
    contentAr: "يلتزم المستأجر بسداد الدفعات الإيجارية المقررة في مواعيد استحقاقها المحددة في جدول الدفعات الملحق بهذا العقد، بموجب تحويلات بنكية أو شيكات بنكية لأمر المؤجر أو عبر بوابة الدفع الإلكترونية وسندات القبض الرسمية، ويضاف إلى القيمة الإيجارية ضريبة القيمة المضافة (VAT) المقررة قانوناً (5%).",
    contentEn: "The Lessee agrees to pay rent installments on scheduled due dates plus statutory VAT (5%) via approved bank transfer, corporate cheques, or official electronic receipt vouchers.",
    isMandatory: true,
    order: 2
  },
  {
    id: "cl-3",
    titleAr: "البند الثالث: التأمين المالي والضمان المسترد",
    titleEn: "Clause 3: Refundable Security Deposit",
    contentAr: "يدفع المستأجر مبلغ الضمان المالي والتأمين المسترد الموضح بالعقد عند التوقيع، ويحفظ كأمانة لدى المؤجر لضمان تنفيذ التزامات المستأجر والمحافظة على العين المؤجرة، ويسترد بالكامل عند انتهاء العقد وإخلاء الوحدة وتسليم المفاتيح بعد خصم أي تلفيات أو مستحقات مالية أو فواتير غير مسددة بموجب محضر فحص وتسليم معتمد.",
    contentEn: "The Lessee deposits the agreed refundable security deposit held in trust. It will be fully refunded upon lease expiration and space handover minus verified damages or unpaid dues.",
    isMandatory: true,
    order: 3
  },
  {
    id: "cl-4",
    titleAr: "البند الرابع: المرافق والخدمات والصيانة الدورية",
    titleEn: "Clause 4: Utilities, Amenities & Maintenance",
    contentAr: "يشمل الإيجار توفير شبكة الإنترنت عالي السرعة، الكهرباء والمياه والتكييف المركزي، خدمات الاستقبال والمراسلات البريدية، والصيانة الدورية للمرافق المشتركة ونظافة الممرات. ويلتزم المستأجر بالمحافظة على الأثاث والتجهيزات الذكية الموفرة بالوحدة.",
    contentEn: "Rent includes high-speed fiber internet, utilities, central AC, reception & mail handling, and common area maintenance. The Lessee shall maintain unit furniture and smart assets in good order.",
    isMandatory: false,
    order: 4
  },
  {
    id: "cl-5",
    titleAr: "البند الخامس: حظر التأجير من الباطن والتنازل",
    titleEn: "Clause 5: Prohibition of Subleasing & Assignment",
    contentAr: "لا يحق للمستأجر تأجير الوحدة كلياً أو جزئياً من الباطن أو التنازل عن العقد للغير أو إشراك شريك آخر في العين المؤجرة إلا بموافقة خطية مسبقة وصريحة من المؤجر.",
    contentEn: "The Lessee may not sublease, assign, or share the leased space with third parties without prior written consent from the Lessor.",
    isMandatory: true,
    order: 5
  },
  {
    id: "cl-6",
    titleAr: "البند السادس: الهدوء واللوائح الداخلية لمساحات العمل",
    titleEn: "Clause 6: Building Regulations & House Rules",
    contentAr: "يلتزم المستأجر وفريق عمله وضيوفه بقواعد السلوك المهني والهدوء بالمركز، واستخدام بطاقات الدخول الذكية بصفة شخصية، وعدم إحداث أي ضوضاء أو تعديل في القواطع الجدارية والتمديدات دون إذن مسبق.",
    contentEn: "The Lessee and team members must adhere to workspace house rules, quiet business hours, smart access security protocols, and refrain from making unauthorized structural alterations.",
    isMandatory: false,
    order: 6
  },
  {
    id: "cl-7",
    titleAr: "البند السابع: الإخلاء وإنهاء العقد والإشعار المسبق",
    titleEn: "Clause 7: Termination & Vacating Protocol",
    contentAr: "في حال رغبة أحد الطرفين في عدم تجديد العقد، يجب إشعار الطرف الآخر خطياً قبل موعد انتهاء العقد بمدة لا تقل عن مهلة الإشعار المحددة في العقد (60 يوماً). ويحق للمؤجر فسخ العقد فوراً في حال تأخر المستأجر عن سداد الإيجار لأكثر من 30 يوماً من تاريخ الاستحقاق.",
    contentEn: "Either party may notify the other of non-renewal in writing at least 60 days prior to expiry. The Lessor reserves the right to terminate in case of rent default exceeding 30 days.",
    isMandatory: true,
    order: 7
  },
  {
    id: "cl-8",
    titleAr: "البند الثامن: المراسلات والاختصاص القضائي",
    titleEn: "Clause 8: Legal Notices & Jurisdiction",
    contentAr: "تعتبر العناوين والبريد الإلكتروني وأرقام الواتساب الموضحة في ديباجة العقد محلاً مختاراً للمراسلات والإخطارات القانونية المنتجة لكافة آثارها. ويخضع هذا العقد ويفسر وفقاً للقوانين والأنظمة المعمول بها في سلطنة عمان وتختص محاكم السلطنة بالفصل في أي نزاع ينشأ بشأنه.",
    contentEn: "Contact details stated herein serve as valid addresses for official notices. This contract is governed by the laws of the Sultanate of Oman.",
    isMandatory: true,
    order: 8
  }
];

// ----------------------------------------------------
// DEFAULT LEASE CONTRACTS SEED DATA
// ----------------------------------------------------

export const DEFAULT_LEASE_CONTRACTS: LeaseContract[] = [
  {
    id: "lc-1001",
    contractNumber: "LC-2026-0042",
    titleAr: "عقد إيجار مكتب تنفيذي خاص وتوفير خدمات أعمال مساندة",
    titleEn: "Executive Office Commercial Lease & Facilities Agreement",
    contractType: "COMMERCIAL_OFFICE",
    status: "ACTIVE",
    lessorCompanyName: "ديشال لإدارة الأعمال والحلول التقنية (Deshal ERP)",
    lessorCrNumber: "CR-1092831",
    lessorTaxNumber: "OM-94288394-B",
    lessorRepresentative: "سعيد بن محمد الشحي",
    lessorRepresentativeCivilId: "11092834",
    lessorRepresentativeTitle: "المدير العام والمخول بالإدارة",
    lessorPhone: "+968 77438203",
    lessorEmail: "digititech.com@gmail.com",
    lessorAddress: "لوى - شمال الباطنة - سلطنة عمان",
    customerId: "cust-1",
    tenantName: "شركة الدليل الشامل للخدمات اللوجستية",
    tenantType: "CORPORATE",
    tenantCrNumber: "CR-1088492",
    tenantTaxNumber: "OM-TAX-7762",
    tenantSignatoryName: "المهندس / أحمد بن خلفان المقبالي",
    tenantSignatoryCivilId: "10982341",
    tenantSignatoryTitle: "الرئيس التنفيذي",
    tenantPhone: "+968 77627500",
    tenantEmail: "info@deshalbm.com",
    tenantAddress: "صحار - شمال الباطنة - مبنى مدين للأعمال",
    spaceId: "space-off-301",
    spaceCode: "OFFICE-301",
    spaceName: "مكتب تنفيذي خاص رقم 301 - إطلالة واجهة",
    spaceType: "PRIVATE_OFFICE",
    branchId: "br-sohar",
    branchName: "فرع صحار الرئيسي",
    floorLocation: "الطابق الثالث - جناح المكاتب التنفيذية",
    areaSqm: 32,
    capacityPersons: 5,
    accessKeyCardsCount: 4,
    assignedParkingSlots: "موقف VIP رقم B-12",
    startDate: "2026-08-01",
    endDate: "2027-07-31",
    durationMonths: 12,
    gracePeriodDays: 7,
    noticePeriodDays: 60,
    autoRenew: true,
    totalRentAmount: 4200,
    discountAmount: 200,
    taxRate: 5,
    taxAmount: 200,
    finalContractValue: 4200,
    currency: "OMR",
    paymentFrequency: "QUARTERLY",
    includedAmenities: {
      highSpeedInternet: true,
      electricityAndWater: true,
      centralAirConditioning: true,
      dailyCleaningService: true,
      receptionAndMailHandling: true,
      smartAccessControl: true,
      maintenanceSupport: true,
      beverageAndCoffeeStation: true
    },
    securityDeposit: {
      depositAmount: 350,
      currency: "OMR",
      status: "HELD_IN_CUSTODY",
      paidDate: "2026-07-28",
      paidReceiptVoucherId: "rv-gen-814",
      paidReceiptVoucherNumber: "RV-2026-0814",
      heldAccountLedger: "حساب أمانات وتأمينات المستأجرين - بنك ظفار",
      settlementNotes: "مبلغ الضمان محفوظ كوديعة تأمين مستردة لحين انتهاء العقد واستلام المكتب."
    },
    installments: [
      {
        id: "inst-1",
        installmentNumber: 1,
        titleAr: "الدفعة الإيجارية الأولى (الربع الأول: أغسطس - أكتوبر 2026)",
        dueDate: "2026-08-01",
        amount: 1000,
        taxRate: 5,
        taxAmount: 50,
        totalAmount: 1050,
        currency: "OMR",
        status: "PAID",
        paidDate: "2026-07-29",
        paidAmount: 1050,
        paymentMethod: "BANK_TRANSFER",
        linkedVoucherId: "rv-gen-815",
        linkedVoucherNumber: "RV-2026-0815",
        notes: "سددت بالكامل عبر تحويل بنكي لحساب بنك ظفار."
      },
      {
        id: "inst-2",
        installmentNumber: 2,
        titleAr: "الدفعة الإيجارية الثانية (الربع الثاني: نوفمبر 2026 - يناير 2027)",
        dueDate: "2026-11-01",
        amount: 1000,
        taxRate: 5,
        taxAmount: 50,
        totalAmount: 1050,
        currency: "OMR",
        status: "PENDING",
        notes: "مستحقة في 1 نوفمبر 2026."
      },
      {
        id: "inst-3",
        installmentNumber: 3,
        titleAr: "الدفعة الإيجارية الثالثة (الربع الثالث: فبراير - أبريل 2027)",
        dueDate: "2027-02-01",
        amount: 1000,
        taxRate: 5,
        taxAmount: 50,
        totalAmount: 1050,
        currency: "OMR",
        status: "PENDING",
        notes: "مستحقة في 1 فبراير 2027."
      },
      {
        id: "inst-4",
        installmentNumber: 4,
        titleAr: "الدفعة الإيجارية الرابعة (الربع الرابع: مايو - يوليو 2027)",
        dueDate: "2027-05-01",
        amount: 1000,
        taxRate: 5,
        taxAmount: 50,
        totalAmount: 1050,
        currency: "OMR",
        status: "PENDING",
        notes: "مستحقة في 1 مايو 2027."
      }
    ],
    linkedPackageId: "pkg-vip-tenant",
    packageName: "باقة المستأجرين الذهبية VIP",
    monthlyFreeMeetingRoomHours: 20,
    monthlyFreeMediaStudioHours: 4,
    monthlyFreeConsultations: 2,
    tenantDiscountOnExtraServicesPercent: 20,
    clauses: DEFAULT_CONTRACT_CLAUSES,
    customTermsNotes: "يشمل العقد تزويد المستأجر برقم ترخيص بلدي واستخدام العنوان التجاري في المعاملات الرسمية.",
    lessorSignature: {
      signatureDataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='80'><path d='M20,50 Q60,10 100,50 T180,40' stroke='%234f46e5' stroke-width='3' fill='none'/></svg>",
      signatoryName: "سعيد الشحي",
      signatoryTitle: "المدير العام",
      signedAt: "2026-07-28T14:30:00Z"
    },
    tenantSignature: {
      signatureDataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='80'><path d='M30,45 Q70,20 120,45 T170,30' stroke='%230f172a' stroke-width='3' fill='none'/></svg>",
      signatoryName: "أحمد بن خلفان المقبالي",
      signatoryCivilId: "10982341",
      signedAt: "2026-07-28T16:15:00Z",
      ipAddress: "185.120.44.12",
      deviceInfo: "MacBook Pro / Chrome OS X"
    },
    isDigitallySigned: true,
    signatureVerificationCode: "VER-OM-948123-SIGN",
    documents: [
      {
        id: "doc-1",
        title: "شهادة السجل التجاري CR",
        type: "CR_CERTIFICATE",
        fileName: "cr_certificate_deshalbm.pdf",
        fileSize: "1.4 MB",
        fileUrl: "https://example.com/cr_cert.pdf",
        uploadedAt: "2026-07-28T11:00:00Z",
        expiryDate: "2027-12-31"
      },
      {
        id: "doc-2",
        title: "بطاقة الهوية المدنية للمخول بالتوقيع",
        type: "CIVIL_ID_CARD",
        fileName: "civil_id_ahmed.pdf",
        fileSize: "850 KB",
        fileUrl: "https://example.com/civil_id.pdf",
        uploadedAt: "2026-07-28T11:05:00Z",
        expiryDate: "2028-05-15"
      },
      {
        id: "doc-3",
        title: "محضر فحص واستلام المكتب والأثاث",
        type: "HANDOVER_INSPECTION",
        fileName: "handover_inspection_signed.pdf",
        fileSize: "2.1 MB",
        fileUrl: "https://example.com/handover.pdf",
        uploadedAt: "2026-07-31T09:30:00Z"
      }
    ],
    handoverDate: "2026-07-31",
    handoverNotes: "تم تسليم المكتب بحالة نظيفة ومفروشة بعدد 4 مكاتب تنفيذية وشاشة عرض و4 بطاقات ذكية.",
    preparedByName: "سعيد الشحي",
    preparedByRole: "مدير التأجير ومساحات العمل",
    approvedByName: "إدارة ديشال للأعمال",
    approvedAt: "2026-07-28T17:00:00Z",
    createdAt: "2026-07-28T10:00:00Z",
    updatedAt: "2026-08-01T08:00:00Z"
  },
  {
    id: "lc-1002",
    contractNumber: "LC-2026-0043",
    titleAr: "عقد مكتب مخصص بمساحة عمل مشتركة Coworking وحزمة ريادة الأعمال",
    titleEn: "Dedicated Coworking Desk & Startup Membership Agreement",
    contractType: "COWORKING_DEDICATED_DESK",
    status: "ACTIVE",
    lessorCompanyName: "ديشال لإدارة الأعمال والحلول التقنية (Deshal ERP)",
    lessorCrNumber: "CR-1092831",
    lessorTaxNumber: "OM-94288394-B",
    lessorRepresentative: "سعيد بن محمد الشحي",
    lessorRepresentativeTitle: "المدير العام",
    lessorPhone: "+968 77438203",
    lessorEmail: "digititech.com@gmail.com",
    lessorAddress: "لوى - شمال الباطنة - سلطنة عمان",
    customerId: "cust-2",
    tenantName: "مؤسسة النخبة لتقنية وتصميم البرمجيات",
    tenantType: "CORPORATE",
    tenantCrNumber: "CR-1099231",
    tenantSignatoryName: "سالم بن ناصر المعمري",
    tenantSignatoryCivilId: "11293844",
    tenantSignatoryTitle: "المؤسس والمدير التنفيذي",
    tenantPhone: "+968 9123 4567",
    tenantEmail: "salem@elitesoft.om",
    tenantAddress: "صحار - منطقة فلج القبائل",
    spaceId: "space-desk-b04",
    spaceCode: "DESK-B04",
    spaceName: "مكتب عمل مشترك مخصص رقم B-04",
    spaceType: "COWORKING_DESK",
    branchId: "br-sohar",
    branchName: "فرع صحار الرئيسي",
    floorLocation: "الطابق الثاني - منطقة رواد الأعمال",
    areaSqm: 8,
    capacityPersons: 1,
    accessKeyCardsCount: 1,
    startDate: "2026-08-15",
    endDate: "2027-02-14",
    durationMonths: 6,
    gracePeriodDays: 3,
    noticePeriodDays: 30,
    autoRenew: true,
    totalRentAmount: 480,
    discountAmount: 30,
    taxRate: 5,
    taxAmount: 22.5,
    finalContractValue: 472.5,
    currency: "OMR",
    paymentFrequency: "MONTHLY",
    includedAmenities: {
      highSpeedInternet: true,
      electricityAndWater: true,
      centralAirConditioning: true,
      dailyCleaningService: true,
      receptionAndMailHandling: true,
      smartAccessControl: true,
      maintenanceSupport: true,
      beverageAndCoffeeStation: true
    },
    securityDeposit: {
      depositAmount: 80,
      currency: "OMR",
      status: "HELD_IN_CUSTODY",
      paidDate: "2026-08-14",
      paidReceiptVoucherId: "rv-gen-820",
      paidReceiptVoucherNumber: "RV-2026-0820",
      heldAccountLedger: "حساب أمانات وتأمينات المستأجرين",
      settlementNotes: "تأمين بطاقة الدخول الذكية وخزانة المستندات المقفلة."
    },
    installments: [
      {
        id: "inst-201",
        installmentNumber: 1,
        titleAr: "الدفعة الإيجارية الأولى - شهر أغسطس 2026",
        dueDate: "2026-08-15",
        amount: 75,
        taxRate: 5,
        taxAmount: 3.75,
        totalAmount: 78.75,
        currency: "OMR",
        status: "PAID",
        paidDate: "2026-08-15",
        paidAmount: 78.75,
        paymentMethod: "CREDIT_CARD",
        linkedVoucherId: "rv-gen-821",
        linkedVoucherNumber: "RV-2026-0821"
      },
      {
        id: "inst-202",
        installmentNumber: 2,
        titleAr: "الدفعة الإيجارية الثانية - شهر سبتمبر 2026",
        dueDate: "2026-09-15",
        amount: 75,
        taxRate: 5,
        taxAmount: 3.75,
        totalAmount: 78.75,
        currency: "OMR",
        status: "PENDING"
      },
      {
        id: "inst-203",
        installmentNumber: 3,
        titleAr: "الدفعة الإيجارية الثالثة - شهر أكتوبر 2026",
        dueDate: "2026-10-15",
        amount: 75,
        taxRate: 5,
        taxAmount: 3.75,
        totalAmount: 78.75,
        currency: "OMR",
        status: "PENDING"
      }
    ],
    linkedPackageId: "pkg-startup",
    packageName: "باقة رواد الأعمال والشركات الناشئة",
    monthlyFreeMeetingRoomHours: 10,
    monthlyFreeMediaStudioHours: 2,
    monthlyFreeConsultations: 1,
    tenantDiscountOnExtraServicesPercent: 15,
    clauses: DEFAULT_CONTRACT_CLAUSES,
    isDigitallySigned: true,
    signatureVerificationCode: "VER-OM-811902-SIGN",
    documents: [],
    preparedByName: "سعيد الشحي",
    createdAt: "2026-08-14T09:00:00Z",
    updatedAt: "2026-08-15T10:00:00Z"
  }
];

// ----------------------------------------------------
// LEASE CONTRACTS STORAGE HELPERS
// ----------------------------------------------------

export function loadLeaseContracts(): LeaseContract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
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
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
  } catch (e) {
    console.error("Failed to save lease contracts:", e);
  }
}

