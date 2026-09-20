/**
 * ERP Realtime Subscriptions Hook — Deshal ERP
 * Encapsulates Supabase Postgres changes WebSockets subscriptions.
 * Ensures clean setup and teardown on unmount, logout, or company change.
 */

import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import * as customerSvc from '../lib/supabase/customerService';
import * as inventorySvc from '../lib/supabase/inventoryService';
import * as employeeSvc from '../lib/supabase/employeeService';
import * as accountingSvc from '../lib/supabase/accountingService';
import * as purchasesSvc from '../lib/supabase/purchasesService';
import type { Customer, Employee, InventoryItem, JournalEntry, ReceiptVoucher } from '../types';

export interface ERPRealtimeCallbacks {
  onCustomersUpdate: (customers: Customer[]) => void;
  onInventoryUpdate: (inventory: InventoryItem[]) => void;
  onEmployeesUpdate: (employees: Employee[]) => void;
  onJournalEntriesUpdate: (entries: JournalEntry[]) => void;
  onVouchersUpdate: (vouchers: ReceiptVoucher[]) => void;
}

export function useERPRealtimeSubscriptions(
  companyId: string,
  callbacks: ERPRealtimeCallbacks
): void {
  const {
    onCustomersUpdate,
    onInventoryUpdate,
    onEmployeesUpdate,
    onJournalEntriesUpdate,
    onVouchersUpdate,
  } = callbacks;

  useEffect(() => {
    if (!isSupabaseConfigured || !companyId) return;

    const channel = supabase
      .channel(`erp-company-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          customerSvc.getCustomers(companyId).then(onCustomersUpdate).catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          inventorySvc.getInventoryItems(companyId).then(onInventoryUpdate).catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          employeeSvc.getEmployees(companyId).then((fetched) => {
            if (fetched && fetched.length > 0) {
              onEmployeesUpdate(fetched);
            }
          }).catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          accountingSvc.getJournalEntries(companyId).then(onJournalEntriesUpdate).catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pos_orders',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          purchasesSvc.getVouchers(companyId).then(onVouchersUpdate).catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          customerSvc.getCustomers(companyId).then(onCustomersUpdate).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    companyId,
    onCustomersUpdate,
    onInventoryUpdate,
    onEmployeesUpdate,
    onJournalEntriesUpdate,
    onVouchersUpdate,
  ]);
}
