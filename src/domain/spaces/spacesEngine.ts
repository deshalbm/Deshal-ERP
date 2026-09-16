/**
 * Spaces, Lease Contracts & Booking Engine — Deshal ERP
 * Pure Domain Layer: Booking pricing, time-slot conflict detection,
 * lease installment schedule generation, contract/installment status evaluations,
 * and security deposit settlement math.
 */

import {
  DepositStatus,
  InstallmentStatus,
  LeaseContractStatus,
  PaymentFrequency,
  PaymentInstallment,
  RentalType,
  SecurityDeposit,
  SpaceBooking,
} from '../../types/spaces';

export interface BookingPricingResult {
  unitPrice: number;
  duration: number;
  subtotal: number;
  discountAmount: number;
  taxableBase: number;
  taxAmount: number;
  totalAmount: number;
}

export interface ProposedBookingSlot {
  spaceId: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  excludeBookingId?: string;
}

export interface DepositSettlementResult {
  depositAmount: number;
  refundedAmount: number;
  deductedAmount: number;
  remainingHeldAmount: number;
  status: DepositStatus;
}

/**
 * Calculates space booking subtotal, tax base, 5% VAT, and total amount with OMR 3-decimal precision.
 */
export function calculateSpaceBookingTotals(
  unitPrice: number,
  duration: number,
  discountAmount: number = 0,
  taxRate: number = 5
): BookingPricingResult {
  const price = Math.max(0, Number(unitPrice) || 0);
  const dur = Math.max(0, Number(duration) || 0);
  const disc = Math.max(0, Number(discountAmount) || 0);
  const rate = Math.max(0, Number(taxRate) || 0);

  const subtotal = Math.round(price * dur * 1000) / 1000;
  const taxableBase = Math.round(Math.max(0, subtotal - disc) * 1000) / 1000;
  const taxAmount = Math.round(taxableBase * (rate / 100) * 1000) / 1000;
  const totalAmount = Math.round((taxableBase + taxAmount) * 1000) / 1000;

  return {
    unitPrice: price,
    duration: dur,
    subtotal,
    discountAmount: disc,
    taxableBase,
    taxAmount,
    totalAmount,
  };
}

/**
 * Checks whether a proposed booking slot conflicts with any existing active/confirmed space bookings.
 */
export function detectBookingConflict(
  proposed: ProposedBookingSlot,
  existingBookings: SpaceBooking[]
): boolean {
  const pStart = `${proposed.startDate}T${proposed.startTime || '00:00'}:00`;
  const pEnd = `${proposed.endDate}T${proposed.endTime || '23:59'}:00`;

  return existingBookings.some((bk) => {
    if (bk.spaceId !== proposed.spaceId) return false;
    if (proposed.excludeBookingId && bk.id === proposed.excludeBookingId) return false;
    if (bk.status === 'CANCELLED') return false;

    const bkStart = `${bk.startDate}T${bk.startTime || '00:00'}:00`;
    const bkEnd = `${bk.endDate}T${bk.endTime || '23:59'}:00`;

    // Overlap condition: proposed starts before existing ends AND proposed ends after existing starts
    return pStart < bkEnd && pEnd > bkStart;
  });
}

/**
 * Generates an installment payment schedule for a lease contract based on annual rent and payment frequency.
 */
export function generateLeaseInstallmentSchedule(
  annualRent: number,
  frequency: PaymentFrequency,
  startDate: string,
  taxRate: number = 5,
  nowMs: number = Date.now()
): PaymentInstallment[] {
  const totalRent = Math.max(0, Number(annualRent) || 0);
  const rate = Math.max(0, Number(taxRate) || 0);

  let numberOfInstallments = 12;
  let monthsInterval = 1;

  switch (frequency) {
    case 'MONTHLY':
      numberOfInstallments = 12;
      monthsInterval = 1;
      break;
    case 'QUARTERLY':
      numberOfInstallments = 4;
      monthsInterval = 3;
      break;
    case 'SEMI_ANNUAL':
      numberOfInstallments = 2;
      monthsInterval = 6;
      break;
    case 'ANNUAL':
      numberOfInstallments = 1;
      monthsInterval = 12;
      break;
    case 'LUMP_SUM':
      numberOfInstallments = 1;
      monthsInterval = 0;
      break;
  }

  const baseInstallmentAmount = Math.round((totalRent / numberOfInstallments) * 1000) / 1000;
  const taxPerInstallment = Math.round(baseInstallmentAmount * (rate / 100) * 1000) / 1000;
  const totalPerInstallment = Math.round((baseInstallmentAmount + taxPerInstallment) * 1000) / 1000;

  const installments: PaymentInstallment[] = [];
  const baseDate = new Date(startDate || new Date(nowMs).toISOString().split('T')[0]);

  for (let i = 0; i < numberOfInstallments; i++) {
    const dueDateObj = new Date(baseDate);
    dueDateObj.setMonth(dueDateObj.getMonth() + i * monthsInterval);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    installments.push({
      id: `inst-${i + 1}-${nowMs}`,
      installmentNumber: i + 1,
      titleAr: `الدفعة ${i + 1} - إيجار المستحق بتاريخ ${dueDateStr}`,
      titleEn: `Installment ${i + 1} - Due ${dueDateStr}`,
      dueDate: dueDateStr,
      amount: baseInstallmentAmount,
      taxRate: rate,
      taxAmount: taxPerInstallment,
      discountAmount: 0,
      totalAmount: totalPerInstallment,
      currency: 'OMR',
      status: 'PENDING',
    });
  }

  return installments;
}

/**
 * Evaluates the payment status of an installment based on due date, total amount, and paid amount.
 */
export function evaluateInstallmentStatus(
  installment: { dueDate: string; totalAmount: number; paidAmount?: number; status: InstallmentStatus },
  todayStr?: string,
  nowMs: number = Date.now()
): InstallmentStatus {
  const currentTodayStr = todayStr ?? new Date(nowMs).toISOString().split('T')[0];
  if (installment.status === 'CANCELLED') return 'CANCELLED';

  const total = Math.max(0, Number(installment.totalAmount) || 0);
  const paid = Math.max(0, Number(installment.paidAmount) || 0);

  if (paid >= total && total > 0) {
    return 'PAID';
  }
  if (paid > 0 && paid < total) {
    return 'PARTIAL';
  }
  if (paid === 0 && installment.dueDate < currentTodayStr) {
    return 'OVERDUE';
  }
  return 'PENDING';
}

/**
 * Evaluates lease contract status based on date ranges (DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED).
 */
export function evaluateLeaseContractStatus(
  startDate: string,
  endDate: string,
  currentStatus: LeaseContractStatus,
  todayStr?: string,
  nowMs: number = Date.now()
): LeaseContractStatus {
  const currentTodayStr = todayStr ?? new Date(nowMs).toISOString().split('T')[0];
  if (currentStatus === 'DRAFT' || currentStatus === 'TERMINATED' || currentStatus === 'RENEWED') {
    return currentStatus;
  }

  if (currentTodayStr < startDate) {
    return 'PENDING_SIGNATURE';
  }
  if (currentTodayStr > endDate) {
    return 'EXPIRED';
  }

  // Check if expiring within 30 days
  const endObj = new Date(endDate);
  const todayObj = new Date(currentTodayStr);
  const diffTime = endObj.getTime() - todayObj.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays <= 30) {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}

/**
 * Computes security deposit settlement math (refunds, deductions, remaining balance, and status).
 */
export function calculateSecurityDepositSettlement(
  depositAmount: number,
  refundedAmount: number = 0,
  deductedAmount: number = 0
): DepositSettlementResult {
  const deposit = Math.max(0, Number(depositAmount) || 0);
  const ref = Math.max(0, Number(refundedAmount) || 0);
  const ded = Math.max(0, Number(deductedAmount) || 0);

  const totalSettled = Math.round((ref + ded) * 1000) / 1000;
  const remainingHeldAmount = Math.round(Math.max(0, deposit - totalSettled) * 1000) / 1000;

  let status: DepositStatus = 'HELD_IN_CUSTODY';
  if (totalSettled >= deposit && deposit > 0) {
    if (ded >= deposit) {
      status = 'FORFEITED';
    } else if (ref >= deposit) {
      status = 'FULLY_REFUNDED';
    } else {
      status = 'PARTIALLY_REFUNDED';
    }
  } else if (totalSettled > 0) {
    status = 'PARTIALLY_REFUNDED';
  }

  return {
    depositAmount: deposit,
    refundedAmount: ref,
    deductedAmount: ded,
    remainingHeldAmount,
    status,
  };
}
