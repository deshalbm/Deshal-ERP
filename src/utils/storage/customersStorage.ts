import { Customer, ReceiptVoucher } from "../../types";
import { generateUuid } from "../uuid";

const CUSTOMERS_STORAGE_KEY = "rv_studio_customers_list";

export const DEFAULT_CUSTOMERS: Customer[] = [];

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load customers from localStorage:", e);
  }
  saveCustomers(DEFAULT_CUSTOMERS);
  return DEFAULT_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch (e) {
    console.error("Failed to save customers to localStorage:", e);
  }
}


