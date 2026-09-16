/**
 * DESHAL ERP — INVENTORY VALUATION & STOCK MOVEMENT DOMAIN UNIT TEST SUITE
 * 
 * Verifies stock status thresholds, Weighted Average Cost (WAC) math,
 * stock movement delta calculations, inventory valuation summaries, and stock transfer rules.
 */

import {
  calculateStockStatus,
  calculateWeightedAverageCost,
  calculateStockMovementDelta,
  calculateInventoryValuationSummary,
  validateStockTransfer
} from "../domain/inventory/inventoryEngine";

import { InventoryItem, StockTransfer } from "../types/inventory";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

function runTests() {
  console.log("================================================================");
  console.log("  DESHAL ERP — INVENTORY VALUATION DOMAIN UNIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: STOCK STATUS EVALUATION ---
  console.log("\n--- TEST 1: STOCK STATUS EVALUATION ---");
  const statusInStock = calculateStockStatus(50, 10);
  assert(statusInStock === "IN_STOCK", "50 items with min alert 10 evaluates to IN_STOCK");

  const statusLowStock = calculateStockStatus(8, 10);
  assert(statusLowStock === "LOW_STOCK", "8 items with min alert 10 evaluates to LOW_STOCK");

  const statusOutOfStock = calculateStockStatus(0, 10);
  assert(statusOutOfStock === "OUT_OF_STOCK", "0 items evaluates to OUT_OF_STOCK");

  // --- TEST 2: WEIGHTED AVERAGE COST (WAC) MATH ---
  console.log("\n--- TEST 2: WEIGHTED AVERAGE COST (WAC) MATH ---");
  // 10 items at 10 OMR + 10 incoming items at 20 OMR = (100 + 200) / 20 = 15.000 OMR
  const wac1 = calculateWeightedAverageCost(10, 10, 10, 20);
  assert(wac1 === 15.000, "Calculates WAC of 15.000 OMR for equal quantities at 10 and 20 OMR");

  // 100 items at 5.000 OMR + 50 items at 8.000 OMR = (500 + 400) / 150 = 6.000 OMR
  const wac2 = calculateWeightedAverageCost(100, 5, 50, 8);
  assert(wac2 === 6.000, "Calculates WAC of 6.000 OMR for 100@5 and 50@8");

  // --- TEST 3: STOCK MOVEMENT DELTA CALCULATIONS ---
  console.log("\n--- TEST 3: STOCK MOVEMENT DELTA CALCULATIONS ---");
  const purchaseIn = calculateStockMovementDelta(20, 10, "PURCHASE_IN");
  assert(purchaseIn.isValid === true && purchaseIn.newQuantity === 30, "PURCHASE_IN increases stock from 20 to 30");

  const saleOut = calculateStockMovementDelta(20, 5, "SALE_OUT");
  assert(saleOut.isValid === true && saleOut.newQuantity === 15, "SALE_OUT decreases stock from 20 to 15");

  const invalidOutflow = calculateStockMovementDelta(5, 10, "SALE_OUT");
  assert(invalidOutflow.isValid === false, "SALE_OUT fails when requesting 10 items from stock of 5");

  // --- TEST 4: INVENTORY VALUATION SUMMARY ---
  console.log("\n--- TEST 4: INVENTORY VALUATION SUMMARY ---");
  const mockInventory: InventoryItem[] = [
    { id: "i1", sku: "CAM-01", name: "Camera 4K", category: "Security", warehouse: "Main", quantity: 10, minAlertQuantity: 2, costPrice: 50, sellingPrice: 80, unit: "pcs", status: "IN_STOCK", createdAt: "", updatedAt: "" },
    { id: "i2", sku: "SCR-02", name: "Smart Screen", category: "Displays", warehouse: "Main", quantity: 3, minAlertQuantity: 5, costPrice: 100, sellingPrice: 150, unit: "pcs", status: "LOW_STOCK", createdAt: "", updatedAt: "" },
    { id: "i3", sku: "CBL-03", name: "CAT6 Cable", category: "Network", warehouse: "Main", quantity: 0, minAlertQuantity: 10, costPrice: 5, sellingPrice: 10, unit: "pcs", status: "OUT_OF_STOCK", createdAt: "", updatedAt: "" }
  ];

  const summary = calculateInventoryValuationSummary(mockInventory);
  assert(summary.totalItemsCount === 3, "Counts 3 inventory items");
  assert(summary.totalPhysicalQuantity === 13, "Sums 13 physical items in stock (10 + 3 + 0)");
  assert(summary.totalCostValuation === 800, "Calculates total cost valuation of 800 OMR (10*50 + 3*100 = 800)");
  assert(summary.totalSellingValuation === 1250, "Calculates total selling valuation of 1250 OMR (10*80 + 3*150 = 1250)");
  assert(summary.potentialProfitMargin === 450, "Calculates potential profit margin of 450 OMR (1250 - 800)");
  assert(summary.lowStockCount === 1, "Counts 1 low stock item");
  assert(summary.outOfStockCount === 1, "Counts 1 out of stock item");

  // --- TEST 5: STOCK TRANSFER VALIDATION ---
  console.log("\n--- TEST 5: STOCK TRANSFER VALIDATION ---");
  const validTransfer: StockTransfer = {
    id: "tr-1",
    transferNumber: "TR-001",
    date: "2026-01-15",
    fromBranchId: "b1",
    fromBranchName: "Muscat",
    fromWarehouse: "W1",
    toBranchId: "b2",
    toBranchName: "Sohar",
    toWarehouse: "W2",
    items: [{ itemId: "i1", sku: "CAM-01", name: "Camera 4K", quantity: 5 }],
    status: "COMPLETED",
    createdAt: "",
    updatedAt: ""
  };

  const validRes = validateStockTransfer(validTransfer, mockInventory);
  assert(validRes.isValid === true, "Valid transfer of 5 Camera 4K (stock=10) passes validation");

  const invalidTransfer: StockTransfer = {
    ...validTransfer,
    items: [{ itemId: "i1", sku: "CAM-01", name: "Camera 4K", quantity: 15 }]
  };
  const invalidRes = validateStockTransfer(invalidTransfer, mockInventory);
  assert(invalidRes.isValid === false, "Fails transfer when requesting 15 items from stock of 10");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
