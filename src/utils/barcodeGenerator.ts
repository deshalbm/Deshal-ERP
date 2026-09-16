/**
 * Pure TypeScript Code-128 Barcode Generator (Subset B)
 * Generates valid SVG bar sequences and vector markup without external dependencies.
 * Re-exports domain barcode generator logic for 100% backward compatibility.
 */

export {
  CODE128_PATTERNS,
  START_CODE_B,
  STOP_CODE,
  encodeCode128B,
  generateBarcodeSvgData
} from "../domain/inventory/barcodeGenerator";
