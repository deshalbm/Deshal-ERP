// ============================================================================
// DESHAL ERP — STORAGE COMPATIBILITY FACADE
// ============================================================================
// Domain storage logic has been modularized under src/utils/storage/*.ts.
// This file acts as a backwards-compatible Facade re-exporting all functions.
// ============================================================================

export * from './storage/customersStorage';
export * from './storage/inventoryStorage';
export * from './storage/suppliersStorage';
export * from './storage/purchasesStorage';
export * from './storage/employeesStorage';
export * from './storage/posStorage';
export * from './storage/spacesStorage';
export * from './storage/requestsStorage';
export * from './storage/settingsStorage';

import {
  ReceiptVoucher,
  StockMovement,
  Branch,
  StockTransfer,
  RecurringSchedule
} from "../types";
import { numberToWords } from "./numberToWords";
import { loadCompanySettings } from "./storage/settingsStorage";

const STORAGE_KEYS = {
  SETTINGS: "rv_studio_company_settings",
  THEME: "rv_studio_design_theme",
  VOUCHERS: "rv_studio_vouchers_list",
  CUSTOMERS: "rv_studio_customers_list",
  INVENTORY: "rv_studio_inventory_items",
  PURCHASES: "rv_studio_purchases_list",
  SUPPLIERS: "rv_studio_suppliers_list",
  MOVEMENTS: "rv_studio_stock_movements",
  BRANCHES: "rv_studio_branches_list",
  TRANSFERS: "rv_studio_stock_transfers",
  ACTIVE_BRANCH: "rv_studio_active_branch_id",
  EMPLOYEES: "rv_studio_employees_list",
  ACTIVE_EMPLOYEE: "rv_studio_active_employee_id",
  POS_ORDERS: "rv_studio_pos_orders_list",
  POS_HELD_CARTS: "rv_studio_pos_held_carts",
  CASHIER_SHIFTS: "rv_studio_cashier_shifts",
  ACTIVE_SHIFT: "rv_studio_active_shift",
  RECURRING_SCHEDULES: "rv_studio_recurring_schedules",
  WHATSAPP_LOGS: "rv_studio_whatsapp_logs",
  SPACES: "rv_studio_rental_spaces",
  BOOKINGS: "rv_studio_space_bookings",
  SERVICES: "rv_studio_consulting_services",
  MEMBERSHIPS: "rv_studio_membership_packages",
  SUBSCRIPTIONS: "rv_studio_tenant_subscriptions",
  SERVICE_BOOKINGS: "rv_studio_service_bookings",
  CONTRACTS: "rv_studio_lease_contracts",
  ATTENDANCE: "deshal_hr_attendance_records",
  PAYROLL_SLIPS: "deshal_hr_payroll_slips",
  LEAVE_REQUESTS: "deshal_hr_leave_requests"
};

export function clearAllLocalStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('deshal_') || key.startsWith('rv_studio_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch (e) {
    console.warn("Failed to clear local storage keys:", e);
  }
}

const TARGET_DESCRIPTION = "دفعة عن تركيب الكاميرات و شاشات المراقبة و الشاشات التفاعلية الذكية في مركز الدليل الشامل";
export const SAMPLE_VOUCHERS: ReceiptVoucher[] = [];

export function loadVouchers(): ReceiptVoucher[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const settings = loadCompanySettings();
        const defaultCurr = settings.defaultCurrency || "OMR";
        let shouldSave = false;

        const existingNumbers = new Set(parsed.map((v: ReceiptVoucher) => v.voucherNumber));
        const missingVouchers = SAMPLE_VOUCHERS.filter((sv) => !existingNumbers.has(sv.voucherNumber));

        let mergedList = [...parsed];
        if (missingVouchers.length > 0) {
          mergedList = [...mergedList, ...missingVouchers];
          shouldSave = true;
        }

        const updatedList = mergedList.map((v: ReceiptVoucher, idx: number) => {
          let voucherNum = v.voucherNumber;
          const curr = (!v.currency || v.currency === "USD") ? defaultCurr : v.currency;
          if (curr !== v.currency) shouldSave = true;

          const updatedLineItems = (v.lineItems && v.lineItems.length > 0)
            ? v.lineItems.map(item => ({ ...item, description: item.description || TARGET_DESCRIPTION }))
            : [{ id: `li-${idx + 1}`, description: TARGET_DESCRIPTION, quantity: 1, unitPrice: v.totalAmount || v.amount || 0, amount: v.totalAmount || v.amount || 0 }];

          const totalAmt = v.totalAmount ?? v.amount ?? 0;
          const paidAmt = v.paidAmount ?? v.amount ?? totalAmt;
          const remainingAmt = v.remainingAmount ?? Math.max(0, totalAmt - paidAmt);

          shouldSave = true;

          return {
            ...v,
            voucherNumber: voucherNum,
            currency: curr,
            lineItems: updatedLineItems,
            paidAmount: paidAmt,
            remainingAmount: remainingAmt,
            amountInWords: v.isCustomWords ? v.amountInWords : numberToWords(totalAmt, curr)
          };
        });

        if (shouldSave) {
          saveVouchers(updatedList);
        }
        return updatedList;
      }
    }
  } catch (e) {
    console.warn("Failed to load vouchers:", e);
  }
  saveVouchers(SAMPLE_VOUCHERS);
  return SAMPLE_VOUCHERS;
}

export function saveVouchers(vouchers: ReceiptVoucher[]): void {
  try {
    const processed: ReceiptVoucher[] = [];
    vouchers.forEach((v) => {
      const totalAmt = v.totalAmount ?? v.amount ?? 0;
      const paidAmt = v.paidAmount ?? v.amount ?? totalAmt;
      const remainingAmt = Math.max(0, totalAmt - paidAmt);
      const updatedVoucher = {
        ...v,
        paidAmount: paidAmt,
        remainingAmount: remainingAmt
      };

      if (updatedVoucher.type === "RECEIPT" && updatedVoucher.autoGenerateInvoice && !updatedVoucher.linkedInvoiceId) {
        const generatedInvId = `inv-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const invNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        updatedVoucher.linkedInvoiceId = generatedInvId;
        updatedVoucher.linkedInvoiceNumber = invNumber;
        updatedVoucher.autoGenerateInvoice = false;

        const autoInvoice: ReceiptVoucher = {
          ...updatedVoucher,
          id: generatedInvId,
          type: "TAX_INVOICE",
          voucherNumber: invNumber,
          referenceNo: updatedVoucher.voucherNumber,
          notes: `فاتورة ضريبية مُنشأة تلقائياً لسند القبض رقم ${updatedVoucher.voucherNumber}`,
          autoGenerateInvoice: false,
          linkedInvoiceId: updatedVoucher.id,
          linkedInvoiceNumber: updatedVoucher.voucherNumber
        };
        processed.push(updatedVoucher);
        processed.push(autoInvoice);
      } else {
        processed.push(updatedVoucher);
      }
    });

    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(processed));
  } catch (e) {
    console.error("Failed to save vouchers:", e);
  }
}

// -------------------------------------------------------------------
// STOCK MOVEMENTS & BRANCHES LOGIC
// -------------------------------------------------------------------

export const DEFAULT_MOVEMENTS: StockMovement[] = [];

export function loadStockMovements(): StockMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load stock movements from localStorage:", e);
  }
  saveStockMovements(DEFAULT_MOVEMENTS);
  return DEFAULT_MOVEMENTS;
}

export function saveStockMovements(movements: StockMovement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  } catch (e) {
    console.error("Failed to save stock movements:", e);
  }
}

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "br-sohar",
    code: "BR-SOH-01",
    name: "فرع صحار الرئيسي (المركز العام)",
    nameEn: "Sohar Headquarter Branch",
    isMain: true,
    phone: "+968 77438203",
    email: "sohar@digititech.com",
    address: "مبنى مدن - بجوار مجمع المحاكم - صحار",
    city: "صحار",
    country: "سلطنة عمان",
    taxId: "OM-94288394-B",
    crNumber: "CR-1092831",
    managerName: "م. سعيد المعمري",
    managerPhone: "+968 77438203",
    status: "ACTIVE",
    defaultWarehouse: "المستودع الرئيسي - صحار",
    color: "#4f46e5",
    notes: "المقر الإداري والمستودع المركزي لعمليات شمال الباطنة وإدارة المشاريع التقنية والشبكات.",
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z"
  }
];

export const DEFAULT_TRANSFERS: StockTransfer[] = [];

export function loadBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load branches from localStorage:", e);
  }
  saveBranches(DEFAULT_BRANCHES);
  return DEFAULT_BRANCHES;
}

export function saveBranches(branches: Branch[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  } catch (e) {
    console.error("Failed to save branches:", e);
  }
}

export function loadTransfers(): StockTransfer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load transfers from localStorage:", e);
  }
  saveTransfers(DEFAULT_TRANSFERS);
  return DEFAULT_TRANSFERS;
}

export const loadStockTransfers = loadTransfers;

export function saveTransfers(transfers: StockTransfer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  } catch (e) {
    console.error("Failed to save transfers:", e);
  }
}

export const saveStockTransfers = saveTransfers;

export function loadActiveBranchId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH);
    if (saved) return saved;
  } catch (e) {
    console.warn("Failed to load active branch ID:", e);
  }
  return "ALL";
}

export function saveActiveBranchId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BRANCH, id);
  } catch (e) {
    console.error("Failed to save active branch ID:", e);
  }
}

export const DEFAULT_RECURRING_SCHEDULES: RecurringSchedule[] = [];

export function loadRecurringSchedules(): RecurringSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECURRING_SCHEDULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load recurring schedules:", e);
  }
  saveRecurringSchedules(DEFAULT_RECURRING_SCHEDULES);
  return DEFAULT_RECURRING_SCHEDULES;
}

export function saveRecurringSchedules(schedules: RecurringSchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECURRING_SCHEDULES, JSON.stringify(schedules));
  } catch (e) {
    console.error("Failed to save recurring schedules:", e);
  }
}
