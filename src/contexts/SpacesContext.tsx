import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { RentalSpace, SpaceBooking, ReceiptVoucher, Customer, CompanySettings } from "../types";
import { confirmSpaceBooking } from "../application/spaces/confirmSpaceBooking";
import { useERPData } from "./ERPDataContext";
import {
  loadRentalSpaces,
  saveRentalSpaces,
  loadSpaceBookings,
  saveSpaceBookings,
  loadVouchers,
  saveVouchers,
  loadCustomers,
  saveCustomers,
  loadCompanySettings
} from "../utils/storage";
import * as spacesSvc from "../lib/supabase/spacesService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { numberToWords } from "../utils/numberToWords";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export interface SpacesContextState {
  rentalSpaces: RentalSpace[];
  spaceBookings: SpaceBooking[];
  isBookingModalOpen: boolean;
  selectedSpaceForBooking: RentalSpace | null;
}

export interface SpacesContextActions {
  saveRentalSpaces: (spaces: RentalSpace[]) => void;
  saveSpaceBookings: (bookings: SpaceBooking[]) => void;

  confirmBooking: (
    newBooking: SpaceBooking,
    autoGenerateVoucher?: boolean
  ) => void;

  issueVoucherFromBooking: (
    booking: SpaceBooking
  ) => void;

  openBookingModal: (
    space?: RentalSpace | null
  ) => void;

  closeBookingModal: () => void;
}

export interface SpacesContextValue {
  state: SpacesContextState;
  actions: SpacesContextActions;
}

export const SpacesContext = createContext<SpacesContextValue | null>(null);

export interface SpacesProviderProps {
  children: React.ReactNode;
  initialRentalSpaces?: RentalSpace[];
  initialSpaceBookings?: SpaceBooking[];
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

export const SpacesProvider: React.FC<SpacesProviderProps> = ({
  children,
  initialRentalSpaces,
  initialSpaceBookings,
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

  const [rentalSpaces, setRentalSpaces] = useState<RentalSpace[]>(() => {
    if (initialRentalSpaces) return initialRentalSpaces;
    if (erpData?.rentalSpacesList && erpData.rentalSpacesList.length > 0) return erpData.rentalSpacesList;
    return loadRentalSpaces();
  });

  const [spaceBookings, setSpaceBookings] = useState<SpaceBooking[]>(() => {
    if (initialSpaceBookings) return initialSpaceBookings;
    if (erpData?.spaceBookingsList && erpData.spaceBookingsList.length > 0) return erpData.spaceBookingsList;
    return loadSpaceBookings();
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [selectedSpaceForBooking, setSelectedSpaceForBooking] = useState<RentalSpace | null>(null);

  const saveRentalSpacesAction = useCallback(
    (spaces: RentalSpace[]) => {
      setRentalSpaces(spaces);
      const cId = erpData?.companyId || DEFAULT_COMPANY_ID;
      saveRentalSpaces(spaces);
      if (isSupabaseConfigured && cId) {
        Promise.all(spaces.map((s) => spacesSvc.upsertRentalSpace(s, cId))).catch(console.error);
      }
      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "SETTINGS",
          "spaces-list",
          "القاعات ومساحات العمل",
          `تحديث دليل قاعات التدريب ومساحات العمل (${spaces.length} مساحة)`,
          `Updated smart rental spaces directory (${spaces.length} spaces)`
        );
      }
    },
    [erpData?.companyId, onAuditLog]
  );

  const saveSpaceBookingsAction = useCallback(
    (bookings: SpaceBooking[]) => {
      setSpaceBookings(bookings);
      const cId = erpData?.companyId || DEFAULT_COMPANY_ID;
      saveSpaceBookings(bookings);
      if (isSupabaseConfigured && cId) {
        Promise.all(bookings.map((b) => spacesSvc.upsertSpaceBooking(b, cId))).catch(console.error);
      }
      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "SETTINGS",
          "bookings-list",
          "حجوزات القاعات",
          `تحديث قائمة حجوزات القاعات والمساحات (${bookings.length} حجز)`,
          `Updated space reservations (${bookings.length} bookings)`
        );
      }
    },
    [erpData?.companyId, onAuditLog]
  );

  const confirmBookingAction = useCallback(
    (newBooking: SpaceBooking, autoGenerateVoucher: boolean = true) => {
      const currentVouchers = vouchersListProp || erpData?.vouchersList || loadVouchers();
      const currentCustomers = customersListProp || erpData?.customersList || loadCustomers();
      const currentSettings = companySettingsProp || erpData?.companySettings || loadCompanySettings();
      const branchId = activeBranchIdProp || "branch-sohar";
      const user = userNameProp || "المستخدم";

      const result = confirmSpaceBooking({
        newBooking,
        autoGenerateVoucher,
        vouchersList: currentVouchers,
        spaceBookingsList: spaceBookings,
        customersList: currentCustomers,
        companySettings: currentSettings,
        activeBranchId: branchId,
        userName: user
      });

      if (result.newVoucher) {
        if (onVouchersUpdated) {
          onVouchersUpdated(result.updatedVouchers, result.newVoucher);
        } else if (erpData?.setVouchersList) {
          erpData.setVouchersList(result.updatedVouchers);
        } else {
          saveVouchers(result.updatedVouchers);
        }
      }

      setSpaceBookings(result.updatedBookings);
      saveSpaceBookings(result.updatedBookings);
      const cId = erpData?.companyId || DEFAULT_COMPANY_ID;
      if (isSupabaseConfigured && cId) {
        Promise.all(result.updatedBookings.map((b) => spacesSvc.upsertSpaceBooking(b, cId))).catch(console.error);
      }

      if (result.newCustomerCreated) {
        if (onCustomersUpdated) {
          onCustomersUpdated(result.updatedCustomers);
        } else if (erpData?.setCustomersList) {
          erpData.setCustomersList(result.updatedCustomers);
        } else {
          saveCustomers(result.updatedCustomers);
        }
      }

      if (result.shouldNavigateToPreview && onNavigateToPreview) {
        onNavigateToPreview();
      }

      if (onAuditLog) {
        result.auditLogsToCreate.forEach((log) => {
          onAuditLog(log.action, log.module, log.entityId, log.entityName, log.descAr, log.descEn);
        });
      }
    },
    [
      spaceBookings,
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
    (booking: SpaceBooking) => {
      const result = confirmSpaceBooking({
        newBooking: booking,
        autoGenerateVoucher: true,
        vouchersList: vouchersListProp || erpData?.vouchersList || loadVouchers(),
        spaceBookingsList: spaceBookings,
        customersList: customersListProp || erpData?.customersList || loadCustomers(),
        companySettings: companySettingsProp || erpData?.companySettings || loadCompanySettings(),
        activeBranchId: activeBranchIdProp || "branch-sohar",
        userName: userNameProp || "المستخدم"
      });

      if (result.newVoucher) {
        if (onVouchersUpdated) {
          onVouchersUpdated(result.updatedVouchers, result.newVoucher);
        } else if (erpData?.setVouchersList) {
          erpData.setVouchersList(result.updatedVouchers);
        } else {
          saveVouchers(result.updatedVouchers);
        }
      }

      setSpaceBookings(result.updatedBookings);
      saveSpaceBookings(result.updatedBookings);
      const cId = erpData?.companyId || DEFAULT_COMPANY_ID;
      if (isSupabaseConfigured && cId) {
        Promise.all(result.updatedBookings.map((b) => spacesSvc.upsertSpaceBooking(b, cId))).catch(console.error);
      }

      if (onNavigateToPreview) {
        onNavigateToPreview();
      }

      if (onAuditLog) {
        result.auditLogsToCreate.forEach((log) => {
          onAuditLog(log.action, log.module, log.entityId, log.entityName, log.descAr, log.descEn);
        });
      }
    },
    [
      spaceBookings,
      vouchersListProp,
      customersListProp,
      companySettingsProp,
      activeBranchIdProp,
      userNameProp,
      erpData,
      onVouchersUpdated,
      onNavigateToPreview,
      onAuditLog
    ]
  );

  const openBookingModalAction = useCallback((space?: RentalSpace | null) => {
    setSelectedSpaceForBooking(space || null);
    setIsBookingModalOpen(true);
  }, []);

  const closeBookingModalAction = useCallback(() => {
    setIsBookingModalOpen(false);
    setSelectedSpaceForBooking(null);
  }, []);

  const state = useMemo<SpacesContextState>(
    () => ({
      rentalSpaces,
      spaceBookings,
      isBookingModalOpen,
      selectedSpaceForBooking
    }),
    [rentalSpaces, spaceBookings, isBookingModalOpen, selectedSpaceForBooking]
  );

  const actions = useMemo<SpacesContextActions>(
    () => ({
      saveRentalSpaces: saveRentalSpacesAction,
      saveSpaceBookings: saveSpaceBookingsAction,
      confirmBooking: confirmBookingAction,
      issueVoucherFromBooking: issueVoucherFromBookingAction,
      openBookingModal: openBookingModalAction,
      closeBookingModal: closeBookingModalAction
    }),
    [
      saveRentalSpacesAction,
      saveSpaceBookingsAction,
      confirmBookingAction,
      issueVoucherFromBookingAction,
      openBookingModalAction,
      closeBookingModalAction
    ]
  );

  const contextValue = useMemo<SpacesContextValue>(
    () => ({
      state,
      actions
    }),
    [state, actions]
  );

  return <SpacesContext.Provider value={contextValue}>{children}</SpacesContext.Provider>;
};

export function useSpaces(): SpacesContextValue {
  const context = useContext(SpacesContext);
  if (!context) {
    throw new Error("useSpaces must be used within a SpacesProvider");
  }
  return context;
}
