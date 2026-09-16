import { LeaseContract, PaymentInstallment, ReceiptVoucher, CompanySettings } from "../../types";
import { numberToWords } from "../../domain/finance/numberToWords";

export interface CollectLeaseInstallmentInput {
  contract: LeaseContract;
  installment: PaymentInstallment;
  leaseContractsList: LeaseContract[];
  vouchersList: ReceiptVoucher[];
  companySettings: CompanySettings;
  activeBranchId: string;
  userName?: string;
}

export interface AuditLogPayload {
  action: string;
  module: string;
  entityId: string;
  entityName: string;
  descAr: string;
  descEn: string;
}

export interface CollectLeaseInstallmentResult {
  updatedContract: LeaseContract;
  updatedLeaseContracts: LeaseContract[];
  newVoucher: ReceiptVoucher;
  updatedVouchers: ReceiptVoucher[];
  auditLogToCreate: AuditLogPayload;
  shouldNavigateToPreview: boolean;
}

/**
 * Pure Application Use Case: Orchestrates commercial lease installment collection,
 * ReceiptVoucher generation, contract installment status updates (PAID), and audit payload preparation.
 * Zero React, DOM, or Persistence side-effects.
 */
export function collectLeaseInstallment(
  input: CollectLeaseInstallmentInput
): CollectLeaseInstallmentResult {
  const {
    contract,
    installment,
    leaseContractsList,
    vouchersList,
    companySettings,
    activeBranchId,
    userName
  } = input;

  const currYear = new Date().getFullYear();
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  const voucherNum = `RV-LEAS-${currYear}-${randSeq}`;
  const curr = installment.currency || "OMR";

  const lineItems = [
    {
      id: `li-inst-${Date.now()}`,
      description: `${installment.titleAr} - عن عقد الإيجار (${contract.contractNumber}) - ${contract.spaceName}`,
      quantity: 1,
      unitPrice: installment.amount,
      amount: installment.amount
    }
  ];

  const newVoucher: ReceiptVoucher = {
    id: `rv-inst-${Date.now()}`,
    voucherNumber: voucherNum,
    referenceNo: contract.contractNumber,
    date: new Date().toISOString().split("T")[0],
    type: "RECEIPT",
    receivedFrom: contract.tenantName,
    payerPhone: contract.tenantPhone,
    payerEmail: contract.tenantEmail,
    payerAddress: contract.tenantAddress,
    payerTaxId: contract.tenantTaxNumber,
    amount: installment.totalAmount,
    amountInWords: numberToWords(installment.totalAmount, curr),
    currency: curr,
    paymentMethod: "BANK_TRANSFER",
    category: "إيرادات تأجير المكاتب ومساحات العمل",
    notes: `سداد الدفعة الإيجارية (${installment.titleAr}) - عقد رقم (${contract.contractNumber}) - الوحدة: ${contract.spaceName}`,
    terms: companySettings.termsAndConditions || "يعتبر هذا المستند إشعاراً رسمياً وسند قبض معتمد قانونياً.",
    customFields: [
      { id: "cf-lc-1", label: "رقم العقد الإيجاري", value: contract.contractNumber },
      { id: "cf-lc-2", label: "العين المؤجرة", value: contract.spaceName }
    ],
    lineItems: lineItems,
    subtotal: installment.amount,
    taxRate: installment.taxRate || 5,
    taxAmount: installment.taxAmount || 0,
    discountAmount: 0,
    totalAmount: installment.totalAmount,
    isCustomWords: false,
    status: "PAID",
    branchId: contract.branchId || activeBranchId,
    preparedBy: userName || "مدير التأجير",
    approvedBy: "الإدارة المالية",
    receivedBy: contract.tenantName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedVouchers = [newVoucher, ...vouchersList];

  // Update Installment in Contract immutably
  const updatedInstallments = (contract.installments || []).map((inst) =>
    inst.id === installment.id
      ? {
          ...inst,
          status: "PAID" as const,
          paidDate: new Date().toISOString().split("T")[0],
          linkedVoucherId: newVoucher.id,
          linkedVoucherNumber: newVoucher.voucherNumber
        }
      : inst
  );

  const updatedContract: LeaseContract = {
    ...contract,
    installments: updatedInstallments,
    updatedAt: new Date().toISOString()
  };

  const updatedLeaseContracts = leaseContractsList.map((c) =>
    c.id === contract.id ? updatedContract : c
  );

  const auditLogToCreate: AuditLogPayload = {
    action: "CREATE",
    module: "VOUCHERS",
    entityId: newVoucher.id,
    entityName: newVoucher.voucherNumber,
    descAr: `تحصيل القسط الإيجاري وإصدار سند قبض (${newVoucher.voucherNumber}) للعقد (${contract.contractNumber})`,
    descEn: `Collected lease installment and issued receipt (${newVoucher.voucherNumber}) for contract (${contract.contractNumber})`
  };

  return {
    updatedContract,
    updatedLeaseContracts,
    newVoucher,
    updatedVouchers,
    auditLogToCreate,
    shouldNavigateToPreview: true
  };
}
