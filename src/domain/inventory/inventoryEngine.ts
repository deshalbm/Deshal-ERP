/**
 * DESHAL ERP — INVENTORY VALUATION & STOCK MOVEMENT DOMAIN ENGINE
 * 
 * Pure domain rules for stock status evaluation (IN_STOCK, LOW_STOCK, OUT_OF_STOCK),
 * Weighted Average Cost (WAC) valuation math, stock movement delta validation,
 * inventory asset valuation analytics, and inter-branch transfer verification.
 */

import {
  InventoryItem,
  StockStatus,
  MovementType,
  StockTransfer
} from "../../types/inventory";

export interface InventoryValuationSummary {
  totalItemsCount: number;
  totalPhysicalQuantity: number;
  totalCostValuation: number;
  totalSellingValuation: number;
  potentialProfitMargin: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockMovementDeltaResult {
  newQuantity: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Determine stock status based on current quantity vs minimum alert threshold
 */
export function calculateStockStatus(quantity: number, minAlertQuantity: number): StockStatus {
  const qty = typeof quantity === "number" && !isNaN(quantity) ? quantity : 0;
  const minQty = typeof minAlertQuantity === "number" && !isNaN(minAlertQuantity) ? minAlertQuantity : 0;

  if (qty <= 0) return "OUT_OF_STOCK";
  if (qty <= minQty) return "LOW_STOCK";
  return "IN_STOCK";
}

/**
 * Calculate Weighted Average Cost (WAC) per unit upon receiving new inventory
 * Formula: ((Current Qty * Current Cost) + (Incoming Qty * Incoming Cost)) / (Current Qty + Incoming Qty)
 */
export function calculateWeightedAverageCost(
  currentQty: number,
  currentCost: number,
  incomingQty: number,
  incomingCost: number
): number {
  const cQty = Math.max(0, isNaN(currentQty) ? 0 : currentQty);
  const cCost = Math.max(0, isNaN(currentCost) ? 0 : currentCost);
  const iQty = Math.max(0, isNaN(incomingQty) ? 0 : incomingQty);
  const iCost = Math.max(0, isNaN(incomingCost) ? 0 : incomingCost);

  const totalQty = cQty + iQty;
  if (totalQty <= 0) return cCost;

  const totalValue = (cQty * cCost) + (iQty * iCost);
  const wac = totalValue / totalQty;
  return Number(wac.toFixed(3));
}

/**
 * Calculate resulting stock quantity from a stock movement operation
 */
export function calculateStockMovementDelta(
  currentQty: number,
  movementQty: number,
  type: MovementType
): StockMovementDeltaResult {
  const cQty = isNaN(currentQty) ? 0 : currentQty;
  const mQty = Math.abs(isNaN(movementQty) ? 0 : movementQty);

  if (mQty <= 0) {
    return { newQuantity: cQty, isValid: false, errorMessage: "كمية الحركة يجب أن تكون أكبر من صفر." };
  }

  const isInflow = type === "PURCHASE_IN" || type === "TRANSFER_IN" || type === "ADJUSTMENT_IN" || type === "RETURN_IN";
  const isOutflow = type === "SALE_OUT" || type === "TRANSFER_OUT" || type === "ADJUSTMENT_OUT" || type === "DAMAGE_OUT";

  if (isOutflow && cQty < mQty) {
    return {
      newQuantity: cQty,
      isValid: false,
      errorMessage: `الكمية المتوفرة بالمخزن (${cQty}) غير كافية لإجراء حركة الصرف (${mQty}).`
    };
  }

  const newQty = isInflow ? cQty + mQty : isOutflow ? cQty - mQty : cQty;
  return { newQuantity: newQty, isValid: true };
}

/**
 * Calculate total inventory valuation, potential profit margins, and stock alerts
 */
export function calculateInventoryValuationSummary(items: InventoryItem[]): InventoryValuationSummary {
  let totalItemsCount = 0;
  let totalPhysicalQuantity = 0;
  let totalCostValuation = 0;
  let totalSellingValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  if (Array.isArray(items)) {
    items.forEach((item) => {
      totalItemsCount++;
      const qty = item.quantity || 0;
      const cost = item.costPrice || 0;
      const sell = item.sellingPrice || 0;

      totalPhysicalQuantity += qty;
      totalCostValuation += qty * cost;
      totalSellingValuation += qty * sell;

      const status = calculateStockStatus(qty, item.minAlertQuantity || 0);
      if (status === "LOW_STOCK") lowStockCount++;
      if (status === "OUT_OF_STOCK") outOfStockCount++;
    });
  }

  const potentialProfitMargin = Number((totalSellingValuation - totalCostValuation).toFixed(3));

  return {
    totalItemsCount,
    totalPhysicalQuantity,
    totalCostValuation: Number(totalCostValuation.toFixed(3)),
    totalSellingValuation: Number(totalSellingValuation.toFixed(3)),
    potentialProfitMargin,
    lowStockCount,
    outOfStockCount
  };
}

/**
 * Validates a stock transfer request between warehouses
 */
export function validateStockTransfer(
  transfer: StockTransfer,
  sourceInventory: InventoryItem[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!transfer) {
    return { isValid: false, errors: ["طلب التحويل غير موجود."] };
  }

  if (transfer.fromBranchId && transfer.toBranchId && transfer.fromBranchId === transfer.toBranchId && transfer.fromWarehouse === transfer.toWarehouse) {
    errors.push("لا يمكن التحويل لنفس المستودع والفرع.");
  }

  if (!Array.isArray(transfer.items) || transfer.items.length === 0) {
    errors.push("يجب إدراج صنف واحد على الأقل في طلب التحويل.");
  } else {
    transfer.items.forEach((tItem) => {
      const sourceItem = sourceInventory.find((inv) => inv.id === tItem.itemId || inv.sku === tItem.sku);
      if (!sourceItem) {
        errors.push(`الصنف (${tItem.name}) غير متوفر بجدول مخزون الفرع المصدر.`);
      } else if (sourceItem.quantity < tItem.quantity) {
        errors.push(`الكمية المتوفرة للصنف (${sourceItem.name}) هي (${sourceItem.quantity}) وهي أقل من الكمية المطلوبة للتحويل (${tItem.quantity}).`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}
