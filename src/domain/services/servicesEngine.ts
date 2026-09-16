/**
 * Consulting Services & Tenant Subscription Quota Engine — Deshal ERP
 * Pure Domain Layer: Service pricing, tenant discount percentage math,
 * membership free quota eligibility checks, and quota consumption deltas.
 */

import {
  ConsultingService,
  ServiceBooking,
  ServicePaymentStatus,
  TenantSubscription,
} from '../../types/spaces';

export type QuotaType = 'MEETING_ROOM' | 'MEDIA_STUDIO' | 'CONSULTATION';

export interface ServicePricingResult {
  basePrice: number;
  multiplier: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  isCoveredByMembership: boolean;
  paymentStatus: ServicePaymentStatus;
}

export interface TenantQuotaBalanceResult {
  subscriptionId: string;
  isSubscriptionActive: boolean;
  meetingRoomHoursRemaining: number;
  mediaStudioHoursRemaining: number;
  consultationSessionsRemaining: number;
}

export interface QuotaEligibilityResult {
  isEligible: boolean;
  requestedUnits: number;
  availableUnits: number;
  reason?: string;
}

/**
 * Calculates service booking subtotal, tenant package discount, and final amount with OMR 3-decimal precision.
 */
export function calculateServiceBookingPricing(
  basePrice: number,
  multiplier: number = 1,
  discountPercent: number = 0,
  isCoveredByQuota: boolean = false
): ServicePricingResult {
  const price = Math.max(0, Number(basePrice) || 0);
  const mult = Math.max(1, Number(multiplier) || 1);
  const discPct = Math.max(0, Number(discountPercent) || 0);

  if (isCoveredByQuota) {
    return {
      basePrice: price,
      multiplier: mult,
      subtotal: Math.round(price * mult * 1000) / 1000,
      discountPercent: 100,
      discountAmount: Math.round(price * mult * 1000) / 1000,
      finalAmount: 0,
      isCoveredByMembership: true,
      paymentStatus: 'FREE_QUOTA',
    };
  }

  const subtotal = Math.round(price * mult * 1000) / 1000;
  const discountAmount = Math.round(subtotal * (discPct / 100) * 1000) / 1000;
  const finalAmount = Math.round(Math.max(0, subtotal - discountAmount) * 1000) / 1000;

  return {
    basePrice: price,
    multiplier: mult,
    subtotal,
    discountPercent: discPct,
    discountAmount,
    finalAmount,
    isCoveredByMembership: false,
    paymentStatus: finalAmount === 0 ? 'PAID' : 'UNPAID',
  };
}

/**
 * Computes remaining tenant quota balances for meeting rooms, media studio, and consultation sessions.
 */
export function evaluateTenantQuotaBalance(
  subscription: TenantSubscription
): TenantQuotaBalanceResult {
  const isActive = subscription.status === 'ACTIVE';

  const meetingRoomHoursRemaining = Math.max(
    0,
    (Number(subscription.meetingRoomHoursQuota) || 0) - (Number(subscription.meetingRoomHoursUsed) || 0)
  );

  const mediaStudioHoursRemaining = Math.max(
    0,
    (Number(subscription.mediaStudioHoursQuota) || 0) - (Number(subscription.mediaStudioHoursUsed) || 0)
  );

  const consultationSessionsRemaining = Math.max(
    0,
    (Number(subscription.consultationSessionsQuota) || 0) - (Number(subscription.consultationSessionsUsed) || 0)
  );

  return {
    subscriptionId: subscription.id,
    isSubscriptionActive: isActive,
    meetingRoomHoursRemaining,
    mediaStudioHoursRemaining,
    consultationSessionsRemaining,
  };
}

/**
 * Checks whether a requested quota consumption (e.g. 2 meeting room hours) can be covered for free by tenant membership.
 */
export function validateQuotaEligibility(
  subscription: TenantSubscription,
  quotaType: QuotaType,
  requestedUnits: number = 1
): QuotaEligibilityResult {
  if (subscription.status !== 'ACTIVE') {
    return {
      isEligible: false,
      requestedUnits,
      availableUnits: 0,
      reason: 'Tenant subscription is not active',
    };
  }

  const balance = evaluateTenantQuotaBalance(subscription);
  let availableUnits = 0;

  switch (quotaType) {
    case 'MEETING_ROOM':
      availableUnits = balance.meetingRoomHoursRemaining;
      break;
    case 'MEDIA_STUDIO':
      availableUnits = balance.mediaStudioHoursRemaining;
      break;
    case 'CONSULTATION':
      availableUnits = balance.consultationSessionsRemaining;
      break;
  }

  if (requestedUnits <= availableUnits) {
    return {
      isEligible: true,
      requestedUnits,
      availableUnits,
    };
  }

  return {
    isEligible: false,
    requestedUnits,
    availableUnits,
    reason: `Insufficient ${quotaType} quota balance (${availableUnits} available, ${requestedUnits} requested)`,
  };
}

/**
 * Calculates updated tenant quota usage counters after consuming free quota units.
 */
export function calculateQuotaConsumptionDelta(
  subscription: TenantSubscription,
  quotaType: QuotaType,
  unitsToConsume: number = 1,
  nowMs: number = Date.now()
): TenantSubscription {
  const units = Math.max(0, Number(unitsToConsume) || 0);
  const updated = { ...subscription };

  switch (quotaType) {
    case 'MEETING_ROOM':
      updated.meetingRoomHoursUsed = Math.min(
        subscription.meetingRoomHoursQuota,
        (subscription.meetingRoomHoursUsed || 0) + units
      );
      break;
    case 'MEDIA_STUDIO':
      updated.mediaStudioHoursUsed = Math.min(
        subscription.mediaStudioHoursQuota,
        (subscription.mediaStudioHoursUsed || 0) + units
      );
      break;
    case 'CONSULTATION':
      updated.consultationSessionsUsed = Math.min(
        subscription.consultationSessionsQuota,
        (subscription.consultationSessionsUsed || 0) + units
      );
      break;
  }

  updated.updatedAt = new Date(nowMs).toISOString();
  return updated;
}
