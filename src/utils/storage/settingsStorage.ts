import {
  CompanySettings,
  DesignTheme,
  WhatsAppSettings,
  ResendSettings,
  WhatsAppMessageLog
} from "../../types";
import {
  DEFAULT_WHATSAPP_SETTINGS as DOMAIN_DEFAULT_WHATSAPP,
  DEFAULT_RESEND_SETTINGS as DOMAIN_DEFAULT_RESEND,
  DEFAULT_COMPANY_SETTINGS as DOMAIN_DEFAULT_COMPANY,
  DEFAULT_DESIGN_THEME as DOMAIN_DEFAULT_THEME
} from "../../domain/settings/settingsEngine";

const SETTINGS_STORAGE_KEY = "rv_studio_company_settings";
const THEME_STORAGE_KEY = "rv_studio_design_theme";
const WHATSAPP_LOGS_STORAGE_KEY = "rv_studio_whatsapp_logs";

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = DOMAIN_DEFAULT_WHATSAPP;
export const DEFAULT_RESEND_SETTINGS: ResendSettings = DOMAIN_DEFAULT_RESEND;
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = DOMAIN_DEFAULT_COMPANY;
export const DEFAULT_DESIGN_THEME: DesignTheme = DOMAIN_DEFAULT_THEME;

/**
 * Reads company settings from localStorage, or returns DEFAULT_COMPANY_SETTINGS if empty/invalid.
 */
export function loadCompanySettings(): CompanySettings {
  if (typeof localStorage === "undefined") return DEFAULT_COMPANY_SETTINGS;

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANY_SETTINGS;
    const parsed = JSON.parse(raw);
    
    // Deep merge defaults for nested objects (bankDetails, whatsappSettings, etc.)
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
      },
      resendSettings: {
        ...DEFAULT_RESEND_SETTINGS,
        ...(parsed.resendSettings || {})
      }
    };
  } catch (e) {
    console.warn("Failed to load company settings from localStorage:", e);
    return DEFAULT_COMPANY_SETTINGS;
  }
}

/**
 * Saves company settings to localStorage.
 */
export function saveCompanySettings(settings: CompanySettings): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save company settings to localStorage:", e);
  }
}

/**
 * Reads design theme settings from localStorage, or returns DEFAULT_DESIGN_THEME.
 */
export function loadDesignTheme(): DesignTheme {
  if (typeof localStorage === "undefined") return DEFAULT_DESIGN_THEME;

  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_DESIGN_THEME;
    return { ...DEFAULT_DESIGN_THEME, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Failed to load design theme from localStorage:", e);
    return DEFAULT_DESIGN_THEME;
  }
}

/**
 * Saves design theme settings to localStorage.
 */
export function saveDesignTheme(theme: DesignTheme): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (e) {
    console.error("Failed to save design theme to localStorage:", e);
  }
}

/**
 * Loads WhatsApp outbound message logs from localStorage.
 */
export function loadWhatsAppLogs(): WhatsAppMessageLog[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(WHATSAPP_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to load WhatsApp logs from localStorage:", e);
    return [];
  }
}

/**
 * Appends a log entry to WhatsApp message logs (max 100 entries).
 */
export function saveWhatsAppLog(log: WhatsAppMessageLog): void {
  if (typeof localStorage === "undefined") return;

  try {
    const logs = loadWhatsAppLogs();
    const updated = [log, ...logs].slice(0, 100);
    localStorage.setItem(WHATSAPP_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save WhatsApp log to localStorage:", e);
  }
}

/**
 * Clears WhatsApp message logs from localStorage.
 */
export function clearWhatsAppLogs(): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.removeItem(WHATSAPP_LOGS_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear WhatsApp logs from localStorage:", e);
  }
}
