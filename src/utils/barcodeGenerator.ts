/**
 * Pure TypeScript Code-128 Barcode Generator (Subset B)
 * Generates valid SVG bar sequences and vector markup without external dependencies.
 */

// Code 128 Pattern Table (Patterns of bars/spaces where '1' = bar, '0' = space)
// Each symbol has length 11, Stop pattern has length 13.
const CODE128_PATTERNS: string[] = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100", // 0-4
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000", // 5-9
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110", // 10-14
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100", // 15-19
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100", // 20-24
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010", // 25-29
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000", // 30-34
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000", // 35-39
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110", // 40-44
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110", // 45-49
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000", // 50-54
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010", // 55-59
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100", // 60-64
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000", // 65-69
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010", // 70-74
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010", // 75-79
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100", // 80-84
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110", // 85-89
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110", // 90-94
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110", // 95-99
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000", // 100-104 (Start A, B, C)
  "11010011100", "1100011101011" // 105 (Start B), 106 (Stop)
];

const START_CODE_B = 104; // Index 104 in standard table for START B (or 104 = ASCII offset)
const STOP_CODE = 106;

/**
 * Encodes an ASCII string into Code 128B binary pattern string (1s and 0s)
 */
export function encodeCode128B(text: string): { pattern: string; checksum: number; valid: boolean } {
  // Sanitize text to ASCII range 32 - 126
  const clean = text.replace(/[^\x20-\x7E]/g, "-");
  if (!clean) {
    return { pattern: "", checksum: 0, valid: false };
  }

  const values: number[] = [];
  // Start with Start Code B
  values.push(START_CODE_B);

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    values.push(charCode - 32);
  }

  // Calculate Checksum: (Start + sum(val[i] * i)) % 103
  let sum = values[0];
  for (let i = 1; i < values.length; i++) {
    sum += values[i] * i;
  }
  const checksum = sum % 103;
  values.push(checksum);
  values.push(STOP_CODE);

  // Build binary pattern
  let pattern = "0000000000"; // Quiet zone (10 modules)
  for (const v of values) {
    if (v >= 0 && v < CODE128_PATTERNS.length) {
      pattern += CODE128_PATTERNS[v];
    }
  }
  pattern += "0000000000"; // Quiet zone (10 modules)

  return { pattern, checksum, valid: true };
}

/**
 * Generates an SVG path or rect data for barcode
 */
export function generateBarcodeSvgData(text: string, barWidth = 2, barHeight = 40): {
  rects: { x: number; y: number; width: number; height: number }[];
  totalWidth: number;
  totalHeight: number;
  text: string;
} {
  const { pattern, valid } = encodeCode128B(text);
  if (!valid || !pattern) {
    return { rects: [], totalWidth: 100, totalHeight: barHeight, text };
  }

  const rects: { x: number; y: number; width: number; height: number }[] = [];
  let currentRun = 0;
  let runStart = 0;

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "1") {
      if (currentRun === 0) {
        runStart = i;
      }
      currentRun++;
    } else {
      if (currentRun > 0) {
        rects.push({
          x: runStart * barWidth,
          y: 0,
          width: currentRun * barWidth,
          height: barHeight
        });
        currentRun = 0;
      }
    }
  }

  if (currentRun > 0) {
    rects.push({
      x: runStart * barWidth,
      y: 0,
      width: currentRun * barWidth,
      height: barHeight
    });
  }

  const totalWidth = pattern.length * barWidth;
  return { rects, totalWidth, totalHeight: barHeight, text };
}
