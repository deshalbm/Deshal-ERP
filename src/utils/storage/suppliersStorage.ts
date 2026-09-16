import { Supplier } from "../../types";

const SUPPLIERS_STORAGE_KEY = "rv_studio_suppliers_list";

export const DEFAULT_SUPPLIERS: Supplier[] = [];

export function loadSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load suppliers from localStorage:", e);
  }
  return [];
}

export function saveSuppliers(suppliers: Supplier[]): void {
  try {
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
  } catch (e) {
    console.error("Failed to save suppliers:", e);
  }
}
