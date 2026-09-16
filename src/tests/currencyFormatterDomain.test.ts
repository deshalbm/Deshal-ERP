import {
  formatOMR,
  formatCurrency
} from "../domain/finance/currencyFormatter";

import {
  formatOMR as UTILS_formatOMR,
  formatCurrency as UTILS_formatCurrency
} from "../utils/currencyFormatter";

console.log("\n================================================================");
console.log("  DESHAL ERP — CURRENCY FORMATTER DOMAIN UNIT TEST SUITE");
console.log("================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// TEST 1: OMR 3-Decimal Formatting
console.log("--- TEST 1: OMR 3-DECIMAL FORMATTING ---");
assert(formatOMR(150.5) === "150.500 OMR", "Formats 150.5 to '150.500 OMR' with 3 decimal places");
assert(formatOMR(150.5, false) === "150.500", "Formats 150.5 without symbol to '150.500'");
assert(formatOMR(0) === "0.000 OMR", "Formats 0 to '0.000 OMR'");

// TEST 2: Multi-Currency Decimal Precision
console.log("\n--- TEST 2: MULTI-CURRENCY DECIMAL PRECISION ---");
assert(formatCurrency(150.5, "OMR") === "150.500 OMR", "Formats OMR with 3 decimal places");
assert(formatCurrency(150.5, "USD") === "150.50 USD", "Formats USD with 2 decimal places");
assert(formatCurrency(150.5, "SAR") === "150.50 SAR", "Formats SAR with 2 decimal places");
assert(formatCurrency(150.5, "EUR") === "150.50 EUR", "Formats EUR with 2 decimal places");

// TEST 3: Null, Undefined & NaN Input Safety
console.log("\n--- TEST 3: NULL, UNDEFINED & NAN INPUT SAFETY ---");
assert(formatOMR(null) === "0.000 OMR", "Defaults null to '0.000 OMR'");
assert(formatOMR(undefined) === "0.000 OMR", "Defaults undefined to '0.000 OMR'");
assert(formatCurrency(null, "USD") === "0.00 USD", "Defaults null USD to '0.00 USD'");

// TEST 4: Re-export Compatibility
console.log("\n--- TEST 4: RE-EXPORT COMPATIBILITY ---");
assert(
  formatOMR === UTILS_formatOMR,
  "formatOMR re-exported from utils/currencyFormatter references exact domain function"
);
assert(
  formatCurrency === UTILS_formatCurrency,
  "formatCurrency re-exported from utils/currencyFormatter references exact domain function"
);

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
