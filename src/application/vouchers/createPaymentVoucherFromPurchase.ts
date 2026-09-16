import { PurchaseInvoice, ReceiptVoucher, CompanySettings } from "../../types";
import { createNewVoucherState as createVoucherFactoryState } from "../../domain/vouchers/voucherFactory";
import { numberToWords } from "../../domain/finance/numberToWords";

export interface CreatePaymentVoucherOptions {
  existingVouchers?: ReceiptVoucher[];
  companySettings?: CompanySettings;
  onSaveVouchers?: (vouchers: ReceiptVoucher[]) => void;
  nowMs?: number;
}

/**
 * Application service for converting a PurchaseInvoice into a payment ReceiptVoucher
 */
export function createPaymentVoucherFromPurchase(
  purchase: PurchaseInvoice,
  options?: CreatePaymentVoucherOptions
): ReceiptVoucher {
  const list = options?.existingVouchers || [];
  const settings = options?.companySettings || ({ defaultCurrency: "OMR" } as CompanySettings);
  const nowMs = options?.nowMs || Date.now();
  const newV = createVoucherFactoryState("PAYMENT", list, settings, nowMs);
  const invoiceLabel = purchase.purchaseNumber || purchase.supplierInvoiceNo || "";
  const currency = purchase.currency || settings.defaultCurrency || "OMR";
  const voucher: ReceiptVoucher = {
    ...newV,
    receivedFrom: purchase.supplierName,
    amount: purchase.totalAmount,
    totalAmount: purchase.totalAmount,
    subtotal: purchase.subtotal,
    taxAmount: purchase.taxAmount,
    taxRate: purchase.taxRate,
    currency: currency,
    amountInWords: numberToWords(purchase.totalAmount, currency),
    notes: `سداد فاتورة مشتريات وتوريد رقم #${invoiceLabel} - المورد: ${purchase.supplierName}`,
    category: "مشتريات وتوريدات",
    lineItems: purchase.items.map((pi, idx) => ({
      id: `li-purch-${idx}`,
      description: `${pi.name} (${pi.quantity} ${pi.unit || "قطعة"})`,
      quantity: pi.quantity,
      unitPrice: pi.unitCost,
      amount: pi.amount
    })),
    updatedAt: new Date(nowMs).toISOString()
  };

  if (options?.onSaveVouchers) {
    options.onSaveVouchers([voucher, ...list]);
  }

  return voucher;
}
