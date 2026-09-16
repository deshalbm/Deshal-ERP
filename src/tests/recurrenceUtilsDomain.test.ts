import {
  calculateNextDueDate,
  getUpcomingPreviewDates,
  formatDateToYMD,
  getDaysUntilDue,
  getFrequencyLabel
} from "../domain/finance/recurrenceUtils";

import {
  calculateNextDueDate as UTILS_calculateNextDueDate,
  getUpcomingPreviewDates as UTILS_getUpcomingPreviewDates,
  getDaysUntilDue as UTILS_getDaysUntilDue
} from "../utils/recurrenceUtils";

console.log("\n================================================================");
console.log("  DESHAL ERP — RECURRENCE UTILS DOMAIN UNIT TEST SUITE");
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

// TEST 1: Recurrence Frequency Date Math
console.log("--- TEST 1: RECURRENCE FREQUENCY DATE MATH ---");
assert(calculateNextDueDate("2026-01-01", "DAILY") === "2026-01-02", "DAILY increments date by 1 day");
assert(calculateNextDueDate("2026-01-01", "WEEKLY") === "2026-01-08", "WEEKLY increments date by 7 days");
assert(calculateNextDueDate("2026-01-01", "BIWEEKLY") === "2026-01-15", "BIWEEKLY increments date by 14 days");
assert(calculateNextDueDate("2026-01-01", "MONTHLY") === "2026-02-01", "MONTHLY increments date by 1 month");
assert(calculateNextDueDate("2026-01-01", "QUARTERLY") === "2026-04-01", "QUARTERLY increments date by 3 months");
assert(calculateNextDueDate("2026-01-01", "SEMI_ANNUALLY") === "2026-07-01", "SEMI_ANNUALLY increments date by 6 months");
assert(calculateNextDueDate("2026-01-01", "ANNUALLY") === "2027-01-01", "ANNUALLY increments date by 1 year");

// TEST 2: Preview Date Sequences
console.log("\n--- TEST 2: PREVIEW DATE SEQUENCES ---");
const preview = getUpcomingPreviewDates("2026-01-01", "MONTHLY", 4);
assert(preview.length === 4, "Generates 4 preview dates when count is 4");
assert(
  preview[0] === "2026-01-01" && preview[1] === "2026-02-01" && preview[2] === "2026-03-01" && preview[3] === "2026-04-01",
  "Generates correct monthly sequence: 2026-01-01, 02-01, 03-01, 04-01"
);

const previewCutoff = getUpcomingPreviewDates("2026-01-01", "MONTHLY", 5, "2026-03-01");
assert(
  previewCutoff.length === 3 && previewCutoff[2] === "2026-03-01",
  "Truncates preview dates sequence at specified endDateStr cutoff"
);

// TEST 3: Overdue Day Math
console.log("\n--- TEST 3: OVERDUE DAY MATH ---");
assert(getDaysUntilDue("2026-01-10", "2026-01-10") === 0, "Returns 0 days for target date matching today");
assert(getDaysUntilDue("2026-01-15", "2026-01-10") === 5, "Returns +5 days for target date 5 days in future");
assert(getDaysUntilDue("2026-01-05", "2026-01-10") === -5, "Returns -5 days for target date 5 days in past (overdue)");

// TEST 4: Frequency Localized Labels
console.log("\n--- TEST 4: FREQUENCY LOCALIZED LABELS ---");
assert(getFrequencyLabel("MONTHLY", "ar") === "شهرياً", "Returns 'شهرياً' for MONTHLY in Arabic");
assert(getFrequencyLabel("MONTHLY", "en") === "Monthly", "Returns 'Monthly' for MONTHLY in English");
assert(getFrequencyLabel("QUARTERLY", "ar") === "كل 3 أشهر (ربع سنوي)", "Returns 'كل 3 أشهر (ربع سنوي)' for QUARTERLY in Arabic");

// TEST 5: Re-export Compatibility
console.log("\n--- TEST 5: RE-EXPORT COMPATIBILITY ---");
assert(
  calculateNextDueDate === UTILS_calculateNextDueDate,
  "calculateNextDueDate re-exported from utils/recurrenceUtils references exact domain function"
);
assert(
  getUpcomingPreviewDates === UTILS_getUpcomingPreviewDates,
  "getUpcomingPreviewDates re-exported from utils/recurrenceUtils references exact domain function"
);
assert(
  getDaysUntilDue === UTILS_getDaysUntilDue,
  "getDaysUntilDue re-exported from utils/recurrenceUtils references exact domain function"
);

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
