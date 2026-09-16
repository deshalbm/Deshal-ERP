import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  ConsultingService,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
  ReceiptVoucher,
  Customer,
  CompanySettings
} from "../types";
import { confirmServiceBooking } from "../application/services/confirmServiceBooking";
import { calculateSpaceBookingTotals } from "../domain/spaces/spacesEngine";
import { useERPData } from "./ERPDataContext";
import {
  loadConsultingServices,
  saveConsultingServices,
  loadMembershipPackages,
  saveMembershipPackages,
  loadTenantSubscriptions,
  saveTenantSubscriptions,
  loadServiceBookings,
  saveServiceBookings,
  loadVouchers,
  saveVouchers,
  loadCustomers,
  saveCustomers,
  loadCompanySettings
} from "../utils/storage";
import * as spacesSvc from "../lib/supabase/spacesService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { numberToWords } from "../utils/numberToWords";

export interface ServicesContextState {
  consultingServices: ConsultingService[];
  membershipPackages: MembershipPackage[];
  tenantSubscriptions: TenantSubscription[];
  serviceBookings: ServiceBooking[];

  isServiceBookingModalOpen: boolean;
  selectedServiceForBooking: ConsultingService | null;

  isTenantSubModalOpen: boolean;
  selectedTenantSubForEditing: TenantSubscription | null;
}

export interface ServicesContextActions {
  saveService: (service: ConsultingService) => void;
  deleteService: (serviceId: string) => void;

  savePackage: (pkg: MembershipPackage) => void;
  deletePackage: (pkgId: string) => void;

  saveSubscription: (sub: TenantSubscription) => void;
  deleteSubscription: (subId: string) => void;

  confirmBooking: (
    newBooking: ServiceBooking,
    autoGenerateVoucher?: boolean
  ) => void;

  issueVoucherFromBooking: (
    booking: ServiceBooking
  ) => void;

  openBookingModal: (
    service?: ConsultingService | null
  ) => void;

  closeBookingModal: () => void;

  openSubscriptionModal: (
    sub?: TenantSubscription | null
  ) => void;

  closeSubscriptionModal: () => void;
}

export interface ServicesContextValue {
  state: ServicesContextState;
  actions: ServicesContextActions;
}

export const ServicesContext = createContext<ServicesContextValue | null>(null);

export interface ServicesProviderProps {
  children: React.ReactNode;
  initialConsultingServices?: ConsultingService[];
  initialMembershipPackages?: MembershipPackage[];
  initialTenantSubscriptions?: TenantSubscription[];
  initialServiceBookings?: ServiceBooking[];

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

export const ServicesProvider: React.FC<ServicesProviderProps> = ({
  children,
  initialConsultingServices,
  initialMembershipPackages,
  initialTenantSubscriptions,
  initialServiceBookings,
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

  const [consultingServices, setConsultingServices] = useState<ConsultingService[]>(() => {
    if (initialConsultingServices) return initialConsultingServices;
    if (erpData?.consultingServicesList && erpData.consultingServicesList.length > 0) return erpData.consultingServicesList;
    return loadConsultingServices();
  });

  const [membershipPackages, setMembershipPackages] = useState<MembershipPackage[]>(() => {
    if (initialMembershipPackages) return initialMembershipPackages;
    if (erpData?.membershipPackagesList && erpData.membershipPackagesList.length > 0) return erpData.membershipPackagesList;
    return loadMembershipPackages();
  });

  const [tenantSubscriptions, setTenantSubscriptions] = useState<TenantSubscription[]>(() => {
    if (initialTenantSubscriptions) return initialTenantSubscriptions;
    if (erpData?.tenantSubscriptionsList && erpData.tenantSubscriptionsList.length > 0) return erpData.tenantSubscriptionsList;
    return loadTenantSubscriptions();
  });

  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>(() => {
    if (initialServiceBookings) return initialServiceBookings;
    if (erpData?.serviceBookingsList && erpData.serviceBookingsList.length > 0) return erpData.serviceBookingsList;
    return loadServiceBookings();
  });

  const [isServiceBookingModalOpen, setIsServiceBookingModalOpen] = useState<boolean>(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ConsultingService | null>(null);

  const [isTenantSubModalOpen, setIsTenantSubModalOpen] = useState<boolean>(false);
  const [selectedTenantSubForEditing, setSelectedTenantSubForEditing] = useState<TenantSubscription | null>(null);

  const saveServiceAction = useCallback(
    (service: ConsultingService) => {
      setConsultingServices((prevServices) => {
        const exists = prevServices.some((s) => s.id === service.id);
        const updated = exists
          ? prevServices.map((s) => (s.id === service.id ? service : s))
          : [service, ...prevServices];

        saveConsultingServices(updated);

        if (onAuditLog) {
          onAuditLog(
            "UPDATE",
            "SETTINGS",
            service.id,
            service.name,
            `حفظ وتحديث بيانات الخدمة الاستشارية (${service.name})`,
            `Saved consulting & business service (${service.nameEn || service.name})`
          );
        }

        return updated;
      });
    },
    [onAuditLog]
  );

  const deleteServiceAction = useCallback(
    (serviceId: string) => {
      setConsultingServices((prevServices) => {
        const target = prevServices.find((s) => s.id === serviceId);
        const updated = prevServices.filter((s) => s.id !== serviceId);

        if (isSupabaseConfigured) {
          spacesSvc.deleteConsultingService(serviceId).catch(console.error);
        }
        saveConsultingServices(updated);

        if (onAuditLog) {
          onAuditLog(
            "DELETE",
            "SETTINGS",
            serviceId,
            target?.name || serviceId,
            `حذف الخدمة الاستشارية (${target?.name || serviceId}) نهائياً`,
            `Deleted consulting service (${target?.nameEn || serviceId})`
          );
        }

        return updated;
      });
    },
    [onAuditLog]
  );

  const savePackageAction = useCallback(
    (pkg: MembershipPackage) => {
      setMembershipPackages((prevPackages) => {
        const exists = prevPackages.some((p) => p.id === pkg.id);
        const updated = exists
          ? prevPackages.map((p) => (p.id === pkg.id ? pkg : p))
          : [pkg, ...prevPackages];

        saveMembershipPackages(updated);

        if (onAuditLog) {
          onAuditLog(
            "UPDATE",
            "SETTINGS",
            pkg.id,
            pkg.name,
            `تحديث باقة اشتراك المستأجرين والحصص المجانية (${pkg.name})`,
            `Saved membership tier package (${pkg.nameEn || pkg.name})`
          );
        }

        return updated;
      });
    },
    [onAuditLog]
  );

  const deletePackageAction = useCallback((pkgId: string) => {
    setMembershipPackages((prevPackages) => {
      const updated = prevPackages.filter((p) => p.id !== pkgId);
      if (isSupabaseConfigured) {
        spacesSvc.deleteMembershipPackage(pkgId).catch(console.error);
      }
      saveMembershipPackages(updated);
      return updated;
    });
  }, []);

  const saveSubscriptionAction = useCallback(
    (sub: TenantSubscription) => {
      setTenantSubscriptions((prevSubs) => {
        const exists = prevSubs.some((s) => s.id === sub.id);
        const updated = exists
          ? prevSubs.map((s) => (s.id === sub.id ? sub : s))
          : [sub, ...prevSubs];

        saveTenantSubscriptions(updated);

        if (onAuditLog) {
          onAuditLog(
            "UPDATE",
            "SETTINGS",
            sub.id,
            sub.customerName,
            `تحديث اشتراك المستأجر وحصص الساعات المجانية (${sub.customerName})`,
            `Updated tenant subscription and quota usage (${sub.customerName})`
          );
        }

        return updated;
      });
    },
    [onAuditLog]
  );

  const deleteSubscriptionAction = useCallback((subId: string) => {
    setTenantSubscriptions((prevSubs) => {
      const updated = prevSubs.filter((s) => s.id !== subId);
      if (isSupabaseConfigured) {
        spacesSvc.deleteTenantSubscription(subId).catch(console.error);
      }
      saveTenantSubscriptions(updated);
      return updated;
    });
  }, []);

  const confirmBookingAction = useCallback(
    (newBooking: ServiceBooking, autoGenerateVoucher: boolean = true) => {
      const currentVouchers = vouchersListProp || erpData?.vouchersList || loadVouchers();
      const currentCustomers = customersListProp || erpData?.customersList || loadCustomers();
      const currentSettings = companySettingsProp || erpData?.companySettings || loadCompanySettings();
      const branchId = activeBranchIdProp || (erpData as any)?.activeBranchId || "branch-sohar";
      const user = userNameProp || (erpData as any)?.userName || "المستخدم";

      const result = confirmServiceBooking({
        newBooking,
        autoGenerateVoucher,
        tenantSubscriptionsList: tenantSubscriptions,
        serviceBookingsList: serviceBookings,
        vouchersList: currentVouchers,
        customersList: currentCustomers,
        companySettings: currentSettings,
        activeBranchId: branchId,
        userName: user
      });

      if (result.newSubQuotaDeducted) {
        setTenantSubscriptions(result.updatedSubscriptions);
        saveTenantSubscriptions(result.updatedSubscriptions);
      }

      if (result.newVoucher) {
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

        if (result.shouldNavigateToPreview && onNavigateToPreview) {
          onNavigateToPreview();
        }
      }

      setServiceBookings(result.updatedBookings);
      saveServiceBookings(result.updatedBookings);

      if (result.newCustomerCreated) {
        if (onCustomersUpdated) {
          onCustomersUpdated(result.updatedCustomers);
        } else if (erpData?.setCustomersList) {
          erpData.setCustomersList(result.updatedCustomers);
        } else {
          saveCustomers(result.updatedCustomers);
        }
      }

      if (onAuditLog) {
        result.auditLogsToCreate.forEach((log) => {
          onAuditLog(log.action, log.module, log.entityId, log.entityName, log.descAr, log.descEn);
        });
      }
    },
    [
      tenantSubscriptions,
      serviceBookings,
      vouchersListProp,
      customersListProp,
      companySettingsProp,
      activeBranchIdProp,
      userNameProp,
      erpData,
      onVouchersUpdated,
      onCustomersUpdated,
      onNavigateToPreview,
      onAuditLog
    ]
  );

  const issueVoucherFromBookingAction = useCallback(
    (booking: ServiceBooking) => {
      const currentVouchers = vouchersListProp || erpData?.vouchersList || loadVouchers();
      const currentSettings = companySettingsProp || erpData?.companySettings || loadCompanySettings();
      const branchId = activeBranchIdProp || (erpData as any)?.activeBranchId || "branch-sohar";
      const user = userNameProp || (erpData as any)?.userName || "النظام";

      const lineItems = [
        {
          id: `item-srv-${Date.now()}`,
          description: `${booking.serviceName} (${booking.duration || "جلسة استشارية"})`,
          quantity: 1,
          unitPrice: booking.price,
          amount: booking.price
        }
      ];

      const { subtotal, discountAmount: discount, taxableBase: taxableAmount, taxAmount } = calculateSpaceBookingTotals(booking.price, 1, booking.discount || 0);
      const totalAmount = booking.finalAmount;
      const currency = booking.currency || currentSettings.defaultCurrency || "OMR";

      const newVoucher: ReceiptVoucher = {
        id: `rv-srv-${Date.now()}`,
        voucherNumber: `RV-SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceNo: booking.bookingNumber,
        date: booking.preferredDate || new Date().toISOString().split("T")[0],
        type: "RECEIPT",
        receivedFrom: booking.customerName,
        payerPhone: booking.customerPhone,
        payerEmail: booking.customerEmail,
        amount: totalAmount,
        amountInWords: numberToWords(totalAmount, currency),
        currency: currency,
        paymentMethod: booking.paymentMethod || "CREDIT_CARD",
        category: "إيرادات خدمات استشارية وإدارية مساندة",
        notes: `سند قبض مقابل حجز ${booking.serviceName} - رقم الحجز: ${booking.bookingNumber}`,
        terms: "شكراً لتعاملكم معنا. يرجى الاحتفاظ بالسند كإثبات سداد رسمي.",
        customFields: [],
        lineItems: lineItems,
        subtotal: subtotal,
        taxRate: 5,
        taxAmount: taxAmount,
        discountAmount: discount,
        totalAmount: totalAmount,
        isCustomWords: false,
        status: "PAID",
        branchId: branchId,
        preparedBy: user,
        approvedBy: "الإدارة المالية",
        receivedBy: booking.customerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedVouchers = [newVoucher, ...currentVouchers];
      if (onVouchersUpdated) {
        onVouchersUpdated(updatedVouchers, newVoucher);
      } else if (erpData?.setVouchersList) {
        erpData.setVouchersList(updatedVouchers);
        if ((erpData as any)?.setActiveVoucher) {
          (erpData as any).setActiveVoucher(newVoucher);
        }
      } else {
        saveVouchers(updatedVouchers);
      }

      const updatedBookings = serviceBookings.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              linkedVoucherId: newVoucher.id,
              linkedVoucherNumber: newVoucher.voucherNumber,
              paymentStatus: "PAID" as const
            }
          : b
      );
      setServiceBookings(updatedBookings);
      saveServiceBookings(updatedBookings);

      if (onNavigateToPreview) {
        onNavigateToPreview();
      }

      if (onAuditLog) {
        onAuditLog(
          "CREATE",
          "VOUCHERS",
          newVoucher.id,
          newVoucher.voucherNumber,
          `إصدار سند قبض مالي رسمي ${newVoucher.voucherNumber} لحجز الخدمة ${booking.bookingNumber}`,
          `Issued official receipt voucher ${newVoucher.voucherNumber} for service booking ${booking.bookingNumber}`
        );
      }
    },
    [
      serviceBookings,
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

  const openBookingModalAction = useCallback((service?: ConsultingService | null) => {
    setSelectedServiceForBooking(service || null);
    setIsServiceBookingModalOpen(true);
  }, []);

  const closeBookingModalAction = useCallback(() => {
    setIsServiceBookingModalOpen(false);
    setSelectedServiceForBooking(null);
  }, []);

  const openSubscriptionModalAction = useCallback((sub?: TenantSubscription | null) => {
    setSelectedTenantSubForEditing(sub || null);
    setIsTenantSubModalOpen(true);
  }, []);

  const closeSubscriptionModalAction = useCallback(() => {
    setIsTenantSubModalOpen(false);
    setSelectedTenantSubForEditing(null);
  }, []);

  const state = useMemo<ServicesContextState>(
    () => ({
      consultingServices,
      membershipPackages,
      tenantSubscriptions,
      serviceBookings,
      isServiceBookingModalOpen,
      selectedServiceForBooking,
      isTenantSubModalOpen,
      selectedTenantSubForEditing
    }),
    [
      consultingServices,
      membershipPackages,
      tenantSubscriptions,
      serviceBookings,
      isServiceBookingModalOpen,
      selectedServiceForBooking,
      isTenantSubModalOpen,
      selectedTenantSubForEditing
    ]
  );

  const actions = useMemo<ServicesContextActions>(
    () => ({
      saveService: saveServiceAction,
      deleteService: deleteServiceAction,
      savePackage: savePackageAction,
      deletePackage: deletePackageAction,
      saveSubscription: saveSubscriptionAction,
      deleteSubscription: deleteSubscriptionAction,
      confirmBooking: confirmBookingAction,
      issueVoucherFromBooking: issueVoucherFromBookingAction,
      openBookingModal: openBookingModalAction,
      closeBookingModal: closeBookingModalAction,
      openSubscriptionModal: openSubscriptionModalAction,
      closeSubscriptionModal: closeSubscriptionModalAction
    }),
    [
      saveServiceAction,
      deleteServiceAction,
      savePackageAction,
      deletePackageAction,
      saveSubscriptionAction,
      deleteSubscriptionAction,
      confirmBookingAction,
      issueVoucherFromBookingAction,
      openBookingModalAction,
      closeBookingModalAction,
      openSubscriptionModalAction,
      closeSubscriptionModalAction
    ]
  );

  const contextValue = useMemo<ServicesContextValue>(
    () => ({
      state,
      actions
    }),
    [state, actions]
  );

  return <ServicesContext.Provider value={contextValue}>{children}</ServicesContext.Provider>;
};

export function useServices(): ServicesContextValue {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
}
