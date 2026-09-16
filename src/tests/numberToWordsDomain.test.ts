import {
  numberToWords,
  numberToArabicWords,
  numberToEnglishWords
} from "../domain/finance/numberToWords";

import {
  numberToWords as UTILS_numberToWords,
  numberToArabicWords as UTILS_numberToArabicWords,
  numberToEnglishWords as UTILS_numberToEnglishWords
} from "../utils/numberToWords";

console.log("\n================================================================");
console.log("  DESHAL ERP — FINANCIAL NUMBER-TO-WORDS DOMAIN UNIT TEST SUITE");
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

// TEST 1: English Number-To-Words Invariants
console.log("--- TEST 1: ENGLISH NUMBER-TO-WORDS INVARIANTS ---");
const enResult1 = numberToEnglishWords(1250.5, "OMR");
assert(
  enResult1.includes("One Thousand Two Hundred Fifty Omani Rials"),
  "Translates 1250 integer part to 'One Thousand Two Hundred Fifty Omani Rials'"
);
assert(
  enResult1.includes("and 500/1000 Baisa"),
  "Formats 0.500 decimal part correctly as 'and 500/1000 Baisa'"
);

const enZero = numberToEnglishWords(0, "OMR");
assert(enZero === "Zero Omani Rials Only", "Translates 0 OMR to 'Zero Omani Rials Only'");

const enUsd = numberToEnglishWords(100.25, "USD");
assert(
  enUsd === "One Hundred US Dollars and 25/100 Cents",
  "Formats 100.25 USD as 'One Hundred US Dollars and 25/100 Cents'"
);

// TEST 2: Arabic Tafqeet Number-To-Words Invariants
console.log("\n--- TEST 2: ARABIC TAFQEET NUMBER-TO-WORDS INVARIANTS ---");
const arResult1 = numberToArabicWords(1250.5, "OMR");
assert(
  arResult1.includes("فقط ألف ومائتان وخمسون ريال عماني"),
  "Translates 1250 OMR integer part to 'فقط ألف ومائتان وخمسون ريال عماني'"
);
assert(
  arResult1.includes("وخمسمائة بيسة لا غير"),
  "Formats 0.500 OMR decimal part to 'وخمسمائة بيسة لا غير'"
);

const arZero = numberToArabicWords(0, "OMR");
assert(arZero === "فقط صفر ريال عماني لا غير", "Translates 0 OMR to 'فقط صفر ريال عماني لا غير'");

const arSar = numberToArabicWords(50.75, "SAR");
assert(
  arSar === "فقط خمسون ريال سعودي وخمسة وسبعون هللة لا غير",
  "Formats 50.75 SAR correctly as 'فقط خمسون ريال سعودي وخمسة وسبعون هللة لا غير'"
);

// TEST 3: Dynamic Dispatcher Invariants
console.log("\n--- TEST 3: DYNAMIC DISPATCHER INVARIANTS ---");
const dispatchAr = numberToWords(250, "OMR", "ar");
const dispatchEn = numberToWords(250, "OMR", "en");
assert(
  dispatchAr === numberToArabicWords(250, "OMR"),
  "Dispatcher in 'ar' mode matches numberToArabicWords"
);
assert(
  dispatchEn === numberToEnglishWords(250, "OMR"),
  "Dispatcher in 'en' mode matches numberToEnglishWords"
);

// TEST 4: Re-export Reference Compatibility
console.log("\n--- TEST 4: RE-EXPORT REFERENCE COMPATIBILITY ---");
assert(
  numberToWords === UTILS_numberToWords,
  "numberToWords re-exported from utils/numberToWords references exact domain function"
);
assert(
  numberToArabicWords === UTILS_numberToArabicWords,
  "numberToArabicWords re-exported from utils/numberToWords references exact domain function"
);
assert(
  numberToEnglishWords === UTILS_numberToEnglishWords,
  "numberToEnglishWords re-exported from utils/numberToWords references exact domain function"
);

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
