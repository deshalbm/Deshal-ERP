import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Account, JournalEntry, AccountingRevisionLog, FiscalPeriod, TrialBalanceRow } from '../types';
import {
  loadAccounts,
  saveAccounts,
  loadJournalEntries,
  saveJournalEntries,
  loadAccountingRevisionLogs,
  saveAccountingRevisionLogs,
  loadFiscalPeriods,
  saveFiscalPeriods
} from '../utils/accountingStorage';
import {
  generatePostingReversalPayload,
  verifyLedgerIntegrity,
  calculateTrialBalanceFromEntries,
  createAccountingRevisionLog,
  LedgerIntegrityReport
} from '../domain/finance/doubleEntryEngine';
import * as accountingSvc from '../lib/supabase/accountingService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { useERPData } from './ERPDataContext';

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export interface AccountingContextState {
  accounts: Account[];
  journalEntries: JournalEntry[];
  revisionLogs: AccountingRevisionLog[];
  fiscalPeriods: FiscalPeriod[];
}

export interface AccountingContextActions {
  saveAccounts: (accounts: Account[]) => void;
  saveJournalEntries: (entries: JournalEntry[]) => void;
  saveRevisionLogs: (logs: AccountingRevisionLog[]) => void;
  saveFiscalPeriods: (periods: FiscalPeriod[]) => void;
  setAccountsList: (accounts: Account[]) => void;
  setJournalEntriesList: (entries: JournalEntry[]) => void;
  setRevisionLogsList: (logs: AccountingRevisionLog[]) => void;
  setFiscalPeriodsList: (periods: FiscalPeriod[]) => void;

  // New Double-Entry & Audit Actions
  reverseJournalEntry: (entryId: string, reason: string, reversedBy: string) => { success: boolean; errorMessage?: string; reversalEntry?: JournalEntry };
  verifyLedgerIntegrityAction: () => LedgerIntegrityReport;
  getTrialBalance: () => { rows: TrialBalanceRow[]; isTrialBalanceBalanced: boolean; totalDebitSum: number; totalCreditSum: number };
}

export interface AccountingContextValue {
  state: AccountingContextState;
  actions: AccountingContextActions;
}

const AccountingContext = createContext<AccountingContextValue | null>(null);

export interface AccountingProviderProps {
  children: React.ReactNode;
  initialAccounts?: Account[];
  initialJournalEntries?: JournalEntry[];
  initialRevisionLogs?: AccountingRevisionLog[];
  initialFiscalPeriods?: FiscalPeriod[];
}

export const AccountingProvider: React.FC<AccountingProviderProps> = ({
  children,
  initialAccounts,
  initialJournalEntries,
  initialRevisionLogs,
  initialFiscalPeriods
}) => {
  const erpData = useERPData();

  const [internalAccounts, setInternalAccounts] = useState<Account[]>(() => {
    if (initialAccounts) return initialAccounts;
    if (erpData?.accountsList && erpData.accountsList.length > 0) {
      return erpData.accountsList;
    }
    return loadAccounts();
  });

  const [internalJournalEntries, setInternalJournalEntries] = useState<JournalEntry[]>(() => {
    if (initialJournalEntries) return initialJournalEntries;
    if (erpData?.journalEntriesList && erpData.journalEntriesList.length > 0) {
      return erpData.journalEntriesList;
    }
    return loadJournalEntries();
  });

  const [internalRevisionLogs, setInternalRevisionLogs] = useState<AccountingRevisionLog[]>(() => {
    if (initialRevisionLogs) return initialRevisionLogs;
    return loadAccountingRevisionLogs();
  });

  const [internalFiscalPeriods, setInternalFiscalPeriods] = useState<FiscalPeriod[]>(() => {
    if (initialFiscalPeriods) return initialFiscalPeriods;
    if (erpData?.fiscalPeriodsList && erpData.fiscalPeriodsList.length > 0) {
      return erpData.fiscalPeriodsList;
    }
    return loadFiscalPeriods();
  });

  // Sync to ERPDataContext (One-Way Bridge: AccountingContext -> ERPDataContext)
  useEffect(() => {
    if (erpData?.setAccountsList) erpData.setAccountsList(internalAccounts);
  }, [internalAccounts, erpData]);

  useEffect(() => {
    if (erpData?.setJournalEntriesList) erpData.setJournalEntriesList(internalJournalEntries);
  }, [internalJournalEntries, erpData]);

  useEffect(() => {
    if (erpData?.setFiscalPeriodsList) erpData.setFiscalPeriodsList(internalFiscalPeriods);
  }, [internalFiscalPeriods, erpData]);

  const companyId = erpData?.companyId || DEFAULT_COMPANY_ID;

  const saveAccountsAction = useCallback(
    (updated: Account[]) => {
      setInternalAccounts(updated);
      saveAccounts(updated);
      if (isSupabaseConfigured) {
        Promise.all(updated.map((acc) => accountingSvc.upsertAccount(acc, companyId))).catch(console.error);
      }
    },
    [companyId]
  );

  const saveJournalEntriesAction = useCallback(
    (updated: JournalEntry[]) => {
      setInternalJournalEntries(updated);
      saveJournalEntries(updated);
      if (isSupabaseConfigured) {
        Promise.all(updated.map((entry) => accountingSvc.saveJournalEntry(entry, companyId))).catch(console.error);
      }
    },
    [companyId]
  );

  const saveRevisionLogsAction = useCallback((updated: AccountingRevisionLog[]) => {
    setInternalRevisionLogs(updated);
    saveAccountingRevisionLogs(updated);
  }, []);

  const saveFiscalPeriodsAction = useCallback((updated: FiscalPeriod[]) => {
    setInternalFiscalPeriods(updated);
    saveFiscalPeriods(updated);
  }, []);

  // --- DOUBLE-ENTRY & AUDIT ACTIONS ---
  const reverseJournalEntry = useCallback(
    (entryId: string, reason: string, reversedBy: string) => {
      const targetEntry = internalJournalEntries.find((e) => e.id === entryId);
      if (!targetEntry) {
        return { success: false, errorMessage: "القيد المحاسبي غير موجود." };
      }

      const reversalRes = generatePostingReversalPayload(targetEntry, reason, reversedBy);
      if (!reversalRes.success || !reversalRes.reversalEntry) {
        return { success: false, errorMessage: reversalRes.errorMessage || "فشل إنشاء قيد العكس." };
      }

      const updatedOriginal: JournalEntry = {
        ...targetEntry,
        status: "REVERSED",
        reversalEntryId: reversalRes.reversalEntry.id,
        reversalReason: reason,
        updatedAt: new Date().toISOString()
      };

      const newEntriesList = [reversalRes.reversalEntry, ...internalJournalEntries.map((e) => (e.id === entryId ? updatedOriginal : e))];
      saveJournalEntriesAction(newEntriesList);

      // Log Audit Revision
      const newLog = createAccountingRevisionLog(
        "REVERSE",
        "JOURNAL_ENTRY",
        entryId,
        targetEntry.entryNumber,
        `عكس القيد المحاسبي ${targetEntry.entryNumber} بموجب القيد ${reversalRes.reversalEntry.entryNumber}. السبب: ${reason}`,
        `Reversed journal entry ${targetEntry.entryNumber} with ${reversalRes.reversalEntry.entryNumber}. Reason: ${reason}`,
        reversedBy
      );
      saveRevisionLogsAction([newLog, ...internalRevisionLogs]);

      return { success: true, reversalEntry: reversalRes.reversalEntry };
    },
    [internalJournalEntries, internalRevisionLogs, saveJournalEntriesAction, saveRevisionLogsAction]
  );

  const verifyLedgerIntegrityAction = useCallback((): LedgerIntegrityReport => {
    return verifyLedgerIntegrity(internalJournalEntries);
  }, [internalJournalEntries]);

  const getTrialBalance = useCallback(() => {
    return calculateTrialBalanceFromEntries(internalAccounts, internalJournalEntries);
  }, [internalAccounts, internalJournalEntries]);

  const value = useMemo<AccountingContextValue>(
    () => ({
      state: {
        accounts: internalAccounts,
        journalEntries: internalJournalEntries,
        revisionLogs: internalRevisionLogs,
        fiscalPeriods: internalFiscalPeriods
      },
      actions: {
        saveAccounts: saveAccountsAction,
        saveJournalEntries: saveJournalEntriesAction,
        saveRevisionLogs: saveRevisionLogsAction,
        saveFiscalPeriods: saveFiscalPeriodsAction,
        setAccountsList: setInternalAccounts,
        setJournalEntriesList: setInternalJournalEntries,
        setRevisionLogsList: setInternalRevisionLogs,
        setFiscalPeriodsList: setInternalFiscalPeriods,
        reverseJournalEntry,
        verifyLedgerIntegrityAction,
        getTrialBalance
      }
    }),
    [
      internalAccounts,
      internalJournalEntries,
      internalRevisionLogs,
      internalFiscalPeriods,
      saveAccountsAction,
      saveJournalEntriesAction,
      saveRevisionLogsAction,
      saveFiscalPeriodsAction,
      reverseJournalEntry,
      verifyLedgerIntegrityAction,
      getTrialBalance
    ]
  );

  return <AccountingContext.Provider value={value}>{children}</AccountingContext.Provider>;
};

export function useAccounting(): AccountingContextValue {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
}
