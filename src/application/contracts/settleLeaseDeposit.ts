import { LeaseContract, ReceiptVoucher, CompanySettings } from "../../types";
import { numberToWords } from "../../domain/finance/numberToWords";

export interface DepositRefundData {
  amount: number;
  deductedAmount?: number;
  deductionReason?: string;
  notes?: string;
}

export interface SettleLeaseDepositInput {
  contract: LeaseContract;
  refundData?: DepositRefundData;
  leaseContractsList: LeaseContract[];
  vouchersList: ReceiptVoucher[];
  companySettings: CompanySettings;
  activeBranchId: string;
  userName?: string;
}

export interface AuditLogToCreatePayload {
  action: string;
  module: string;
  entityId: string;
  entityName: string;
  descAr: string;
  descEn: string;
}

export interface SettleLeaseDepositResult {
  updatedContract: LeaseContract;
  updatedLeaseContracts: LeaseContract[];
  refundVoucher?: ReceiptVoucher;
  updatedVouchers: ReceiptVoucher[];
  auditLogToCreate: AuditLogToCreatePayload;
}

/**
 * Pure Application Use Case: Orchestrates Commercial Lease Security Deposit Settlement,
 * inspection handover processing, Payment Voucher generation (PV-DEP-YYYY-XXXX) for refundable balances,
 * and Audit Log payload construction with zero React, DOM, or Persistence side-effects.
 */
export function settleLeaseDeposit(input: SettleLeaseDepositInput): SettleLeaseDepositResult {
  const {
    contract,
    refundData,
    leaseContractsList,
    vouchersList,
    companySettings,
    activeBranchId,
    userName
  } = input;

  let refundVoucher: ReceiptVoucher | undefined = undefined;
  let updatedVouchers: ReceiptVoucher[] = vouchersList;

  if (refundData && refundData.amount > 0) {
    const currYear = new Date().getFullYear();
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const pvNum = `PV-DEP-${currYear}-${randSeq}`;
    const curr = "OMR";

    refundVoucher = {
      id: `pv-dep-${Date.now()}`,
      voucherNumber: pvNum,
      referenceNo: contract.contractNumber,
      date: new Date().toISOString().split("T")[0],
      type: "PAYMENT",
      receivedFrom: contract.tenantName,
      payerPhone: contract.tenantPhone,
      payerEmail: contract.tenantEmail,
      payerAddress: contract.tenantAddress,
      amount: refundData.amount,
      amountInWords: numberToWords(refundData.amount, curr),
      currency: curr,
      paymentMethod: "BANK_TRANSFER",
      category: "أمانات وتأمينات المستأجرين المستردة",
      notes: `رد وتسوية مبلغ التأمين المسترد لعقد الإيجار (${contract.contractNumber}) بعد فحص وإخلاء ${contract.spaceName}`,
      terms: companySettings.termsAndConditions || "تم تسوية التأمين وإخلاء طرف المستأجر بموجب محضر المعاينة المعتمد.",
      customFields: [
        { id: "cf-dep-1", label: "رقم العقد الإيجاري", value: contract.contractNumber },
        { id: "cf-dep-2", label: "المستأجر", value: contract.tenantName }
      ],
      lineItems: [
        {
          id: `li-dep-${Date.now()}`,
          description: `رد التأمين المسترد عن عقد الإيجار (${contract.contractNumber})`,
          quantity: 1,
          unitPrice: refundData.amount,
          amount: refundData.amount
        }
      ],
      subtotal: refundData.amount,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: refundData.amount,
      isCustomWords: false,
      status: "PAID",
      branchId: contract.branchId || activeBranchId,
      preparedBy: userName || "مدير التأجير",
      approvedBy: "الإدارة المالية",
      receivedBy: contract.tenantName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updatedVouchers = [refundVoucher, ...vouchersList];
  }

  const updatedContract: LeaseContract = { ...contract };
  const updatedLeaseContracts = leaseContractsList.map((c) =>
    c.id === contract.id ? updatedContract : c
  );

  const auditLogToCreate: AuditLogToCreatePayload = {
    action: "UPDATE",
    module: "VOUCHERS",
    entityId: contract.id,
    entityName: contract.contractNumber,
    descAr: `تسوية الضمان المالي ومحضر الاستلام للعقد (${contract.contractNumber}) للمستأجر ${contract.tenantName}`,
    descEn: `Settled security deposit & handover for contract (${contract.contractNumber})`
  };

  return {
    updatedContract,
    updatedLeaseContracts,
    refundVoucher,
    updatedVouchers,
    auditLogToCreate
  };
}
