import { generateSystemNotifications } from "../../domain/notifications/notificationEngine";
import { ERPNotification, InventoryItem, LeaseContract, JournalEntry } from "../../types";

export interface NotificationDataProviderPort {
  loadInventory: () => InventoryItem[];
  loadLeaseContracts: () => LeaseContract[];
  loadJournalEntries: () => JournalEntry[];
}

/**
 * Pure application service helper: derives workspace system notifications
 * by passing inventory, lease contracts, and journal entries to the domain notification engine.
 */
export function getSystemNotifications(
  inventory?: InventoryItem[],
  leaseContracts?: LeaseContract[],
  journalEntries?: JournalEntry[],
  dataProvider?: NotificationDataProviderPort
): ERPNotification[] {
  const inv = inventory || (dataProvider ? dataProvider.loadInventory() : []);
  const leases = leaseContracts || (dataProvider ? dataProvider.loadLeaseContracts() : []);
  const journals = journalEntries || (dataProvider ? dataProvider.loadJournalEntries() : []);
  return generateSystemNotifications(inv, leases, journals);
}
