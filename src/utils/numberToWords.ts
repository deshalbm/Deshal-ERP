/**
 * DESHAL ERP - FINANCIAL NUMBER TO WORDS ENGINE (RE-EXPORTS)
 *
 * Re-exports domain financial written text translation functions (Tafqeet)
 * from src/domain/finance/numberToWords.ts for 100% backward compatibility.
 */

export type { SupportedCurrency } from "../domain/finance/numberToWords";
export {
  numberToEnglishWords,
  numberToArabicWords,
  numberToWords
} from "../domain/finance/numberToWords";
