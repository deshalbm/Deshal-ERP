import {
  normalizeOmaniPhone,
  formatDisplayPhone
} from "../domain/common/phone";

import {
  normalizeOmaniPhone as UTILS_normalizeOmaniPhone,
  formatDisplayPhone as UTILS_formatDisplayPhone
} from "../utils/phone";

console.log("\n================================================================");
console.log("  DESHAL ERP — PHONE DOMAIN UNIT TEST SUITE");
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

// TEST 1: Local Omani 8-Digit Normalization
console.log("--- TEST 1: LOCAL OMANI 8-DIGIT NORMALIZATION ---");
assert(normalizeOmaniPhone("91234567") === "+96891234567", "Normalizes 8-digit mobile starting with 9");
assert(normalizeOmaniPhone("71234567") === "+96871234567", "Normalizes 8-digit mobile starting with 7");
assert(normalizeOmaniPhone("24123456") === "+96824123456", "Normalizes 8-digit landline starting with 2");

// TEST 2: International & Country Code Handling
console.log("\n--- TEST 2: INTERNATIONAL & COUNTRY CODE HANDLING ---");
assert(normalizeOmaniPhone("96891234567") === "+96891234567", "Normalizes 11-digit number with 968 prefix");
assert(normalizeOmaniPhone("0096891234567") === "+96891234567", "Trims leading '00' international prefix");
assert(normalizeOmaniPhone("+971501234567") === "+971501234567", "Preserves existing international + prefix");

// TEST 3: Display Formatting
console.log("\n--- TEST 3: DISPLAY FORMATTING ---");
assert(formatDisplayPhone("91234567") === "+968 9123 4567", "Formats 8-digit Omani number for UI display");
assert(formatDisplayPhone("0096891234567") === "+968 9123 4567", "Formats '00' prefixed number for UI display");
assert(formatDisplayPhone("+971501234567") === "+971501234567", "Returns non-Omani international numbers directly");

// TEST 4: Null, Empty & Invalid Input Handling
console.log("\n--- TEST 4: NULL, EMPTY & INVALID INPUT HANDLING ---");
assert(normalizeOmaniPhone(null) === "", "Returns empty string for null input");
assert(normalizeOmaniPhone(undefined) === "", "Returns empty string for undefined input");
assert(normalizeOmaniPhone("   ") === "", "Returns empty string for whitespace input");
assert(formatDisplayPhone(null) === "", "Returns empty display string for null input");

// TEST 5: Re-export Compatibility
console.log("\n--- TEST 5: RE-EXPORT COMPATIBILITY ---");
assert(
  normalizeOmaniPhone === UTILS_normalizeOmaniPhone,
  "normalizeOmaniPhone re-exported from utils/phone references exact domain function"
);
assert(
  formatDisplayPhone === UTILS_formatDisplayPhone,
  "formatDisplayPhone re-exported from utils/phone references exact domain function"
);

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
