/**
 * DESHAL ERP — PROFIT & LOSS (INCOME STATEMENT) DOMAIN ENGINE
 * 
 * Pure domain logic for generating P&L financial reports (Revenues, COGS, Gross Profit,
 * Operating Expenses, Operating Income, Net Income Before Tax, Tax, and Net Profit).
 */

import {
  Account,
  JournalEntry,
  FinancialReportPeriodFilter,
  IncomeStatementReport
} from "../../types/accounting";

export function calculateAccountLedger(
  accounts: Account[],
  entries: JournalEntry[],
  filter?: FinancialReportPeriodFilter
): Account[] {
  const safeAccounts = [...accounts];
  const postedEntries = entries.filter((e) => {
    const isStatusOk = filter?.includeDrafts ? e.status !== 'CANCELLED' : (e.status === 'POSTED' || e.status === 'LOCKED');
    if (!isStatusOk) return false;
    if (filter?.startDate && e.date < filter.startDate) return false;
    if (filter?.endDate && e.date > filter.endDate) return false;
    if (filter?.branchId && filter.branchId !== 'all' && e.branchId && e.branchId !== filter.branchId) return false;
    return true;
  });

  const accountMovements: Record<string, { totalDebit: number; totalCredit: number }> = {};
  safeAccounts.forEach((acc) => {
    accountMovements[acc.id] = { totalDebit: 0, totalCredit: 0 };
    accountMovements[acc.code] = { totalDebit: 0, totalCredit: 0 };
  });

  postedEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const targetId = line.accountId;
      if (!accountMovements[targetId]) {
        accountMovements[targetId] = { totalDebit: 0, totalCredit: 0 };
      }
      accountMovements[targetId].totalDebit += Number(line.debit || 0);
      accountMovements[targetId].totalCredit += Number(line.credit || 0);

      if (line.accountCode && !accountMovements[line.accountCode]) {
        accountMovements[line.accountCode] = { totalDebit: 0, totalCredit: 0 };
      }
      if (line.accountCode) {
        accountMovements[line.accountCode].totalDebit += Number(line.debit || 0);
        accountMovements[line.accountCode].totalCredit += Number(line.credit || 0);
      }
    });
  });

  return safeAccounts.map((acc) => {
    const mov = accountMovements[acc.id] || accountMovements[acc.code] || { totalDebit: 0, totalCredit: 0 };
    const opening = Number(acc.openingBalance || 0);
    
    let current = opening;
    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      current = opening + mov.totalDebit - mov.totalCredit;
    } else {
      current = opening + mov.totalCredit - mov.totalDebit;
    }

    return {
      ...acc,
      totalDebit: Number(mov.totalDebit.toFixed(3)),
      totalCredit: Number(mov.totalCredit.toFixed(3)),
      currentBalance: Number(current.toFixed(3))
    };
  });
}

export function generateIncomeStatement(
  accounts: Account[],
  entries: JournalEntry[],
  filter?: FinancialReportPeriodFilter
): IncomeStatementReport {
  const calculatedAccounts = calculateAccountLedger(accounts, entries, filter);

  // Revenues (Type = REVENUE)
  const revenueAccounts = calculatedAccounts.filter((a) => a.type === 'REVENUE' && a.isPosting);
  const operatingRevItems = revenueAccounts
    .filter((a) => a.category !== 'OTHER_REVENUE')
    .map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const otherRevItems = revenueAccounts
    .filter((a) => a.category === 'OTHER_REVENUE')
    .map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));

  const totalOperatingRevenue = operatingRevItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOtherRevenue = otherRevItems.reduce((acc, curr) => acc + curr.amount, 0);

  // COGS
  const cogsAccounts = calculatedAccounts.filter((a) => a.category === 'COST_OF_GOODS_SOLD' && a.isPosting);
  const cogsItems = cogsAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalCogs = cogsItems.reduce((acc, curr) => acc + curr.amount, 0);

  const grossProfit = totalOperatingRevenue - totalCogs;

  // Operating Expenses (EXPENSE excluding COGS, OTHER_EXPENSE, TAX_EXPENSE)
  const opexAccounts = calculatedAccounts.filter(
    (a) => a.type === 'EXPENSE' && a.category !== 'COST_OF_GOODS_SOLD' && a.category !== 'OTHER_EXPENSE' && a.category !== 'TAX_EXPENSE' && a.isPosting
  );
  const opexItems = opexAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalOpex = opexItems.reduce((acc, curr) => acc + curr.amount, 0);

  const operatingIncome = grossProfit - totalOpex;

  // Other Expenses & Taxes
  const otherExpenseAccounts = calculatedAccounts.filter(
    (a) => a.type === 'EXPENSE' && (a.category === 'OTHER_EXPENSE' || a.category === 'TAX_EXPENSE') && a.isPosting
  );
  const totalOtherExpenses = otherExpenseAccounts.reduce((acc, curr) => acc + curr.currentBalance, 0);

  const netIncomeBeforeTax = operatingIncome + (totalOtherRevenue - totalOtherExpenses);
  const taxExpense = 0;
  const netProfit = netIncomeBeforeTax - taxExpense;

  return {
    operatingRevenue: {
      items: operatingRevItems,
      total: totalOperatingRevenue
    },
    cogs: {
      items: cogsItems,
      total: totalCogs
    },
    grossProfit,
    operatingExpenses: {
      items: opexItems,
      total: totalOpex
    },
    operatingIncome,
    otherIncomeAndExpenses: {
      items: [
        ...otherRevItems,
        ...otherExpenseAccounts.map((a) => ({ code: a.code, nameAr: `(مصروف) ${a.nameAr}`, amount: -a.currentBalance }))
      ],
      total: totalOtherRevenue - totalOtherExpenses
    },
    netIncomeBeforeTax,
    taxExpense,
    netProfit
  };
}
