import { Customer, ReceiptVoucher } from "../../types";
import { generateUuid } from "../../domain/common/uuid";
import { CustomerRepositoryPort } from "../ports/customerRepositoryPort";

export interface SyncCustomerFromVoucherOptions {
  repository?: CustomerRepositoryPort;
  nowMs?: number;
}

export function syncCustomerFromVoucher(
  voucher: Partial<ReceiptVoucher>,
  currentList?: Customer[],
  options?: SyncCustomerFromVoucherOptions
): Customer[] {
  const repository = options?.repository;
  const currentCustomers = currentList || (repository ? repository.loadCustomers() : []);
  if (!voucher.receivedFrom || !voucher.receivedFrom.trim()) return currentCustomers;
  const name = voucher.receivedFrom.trim();
  const existing = currentCustomers.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );

  const nowMs = options?.nowMs || Date.now();
  const now = new Date(nowMs).toISOString();

  if (existing) {
    let hasUpdates = false;
    const updated: Customer = {
      ...existing,
      phone: voucher.payerPhone || existing.phone,
      email: voucher.payerEmail || existing.email,
      address: voucher.payerAddress || existing.address,
      taxId: voucher.payerTaxId || existing.taxId,
      updatedAt: now
    };
    if (
      updated.phone !== existing.phone ||
      updated.email !== existing.email ||
      updated.address !== existing.address
    ) {
      hasUpdates = true;
    }
    if (hasUpdates) {
      const updatedList = currentCustomers.map((c) => (c.id === existing.id ? updated : c));
      if (repository) {
        repository.saveCustomers(updatedList);
      }
      return updatedList;
    }
    return currentCustomers;
  }

  const newCustomer: Customer = {
    id: generateUuid(),
    name: name,
    contactPerson: "",
    phone: voucher.payerPhone || "",
    email: voucher.payerEmail || "",
    address: voucher.payerAddress || "",
    city: "صحار",
    country: "سلطنة عمان",
    taxId: voucher.payerTaxId || "",
    type: "CORPORATE",
    status: "ACTIVE",
    notes: `تمت الإضافة تلقائياً من محرر السندات - سند رقم ${voucher.voucherNumber || ""}`,
    tags: ["سندات مالية"],
    creditLimit: 10000,
    interactions: [
      {
        id: `act-${nowMs}`,
        date: now,
        type: "VOUCHER_ISSUED",
        title: `إنشاء السند ${voucher.voucherNumber || ""}`,
        notes: `تم إنشاء سند مالي بمبلغ ${voucher.totalAmount || voucher.amount || 0} ${voucher.currency || "OMR"}`,
        createdByName: "النظام"
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  const updatedList = [newCustomer, ...currentCustomers];
  if (repository) {
    repository.saveCustomers(updatedList);
  }
  return updatedList;
}
