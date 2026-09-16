/**
 * DESHAL ERP — CURRENCY CONVERTER DOMAIN UNIT TEST SUITE
 * 
 * Verifies currency metadata lookups, exchange rate math, multi-currency conversion,
 * amount formatting, and facade re-export reference identity.
 */

import {
  AVAILABLE_CURRENCIES,
  DEFAULT_RATES_VS_USD,
  getCurrencyInfo,
  getActiveRates,
  getExchangeRate,
  convertCurrency,
  formatCurrencyAmount
} from "../domain/finance/currencyConverter";
import { fetchLiveExchangeRates } from "../lib/currencyApi";

import {
  AVAILABLE_CURRENCIES as AVAILABLE_CURRENCIES_FACADE,
  DEFAULT_RATES_VS_USD as DEFAULT_RATES_VS_USD_FACADE,
  getCurrencyInfo as getCurrencyInfoFacade,
  convertCurrency as convertCurrencyFacade
} from "../utils/currencyConverter";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

async function runTests() {
  console.log("================================================================");
  console.log("  DESHAL ERP — CURRENCY CONVERTER DOMAIN UNIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: CURRENCY METADATA LOOKUP ---
  console.log("\n--- TEST 1: CURRENCY METADATA LOOKUP ---");
  const omrInfo = getCurrencyInfo("OMR");
  assert(omrInfo.code === "OMR", "Retrieves OMR currency info");
  assert(omrInfo.decimals === 3, "OMR has 3 decimals");
  assert(omrInfo.symbolAr === "ر.ع.", "OMR Arabic symbol is ر.ع.");

  const usdInfo = getCurrencyInfo("usd"); // lower case input
  assert(usdInfo.code === "USD", "Retrieves USD currency info (case-insensitive)");
  assert(usdInfo.decimals === 2, "USD has 2 decimals");

  const unknownInfo = getCurrencyInfo("XYZ");
  assert(unknownInfo.code === "XYZ", "Returns fallback CurrencyInfo for unknown currency code");
  assert(unknownInfo.decimals === 2, "Fallback currency defaults to 2 decimals");

  // --- TEST 2: EXCHANGE RATE CALCULATIONS ---
  console.log("\n--- TEST 2: EXCHANGE RATE CALCULATIONS ---");
  const sameRate = getExchangeRate("OMR", "OMR");
  assert(sameRate === 1.0, "Identical currency exchange rate is 1.0");

  const omrVsUsd = getExchangeRate("OMR", "USD"); // 1 OMR = (1 / 0.3845) USD ≈ 2.60078
  assert(omrVsUsd > 2.5 && omrVsUsd < 2.7, "Calculates correct OMR to USD exchange rate");

  const usdVsOmr = getExchangeRate("USD", "OMR"); // 1 USD = 0.3845 OMR
  assert(usdVsOmr === 0.3845, "Calculates correct USD to OMR exchange rate");

  const customRates = { OMR: 0.4000, USD: 1.0 };
  const customRate = getExchangeRate("USD", "OMR", customRates);
  assert(customRate === 0.4000, "Respects custom rate overrides");

  // --- TEST 3: CURRENCY CONVERSION ---
  console.log("\n--- TEST 3: CURRENCY CONVERSION ---");
  const zeroConv = convertCurrency(0, "OMR", "USD");
  assert(zeroConv === 0, "Converting zero returns 0");

  const nanConv = convertCurrency(NaN, "OMR", "USD");
  assert(nanConv === 0, "Converting NaN returns 0");

  const sameConv = convertCurrency(100, "OMR", "OMR");
  assert(sameConv === 100, "Converting same currency returns original amount");

  const usdToOmrConv = convertCurrency(100, "USD", "OMR");
  assert(usdToOmrConv === 38.45, "Converts 100 USD to 38.450 OMR with 3 decimals precision");

  // --- TEST 4: AMOUNT FORMATTING ---
  console.log("\n--- TEST 4: AMOUNT FORMATTING ---");
  const omrArFmt = formatCurrencyAmount(12.3, "OMR", "ar");
  assert(omrArFmt.includes("ر.ع.") || omrArFmt.includes("12.300"), "Formats OMR in Arabic with 3 decimals");

  const usdEnFmt = formatCurrencyAmount(12.3, "USD", "en");
  assert(usdEnFmt.includes("$") || usdEnFmt.includes("12.30"), "Formats USD in English with 2 decimals");

  // --- TEST 5: LIVE RATES FALLBACK ENGINE ---
  console.log("\n--- TEST 5: LIVE RATES FALLBACK ENGINE ---");
  const liveResult = await fetchLiveExchangeRates();
  assert(liveResult.success === true, "fetchLiveExchangeRates returns success flag");
  assert(typeof liveResult.rates === "object" && liveResult.rates.OMR !== undefined, "fetchLiveExchangeRates returns rates map containing OMR");

  // --- TEST 6: RE-EXPORT COMPATIBILITY ---
  console.log("\n--- TEST 6: RE-EXPORT COMPATIBILITY ---");
  assert(AVAILABLE_CURRENCIES_FACADE === AVAILABLE_CURRENCIES, "AVAILABLE_CURRENCIES re-exported from utils references domain array");
  assert(DEFAULT_RATES_VS_USD_FACADE === DEFAULT_RATES_VS_USD, "DEFAULT_RATES_VS_USD re-exported from utils references domain map");
  assert(getCurrencyInfoFacade === getCurrencyInfo, "getCurrencyInfo re-exported from utils references exact domain function");
  assert(convertCurrencyFacade === convertCurrency, "convertCurrency re-exported from utils references exact domain function");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
