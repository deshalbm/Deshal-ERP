import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { ReceiptVoucher, VoucherType, CompanySettings } from "../types";
import { loadVouchers, saveVouchers, loadCompanySettings, saveCustomers, loadCustomers } from "../utils/storage";
import { syncCustomerFromVoucher } from "../application/crm/syncCustomerFromVoucher";
import { createNewVoucherState as createVoucherFactoryState, createDuplicateVoucherPayload } from "../domain/vouchers/voucherFactory";
import { numberToWords } from "../utils/numberToWords";
import { exportToPdf } from "../utils/pdfGenerator";
import { useERPData } from "./ERPDataContext";
import * as purchasesSvc from "../lib/supabase/purchasesService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { enqueueOfflineMutation } from "../lib/supabase/syncService";
import { resolveCompanyId } from "../utils/uuid";
import { logActivity } from "../utils/auditLogger";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export interface VouchersContextState {
  vouchers: ReceiptVoucher[];
  activeVoucher: ReceiptVoucher;
}

export interface VouchersContextActions {
  setActiveVoucher: (voucher: ReceiptVoucher) => void;
  saveActiveVoucher: () => void;
  deleteVoucher: (id: string) => void;
  deleteMultipleVouchers: (ids: string[]) => void;
  duplicateVoucher: (voucher: ReceiptVoucher) => void;
  createNewVoucher: (type?: VoucherType) => void;
  printVoucher: (voucher?: ReceiptVoucher) => void;
  exportPdfVoucher: (voucher?: ReceiptVoucher) => Promise<void>;
  applyAiData: (parsedData: Partial<ReceiptVoucher>) => void;
  setVouchersList: (vouchers: ReceiptVoucher[]) => void;
}

export interface VouchersContextValue {
  state: VouchersContextState;
  actions: VouchersContextActions;
}

const VouchersContext = createContext<VouchersContextValue | null>(null);

export interface VouchersProviderProps {
  children: React.ReactNode;
  initialVouchers?: ReceiptVoucher[];
  companySettings?: CompanySettings;
  onNavigateTab?: (tab: string) => void;
  onAuditLog?: (
    action: any,
    module: any,
    entityId: string,
    entityName: string,
    descAr: string,
    descEn: string,
    details?: string
  ) => void;
}

export const VouchersProvider: React.FC<VouchersProviderProps> = ({
  children,
  initialVouchers,
  companySettings: companySettingsProp,
  onNavigateTab,
  onAuditLog
}) => {
  const erpData = useERPData();

  const settings = companySettingsProp || erpData?.companySettings || loadCompanySettings();

  // Internal React state for Vouchers context
  const [internalVouchers, setInternalVouchers] = useState<ReceiptVoucher[]>(() => {
    if (initialVouchers) return initialVouchers;
    if (erpData?.vouchersList && erpData.vouchersList.length > 0) {
      return erpData.vouchersList;
    }
    return loadVouchers();
  });

  const [activeVoucher, setActiveVoucher] = useState<ReceiptVoucher>(() => {
    const list = initialVouchers || (erpData?.vouchersList && erpData.vouchersList.length > 0 ? erpData.vouchersList : loadVouchers());
    const curr = settings.defaultCurrency || "OMR";
    const initial = list[0] || createVoucherFactoryState("RECEIPT", list, settings);
    if (!initial.currency || initial.currency === "USD") {
      return {
        ...initial,
        currency: curr,
        amountInWords: initial.isCustomWords ? initial.amountInWords : numberToWords(initial.totalAmount || initial.amount, curr)
      };
    }
    return initial;
  });

  // Sync internal state when external props or erpData change
  useEffect(() => {
    if (initialVouchers) {
      setInternalVouchers(initialVouchers);
    } else if (erpData?.vouchersList && erpData.vouchersList.length > 0) {
      setInternalVouchers(erpData.vouchersList);
    }
  }, [initialVouchers, erpData?.vouchersList]);

  const triggerAuditLog = useCallback(
    (action: any, module: any, entityId: string, entityName: string, descAr: string, descEn: string, details?: string) => {
      if (onAuditLog) {
        onAuditLog(action, module, entityId, entityName, descAr, descEn, details);
      } else {
        logActivity({
          action,
          module,
          entityId,
          entityName,
          descriptionAr: descAr,
          descriptionEn: descEn,
          details,
          performedByName: "النظام"
        });
      }
    },
    [onAuditLog]
  );

  const updateVouchersStateAndStorage = useCallback(
    (updatedList: ReceiptVoucher[]) => {
      setInternalVouchers(updatedList);
      saveVouchers(updatedList);
      if (erpData?.setVouchersList) {
        erpData.setVouchersList(updatedList);
      }
    },
    [erpData]
  );

  const saveActiveVoucher = useCallback(() => {
    setInternalVouchers((prevList) => {
      const existingIndex = prevList.findIndex((v) => v.id === activeVoucher.id);
      const isNew = existingIndex < 0;
      const updatedList = existingIndex >= 0
        ? prevList.map((v) => (v.id === activeVoucher.id ? activeVoucher : v))
        : [activeVoucher, ...prevList];

      saveVouchers(updatedList);
      if (erpData?.setVouchersList) {
        erpData.setVouchersList(updatedList);
      }

      const cId = resolveCompanyId(erpData?.companyId);
      if (isSupabaseConfigured && cId) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          enqueueOfflineMutation({ entityType: "VOUCHER", action: "UPSERT", payload: activeVoucher, companyId: cId });
        } else {
          purchasesSvc.upsertVoucher(activeVoucher, cId).then((res) => {
            if (res.success && res.data) {
              setInternalVouchers((p) => p.map((v) => (v.id === res.data!.id ? res.data! : v)));
            }
          }).catch(console.error);
        }
      }

      triggerAuditLog(
        isNew ? "CREATE" : "UPDATE",
        "VOUCHERS",
        activeVoucher.id,
        activeVoucher.voucherNumber,
        `${isNew ? "إصدار" : "تعديل"} مستند ${activeVoucher.voucherNumber} للعميل ${activeVoucher.receivedFrom} بمبلغ ${activeVoucher.totalAmount?.toLocaleString()} ${activeVoucher.currency}`,
        `${isNew ? "Issued" : "Updated"} document ${activeVoucher.voucherNumber} for ${activeVoucher.receivedFrom} (${activeVoucher.totalAmount?.toLocaleString()} ${activeVoucher.currency})`,
        `${activeVoucher.notes || ""} - طريقة الدفع: ${activeVoucher.paymentMethod}`
      );

      // Auto-sync customer to CRM
      const updatedCusts = syncCustomerFromVoucher(activeVoucher, loadCustomers());
      saveCustomers(updatedCusts);

      if (onNavigateTab) {
        onNavigateTab("preview");
      }

      return updatedList;
    });
  }, [activeVoucher, erpData, triggerAuditLog, onNavigateTab]);

  const deleteVoucher = useCallback(
    (id: string) => {
      setInternalVouchers((prevList) => {
        const target = prevList.find((v) => v.id === id);
        const updated = prevList.filter((v) => v.id !== id);

        saveVouchers(updated);
        if (erpData?.setVouchersList) {
          erpData.setVouchersList(updated);
        }

        const cId = erpData?.companyId || DEFAULT_COMPANY_ID;
        if (isSupabaseConfigured) {
          purchasesSvc.deleteVoucher(id).catch(console.error);
        }

        if (activeVoucher.id === id && updated.length > 0) {
          setActiveVoucher(updated[0]);
        }

        triggerAuditLog(
          "DELETE",
          "VOUCHERS",
          id,
          target?.voucherNumber || id,
          `حذف المستند ${target?.voucherNumber || id} نهائياً من السجلات`,
          `Permanently deleted document ${target?.voucherNumber || id} from history`
        );

        return updated;
      });
    },
    [activeVoucher.id, erpData, triggerAuditLog]
  );

  const deleteMultipleVouchers = useCallback(
    (ids: string[]) => {
      setInternalVouchers((prevList) => {
        const updated = prevList.filter((v) => !ids.includes(v.id));

        saveVouchers(updated);
        if (erpData?.setVouchersList) {
          erpData.setVouchersList(updated);
        }

        if (isSupabaseConfigured) {
          Promise.all(ids.map((id) => purchasesSvc.deleteVoucher(id))).catch(console.error);
        }

        if (ids.includes(activeVoucher.id) && updated.length > 0) {
          setActiveVoucher(updated[0]);
        }

        triggerAuditLog(
          "DELETE",
          "VOUCHERS",
          "batch-delete",
          `حذف جماعي (${ids.length})`,
          `حذف جماعي لعدد (${ids.length}) سندات وفواتير من السجلات`,
          `Batch deleted (${ids.length}) vouchers and records from history`
        );

        return updated;
      });
    },
    [activeVoucher.id, erpData, triggerAuditLog]
  );

  const createNewVoucher = useCallback(
    (type: VoucherType = "RECEIPT") => {
      const newV = createVoucherFactoryState(type, internalVouchers, settings);
      setActiveVoucher(newV);
      if (onNavigateTab) {
        onNavigateTab("editor");
      }
    },
    [internalVouchers, settings, onNavigateTab]
  );

  const duplicateVoucher = useCallback(
    (v: ReceiptVoucher) => {
      const duplicated = createDuplicateVoucherPayload(v);

      setInternalVouchers((prevList) => {
        const updated = [duplicated, ...prevList];
        saveVouchers(updated);
        if (erpData?.setVouchersList) {
          erpData.setVouchersList(updated);
        }
        return updated;
      });

      setActiveVoucher(duplicated);
      if (onNavigateTab) {
        onNavigateTab("editor");
      }

      triggerAuditLog(
        "CREATE",
        "VOUCHERS",
        duplicated.id,
        duplicated.voucherNumber,
        `استنساخ مستند جديد ${duplicated.voucherNumber} من النسخة الأصلية ${v.voucherNumber}`,
        `Duplicated new document ${duplicated.voucherNumber} from original ${v.voucherNumber}`
      );
    },
    [erpData, triggerAuditLog, onNavigateTab]
  );

  const printVoucher = useCallback(
    (targetVoucher?: ReceiptVoucher) => {
      const isValidTarget =
        targetVoucher &&
        typeof targetVoucher === "object" &&
        "voucherNumber" in targetVoucher &&
        !("nativeEvent" in targetVoucher) &&
        !("preventDefault" in targetVoucher);
      const v = isValidTarget ? targetVoucher : activeVoucher;
      if (isValidTarget && targetVoucher) {
        setActiveVoucher(targetVoucher);
      }
      triggerAuditLog(
        "PRINT",
        "VOUCHERS",
        v.id,
        v.voucherNumber,
        `طباعة المستند ${v.voucherNumber} على الطابعة المعتمدة`,
        `Printed document ${v.voucherNumber} on default printer`
      );

      if (onNavigateTab) {
        onNavigateTab("preview");
        setTimeout(() => window.print(), 350);
      } else {
        window.print();
      }
    },
    [activeVoucher, triggerAuditLog, onNavigateTab]
  );

  const exportPdfVoucher = useCallback(
    async (targetVoucher?: ReceiptVoucher) => {
      const isValidTarget =
        targetVoucher &&
        typeof targetVoucher === "object" &&
        "voucherNumber" in targetVoucher &&
        !("nativeEvent" in targetVoucher) &&
        !("preventDefault" in targetVoucher);
      const v = isValidTarget ? targetVoucher : activeVoucher;
      if (isValidTarget && targetVoucher) {
        setActiveVoucher(targetVoucher);
      }
      triggerAuditLog(
        "EXPORT",
        "VOUCHERS",
        v.id,
        v.voucherNumber,
        `تصدير المستند ${v.voucherNumber} إلى ملف PDF`,
        `Exported document ${v.voucherNumber} to PDF`
      );

      if (onNavigateTab) {
        onNavigateTab("preview");
        await new Promise((res) => setTimeout(res, 350));
      }
      const success = await exportToPdf("receipt-voucher-print-area", v.voucherNumber, settings.pageSize);
      if (!success) {
        console.warn("PDF export fallback: opening browser print dialog");
        window.print();
      }
    },
    [activeVoucher, settings.pageSize, triggerAuditLog, onNavigateTab]
  );

  const applyAiData = useCallback(
    (parsedData: Partial<ReceiptVoucher>) => {
      setActiveVoucher((prev) => {
        const lineItems = parsedData.lineItems && parsedData.lineItems.length > 0
          ? parsedData.lineItems.map((item, idx) => ({
              id: `item-${Date.now()}-${idx}`,
              description: item.description || "Service",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 100,
              amount: (item.quantity || 1) * (item.unitPrice || 100)
            }))
          : prev.lineItems;

        const subtotal = lineItems.reduce((acc, i) => acc + i.amount, 0);
        const taxRate = parsedData.taxRate !== undefined ? parsedData.taxRate : prev.taxRate;
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;
        const currency = parsedData.currency || prev.currency;

        return {
          ...prev,
          type: (parsedData.type as VoucherType) || prev.type,
          receivedFrom: parsedData.receivedFrom || prev.receivedFrom,
          paidTo: parsedData.paidTo || prev.paidTo,
          currency: currency,
          paymentMethod: parsedData.paymentMethod || prev.paymentMethod,
          checkNumber: parsedData.checkNumber || prev.checkNumber,
          bankName: parsedData.bankName || prev.bankName,
          transactionRef: parsedData.transactionRef || prev.transactionRef,
          category: parsedData.category || prev.category,
          notes: parsedData.notes || prev.notes,
          lineItems: lineItems,
          subtotal: subtotal,
          taxRate: taxRate,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
          amount: totalAmount,
          amountInWords: prev.isCustomWords ? prev.amountInWords : numberToWords(totalAmount, currency),
          updatedAt: new Date().toISOString()
        };
      });
    },
    []
  );

  const value = useMemo<VouchersContextValue>(
    () => ({
      state: {
        vouchers: internalVouchers,
        activeVoucher
      },
      actions: {
        setActiveVoucher,
        saveActiveVoucher,
        deleteVoucher,
        deleteMultipleVouchers,
        duplicateVoucher,
        createNewVoucher,
        printVoucher,
        exportPdfVoucher,
        applyAiData,
        setVouchersList: updateVouchersStateAndStorage
      }
    }),
    [
      internalVouchers,
      activeVoucher,
      setActiveVoucher,
      saveActiveVoucher,
      deleteVoucher,
      deleteMultipleVouchers,
      duplicateVoucher,
      createNewVoucher,
      printVoucher,
      exportPdfVoucher,
      applyAiData,
      updateVouchersStateAndStorage
    ]
  );

  return <VouchersContext.Provider value={value}>{children}</VouchersContext.Provider>;
};

export function useVouchers(): VouchersContextValue {
  const context = useContext(VouchersContext);
  if (!context) {
    throw new Error("useVouchers must be used within a VouchersProvider");
  }
  return context;
}
