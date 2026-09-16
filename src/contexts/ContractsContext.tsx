import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { LeaseContract, PaymentInstallment, ReceiptVoucher, Customer, CompanySettings } from "../types";
import { collectLeaseInstallment } from "../application/contracts/collectLeaseInstallment";
import { settleLeaseDeposit, DepositRefundData } from "../application/contracts/settleLeaseDeposit";
import { useERPData } from "./ERPDataContext";
import {
  loadLeaseContracts,
  saveLeaseContracts,
  loadVouchers,
  saveVouchers,
  loadCustomers,
  saveCustomers,
  loadCompanySettings
} from "../utils/storage";
import * as spacesSvc from "../lib/supabase/spacesService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { generateUuid } from "../utils/uuid";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export interface ContractsContextState {
  leaseContracts: LeaseContract[];
}

export interface ContractsContextActions {
  saveContract: (contract: LeaseContract) => void;
  deleteContract: (contractId: string) => void;

  collectInstallment: (
    contract: LeaseContract,
    installment: PaymentInstallment
  ) => void;

  settleDeposit: (
    contract: LeaseContract,
    refundData?: DepositRefundData
  ) => void;

  shareContractWhatsApp: (
    contract: LeaseContract
  ) => void;
}

export interface ContractsContextValue {
  state: ContractsContextState;
  actions: ContractsContextActions;
}

export const ContractsContext = createContext<ContractsContextValue | null>(null);

export interface ContractsProviderProps {
  children: React.ReactNode;
  initialLeaseContracts?: LeaseContract[];
  vouchersList?: ReceiptVoucher[];
  customersList?: Customer[];
  companySettings?: CompanySettings;
  activeBranchId?: string;
  userName?: string;
  onVouchersUpdated?: (vouchers: ReceiptVoucher[], activeVoucher?: ReceiptVoucher) => void;
  onCustomersUpdated?: (customers: Customer[]) => void;
  onNavigateToPreview?: () => void;
  onAuditLog?: (
    action: string,
    module: string,
    entityId: string,
    entityName: string,
    descAr: string,
    descEn: string
  ) => void;
}

export const ContractsProvider: React.FC<ContractsProviderProps> = ({
  children,
  initialLeaseContracts,
  vouchersList: vouchersListProp,
  customersList: customersListProp,
  companySettings: companySettingsProp,
  activeBranchId: activeBranchIdProp,
  userName: userNameProp,
  onVouchersUpdated,
  onCustomersUpdated,
  onNavigateToPreview,
  onAuditLog
}) => {
  const erpData = useERPData();

  const [leaseContracts, setLeaseContracts] = useState<LeaseContract[]>(() => {
    if (initialLeaseContracts) return initialLeaseContracts;
    if (erpData?.leaseContractsList && erpData.leaseContractsList.length > 0) return erpData.leaseContractsList;
    return loadLeaseContracts();
  });

  const saveContractAction = useCallback(
    (contract: LeaseContract) => {
      setLeaseContracts((prevContracts) => {
        const exists = prevContracts.some((c) => c.id === contract.id);
        const updated = exists
          ? prevContracts.map((c) => (c.id === contract.id ? contract : c))
          : [contract, ...prevContracts];

        saveLeaseContracts(updated);
        const cId = erpData?.companyId || DEFAULT_COMPANY_ID;
        if (isSupabaseConfigured && cId) {
          spacesSvc.upsertLeaseContract(contract, cId).catch(console.error);
        }

        if (onAuditLog) {
          onAuditLog(
            exists ? "UPDATE" : "CREATE",
            "VOUCHERS",
            contract.id,
            contract.contractNumber,
            `${exists ? "تحديث وتعديل" : "إصدار وتوثيق"} عقد إيجار تجاري (${contract.contractNumber}) للمستأجر ${contract.tenantName}`,
            `${exists ? "Updated" : "Issued and signed"} lease contract (${contract.contractNumber}) for tenant ${contract.tenantName}`
          );
        }

        return updated;
      });

      // Sync Customer in CRM if not present
      if (contract.tenantName) {
        const currentCustomers = customersListProp || erpData?.customersList || loadCustomers();
        const existingCust = currentCustomers.find(
          (c) =>
            c.name.trim().toLowerCase() === contract.tenantName.trim().toLowerCase() ||
            (c.phone && contract.tenantPhone && c.phone.trim() === contract.tenantPhone.trim())
        );
        if (!existingCust) {
          const newCust: Customer = {
            id: generateUuid(),
            name: contract.tenantName,
            phone: contract.tenantPhone,
            email: contract.tenantEmail || "",
            address: contract.tenantAddress,
            taxId: contract.tenantTaxNumber,
            type: contract.tenantType === "CORPORATE" ? "CORPORATE" : "INDIVIDUAL",
            status: "ACTIVE",
            notes: `مستأجر - عقد رقم: ${contract.contractNumber} (${contract.spaceName})`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const updatedCusts = [newCust, ...currentCustomers];
          if (onCustomersUpdated) {
            onCustomersUpdated(updatedCusts);
          } else if (erpData?.setCustomersList) {
            erpData.setCustomersList(updatedCusts);
          } else {
            saveCustomers(updatedCusts);
          }
        }
      }
    },
    [erpData, customersListProp, onCustomersUpdated, onAuditLog]
  );

  const deleteContractAction = useCallback(
    (contractId: string) => {
      setLeaseContracts((prevContracts) => {
        const target = prevContracts.find((c) => c.id === contractId);
        const updated = prevContracts.filter((c) => c.id !== contractId);

        saveLeaseContracts(updated);
        if (isSupabaseConfigured) {
          spacesSvc.deleteLeaseContract(contractId).catch(console.error);
        }

        if (onAuditLog) {
          onAuditLog(
            "DELETE",
            "VOUCHERS",
            contractId,
            target?.contractNumber || contractId,
            `حذف عقد الإيجار (${target?.contractNumber || contractId}) نهائياً من السجلات`,
            `Deleted lease contract (${target?.contractNumber || contractId})`
          );
        }

        return updated;
      });
    },
    [onAuditLog]
  );

  const collectInstallmentAction = useCallback(
    (contract: LeaseContract, installment: PaymentInstallment) => {
      const currentVouchers = vouchersListProp || erpData?.vouchersList || loadVouchers();
      const currentSettings = companySettingsProp || erpData?.companySettings || loadCompanySettings();
      const branchId = activeBranchIdProp || (erpData as any)?.activeBranchId || "branch-sohar";
      const user = userNameProp || (erpData as any)?.userName || "المستخدم";

      const result = collectLeaseInstallment({
        contract,
        installment,
        leaseContractsList: leaseContracts,
        vouchersList: currentVouchers,
        companySettings: currentSettings,
        activeBranchId: branchId,
        userName: user
      });

      if (onVouchersUpdated) {
        onVouchersUpdated(result.updatedVouchers, result.newVoucher);
      } else if (erpData?.setVouchersList) {
        erpData.setVouchersList(result.updatedVouchers);
        if ((erpData as any)?.setActiveVoucher) {
          (erpData as any).setActiveVoucher(result.newVoucher);
        }
      } else {
        saveVouchers(result.updatedVouchers);
      }

      setLeaseContracts(result.updatedLeaseContracts);
      saveLeaseContracts(result.updatedLeaseContracts);

      if (result.shouldNavigateToPreview && onNavigateToPreview) {
        onNavigateToPreview();
      }

      if (onAuditLog) {
        onAuditLog(
          result.auditLogToCreate.action,
          result.auditLogToCreate.module,
          result.auditLogToCreate.entityId,
          result.auditLogToCreate.entityName,
          result.auditLogToCreate.descAr,
          result.auditLogToCreate.descEn
        );
      }
    },
    [
      leaseContracts,
      vouchersListProp,
      companySettingsProp,
      activeBranchIdProp,
      userNameProp,
      erpData,
      onVouchersUpdated,
      onNavigateToPreview,
      onAuditLog
    ]
  );

  const settleDepositAction = useCallback(
    (contract: LeaseContract, refundData?: DepositRefundData) => {
      const currentVouchers = vouchersListProp || erpData?.vouchersList || loadVouchers();
      const currentSettings = companySettingsProp || erpData?.companySettings || loadCompanySettings();
      const branchId = activeBranchIdProp || (erpData as any)?.activeBranchId || "branch-sohar";
      const user = userNameProp || (erpData as any)?.userName || "المستخدم";

      const result = settleLeaseDeposit({
        contract,
        refundData,
        leaseContractsList: leaseContracts,
        vouchersList: currentVouchers,
        companySettings: currentSettings,
        activeBranchId: branchId,
        userName: user
      });

      if (result.refundVoucher) {
        if (onVouchersUpdated) {
          onVouchersUpdated(result.updatedVouchers, result.refundVoucher);
        } else if (erpData?.setVouchersList) {
          erpData.setVouchersList(result.updatedVouchers);
        } else {
          saveVouchers(result.updatedVouchers);
        }
      }

      setLeaseContracts(result.updatedLeaseContracts);
      saveLeaseContracts(result.updatedLeaseContracts);

      if (onAuditLog) {
        onAuditLog(
          result.auditLogToCreate.action,
          result.auditLogToCreate.module,
          result.auditLogToCreate.entityId,
          result.auditLogToCreate.entityName,
          result.auditLogToCreate.descAr,
          result.auditLogToCreate.descEn
        );
      }
    },
    [
      leaseContracts,
      vouchersListProp,
      companySettingsProp,
      activeBranchIdProp,
      userNameProp,
      erpData,
      onVouchersUpdated,
      onAuditLog
    ]
  );

  const shareContractWhatsAppAction = useCallback((contract: LeaseContract) => {
    const text = encodeURIComponent(
      `*عقد إيجار مكتب ومساحة عمل معتمد*\n` +
      `--------------------------------\n` +
      `🏢 *المؤجر:* ${contract.lessorCompanyName}\n` +
      `👤 *المستأجر:* ${contract.tenantName}\n` +
      `📄 *رقم العقد:* ${contract.contractNumber}\n` +
      `📍 *العين المؤجرة:* ${contract.spaceName} (${contract.spaceCode})\n` +
      `🗓 *المدة:* من ${contract.startDate} إلى ${contract.endDate} (${contract.durationMonths} شهراً)\n` +
      `💰 *القيمة الإجمالية:* ${contract.finalContractValue.toFixed(3)} ر.ع\n` +
      `🛡 *الضمان المالي (التأمين:* ${contract.securityDeposit.depositAmount.toFixed(3)} ر.ع\n` +
      `🔐 *كود التوثيق الرقمي:* ${contract.signatureVerificationCode}\n` +
      `--------------------------------\n` +
      `تم توثيق واعتماد العقد إلكترونياً بنظام إدارة مساحات العمل.`
    );
    const cleanPhone = (contract.tenantPhone || "").replace(/\D/g, "");
    const targetUrl = cleanPhone.length > 6
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(targetUrl, "_blank");
  }, []);

  const state = useMemo<ContractsContextState>(
    () => ({
      leaseContracts
    }),
    [leaseContracts]
  );

  const actions = useMemo<ContractsContextActions>(
    () => ({
      saveContract: saveContractAction,
      deleteContract: deleteContractAction,
      collectInstallment: collectInstallmentAction,
      settleDeposit: settleDepositAction,
      shareContractWhatsApp: shareContractWhatsAppAction
    }),
    [
      saveContractAction,
      deleteContractAction,
      collectInstallmentAction,
      settleDepositAction,
      shareContractWhatsAppAction
    ]
  );

  const contextValue = useMemo<ContractsContextValue>(
    () => ({
      state,
      actions
    }),
    [state, actions]
  );

  return <ContractsContext.Provider value={contextValue}>{children}</ContractsContext.Provider>;
};

export function useContracts(): ContractsContextValue {
  const context = useContext(ContractsContext);
  if (!context) {
    throw new Error("useContracts must be used within a ContractsProvider");
  }
  return context;
}
