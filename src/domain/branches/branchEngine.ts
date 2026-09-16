/**
 * Multi-Branch Locations & Hierarchy Engine — Deshal ERP
 * Pure Domain Layer: Branch operational status rules, main headquarters protection,
 * default warehouse resolution, inter-branch transfer validation, and performance aggregation.
 */

import { Branch } from '../../types/common';

export interface BranchStatusValidationResult {
  isValid: boolean;
  messageAr?: string;
  messageEn?: string;
}

export interface InterBranchTransferValidationResult {
  isValid: boolean;
  reasonAr?: string;
  reasonEn?: string;
}

export interface BranchPerformanceMetric {
  branchId: string;
  branchName: string;
  totalSales: number;
  transactionsCount: number;
  averageTransactionValue: number;
  isActive: boolean;
  isMain: boolean;
}

/**
 * Validates branch operational status changes, enforcing main headquarters deactivation protection.
 */
export function validateBranchStatusChange(
  branch: Branch,
  newStatus: 'ACTIVE' | 'INACTIVE'
): BranchStatusValidationResult {
  if (branch.isMain && newStatus === 'INACTIVE') {
    return {
      isValid: false,
      messageAr: 'لا يمكن إيقاف الفرع الرئيسي للشركة (المركز الرئيسي)',
      messageEn: 'Main headquarters branch cannot be set to INACTIVE',
    };
  }

  return { isValid: true };
}

/**
 * Resolves default receiving/dispatching warehouse for a branch.
 */
export function resolveBranchWarehouse(branch: Branch): string {
  if (branch.defaultWarehouse && branch.defaultWarehouse.trim().length > 0) {
    return branch.defaultWarehouse.trim();
  }

  if (branch.code) {
    return `WH-${branch.code.toUpperCase()}`;
  }

  return 'Main Warehouse';
}

/**
 * Validates inter-branch inventory or asset transfer rules.
 */
export function validateInterBranchTransfer(
  fromBranch: Branch,
  toBranch: Branch
): InterBranchTransferValidationResult {
  if (fromBranch.id === toBranch.id) {
    return {
      isValid: false,
      reasonAr: 'لا يمكن إجراء تحويل بين نفس الفرع',
      reasonEn: 'Source and destination branches cannot be the same',
    };
  }

  if (fromBranch.status !== 'ACTIVE') {
    return {
      isValid: false,
      reasonAr: `الفرع المصدر (${fromBranch.name}) غير نشط حالياً`,
      reasonEn: `Source branch (${fromBranch.name}) is currently INACTIVE`,
    };
  }

  if (toBranch.status !== 'ACTIVE') {
    return {
      isValid: false,
      reasonAr: `الفرع الوجهة (${toBranch.name}) غير نشط حالياً`,
      reasonEn: `Destination branch (${toBranch.name}) is currently INACTIVE`,
    };
  }

  return { isValid: true };
}

/**
 * Aggregates branch performance sales metrics across multi-branch transactions.
 */
export function calculateBranchPerformanceSummary(
  branches: Branch[],
  transactions: Array<{ branchId: string; totalAmount: number }>
): BranchPerformanceMetric[] {
  const map: Record<string, { totalSales: number; count: number }> = {};

  transactions.forEach((tx) => {
    if (!map[tx.branchId]) {
      map[tx.branchId] = { totalSales: 0, count: 0 };
    }
    const amt = Math.max(0, Number(tx.totalAmount) || 0);
    map[tx.branchId].totalSales += amt;
    map[tx.branchId].count += 1;
  });

  return branches.map((b) => {
    const data = map[b.id] || { totalSales: 0, count: 0 };
    const totalSales = Math.round(data.totalSales * 1000) / 1000;
    const count = data.count;
    const avgVal = count > 0 ? Math.round((totalSales / count) * 1000) / 1000 : 0;

    return {
      branchId: b.id,
      branchName: b.name,
      totalSales,
      transactionsCount: count,
      averageTransactionValue: avgVal,
      isActive: b.status === 'ACTIVE',
      isMain: b.isMain,
    };
  });
}
