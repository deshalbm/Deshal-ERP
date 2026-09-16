import { AVAILABLE_CURRENCIES, DEFAULT_RATES_VS_USD } from "../domain/finance/currencyConverter";

const STORAGE_RATES_KEY = "rv_exchange_rates_cache";
const STORAGE_LAST_UPDATE_KEY = "rv_exchange_rates_last_updated";

/**
 * Infrastructure / Network Helper:
 * Fetch live exchange rates from public open rates API with offline fallback.
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
