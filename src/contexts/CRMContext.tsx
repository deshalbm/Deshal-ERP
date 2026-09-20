import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { Customer, ReceiptVoucher, CRMLead, CRMOpportunity, CRMActivityRecord, OpportunityStage } from "../types";
import { loadCustomers, saveCustomers } from "../utils/storage";
import {
  loadCRMLeads,
  saveCRMLeads,
  loadCRMOpportunities,
  saveCRMOpportunities,
  loadCRMActivities,
  saveCRMActivities
} from "../utils/storage/crmStorage";
import { validateLeadConversion, convertLeadToCustomerPayload } from "../domain/crm/crmRules";
import { syncCustomerFromVoucher } from "../application/crm/syncCustomerFromVoucher";
import { useERPData } from "./ERPDataContext";
import * as customerSvc from "../lib/supabase/customerService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { enqueueOfflineMutation } from "../lib/supabase/syncService";
import { logActivity } from "../utils/auditLogger";
import { resolveCompanyId } from "../utils/uuid";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export interface CRMContextState {
  customers: Customer[];
  leads: CRMLead[];
  opportunities: CRMOpportunity[];
  activities: CRMActivityRecord[];
  isCustomerModalOpen: boolean;
  selectedCustomerForEditing: Customer | null;
  isLeadModalOpen: boolean;
  selectedLeadForEditing: CRMLead | null;
  isOpportunityModalOpen: boolean;
  selectedOpportunityForEditing: CRMOpportunity | null;
}

export interface CRMContextActions {
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  syncCustomersWithVouchers: (vouchers: ReceiptVoucher[]) => void;
  openCustomerModal: (customer?: Customer | null) => void;
  closeCustomerModal: () => void;

  // New CRM expansion actions
  saveLead: (lead: CRMLead) => void;
  deleteLead: (leadId: string) => void;
  convertLeadToCustomer: (leadId: string) => Customer | null;
  openLeadModal: (lead?: CRMLead | null) => void;
  closeLeadModal: () => void;

  saveOpportunity: (opportunity: CRMOpportunity) => void;
  deleteOpportunity: (opportunityId: string) => void;
  updateOpportunityStage: (opportunityId: string, newStage: OpportunityStage) => void;
  openOpportunityModal: (opportunity?: CRMOpportunity | null) => void;
  closeOpportunityModal: () => void;

  logCRMActivity: (activity: CRMActivityRecord) => void;
}

export interface CRMContextValue {
  state: CRMContextState;
  actions: CRMContextActions;
}

const CRMContext = createContext<CRMContextValue | null>(null);

export interface CRMProviderProps {
  children: React.ReactNode;
  customersList?: Customer[];
  onAuditLog?: (
    action: any,
    module: any,
    entityId: string,
    entityName: string,
    descAr: string,
    descEn: string,
    details?: string
  ) => void;
}

export const CRMProvider: React.FC<CRMProviderProps> = ({
  children,
  customersList: customersListProp,
  onAuditLog
}) => {
  const erpData = useERPData();

  // Internal React state for CRM context
  const [internalCustomers, setInternalCustomers] = useState<Customer[]>(() => {
    if (customersListProp) return customersListProp;
    if (erpData?.customersList && erpData.customersList.length > 0) {
      return erpData.customersList;
    }
    return loadCustomers();
  });

  const [leads, setLeads] = useState<CRMLead[]>(() => loadCRMLeads());
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>(() => loadCRMOpportunities());
  const [activities, setActivities] = useState<CRMActivityRecord[]>(() => loadCRMActivities());

  // Modal states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [selectedCustomerForEditing, setSelectedCustomerForEditing] = useState<Customer | null>(null);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [selectedLeadForEditing, setSelectedLeadForEditing] = useState<CRMLead | null>(null);

  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState<boolean>(false);
  const [selectedOpportunityForEditing, setSelectedOpportunityForEditing] = useState<CRMOpportunity | null>(null);

  // Sync internal state when external props or erpData change
  useEffect(() => {
    if (customersListProp) {
      setInternalCustomers(customersListProp);
    } else if (erpData?.customersList && erpData.customersList.length > 0) {
      setInternalCustomers(erpData.customersList);
    }
  }, [customersListProp, erpData?.customersList]);

  const triggerAuditLog = useCallback(
    (action: any, module: any, entityId: string, entityName: string, descAr: string, descEn: string, details?: string) => {
      if (onAuditLog) {
        onAuditLog(action, module, entityId, entityName, descAr, descEn, details);
      } else {
        logActivity({
          action,
          module,
          entityId,
          entityName,
          descriptionAr: descAr,
          descriptionEn: descEn,
          details,
          performedByName: "النظام"
        });
      }
    },
    [onAuditLog]
  );

  // --- CUSTOMER ACTIONS ---
  const saveCustomer = useCallback(
    (customer: Customer) => {
      setInternalCustomers((prev) => {
        const exists = prev.some((c) => c.id === customer.id);
        const updated = exists
          ? prev.map((c) => (c.id === customer.id ? customer : c))
          : [customer, ...prev];

        saveCustomers(updated);
        if (erpData?.setCustomersList) {
          erpData.setCustomersList(updated);
        }

        const cId = resolveCompanyId(erpData?.companyId);
        if (isSupabaseConfigured && cId) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueOfflineMutation({ entityType: 'CUSTOMER', action: 'UPSERT', payload: customer, companyId: cId });
          } else {
            customerSvc.upsertCustomer(customer, cId).then((res) => {
              if (res.success && res.data) {
                setInternalCustomers((p) => p.map((c) => (c.id === res.data!.id ? res.data! : c)));
              }
            }).catch(console.error);
          }
        }

        triggerAuditLog(
          exists ? "UPDATE" : "CREATE",
          "CRM",
          customer.id,
          customer.name,
          `${exists ? "تحديث ملف" : "تسجيل عميل جديد"} ${customer.name}`,
          `${exists ? "Updated customer" : "Created new customer"} ${customer.name}`,
          `الهاتف: ${customer.phone || "-"} - البريد: ${customer.email || "-"}`
        );

        return updated;
      });
    },
    [erpData, triggerAuditLog]
  );

  const deleteCustomer = useCallback(
    (customerId: string) => {
      setInternalCustomers((prev) => {
        const cust = prev.find((c) => c.id === customerId);
        const updated = prev.filter((c) => c.id !== customerId);

        saveCustomers(updated);
        if (erpData?.setCustomersList) {
          erpData.setCustomersList(updated);
        }

        if (isSupabaseConfigured) {
          customerSvc.deleteCustomer(customerId).catch(console.error);
        }

        triggerAuditLog(
          "DELETE",
          "CRM",
          customerId,
          cust?.name || customerId,
          `حذف العميل ${cust?.name || customerId} من دليل العملاء`,
          `Deleted customer ${cust?.name || customerId} from CRM directory`
        );

        return updated;
      });
    },
    [erpData, triggerAuditLog]
  );

  const syncCustomersWithVouchers = useCallback(
    (vouchers: ReceiptVoucher[]) => {
      setInternalCustomers((prev) => {
        let currentList = [...prev];
        vouchers.forEach((v) => {
          currentList = syncCustomerFromVoucher(v, currentList);
        });
        saveCustomers(currentList);
        if (erpData?.setCustomersList) {
          erpData.setCustomersList(currentList);
        }
        return currentList;
      });
    },
    [erpData]
  );

  const openCustomerModal = useCallback((customer?: Customer | null) => {
    setSelectedCustomerForEditing(customer || null);
    setIsCustomerModalOpen(true);
  }, []);

  const closeCustomerModal = useCallback(() => {
    setIsCustomerModalOpen(false);
    setSelectedCustomerForEditing(null);
  }, []);

  // --- LEAD ACTIONS ---
  const saveLead = useCallback((lead: CRMLead) => {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      const updated = exists ? prev.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...prev];
      saveCRMLeads(updated);
      triggerAuditLog(
        exists ? "UPDATE" : "CREATE",
        "CRM",
        lead.id,
        lead.title,
        `${exists ? "تحديث عميل محتمل" : "تسجيل عميل محتمل جديد"}: ${lead.title}`,
        `${exists ? "Updated lead" : "Created new lead"}: ${lead.title}`
      );
      return updated;
    });
  }, [triggerAuditLog]);

  const deleteLead = useCallback((leadId: string) => {
    setLeads((prev) => {
      const lead = prev.find((l) => l.id === leadId);
      const updated = prev.filter((l) => l.id !== leadId);
      saveCRMLeads(updated);
      triggerAuditLog("DELETE", "CRM", leadId, lead?.title || leadId, `حذف عميل محتمل: ${lead?.title || leadId}`, `Deleted lead: ${lead?.title || leadId}`);
      return updated;
    });
  }, [triggerAuditLog]);

  const convertLeadToCustomer = useCallback((leadId: string): Customer | null => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return null;

    const validation = validateLeadConversion(targetLead);
    if (!validation.isValid) {
      alert(validation.errorMessage);
      return null;
    }

    const newCustomer = convertLeadToCustomerPayload(targetLead);
    saveCustomer(newCustomer);

    // Update lead status to CONVERTED
    const updatedLead: CRMLead = {
      ...targetLead,
      status: "CONVERTED",
      convertedCustomerId: newCustomer.id,
      updatedAt: new Date().toISOString()
    };
    saveLead(updatedLead);

    triggerAuditLog(
      "UPDATE",
      "CRM",
      leadId,
      targetLead.title,
      `تحويل العميل المحتمل (${targetLead.contactName}) إلى ملف عميل رسمي (${newCustomer.name})`,
      `Converted lead (${targetLead.contactName}) to official customer (${newCustomer.name})`
    );

    return newCustomer;
  }, [leads, saveCustomer, saveLead, triggerAuditLog]);

  const openLeadModal = useCallback((lead?: CRMLead | null) => {
    setSelectedLeadForEditing(lead || null);
    setIsLeadModalOpen(true);
  }, []);

  const closeLeadModal = useCallback(() => {
    setIsLeadModalOpen(false);
    setSelectedLeadForEditing(null);
  }, []);

  // --- OPPORTUNITY ACTIONS ---
  const saveOpportunity = useCallback((opportunity: CRMOpportunity) => {
    setOpportunities((prev) => {
      const exists = prev.some((o) => o.id === opportunity.id);
      const updated = exists ? prev.map((o) => (o.id === opportunity.id ? opportunity : o)) : [opportunity, ...prev];
      saveCRMOpportunities(updated);
      triggerAuditLog(
        exists ? "UPDATE" : "CREATE",
        "CRM",
        opportunity.id,
        opportunity.title,
        `${exists ? "تحديث فرصة مبيعات" : "إضافة فرصة مبيعات جديدة"}: ${opportunity.title}`,
        `${exists ? "Updated opportunity" : "Created opportunity"}: ${opportunity.title}`
      );
      return updated;
    });
  }, [triggerAuditLog]);

  const deleteOpportunity = useCallback((opportunityId: string) => {
    setOpportunities((prev) => {
      const opp = prev.find((o) => o.id === opportunityId);
      const updated = prev.filter((o) => o.id !== opportunityId);
      saveCRMOpportunities(updated);
      triggerAuditLog("DELETE", "CRM", opportunityId, opp?.title || opportunityId, `حذف فرصة مبيعات: ${opp?.title || opportunityId}`, `Deleted opportunity: ${opp?.title || opportunityId}`);
      return updated;
    });
  }, [triggerAuditLog]);

  const updateOpportunityStage = useCallback((opportunityId: string, newStage: OpportunityStage) => {
    setOpportunities((prev) => {
      const target = prev.find((o) => o.id === opportunityId);
      if (!target) return prev;

      let prob = target.probabilityPercent;
      if (newStage === "QUALIFICATION") prob = 30;
      else if (newStage === "PROPOSAL") prob = 60;
      else if (newStage === "NEGOTIATION") prob = 85;
      else if (newStage === "WON") prob = 100;
      else if (newStage === "LOST") prob = 0;

      const updatedOpp: CRMOpportunity = {
        ...target,
        stage: newStage,
        probabilityPercent: prob,
        updatedAt: new Date().toISOString()
      };

      const updatedList = prev.map((o) => (o.id === opportunityId ? updatedOpp : o));
      saveCRMOpportunities(updatedList);
      triggerAuditLog("UPDATE", "CRM", opportunityId, target.title, `تحديث مرحلة الصفقة (${target.title}) إلى ${newStage}`, `Updated deal stage (${target.title}) to ${newStage}`);
      return updatedList;
    });
  }, [triggerAuditLog]);

  const openOpportunityModal = useCallback((opportunity?: CRMOpportunity | null) => {
    setSelectedOpportunityForEditing(opportunity || null);
    setIsOpportunityModalOpen(true);
  }, []);

  const closeOpportunityModal = useCallback(() => {
    setIsOpportunityModalOpen(false);
    setSelectedOpportunityForEditing(null);
  }, []);

  // --- ACTIVITY ACTIONS ---
  const logCRMActivity = useCallback((activity: CRMActivityRecord) => {
    setActivities((prev) => {
      const updated = [activity, ...prev];
      saveCRMActivities(updated);
      triggerAuditLog("CREATE", "CRM", activity.id, activity.title, `تسجيل نشاط مبيعات (${activity.type}): ${activity.title}`, `Logged CRM activity (${activity.type}): ${activity.title}`);
      return updated;
    });
  }, [triggerAuditLog]);

  const value = useMemo<CRMContextValue>(
    () => ({
      state: {
        customers: internalCustomers,
        leads,
        opportunities,
        activities,
        isCustomerModalOpen,
        selectedCustomerForEditing,
        isLeadModalOpen,
        selectedLeadForEditing,
        isOpportunityModalOpen,
        selectedOpportunityForEditing
      },
      actions: {
        saveCustomer,
        deleteCustomer,
        syncCustomersWithVouchers,
        openCustomerModal,
        closeCustomerModal,
        saveLead,
        deleteLead,
        convertLeadToCustomer,
        openLeadModal,
        closeLeadModal,
        saveOpportunity,
        deleteOpportunity,
        updateOpportunityStage,
        openOpportunityModal,
        closeOpportunityModal,
        logCRMActivity
      }
    }),
    [
      internalCustomers,
      leads,
      opportunities,
      activities,
      isCustomerModalOpen,
      selectedCustomerForEditing,
      isLeadModalOpen,
      selectedLeadForEditing,
      isOpportunityModalOpen,
      selectedOpportunityForEditing,
      saveCustomer,
      deleteCustomer,
      syncCustomersWithVouchers,
      openCustomerModal,
      closeCustomerModal,
      saveLead,
      deleteLead,
      convertLeadToCustomer,
      openLeadModal,
      closeLeadModal,
      saveOpportunity,
      deleteOpportunity,
      updateOpportunityStage,
      openOpportunityModal,
      closeOpportunityModal,
      logCRMActivity
    ]
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export function useCRM(): CRMContextValue {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
}
