import {
  formatDateToDDMMMMYYYY
} from "../domain/common/dateFormatter";

import {
  formatDateToDDMMMMYYYY as UTILS_formatDateToDDMMMMYYYY
} from "../utils/dateFormatter";

console.log("\n================================================================");
console.log("  DESHAL ERP — DATE FORMATTER DOMAIN UNIT TEST SUITE");
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

// TEST 1: YYYY-MM-DD Clean Parsing
console.log("--- TEST 1: YYYY-MM-DD CLEAN PARSING ---");
assert(
  formatDateToDDMMMMYYYY("2026-01-15") === "15/January/2026",
  "Formats '2026-01-15' as '15/January/2026'"
);
assert(
  formatDateToDDMMMMYYYY("2026-12-31") === "31/December/2026",
  "Formats '2026-12-31' as '31/December/2026'"
);

// TEST 2: Date Object Parsing
console.log("\n--- TEST 2: DATE OBJECT PARSING ---");
const dateObj = new Date(2026, 5, 20); // 20 June 2026
assert(
  formatDateToDDMMMMYYYY(dateObj) === "20/June/2026",
  "Formats JavaScript Date object (20 June 2026) as '20/June/2026'"
);

// TEST 3: Pre-formatted Passthrough
console.log("\n--- TEST 3: PRE-FORMATTED PASSTHROUGH ---");
assert(
  formatDateToDDMMMMYYYY("15/January/2026") === "15/January/2026",
  "Returns pre-formatted DD/MonthName/YYYY string unchanged"
);

// TEST 4: Null, Empty & Invalid Input Safety
console.log("\n--- TEST 4: NULL, EMPTY & INVALID INPUT SAFETY ---");
assert(formatDateToDDMMMMYYYY(null) === "", "Returns empty string for null input");
assert(formatDateToDDMMMMYYYY(undefined) === "", "Returns empty string for undefined input");
assert(formatDateToDDMMMMYYYY("") === "", "Returns empty string for empty string input");
assert(
  formatDateToDDMMMMYYYY("invalid-date-string") === "invalid-date-string",
  "Returns original string representation for unparseable input string"
);

// TEST 5: Re-export Compatibility
console.log("\n--- TEST 5: RE-EXPORT COMPATIBILITY ---");
assert(
  formatDateToDDMMMMYYYY === UTILS_formatDateToDDMMMMYYYY,
  "formatDateToDDMMMMYYYY re-exported from utils/dateFormatter references exact domain function"
);

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
