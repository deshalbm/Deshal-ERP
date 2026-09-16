/**
 * DESHAL ERP — DOUBLE-ENTRY FINANCIAL INVARIANTS & LEDGER AUDIT ENGINE UNIT TEST SUITE
 * 
 * Verifies Debit === Credit invariants, 3-decimal OMR balance precision,
 * non-destructive posting reversal generation, trial balance math, and ledger integrity diagnostics.
 */

import {
  validateJournalBalance,
  generatePostingReversalPayload,
  verifyLedgerIntegrity,
  calculateTrialBalanceFromEntries
} from "../domain/finance/doubleEntryEngine";

import { JournalEntry, JournalEntryLine, Account } from "../types/accounting";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

function runTests() {
  console.log("================================================================");
  console.log("  DESHAL ERP — DOUBLE-ENTRY INVARIANTS DOMAIN UNIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: JOURNAL BALANCE VALIDATION ---
  console.log("\n--- TEST 1: JOURNAL BALANCE VALIDATION ---");
  const balancedLines: JournalEntryLine[] = [
    { id: "l1", accountId: "acc-1110", accountCode: "1110", accountNameAr: "الخزينة النقدية", debit: 150.500, credit: 0, descriptionAr: "تحصيل نقدي" },
    { id: "l2", accountId: "acc-4100", accountCode: "4100", accountNameAr: "إيرادات قاعات", debit: 0, credit: 150.500, descriptionAr: "إيراد مبيعات" }
  ];

  const valBalanced = validateJournalBalance(balancedLines);
  assert(valBalanced.isBalanced === true, "Balanced entry (150.500 Debit === 150.500 Credit) passes validation");
  assert(valBalanced.totalDebit === 150.500, "Total debit is 150.500 OMR");
  assert(valBalanced.totalCredit === 150.500, "Total credit is 150.500 OMR");
  assert(valBalanced.imbalanceAmount === 0, "Imbalance amount is 0 OMR");

  const unbalancedLines: JournalEntryLine[] = [
    { id: "l1", accountId: "acc-1110", accountCode: "1110", accountNameAr: "الخزينة النقدية", debit: 150.500, credit: 0, descriptionAr: "تحصيل نقدي" },
    { id: "l2", accountId: "acc-4100", accountCode: "4100", accountNameAr: "إيرادات قاعات", debit: 0, credit: 100.000, descriptionAr: "إيراد مبيعات" }
  ];

  const valUnbalanced = validateJournalBalance(unbalancedLines);
  assert(valUnbalanced.isBalanced === false, "Unbalanced entry (150.500 Debit !== 100.000 Credit) fails validation");
  assert(valUnbalanced.imbalanceAmount === 50.500, "Calculates imbalance of 50.500 OMR");

  // --- TEST 2: NON-DESTRUCTIVE POSTING REVERSAL PAYLOAD ---
  console.log("\n--- TEST 2: NON-DESTRUCTIVE POSTING REVERSAL PAYLOAD ---");
  const originalJE: JournalEntry = {
    id: "je-101",
    entryNumber: "JE-2026-0001",
    date: "2026-01-15",
    type: "STANDARD",
    status: "POSTED",
    descriptionAr: "إثبات سداد قيد الخزينة",
    lines: balancedLines,
    totalDebit: 150.500,
    totalCredit: 150.500,
    isBalanced: true,
    createdBy: "مدير النظام",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z"
  };

  const revRes = generatePostingReversalPayload(originalJE, "خطأ في توجيه الحساب", "فاطمة البلوشي");
  assert(revRes.success === true, "Generates reversal payload successfully for POSTED entry");
  assert(revRes.reversalEntry !== undefined, "Reversal entry is defined");

  if (revRes.reversalEntry) {
    const revEntry = revRes.reversalEntry;
    assert(revEntry.type === "REVERSAL", "Reversal entry type is REVERSAL");
    assert(revEntry.status === "POSTED", "Reversal entry status is POSTED");
    assert(revEntry.reversedEntryId === originalJE.id, "Links reversedEntryId to original entry ID");
    assert(revEntry.lines[0].debit === 0 && revEntry.lines[0].credit === 150.500, "Swaps Debit and Credit on line 1");
    assert(revEntry.lines[1].debit === 150.500 && revEntry.lines[1].credit === 0, "Swaps Debit and Credit on line 2");
  }

  // --- TEST 3: DRAFT OR ALREADY REVERSED ENTRY REVERSAL PROTECTION ---
  console.log("\n--- TEST 3: DRAFT OR ALREADY REVERSED ENTRY REVERSAL PROTECTION ---");
  const draftJE: JournalEntry = { ...originalJE, status: "DRAFT" };
  const draftRes = generatePostingReversalPayload(draftJE, "سبب العكس", "أحمد");
  assert(draftRes.success === false, "Fails to generate reversal for DRAFT entry");

  const alreadyReversedJE: JournalEntry = { ...originalJE, reversalEntryId: "je-rev-999" };
  const alreadyRes = generatePostingReversalPayload(alreadyReversedJE, "سبب العكس", "أحمد");
  assert(alreadyRes.success === false, "Fails to generate reversal for already reversed entry");

  // --- TEST 4: LEDGER INTEGRITY AUDIT ---
  console.log("\n--- TEST 4: LEDGER INTEGRITY AUDIT ---");
  const postedLedger: JournalEntry[] = [
    originalJE,
    {
      id: "je-102",
      entryNumber: "JE-2026-0002",
      date: "2026-01-16",
      type: "STANDARD",
      status: "POSTED",
      descriptionAr: "مصروفات صيانة",
      lines: [
        { id: "l3", accountId: "acc-5600", accountCode: "5600", accountNameAr: "مصروفات صيانة", debit: 45.000, credit: 0, descriptionAr: "صيانة" },
        { id: "l4", accountId: "acc-1110", accountCode: "1110", accountNameAr: "الخزينة النقدية", debit: 0, credit: 45.000, descriptionAr: "صرف نقدي" }
      ],
      totalDebit: 45.000,
      totalCredit: 45.000,
      isBalanced: true,
      createdBy: "أحمد المعمري",
      createdAt: "2026-01-16T11:00:00Z",
      updatedAt: "2026-01-16T11:00:00Z"
    }
  ];

  const integrityReport = verifyLedgerIntegrity(postedLedger);
  assert(integrityReport.isIntegral === true, "Audits 100% balanced ledger with zero violations");
  assert(integrityReport.totalPostedEntries === 2, "Counts 2 posted journal entries");
  assert(integrityReport.totalPostedDebit === 195.500, "Sums total posted debits as 195.500 OMR");
  assert(integrityReport.totalPostedCredit === 195.500, "Sums total posted credits as 195.500 OMR");
  assert(integrityReport.integrityViolationsCount === 0, "Zero integrity violations detected");

  // --- TEST 5: TRIAL BALANCE CALCULATION ---
  console.log("\n--- TEST 5: TRIAL BALANCE CALCULATION ---");
  const mockAccounts: Account[] = [
    { id: "acc-1110", code: "1110", nameAr: "الخزينة النقدية", nameEn: "Main Cash Vault", type: "ASSET", category: "CASH_BANK", isPosting: true, openingBalance: 1000, currentBalance: 1000, currency: "OMR", isActive: true, createdAt: "", updatedAt: "" },
    { id: "acc-4100", code: "4100", nameAr: "إيرادات قاعات", nameEn: "Spaces Revenue", type: "REVENUE", category: "RENTAL_REVENUE", isPosting: true, openingBalance: 1000, currentBalance: 1000, currency: "OMR", isActive: true, createdAt: "", updatedAt: "" },
    { id: "acc-5600", code: "5600", nameAr: "مصروفات صيانة", nameEn: "Maintenance Expense", type: "EXPENSE", category: "OPERATING_EXPENSE", isPosting: true, openingBalance: 0, currentBalance: 0, currency: "OMR", isActive: true, createdAt: "", updatedAt: "" }
  ];

  const trialRes = calculateTrialBalanceFromEntries(mockAccounts, postedLedger);
  assert(trialRes.isTrialBalanceBalanced === true, "Trial balance is 100% balanced (Total Debit === Total Credit)");
  assert(trialRes.rows.length === 3, "Generates trial balance rows for 3 accounts");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
