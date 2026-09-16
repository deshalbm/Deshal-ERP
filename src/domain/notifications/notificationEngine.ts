import { InventoryItem, LeaseContract, JournalEntry, ERPNotification } from "../../types";

/**
 * Pure Business Logic: Evaluates inventory levels, lease installment schedules, and journal entries
 * to generate dynamic system notifications for the ERP workspace.
 */
export function generateSystemNotifications(
  inventoryList: InventoryItem[] = [],
  leaseContractsList: LeaseContract[] = [],
  journalEntriesList: JournalEntry[] = []
): ERPNotification[] {
  const list: ERPNotification[] = [];

  // 1. Low stock alerts
  const lowStockItems = inventoryList.filter(
    (item) => (item.quantity || 0) <= (item.minAlertQuantity || 5)
  );
  if (lowStockItems.length > 0) {
    list.push({
      id: "alert-low-stock",
      type: "warning",
      titleAr: `تنبيه نقص مخزون (${lowStockItems.length} صنف)`,
      titleEn: `Low Stock Alert (${lowStockItems.length} items)`,
      descAr: `الأصناف (${lowStockItems.slice(0, 2).map((i) => i.name).join("، ")}${lowStockItems.length > 2 ? " وغيرها" : ""}) وصلت للحد الأدنى. يُنصح بإصدار أمر شراء.`,
      descEn: `Items reached reorder point. Consider creating a purchase order.`,
      time: "تحديث لحظي",
      targetTab: "inventory"
    });
  }

  // 2. Pending vouchers or installments
  const pendingInstallments = leaseContractsList.flatMap((c) =>
    ((c as any).paymentSchedule || c.installments || []).filter((p: any) => p.status === "PENDING")
  );
  if (pendingInstallments.length > 0) {
    list.push({
      id: "alert-pending-installments",
      type: "info",
      titleAr: `أقساط إيجار مستحقة (${pendingInstallments.length} دفعة)`,
      titleEn: `Pending Lease Installments (${pendingInstallments.length})`,
      descAr: `يوجد دفعات إيجارية مستحقة التحصيل لمستأجري المساحات والمكاتب.`,
      descEn: `There are upcoming lease payments to collect.`,
      time: "اليوم",
      targetTab: "contracts"
    });
  }

  // 3. Unposted Journal entries or drafts
  const draftEntries = journalEntriesList.filter((j) => j.status === "DRAFT");
  if (draftEntries.length > 0) {
    list.push({
      id: "alert-draft-entries",
      type: "info",
      titleAr: `قيود محاسبية مسودة (${draftEntries.length} قيد)`,
      titleEn: `Draft Journal Entries (${draftEntries.length})`,
      descAr: `توجد قيود محاسبية تحتاج إلى المراجعة والترحيل للأستاذ العام.`,
      descEn: `Journal entries pending posting in the General Ledger.`,
      time: "اليوم",
      targetTab: "accounting"
    });
  }

  return list;
}
