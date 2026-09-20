import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import {
  InventoryItem,
  PurchaseInvoice,
  Supplier,
  StockMovement,
  StockTransfer
} from "../types";
import {
  loadInventory,
  saveInventory,
  loadPurchases,
  savePurchases,
  loadSuppliers,
  saveSuppliers,
  loadStockMovements,
  saveStockMovements,
  loadStockTransfers,
  saveStockTransfers
} from "../utils/storage";
import { useERPData } from "./ERPDataContext";
import * as inventorySvc from "../lib/supabase/inventoryService";
import * as purchasesSvc from "../lib/supabase/purchasesService";
import * as supplierSvc from "../lib/supabase/supplierService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { logActivity } from "../utils/auditLogger";
import { resolveCompanyId } from "../utils/uuid";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export interface InventoryContextState {
  inventory: InventoryItem[];
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  stockTransfers: StockTransfer[];
}

export interface InventoryContextActions {
  saveInventory: (items: InventoryItem[]) => void;
  savePurchases: (purchases: PurchaseInvoice[]) => void;
  saveSuppliers: (suppliers: Supplier[]) => void;
  saveStockMovements: (movements: StockMovement[]) => void;
  saveStockTransfers: (transfers: StockTransfer[]) => void;
  setInventoryList: (items: InventoryItem[]) => void;
  setPurchasesList: (purchases: PurchaseInvoice[]) => void;
  setSuppliersList: (suppliers: Supplier[]) => void;
}

export interface InventoryContextValue {
  state: InventoryContextState;
  actions: InventoryContextActions;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export interface InventoryProviderProps {
  children: React.ReactNode;
  initialInventory?: InventoryItem[];
  initialPurchases?: PurchaseInvoice[];
  initialSuppliers?: Supplier[];
  initialMovements?: StockMovement[];
  initialTransfers?: StockTransfer[];
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

export const InventoryProvider: React.FC<InventoryProviderProps> = ({
  children,
  initialInventory,
  initialPurchases,
  initialSuppliers,
  initialMovements,
  initialTransfers,
  onAuditLog
}) => {
  const erpData = useERPData();

  const [internalInventory, setInternalInventory] = useState<InventoryItem[]>(() => {
    if (initialInventory) return initialInventory;
    if (erpData?.inventoryList && erpData.inventoryList.length > 0) {
      return erpData.inventoryList;
    }
    return loadInventory();
  });

  const [internalPurchases, setInternalPurchases] = useState<PurchaseInvoice[]>(() => {
    if (initialPurchases) return initialPurchases;
    if (erpData?.purchasesList && erpData.purchasesList.length > 0) {
      return erpData.purchasesList;
    }
    return loadPurchases();
  });

  const [internalSuppliers, setInternalSuppliers] = useState<Supplier[]>(() => {
    if (initialSuppliers) return initialSuppliers;
    if (erpData?.suppliersList && erpData.suppliersList.length > 0) {
      return erpData.suppliersList;
    }
    return loadSuppliers();
  });

  const [internalMovements, setInternalMovements] = useState<StockMovement[]>(() => {
    if (initialMovements) return initialMovements;
    if (erpData?.stockMovementsList && erpData.stockMovementsList.length > 0) {
      return erpData.stockMovementsList;
    }
    return loadStockMovements();
  });

  const [internalTransfers, setInternalTransfers] = useState<StockTransfer[]>(() => {
    if (initialTransfers) return initialTransfers;
    if (erpData?.stockTransfersList && erpData.stockTransfersList.length > 0) {
      return erpData.stockTransfersList;
    }
    return loadStockTransfers();
  });

  // Sync with ERPData if provided
  useEffect(() => {
    if (initialInventory) {
      setInternalInventory(initialInventory);
    } else if (erpData?.inventoryList && erpData.inventoryList.length > 0) {
      setInternalInventory(erpData.inventoryList);
    }
  }, [initialInventory, erpData?.inventoryList]);

  useEffect(() => {
    if (initialPurchases) {
      setInternalPurchases(initialPurchases);
    } else if (erpData?.purchasesList && erpData.purchasesList.length > 0) {
      setInternalPurchases(erpData.purchasesList);
    }
  }, [initialPurchases, erpData?.purchasesList]);

  useEffect(() => {
    if (initialSuppliers) {
      setInternalSuppliers(initialSuppliers);
    } else if (erpData?.suppliersList && erpData.suppliersList.length > 0) {
      setInternalSuppliers(erpData.suppliersList);
    }
  }, [initialSuppliers, erpData?.suppliersList]);

  useEffect(() => {
    if (initialMovements) {
      setInternalMovements(initialMovements);
    } else if (erpData?.stockMovementsList && erpData.stockMovementsList.length > 0) {
      setInternalMovements(erpData.stockMovementsList);
    }
  }, [initialMovements, erpData?.stockMovementsList]);

  useEffect(() => {
    if (initialTransfers) {
      setInternalTransfers(initialTransfers);
    } else if (erpData?.stockTransfersList && erpData.stockTransfersList.length > 0) {
      setInternalTransfers(erpData.stockTransfersList);
    }
  }, [initialTransfers, erpData?.stockTransfersList]);

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

  const handleSaveInventory = useCallback(
    (items: InventoryItem[]) => {
      setInternalInventory(items);
      saveInventory(items);
      if (erpData?.setInventoryList) {
        erpData.setInventoryList(items);
      }
      const cId = resolveCompanyId(erpData?.companyId);
      if (isSupabaseConfigured && cId) {
        Promise.all(items.map((item) => inventorySvc.upsertInventoryItem(item, cId))).catch(console.error);
      }
      triggerAuditLog(
        "UPDATE",
        "INVENTORY",
        "inventory-items",
        "سجل المخزون",
        `تحديث كميات وقيم مستودع الأصناف (${items.length} صنف)`,
        `Updated inventory items and stock levels (${items.length} items)`
      );
    },
    [erpData, triggerAuditLog]
  );

  const handleSavePurchases = useCallback(
    (purchases: PurchaseInvoice[]) => {
      setInternalPurchases(purchases);
      savePurchases(purchases);
      if (erpData?.setPurchasesList) {
        erpData.setPurchasesList(purchases);
      }
      const cId = resolveCompanyId(erpData?.companyId);
      if (isSupabaseConfigured && cId) {
        Promise.all(purchases.map((p) => purchasesSvc.upsertPurchaseInvoice(p, cId))).catch(console.error);
      }
      triggerAuditLog(
        "UPDATE",
        "PURCHASES",
        "purchase-invoices",
        "فواتير المشتريات",
        `تحديث سجل فواتير المشتريات وأوامر الشراء (${purchases.length} فاتورة)`,
        `Updated purchase invoices records (${purchases.length} invoices)`
      );
    },
    [erpData, triggerAuditLog]
  );

  const handleSaveSuppliers = useCallback(
    (suppliers: Supplier[]) => {
      setInternalSuppliers(suppliers);
      saveSuppliers(suppliers);
      if (erpData?.setSuppliersList) {
        erpData.setSuppliersList(suppliers);
      }
      const cId = resolveCompanyId(erpData?.companyId);
      if (isSupabaseConfigured && cId) {
        Promise.all(suppliers.map((s) => supplierSvc.upsertSupplier(s, cId))).catch(console.error);
      }
    },
    [erpData]
  );

  const handleSaveStockMovements = useCallback(
    (movements: StockMovement[]) => {
      setInternalMovements(movements);
      saveStockMovements(movements);
      if (erpData?.setStockMovementsList) {
        erpData.setStockMovementsList(movements);
      }
    },
    [erpData]
  );

  const handleSaveStockTransfers = useCallback(
    (transfers: StockTransfer[]) => {
      setInternalTransfers(transfers);
      saveStockTransfers(transfers);
      if (erpData?.setStockTransfersList) {
        erpData.setStockTransfersList(transfers);
      }
      triggerAuditLog(
        "TRANSFER",
        "INVENTORY",
        "transfers-list",
        "مناقلات المخزون",
        `تسجيل مناقلة مخزنية جديدة بين الفروع`,
        `Recorded inter-branch stock dispatch & transfer`
      );
    },
    [erpData, triggerAuditLog]
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      state: {
        inventory: internalInventory,
        purchases: internalPurchases,
        suppliers: internalSuppliers,
        stockMovements: internalMovements,
        stockTransfers: internalTransfers
      },
      actions: {
        saveInventory: handleSaveInventory,
        savePurchases: handleSavePurchases,
        saveSuppliers: handleSaveSuppliers,
        saveStockMovements: handleSaveStockMovements,
        saveStockTransfers: handleSaveStockTransfers,
        setInventoryList: handleSaveInventory,
        setPurchasesList: handleSavePurchases,
        setSuppliersList: handleSaveSuppliers
      }
    }),
    [
      internalInventory,
      internalPurchases,
      internalSuppliers,
      internalMovements,
      internalTransfers,
      handleSaveInventory,
      handleSavePurchases,
      handleSaveSuppliers,
      handleSaveStockMovements,
      handleSaveStockTransfers
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
