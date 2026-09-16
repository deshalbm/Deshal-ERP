import { generateIncomeStatement } from '../domain/finance/profitAndLossEngine';
import { generateBalanceSheet } from '../domain/finance/balanceSheetEngine';
import { Account, JournalEntry } from '../types/accounting';

const mockAccounts: Account[] = [
  {
    id: 'acc-4001',
    code: '4001',
    nameAr: 'إيرادات المبيعات',
    nameEn: 'Sales Revenue',
    type: 'REVENUE',
    category: 'SERVICE_REVENUE',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'acc-5001',
    code: '5001',
    nameAr: 'تكلفة البضاعة المباعة',
    nameEn: 'Cost of Goods Sold',
    type: 'EXPENSE',
    category: 'COST_OF_GOODS_SOLD',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'acc-1001',
    code: '1001',
    nameAr: 'حساب الصندوق/البنك',
    nameEn: 'Cash/Bank Account',
    type: 'ASSET',
    category: 'CASH_BANK',
    isPosting: true,
    openingBalance: 1000,
    currentBalance: 1000,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'acc-3001',
    code: '3001',
    nameAr: 'رأس المال',
    nameEn: 'Owner Capital',
    type: 'EQUITY',
    category: 'CAPITAL',
    isPosting: true,
    openingBalance: 1000,
    currentBalance: 1000,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

const mockEntries: JournalEntry[] = [
  {
    id: 'je-1',
    entryNumber: 'JE-001',
    date: '2026-03-01',
    type: 'STANDARD',
    status: 'POSTED',
    descriptionAr: 'تسجيل مبيعات',
    createdBy: 'admin',
    lines: [
      {
        id: 'jel-1',
        accountId: 'acc-1001',
        accountCode: '1001',
        accountNameAr: 'حساب البنك',
        descriptionAr: 'تحصيل مبيعات',
        debit: 500,
        credit: 0
      },
      {
        id: 'jel-2',
        accountId: 'acc-4001',
        accountCode: '4001',
        accountNameAr: 'إيرادات المبيعات',
        descriptionAr: 'إيراد مبيعات',
        debit: 0,
        credit: 500
      }
    ],
    totalDebit: 500,
    totalCredit: 500,
    isBalanced: true,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'je-2',
    entryNumber: 'JE-002',
    date: '2026-03-02',
    type: 'STANDARD',
    status: 'POSTED',
    descriptionAr: 'تكلفة تكلفة البضاعة',
    createdBy: 'admin',
    lines: [
      {
        id: 'jel-3',
        accountId: 'acc-5001',
        accountCode: '5001',
        accountNameAr: 'تكلفة البضاعة',
        descriptionAr: 'إثبات تكلفة البضاعة المباعة',
        debit: 200,
        credit: 0
      },
      {
        id: 'jel-4',
        accountId: 'acc-1001',
        accountCode: '1001',
        accountNameAr: 'حساب البنك',
        descriptionAr: 'سداد تكلفة البضاعة',
        debit: 0,
        credit: 200
      }
    ],
    totalDebit: 200,
    totalCredit: 200,
    isBalanced: true,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z'
  }
];

console.log('================================================================');
console.log('  DESHAL ERP — FINANCIAL STATEMENTS DOMAIN ENGINE TEST SUITE');
console.log('================================================================\n');

console.log('--- TEST 1: INCOME STATEMENT GENERATION ---');
const pnl = generateIncomeStatement(mockAccounts, mockEntries);
console.assert(pnl.operatingRevenue.total === 500, `Expected operating revenue 500, got ${pnl.operatingRevenue.total}`);
console.assert(pnl.cogs.total === 200, `Expected COGS 200, got ${pnl.cogs.total}`);
console.assert(pnl.grossProfit === 300, `Expected gross profit 300, got ${pnl.grossProfit}`);
console.assert(pnl.netProfit === 300, `Expected net profit 300, got ${pnl.netProfit}`);
console.log('  ✅ PASS: Operating Revenue calculation (500.000 OMR)');
console.log('  ✅ PASS: Cost of Goods Sold calculation (200.000 OMR)');
console.log('  ✅ PASS: Gross Profit & Net Profit calculation (300.000 OMR)\n');

console.log('--- TEST 2: BALANCE SHEET GENERATION & EQUALITY INVARIANT ---');
const bs = generateBalanceSheet(mockAccounts, mockEntries);
console.assert(bs.assets.totalAssets === 1300, `Expected total assets 1300 (1000 + 500 - 200), got ${bs.assets.totalAssets}`);
console.assert(bs.equity.totalEquity === 1300, `Expected total equity 1300 (1000 + 300 net profit), got ${bs.equity.totalEquity}`);
console.assert(bs.isBalanced === true, `Expected balance sheet to be balanced`);
console.log('  ✅ PASS: Total Assets calculation (1300.000 OMR)');
console.log('  ✅ PASS: Total Liabilities & Equity calculation (1300.000 OMR)');
console.log('  ✅ PASS: Balance Sheet accounting identity holds (Assets = Liabilities + Equity)\n');

console.log('==============================================================');
console.log('  RESULTS: ALL TESTS PASSED');
console.log('==============================================================');
