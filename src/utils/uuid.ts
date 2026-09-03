/**
 * UUID Utility — Deshal ERP
 * Ensures strict PostgreSQL UUID compliance across all Supabase service mappers.
 * Automatically converts legacy prefix IDs (e.g. 'cust-123', 'emp-001') to deterministic valid UUID v4 format.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a string is a standard 36-character UUID.
 */
export function isValidUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Guarantees a valid UUID string. If input is already a valid UUID, returns it unchanged.
 * If input is a legacy or custom prefix ID (e.g. 'cust-1788438178225'), converts it deterministically to a valid UUID format.
 * If input is empty, generates a random UUID v4.
 */
export function ensureValidUuid(id: string | null | undefined): string {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return generateUuid();
  }

  const trimmed = id.trim();
  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Deterministically hash string ID to a 12-character hex suffix
  let hash1 = 5381;
  let hash2 = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 31) + char;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(6, '0').slice(-6);
  const hex2 = Math.abs(hash2).toString(16).padStart(6, '0').slice(-6);
  const suffix = (hex1 + hex2).padStart(12, '0');

  return `00000000-0000-4000-8000-${suffix}`;
}

/**
 * Returns a valid UUID string if present, or null if input is empty or null.
 */
export function ensureNullableUuid(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string' || id.trim() === '' || id === 'null' || id === 'undefined') {
    return null;
  }
  return ensureValidUuid(id);
}

/**
 * Generates a standard UUID v4 string.
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
