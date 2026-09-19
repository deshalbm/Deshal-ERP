/**
 * Pure Domain Models & Business Rules for WhatsApp Channel Infrastructure — Deshal ERP
 * 
 * Clean Architecture Domain Layer: Pure TypeScript logic, policies, state machines.
 * ZERO React, ZERO Supabase, ZERO LocalStorage, ZERO Browser/DOM globals.
 */

export type WhatsAppChannelState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_REQUIRED'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTING'
  | 'DISCONNECTED_BY_USER'
  | 'ERROR'
  | 'AUTH_FAILURE'
  | 'RATE_LIMITED'
  | 'PAUSED'
  | 'DISABLED';

export type WhatsAppSafetyState =
  | 'NORMAL'
  | 'CAUTION'
  | 'THROTTLED'
  | 'PAUSED'
  | 'MANUAL_REVIEW';

export type WhatsAppMessageType =
  | 'TEXT'
  | 'TEMPLATE'
  | 'INVOICE'
  | 'DOCUMENT'
  | 'NOTIFICATION'
  | 'TEST';

export type WhatsAppJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'DEAD_LETTER';

export interface WhatsAppChannelInfo {
  companyId: string;
  state: WhatsAppChannelState;
  safetyState: WhatsAppSafetyState;
  connectedPhoneNumber?: string;
  connectedJid?: string;
  connectedSince?: string;
  lastHeartbeat?: string;
  lastSuccessfulMessageAt?: string;
  lastFailedMessageAt?: string;
  queueDepth: number;
  retryCount: number;
  errorMessage?: string;
  qrCodeUrl?: string;
  qrExpiresAt?: string;
}

export interface WhatsAppOutboundPayload {
  companyId: string;
  recipientPhone: string;
  messageText: string;
  messageType?: WhatsAppMessageType;
  entityId?: string;
  templateId?: string;
  variables?: Record<string, string>;
  idempotencyKey?: string;
  correlationId?: string;
}

export type WhatsAppQueueChannel =
  | 'whatsapp.outbound'
  | 'whatsapp.inbound'
  | 'whatsapp.connection'
  | 'whatsapp.health'
  | 'whatsapp.dead_letter';

export type WhatsAppFailureClassification =
  | 'TRANSIENT'
  | 'PERMANENT'
  | 'AUTHENTICATION'
  | 'RATE_LIMIT'
  | 'POLICY'
  | 'CHANNEL_UNAVAILABLE'
  | 'SYSTEM';

export type CircuitBreakerState =
  | 'CLOSED'
  | 'OPEN'
  | 'PAUSED'
  | 'MANUAL_REVIEW';

export interface WhatsAppQueueJob {
  jobId: string;
  companyId: string;
  channelId?: string;
  queueChannel?: WhatsAppQueueChannel;
  recipientPhone: string;
  recipientJid: string;
  messageText: string;
  messageType: WhatsAppMessageType;
  entityId?: string;
  idempotencyKey: string;
  correlationId: string;
  attempts: number;
  maxAttempts: number;
  status: WhatsAppJobStatus;
  createdAt: string;
  updatedAt?: string;
  nextAttemptAt?: string;
  lastAttemptAt?: string;
  lastError?: string;
  failureClassification?: WhatsAppFailureClassification;
}

export interface WhatsAppHealthStatus {
  service: 'whatsapp_worker';
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  activeChannels: number;
  totalQueueDepth: number;
  failedJobsLastHour: number;
  redisConnected: boolean;
  workerUptimeSeconds: number;
  channels: Record<string, WhatsAppChannelInfo>;
}

/**
 * Normalizes phone number into international digit format and JID
 */
export function formatWhatsAppRecipient(rawPhone: string, defaultCountryCode = '968'): {
  cleanDigits: string;
  internationalPhone: string;
  jid: string;
  isValid: boolean;
} {
  if (!rawPhone) {
    return { cleanDigits: '', internationalPhone: '', jid: '', isValid: false };
  }

  let digits = rawPhone.replace(/[^0-9]/g, '');

  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  if (digits.length === 8 && defaultCountryCode === '968') {
    digits = '968' + digits;
  } else if (digits.length === 9 && defaultCountryCode === '966' && digits.startsWith('5')) {
    digits = '966' + digits;
  } else if (digits.length === 9 && defaultCountryCode === '971' && digits.startsWith('5')) {
    digits = '971' + digits;
  } else if (digits.length <= 10 && !digits.startsWith(defaultCountryCode) && defaultCountryCode) {
    digits = defaultCountryCode + digits;
  }

  const isValid = digits.length >= 8 && digits.length <= 15;
  const jid = `${digits}@s.whatsapp.net`;
  const internationalPhone = `+${digits}`;

  return { cleanDigits: digits, internationalPhone, jid, isValid };
}

/**
 * Validates deterministic state transition for WhatsApp channel state machine
 */
export function validateChannelStateTransition(
  currentState: WhatsAppChannelState,
  nextState: WhatsAppChannelState
): { valid: boolean; reason?: string } {
  if (currentState === nextState) {
    return { valid: true };
  }

  const validTransitions: Record<WhatsAppChannelState, WhatsAppChannelState[]> = {
    DISCONNECTED: ['CONNECTING', 'DISABLED'],
    CONNECTING: ['QR_REQUIRED', 'CONNECTED', 'AUTH_FAILURE', 'ERROR', 'DISCONNECTED'],
    QR_REQUIRED: ['CONNECTED', 'AUTH_FAILURE', 'DISCONNECTED', 'DISCONNECTED_BY_USER', 'ERROR'],
    CONNECTED: ['RECONNECTING', 'DISCONNECTING', 'DISCONNECTED_BY_USER', 'RATE_LIMITED', 'PAUSED', 'AUTH_FAILURE', 'ERROR'],
    RECONNECTING: ['CONNECTED', 'AUTH_FAILURE', 'DISCONNECTED', 'ERROR'],
    DISCONNECTING: ['DISCONNECTED', 'DISCONNECTED_BY_USER', 'ERROR'],
    DISCONNECTED_BY_USER: ['CONNECTING', 'DISABLED'],
    ERROR: ['CONNECTING', 'DISCONNECTED', 'DISABLED'],
    AUTH_FAILURE: ['CONNECTING', 'DISCONNECTED', 'DISABLED'],
    RATE_LIMITED: ['CONNECTED', 'PAUSED', 'DISCONNECTED'],
    PAUSED: ['CONNECTED', 'DISCONNECTED', 'DISABLED'],
    DISABLED: ['DISCONNECTED', 'CONNECTING']
  };

  const allowed = validTransitions[currentState] || [];
  if (allowed.includes(nextState)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Invalid state transition from ${currentState} to ${nextState}`
  };
}

/**
 * Calculates exponential backoff with jitter
 */
export function calculateExponentialBackoff(
  attempt: number,
  baseMs = 1000,
  maxMs = 60000
): number {
  const exp = Math.pow(2, Math.max(0, attempt - 1));
  const delay = Math.min(maxMs, baseMs * exp);
  const jitterFactor = (attempt % 5) * 0.04;
  const jitter = Math.floor(delay * jitterFactor);
  return delay + jitter;
}

/**
 * Evaluates anti-spam & rate limit policy for outbound messages
 */
export function evaluateAntiSpamPolicy(params: {
  companyId: string;
  recipientPhone: string;
  messagesSentLastMinute: number;
  messagesSentLastHour: number;
  failedAttemptsLastHour: number;
  isOptedOut?: boolean;
  maxPerMinute?: number;
  maxPerHour?: number;
}): { allowed: boolean; reason?: string; safetyState: WhatsAppSafetyState } {
  const {
    messagesSentLastMinute,
    messagesSentLastHour,
    failedAttemptsLastHour,
    isOptedOut = false,
    maxPerMinute = 30,
    maxPerHour = 500
  } = params;

  if (isOptedOut) {
    return { allowed: false, reason: 'Recipient has opted out of WhatsApp messages', safetyState: 'PAUSED' };
  }

  if (failedAttemptsLastHour >= 15) {
    return { allowed: false, reason: 'High error failure rate threshold breached; safety pause active', safetyState: 'PAUSED' };
  }

  if (messagesSentLastMinute >= maxPerMinute) {
    return { allowed: false, reason: 'Per-minute rate limit exceeded; throttling active', safetyState: 'THROTTLED' };
  }

  if (messagesSentLastHour >= maxPerHour) {
    return { allowed: false, reason: 'Per-hour rate limit exceeded; throttling active', safetyState: 'THROTTLED' };
  }

  if (messagesSentLastMinute >= maxPerMinute * 0.8) {
    return { allowed: true, safetyState: 'CAUTION' };
  }

  return { allowed: true, safetyState: 'NORMAL' };
}

/**
 * Interpolates template variables in string
 */
export function interpolateWhatsAppTemplate(
  templateText: string,
  variables: Record<string, string> = {}
): string {
  let result = templateText || '';
  Object.entries(variables).forEach(([key, val]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(pattern, val ?? '');
  });
  return result;
}

/**
 * Classifies WhatsApp job error into deterministic categories
 */
export function classifyWhatsAppFailure(err: string | Error): WhatsAppFailureClassification {
  const message = typeof err === 'string' ? err : err.message || '';
  const lower = message.toLowerCase();

  if (lower.includes('opt-out') || lower.includes('opted out') || lower.includes('policy') || lower.includes('blocked by policy')) {
    return 'POLICY';
  }
  if (lower.includes('auth') || lower.includes('unauthorized') || lower.includes('session expired') || lower.includes('login required')) {
    return 'AUTHENTICATION';
  }
  if (lower.includes('rate limit') || lower.includes('throttled') || lower.includes('too many requests')) {
    return 'RATE_LIMIT';
  }
  if (lower.includes('not connected') || lower.includes('disconnected') || lower.includes('socket closed') || lower.includes('channel unavailable')) {
    return 'CHANNEL_UNAVAILABLE';
  }
  if (lower.includes('invalid recipient') || lower.includes('number not registered') || lower.includes('format invalid')) {
    return 'PERMANENT';
  }
  if (lower.includes('timeout') || lower.includes('econnreset') || lower.includes('etimedout') || lower.includes('temporary network')) {
    return 'TRANSIENT';
  }
  return 'SYSTEM';
}
