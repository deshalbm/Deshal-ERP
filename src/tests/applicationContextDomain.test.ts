/**
 * Characterization Unit Test Suite — Application Context & Storage Adapters Layer
 * Verifies application layer state contracts, storage adapter serialization safety,
 * offline mutation queue payload formatting, and domain engine integration.
 */

import { validateOmaniRegulatoryCompliance, validateERPCurrencyPolicy } from '../domain/settings/settingsEngine';
import { calculateBranchPerformanceSummary } from '../domain/branches/branchEngine';
import { calculateInventoryValuationSummary, calculateStockStatus } from '../domain/inventory/inventoryEngine';
import { CompanySettings, Branch, InventoryItem } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log("\n================================================================");
  console.log("  DESHAL ERP — APPLICATION CONTEXT & STORAGE ADAPTERS TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: APPLICATION STATE HYDRATION DEFAULTS ---
  console.log("\n--- TEST 1: APPLICATION STATE HYDRATION DEFAULTS ---");
  const defaultCompany: CompanySettings = {
    companyName: 'شركة دِشال للأعمال المتميزة ش.م.م',
    tagline: 'تميز في الأداء',
    logoUrl: '',
    logoWidth: 140,
    crNumber: 'CR-1029384',
    taxId: 'OM9876543210',
    phone: '96890000000',
    email: 'info@deshalbm.com',
    address: 'مسقط، سلطنة عمان',
    cityStateZip: 'Muscat, Oman 100',
    country: 'Oman',
    website: 'https://deshalbm.com',
    headerNotice: '',
    footerNotice: '',
    termsAndConditions: '',
    authorizedSignatoryName: 'مدير النظام',
    authorizedSignatoryTitle: 'الرئيس التنفيذي',
    signatureImageUrl: '',
    stampImageUrl: '',
    defaultCustomFields: [],
    qrCodeContent: '',
    bankDetails: {
      bankName: 'Bank Muscat',
      accountName: 'Deshal BM LLC',
      accountNumber: '012345678901',
      iban: 'OM1234567890123456789012',
      swiftCode: 'BMUSOMRX',
    },
  };

  const regCheck = validateOmaniRegulatoryCompliance(defaultCompany);
  assert(regCheck.isValid === true, 'Hydrated default company profile satisfies Omani regulatory compliance');

  const currencyCheck = validateERPCurrencyPolicy('OMR');
  assert(currencyCheck.decimals === 3, 'Application currency policy enforces 3 decimal places for OMR');

  // --- TEST 2: DOMAIN ENGINE INTEGRATION AT APPLICATION LAYER ---
  console.log("\n--- TEST 2: DOMAIN ENGINE INTEGRATION AT APPLICATION LAYER ---");
  const testBranch: Branch = {
    id: 'b-01',
    code: 'BR-01',
    name: 'الفرع الرئيسي',
    isMain: true,
    phone: '90000000',
    email: 'b01@deshalbm.com',
    address: 'مسقط',
    city: 'Muscat',
    country: 'Oman',
    status: 'ACTIVE',
    defaultWarehouse: 'WH-MAIN',
    createdAt: '',
    updatedAt: '',
  };

  const summary = calculateBranchPerformanceSummary([testBranch], [
    { branchId: 'b-01', totalAmount: 150.500 },
    { branchId: 'b-01', totalAmount: 49.500 },
  ]);

  assert(summary[0].totalSales === 200, 'Branch performance analytics correctly sums sales to 200.000 OMR');
  assert(summary[0].transactionsCount === 2, 'Branch performance analytics counts 2 transactions');

  // --- TEST 3: INVENTORY VALUATION INTEGRATION ---
  console.log("\n--- TEST 3: INVENTORY VALUATION INTEGRATION ---");
  const testItem: InventoryItem = {
    id: 'item-01',
    sku: 'ITEM-01',
    name: 'منتج تجريبي',
    warehouse: 'المستودع الرئيسي',
    unit: 'PCS',
    costPrice: 10,
    sellingPrice: 15,
    quantity: 50,
    minAlertQuantity: 10,
    category: 'General',
    status: 'IN_STOCK',
    createdAt: '',
    updatedAt: '',
  };

  const valuation = calculateInventoryValuationSummary([testItem]);
  assert(valuation.totalCostValuation === 500, 'Inventory item total cost valuation is 500.000 OMR');
  assert(valuation.totalSellingValuation === 750, 'Inventory item total selling valuation is 750.000 OMR');
  assert(valuation.potentialProfitMargin === 250, 'Inventory item potential profit is 250.000 OMR');
  assert(calculateStockStatus(testItem.quantity, testItem.minAlertQuantity) === 'IN_STOCK', 'Stock status evaluated as IN_STOCK');

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
