import React from "react";
import {
  ReceiptVoucher,
  VoucherType,
  CompanySettings,
  DesignTheme,
  Customer,
  InventoryItem,
  StockMovement,
  PurchaseInvoice,
  Supplier,
  Branch,
  StockTransfer,
  Employee,
  AuditLogEntry,
  AuthSession,
  RecurringSchedule,
  RentalSpace,
  SpaceBooking,
  ConsultingService,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
  LeaseContract,
  AttendanceRecord,
  PayrollSlip,
  LeaveRequest,
  KioskDevice,
  Account,
  JournalEntry,
  AccountingRevisionLog,
  FiscalPeriod
} from "../types";
import { loadAuthSession } from "../utils/authManager";
import { exportToPdf } from "../utils/pdfGenerator";
import { useSpaces } from "../contexts/SpacesContext";
import { useContracts } from "../contexts/ContractsContext";
import { useServices } from "../contexts/ServicesContext";
import { useCRM } from "../contexts/CRMContext";
import { useVouchers } from "../contexts/VouchersContext";
import { useInventory } from "../contexts/InventoryContext";
import { useHR } from "../contexts/HRContext";
import { useAccounting } from "../contexts/AccountingContext";
import { useMasterData } from "../contexts/MasterDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useUIShell } from "../contexts/UIShellContext";
import { HomeDashboard } from "../components/HomeDashboard";
import { PersonalizedWorkspace } from "../components/workspace/PersonalizedWorkspace";
import { POSView } from "../components/POSView";
import { GeneralLedgerAccountsView } from "../components/accounting/GeneralLedgerAccountsView";
import { SpacesManager } from "../components/SpacesManager";
import { LeaseContractsManager } from "../components/LeaseContractsManager";
import { ServicesManager } from "../components/ServicesManager";
import { ClientBookingPortal } from "../components/ClientBookingPortal";
import { VoucherForm } from "../components/VoucherForm";
import { ReceiptPreview } from "../components/ReceiptPreview";
import { VoucherHistory } from "../components/VoucherHistory";
import { InventoryView } from "../components/InventoryView";
import { PurchasesView } from "../components/PurchasesView";
import { BranchesView } from "../components/BranchesView";
import { CRMView } from "../components/CRMView";
import { RecurringSchedulesView } from "../components/RecurringSchedulesView";
import { EmployeesManager } from "../components/EmployeesManager";
import { RequestsDashboard } from "../components/requests/RequestsDashboard";
import { SettingsStudio } from "../components/SettingsStudio";
import { SettingsCenter } from "../components/settings/SettingsCenter";
import { HelpCenterView } from "../components/help/HelpCenterView";
import { WebsiteView } from "../components/website/WebsiteView";
import CmsManagerView from "../components/cms/CmsManagerView";
import { TenantModuleAccessGuard } from "../components/tenant/TenantModuleAccessGuard";

interface AppRoutesProps {
  activeTab?: string;
  userName: string;
  onUpdateUserName: (name: string) => void;
  companySettings?: CompanySettings;
  designTheme?: DesignTheme;
  vouchersList?: ReceiptVoucher[];
  customersList?: Customer[];
  inventoryList?: InventoryItem[];
  purchasesList?: PurchaseInvoice[];
  suppliersList?: Supplier[];
  stockMovementsList?: StockMovement[];
  branchesList?: Branch[];
  stockTransfersList?: StockTransfer[];
  schedulesList?: RecurringSchedule[];
  rentalSpacesList?: RentalSpace[];
  spaceBookingsList?: SpaceBooking[];
  accountsList?: Account[];
  journalEntriesList?: JournalEntry[];
  revisionLogsList?: AccountingRevisionLog[];
  fiscalPeriodsList?: FiscalPeriod[];
  leaseContractsList?: LeaseContract[];
  consultingServicesList?: ConsultingService[];
  membershipPackagesList?: MembershipPackage[];
  tenantSubscriptionsList?: TenantSubscription[];
  serviceBookingsList?: ServiceBooking[];
  employeesList?: Employee[];
  attendanceList?: AttendanceRecord[];
  payrollSlipsList?: PayrollSlip[];
  leaveRequestsList?: LeaveRequest[];
  auditLogsList: AuditLogEntry[];
  kioskDevicesList?: KioskDevice[];
  activeEmployeeId?: string;
  activeBranchId?: string;
  activeVoucher?: ReceiptVoucher;
  authSession?: AuthSession | null;
  
  // Handlers
  onSelectAction: (actionId: string) => void;
  onNavigateTab: (tab: any) => void;
  setActiveVoucher?: (v: ReceiptVoucher) => void;
  setActiveTab: (tab: any) => void;
  onCreateVoucherForCustomer: (c: Customer) => void;
  onOpenAiAssistant: () => void;
  onOpenOnboarding: () => void;
  onSelectSpaceForBooking: (sp: RentalSpace) => void;
  onOpenBookingModal: (open: boolean) => void;
  onSelectServiceForBooking: (srv: ConsultingService) => void;
  onOpenServiceBookingModal: (open: boolean) => void;
  onSaveInventory?: (items: InventoryItem[]) => void;
  onSaveMovements?: (movements: StockMovement[]) => void;
  onSaveVouchersList?: (vouchers: ReceiptVoucher[]) => void;
  onSaveCustomersList?: (customers: Customer[]) => void;
  onAuditLog: (action: any, module: any, entityId: string, entityName: string, descAr: string, descEn: string, details?: string) => void;
  onSaveAccounts?: (accounts: Account[]) => void;
  onSaveJournalEntries?: (entries: JournalEntry[]) => void;
  onSaveRevisionLogs?: (logs: AccountingRevisionLog[]) => void;
  onSaveFiscalPeriods?: (periods: FiscalPeriod[]) => void;
  onSaveRentalSpaces: (spaces: RentalSpace[]) => void;
  onSaveSpaceBookings: (bookings: SpaceBooking[]) => void;
  onOpenBookingModalForSpace: (sp?: RentalSpace) => void;
  onIssueVoucherFromBooking: (bk: SpaceBooking) => void;
  onSaveLeaseContract?: (contract: LeaseContract) => void;
  onDeleteLeaseContract?: (id: string) => void;
  onCollectInstallment?: (contract: LeaseContract, inst: any) => void;
  onSaveDepositSettlement?: (contract: LeaseContract, deposit: any) => void;
  onShareContractWhatsApp?: (contract: LeaseContract) => void;
  onSaveConsultingService?: (srv: ConsultingService) => void;
  onDeleteConsultingService?: (id: string) => void;
  onSaveMembershipPackage?: (pkg: MembershipPackage) => void;
  onDeleteMembershipPackage?: (id: string) => void;
  onSaveTenantSubscription?: (sub: TenantSubscription) => void;
  onDeleteTenantSubscription?: (id: string) => void;
  onSaveServiceBookingList?: (bookings: ServiceBooking[]) => void;
  onOpenTenantSubModal?: (sub?: TenantSubscription) => void;
  onIssueVoucherFromServiceBooking?: (bk: ServiceBooking) => void;
  onSaveActiveVoucher?: () => void;
  onPrint?: () => void;
  onExportPdf?: () => void;
  onSaveDesignTheme?: (theme: DesignTheme) => void;
  onDeleteVoucher?: (id: string) => void;
  onDeleteMultipleVouchers?: (ids: string[]) => void;
  onDuplicateVoucher?: (v: ReceiptVoucher) => void;
  onCreateNewVoucher?: (type?: VoucherType) => void;
  onSavePurchases?: (purchases: PurchaseInvoice[]) => void;
  onSaveSuppliers?: (suppliers: Supplier[]) => void;
  onCreatePaymentVoucherFromPurchase: (po: PurchaseInvoice) => void;
  onSaveBranches?: (branches: Branch[]) => void;
  onSaveTransfers?: (transfers: StockTransfer[]) => void;
  onSetActiveBranchId?: (id: string) => void;
  onSaveCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
  onSyncCustomersWithVouchers?: () => void;
  onSaveSchedules?: (schedules: RecurringSchedule[]) => void;
  onSaveEmployees?: (employees: Employee[]) => void;
  onSaveAttendance?: (records: AttendanceRecord[]) => void;
  onSavePayrollSlips?: (slips: PayrollSlip[]) => void;
  onSaveLeaveRequests?: (requests: LeaveRequest[]) => void;
  onSelectActiveEmployee?: (id: string) => void;
  onSaveCompanySettings?: (settings: CompanySettings) => void;
  onSaveKioskDevices?: (devices: KioskDevice[]) => void;
  onClearAuditLogs: () => void;
  onOpenSecuritySettings: () => void;
  onResetDefaults?: () => void;
  getActiveEmployee?: () => any;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  activeTab: activeTabProp,
  userName,
  onUpdateUserName,
  companySettings: companySettingsProp,
  designTheme: designThemeProp,
  vouchersList: vouchersListProp,
  customersList: customersListProp,
  inventoryList: inventoryListProp,
  purchasesList: purchasesListProp,
  suppliersList: suppliersListProp,
  stockMovementsList: stockMovementsListProp,
  branchesList: branchesListProp,
  stockTransfersList: stockTransfersListProp,
  schedulesList: schedulesListProp,
  rentalSpacesList,
  spaceBookingsList,
  accountsList: accountsListProp,
  journalEntriesList: journalEntriesListProp,
  revisionLogsList: revisionLogsListProp,
  fiscalPeriodsList: fiscalPeriodsListProp,
  leaseContractsList,
  consultingServicesList,
  membershipPackagesList,
  tenantSubscriptionsList,
  serviceBookingsList,
  employeesList: employeesListProp,
  attendanceList: attendanceListProp,
  payrollSlipsList: payrollSlipsListProp,
  leaveRequestsList: leaveRequestsListProp,
  auditLogsList,
  kioskDevicesList: kioskDevicesListProp,
  activeEmployeeId: activeEmployeeIdProp,
  activeBranchId: activeBranchIdProp,
  activeVoucher: activeVoucherProp,
  authSession,
  onSelectAction,
  onNavigateTab,
  setActiveVoucher: setActiveVoucherProp,
  setActiveTab,
  onCreateVoucherForCustomer,
  onOpenAiAssistant,
  onOpenOnboarding,
  onSelectSpaceForBooking,
  onOpenBookingModal,
  onSelectServiceForBooking,
  onOpenServiceBookingModal,
  onSaveInventory: onSaveInventoryProp,
  onSaveMovements: onSaveMovementsProp,
  onSaveVouchersList,
  onSaveCustomersList,
  onAuditLog,
  onSaveAccounts: onSaveAccountsProp,
  onSaveJournalEntries: onSaveJournalEntriesProp,
  onSaveRevisionLogs: onSaveRevisionLogsProp,
  onSaveFiscalPeriods: onSaveFiscalPeriodsProp,
  onSaveRentalSpaces,
  onSaveSpaceBookings,
  onOpenBookingModalForSpace,
  onIssueVoucherFromBooking,
  onSaveLeaseContract,
  onDeleteLeaseContract,
  onCollectInstallment,
  onSaveDepositSettlement,
  onShareContractWhatsApp,
  onSaveConsultingService,
  onDeleteConsultingService,
  onSaveMembershipPackage,
  onDeleteMembershipPackage,
  onSaveTenantSubscription,
  onDeleteTenantSubscription,
  onSaveServiceBookingList,
  onOpenTenantSubModal,
  onIssueVoucherFromServiceBooking,
  onSaveActiveVoucher: onSaveActiveVoucherProp,
  onPrint: onPrintProp,
  onExportPdf: onExportPdfProp,
  onSaveDesignTheme: onSaveDesignThemeProp,
  onDeleteVoucher: onDeleteVoucherProp,
  onDeleteMultipleVouchers: onDeleteMultipleVouchersProp,
  onDuplicateVoucher: onDuplicateVoucherProp,
  onCreateNewVoucher: onCreateNewVoucherProp,
  onSavePurchases: onSavePurchasesProp,
  onSaveSuppliers: onSaveSuppliersProp,
  onCreatePaymentVoucherFromPurchase,
  onSaveBranches: onSaveBranchesProp,
  onSaveTransfers: onSaveTransfersProp,
  onSetActiveBranchId: onSetActiveBranchIdProp,
  onSaveCustomer: onSaveCustomerProp,
  onDeleteCustomer: onDeleteCustomerProp,
  onSyncCustomersWithVouchers: onSyncCustomersWithVouchersProp,
  onSaveSchedules: onSaveSchedulesProp,
  onSaveEmployees: onSaveEmployeesProp,
  onSaveAttendance: onSaveAttendanceProp,
  onSavePayrollSlips: onSavePayrollSlipsProp,
  onSaveLeaveRequests: onSaveLeaveRequestsProp,
  onSelectActiveEmployee: onSelectActiveEmployeeProp,
  onSaveCompanySettings: onSaveCompanySettingsProp,
  onSaveKioskDevices: onSaveKioskDevicesProp,
  onClearAuditLogs,
  onOpenSecuritySettings,
  onResetDefaults: onResetDefaultsProp,
  getActiveEmployee: getActiveEmployeeProp
}) => {
  const { state: masterDataState, actions: masterDataActions } = useMasterData();
  const { state: authState } = useAuth();
  const { state: uiState } = useUIShell();
  const { state: spacesState, actions: spacesActions } = useSpaces();
  const { state: contractsState, actions: contractsActions } = useContracts();
  const { state: servicesState, actions: servicesActions } = useServices();
  const { state: crmState, actions: crmActions } = useCRM();
  const { state: vouchersState, actions: vouchersActions } = useVouchers();
  const { state: inventoryState, actions: inventoryActions } = useInventory();
  const { state: hrState, actions: hrActions, getActiveEmployee: getActiveEmployeeFromHR } = useHR();
  const { state: accountingState, actions: accountingActions } = useAccounting();

  const activeTab = activeTabProp || uiState.activeTab;
  const currentAuthSession = authSession !== undefined ? authSession : authState.authSession;

  const branchesList = branchesListProp || masterDataState.branches;
  const activeBranchId = activeBranchIdProp || masterDataState.activeBranchId;
  const schedulesList = schedulesListProp || masterDataState.schedules;
  const companySettings = companySettingsProp || masterDataState.companySettings;
  const designTheme = designThemeProp || masterDataState.designTheme;

  const handleSaveBranches = onSaveBranchesProp || masterDataActions.saveBranches;
  const handleSetActiveBranchId = onSetActiveBranchIdProp || masterDataActions.saveActiveBranchId;
  const handleSaveSchedules = onSaveSchedulesProp || masterDataActions.saveSchedules;
  const handleSaveCompanySettings = onSaveCompanySettingsProp || masterDataActions.saveCompanySettings;
  const handleSaveDesignTheme = onSaveDesignThemeProp || masterDataActions.saveDesignTheme;
  const handleResetDefaults = onResetDefaultsProp || masterDataActions.resetDefaults;

  const accountsList = accountsListProp || accountingState.accounts;
  const journalEntriesList = journalEntriesListProp || accountingState.journalEntries;
  const revisionLogsList = revisionLogsListProp || accountingState.revisionLogs;
  const fiscalPeriodsList = fiscalPeriodsListProp || accountingState.fiscalPeriods;

  const handleSaveAccounts = onSaveAccountsProp || accountingActions.saveAccounts;
  const handleSaveJournalEntries = onSaveJournalEntriesProp || accountingActions.saveJournalEntries;
  const handleSaveRevisionLogs = onSaveRevisionLogsProp || accountingActions.saveRevisionLogs;
  const handleSaveFiscalPeriods = onSaveFiscalPeriodsProp || accountingActions.saveFiscalPeriods;

  const vouchersList = vouchersListProp || vouchersState.vouchers;
  const activeVoucher = activeVoucherProp || vouchersState.activeVoucher;

  const inventoryList = inventoryListProp || inventoryState.inventory;
  const purchasesList = purchasesListProp || inventoryState.purchases;
  const suppliersList = suppliersListProp || inventoryState.suppliers;
  const stockMovementsList = stockMovementsListProp || inventoryState.stockMovements;
  const stockTransfersList = stockTransfersListProp || inventoryState.stockTransfers;

  const employeesList = employeesListProp || hrState.employees;
  const attendanceList = attendanceListProp || hrState.attendance;
  const payrollSlipsList = payrollSlipsListProp || hrState.payrollSlips;
  const leaveRequestsList = leaveRequestsListProp || hrState.leaveRequests;
  const kioskDevicesList = kioskDevicesListProp || hrState.kioskDevices;
  const activeEmployeeId = activeEmployeeIdProp || hrState.activeEmployeeId;

  const handleSaveEmployees = onSaveEmployeesProp || hrActions.saveEmployees;
  const handleSaveAttendance = onSaveAttendanceProp || hrActions.saveAttendance;
  const handleSavePayrollSlips = onSavePayrollSlipsProp || hrActions.savePayrollSlips;
  const handleSaveLeaveRequests = onSaveLeaveRequestsProp || hrActions.saveLeaveRequests;
  const handleSaveKioskDevices = onSaveKioskDevicesProp || hrActions.saveKioskDevices;
  const handleSelectActiveEmployee = onSelectActiveEmployeeProp || hrActions.selectActiveEmployee;
  const getActiveEmployee = getActiveEmployeeProp || getActiveEmployeeFromHR;

  const handleSaveInventory = onSaveInventoryProp || inventoryActions.saveInventory;
  const handleSavePurchases = onSavePurchasesProp || inventoryActions.savePurchases;
  const handleSaveSuppliers = onSaveSuppliersProp || inventoryActions.saveSuppliers;
  const handleSaveMovements = onSaveMovementsProp || inventoryActions.saveStockMovements;
  const handleSaveTransfers = onSaveTransfersProp || inventoryActions.saveStockTransfers;
  const handleSaveActiveVoucher = onSaveActiveVoucherProp || vouchersActions.saveActiveVoucher;
  const handlePrint = onPrintProp || vouchersActions.printVoucher;
  const handleExportPdf = onExportPdfProp || vouchersActions.exportPdfVoucher;
  const handleDeleteVoucher = onDeleteVoucherProp || vouchersActions.deleteVoucher;
  const handleDeleteMultipleVouchers = onDeleteMultipleVouchersProp || vouchersActions.deleteMultipleVouchers;
  const handleDuplicateVoucher = onDuplicateVoucherProp || vouchersActions.duplicateVoucher;
  const handleCreateNewVoucher = onCreateNewVoucherProp || vouchersActions.createNewVoucher;
  const handleSetActiveVoucher = setActiveVoucherProp || vouchersActions.setActiveVoucher;

  const customersList = customersListProp || crmState.customers;
  const handleSaveCustomer = onSaveCustomerProp || crmActions.saveCustomer;
  const handleDeleteCustomer = onDeleteCustomerProp || crmActions.deleteCustomer;
  const handleSyncCustomersWithVouchers = onSyncCustomersWithVouchersProp || (() => crmActions.syncCustomersWithVouchers(vouchersList));

  const contractsList = leaseContractsList || contractsState.leaseContracts;
  const handleSaveContract = onSaveLeaseContract || contractsActions.saveContract;
  const handleCollectInstallmentAction = onCollectInstallment || contractsActions.collectInstallment;

  return (
    <>
      {activeTab === "home" && (
        <PersonalizedWorkspace
          userName={userName}
          onNavigateTab={onNavigateTab}
          onSelectAction={onSelectAction}
        />
      )}

      {activeTab === "help" && (
        <HelpCenterView
          onNavigateTab={onNavigateTab}
          onOpenAiAssistant={onOpenAiAssistant}
          onOpenOnboarding={onOpenOnboarding}
        />
      )}

      {activeTab === "website" && (
        <WebsiteView
          onOpenERPModule={(tab) => onNavigateTab(tab as any)}
          onOpenSpaceBookingModal={(spaceName) => {
            let found: RentalSpace | null = null;
            if (spaceName) {
              const currentSpaces = rentalSpacesList || spacesState.rentalSpaces;
              found = currentSpaces.find(s => s.name.includes(spaceName) || spaceName.includes(s.name)) || null;
            }
            if (onSelectSpaceForBooking && found) onSelectSpaceForBooking(found);
            if (onOpenBookingModal) onOpenBookingModal(true);
            else spacesActions.openBookingModal(found);
          }}
          onOpenServiceBookingModal={(serviceName) => {
            const currentServices = consultingServicesList || servicesState.consultingServices;
            let found: ConsultingService | null = null;
            if (serviceName) {
              found = currentServices.find(s => s.name.includes(serviceName) || serviceName.includes(s.name)) || null;
            }
            if (onSelectServiceForBooking && found) onSelectServiceForBooking(found);
            if (onOpenServiceBookingModal) onOpenServiceBookingModal(true);
            else servicesActions.openBookingModal(found);
          }}
        />
      )}

      {activeTab === "cms" && (() => {
        const activeSession = currentAuthSession;
        const cmsCompanyId = (activeSession?.user as any)?.companyId || companySettings?.id || "";
        const cmsUserId = activeSession?.user?.id || "";
        const cmsUserRole = activeSession?.user?.role || "VIEWER";
        const cmsUserName = activeSession?.user?.fullName || userName || "مستخدم";
        return (
          <CmsManagerView
            companyId={cmsCompanyId}
            userId={cmsUserId}
            userRole={cmsUserRole}
            userName={cmsUserName}
          />
        );
      })()}

      {activeTab === "pos" && (
        <TenantModuleAccessGuard moduleCode="pos" moduleTitleAr="نقطة البيع الكاشير" moduleTitleEn="POS Terminal">
          <POSView
            inventory={inventoryList}
            customers={customersList}
            branches={branchesList}
            activeBranchId={activeBranchId}
            activeEmployee={getActiveEmployee()}
            companySettings={companySettings}
            vouchers={vouchersList}
            onSaveInventory={handleSaveInventory}
            onSaveMovements={handleSaveMovements}
            onSaveVouchers={onSaveVouchersList}
            onSaveCustomers={onSaveCustomersList}
            onAuditLog={onAuditLog}
            onNavigateToTab={setActiveTab}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "accounting" && (
        <TenantModuleAccessGuard moduleCode="accounting" moduleTitleAr="الأستاذ العام والمحاسبة" moduleTitleEn="General Ledger">
          <GeneralLedgerAccountsView
            accounts={accountsList}
            journalEntries={journalEntriesList}
            revisionLogs={revisionLogsList}
            fiscalPeriods={fiscalPeriodsList}
            branches={branchesList}
            companySettings={companySettings}
            vouchers={vouchersList}
            purchases={purchasesList}
            payrollSlips={payrollSlipsList}
            onSaveAccounts={handleSaveAccounts}
            onSaveJournalEntries={handleSaveJournalEntries}
            onSaveRevisionLogs={handleSaveRevisionLogs}
            onSaveFiscalPeriods={handleSaveFiscalPeriods}
            currentUserName={userName}
            activeBranchId={activeBranchId}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "spaces" && (
        <TenantModuleAccessGuard moduleCode="spaces" moduleTitleAr="إدارة المساحات والقاعات" moduleTitleEn="Rental Spaces">
          <SpacesManager
            branches={branchesList}
            session={currentAuthSession}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "contracts" && (
        <TenantModuleAccessGuard moduleCode="spaces" moduleTitleAr="عقود الإيجار والخدمات" moduleTitleEn="Lease Contracts">
          <LeaseContractsManager
            spaces={rentalSpacesList || spacesState.rentalSpaces}
            branches={branchesList}
            customers={customersList}
            packages={membershipPackagesList || servicesState.membershipPackages}
            companySettings={companySettings}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "services" && (
        <TenantModuleAccessGuard moduleCode="services" moduleTitleAr="إدارة الخدمات والباقات" moduleTitleEn="Consulting Services">
          <ServicesManager
            branches={branchesList}
            customers={customersList}
            session={currentAuthSession}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "portal" && (
        <TenantModuleAccessGuard moduleCode="services" moduleTitleAr="بوابة حجز الخدمات الذاتية" moduleTitleEn="Client Booking Portal">
          <ClientBookingPortal
            services={consultingServicesList || servicesState.consultingServices}
            spaces={rentalSpacesList || spacesState.rentalSpaces}
            branches={branchesList}
            customers={customersList}
            subscriptions={tenantSubscriptionsList || servicesState.tenantSubscriptions}
            packages={membershipPackagesList || servicesState.membershipPackages}
            onBookService={(srv) => {
              if (onSelectServiceForBooking) onSelectServiceForBooking(srv);
              else servicesActions.openBookingModal(srv);
            }}
            onBookSpace={onOpenBookingModalForSpace}
            onNavigateTab={setActiveTab}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "editor" && (
        <TenantModuleAccessGuard moduleCode="vouchers" moduleTitleAr="تحرير السندات" moduleTitleEn="Voucher Form">
          <VoucherForm
            voucher={activeVoucher}
            onChange={handleSetActiveVoucher}
            onSave={handleSaveActiveVoucher}
            onPreview={() => setActiveTab("preview")}
            onOpenAiAssistant={onOpenAiAssistant}
            customers={customersList}
            branches={branchesList}
            companySettings={companySettings}
            onQuickSaveCustomer={handleSaveCustomer}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "preview" && (
        <TenantModuleAccessGuard moduleCode="vouchers" moduleTitleAr="معاينة السندات" moduleTitleEn="Receipt Preview">
          <ReceiptPreview
            voucher={activeVoucher}
            settings={companySettings}
            theme={designTheme}
            onPrint={() => typeof handlePrint === "function" && handlePrint()}
            onExportPdf={() => typeof handleExportPdf === "function" && handleExportPdf()}
            onUpdateTheme={handleSaveDesignTheme}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "history" && (
        <TenantModuleAccessGuard moduleCode="vouchers" moduleTitleAr="سجل السندات والفواتير" moduleTitleEn="Voucher History">
          <VoucherHistory
            vouchers={vouchersList}
            settings={companySettings}
            theme={designTheme}
            onSelectVoucher={(v) => {
              if (v && typeof v === "object" && "voucherNumber" in v) {
                handleSetActiveVoucher(v);
                setActiveTab("editor");
              }
            }}
            onDeleteVoucher={(id) => typeof handleDeleteVoucher === "function" && handleDeleteVoucher(id)}
            onDeleteMultipleVouchers={(ids) => typeof handleDeleteMultipleVouchers === "function" && handleDeleteMultipleVouchers(ids)}
            onDuplicateVoucher={(v) => typeof handleDuplicateVoucher === "function" && handleDuplicateVoucher(v)}
            onNewVoucher={() => typeof handleCreateNewVoucher === "function" && handleCreateNewVoucher()}
            onPrintVoucher={(v) => {
              if (v && typeof v === "object" && "voucherNumber" in v) {
                handleSetActiveVoucher(v);
                if (typeof handlePrint === "function") handlePrint(v);
              }
            }}
            onExportPdfVoucher={(v) => {
              if (v && typeof v === "object" && "voucherNumber" in v) {
                handleSetActiveVoucher(v);
                if (typeof handleExportPdf === "function") handleExportPdf(v);
              }
            }}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "inventory" && (
        <TenantModuleAccessGuard moduleCode="inventory" moduleTitleAr="المخزون والمستودعات" moduleTitleEn="Inventory Management">
          <InventoryView
            inventory={inventoryList}
            movements={stockMovementsList}
            companySettings={companySettings}
            branches={branchesList}
            onSaveInventory={handleSaveInventory}
            onSaveMovements={handleSaveMovements}
            onNavigateToPurchases={() => setActiveTab("purchases")}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "purchases" && (
        <TenantModuleAccessGuard moduleCode="purchases" moduleTitleAr="المشتريات والموردين" moduleTitleEn="Purchases Management">
          <PurchasesView
            purchases={purchasesList}
            suppliers={suppliersList}
            inventory={inventoryList}
            movements={stockMovementsList}
            companySettings={companySettings}
            branches={branchesList}
            onSavePurchases={handleSavePurchases}
            onSaveSuppliers={handleSaveSuppliers}
            onSaveInventory={handleSaveInventory}
            onSaveMovements={handleSaveMovements}
            onCreatePaymentVoucher={onCreatePaymentVoucherFromPurchase}
            onNavigateToInventory={() => setActiveTab("inventory")}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "branches" && (
        <TenantModuleAccessGuard moduleCode="management" moduleTitleAr="الفروع والمناقلات" moduleTitleEn="Branches & Transfers">
          <BranchesView
            branches={branchesList}
            activeBranchId={activeBranchId}
            transfers={stockTransfersList}
            vouchers={vouchersList}
            inventory={inventoryList}
            purchases={purchasesList}
            companySettings={companySettings}
            onSaveBranches={handleSaveBranches}
            onSaveTransfers={handleSaveTransfers}
            onSelectActiveBranch={handleSetActiveBranchId}
            onUpdateInventoryAfterTransfer={handleSaveInventory}
            onNavigateToVouchersByBranch={() => {
              setActiveTab("history");
            }}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "crm" && (
        <TenantModuleAccessGuard moduleCode="crm" moduleTitleAr="إدارة علاقات العملاء (CRM)" moduleTitleEn="CRM & Customers">
          <CRMView
            customers={customersList}
            vouchers={vouchersList}
            leaseContracts={contractsList}
            subscriptions={tenantSubscriptionsList || servicesState.tenantSubscriptions}
            packages={membershipPackagesList || servicesState.membershipPackages}
            services={consultingServicesList || servicesState.consultingServices}
            serviceBookings={serviceBookingsList || servicesState.serviceBookings}
            spaces={rentalSpacesList}
            branches={branchesList}
            companySettings={companySettings}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onCreateVoucherForCustomer={onCreateVoucherForCustomer}
            onViewVoucher={(v) => {
              handleSetActiveVoucher(v);
              setActiveTab("preview");
            }}
            onSyncWithVouchers={handleSyncCustomersWithVouchers}
            onSaveContract={handleSaveContract}
            onCollectInstallment={handleCollectInstallmentAction}
            onSaveSubscription={onSaveTenantSubscription || servicesActions.saveSubscription}
            onSaveServiceBooking={(bk) => {
              if (onSaveServiceBookingList) {
                const currentBookings = serviceBookingsList || servicesState.serviceBookings;
                const exists = currentBookings.some((b) => b.id === bk.id);
                const updated = exists ? currentBookings.map((b) => b.id === bk.id ? bk : b) : [bk, ...currentBookings];
                onSaveServiceBookingList(updated);
              } else {
                servicesActions.confirmBooking(bk);
              }
            }}
            onOpenServiceBookingModal={(srv) => {
              if (onSelectServiceForBooking) onSelectServiceForBooking(srv);
              else servicesActions.openBookingModal(srv);
            }}
            onOpenTenantSubModal={(sub) => {
              if (onOpenTenantSubModal) onOpenTenantSubModal(sub);
              else servicesActions.openSubscriptionModal(sub);
            }}
            onOpenSpaceBookingModal={onOpenBookingModalForSpace}
            onNavigateTab={setActiveTab}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "schedules" && (
        <TenantModuleAccessGuard moduleCode="vouchers" moduleTitleAr="جدولة الأقساط والتحصيل الدوري" moduleTitleEn="Recurring Schedules">
          <RecurringSchedulesView
            schedules={schedulesList}
            vouchers={vouchersList}
            customers={customersList}
            suppliers={suppliersList}
            branches={branchesList}
            activeBranchId={activeBranchId}
            companySettings={companySettings}
            onSaveSchedules={handleSaveSchedules}
            onSaveVouchers={onSaveVouchersList}
            onViewVoucher={(v) => {
              handleSetActiveVoucher(v);
              setActiveTab("preview");
            }}
            onAuditLog={onAuditLog}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "employees" && (
        <TenantModuleAccessGuard moduleCode="hr" moduleTitleAr="الموارد البشرية والرواتب" moduleTitleEn="HR & Payroll">
          <EmployeesManager
            employees={employeesList || []}
            branches={branchesList || []}
            companySettings={companySettings}
            activeEmployeeId={activeEmployeeId}
            attendanceRecords={attendanceList || []}
            payrollSlips={payrollSlipsList || []}
            leaveRequests={leaveRequestsList || []}
            vouchers={vouchersList || []}
            onSaveEmployees={handleSaveEmployees}
            onSaveAttendance={handleSaveAttendance}
            onSavePayrollSlips={handleSavePayrollSlips}
            onSaveLeaveRequests={handleSaveLeaveRequests}
            onSelectActiveEmployee={handleSelectActiveEmployee}
            onSaveVouchers={onSaveVouchersList}
            onViewVoucher={(v) => {
              handleSetActiveVoucher(v);
              setActiveTab("preview");
            }}
            onAuditLog={onAuditLog}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "requests" && (
        <TenantModuleAccessGuard moduleCode="requests" moduleTitleAr="طلبات ونماذج الموظفين" moduleTitleEn="Staff Requests & Forms">
          <RequestsDashboard
            employees={employeesList}
            branches={branchesList}
            currentEmployee={employeesList.find((e) => e.id === activeEmployeeId)}
            companySettings={companySettings}
          />
        </TenantModuleAccessGuard>
      )}

      {activeTab === "settings" && (
        <TenantModuleAccessGuard moduleCode="management" moduleTitleAr="إعدادات المنظومة" moduleTitleEn="System Settings">
          <SettingsCenter
            settings={companySettings}
            theme={designTheme}
            employees={employeesList}
            branches={branchesList}
            auditLogs={auditLogsList}
            kioskDevices={kioskDevicesList}
            onSaveSettings={handleSaveCompanySettings}
            onSaveTheme={handleSaveDesignTheme}
            onSaveEmployees={handleSaveEmployees}
            onSaveKioskDevices={handleSaveKioskDevices}
            onClearAuditLogs={onClearAuditLogs}
            onOpenSecuritySettings={onOpenSecuritySettings}
            onResetDefaults={handleResetDefaults}
          />
        </TenantModuleAccessGuard>
      )}
    </>
  );
};
