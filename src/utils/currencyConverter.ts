// Currency Conversion & Exchange Rates Manager

export interface CurrencyInfo {
  code: string;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  decimals: number;
  flag: string;
}

export const AVAILABLE_CURRENCIES: CurrencyInfo[] = [
  { code: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial", symbolAr: "ر.ع.", symbolEn: "OMR", decimals: 3, flag: "🇴🇲" },
  { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", symbolAr: "ر.س", symbolEn: "SAR", decimals: 2, flag: "🇸🇦" },
  { code: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", symbolAr: "د.إ", symbolEn: "AED", decimals: 2, flag: "🇦🇪" },
  { code: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", symbolAr: "د.ك", symbolEn: "KWD", decimals: 3, flag: "🇰🇼" },
  { code: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", symbolAr: "د.ب", symbolEn: "BHD", decimals: 3, flag: "🇧🇭" },
  { code: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal", symbolAr: "ر.ق", symbolEn: "QAR", decimals: 2, flag: "🇶🇦" },
  { code: "USD", nameAr: "دولار أمريكي", nameEn: "US Dollar", symbolAr: "$", symbolEn: "$", decimals: 2, flag: "🇺🇸" },
  { code: "EUR", nameAr: "يورو أوروبي", nameEn: "Euro", symbolAr: "€", symbolEn: "€", decimals: 2, flag: "🇪🇺" },
  { code: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound", symbolAr: "£", symbolEn: "£", decimals: 2, flag: "🇬🇧" },
  { code: "INR", nameAr: "روبية هندية", nameEn: "Indian Rupee", symbolAr: "₹", symbolEn: "₹", decimals: 2, flag: "🇮🇳" },
  { code: "JPY", nameAr: "ين ياباني", nameEn: "Japanese Yen", symbolAr: "¥", symbolEn: "¥", decimals: 0, flag: "🇯🇵" },
  { code: "CAD", nameAr: "دولار كندي", nameEn: "Canadian Dollar", symbolAr: "C$", symbolEn: "CAD", decimals: 2, flag: "🇨🇦" },
  { code: "AUD", nameAr: "دولار أسترالي", nameEn: "Australian Dollar", symbolAr: "A$", symbolEn: "AUD", decimals: 2, flag: "🇦🇺" },
  { code: "CHF", nameAr: "فرنك سويسري", nameEn: "Swiss Franc", symbolAr: "CHF", symbolEn: "CHF", decimals: 2, flag: "🇨🇭" },
  { code: "CNY", nameAr: "يوان صيني", nameEn: "Chinese Yuan", symbolAr: "¥", symbolEn: "CNY", decimals: 2, flag: "🇨🇳" }
];

// Default Rates relative to 1 USD
export const DEFAULT_RATES_VS_USD: Record<string, number> = {
  USD: 1.0,
  OMR: 0.3845,
  SAR: 3.75,
  AED: 3.6725,
  KWD: 0.3075,
  BHD: 0.376,
  QAR: 3.64,
  EUR: 0.92,
  GBP: 0.785,
  INR: 83.4,
  JPY: 154.5,
  CAD: 1.37,
  AUD: 1.52,
  CHF: 0.905,
  CNY: 7.24
};

const STORAGE_RATES_KEY = "rv_exchange_rates_cache";
const STORAGE_LAST_UPDATE_KEY = "rv_exchange_rates_last_updated";

/**
 * Get the currency info for a given currency code
 */
export function getCurrencyInfo(code: string): CurrencyInfo {
  const found = AVAILABLE_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (found) return found;
  return {
    code: code.toUpperCase(),
    nameAr: code,
    nameEn: code,
    symbolAr: code,
    symbolEn: code,
    decimals: 2,
    flag: "🌐"
  };
}

/**
 * Get active rates (from cache, settings, or default)
 */
export function getActiveRates(customRates?: Record<string, number>): Record<string, number> {
  if (customRates && Object.keys(customRates).length > 0) {
    return { ...DEFAULT_RATES_VS_USD, ...customRates };
  }
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_RATES_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...DEFAULT_RATES_VS_USD, ...parsed };
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_RATES_VS_USD;
}

/**
 * Calculate exchange rate between any two currencies: fromCurrency -> toCurrency
 * Returns how many units of `toCurrency` 1 unit of `fromCurrency` buys.
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): number {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return 1.0;

  const rates = getActiveRates(customRates);
  const fromRateVsUsd = rates[fromCurrency.toUpperCase()] || DEFAULT_RATES_VS_USD[fromCurrency.toUpperCase()] || 1.0;
  const toRateVsUsd = rates[toCurrency.toUpperCase()] || DEFAULT_RATES_VS_USD[toCurrency.toUpperCase()] || 1.0;

  // 1 From = (1 / fromRateVsUsd) USD = (1 / fromRateVsUsd) * toRateVsUsd To
  const rate = (1 / fromRateVsUsd) * toRateVsUsd;
  return rate;
}

/**
 * Convert an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): number {
  if (isNaN(amount) || amount === 0) return 0;
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;

  const rate = getExchangeRate(fromCurrency, toCurrency, customRates);
  const converted = amount * rate;
  const targetInfo = getCurrencyInfo(toCurrency);
  return Number(converted.toFixed(targetInfo.decimals));
}

/**
 * Format currency with appropriate decimals and symbol
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  locale: "ar" | "en" = "ar"
): string {
  const info = getCurrencyInfo(currencyCode);
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals
  });
  const symbol = locale === "ar" ? info.symbolAr : info.symbolEn;
  return `${formatted} ${symbol}`;
}

/**
 * Fetch live exchange rates from public open rates API with fallback
 */
export async function fetchLiveExchangeRates(): Promise<{
  success: boolean;
  rates: Record<string, number>;
  timestamp: string;
  source: string;
}> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const liveRates: Record<string, number> = {};
        AVAILABLE_CURRENCIES.forEach((c) => {
          if (data.rates[c.code]) {
            liveRates[c.code] = Number(data.rates[c.code]);
          } else {
            liveRates[c.code] = DEFAULT_RATES_VS_USD[c.code] || 1;
          }
        });
        const now = new Date().toISOString();
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_RATES_KEY, JSON.stringify(liveRates));
          localStorage.setItem(STORAGE_LAST_UPDATE_KEY, now);
        }
        return {
          success: true,
          rates: liveRates,
          timestamp: now,
          source: "Open Exchange Rates (Live)"
        };
      }
    }
  } catch {
    // network failure or timeout, return cached/defaults
  }

  const now = new Date().toISOString();
  return {
    success: true,
    rates: DEFAULT_RATES_VS_USD,
    timestamp: now,
    source: "Standard Central Bank Rates (Offline)"
  };
}
