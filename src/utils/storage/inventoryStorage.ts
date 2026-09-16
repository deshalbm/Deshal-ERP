import { InventoryItem } from "../../types";

const INVENTORY_STORAGE_KEY = "rv_studio_inventory_items";

export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [];

export function loadInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load inventory from localStorage:", e);
  }
  return [];
}

export function saveInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save inventory items:", e);
  }
}
