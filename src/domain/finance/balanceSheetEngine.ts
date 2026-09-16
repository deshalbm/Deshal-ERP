/**
 * DESHAL ERP — BALANCE SHEET DOMAIN ENGINE
 * 
 * Pure domain logic for generating Balance Sheet reports (Assets, Liabilities, Equity,
 * Retained Earnings, Current Period Profit, and Accounting Identity Verification: Assets = Liabilities + Equity).
 */

import {
  Account,
  JournalEntry,
  FinancialReportPeriodFilter,
  BalanceSheetReport
} from "../../types/accounting";
import { calculateAccountLedger, generateIncomeStatement } from "./profitAndLossEngine";

export function generateBalanceSheet(
  accounts: Account[],
  entries: JournalEntry[],
  filter?: FinancialReportPeriodFilter
): BalanceSheetReport {
  const calculatedAccounts = calculateAccountLedger(accounts, entries, filter);
  const incomeStatement = generateIncomeStatement(accounts, entries, filter);

  // Current Assets
  const currentAssetAccounts = calculatedAccounts.filter(
    (a) => a.type === 'ASSET' && a.category !== 'FIXED_ASSET' && a.isPosting
  );
  const currentAssetItems = currentAssetAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalCurrentAssets = currentAssetItems.reduce((acc, curr) => acc + curr.amount, 0);

  // Non-Current Assets (Fixed Assets)
  const nonCurrentAssetAccounts = calculatedAccounts.filter(
    (a) => a.type === 'ASSET' && a.category === 'FIXED_ASSET' && a.isPosting
  );
  const nonCurrentAssetItems = nonCurrentAssetAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalNonCurrentAssets = nonCurrentAssetItems.reduce((acc, curr) => acc + curr.amount, 0);

  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  // Current Liabilities
  const currentLiabAccounts = calculatedAccounts.filter(
    (a) => a.type === 'LIABILITY' && a.category !== 'LONG_TERM_LIABILITY' && a.isPosting
  );
  const currentLiabItems = currentLiabAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalCurrentLiabilities = currentLiabItems.reduce((acc, curr) => acc + curr.amount, 0);

  // Long Term Liabilities
  const longTermLiabAccounts = calculatedAccounts.filter(
    (a) => a.type === 'LIABILITY' && a.category === 'LONG_TERM_LIABILITY' && a.isPosting
  );
  const longTermLiabItems = longTermLiabAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalLongTermLiabilities = longTermLiabItems.reduce((acc, curr) => acc + curr.amount, 0);

  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  // Equity
  const equityAccounts = calculatedAccounts.filter((a) => a.type === 'EQUITY' && a.isPosting);
  const equityItems = equityAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const baseEquity = equityItems.reduce((acc, curr) => acc + curr.amount, 0);

  const currentPeriodProfit = incomeStatement.netProfit;
  const totalEquity = baseEquity + currentPeriodProfit;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const variance = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = variance < 0.01;

  return {
    assets: {
      currentAssets: { items: currentAssetItems, total: totalCurrentAssets },
      nonCurrentAssets: { items: nonCurrentAssetItems, total: totalNonCurrentAssets },
      totalAssets
    },
    liabilities: {
      currentLiabilities: { items: currentLiabItems, total: totalCurrentLiabilities },
      longTermLiabilities: { items: longTermLiabItems, total: totalLongTermLiabilities },
      totalLiabilities
    },
    equity: {
      items: equityItems,
      retainedEarnings: 0,
      currentPeriodProfit,
      totalEquity
    },
    totalLiabilitiesAndEquity,
    isBalanced,
    variance
  };
}
