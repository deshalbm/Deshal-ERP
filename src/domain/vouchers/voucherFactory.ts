import { ReceiptVoucher, VoucherType, CompanySettings } from "../../types";
import { numberToWords } from "../finance/numberToWords";

/**
 * Pure Business Logic: Factory for generating ReceiptVouchers, Tax Invoices, Quotations, Payments, and Petty Cash documents.
 * Auto-increments sequence numbering based on existing voucher history, computes 5% VAT tax, and translates amounts to words.
 */
export function createNewVoucherState(
  type: VoucherType = "RECEIPT",
  vouchersList: ReceiptVoucher[] = [],
  companySettings: Partial<CompanySettings> = {},
  nowMs: number = Date.now(),
  randomEntropy?: number
): ReceiptVoucher {
  const entropy = randomEntropy !== undefined ? randomEntropy : (nowMs % 1000) / 1000;
  const year = new Date(nowMs).getFullYear();
  let maxSeq = 801;
  if (vouchersList && vouchersList.length > 0) {
    vouchersList.forEach((v) => {
      const match = v.voucherNumber?.match(/(?:RV|INV|QT|PV|PC)-\d+-(\d+)/i);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxSeq) {
          maxSeq = val;
        }
      }
    });
  }
  const nextSeq = (maxSeq + 1).toString().padStart(4, "0");
  const prefix =
    type === "RECEIPT"
      ? "RV"
      : type === "TAX_INVOICE"
      ? "INV"
      : type === "QUOTATION"
      ? "QT"
      : type === "PAYMENT"
      ? "PV"
      : "PC";

  const voucherNum = `${prefix}-${year}-${nextSeq}`;
  const randRef = Math.floor(4428 + randomEntropy * 100);
  const initialSubtotal = 250.0;
  const taxRate = type === "TAX_INVOICE" || type === "QUOTATION" ? 5 : 0;
  const taxAmount = (initialSubtotal * taxRate) / 100;
  const totalAmount = initialSubtotal + taxAmount;
  const curr = companySettings.defaultCurrency || "OMR";

  const descriptions: Record<VoucherType, string> = {
    RECEIPT: "دفعة عن تركيب الكاميرات وشاشات المراقبة والشاشات التفاعلية الذكية في مركز الدليل الشامل",
    TAX_INVOICE: "توريد وتركيب أجهزة تقنية وحلول برمجية ذكية مع الضريبة المضافة (5%)",
    QUOTATION: "عرض سعر لتوريد وتجهيز أنظمة مراقبة وشبكات ذكية متكاملة",
    PAYMENT: "سداد دفعة مستحقة لمؤسسة التوريدات عن قطع غيار وأجهزة شبكات",
    PETTY_CASH: "مصروفات نثرية وضيافة وااحتياجات مكتبية دورية"
  };

  const notesMap: Record<VoucherType, string> = {
    RECEIPT: "تم استلام المبلغ لحساب شركة ديشال لإدارة الأعمال والحلول التقنية.",
    TAX_INVOICE: "فاتورة ضريبية رسمية خاضعة لضريبة القيمة المضافة (5% VAT) ومعتمدة إلكترونياً.",
    QUOTATION: "عرض سعر رسمي موجه للعميل. يسري هذا العرض لمدة 15 يوماً من تاريخ الإصدار.",
    PAYMENT: "سند صرف وتسجيل دفعة مالية للمورد / المصروفات التشغيلية.",
    PETTY_CASH: "سند صرف عهدة نقدية للمصروفات الدورية المعتمدة."
  };

  const categoriesMap: Record<VoucherType, string> = {
    RECEIPT: "خدمات تقنية وإيرادات",
    TAX_INVOICE: "مبيعات وخدمات ضريبية",
    QUOTATION: "عروض أسعار وصفقات",
    PAYMENT: "مصروفات تشغيلية وموردين",
    PETTY_CASH: "مصروفات نثرية وإدارية"
  };

  const clientName =
    type === "PAYMENT"
      ? "مؤسسة التوريدات والخدمات العامة"
      : type === "QUOTATION"
      ? "شركة العميل الموقر"
      : "شركة الدليل الشامل";

  return {
    id: "doc-" + nowMs,
    type: type,
    voucherNumber: voucherNum,
    referenceNo: `${prefix}-REF-${randRef}`,
    date: new Date(nowMs).toISOString().split("T")[0],
    dueDate:
      type === "QUOTATION" || type === "TAX_INVOICE"
        ? new Date(nowMs + 15 * 86400000).toISOString().split("T")[0]
        : undefined,
    receivedFrom: clientName,
    payerEmail: "info@deshalbm.com",
    payerPhone: "+968 77627500",
    payerAddress: "Maden Building - Sohar- North ALBatinah - Sultanate of Oman",
    payerTaxId: "OM-TAX-7762",
    amount: totalAmount,
    currency: curr,
    amountInWords: numberToWords(totalAmount, curr),
    isCustomWords: false,
    paymentMethod: type === "QUOTATION" ? "BANK_TRANSFER" : "BANK_TRANSFER",
    bankName: "بنك ظفار (Bank Dhofar)",
    transactionRef: `TXN-${randRef}`,
    category: categoriesMap[type],
    lineItems: [
      {
        id: "li-1",
        description: descriptions[type],
        quantity: 1,
        unitPrice: initialSubtotal,
        amount: initialSubtotal
      }
    ],
    subtotal: initialSubtotal,
    taxRate: taxRate,
    taxAmount: taxAmount,
    discountAmount: 0,
    totalAmount: totalAmount,
    notes: notesMap[type],
    terms: companySettings.termsAndConditions || "يعتبر هذا المستند إشعاراً رسمياً معتمداً.",
    customFields: [{ id: "cf-1", label: "الموقع", value: "مركز الدليل الشامل - صحار" }],
    status: type === "QUOTATION" ? "DRAFT" : "PAID",
    preparedBy: "قسم الحسابات",
    approvedBy: companySettings.authorizedSignatoryName || "إدارة ديشال للأعمال",
    receivedBy: clientName,
    createdAt: new Date(nowMs).toISOString(),
    updatedAt: new Date(nowMs).toISOString()
  };
}

/**
 * Generates a duplicated ReceiptVoucher payload with fresh ID and copy voucher number.
 */
export function createDuplicateVoucherPayload(
  v: ReceiptVoucher,
  nowMs: number = Date.now()
): ReceiptVoucher {
  const nowStr = new Date(nowMs).toISOString();
  return {
    ...v,
    id: "rv-" + nowMs,
    voucherNumber: `${v.voucherNumber}-COPY`,
    createdAt: nowStr,
    updatedAt: nowStr
  };
}

