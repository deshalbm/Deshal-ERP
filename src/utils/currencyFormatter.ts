/**
 * Currency Formatter Utility — Deshal ERP
 * Standard OMR (3 decimal places) and multi-currency formatting.
 */

/**
 * Formats a numeric amount to Omani Rial (OMR) standard format with 3 decimal places (e.g. "150.500 OMR").
 */
export function formatOMR(amount: number | null | undefined, includeSymbol: boolean = true): string {
  const safeAmount = Number(amount) || 0;
  const formatted = safeAmount.toFixed(3);
  return includeSymbol ? `${formatted} OMR` : formatted;
}

/**
 * Formats a numeric amount with the specified currency code.
 */
export function formatCurrency(amount: number | null | undefined, currencyCode: string = 'OMR'): string {
  const safeAmount = Number(amount) || 0;
  const decimals = currencyCode.toUpperCase() === 'OMR' ? 3 : 2;
  const formatted = safeAmount.toFixed(decimals);
  return `${formatted} ${currencyCode.toUpperCase()}`;
}
