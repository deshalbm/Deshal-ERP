export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'COGS'
  | 'EXPENSE'
  | 'OTHER_INCOME'
  | 'OTHER_EXPENSE';

export type AccountNature = 'DEBIT' | 'CREDIT';

export type AccountCategory =
  | 'CURRENT_ASSET'
  | 'FIXED_ASSET'
  | 'CASH_BANK'
  | 'ACCOUNTS_RECEIVABLE'
  | 'INVENTORY'
  | 'CURRENT_LIABILITY'
  | 'LONG_TERM_LIABILITY'
  | 'ACCOUNTS_PAYABLE'
  | 'TAX_PAYABLE'
  | 'ACCRUED_PAYROLL'
  | 'CAPITAL'
  | 'RETAINED_EARNINGS'
  | 'DRAWINGS'
  | 'SALES_REVENUE'
  | 'SERVICE_REVENUE'
  | 'RENTAL_REVENUE'
  | 'OTHER_REVENUE'
  | 'COST_OF_GOODS_SOLD'
  | 'OPERATING_EXPENSE'
  | 'SALARIES_EXPENSE'
  | 'DEPRECIATION_EXPENSE'
  | 'RENT_EXPENSE'
  | 'UTILITIES_EXPENSE'
  | 'MARKETING_EXPENSE'
  | 'TAX_EXPENSE'
  | 'OTHER_EXPENSE';

export interface Account {
  id: string;
  code: string; // e.g. "1010", "1100", "2010", "3010", "4010", "5010"
  nameAr: string;
  nameEn: string;
  type: AccountType;
  category: AccountCategory;
  parentId?: string;
  isPosting: boolean; // True if account accepts journal entry lines (leaf node)
  normalBalance?: AccountNature; // DEBIT for Assets/Expenses/COGS, CREDIT for Liab/Equity/Revenue
  allowManualPosting?: boolean;
  reconciliationEnabled?: boolean;
  costCenterRequired?: boolean;
  openingBalance: number; // Positive = normal balance
  currentBalance: number;
  totalDebit?: number;
  totalCredit?: number;
  currency: string;
  description?: string;
  isSystem?: boolean;
  isActive: boolean;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DefaultAccountsConfig {
  cashAccountId: string;
  bankAccountId: string;
  arAccountId: string;              // Accounts Receivable (العملاء)
  apAccountId: string;              // Accounts Payable (الموردين)
  salesAccountId: string;           // Sales Revenue (إيراد المبيعات)
  salesReturnAccountId: string;     // Sales Returns (مردودات المبيعات)
  purchasesAccountId: string;       // Purchases (المشتريات)
  purchaseReturnAccountId: string;  // Purchase Returns (مردودات المشتريات)
  inventoryAccountId: string;       // Inventory (المخزون السلعي)
  cogsAccountId: string;            // Cost of Goods Sold (تكلفة البضاعة المباعة)
  taxPayableAccountId: string;      // Output VAT (ضريبة المخرجات)
  taxReceivableAccountId: string;   // Input VAT (ضريبة المدخلات المستردة)
  bankChargesAccountId: string;     // Bank Charges (رسوم وعمولات بنكية)
  discountsAllowedAccountId: string;// Discounts Allowed (خصم مسموح به)
  discountsReceivedAccountId: string;// Discounts Received (خصم مكتسب)
  retainedEarningsAccountId: string;// Retained Earnings (الأرباح المبقاة والمدورة 3200)
  suspenseAccountId: string;        // Suspense / Clearing Account (حساب وسيط تسوية 3999)
}

export interface AccountingSettings {
  id: string;
  baseCurrency: string;
  fiscalYear: number;
  fiscalYearStartMonth: number; // 1 = January
  journalNumberPrefix: string;
  allowPostingToClosedPeriods: boolean;
  strictDoubleEntry: boolean;
  autoPostOperationalJournals: boolean;
  requireCostCenterForExpenses: boolean;
  defaultAccounts: DefaultAccountsConfig;
  updatedAt: string;
  updatedBy: string;
}

export type JournalEntryType =
  | 'STANDARD'
  | 'ADJUSTING'
  | 'CLOSING'
  | 'REVERSAL'
  | 'OPENING'
  | 'AUTOMATED';

export type JournalEntryStatus =
  | 'DRAFT'
  | 'REVIEWED'
  | 'APPROVED'
  | 'POSTED'
  | 'REVERSED'
  | 'LOCKED'
  | 'CANCELLED';

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountNameAr: string;
  accountNameEn?: string;
  debit: number;
  credit: number;
  currency?: string;
  exchangeRate?: number;
  baseAmount?: number;
  descriptionAr: string;
  descriptionEn?: string;
  costCenterId?: string;
  costCenterName?: string;
  branchId?: string;
  taxAmount?: number;
  referenceDoc?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // e.g. "JE-2026-0001", "ADJ-2026-0001"
  date: string; // YYYY-MM-DD
  type: JournalEntryType;
  status: JournalEntryStatus;
  referenceType?: 'VOUCHER' | 'POS' | 'PURCHASE' | 'PAYROLL' | 'INVENTORY' | 'LEASE' | 'MANUAL' | 'BANK_RECON';
  referenceId?: string;
  referenceNumber?: string;
  descriptionAr: string;
  descriptionEn?: string;
  companyName?: string;
  branchId?: string;
  branchName?: string;
  currency?: string;
  exchangeRate?: number;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  postedBy?: string;
  postedAt?: string;
  reversedEntryId?: string;      // Points to original entry if this is a reversal
  reversalEntryId?: string;      // Points to the reversing entry created
  reversalReason?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountingRevisionLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'EDIT' | 'APPROVE' | 'POST' | 'REVERSE' | 'LOCK' | 'UNLOCK' | 'DELETE_DRAFT' | 'SETTINGS_UPDATE';
  entityType: 'JOURNAL_ENTRY' | 'ACCOUNT' | 'PERIOD' | 'TAX' | 'BANK_ACCOUNT' | 'RECONCILIATION' | 'SETTINGS';
  entityId: string;
  entityReference: string;
  detailsAr: string;
  detailsEn: string;
  previousState?: any;
  newState?: any;
}

export interface FiscalPeriod {
  id: string;
  year: number;
  periodNumber: number; // 1 to 12 or 13 for Year-End
  nameAr: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
  closedAt?: string;
  closedBy?: string;
  unlockedAt?: string;
  unlockedBy?: string;
  unlockReason?: string;
}

export interface FinancialReportPeriodFilter {
  startDate: string;
  endDate: string;
  branchId: string;
  costCenterId?: string;
  currency?: string;
  includeDrafts: boolean;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  type: AccountType;
  category: AccountCategory;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  netBalance: number;
}

export interface IncomeStatementReport {
  operatingRevenue: {
    items: { code: string; nameAr: string; amount: number }[];
    total: number;
  };
  cogs: {
    items: { code: string; nameAr: string; amount: number }[];
    total: number;
  };
  grossProfit: number;
  operatingExpenses: {
    items: { code: string; nameAr: string; amount: number }[];
    total: number;
  };
  operatingIncome: number; // EBIT
  otherIncomeAndExpenses: {
    items: { code: string; nameAr: string; amount: number }[];
    total: number;
  };
  netIncomeBeforeTax: number;
  taxExpense: number;
  netProfit: number;
}

export interface BalanceSheetReport {
  assets: {
    currentAssets: { items: { code: string; nameAr: string; amount: number }[]; total: number };
    nonCurrentAssets: { items: { code: string; nameAr: string; amount: number }[]; total: number };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: { items: { code: string; nameAr: string; amount: number }[]; total: number };
    longTermLiabilities: { items: { code: string; nameAr: string; amount: number }[]; total: number };
    totalLiabilities: number;
  };
  equity: {
    items: { code: string; nameAr: string; amount: number }[];
    retainedEarnings: number;
    currentPeriodProfit: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  variance: number;
}

export interface UnbalancedEntryDiagnostic {
  entry: JournalEntry;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  reason: string;
}

export interface BalanceDiscrepancyDiagnostic {
  isBalanced: boolean;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  variance: number;
  openingStatus: {
    isBalanced: boolean;
    totalOpeningAssets: number;
    totalOpeningLiabilitiesAndEquity: number;
    variance: number;
    explanation: string;
  };
  unbalancedEntries: UnbalancedEntryDiagnostic[];
  unpostedDraftEntries: JournalEntry[];
  unpostedOperationalTransactions: {
    vouchersCount: number;
    vouchersTotal: number;
    purchasesCount: number;
    purchasesTotal: number;
    payrollsCount: number;
    payrollsTotal: number;
    totalUnsyncedAmount: number;
  };
  reconciliationRecommendations: {
    id: string;
    title: string;
    description: string;
    impact: string;
    actionType: 'FIX_OPENING' | 'POST_ALL_DRAFTS' | 'SYNC_TRANSACTIONS' | 'AUTO_BALANCE_ENTRY' | 'EDIT_ENTRY' | 'AUTO_CREATE_BALANCING_ENTRY';
    actionLabel: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    targetEntryId?: string;
  }[];
}

// ==========================================
// BANK RECONCILIATION & BANK ACCOUNTS (P1)
// ==========================================

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  currency: string;
  branch?: string;
  linkedAccountId: string; // ID of Account in Chart of Accounts (e.g., 1130 Bank Muscat)
  openingBalance: number;
  currentBookBalance: number;
  currentStatementBalance: number;
  lastReconciledDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BankMatchStatus = 'UNMATCHED' | 'POSSIBLE_MATCH' | 'MATCHED' | 'RECONCILED';

export interface BankStatementTransaction {
  id: string;
  bankAccountId: string;
  statementId?: string;
  transactionDate: string;
  valueDate?: string;
  description: string;
  reference?: string;
  debit: number;  // Outflow (Expenses / Payments)
  credit: number; // Inflow (Deposits / Receipts)
  balance?: number;
  matchStatus: BankMatchStatus;
  matchedJournalEntryId?: string;
  matchedJournalLineId?: string;
  matchedTransactionRef?: string;
  matchedAt?: string;
  matchedBy?: string;
  adjustmentEntryId?: string;
  notes?: string;
}

export interface BankReconciliationSession {
  id: string;
  bankAccountId: string;
  sessionNumber: string;
  statementStartDate: string;
  statementEndDate: string;
  statementStartingBalance: number;
  statementEndingBalance: number;
  bookBalance: number;
  outstandingDepositsTotal: number;
  outstandingPaymentsTotal: number;
  bankChargesTotal: number;
  adjustmentsTotal: number;
  reconciledBalance: number;
  difference: number;
  status: 'DRAFT' | 'RECONCILED' | 'APPROVED';
  reconciledBy: string;
  approvedBy?: string;
  approvedAt?: string;
  importedFileName?: string;
  importedTransactionsCount: number;
  matchedCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// ACCOUNTING PERMISSIONS (RBAC)
// ==========================================

export type AccountingPermission =
  | 'VIEW_ACCOUNTING'
  | 'CREATE_JOURNAL_ENTRY'
  | 'EDIT_DRAFT_ENTRY'
  | 'POST_ENTRY'
  | 'REVERSE_ENTRY'
  | 'MANAGE_CHART_OF_ACCOUNTS'
  | 'MANAGE_ACCOUNTING_SETTINGS'
  | 'IMPORT_BANK_STATEMENT'
  | 'RECONCILE_BANK'
  | 'APPROVE_RECONCILIATION'
  | 'CLOSE_PERIOD'
  | 'REOPEN_PERIOD'
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS'
  | 'VIEW_AUDIT_LOGS';
