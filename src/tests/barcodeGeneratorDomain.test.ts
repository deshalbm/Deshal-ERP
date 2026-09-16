import {
  encodeCode128B,
  generateBarcodeSvgData,
  CODE128_PATTERNS,
  START_CODE_B,
  STOP_CODE
} from "../domain/inventory/barcodeGenerator";

import {
  encodeCode128B as UTILS_encodeCode128B,
  generateBarcodeSvgData as UTILS_generateBarcodeSvgData,
  CODE128_PATTERNS as UTILS_CODE128_PATTERNS
} from "../utils/barcodeGenerator";

console.log("\n================================================================");
console.log("  DESHAL ERP — BARCODE GENERATOR DOMAIN UNIT TEST SUITE");
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

// TEST 1: Code-128B Binary Pattern Encoding
console.log("--- TEST 1: CODE-128B BINARY PATTERN ENCODING ---");
const encoded = encodeCode128B("PROD-1001");
assert(encoded.valid === true, "encodeCode128B returns valid: true for 'PROD-1001'");
assert(
  typeof encoded.checksum === "number" && encoded.checksum >= 0 && encoded.checksum < 103,
  "Calculates valid modulo 103 checksum (0 <= checksum < 103)"
);
assert(
  encoded.pattern.startsWith("0000000000") && encoded.pattern.endsWith("0000000000"),
  "Binary pattern starts and ends with 10-module quiet zones"
);
assert(
  encoded.pattern.includes(CODE128_PATTERNS[START_CODE_B]),
  "Binary pattern contains Start Code B module"
);

// TEST 2: Input Sanitization & Empty Handling
console.log("\n--- TEST 2: INPUT SANITIZATION & EMPTY HANDLING ---");
const emptyResult = encodeCode128B("");
assert(emptyResult.valid === false && emptyResult.pattern === "", "Returns valid: false for empty text");

const unicodeResult = encodeCode128B("منتج-123");
assert(
  unicodeResult.valid === true && unicodeResult.pattern.length > 0,
  "Sanitizes non-ASCII Unicode characters to standard dash replacement"
);

// TEST 3: SVG Rectangle Coordinate Math
console.log("\n--- TEST 3: SVG RECTANGLE COORDINATE MATH ---");
const svgData = generateBarcodeSvgData("123456", 3, 50);
assert(svgData.totalHeight === 50, "SVG barHeight matches input parameter (50)");
const encoded123456 = encodeCode128B("123456");
assert(
  svgData.totalWidth === encoded123456.pattern.length * 3,
  "Calculates total canvas width based on pattern length and barWidth"
);
assert(
  Array.isArray(svgData.rects) && svgData.rects.length > 0,
  "Generates non-empty array of barcode bar rectangles"
);
svgData.rects.forEach((rect, idx) => {
  assert(
    rect.x >= 0 && rect.width > 0 && rect.height === 50 && rect.y === 0,
    `Rectangle #${idx + 1} has valid positive bounds (x: ${rect.x}, w: ${rect.width}, h: ${rect.height})`
  );
});

// TEST 4: Re-export Compatibility
console.log("\n--- TEST 4: RE-EXPORT COMPATIBILITY ---");
assert(
  encodeCode128B === UTILS_encodeCode128B,
  "encodeCode128B re-exported from utils/barcodeGenerator references exact domain function"
);
assert(
  generateBarcodeSvgData === UTILS_generateBarcodeSvgData,
  "generateBarcodeSvgData re-exported from utils/barcodeGenerator references exact domain function"
);
assert(
  CODE128_PATTERNS === UTILS_CODE128_PATTERNS,
  "CODE128_PATTERNS table re-exported references exact array"
);

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
