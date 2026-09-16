/**
 * DESHAL ERP — CURRENCY CONVERTER & EXCHANGE RATES (RE-EXPORTS)
 *
 * Re-exports pure domain currency converter rules and constants from
 * src/domain/finance/currencyConverter.ts for 100% backward compatibility.
 */

export type { CurrencyInfo } from "../domain/finance/currencyConverter";
export {
  AVAILABLE_CURRENCIES,
  DEFAULT_RATES_VS_USD,
  getCurrencyInfo,
  getActiveRates,
  getExchangeRate,
  convertCurrency,
  formatCurrencyAmount
} from "../domain/finance/currencyConverter";
export { fetchLiveExchangeRates } from "../lib/currencyApi";
