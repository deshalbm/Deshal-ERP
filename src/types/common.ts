import { EmployeeRole, Employee } from './hr';

export type Language = 'ar' | 'en';
export type PrintLanguage = 'ar' | 'en' | 'bilingual';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'ONLINE' | 'OTHER';

export interface MasterLocation {
  id: string;
  governorateAr: string;
  governorateEn: string;
  cityAr: string;
  cityEn: string;
  displayOrder?: number;
}

export interface PublicInvoiceVerification {
  valid: boolean;
  documentType?: 'INVOICE' | 'VOUCHER';
  documentNumber?: string;
  issueDate?: string;
  companyName?: string;
  totalAmount?: number;
  taxAmount?: number;
  currency?: string;
  status?: string;
  message?: string;
}

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

export interface CustomField {
  id: string;
  label: string;
  value: string;
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
  landline?: string;
  postalCode?: string;
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
  name?: string;
  currency?: string;
}

export type PageSizeFormat = 'A4' | 'A5' | 'LETTER' | 'THERMAL_80MM' | 'THERMAL_58MM';
export type TemplateStyle = 'modern' | 'classic' | 'thermal80' | 'executive' | 'minimalist';
export type FontFamilyChoice = 'sans' | 'serif' | 'mono';

export interface DesignTheme {
  templateId: TemplateStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: FontFamilyChoice;
  pageSize: PageSizeFormat;
  showLogo: boolean;
  showStamp: boolean;
  showSignatureBlock: boolean;
  showAmountInWords: boolean;
  showQrCode: boolean;
  showBarcode?: boolean;
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
  timestamp: string;
  action: AuditAction;
  module: AuditModule;
  entityId?: string;
  entityName?: string;
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

export type AuthLoginMethod = 'PASSWORD' | 'MAGIC_LINK' | 'QUICK_SWITCH' | 'PIN';

export interface MagicLinkRecord {
  token: string;
  email: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
}

export interface PasswordResetRecord {
  token: string;
  code: string;
  email: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
}

export interface UserAccount {
  id: string;
  employeeId: string;
  email: string;
  fullName: string;
  fullNameEn?: string;
  role: EmployeeRole;
  passwordHash: string;
  pinCode?: string;
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

export type QuickLauncherId =
  | 'pos'
  | 'accounting'
  | 'spaces'
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
