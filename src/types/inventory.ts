export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: string;
  sku: string; // Unique SKU (e.g. CAM-4K-01)
  barcode?: string; // Barcode number
  name: string; // Product / Item Name
  category: string; // Category e.g. كاميرات مراقبة، شبكات، شاشات
  warehouse: string; // Warehouse name e.g. المستودع الرئيسي - صحار
  branchId?: string; // Linked Branch
  branchName?: string;
  location?: string; // Shelf / Bin e.g. الرف A-4
  unit: string; // Unit e.g. حبة، متر، رول، طقم، كرتون
  quantity: number; // Current stock count
  minAlertQuantity: number; // Min threshold for low stock alert
  costPrice: number; // Purchase / Cost price
  sellingPrice: number; // Suggested selling price
  supplierName?: string; // Default supplier
  description?: string;
  imageUrl?: string;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'PURCHASE_IN' // وارد من فاتورة شراء
  | 'SALE_OUT' // منصرف لمبيعات / مشروع
  | 'TRANSFER_IN' // وارد من تحويل بين الفروع
  | 'TRANSFER_OUT' // منصرف لتحويل بين الفروع
  | 'ADJUSTMENT_IN' // تسوية جرد (زيادة)
  | 'ADJUSTMENT_OUT' // تسوية جرد (نقص)
  | 'RETURN_IN' // مرتجع من عميل
  | 'DAMAGE_OUT'; // تالف أو مستهلك

export interface StockMovement {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: MovementType;
  quantity: number; // Quantity of movement (positive)
  previousQuantity: number;
  newQuantity: number;
  referenceNo?: string; // Invoice / Voucher # or Adjustment ID
  warehouse: string;
  branchId?: string;
  branchName?: string;
  date: string;
  notes?: string;
  createdByName?: string;
}

export interface StockTransferItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string; // e.g. TR-2026-0001
  date: string;
  fromBranchId: string;
  fromBranchName: string;
  fromWarehouse: string;
  toBranchId: string;
  toBranchName: string;
  toWarehouse: string;
  items: StockTransferItem[];
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  notes?: string;
  transferByName?: string;
  receivedByName?: string;
  createdAt: string;
  updatedAt: string;
}
