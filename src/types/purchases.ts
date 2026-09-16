import { PaymentMethod } from './common';

export type PurchaseStatus = 'RECEIVED' | 'ORDERED' | 'DRAFT' | 'CANCELLED';
export type PurchasePaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface PurchaseItem {
  id: string;
  itemId?: string; // Linked Inventory Item
  sku?: string;
  name: string;
  quantity: number;
  unitCost: number;
  amount: number;
  unit?: string;
}

export interface PurchaseInvoice {
  id: string;
  purchaseNumber: string; // e.g. PO-2026-0001
  supplierInvoiceNo?: string; // Supplier's original invoice #
  supplierId?: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierTaxId?: string;
  supplierAddress?: string;
  branchId?: string; // Linked Branch
  branchName?: string;
  date: string;
  dueDate?: string;
  warehouse: string; // Receiving warehouse
  items: PurchaseItem[];
  subtotal: number;
  taxRate: number; // VAT percentage
  taxAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PurchasePaymentStatus;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  notes?: string;
  autoUpdateStock: boolean; // Auto increment warehouse inventory
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  taxId?: string;
  crNumber?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
