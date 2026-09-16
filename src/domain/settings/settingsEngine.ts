/**
 * ERP Master Settings & Regulatory Compliance Engine — Deshal ERP
 * Pure Domain Layer: Omani Commercial Registration & Tax ID validation,
 * Omani IBAN formatting, currency & 5% VAT policy rules, messaging gateway configuration rules,
 * and print design theme compliance.
 */

import { CompanySettings, DesignTheme, WhatsAppSettings, ResendSettings } from '../../types';

export interface RegulatoryComplianceValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CurrencyPolicyResult {
  isValid: boolean;
  currency: string;
  decimals: number;
  vatRate: number;
  message?: string;
}

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

export const DEFAULT_RESEND_SETTINGS: ResendSettings = {
  enabled: true,
  fromEmail: "onboarding@resend.dev",
  fromName: "نظام ديشال ERP الإداري",
  autoSendWelcomeEmail: true,
  customWelcomeSubject: "مرحباً بك في نظام ديشال ERP - بيانات حساب تسجيل الدخول الخاصة بك",
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "ديشال لإدارة الأعمال (Deshal ERP)",
  tagline: "Deshal Business Management & ERP Solutions",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
  logoWidth: 150,
  taxId: "OM-94288394-B",
  crNumber: "CR-1092831",
  address: "الطابق الثاني ٢٠٠٩-٢٠١٢ | مبنى عمانا بلازا | فلج القبائل | صحار | سلطنة عمان",
  cityStateZip: "الرمز البريدي: 311",
  country: "Sultanate of Oman",
  phone: "+968 77627500",
  landline: "+968 22730630",
  email: "info@deshalbm.com",
  website: "www.deshalbm.com",
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
  whatsappSettings: DEFAULT_WHATSAPP_SETTINGS,
  resendSettings: DEFAULT_RESEND_SETTINGS
};

export const DEFAULT_DESIGN_THEME: DesignTheme = {
  templateId: 'modern',
  primaryColor: '#4f46e5',
  secondaryColor: '#6366f1',
  accentColor: '#10b981',
  textColor: '#0f172a',
  backgroundColor: '#ffffff',
  fontFamily: 'sans',
  pageSize: 'A4',
  showLogo: true,
  showStamp: true,
  showSignatureBlock: true,
  showAmountInWords: true,
  showQrCode: true,
  showWatermark: true,
  watermarkText: 'PAID & VERIFIED',
  showBankDetails: true,
  borderStyle: 'subtle',
  headerLayout: 'standard',
};

/**
 * Validates Omani IBAN format (Must start with 'OM' and contain 24 characters).
 */
export function validateOmaniIBAN(iban?: string): boolean {
  if (!iban) return false;
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  if (!clean.startsWith('OM')) return false;
  return clean.length === 24 && /^[A-Z0-9]+$/.test(clean);
}

/**
 * Validates Company Profile against Omani Regulatory Compliance requirements (CR, Tax ID, IBAN).
 */
export function validateOmaniRegulatoryCompliance(
  settings: CompanySettings
): RegulatoryComplianceValidationResult {
  const errors: string[] = [];

  if (!settings.companyName || settings.companyName.trim() === '') {
    errors.push('اسم الشركة الإداري مطلوب.');
  }

  if (!settings.crNumber || settings.crNumber.trim() === '') {
    errors.push('رقم السجل التجاري (CR Number) مطلوب للالتزام التنظيمي.');
  }

  if (!settings.taxId || settings.taxId.trim() === '') {
    errors.push('الرقم الضريبي (Tax ID) مطلوب للالتزام بهيئة الضرائب.');
  } else if (!settings.taxId.startsWith('OM')) {
    errors.push('الرقم الضريبي (Tax ID) يجب أن يبدأ بالرمز OM للالتزام باللوائح الضريبية العمانية.');
  }

  if (settings.bankDetails?.iban && !validateOmaniIBAN(settings.bankDetails.iban)) {
    errors.push('رقم الحساب البنكي الدولي (IBAN) غير صالح (يجب أن يبدأ بـ OM ويتكون من 24 رمزاً).');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates ERP base currency policy (OMR with 3 decimals and 5% standard VAT rate).
 */
export function validateCurrencyPolicy(currency: string = 'OMR'): CurrencyPolicyResult {
  const upper = currency.toUpperCase().trim();

  if (upper === 'OMR') {
    return {
      isValid: true,
      currency: 'OMR',
      decimals: 3,
      vatRate: 5,
    };
  }

  return {
    isValid: true,
    currency: upper,
    decimals: 2,
    vatRate: 0,
    message: 'العملة المختارة ليست الريال العماني. سيتم استخدام خانتين عشريتين.'
  };
}

export function validateERPCurrencyPolicy(currency: string = 'OMR'): CurrencyPolicyResult {
  return validateCurrencyPolicy(currency);
}

export function validateWhatsAppGatewaySettings(settings?: WhatsAppSettings): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!settings) {
    return { isValid: false, errors: ['إعدادات الواتساب غير معرفة.'] };
  }
  if (settings.enabled && (!settings.serverUrl || settings.serverUrl.trim() === '')) {
    errors.push('رابط خادم الواتساب مطلوب عند تفعيل الخدمة.');
  }
  if (settings.defaultCountryCode && settings.defaultCountryCode !== '968') {
    errors.push('رمز الدولة للواتساب يجب أن يكون 968 (سلطنة عمان).');
  }
  return { isValid: errors.length === 0, errors };
}

export interface DesignThemeComplianceResult {
  isValid: boolean;
  pageSize: string;
  errors: string[];
}

export function validateDesignThemeCompliance(theme?: DesignTheme): DesignThemeComplianceResult {
  const errors: string[] = [];
  if (!theme) {
    return { isValid: false, pageSize: 'A4', errors: ['إعدادات القالب غير معرفة.'] };
  }
  const validSizes = ['A4', 'A5', 'LETTER', 'THERMAL_80MM', 'THERMAL_58MM'];
  let effectiveSize = theme.pageSize as string;
  if (!validSizes.includes(effectiveSize)) {
    errors.push('قياس الصفحة غير مدعوم للطباعة.');
    effectiveSize = 'A4';
  }
  return {
    isValid: errors.length === 0,
    pageSize: effectiveSize,
    errors
  };
}
