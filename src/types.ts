export type Language = 'ar' | 'en';
export type PrintLanguage = 'ar' | 'en' | 'bilingual';

export type VoucherType = 'RECEIPT' | 'PAYMENT' | 'PETTY_CASH' | 'TAX_INVOICE' | 'QUOTATION';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'ONLINE' | 'OTHER';

export type VoucherStatus = 'ISSUED' | 'DRAFT' | 'PAID' | 'CANCELLED';

export interface Branch {
  id: string;
  code: string; // e.g. "BR-SOH-01", "BR-MCT-02"
  name: string; // e.g. "فرع صحار الرئيسي", "فرع مسقط - غلا"
  nameEn?: string;
  isMain: boolean; // Main headquarters
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  crNumber?: string;
  taxId?: string;
  managerName?: string;
  managerPhone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  defaultWarehouse?: string;
  color?: string; // Badge/theme accent color
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string; // e.g. TR-2026-0001
  date: string;
  fromBranchId: string;
  fromBranchName: string;
  fromWarehouse: string;
  toBranchId: string;
  toBranchName: string;
  toWarehouse: string;
  items: StockTransferItem[];
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  notes?: string;
  transferByName?: string;
  receivedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  itemId?: string; // Optional link to Inventory Item
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit?: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface ReceiptVoucher {
  id: string;
  type: VoucherType;
  voucherNumber: string;
  referenceNo: string;
  date: string;
  dueDate?: string;
  branchId?: string; // Linked Branch
  branchName?: string; // Branch Name e.g. فرع صحار الرئيسي
  receivedFrom: string; // Payer / Client
  paidTo?: string; // Vendor / Payee
  payerEmail?: string;
  payerPhone?: string;
  payerAddress?: string;
  payerTaxId?: string;
  amount: number;
  currency: string;
  amountInWords: string;
  isCustomWords: boolean;
  paymentMethod: PaymentMethod;
  checkNumber?: string;
  bankName?: string;
  transactionRef?: string;
  category: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number; // percentage
  taxAmount: number;
  discountRate?: number; // percentage
  discountAmount: number;
  totalAmount: number;
  notes: string;
  terms: string;
  customFields: CustomField[];
  status: VoucherStatus;
  preparedBy: string;
  approvedBy: string;
  receivedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// INVENTORY & WAREHOUSES TYPES (المخازن والمخزون)
// ----------------------------------------------------

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: string;
  sku: string; // Unique SKU (e.g. CAM-4K-01)
  barcode?: string; // Barcode number
  name: string; // Product / Item Name
  category: string; // Category e.g. كاميرات مراقبة، شبكات، شاشات
  warehouse: string; // Warehouse name e.g. المستودع الرئيسي - صحار
  branchId?: string; // Linked Branch
  branchName?: string;
  location?: string; // Shelf / Bin e.g. الرف A-4
  unit: string; // Unit e.g. حبة، متر، رول، طقم، كرتون
  quantity: number; // Current stock count
  minAlertQuantity: number; // Min threshold for low stock alert
  costPrice: number; // Purchase / Cost price
  sellingPrice: number; // Suggested selling price
  supplierName?: string; // Default supplier
  description?: string;
  imageUrl?: string;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'PURCHASE_IN' // وارد من فاتورة شراء
  | 'SALE_OUT' // منصرف لمبيعات / مشروع
  | 'TRANSFER_IN' // وارد من تحويل بين الفروع
  | 'TRANSFER_OUT' // منصرف لتحويل بين الفروع
  | 'ADJUSTMENT_IN' // تسوية جرد (زيادة)
  | 'ADJUSTMENT_OUT' // تسوية جرد (نقص)
  | 'RETURN_IN' // مرتجع من عميل
  | 'DAMAGE_OUT'; // تالف أو مستهلك

export interface StockMovement {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: MovementType;
  quantity: number; // Quantity of movement (positive)
  previousQuantity: number;
  newQuantity: number;
  referenceNo?: string; // Invoice / Voucher # or Adjustment ID
  warehouse: string;
  branchId?: string;
  branchName?: string;
  date: string;
  notes?: string;
  createdByName?: string;
}

// ----------------------------------------------------
// PURCHASES & SUPPLIERS TYPES (المشتريات والموردين)
// ----------------------------------------------------

export type PurchaseStatus = 'RECEIVED' | 'ORDERED' | 'DRAFT' | 'CANCELLED';
export type PurchasePaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface PurchaseItem {
  id: string;
  itemId?: string; // Linked Inventory Item
  sku?: string;
  name: string;
  quantity: number;
  unitCost: number;
  amount: number;
  unit?: string;
}

export interface PurchaseInvoice {
  id: string;
  purchaseNumber: string; // e.g. PO-2026-0001
  supplierInvoiceNo?: string; // Supplier's original invoice #
  supplierId?: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierTaxId?: string;
  supplierAddress?: string;
  branchId?: string; // Linked Branch
  branchName?: string;
  date: string;
  dueDate?: string;
  warehouse: string; // Receiving warehouse
  items: PurchaseItem[];
  subtotal: number;
  taxRate: number; // VAT percentage
  taxAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PurchasePaymentStatus;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  notes?: string;
  autoUpdateStock: boolean; // Auto increment warehouse inventory
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  taxId?: string;
  crNumber?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = 'CORPORATE' | 'INDIVIDUAL' | 'GOVERNMENT' | 'VIP';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'PROSPECT';

export interface CustomerInteraction {
  id: string;
  date: string;
  type: 'CALL' | 'MEETING' | 'WHATSAPP' | 'EMAIL' | 'NOTE' | 'PAYMENT' | 'VOUCHER_ISSUED';
  title: string;
  notes: string;
  createdByName?: string;
}

export interface Customer {
  id: string;
  name: string; // Client / Company name
  contactPerson?: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  crNumber?: string;
  branchId?: string; // Preferred or handling branch
  branchName?: string;
  type: CustomerType;
  status: CustomerStatus;
  notes?: string;
  tags?: string[];
  creditLimit?: number;
  assignedProject?: string;
  isTenant?: boolean;
  tenantSpaceCode?: string;
  tenantSpaceName?: string;
  tenantPackageName?: string;
  interactions?: CustomerInteraction[];
  createdAt: string;
  updatedAt: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
}

export interface DefaultCustomFieldSchema {
  id: string;
  label: string;
  defaultValue: string;
  isRequired: boolean;
}

export interface SupabaseSyncSettings {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  tableName: string; // e.g. "deshal_erp_backups"
  syncKey: string; // unique company tenant ID / branch ID e.g. "sohar-main-company"
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncedAt?: string;
  lastSyncStatus?: 'SUCCESS' | 'ERROR' | 'IDLE';
  lastSyncMessage?: string;
}

export type BaileysServerPreset = 'generic_baileys' | 'evolution_api' | 'baileys_http' | 'wppconnect' | 'custom';
export type WhatsAppConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'UNKNOWN';

export interface WhatsAppMessageLog {
  id: string;
  timestamp: string;
  recipientPhone: string;
  recipientName?: string;
  messageType: 'RECEIPT' | 'REMINDER' | 'QUOTATION' | 'TAX_INVOICE' | 'POS_RECEIPT' | 'CUSTOM' | 'TEST';
  voucherNumber?: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'QUEUED';
  errorDetails?: string;
  messageSnippet: string;
  sentBy?: string;
  method: 'BAILEYS_API' | 'WHATSAPP_WEB_DIRECT';
}

export interface WhatsAppSettings {
  enabled: boolean;
  provider: 'baileys' | 'manual';
  serverPreset: BaileysServerPreset;
  serverUrl: string; // e.g. "https://wa.yourdomain.com" or "http://your-vps-ip:8000"
  apiKey: string; // Bearer token or secret API Key
  sessionId: string; // e.g. "deshal-erp" or "default"
  defaultCountryCode: string; // e.g. "968"
  includePdfLink: boolean;
  autoSendOnVoucherCreate: boolean;
  autoSendOnPOSCheckout: boolean;
  autoSendOnDueDateReminder: boolean;
  customHeaderNotice?: string;
  customFooterNotice?: string;
  endpoints?: {
    sendText?: string;
    sendMedia?: string;
    checkStatus?: string;
    getQr?: string;
    startSession?: string;
    logoutSession?: string;
  };
}

export interface ResendSettings {
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  autoSendWelcomeEmail: boolean;
  customWelcomeSubject?: string;
  lastTestedAt?: string;
  lastTestStatus?: 'SUCCESS' | 'ERROR';
  lastTestMessage?: string;
}

export interface EmailLogEntry {
  id: string;
  company_id?: string;
  recipient: string;
  email_type: 'WELCOME_USER' | 'INVOICE_CREATED' | 'REQUEST_APPROVAL' | 'BOOKING_CONFIRMATION' | 'GENERAL_NOTIFICATION' | 'PASSWORD_RESET' | 'TEST_EMAIL';
  related_entity_type?: string;
  related_entity_id?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'BOUNCED';
  provider_message_id?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  sent_at?: string;
  created_at: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  logoWidth: number; // in pixels, e.g. 140
  taxId: string; // VAT / Tax ID
  crNumber: string; // Commercial Registration / Business ID
  address: string;
  cityStateZip: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  headerNotice: string;
  footerNotice: string;
  termsAndConditions: string;
  authorizedSignatoryName: string;
  authorizedSignatoryTitle: string;
  signatureImageUrl: string;
  stampImageUrl: string;
  bankDetails: BankDetails;
  defaultCustomFields: DefaultCustomFieldSchema[];
  qrCodeContent: string; // URL or e-invoice validation payload
  defaultCurrency?: string; // Default currency code (e.g. OMR)
  secondaryCurrencies?: string[]; // e.g. ['USD', 'SAR', 'AED', 'EUR']
  customExchangeRates?: Record<string, number>; // Custom or fetched exchange rates vs USD or base
  autoConvertCurrency?: boolean;
  lastRatesUpdated?: string;
  showEquivalentInBaseCurrency?: boolean;
  supabaseSync?: SupabaseSyncSettings;
  whatsappSettings?: WhatsAppSettings;
  resendSettings?: ResendSettings;
}

export type PageSizeFormat = 'A4' | 'A5' | 'LETTER' | 'THERMAL_80MM' | 'THERMAL_58MM';

export type TemplateStyle = 'modern' | 'classic' | 'thermal80' | 'executive' | 'minimalist';

export type FontFamilyChoice = 'sans' | 'serif' | 'mono';

export interface DesignTheme {
  templateId: TemplateStyle;
  primaryColor: string; // e.g. "#1e3a8a"
  secondaryColor: string; // e.g. "#3b82f6"
  accentColor: string; // e.g. "#f59e0b"
  textColor: string; // e.g. "#111827"
  backgroundColor: string; // e.g. "#ffffff"
  fontFamily: FontFamilyChoice;
  pageSize: PageSizeFormat;
  showLogo: boolean;
  showStamp: boolean;
  showSignatureBlock: boolean;
  showAmountInWords: boolean;
  showQrCode: boolean;
  showBarcode?: boolean; // Barcode toggle for all templates
  showWatermark: boolean;
  watermarkText: string;
  showBankDetails: boolean;
  borderStyle: 'subtle' | 'bold' | 'double' | 'none';
  headerLayout: 'standard' | 'centered' | 'compact' | 'split';
  printLanguage?: PrintLanguage;
  thermalSettings?: {
    compactLineItems?: boolean;
    showReturnPolicy?: boolean;
    returnPolicyText?: string;
    fontSize?: 'compact' | 'standard' | 'large';
    showBranchInfo?: boolean;
    showBarcode?: boolean;
    printWidthMm?: 80 | 58;
  };
}

export type EmployeeRole =
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'SALES'
  | 'STOREKEEPER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'COLLABORATOR'
  | 'AUDITOR'
  | 'CUSTOM';

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | 'SUSPENDED';

export type ContractType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TRAINEE';

export type EmployeePermission =
  | 'create_vouchers'
  | 'edit_vouchers'
  | 'delete_vouchers'
  | 'print_export_vouchers'
  | 'apply_discounts'
  | 'view_reports'
  | 'manage_inventory'
  | 'manage_transfers'
  | 'manage_purchases'
  | 'manage_suppliers'
  | 'manage_customers'
  | 'manage_branches'
  | 'manage_employees'
  | 'view_salaries'
  | 'edit_settings'
  // Attendance, Kiosk & Movement Permissions (صلاحيات الحضور وكشك الموظفين)
  | 'attendance_view'
  | 'attendance_create'
  | 'attendance_edit'
  | 'attendance_delete'
  | 'attendance_approve'
  | 'attendance_reports'
  | 'attendance_photos'
  | 'attendance_devices'
  | 'movement_types_mgmt'
  | 'employee_pin_mgmt'
  | 'attendance_settings'
  // Collaborator & Auditor Permissions
  | 'auditor_read_only'
  | 'collaborator_limited';

export interface Employee {
  id: string;
  employeeCode: string; // e.g. "EMP-001"
  fullName: string;
  fullNameEn?: string;
  civilId?: string; // National / Civil ID
  email: string;
  phone: string;
  role: EmployeeRole;
  jobTitle: string; // e.g. "مدير مالي", "محاسب عام", "أمين مستودع"
  department: string; // e.g. "الإدارة العامة", "المالية والمحاسبة", "المبيعات", "المستودعات"
  branchId?: string; // Linked Branch
  branchName?: string;
  status: EmployeeStatus;
  hireDate: string; // YYYY-MM-DD
  contractType?: ContractType;
  basicSalary: number;
  allowances: number;
  currency: string;
  maxSalaryCap?: number; // سقف إجمالي الراتب الشهري المسموح به
  maxBonusCap?: number; // سقف المكافآت الشهرية المسموح بها للموظف
  preferredBonusTreasury?: string; // الخزينة المعتمدة لصرف المكافآت (خزينة نقدية، حساب بنكي، عهدة)
  bankName?: string;
  bankIban?: string;
  avatarUrl?: string;
  signatureUrl?: string;
  permissions: EmployeePermission[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// DESHAL HR & PAYROLL TYPES (الموارد البشرية والرواتب)
// ----------------------------------------------------

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'MISSION' | 'WEEKEND';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  jobTitle?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  status: AttendanceStatus;
  workingHours: number;
  overtimeHours: number;
  lateMinutes: number;
  branchId?: string;
  branchName?: string;
  notes?: string;
}

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

export interface PayrollSlip {
  id: string;
  payrollMonth: string; // e.g. "2026-08"
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  fullNameEn?: string;
  jobTitle: string;
  department: string;
  civilId?: string;
  bankName?: string;
  bankIban?: string;
  branchName?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  bonus: number;
  bonusReason?: string;
  bonusVoucherId?: string; // سند الخزينة المخصص للمكافأة
  bonusVoucherNumber?: string; // رقم سند صرف الخزينة للمكافأة
  bonusTreasuryAccount?: string; // حساب الخزينة المنفذ لصرف المكافأة
  deductions: number;
  deductionReason?: string;
  socialSecurityDeduction: number; // التأمينات الاجتماعية PASI (7%)
  netSalary: number;
  status: PayrollStatus;
  paymentDate?: string;
  paymentMethod?: string;
  referenceNo?: string;
  notes?: string;
  linkedVoucherId?: string;
  linkedVoucherNumber?: string;
  disbursedBy?: string;
  generatedAt: string;
}

export type LeaveType = 'ANNUAL' | 'SICK' | 'EMERGENCY' | 'UNPAID' | 'HAJJ' | 'MATERNITY' | 'STUDY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  jobTitle?: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// ----------------------------------------------------
// DESHAL ATTENDANCE KIOSK & MOVEMENT TYPES (كشك الحضور وحركة الموظفين)
// ----------------------------------------------------

export type EmployeeMovementStatus =
  | 'IN_OFFICE'      // 🟢 داخل مقر العمل
  | 'ON_MISSION'     // 🚗 خارج في مهمة عمل
  | 'EMERGENCY'      // 🚨 خارج في حالة طارئة
  | 'ON_BREAK'       // ☕ في استراحة
  | 'OUT_OF_OFFICE'  // 🔴 خارج الدوام
  | 'INCOMPLETE';    // ⚠️ حركة غير مكتملة / تحتاج مراجعة

export type MovementCategory =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'MISSION_OUT'
  | 'MISSION_IN'
  | 'EMERGENCY_OUT'
  | 'EMERGENCY_IN'
  | 'BREAK_OUT'
  | 'BREAK_IN'
  | 'CUSTOM';

export interface MovementTypeConfig {
  id: string;
  code: string; // e.g. "CHECK_IN", "MISSION_OUT"
  labelAr: string;
  labelEn: string;
  category: MovementCategory;
  iconName: string; // lucide icon identifier e.g. "LogIn", "LogOut", "Car", "AlertTriangle", "Coffee"
  color: string; // badge accent color e.g. "#10b981", "#ef4444", "#3b82f6"
  requiresPhoto: boolean;
  requiresReason: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  order: number;
}

export type KioskDeviceStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface KioskDevice {
  id: string;
  deviceCode: string; // e.g. "KIOSK-SOH-01", "IPAD-MCT-RECEP"
  name: string; // e.g. "آيباد الاستقبال - صحار", "تابلت المستودع"
  companyName?: string;
  branchId: string;
  branchName: string;
  location: string; // e.g. "مدخل المقر الرئيسي", "بوابة المستودع A"
  deviceToken: string; // Secure token for API/Applet validation
  activationCode?: string; // e.g. "DSH-K-849204"
  status: KioskDeviceStatus;
  lastPing?: string;
  ipAddress?: string;
  model?: string; // e.g. "Apple iPad 10th Gen", "Samsung Galaxy Tab A8"
  appVersion?: string;
  isLocked: boolean; // Remote lock flag
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceMovementLog {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department?: string;
  jobTitle?: string;
  branchId: string;
  branchName: string;
  movementTypeCode: string;
  movementTypeNameAr: string;
  movementTypeNameEn: string;
  movementCategory: MovementCategory;
  timestamp: string; // ISO 8601 string (Server timestamp reference)
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  photoUrl?: string; // Secure base64 or protected storage token
  deviceId: string;
  deviceName: string;
  location?: string;
  syncStatus: 'SYNCED' | 'PENDING_OFFLINE';
  offlineCapturedAt?: string;
  reason?: string;
  notes?: string;
  isAdjustment?: boolean;
  originalLogId?: string;
  adjustedBy?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface AttendanceAdjustment {
  id: string;
  logId?: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string;
  originalMovementType?: string;
  newMovementType: string;
  originalTime?: string;
  newTime: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface EmployeePinRecord {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  pinHash: string; // SHA-256 salted hash
  salt: string;
  isLocked: boolean;
  failedAttempts: number;
  lastFailedAt?: string;
  lockoutUntil?: string;
  updatedAt: string;
  updatedBy: string;
}

// ----------------------------------------------------
// AUDIT LOGS TYPES (سجل الأنشطة والعمليات الرقابية)
// ----------------------------------------------------

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BATCH_DELETE'
  | 'PRINT'
  | 'EXPORT'
  | 'TRANSFER'
  | 'SETTINGS_UPDATE'
  | 'STATUS_CHANGE'
  | 'DUPLICATE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'MAGIC_LINK_LOGIN'
  | '2FA_VERIFY'
  | 'ACCOUNT_LOCK'
  | 'ATTENDANCE_LOG'
  | 'ATTENDANCE_ADJUST'
  | 'PIN_CHANGE'
  | 'PIN_RESET'
  | 'DEVICE_ENROLL'
  | 'DEVICE_DEACTIVATE'
  | 'SECURITY_ALERT';

export type AuditModule =
  | 'VOUCHERS'
  | 'CRM'
  | 'INVENTORY'
  | 'PURCHASES'
  | 'BRANCHES'
  | 'EMPLOYEES'
  | 'SETTINGS'
  | 'SECURITY'
  | 'ATTENDANCE_KIOSK'
  | 'SYSTEM';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  action: AuditAction;
  module: AuditModule;
  entityId?: string;
  entityName?: string; // e.g. "RV-2026-0833", "شركة الدليل الشامل", "سعيد الشحي"
  descriptionAr: string;
  descriptionEn: string;
  details?: string;
  performedByName: string;
  performedByRole?: string;
  performedByEmployeeId?: string;
  branchName?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// ----------------------------------------------------
// AUTHENTICATION & ACCOUNT SECURITY TYPES (المصادقة والأمان)
// ----------------------------------------------------

export type AuthLoginMethod = 'PASSWORD' | 'MAGIC_LINK' | 'QUICK_SWITCH' | 'PIN';

export interface UserAccount {
  id: string;
  employeeId: string; // Linked Employee
  email: string;
  fullName: string;
  fullNameEn?: string;
  role: EmployeeRole;
  passwordHash: string; // Encrypted / Salted password hash
  pinCode?: string; // 4 or 6-digit quick PIN
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  failedLoginAttempts: number;
  isLocked: boolean;
  lockoutExpiry?: string;
  lastLoginAt?: string;
  lastLoginMethod?: AuthLoginMethod;
  lastPasswordChangeAt?: string;
  phone?: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MagicLinkRecord {
  token: string;
  email: string;
  userId: string;
  createdAt: string;
  expiresAt: string; // ISO string (e.g. 15 minutes)
  isUsed: boolean;
}

export interface PasswordResetRecord {
  token: string;
  code: string; // 6-digit OTP code
  email: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
}

export interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userRole: EmployeeRole;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AuthSession {
  user: UserAccount;
  employee: Employee;
  token: string;
  loginMethod: AuthLoginMethod;
  authenticatedAt: string;
  expiresAt: string;
  isLocked: boolean;
  activeBranchId?: string;
}

// ----------------------------------------------------
// POS (POINT OF SALE - نقطة البيع الاحترافية) TYPES
// ----------------------------------------------------

export type POSPaymentMethod = 'CASH' | 'CARD' | 'SPLIT' | 'CREDIT' | 'BANK_TRANSFER' | 'ONLINE';

export type POSOrderStatus = 'COMPLETED' | 'HELD' | 'REFUNDED' | 'CANCELLED';

export interface POSOrderItem {
  id: string;
  itemId?: string;
  sku?: string;
  barcode?: string;
  name: string;
  nameEn?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discount: number; // Discount per item or line
  taxRate: number; // e.g. 5%
  taxAmount: number;
  total: number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  warehouse?: string;
  notes?: string;
}

export interface POSPaymentSplit {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface POSOrder {
  id: string;
  orderNumber: string; // e.g. "POS-2026-0001"
  voucherId?: string; // Linked ReceiptVoucher
  voucherNumber?: string; // e.g. "INV-2026-0850"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  branchId: string;
  branchName: string;
  warehouse: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerTaxId?: string;
  items: POSOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: POSPaymentMethod;
  splitPayments?: POSPaymentSplit[];
  cashReceived: number;
  changeDue: number;
  status: POSOrderStatus;
  shiftId?: string;
  notes?: string;
  isRefunded?: boolean;
  refundedOrderId?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POSHeldCart {
  id: string;
  cartNumber: number;
  label: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: POSOrderItem[];
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  notes?: string;
  heldAt: string;
  branchId?: string;
}

export interface CashMovement {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  reason: string;
  time: string;
  performedByName: string;
}

export interface CashierShift {
  id: string;
  shiftNumber: string; // e.g. "SH-2026-001"
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  totalSalesCash: number;
  totalSalesCard: number;
  totalSalesCredit: number;
  totalSalesOnline: number;
  totalSalesBank: number;
  totalReturns: number;
  totalDiscounts: number;
  totalTax: number;
  totalNetSales: number;
  ordersCount: number;
  cashMovements: CashMovement[];
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export type RecurrenceFrequency =
  | 'DAILY'          // يومياً
  | 'WEEKLY'         // أسبوعياً
  | 'BIWEEKLY'       // كل أسبوعين
  | 'MONTHLY'        // شهرياً
  | 'QUARTERLY'      // كل 3 أشهر (ربع سنوي)
  | 'SEMI_ANNUALLY'  // كل 6 أشهر (نصف سنوي)
  | 'ANNUALLY';      // سنوياً

export type RecurringScheduleStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface RecurringScheduleExecution {
  id: string;
  voucherId: string;
  voucherNumber: string;
  executionDate: string; // YYYY-MM-DD
  dueDate: string;       // Original due date
  amount: number;
  currency: string;
  status: 'POSTED' | 'SKIPPED';
  notes?: string;
  createdAt: string;
}

export interface RecurringSchedule {
  id: string;
  scheduleCode: string; // e.g. "REC-2026-001"
  title: string; // e.g. "قسط السيارة - بنك مسقط", "إيجار المحل / المكتب", "اشتراك إنترنت فايبر"
  type: VoucherType; // 'PAYMENT' | 'RECEIPT' | 'PETTY_CASH' | 'TAX_INVOICE'
  frequency: RecurrenceFrequency;
  customIntervalMonths?: number;
  amount: number;
  currency: string;
  
  // Party details
  partyName: string; // e.g. "شركة تأجير السيارات", "مالك العقار - الشيخ سالم", "عمانتل"
  partyType: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'OTHER';
  partyPhone?: string;
  partyEmail?: string;
  partyTaxId?: string;
  
  category: string;
  paymentMethod: PaymentMethod;
  bankName?: string;
  
  // Timing & Schedule Rules
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD (optional)
  totalOccurrences?: number; // 0 or undefined means indefinite
  completedOccurrences: number; // count of posted installments
  nextDueDate: string; // YYYY-MM-DD
  lastExecutedDate?: string; // YYYY-MM-DD
  
  autoGenerateVoucher: boolean;
  reminderDaysBefore: number;
  
  status: RecurringScheduleStatus;
  branchId?: string;
  branchName?: string;
  
  description?: string;
  notes?: string;
  terms?: string;
  
  executions: RecurringScheduleExecution[];
  
  createdAt: string;
  updatedAt: string;
}

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
  heldAccountLedger?: string; // e.g. "حساب أمانات وتأمينات المستأجرين - بنك ظفار"
  
  // Refund / Settlement on checkout
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
  expiryDate?: string; // e.g. CR or ID expiry date
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
  contractNumber: string; // e.g. "LC-2026-0088", "CON-2026-01"
  titleAr: string;        // e.g. "عقد إيجار مكتب تنفيذي خاص وخدمات مساندة"
  titleEn?: string;
  contractType: LeaseContractType;
  status: LeaseContractStatus;
  
  // 1. Lessor Information (المؤجر)
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
  
  // 2. Tenant / Lessee Information (المستأجر)
  customerId?: string;
  tenantName: string;          // Business or Individual Name
  tenantType: 'CORPORATE' | 'INDIVIDUAL';
  tenantCrNumber?: string;
  tenantTaxNumber?: string;
  tenantSignatoryName: string; // Authorized Signatory
  tenantSignatoryCivilId?: string;
  tenantSignatoryTitle?: string;
  tenantPhone: string;
  tenantEmail: string;
  tenantAddress: string;
  
  // 3. Leased Space / Property (العين المؤجرة)
  spaceId: string;
  spaceCode: string;           // e.g. "OFFICE-301", "DESK-A12"
  spaceName: string;           // e.g. "مكتب تنفيذي رقم 301 - إطلالة واجهة"
  spaceType: SpaceType;
  branchId: string;
  branchName: string;
  floorLocation?: string;      // e.g. "الطابق الثالث - جناح الأعمال"
  areaSqm?: number;            // e.g. 28 m²
  capacityPersons?: number;    // e.g. 4 أشخاص
  accessKeyCardsCount?: number;// e.g. 3 بطاقات ذكية
  assignedParkingSlots?: string;// e.g. "موقف رقم B-14"
  
  // 4. Term & Duration (مدة العقد)
  startDate: string;           // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
  durationMonths: number;      // e.g. 12 months
  gracePeriodDays?: number;    // e.g. 7 days
  noticePeriodDays: number;    // e.g. 60 days
  autoRenew: boolean;
  
  // 5. Financials & Rent Structure (القيمة المالية والدفعات)
  totalRentAmount: number;     // Total contract gross rent before tax
  discountAmount: number;      // Contract overall discount
  taxRate: number;             // Default 5%
  taxAmount: number;           // Calculated VAT
  finalContractValue: number;  // (totalRent - discount) + tax
  currency: string;            // OMR
  paymentFrequency: PaymentFrequency;
  
  // Utilities & Inclusions (المنافع والخدمات المشمولة في الإيجار)
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
  
  // 6. Security Deposit (الضمان المالي والتأمين المسترد)
  securityDeposit: SecurityDeposit;
  
  // 7. Payment Schedule (جدول الأقساط والدفعات)
  installments: PaymentInstallment[];
  
  // 8. Membership & Free Quotas Add-on (الباقات والحصص المجانية الملحقة)
  linkedPackageId?: string;
  packageName?: string;
  monthlyFreeMeetingRoomHours: number;  // e.g. 20 hours/month
  monthlyFreeMediaStudioHours: number;   // e.g. 4 hours/month
  monthlyFreeConsultations: number;      // e.g. 2 sessions/month
  tenantDiscountOnExtraServicesPercent: number; // e.g. 20%
  
  // 9. Contract Clauses & Conditions (البنود والشروط التعاقدية)
  clauses: ContractClause[];
  customTermsNotes?: string;
  
  // 10. Digital Signatures & Approvals (التوقيع الإلكتروني والاعتماد)
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
  signatureVerificationCode?: string; // e.g. "VER-OM-948123-SIGN"
  
  // 11. Document Archive & Attachments (أرشيف المستندات والوثائق)
  documents: TenantDocument[];
  
  // 12. Handover & Move-in Inspection (محضر الفحص والاستلام)
  handoverDate?: string;
  handoverNotes?: string;
  handoverItems?: HandoverInspectionItem[];
  
  // System metadata
  preparedByName: string;
  preparedByRole?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// DESHAL REQUESTS & DYNAMIC FORMS ENGINE
// ----------------------------------------------------
export * from './types/requests';

// ----------------------------------------------------
// DESHAL CORE ACCOUNTING & GENERAL LEDGER SUITE
// ----------------------------------------------------
export * from './types/accounting';

// ----------------------------------------------------
// WORKSPACE CUSTOMIZATION & USER PREFERENCES TYPES
// ----------------------------------------------------
export type QuickLauncherId =
  | 'pos'
  | 'accounting'
  | 'spaces'
  | 'doc-wizard'
  | 'inventory'
  | 'purchases'
  | 'branches'
  | 'schedules'
  | 'crm'
  | 'employees'
  | 'requests'
  | 'settings';

export type QuickActionId =
  | 'RECEIPT'
  | 'TAX_INVOICE'
  | 'QUOTATION'
  | 'PAYMENT'
  | 'PETTY_CASH';

export type ReportWidgetId =
  | 'kpi_collections'
  | 'kpi_payments'
  | 'kpi_purchases'
  | 'kpi_inventory'
  | 'smart_alerts'
  | 'visual_analytics'
  | 'recent_vouchers'
  | 'customer_directory';

export interface WorkspaceConfig {
  userId?: string;
  userEmail?: string;
  quickLaunchers: QuickLauncherId[];
  quickActions: QuickActionId[];
  reportWidgets: ReportWidgetId[];
  updatedAt?: string;
}

