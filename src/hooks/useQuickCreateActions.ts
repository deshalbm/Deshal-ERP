import { useCallback } from "react";
import { PurchaseInvoice } from "../types";
import { useUIShell } from "../contexts/UIShellContext";
import { resolveQuickCreateTab } from "../application/navigation/resolveQuickCreateTab";
import { createPaymentVoucherFromPurchase } from "../application/vouchers/createPaymentVoucherFromPurchase";

/**
 * Custom React Hook connecting UI actions to quick create routing
 * and purchase-to-payment voucher conversion services.
 * 
 * Extracted from App.tsx in Phase 32. Preserves 100% of existing behavior.
 */
export function useQuickCreateActions() {
  const { actions: uiActions } = useUIShell();

  const handleCreateNewVoucher = useCallback(() => {
    uiActions.setActiveTab("editor");
  }, [uiActions]);

  const handleQuickCreateAction = useCallback(
    (actionId: string) => {
      const targetTab = resolveQuickCreateTab(actionId);
      if (targetTab === "editor") {
        uiActions.setActiveTab("editor");
      } else {
        uiActions.navigateWithHistory(targetTab as any);
      }
    },
    [uiActions]
  );

  const handleCreatePaymentVoucherFromPurchase = useCallback(
    (purchase: PurchaseInvoice) => {
      createPaymentVoucherFromPurchase(purchase);
      uiActions.setActiveTab("editor");
    },
    [uiActions]
  );

  return {
    handleCreateNewVoucher,
    handleQuickCreateAction,
    handleCreatePaymentVoucherFromPurchase,
  };
}
