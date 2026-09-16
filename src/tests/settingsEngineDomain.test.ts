/**
 * Characterization Unit Test Suite — ERP Master Settings & Regulatory Compliance Engine
 * Verifies Omani IBAN formatting, Omani Commercial Registration & Tax ID compliance,
 * OMR 3-decimal currency policy, WhatsApp gateway rules, and design theme compliance.
 */

import {
  validateOmaniIBAN,
  validateOmaniRegulatoryCompliance,
  validateERPCurrencyPolicy,
  validateWhatsAppGatewaySettings,
  validateDesignThemeCompliance,
} from '../domain/settings/settingsEngine';
import { CompanySettings, DesignTheme, WhatsAppSettings } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log("\n================================================================");
  console.log("  DESHAL ERP — MASTER SETTINGS & REGULATORY COMPLIANCE TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: OMANI IBAN VALIDATION ---
  console.log("\n--- TEST 1: OMANI IBAN VALIDATION ---");
  const validIBAN = 'OM1234567890123456789012';
  const validIBANWithSpaces = 'OM12 3456 7890 1234 5678 9012';
  const invalidPrefixIBAN = 'AE1234567890123456789012';
  const invalidShortIBAN = 'OM12345';

  assert(validateOmaniIBAN(validIBAN) === true, 'Valid 24-char Omani IBAN starting with OM is valid');
  assert(validateOmaniIBAN(validIBANWithSpaces) === true, 'Omani IBAN with spaces is sanitized and validated');
  assert(validateOmaniIBAN(invalidPrefixIBAN) === false, 'IBAN not starting with OM is invalid');
  assert(validateOmaniIBAN(invalidShortIBAN) === false, 'Short IBAN (<24 chars) is invalid');
  assert(validateOmaniIBAN(undefined) === false, 'Undefined IBAN returns false');

  // --- TEST 2: OMANI REGULATORY COMPLIANCE VALIDATION ---
  console.log("\n--- TEST 2: OMANI REGULATORY COMPLIANCE VALIDATION ---");
  const validCompany: CompanySettings = {
    companyName: 'شركة دِشال للأعمال المتميزة ش.م.م',
    tagline: 'تميز في الأداء',
    logoUrl: '',
    logoWidth: 140,
    crNumber: 'CR-1029384',
    taxId: 'OM9876543210',
    phone: '96890000000',
    email: 'info@deshalbm.com',
    address: 'مسقط، سلطنة عمان',
    cityStateZip: 'Muscat, Oman 100',
    country: 'Oman',
    website: 'https://deshalbm.com',
    headerNotice: '',
    footerNotice: '',
    termsAndConditions: '',
    authorizedSignatoryName: 'مدير النظام',
    authorizedSignatoryTitle: 'الرئيس التنفيذي',
    signatureImageUrl: '',
    stampImageUrl: '',
    defaultCustomFields: [],
    qrCodeContent: '',
    bankDetails: {
      bankName: 'Bank Muscat',
      accountName: 'Deshal BM LLC',
      accountNumber: '012345678901',
      iban: 'OM1234567890123456789012',
      swiftCode: 'BMUSOMRX',
    },
  };

  const validResult = validateOmaniRegulatoryCompliance(validCompany);
  assert(validResult.isValid === true, 'Valid Omani company profile passes regulatory check');
  assert(validResult.errors.length === 0, 'No regulatory errors for complete profile');

  const invalidCompany: CompanySettings = {
    ...validCompany,
    companyName: '',
    crNumber: '',
    taxId: '123456', // missing OM prefix
    bankDetails: {
      ...validCompany.bankDetails,
      iban: 'OM123', // invalid short IBAN
    },
  };

  const invalidResult = validateOmaniRegulatoryCompliance(invalidCompany);
  assert(invalidResult.isValid === false, 'Incomplete company profile fails regulatory check');
  assert(invalidResult.errors.length >= 4, 'Reports errors for missing name, CR, invalid Tax ID, and invalid IBAN');

  // --- TEST 3: OMR CURRENCY & VAT POLICY VALIDATION ---
  console.log("\n--- TEST 3: OMR CURRENCY & VAT POLICY VALIDATION ---");
  const omrPolicy = validateERPCurrencyPolicy('OMR');
  assert(omrPolicy.isValid === true, 'OMR currency policy is valid');
  assert(omrPolicy.decimals === 3, 'OMR currency strictly uses 3 decimal places');
  assert(omrPolicy.vatRate === 5, 'OMR currency uses standard 5% VAT rate');

  const usdPolicy = validateERPCurrencyPolicy('USD');
  assert(usdPolicy.isValid === true, 'USD currency policy is valid');
  assert(usdPolicy.decimals === 2, 'Non-OMR currency uses 2 decimal places');
  assert(usdPolicy.message !== undefined, 'Provides informational note for non-OMR currency');

  // --- TEST 4: WHATSAPP GATEWAY SETTINGS VALIDATION ---
  console.log("\n--- TEST 4: WHATSAPP GATEWAY SETTINGS VALIDATION ---");
  const validWA: WhatsAppSettings = {
    enabled: true,
    provider: 'baileys',
    serverPreset: 'generic_baileys',
    serverUrl: 'https://wa.deshalbm.com',
    apiKey: 'secret-api-key',
    sessionId: 'deshal-erp-session',
    defaultCountryCode: '968',
    includePdfLink: true,
    autoSendOnVoucherCreate: false,
    autoSendOnPOSCheckout: false,
    autoSendOnDueDateReminder: false,
  };

  const waValidResult = validateWhatsAppGatewaySettings(validWA);
  assert(waValidResult.isValid === true, 'Valid WhatsApp gateway configuration passes check');

  const invalidWA: WhatsAppSettings = {
    ...validWA,
    enabled: true,
    serverUrl: '',
    defaultCountryCode: '971', // Not Oman country code
  };

  const waInvalidResult = validateWhatsAppGatewaySettings(invalidWA);
  assert(waInvalidResult.isValid === false, 'WhatsApp gateway with empty URL and non-968 country code fails check');
  assert(waInvalidResult.errors.length === 2, 'Reports errors for missing server URL and non-968 country code');

  // --- TEST 5: PRINT DESIGN THEME COMPLIANCE ---
  console.log("\n--- TEST 5: PRINT DESIGN THEME COMPLIANCE ---");
  const validTheme: DesignTheme = {
    templateId: 'modern',
    primaryColor: '#0055FF',
    secondaryColor: '#6B7280',
    accentColor: '#10B981',
    textColor: '#111827',
    backgroundColor: '#FFFFFF',
    fontFamily: 'sans',
    pageSize: 'A4',
    showLogo: true,
    showStamp: true,
    showSignatureBlock: true,
    showAmountInWords: true,
    showQrCode: true,
    showWatermark: false,
    watermarkText: '',
    showBankDetails: true,
    borderStyle: 'subtle',
    headerLayout: 'standard',
  };

  const themeResult = validateDesignThemeCompliance(validTheme);
  assert(themeResult.isValid === true, 'Design theme compliance result is valid');
  assert(themeResult.pageSize === 'A4', 'Maintains valid A4 page size');

  const invalidPageSizeTheme: DesignTheme = {
    ...validTheme,
    pageSize: 'INVALID_SIZE' as any,
  };

  const themeFallbackResult = validateDesignThemeCompliance(invalidPageSizeTheme);
  assert(themeFallbackResult.pageSize === 'A4', 'Falls back to standard A4 for unrecognized page size');

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
