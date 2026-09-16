/**
 * Characterization Unit Test Suite — Consulting Services & Tenant Subscription Quota Engine
 * Verifies service pricing math, tenant membership discount calculations,
 * free quota eligibility validations, and quota consumption deltas.
 */

import {
  calculateServiceBookingPricing,
  evaluateTenantQuotaBalance,
  validateQuotaEligibility,
  calculateQuotaConsumptionDelta,
} from '../domain/services/servicesEngine';
import { TenantSubscription } from '../types/spaces';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log("\n================================================================");
  console.log("  DESHAL ERP — SERVICES & SUBSCRIPTION QUOTA ENGINE TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: SERVICE BOOKING PRICING CALCULATION ---
  console.log("\n--- TEST 1: SERVICE BOOKING PRICING CALCULATION ---");
  // 100 OMR base price, 15% tenant discount = 15 OMR discount, final 85 OMR.
  const pricingWithDiscount = calculateServiceBookingPricing(100, 1, 15, false);
  assert(pricingWithDiscount.subtotal === 100, "Subtotal is 100.000 OMR");
  assert(pricingWithDiscount.discountAmount === 15, "15% discount is 15.000 OMR");
  assert(pricingWithDiscount.finalAmount === 85, "Final amount is 85.000 OMR");
  assert(pricingWithDiscount.paymentStatus === 'UNPAID', "Payment status is UNPAID for positive final amount");

  // Free membership quota coverage
  const quotaPricing = calculateServiceBookingPricing(100, 1, 15, true);
  assert(quotaPricing.finalAmount === 0, "Free quota final amount is 0 OMR");
  assert(quotaPricing.paymentStatus === 'FREE_QUOTA', "Payment status is FREE_QUOTA");
  assert(quotaPricing.isCoveredByMembership === true, "Covered by membership flag is true");

  // --- TEST 2: TENANT QUOTA BALANCE EVALUATION ---
  console.log("\n--- TEST 2: TENANT QUOTA BALANCE EVALUATION ---");
  const mockSub: TenantSubscription = {
    id: "sub-101",
    subscriptionNumber: "SUB-2026-001",
    customerId: "c-1",
    customerName: "Oman Startup LLC",
    customerPhone: "91111111",
    packageId: "pkg-pro",
    packageName: "PRO Tenant Package",
    billingCycle: "MONTHLY",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "ACTIVE",
    meetingRoomHoursQuota: 20,
    meetingRoomHoursUsed: 5,
    mediaStudioHoursQuota: 4,
    mediaStudioHoursUsed: 1,
    consultationSessionsQuota: 3,
    consultationSessionsUsed: 3,
    monthlyFee: 150,
    currency: "OMR",
    discountOnExtraServicesPercent: 15,
    autoRenew: true,
    createdAt: "",
    updatedAt: ""
  };

  const balances = evaluateTenantQuotaBalance(mockSub);
  assert(balances.meetingRoomHoursRemaining === 15, "20 quota - 5 used = 15 meeting room hours remaining");
  assert(balances.mediaStudioHoursRemaining === 3, "4 quota - 1 used = 3 media studio hours remaining");
  assert(balances.consultationSessionsRemaining === 0, "3 quota - 3 used = 0 consultation sessions remaining");

  // --- TEST 3: QUOTA ELIGIBILITY VALIDATION ---
  console.log("\n--- TEST 3: QUOTA ELIGIBILITY VALIDATION ---");
  const eligibleMeeting = validateQuotaEligibility(mockSub, 'MEETING_ROOM', 2);
  assert(eligibleMeeting.isEligible === true, "2 meeting room hours is eligible (15 available)");

  const ineligibleConsultation = validateQuotaEligibility(mockSub, 'CONSULTATION', 1);
  assert(ineligibleConsultation.isEligible === false, "Fails eligibility for consultation (0 remaining)");

  // --- TEST 4: QUOTA CONSUMPTION DELTA CALCULATION ---
  console.log("\n--- TEST 4: QUOTA CONSUMPTION DELTA CALCULATION ---");
  const updatedSub = calculateQuotaConsumptionDelta(mockSub, 'MEETING_ROOM', 2);
  assert(updatedSub.meetingRoomHoursUsed === 7, "5 used + 2 consumed = 7 meeting room hours used");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
