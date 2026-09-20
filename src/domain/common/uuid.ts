/**
 * Pure Domain UUID Utility — Deshal ERP
 * Ensures strict PostgreSQL UUID compliance across domain entities and use cases.
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
 * Generates a valid 36-character UUID format string.
 */
export function generateUuid(seedMs: number = 0, seq: number = 0): string {
  const timeHex = seedMs.toString(16).padStart(12, '0').slice(-12);
  const seqHex = (seq % 65536).toString(16).padStart(4, '0');
  return `00000000-0000-4000-8000-${timeHex}${seqHex}`.slice(0, 36);
}

/**
 * Guarantees a valid UUID string. If input is already a valid UUID, returns it unchanged.
 * If input is a legacy or custom prefix ID (e.g. 'cust-1788438178225'), converts it deterministically to a valid UUID format.
 */
export function ensureValidUuid(id: string | null | undefined, seedMs: number = 0): string {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return generateUuid(seedMs);
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
export function ensureNullableUuid(id: string | null | undefined, seedMs: number = 0): string | null {
  if (!id || typeof id !== 'string' || id.trim() === '' || id === 'null' || id === 'undefined') {
    return null;
  }
  return ensureValidUuid(id, seedMs);
}

/**
 * Ensures a valid PostgreSQL DATE string (YYYY-MM-DD) or null.
 * Prevents "invalid input syntax for type date: ''" error when empty strings are passed.
 */
export function ensureValidDateString(val: string | null | undefined, fallbackToToday: boolean = false): string | null {
  if (!val || typeof val !== 'string' || val.trim() === '') {
    return fallbackToToday ? new Date().toISOString().split('T')[0] : null;
  }
  const trimmed = val.trim();
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return fallbackToToday ? new Date().toISOString().split('T')[0] : null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return parsed.toISOString().split('T')[0];
}

// ──────────────────────────────────────────────
// Canonical Tenant Identity & Entity Resolvers
// Must NEVER fabricate fake UUIDs for database foreign keys.
// ──────────────────────────────────────────────

/**
 * Resolves a company ID. Returns trimmed string if valid UUID, otherwise null.
 */
export function resolveCompanyId(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string' || !isValidUuid(id)) {
    return null;
  }
  return id.trim();
}

/**
 * Resolves an employee ID. Returns trimmed string if valid UUID, otherwise null.
 */
export function resolveEmployeeId(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string' || !isValidUuid(id)) {
    return null;
  }
  return id.trim();
}

/**
 * Resolves a branch ID. Returns trimmed string if valid UUID, otherwise null.
 */
export function resolveBranchId(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string' || !isValidUuid(id)) {
    return null;
  }
  return id.trim();
}

/**
 * Resolves a user ID. Returns trimmed string if valid UUID, otherwise null.
 */
export function resolveUserId(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string' || !isValidUuid(id)) {
    return null;
  }
  return id.trim();
}

/**
 * Resolves a tenant ID. Returns trimmed string if valid UUID, otherwise null.
 */
export function resolveTenantId(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string' || !isValidUuid(id)) {
    return null;
  }
  return id.trim();
}
