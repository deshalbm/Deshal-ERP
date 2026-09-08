/**
 * Phone Utility — Deshal ERP
 * Canonical Omani (+968) phone number normalization and display formatting.
 */

/**
 * Normalizes an Omani or international phone number to clean E.164 format (e.g. "+96891234567").
 * - Strips non-digit characters.
 * - Handles 8-digit local Omani numbers starting with 7, 9, or 2, prepending '+968'.
 * - Trims leading '00' international prefixes.
 */
export function normalizeOmaniPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone || typeof rawPhone !== 'string' || rawPhone.trim() === '') {
    return '';
  }

  let digits = rawPhone.replace(/[^0-9]/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Local Omani 8-digit phone numbers
  if (digits.length === 8 && /^[792]/.test(digits)) {
    return `+968${digits}`;
  }

  // 11-digit numbers starting with 968
  if (digits.length === 11 && digits.startsWith('968')) {
    return `+${digits}`;
  }

  // If input already started with '+' or international code
  if (rawPhone.trim().startsWith('+')) {
    return `+${digits}`;
  }

  return digits ? `+${digits}` : '';
}

/**
 * Formats a clean phone number for human-readable UI display (e.g. "+968 9123 4567").
 */
export function formatDisplayPhone(rawPhone: string | null | undefined): string {
  const normalized = normalizeOmaniPhone(rawPhone);
  if (!normalized) return '';

  const digits = normalized.replace(/[^0-9]/g, '');
  if (digits.startsWith('968') && digits.length === 11) {
    return `+968 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }

  return normalized;
}
