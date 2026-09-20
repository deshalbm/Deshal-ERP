import { POSOrder, POSHeldCart, CashierShift } from "../../types";
import { resolveCompanyId } from "../uuid";

const POS_ORDERS_STORAGE_KEY = "rv_studio_pos_orders_list";
const POS_HELD_CARTS_STORAGE_KEY = "rv_studio_pos_held_carts";
const CASHIER_SHIFTS_STORAGE_KEY = "rv_studio_cashier_shifts";

export const DEFAULT_POS_ORDERS: POSOrder[] = [];
export const DEFAULT_CASHIER_SHIFTS: CashierShift[] = [];

export function loadPOSOrders(): POSOrder[] {
  try {
    const raw = localStorage.getItem(POS_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load POS orders from localStorage:", e);
  }
  return [];
}

export function savePOSOrders(orders: POSOrder[], companyId: string = ""): void {
  try {
    localStorage.setItem(POS_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    const validCompanyId = resolveCompanyId(companyId);
    if (orders.length > 0 && validCompanyId && typeof window !== "undefined") {
      const latest = orders[0];
      import("../../lib/supabase/posService")
        .then((svc) => svc.upsertPOSOrder(latest, validCompanyId))
        .catch(console.error);
    }
  } catch (e) {
    console.error("Failed to save POS orders:", e);
  }
}

export function loadPOSHeldCarts(): POSHeldCart[] {
  try {
    const raw = localStorage.getItem(POS_HELD_CARTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load POS held carts:", e);
  }
  return [];
}

export function savePOSHeldCarts(carts: POSHeldCart[]): void {
  try {
    localStorage.setItem(POS_HELD_CARTS_STORAGE_KEY, JSON.stringify(carts));
  } catch (e) {
    console.error("Failed to save POS held carts:", e);
  }
}

export function loadCashierShifts(): CashierShift[] {
  try {
    const raw = localStorage.getItem(CASHIER_SHIFTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load cashier shifts:", e);
  }
  return [];
}

export function saveCashierShifts(shifts: CashierShift[], companyId: string = ""): void {
  try {
    localStorage.setItem(CASHIER_SHIFTS_STORAGE_KEY, JSON.stringify(shifts));
    const validCompanyId = resolveCompanyId(companyId);
    if (shifts.length > 0 && validCompanyId && typeof window !== "undefined") {
      const latest = shifts[0];
      import("../../lib/supabase/posService")
        .then((svc) => svc.upsertCashierShift(latest, validCompanyId))
        .catch(console.error);
    }
  } catch (e) {
    console.error("Failed to save cashier shifts:", e);
  }
}

export function loadActiveShift(): CashierShift | null {
  const allShifts = loadCashierShifts();
  const openShift = allShifts.find((s) => s.status === "OPEN");
  return openShift || null;
}
