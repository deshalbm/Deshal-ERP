/**
 * Characterization Unit Test Suite — Spaces, Lease Contracts & Booking Engine
 * Verifies space booking pricing, double-booking conflict detection,
 * lease installment generation, status evaluations, and security deposit settlements.
 */

import {
  calculateSpaceBookingTotals,
  detectBookingConflict,
  generateLeaseInstallmentSchedule,
  evaluateInstallmentStatus,
  evaluateLeaseContractStatus,
  calculateSecurityDepositSettlement,
  ProposedBookingSlot,
} from '../domain/spaces/spacesEngine';
import { SpaceBooking } from '../types/spaces';

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
  console.log("  DESHAL ERP — SPACES, LEASE & BOOKING ENGINE UNIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: SPACE BOOKING TOTALS CALCULATION ---
  console.log("\n--- TEST 1: SPACE BOOKING TOTALS CALCULATION ---");
  // 4 hours @ 15 OMR/hr = subtotal 60. Discount 10. Taxable base 50. 5% VAT = 2.500. Total = 52.500 OMR.
  const totals = calculateSpaceBookingTotals(15, 4, 10, 5);
  assert(totals.subtotal === 60, "4 hours @ 15 OMR = subtotal 60.000 OMR");
  assert(totals.discountAmount === 10, "Discount amount is 10.000 OMR");
  assert(totals.taxableBase === 50, "Taxable base is 50.000 OMR");
  assert(totals.taxAmount === 2.5, "5% VAT on 50 OMR is 2.500 OMR");
  assert(totals.totalAmount === 52.5, "Grand total is 52.500 OMR");

  // --- TEST 2: BOOKING TIME CONFLICT DETECTION ---
  console.log("\n--- TEST 2: BOOKING TIME CONFLICT DETECTION ---");
  const existingBookings: SpaceBooking[] = [
    {
      id: "bk-1",
      bookingNumber: "BK-001",
      spaceId: "hall-1",
      spaceName: "Main Hall",
      spaceType: "TRAINING_HALL",
      branchId: "b-1",
      branchName: "Muscat",
      customerName: "Client A",
      customerPhone: "90000000",
      rentalType: "HOURLY",
      startDate: "2026-02-15",
      startTime: "09:00",
      endDate: "2026-02-15",
      endTime: "13:00",
      duration: 4,
      unitPrice: 15,
      subtotal: 60,
      discountAmount: 0,
      taxAmount: 3,
      totalAmount: 63,
      currency: "OMR",
      purpose: "Training",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      createdByType: "STAFF",
      createdAt: "",
      updatedAt: ""
    }
  ];

  // Overlapping proposal: 10:00 to 12:00 on same space
  const overlappingProposal: ProposedBookingSlot = {
    spaceId: "hall-1",
    startDate: "2026-02-15",
    startTime: "10:00",
    endDate: "2026-02-15",
    endTime: "12:00"
  };
  assert(detectBookingConflict(overlappingProposal, existingBookings) === true, "Detects overlapping booking conflict");

  // Non-overlapping proposal: 14:00 to 16:00 on same space
  const nonOverlappingProposal: ProposedBookingSlot = {
    spaceId: "hall-1",
    startDate: "2026-02-15",
    startTime: "14:00",
    endDate: "2026-02-15",
    endTime: "16:00"
  };
  assert(detectBookingConflict(nonOverlappingProposal, existingBookings) === false, "Passes non-overlapping booking proposal");

  // --- TEST 3: LEASE INSTALLMENT SCHEDULE GENERATION ---
  console.log("\n--- TEST 3: LEASE INSTALLMENT SCHEDULE GENERATION ---");
  // 1200 OMR annual rent, QUARTERLY frequency (4 installments of 300 OMR net + 15 OMR 5% VAT = 315 OMR total)
  const schedule = generateLeaseInstallmentSchedule(1200, 'QUARTERLY', '2026-01-01', 5);
  assert(schedule.length === 4, "Generates 4 quarterly installments for 1200 OMR annual rent");
  assert(schedule[0].amount === 300, "Net quarterly installment is 300.000 OMR");
  assert(schedule[0].taxAmount === 15, "5% VAT per installment is 15.000 OMR");
  assert(schedule[0].totalAmount === 315, "Total per installment is 315.000 OMR");

  // --- TEST 4: INSTALLMENT STATUS EVALUATION ---
  console.log("\n--- TEST 4: INSTALLMENT STATUS EVALUATION ---");
  const instPending = { dueDate: "2026-03-01", totalAmount: 315, paidAmount: 0, status: 'PENDING' as const };
  assert(evaluateInstallmentStatus(instPending, "2026-01-15") === 'PENDING', "Future due date evaluates to PENDING");

  const instOverdue = { dueDate: "2026-01-01", totalAmount: 315, paidAmount: 0, status: 'PENDING' as const };
  assert(evaluateInstallmentStatus(instOverdue, "2026-01-15") === 'OVERDUE', "Past due date with 0 paid evaluates to OVERDUE");

  const instPaid = { dueDate: "2026-01-01", totalAmount: 315, paidAmount: 315, status: 'PENDING' as const };
  assert(evaluateInstallmentStatus(instPaid, "2026-01-15") === 'PAID', "Full payment evaluates to PAID");

  // --- TEST 5: LEASE CONTRACT STATUS EVALUATION ---
  console.log("\n--- TEST 5: LEASE CONTRACT STATUS EVALUATION ---");
  assert(
    evaluateLeaseContractStatus("2026-01-01", "2026-12-31", "ACTIVE", "2026-06-15") === 'ACTIVE',
    "Contract in middle of term evaluates to ACTIVE"
  );
  assert(
    evaluateLeaseContractStatus("2026-01-01", "2026-12-31", "ACTIVE", "2026-12-10") === 'EXPIRING_SOON',
    "Contract ending within 30 days evaluates to EXPIRING_SOON"
  );
  assert(
    evaluateLeaseContractStatus("2026-01-01", "2026-12-31", "ACTIVE", "2027-01-05") === 'EXPIRED',
    "Contract past end date evaluates to EXPIRED"
  );

  // --- TEST 6: SECURITY DEPOSIT SETTLEMENT MATH ---
  console.log("\n--- TEST 6: SECURITY DEPOSIT SETTLEMENT MATH ---");
  const fullRefund = calculateSecurityDepositSettlement(100, 100, 0);
  assert(fullRefund.status === 'FULLY_REFUNDED', "Full refund evaluates to FULLY_REFUNDED");
  assert(fullRefund.remainingHeldAmount === 0, "0 remaining held balance");

  const partialSettlement = calculateSecurityDepositSettlement(100, 70, 30);
  assert(partialSettlement.status === 'PARTIALLY_REFUNDED', "70 refund + 30 deduction evaluates to PARTIALLY_REFUNDED");
  assert(partialSettlement.remainingHeldAmount === 0, "0 remaining held balance");

  const forfeiture = calculateSecurityDepositSettlement(100, 0, 100);
  assert(forfeiture.status === 'FORFEITED', "Full deduction evaluates to FORFEITED");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
