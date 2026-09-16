import { PaymentMethod } from './common';

export type POSPaymentMethod = 'CASH' | 'CARD' | 'SPLIT' | 'CREDIT' | 'BANK_TRANSFER' | 'ONLINE';
export type POSOrderStatus = 'COMPLETED' | 'HELD' | 'REFUNDED' | 'CANCELLED';

export interface POSOrderItem {
  id: string;
  itemId?: string;
  sku?: string;
  barcode?: string;
  name: string;
  nameEn?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discount: number; // Discount per item or line
  taxRate: number; // e.g. 5%
  taxAmount: number;
  total: number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  warehouse?: string;
  notes?: string;
}

export interface POSPaymentSplit {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface POSOrder {
  id: string;
  orderNumber: string; // e.g. "POS-2026-0001"
  voucherId?: string; // Linked ReceiptVoucher
  voucherNumber?: string; // e.g. "INV-2026-0850"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  branchId: string;
  branchName: string;
  warehouse: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerTaxId?: string;
  items: POSOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: POSPaymentMethod;
  splitPayments?: POSPaymentSplit[];
  cashReceived: number;
  changeDue: number;
  status: POSOrderStatus;
  shiftId?: string;
  notes?: string;
  isRefunded?: boolean;
  refundedOrderId?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POSHeldCart {
  id: string;
  cartNumber: number;
  label: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: POSOrderItem[];
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  notes?: string;
  heldAt: string;
  branchId?: string;
}

export interface CashMovement {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  reason: string;
  time: string;
  performedByName: string;
}

export interface CashierShift {
  id: string;
  shiftNumber: string; // e.g. "SH-2026-001"
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  totalSalesCash: number;
  totalSalesCard: number;
  totalSalesCredit: number;
  totalSalesOnline: number;
  totalSalesBank: number;
  totalReturns: number;
  totalDiscounts: number;
  totalTax: number;
  totalNetSales: number;
  ordersCount: number;
  cashMovements: CashMovement[];
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}
