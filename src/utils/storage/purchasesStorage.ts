import { PurchaseInvoice } from "../../types";

const PURCHASES_STORAGE_KEY = "rv_studio_purchases_list";

export const DEFAULT_PURCHASES: PurchaseInvoice[] = [];

export function loadPurchases(): PurchaseInvoice[] {
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load purchases from localStorage:", e);
  }
  return [];
}

export function savePurchases(purchases: PurchaseInvoice[]): void {
  try {
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
  } catch (e) {
    console.error("Failed to save purchases:", e);
  }
}
