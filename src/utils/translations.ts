export type Language = "ar" | "en";

export interface TranslationDictionary {
  // Brand & General
  appName: string;
  appSubtitle: string;
  appVersion: string;
  online: string;
  offline: string;
  pwaReady: string;
  searchPlaceholder: string;
  filterAll: string;
  actions: string;
  save: string;
  saving: string;
  saved: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  create: string;
  update: string;
  print: string;
  exportPdf: string;
  share: string;
  copy: string;
  copied: string;
  close: string;
  confirm: string;
  back: string;
  next: string;
  previous: string;
  all: string;
  active: string;
  inactive: string;
  status: string;
  date: string;
  dueDate: string;
  notes: string;
  currency: string;
  amount: string;
  subtotal: string;
  tax: string;
  vat: string;
  discount: string;
  total: string;
  netTotal: string;
  yes: string;
  no: string;
  loading: string;
  noDataFound: string;
  quickActions: string;
  overview: string;
  details: string;
  language: string;
  arabic: string;
  english: string;
  switchLanguage: string;
  bilingual: string;
  langBilingual: string;
  langArabic: string;
  langEnglish: string;
  printLanguage: string;

  // Navigation Tabs
  tabHome: string;
  tabPos: string;
  tabEditor: string;
  tabPreview: string;
  tabHistory: string;
  tabCrm: string;
  tabInventory: string;
  tabPurchases: string;
  tabBranches: string;
  tabSettings: string;
  tabEmployees: string;

  // Voucher Types
  voucherType: string;
  voucherTypeReceipt: string;
  voucherTypePayment: string;
  voucherTypePettyCash: string;
  voucherTypeTaxInvoice: string;
  voucherTypeQuotation: string;
  receiptVoucher: string;
  paymentVoucher: string;
  pettyCashVoucher: string;
  taxInvoiceVoucher: string;
  allTypes: string;

  // Payment Methods
  paymentMethod: string;
  paymentMethodCash: string;
  paymentMethodBankTransfer: string;
  paymentMethodCheck: string;
  paymentMethodCreditCard: string;
  paymentMethodOnline: string;
  paymentMethodOther: string;

  // Voucher Statuses
  voucherStatusIssued: string;
  voucherStatusDraft: string;
  voucherStatusPaid: string;
  voucherStatusCancelled: string;
  allStatuses: string;
  paid: string;
  issued: string;
  draft: string;
  cancelled: string;

  // Voucher Form Fields
  voucherInfo: string;
  voucherNumber: string;
  referenceNumber: string;
  voucherDate: string;
  assignedBranch: string;
  mainBranch: string;
  partyDetails: string;
  receivedFrom: string;
  paidTo: string;
  clientPayer: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  customerAddress: string;
  clientTaxId: string;
  taxNumber: string;
  financialBreakdown: string;
  category: string;
  paymentDetails: string;
  checkNumber: string;
  bankName: string;
  transferRef: string;
  transactionRef: string;
  amountInWords: string;
  autoWords: string;
  customWords: string;
  lineItems: string;
  addItem: string;
  itemDescription: string;
  description: string;
  quantity: string;
  unitPrice: string;
  itemAmount: string;
  taxRate: string;
  taxRatePercent: string;
  discountAmount: string;
  termsAndConditions: string;
  authorizedSignatory: string;
  signatures: string;
  preparedBy: string;
  approvedBy: string;
  receivedBy: string;
  newVoucher: string;
  quickAiAssist: string;
  aiAssistTitle: string;
  saveVoucher: string;
  customFields: string;
  createNew: string;
  type: string;
  totalAmount: string;
  noVouchersFound: string;
  duplicate: string;

  // Dashboard Metrics & Headers
  dashboardWelcome: string;
  dashboardSubtitle: string;
  totalCollections: string;
  totalPayments: string;
  netCashflow: string;
  activeClientsCount: string;
  inventoryValuation: string;
  recentVouchers: string;
  quickCreateVoucher: string;
  financialInsights: string;
  monthlyRevenueChart: string;
  branchPerformance: string;
  stockAlerts: string;

  // History & Filters
  historyTitle: string;
  historySubtitle: string;
  allVouchers: string;
  bulkExport: string;
  filterByType: string;
  filterByStatus: string;
  filterByBranch: string;
  filterByDateRange: string;
  duplicateVoucher: string;
  deleteConfirmation: string;
  deleteSelectedConfirm: string;
  generatingBatch: string;
  completed: string;
  totalInflow: string;
  totalOutflow: string;
  totalRecordsLogged: string;
  vouchersCount: string;
  selected: string;
  bulkActionHint: string;
  downloadZip: string;
  mergedPdf: string;
  printSelected: string;
  deleteSelected: string;
  deselectAll: string;
  selectAll: string;

  // CRM Module
  crmTitle: string;
  crmSubtitle: string;
  addCustomer: string;
  customerName: string;
  customerCompany: string;
  customerPhone: string;
  customerEmail: string;
  customerType: string;
  customerBalance: string;
  statementOfAccount: string;
  newInteraction: string;
  lead: string;
  corporate: string;
  individual: string;
  vip: string;

  // Inventory Module
  inventoryTitle: string;
  inventorySubtitle: string;
  addItemStock: string;
  stockTransfers: string;
  stockMovements: string;
  itemName: string;
  skuCode: string;
  stockQty: string;
  minStockAlert: string;
  unitCostPrice: string;
  sellingPrice: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
  adjustStock: string;
  transferStock: string;

  // Purchases Module
  purchasesTitle: string;
  purchasesSubtitle: string;
  newPurchaseOrder: string;
  suppliersManager: string;
  supplierName: string;
  purchaseInvoiceNo: string;
  paymentStatus: string;
  receivedStock: string;
  pendingDelivery: string;

  // Branches Module
  branchesTitle: string;
  branchesSubtitle: string;
  addBranch: string;
  branchCode: string;
  branchName: string;
  branchManager: string;
  branchCity: string;
  headquarters: string;
  stockTransferDispatch: string;

  // Employees & Roles Module
  employeesTitle: string;
  employeesSubtitle: string;
  addEmployee: string;
  employeeCode: string;
  fullNameAr: string;
  fullNameEn: string;
  civilId: string;
  jobTitle: string;
  department: string;
  role: string;
  hireDate: string;
  basicSalary: string;
  allowances: string;
  totalSalary: string;
  bankIban: string;
  permissionsMatrix: string;
  activeOperator: string;
  setActiveUser: string;

  // Settings Module
  settingsTitle: string;
  settingsSubtitle: string;
  settingsStudioTitle: string;
  settingsStudioSubtitle: string;
  resetDefaults: string;
  saveSettings: string;
  settingsSavedSuccess: string;
  tabCompany: string;
  tabBrand: string;
  tabTheme: string;
  tabNotices: string;
  tabBank: string;
  companyProfile: string;
  companyProfileTitle: string;
  companyLegalName: string;
  businessTagline: string;
  taxIdNumber: string;
  crNumber: string;
  taxRegistrationNo: string;
  streetAddress: string;
  cityStateZip: string;
  country: string;
  defaultCurrency: string;
  primaryPhone: string;
  phoneNumbers: string;
  billingEmail: string;
  emailAddress: string;
  physicalAddress: string;
  websiteUrl: string;
  brandCustomization: string;
  brandIdentityAssets: string;
  companyBrandLogo: string;
  companyLogo: string;
  uploadLogoImage: string;
  pasteLogoUrl: string;
  sampleLogoPresets: string;
  officialSealSignature: string;
  signatoryName: string;
  signatoryTitle: string;
  uploadDigitalSignature: string;
  removeSignature: string;
  digitalStamp: string;
  officialSignature: string;
  uploadOfficialStamp: string;
  removeStamp: string;
  themeStyle: string;
  themeColorsTitle: string;
  palettePresets: string;
  primaryColor: string;
  secondaryColor: string;
  templateStyle: string;
  modernClean: string;
  corporateClassic: string;
  executiveStamp: string;
  minimalistLight: string;
  thermalReceipt: string;
  pageSize: string;
  elementVisibility: string;
  showLogo: string;
  showStamp: string;
  showSignatures: string;
  showQrCode: string;
  showWatermark: string;
  showBankDetails: string;
  headerFooterTermsTitle: string;
  headerNotice: string;
  footerNotice: string;
  noticesAndTerms: string;
  bankingInfoTitle: string;
  bankDetailsSetting: string;
  accountName: string;
  accountNumber: string;
  ibanNumber: string;
  saveChanges: string;

  // Printable Vouchers & Invoices
  officialReceiptVoucher: string;
  officialPaymentVoucher: string;
  officialTaxInvoice: string;
  officialQuotation: string;
  receiptSubtitleNotice: string;
  receiptFromLabel: string;
  payToLabel: string;
  sumOfAmount: string;
  forPaymentOf: string;
  paymentMethodLabel: string;
  authorizedSignatureLabel: string;
  clientSignatureLabel: string;
  companySealLabel: string;
  qrVerificationText: string;
  verifiedOfficialDocument: string;

  // Audit Logs & Activity Tracker
  tabAuditLogs: string;
  auditLogTitle: string;
  auditLogSubtitle: string;
  totalLoggedOperations: string;
  exportLogsCsv: string;
  clearLogs: string;
  clearLogsConfirm: string;
  searchLogsPlaceholder: string;
  filterModule: string;
  filterAction: string;
  filterTime: string;
  actionCreate: string;
  actionUpdate: string;
  actionDelete: string;
  actionBatchDelete: string;
  actionPrint: string;
  actionExport: string;
  actionTransfer: string;
  actionSettingsUpdate: string;
  actionDuplicate: string;
  actionLogin: string;
  moduleVouchers: string;
  moduleCrm: string;
  moduleInventory: string;
  modulePurchases: string;
  moduleBranches: string;
  moduleEmployees: string;
  moduleSettings: string;
  moduleSystem: string;
  performedBy: string;
  operatorRole: string;
  timestamp: string;
  logDetails: string;
  noAuditLogs: string;
  logDetailModalTitle: string;
  today: string;
  last7Days: string;
  last30Days: string;
  allTime: string;
  topOperator: string;
  mostActiveModule: string;
  criticalEvents: string;

  // Dashboard Analytics
  dashboardAnalytics: string;
  analyticsSubtitle: string;
  revenueTrends: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  netMargin: string;
  topSellingProducts: string;
  categoryDistribution: string;
  recentCustomerActivity: string;
  paymentMethodBreakdown: string;
  avgTicketSize: string;
  collectionEfficiency: string;
  totalRevenueGenerated: string;
  totalPurchasesMade: string;
  liveDataSync: string;
  cashflowComparison: string;
  clientPayments: string;
  unitsSold: string;

  // Authentication & Security
  login: string;
  logout: string;
  lockScreen: string;
  unlock: string;
  emailOrUsername: string;
  password: string;
  enterPassword: string;
  pinCode: string;
  rememberMe: string;
  forgotPassword: string;
  magicLinkLogin: string;
  passwordLogin: string;
  staffQuickLogin: string;
  sendMagicLink: string;
  magicLinkSent: string;
  magicLinkInstruction: string;
  openMagicLink: string;
  copyMagicLink: string;
  resetPassword: string;
  requestResetCode: string;
  verificationCode: string;
  newPassword: string;
  confirmNewPassword: string;
  currentPassword: string;
  changePassword: string;
  passwordChangedSuccess: string;
  twoFactorAuth: string;
  twoFactorEnabled: string;
  twoFactorDisabled: string;
  enable2FA: string;
  disable2FA: string;
  enter2FACode: string;
  backupCodes: string;
  activeSessions: string;
  revokeSession: string;
  revokeAllOtherSessions: string;
  securitySettings: string;
  securitySubtitle: string;
  moduleSecurity: string;
  accountLocked: string;
  invalidCredentials: string;
  loginSuccess: string;
  switchAccount: string;
  sessionExpiryNotice: string;

  // POS (Point of Sale) Keys
  posSales: string;
  newSale: string;
  holdOrder: string;
  heldOrders: string;
  recallOrder: string;
  clearCart: string;
  customItem: string;
  barcodeScanner: string;
  scanBarcode: string;
  scanOrTypeBarcode: string;
  cashierShift: string;
  openShift: string;
  closeShift: string;
  openingBalance: string;
  expectedCash: string;
  actualCash: string;
  cashDifference: string;
  cashIn: string;
  cashOut: string;
  quickCash: string;
  exactAmount: string;
  payAndPrint: string;
  payOnly: string;
  changeDue: string;
  cashReceived: string;
  splitPayment: string;
  payCash: string;
  payCard: string;
  payCredit: string;
  payBank: string;
  walkInCustomer: string;
  selectCustomer: string;
  addNewCustomer: string;
  orderCompleted: string;
  printThermalReceipt: string;
  orderHistory: string;
  refundOrder: string;
  refundReason: string;
  refundSuccess: string;
  allCategories: string;
  inStockCount: string;
  shiftReport: string;
  xReport: string;
  soundEffects: string;
  posShortcuts: string;

  // Recurring Schedules & Installments
  tabSchedules: string;
  recurringSchedules: string;
  recurringSubtitle: string;
  newSchedule: string;
  editSchedule: string;
  deleteScheduleConfirm: string;
  scheduleTitle: string;
  frequency: string;
  freqDaily: string;
  freqWeekly: string;
  freqBiweekly: string;
  freqMonthly: string;
  freqQuarterly: string;
  freqSemiAnnually: string;
  freqAnnually: string;
  nextDueDate: string;
  lastExecuted: string;
  installmentsProgress: string;
  totalOccurrences: string;
  unlimitedInstallments: string;
  postVoucherNow: string;
  postingVoucher: string;
  voucherPostedSuccess: string;
  pauseSchedule: string;
  resumeSchedule: string;
  dueToday: string;
  overdue: string;
  dueInDays: string;
  scheduleHistory: string;
  monthlyCommitments: string;
  monthlyReceivables: string;
  presetCarInstallment: string;
  presetRentQuarterly: string;
  presetInternetMonthly: string;
  presetMaintenanceContract: string;
  presetInsuranceAnnual: string;
  scheduleSimulation: string;
  scheduleCode: string;
  partyName: string;

  // Doc Wizard
  tabDocWizard: string;
  docWizardTitle: string;
  docWizardSubtitle: string;
  wizardStep1: string;
  wizardStep2: string;
  wizardStep3: string;
  wizardStep4: string;
  wizardStep5: string;
  wizardStep1Desc: string;
  wizardStep2Desc: string;
  wizardStep3Desc: string;
  wizardStep4Desc: string;
  wizardStep5Desc: string;
  livePreview: string;
  toggleLivePreview: string;
  nextStep: string;
  prevStep: string;
  issueVoucherNow: string;
  issuingVoucher: string;
  switchFullEditor: string;
  switchDocWizard: string;
  presetCorporateServices: string;
  presetHardwareSale: string;
  presetOfficeRent: string;
  presetNetworkConsulting: string;
  docCategory: string;
  docCategoryCustomer: string;
  docCategorySupplier: string;
  docCategoryTaxInvoice: string;
  docCategoryPettyCash: string;
  docCategoryQuotation: string;
  stepSummary: string;
  quickFillPresets: string;
  selectCustomerOrSupplier: string;
  addNewPartyDirect: string;
  previewSideTip: string;
  phone: string;
  email: string;
  address: string;
  vatNumber: string;
  taxAmount: string;
  issueDate: string;
  referenceNo: string;
  addLineItem: string;
  chequeNumber: string;
  chequeDate: string;
  transferRefNumber: string;
  drawDigitalSignature: string;
  currencyConversion: string;
  exchangeRates: string;
  liveExchangeRates: string;
  refreshRates: string;
  thermalPrinter80: string;
  equivalentInBase: string;
  digitalSignatureTitle: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  ar: {
    // Brand & General
    appName: "دشال لإدارة الأعمال ERP",
    appSubtitle: "منظومة دشال المتكاملة لإدارة الأعمال، المالية، عقود الإيجار، مساحات العمل، الخدمات والعملاء",
    appVersion: "الإصدار 2.5",
    online: "متصل بالإنترنت",
    offline: "وضع العمل دون إنترنت (أوفلاين)",
    pwaReady: "تطبيق PWA مثبت وجاهز",
    searchPlaceholder: "بحث برقم السند، اسم العميل، الهاتف، البيان...",
    filterAll: "عرض الكل",
    actions: "الإجراءات",
    save: "حفظ السند",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ بنجاح",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    create: "إنشاء جديد",
    update: "تحديث البيانات",
    print: "طباعة فورية",
    exportPdf: "تصدير PDF عالي الدقة",
    share: "مشاركة السند",
    copy: "نسخ",
    copied: "تم النسخ!",
    close: "إغلاق",
    confirm: "تأكيد",
    back: "رجوع",
    next: "التالي",
    previous: "السابق",
    all: "الكل",
    active: "نشط",
    inactive: "غير نشط",
    status: "الحالة",
    date: "التاريخ",
    dueDate: "تاريخ الاستحقاق",
    notes: "ملاحظات وتوجيهات",
    currency: "العملة",
    amount: "المبلغ",
    subtotal: "المجموع الفرعي",
    tax: "الضريبة",
    vat: "ضريبة القيمة المضافة (VAT)",
    discount: "الخصم",
    total: "المجموع الكلي",
    netTotal: "الصافي الإجمالي",
    yes: "نعم",
    no: "لا",
    loading: "جارٍ التحميل...",
    noDataFound: "لا توجد سجلات مطابقة",
    quickActions: "إجراءات سريعة",
    overview: "نظرة عامة",
    details: "التفاصيل",
    language: "اللغة",
    arabic: "العربية",
    english: "English",
    switchLanguage: "تغيير لغة العرض",
    bilingual: "ثنائي اللغة (عربي / English)",
    langBilingual: "ثنائي اللغة",
    langArabic: "عربي فقط",
    langEnglish: "English Only",
    printLanguage: "لغة الطباعة والتصدير",

    // Navigation Tabs
    tabHome: "الرئيسية",
    tabPos: "نقطة البيع (POS)",
    tabEditor: "تحرير السند",
    tabPreview: "المعاينة والطباعة",
    tabHistory: "سجل السندات",
    tabCrm: "إدارة العملاء",
    tabInventory: "المستودعات والمخزون",
    tabPurchases: "المشتريات والموردين",
    tabBranches: "الفروع والمناقلات",
    tabSettings: "الإعدادات والهوية",
    tabEmployees: "الموظفون والصلاحيات",

    // Voucher Types
    voucherType: "نوع السند المالي",
    voucherTypeReceipt: "سند قبض مالي",
    voucherTypePayment: "سند صرف مالي",
    voucherTypePettyCash: "سند عهدة ومصروفات نثرية",
    voucherTypeTaxInvoice: "فاتورة ضريبية رسمية",
    voucherTypeQuotation: "عرض أسعار رسمي",
    receiptVoucher: "سند قبض",
    paymentVoucher: "سند صرف",
    pettyCashVoucher: "سند عهدة",
    taxInvoiceVoucher: "فاتورة ضريبية",
    allTypes: "جميع الأنواع",

    // Payment Methods
    paymentMethod: "طريقة الدفع والتحصيل",
    paymentMethodCash: "نقداً (كاش)",
    paymentMethodBankTransfer: "تحويل بنكي / إيداع",
    paymentMethodCheck: "شيك مصرفي معتمد",
    paymentMethodCreditCard: "بطاقة ائتمان / مدى",
    paymentMethodOnline: "دفع إلكتروني سريع",
    paymentMethodOther: "طريقة أخرى",

    // Voucher Statuses
    voucherStatusIssued: "معتمد ومصدر",
    voucherStatusDraft: "مسودة غير معتمدة",
    voucherStatusPaid: "مسدد بالكامل",
    voucherStatusCancelled: "ملغى",
    allStatuses: "جميع الحالات",
    paid: "مسدد",
    issued: "معتمد",
    draft: "مسودة",
    cancelled: "ملغى",

    // Voucher Form Fields
    voucherInfo: "بيانات ومعلومات السند",
    voucherNumber: "رقم السند",
    referenceNumber: "الرقم المرجعي / الفاتورة",
    voucherDate: "تاريخ السند",
    assignedBranch: "الفرع المصدر",
    mainBranch: "الفرع الرئيسي",
    partyDetails: "بيانات الطرف الآخر (العميل / المستفيد)",
    receivedFrom: "استلمنا من الفاضل / السادة",
    paidTo: "يصرف إلى الفاضل / السادة",
    clientPayer: "اسم العميل / الجهة",
    clientPhone: "رقم الهاتف / الجوال",
    clientEmail: "البريد الإلكتروني",
    clientAddress: "العنوان والمدينة",
    customerAddress: "عنوان العميل",
    clientTaxId: "الرقم الضريبي للعميل",
    taxNumber: "الرقم الضريبي",
    financialBreakdown: "التفاصيل المالية والبنود",
    category: "تصنيف العملية المالية",
    paymentDetails: "بيانات الدفع والتحويل",
    checkNumber: "رقم الشيك المصرفي",
    bankName: "اسم البنك المسحوب عليه",
    transferRef: "رقم الحوالة البنكية",
    transactionRef: "الرقم المرجعي للدفع / الشيك",
    amountInWords: "المبلغ كتابة بالحروف",
    autoWords: "توليد تلقائي",
    customWords: "تعديل يدوي",
    lineItems: "جدول بنود المعاملة والخدمات",
    addItem: "إضافة بند جديد",
    itemDescription: "وصف الخدمة أو الصنف",
    description: "البيان والشرح",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    itemAmount: "المبلغ الإجمالي",
    taxRate: "نسبة الضريبة (%)",
    taxRatePercent: "نسبة الضريبة (VAT %)",
    discountAmount: "قيمة الخصم التجاري",
    termsAndConditions: "الشروط والأحكام وسياسة الاسترجاع",
    authorizedSignatory: "المخول بالاعتماد والتوقيع",
    signatures: "التوقيعات والاعتمادات الرسمية",
    preparedBy: "المحرر / أمين الصندوق",
    approvedBy: "المدير المالي / الاعتماد",
    receivedBy: "المستلم / العميل",
    newVoucher: "إنشاء سند جديد",
    quickAiAssist: "مساعد الذكاء الاصطناعي الذكي",
    aiAssistTitle: "المساعد الذكي (AI)",
    saveVoucher: "حفظ السند المالي",
    customFields: "حقول إضافية مخصصة",
    createNew: "إنشاء جديد",
    type: "النوع",
    totalAmount: "المبلغ الإجمالي",
    noVouchersFound: "لا توجد سندات مسجلة تطابق معايير البحث",
    duplicate: "نسخ وتكرار",

    // Dashboard Metrics & Headers
    dashboardWelcome: "لوحة التحكم المالية الذكية",
    dashboardSubtitle: "منظومة ديشال لإدارة الأعمال (Deshal ERP) لإدارة المقبوضات والمدفوعات والمخزون والفروع والعملاء",
    totalCollections: "إجمالي المقبوضات (سندات القبض)",
    totalPayments: "إجمالي المصروفات (سندات الصرف)",
    netCashflow: "صافي التدفق النقدي الفعلي",
    activeClientsCount: "العملاء والشركات النشطة",
    inventoryValuation: "القيمة الإجمالية للمخزون",
    recentVouchers: "أحدث السندات المسجلة",
    quickCreateVoucher: "إصدار سند فوري جديد",
    financialInsights: "مؤشرات ورؤى مالية",
    monthlyRevenueChart: "حركة التدفقات الشهرية",
    branchPerformance: "أداء الفروع والمواقع",
    stockAlerts: "تنبيهات انخفاض المخزون",

    // History & Filters
    historyTitle: "سجل وإرشيف السندات المالية",
    historySubtitle: "استعراض السندات الصادرة، تصفية متقدمة، طباعة جماعية، وتصدير الملفات",
    allVouchers: "جميع السندات",
    bulkExport: "تصدير جماعي",
    filterByType: "نوع السند",
    filterByStatus: "حالة السند",
    filterByBranch: "الفرع",
    filterByDateRange: "الفترة الزمنية",
    duplicateVoucher: "تكرار السند",
    deleteConfirmation: "هل أنت متأكد من رغبتك في حذف هذا السند نهائياً؟",
    deleteSelectedConfirm: "هل أنت متأكد من حذف السندات المحددة نهائياً؟",
    generatingBatch: "جارٍ إنشاء الملفات المجمعة...",
    completed: "مكتمل",
    totalInflow: "إجمالي المقبوضات (الداخل)",
    totalOutflow: "إجمالي المدفوعات (الخارج)",
    totalRecordsLogged: "إجمالي السجلات المسجلة",
    vouchersCount: "سند مالي",
    selected: "محدد",
    bulkActionHint: "يمكنك تنفيذ إجراء مجمع على السندات المحددة",
    downloadZip: "تحميل أرشيف ZIP",
    mergedPdf: "ملف PDF مدمج",
    printSelected: "طباعة المحددة",
    deleteSelected: "حذف المحددة",
    deselectAll: "إلغاء التحديد",
    selectAll: "تحديد الكل",

    // CRM Module
    crmTitle: "إدارة علاقات العملاء (CRM)",
    crmSubtitle: "سجل الشركات والعملاء، متابعة التحصيلات، والمراسلات الفورية",
    addCustomer: "إضافة عميل جديد",
    customerName: "اسم العميل / الشركة",
    customerCompany: "اسم المؤسسة / الشركة",
    customerPhone: "رقم الهاتف",
    customerEmail: "البريد الإلكتروني",
    customerType: "نوع العميل",
    customerBalance: "إجمالي التحصيلات",
    statementOfAccount: "كشف حساب تفصيلي",
    newInteraction: "تسجيل نشاط / اتصال",
    lead: "عميل محتمل",
    corporate: "شركات ومؤسسات",
    individual: "أفراد",
    vip: "عميل كبار الشخصيات (VIP)",

    // Inventory Module
    inventoryTitle: "إدارة المخازن والمخزون",
    inventorySubtitle: "متابعة الأصناف، مستويات الأرصدة، مستودعات التخزين، وحركات الجرد",
    addItemStock: "إضافة صنف جديد",
    stockTransfers: "مناقلات الفروع",
    stockMovements: "سجل حركات الجرد",
    itemName: "اسم الصنف",
    skuCode: "رمز الصنف (SKU)",
    stockQty: "الكمية المتوفرة",
    minStockAlert: "حد التنبيه الأدنى",
    unitCostPrice: "سعر التكلفة",
    sellingPrice: "سعر البيع",
    inStock: "متوفر بالمخزن",
    lowStock: "مخزون منخفض",
    outOfStock: "نفد من المخزن",
    adjustStock: "تسوية رصيد المخزون",
    transferStock: "تحويل مخزني بين الفروع",

    // Purchases Module
    purchasesTitle: "إدارة المشتريات والموردين",
    purchasesSubtitle: "فواتير الشراء، طلبيات التوريد، ومستحقات الموردين وتحديث المخزون",
    newPurchaseOrder: "فاتورة مشتريات جديدة",
    suppliersManager: "دليل الموردين",
    supplierName: "اسم المورد / الشركة",
    purchaseInvoiceNo: "رقم فاتورة المشتريات",
    paymentStatus: "حالة السداد",
    receivedStock: "تم استلام البضاعة",
    pendingDelivery: "قيد التوريد والشحن",

    // Branches Module
    branchesTitle: "إدارة الفروع والمواقع المتعددة",
    branchesSubtitle: "متابعة عمليات ومبيعات ومخازن الفروع، والتحكم بالتحويلات المخزنية",
    addBranch: "إضافة فرع جديد",
    branchCode: "كود الفرع",
    branchName: "اسم الفرع",
    branchManager: "مدير الفرع",
    branchCity: "المدينة / المحافظة",
    headquarters: "المركز الرئيسي",
    stockTransferDispatch: "إرسال شحنة للفرع",

    // Employees & Roles Module
    employeesTitle: "إدارة الموظفين وتوزيع الصلاحيات",
    employeesSubtitle: "سجل الكادر الوظيفي، الأقسام، الرواتب والبدلات، ومصفوفة الصلاحيات الدقيقة",
    addEmployee: "إضافة موظف جديد",
    employeeCode: "كود الموظف",
    fullNameAr: "الاسم الكامل (بالعربية)",
    fullNameEn: "الاسم الكامل (بالإنجليزية)",
    civilId: "الرقم المدني / الهوية",
    jobTitle: "المسمى الوظيفي",
    department: "القسم / الإدارة",
    role: "الدور الوظيفي والصلاحيات",
    hireDate: "تاريخ التعيين",
    basicSalary: "الراتب الأساسي",
    allowances: "البدلات والمكافآت",
    totalSalary: "إجمالي الراتب الشهري",
    bankIban: "رقم الآيبان البنكي (IBAN)",
    permissionsMatrix: "مصفوفة الصلاحيات الممنوحة",
    activeOperator: "المستخدم النشط الحالي",
    setActiveUser: "تعيين كمستخدم نشط",

    // Settings Module
    settingsTitle: "إعدادات وهوية النظام والطباعة",
    settingsSubtitle: "تخصيص بيانات الشركة، الشعار، الألوان، قوالب السندات، والحسابات البنكية",
    settingsStudioTitle: "استوديو الإعدادات والهوية البصرية",
    settingsStudioSubtitle: "تخصيص بيانات الشركة، الشعار، الأختام، الألوان، القوالب، والحسابات البنكية",
    resetDefaults: "استعادة الإعدادات الافتراضية",
    saveSettings: "حفظ جميع الإعدادات",
    settingsSavedSuccess: "تم حفظ الإعدادات وتطبيق الهوية بنجاح!",
    tabCompany: "بيانات الشركة",
    tabBrand: "الشعار والأختام",
    tabTheme: "الألوان والقوالب",
    tabNotices: "الشروط والترويسة",
    tabBank: "الحسابات البنكية",
    companyProfile: "بيانات المنشأة الرسمية",
    companyProfileTitle: "بيانات المنشأة والترخيص التجاري",
    companyLegalName: "اسم الشركة / المؤسسة القانوني",
    businessTagline: "النشاط أو الشعار اللفظي",
    taxIdNumber: "الرقم الضريبي (VAT ID)",
    crNumber: "رقم السجل التجاري (CR)",
    taxRegistrationNo: "الرقم الضريبي الموحد",
    streetAddress: "عنوان المقر الرئيسي والشارع",
    cityStateZip: "المدينة والمحافظة",
    country: "الدولة",
    defaultCurrency: "العملة الافتراضية للنظام",
    primaryPhone: "رقم الهاتف الأساسي",
    phoneNumbers: "أرقام التواصل والهاتف",
    billingEmail: "البريد الإلكتروني للفواتير والمالية",
    emailAddress: "البريد الإلكتروني الرسمي",
    physicalAddress: "العنوان الفعلي والمقر",
    websiteUrl: "الموقع الإلكتروني",
    brandCustomization: "الهوية والألوان والأختام",
    brandIdentityAssets: "أصول الهوية البصرية، الشعار والأختام الرسمية",
    companyBrandLogo: "شعار الشركة (Logo)",
    companyLogo: "شعار الشركة الرسمي",
    uploadLogoImage: "رفع صورة الشعار من الجهاز",
    pasteLogoUrl: "أو رابط مباشر لصورة الشعار",
    sampleLogoPresets: "نماذج شعارات سريعة جاهزة:",
    officialSealSignature: "الختم الرسمي والتوقيع الرقمي المعتمد",
    signatoryName: "اسم المخول بالتوقيع",
    signatoryTitle: "المسمى الوظيفي للموقع",
    uploadDigitalSignature: "رفع صورة التوقيع الرقمي",
    removeSignature: "إزالة التوقيع",
    digitalStamp: "ختم الشركة الرسمي",
    officialSignature: "توقيع الإدارة المعتمد",
    uploadOfficialStamp: "رفع صورة الختم الرسمي",
    removeStamp: "إزالة الختم",
    themeStyle: "قالب السند والتنسيق",
    themeColorsTitle: "ألوان الهوية، نمط القالب ومقاس الورق",
    palettePresets: "بالتات الألوان الجاهزة:",
    primaryColor: "اللون الأساسي",
    secondaryColor: "اللون الثانوي",
    templateStyle: "نمط وتصميم قالب السند",
    modernClean: "عصري أنيق (Modern Clean)",
    corporateClassic: "كلاسيكي رسمي (Corporate Classic)",
    executiveStamp: "تنفيذي مع ختم (Executive Stamp)",
    minimalistLight: "بسيط خفيف (Minimalist Light)",
    thermalReceipt: "إيصال حراري كاشير (Thermal POS)",
    pageSize: "مقاس ورق الطباعة الافتراضي",
    elementVisibility: "التحكم في ظهور عناصر السند:",
    showLogo: "إظهار الشعار",
    showStamp: "إظهار الختم الرسمي",
    showSignatures: "إظهار خانات التوقيع",
    showQrCode: "إظهار رمز QR الإلكتروني",
    showWatermark: "إظهار العلامة المائية",
    showBankDetails: "إظهار الحساب البنكي",
    headerFooterTermsTitle: "الترويسة العلوية، الإشعار السفلي والشروط المعتمدة",
    headerNotice: "شريط الإشعار العلوي في السند",
    footerNotice: "إشعار وتذييل السند السفلي",
    noticesAndTerms: "الشروط والملاحظات القانونية",
    bankingInfoTitle: "بيانات الحسابات البنكية والتحويل المصرفي",
    bankDetailsSetting: "الحسابات البنكية المعتمدة",
    accountName: "اسم المستفيد من الحساب",
    accountNumber: "رقم الحساب المصرفي",
    ibanNumber: "رقم الآيبان الدولي (IBAN)",
    saveChanges: "حفظ التغييرات",

    // Printable Vouchers & Invoices
    officialReceiptVoucher: "سند قبض مالي",
    officialPaymentVoucher: "سند صرف مالي",
    officialTaxInvoice: "فاتورة ضريبية",
    officialQuotation: "عرض أسعار",
    receiptSubtitleNotice: "مستند مالي رسمي معتمد صادر من إدارة الشركة",
    receiptFromLabel: "استلمنا من:",
    payToLabel: "يصرف إلى:",
    sumOfAmount: "مبلغ وقدره:",
    forPaymentOf: "وذلك عن:",
    paymentMethodLabel: "طريقة الدفع:",
    authorizedSignatureLabel: "توقيع المخول بالاعتماد",
    clientSignatureLabel: "توقيع المستلم / العميل",
    companySealLabel: "الختم الرسمي",
    qrVerificationText: "امسح رمز الاستجابة السريعة للتحقق من صحة المستند إلكترونياً",
    verifiedOfficialDocument: "مستند مالي رسمي معتمد وموثق إلكترونياً",

    // Audit Logs & Activity Tracker (Arabic)
    tabAuditLogs: "سجل الأنشطة والرقابة",
    auditLogTitle: "سجل الرقابة والعمليات المحاسبية",
    auditLogSubtitle: "تتبع تفصيلي لكافة حركات الإنشاء، التعديل، الحذف، والطباعة عبر الفروع والموظفين",
    totalLoggedOperations: "إجمالي العمليات المسجلة",
    exportLogsCsv: "تصدير السجل CSV",
    clearLogs: "مسح السجل",
    clearLogsConfirm: "هل أنت متأكد من رغبتك في مسح سجل العمليات؟ لا يمكن التراجع عن هذا الإجراء.",
    searchLogsPlaceholder: "بحث في السجل (الوصف، اسم السند، الموظف، الفرع...)",
    filterModule: "القسم / الوحدة",
    filterAction: "نوع الإجراء",
    filterTime: "النطاق الزمني",
    actionCreate: "إنشاء جديد",
    actionUpdate: "تعديل وتحديث",
    actionDelete: "حذف وإلغاء",
    actionBatchDelete: "حذف جماعي",
    actionPrint: "طباعة رسمية",
    actionExport: "تصدير PDF",
    actionTransfer: "مناقلة مخزنية",
    actionSettingsUpdate: "تحديث إعدادات",
    actionDuplicate: "تكرار سند",
    actionLogin: "تبديل مستخدم",
    moduleVouchers: "السندات والفواتير",
    moduleCrm: "إدارة العملاء",
    moduleInventory: "المستودعات والمخزون",
    modulePurchases: "المشتريات والموردين",
    moduleBranches: "الفروع الإدارية",
    moduleEmployees: "فريق العمل والصلاحيات",
    moduleSettings: "الإعدادات العامة",
    moduleSystem: "النظام العام",
    performedBy: "تم بواسطة",
    operatorRole: "المسمى الوظيفي",
    timestamp: "التاريخ والوقت",
    logDetails: "التفاصيل والملاحظات",
    noAuditLogs: "لا توجد سجلات رقابية تطابق شروط البحث المحددة",
    logDetailModalTitle: "تفاصيل السجل الرقابي والعملية",
    today: "اليوم",
    last7Days: "آخر 7 أيام",
    last30Days: "آخر 30 يوماً",
    allTime: "كافة السجلات",
    topOperator: "الموظف الأكثر نشاطاً",
    mostActiveModule: "القسم الأكثر حركة",
    criticalEvents: "عمليات حساسة (حذف/تعديل)",

    // Dashboard Analytics (Arabic)
    dashboardAnalytics: "لوحة التحليلات البيانية والمؤشرات المالية",
    analyticsSubtitle: "نظرة تفاعلية ورسومية شاملة على حركة الإيرادات والمصروفات والأصناف الأكثر طلباً وتفاعلات العملاء",
    revenueTrends: "منحنى الإيرادات والمصروفات والتدفق النقدي",
    monthlyIncome: "المقبوضات والإيرادات",
    monthlyExpenses: "المصروفات والمشتريات",
    netMargin: "صافي التدفق المالي",
    topSellingProducts: "المنتجات والتجهيزات الأكثر مبيعاً وطلباً",
    categoryDistribution: "توزيع المخزون والمبيعات حسب الفئة",
    recentCustomerActivity: "نشاط وحركة العملاء الحديثة والمدفوعات",
    paymentMethodBreakdown: "توزيع طرق التحصيل والمدفوعات",
    avgTicketSize: "متوسط قيمة السند المالي",
    collectionEfficiency: "معدل كفاءة التحصيل",
    totalRevenueGenerated: "إجمالي الإيرادات المحصلة",
    totalPurchasesMade: "إجمالي المشتريات والتوريدات",
    liveDataSync: "محدث لحظياً ومباشر",
    cashflowComparison: "مقارنة المقبوضات مقابل المصروفات",
    clientPayments: "سجل مدفوعات العملاء",
    unitsSold: "الكمية المباعة",

    // Authentication & Security (Arabic)
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    lockScreen: "قفل الشاشة السريع",
    unlock: "إلغاء قفل النظام",
    emailOrUsername: "البريد الإلكتروني المعتمد",
    password: "كلمة المرور",
    enterPassword: "أدخل كلمة المرور الخاصة بحسابك",
    pinCode: "رمز PIN السريع (4 أرقام)",
    rememberMe: "تذكر هذا المتصفح",
    forgotPassword: "نسيت كلمة المرور؟",
    magicLinkLogin: "الدخول بالرابط السحري",
    passwordLogin: "الدخول بكلمة المرور",
    staffQuickLogin: "دخول سريع بحسابات الموظفين",
    sendMagicLink: "إرسال الرابط السحري المباشر",
    magicLinkSent: "تم توليد وإرسال الرابط السحري بنجاح",
    magicLinkInstruction: "تم إرسال رابط تسجيل الدخول المشفر؛ يمكنك الضغط على الزر أدناه للدخول الفوري لحسابك دون إدخال كلمة المرور.",
    openMagicLink: "الدخول عبر الرابط السحري الآن",
    copyMagicLink: "نسخ رابط المصادقة المباشر",
    resetPassword: "إعادة ضبط وتعيين كلمة المرور",
    requestResetCode: "إرسال رمز التحقق OTP",
    verificationCode: "رمز التحقق (6 أرقام)",
    newPassword: "كلمة المرور الجديدة",
    confirmNewPassword: "تأكيد كلمة المرور الجديدة",
    currentPassword: "كلمة المرور الحالية",
    changePassword: "تغيير كلمة المرور",
    passwordChangedSuccess: "تم تحديث كلمة المرور بنجاح تام",
    twoFactorAuth: "المصادقة الثنائية (2FA)",
    twoFactorEnabled: "المصادقة الثنائية مفعلة ومحمية",
    twoFactorDisabled: "المصادقة الثنائية معطلة",
    enable2FA: "تفعيل المصادقة الثنائية (2FA)",
    disable2FA: "تعطيل المصادقة الثنائية",
    enter2FACode: "أدخل رمز التحقق المكون من 6 أرقام من تطبيق Authenticator",
    backupCodes: "رموز الاسترداد الاحتياطية",
    activeSessions: "الأجهزة والجلسات النشطة",
    revokeSession: "إنهاء الجلسة",
    revokeAllOtherSessions: "تسجيل الخروج من كافة الأجهزة الأخرى",
    securitySettings: "الأمان وكلمات المرور",
    securitySubtitle: "إدارة الحسابات وكلمات المرور، رموز PIN، التحقق بخطوتين وجلسات العمل النشطة",
    moduleSecurity: "الأمان والمصادقة",
    accountLocked: "الحساب مقفل مؤقتاً لتكرار المحاولات الخاطئة",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    loginSuccess: "تم تسجيل الدخول بنجاح",
    switchAccount: "تبديل الحساب",
    sessionExpiryNotice: "جلسة العمل آمنة ومحمية بنظام التشفير",

    // POS Arabic Translations
    posSales: "نقطة البيع ومبيعات الكاشير المباشرة",
    newSale: "عملية بيع جديدة",
    holdOrder: "تعليق الطلب",
    heldOrders: "الطلبات المعلقة",
    recallOrder: "استرجاع الطلب المعلق",
    clearCart: "تفريغ السلة",
    customItem: "بند حر يدوي",
    barcodeScanner: "قارئ الباركود",
    scanBarcode: "مسح باركود المنتج",
    scanOrTypeBarcode: "امسح الباركود بالكاميرا أو اكتب الرمز / SKU...",
    cashierShift: "وردية الكاشير والصندوق",
    openShift: "بدء وردية جديدة",
    closeShift: "إغلاق وردية الكاشير (Z-Report)",
    openingBalance: "رصيد افتتاح الصندوق",
    expectedCash: "المتوقع نقداً بالدرج",
    actualCash: "الفعلي نقداً بالدرج",
    cashDifference: "الفرق (عجز / زيادة)",
    cashIn: "إيداع نقدي بالصندوق",
    cashOut: "سحب نقدي من الصندوق",
    quickCash: "دفع نقدي سريع",
    exactAmount: "المبلغ بالضبط",
    payAndPrint: "دفع وطباعة إيصال الكاشير",
    payOnly: "تسجيل الدفع فقط",
    changeDue: "المتبقي للعميل (الباقي)",
    cashReceived: "المبلغ المستلم من العميل",
    splitPayment: "دفع مجزأ (نقدي + شبكة)",
    payCash: "نقداً (Cash)",
    payCard: "بطاقة / شبكة مدى (Card)",
    payCredit: "آجل على حساب العميل (Credit)",
    payBank: "تحويل بنكي مباشر",
    walkInCustomer: "عميل نقدي عام (Walk-in)",
    selectCustomer: "تحديد عميل الفاتورة",
    addNewCustomer: "إضافة عميل جديد سريع",
    orderCompleted: "تم إتمام عملية البيع وإصدار الفاتورة وتحديث المخزن بنجاح!",
    printThermalReceipt: "طباعة إيصال كاشير حراري (80mm)",
    orderHistory: "سجل عمليات POS",
    refundOrder: "استرجاع الفاتورة للمخزن",
    refundReason: "سبب إرجاع المنتجات",
    refundSuccess: "تم استرجاع المنتجات إلى المخزن وتعديل الحسابات بنجاح",
    allCategories: "جميع الأصناف",
    inStockCount: "المتوفر: {count}",
    shiftReport: "تقرير إغلاق الوردية الشامل (Z-Report)",
    xReport: "قراءة سريعة للوردية الحالية (X-Report)",
    soundEffects: "المؤثرات الصوتية للكاشير",
    posShortcuts: "اختصارات لوحة المفاتيح السريعة",

    // Recurring Schedules & Installments
    tabSchedules: "العمليات والأقساط المجدولة",
    recurringSchedules: "نظام العمليات الدورية والأقساط المجدولة",
    recurringSubtitle: "إدارة ومتابعة الأقساط، الإيجارات، الاشتراكات والعمليات المتكررة مع التنبيه التلقائي والتسجيل المباشر",
    newSchedule: "جدولة عملية مكررة جديدة",
    editSchedule: "تعديل العملية المجدولة",
    deleteScheduleConfirm: "هل أنت متأكد من حذف هذه العملية المجدولة؟ لن يتم حذف السندات التي تم إصدارها مسبقاً.",
    scheduleTitle: "عنوان أو بيان العملية",
    frequency: "الدورية والتكرار",
    freqDaily: "يومياً",
    freqWeekly: "أسبوعياً",
    freqBiweekly: "كل أسبوعين",
    freqMonthly: "شهرياً",
    freqQuarterly: "كل 3 أشهر (ربع سنوي)",
    freqSemiAnnually: "كل 6 أشهر (نصف سنوي)",
    freqAnnually: "سنوياً",
    nextDueDate: "تاريخ الاستحقاق القادم",
    lastExecuted: "آخر عملية مسجلة",
    installmentsProgress: "تقدم الأقساط المسددة",
    totalOccurrences: "إجمالي عدد الأقساط / التكرار",
    unlimitedInstallments: "مستمر دون حد (اشتراك مستمر)",
    postVoucherNow: "تسجيل وإصدار السند فوراً",
    postingVoucher: "جارٍ توليد السند...",
    voucherPostedSuccess: "تم إصدار السند المالي وترحيله إلى الحسابات بنجاح وتحديث تاريخ الاستحقاق القادم!",
    pauseSchedule: "إيقاف مؤقت",
    resumeSchedule: "استئناف التفعيل",
    dueToday: "مستحق اليوم!",
    overdue: "متأخر عن السداد",
    dueInDays: "مستحق خلال {days} أيام",
    scheduleHistory: "سجل السندات المرتبطة",
    monthlyCommitments: "إجمالي الالتزامات الشهرية",
    monthlyReceivables: "إجمالي الإيرادات الدورية الشهرية",
    presetCarInstallment: "قسط تمويل سيارة",
    presetRentQuarterly: "إيجار عقار / متجر (كل 3 أشهر)",
    presetInternetMonthly: "اشتراك إنترنت واتصالات",
    presetMaintenanceContract: "عقد دعم وصيانة دوري",
    presetInsuranceAnnual: "تأمين شامل سنوي",
    scheduleSimulation: "معاينة جدول مواعيد الاستحقاق القادمة",
    scheduleCode: "رمز الجدولة",
    partyName: "اسم المستفيد / الدافع / الجهة",

    // Doc Wizard
    tabDocWizard: "معالج السندات Doc Wizard",
    docWizardTitle: "معالج إصدار السندات الذكي (Doc Wizard)",
    docWizardSubtitle: "تجربة سلسة وموجهة لإصدار وتوثيق المستندات المالية خطوة بخطوة مع معاينة جانبية حية وفورية",
    wizardStep1: "نوع وتصنيف المستند",
    wizardStep2: "بيانات الطرف والجهة",
    wizardStep3: "البنود والمبالغ المالية",
    wizardStep4: "طريقة الدفع والتسوية",
    wizardStep5: "الشروط والملاحظات والاعتماد",
    wizardStep1Desc: "اختر التصنيف المالي، الفرع، والتواريخ",
    wizardStep2Desc: "حدد العميل أو المورد والبيانات الضريبية",
    wizardStep3Desc: "أضف بنود الخدمات أو المنتجات والمبالغ",
    wizardStep4Desc: "حدد وسيلة السداد، الحساب البنكي والتحصيل",
    wizardStep5Desc: "الملاحظات، الشروط، والتوقيعات الرسمية",
    livePreview: "معاينة المستند المباشرة",
    toggleLivePreview: "إظهار/إخفاء المعاينة الجانبية",
    nextStep: "الخطوة التالية",
    prevStep: "الخطوة السابقة",
    issueVoucherNow: "إصدار وترحيل السند فوراً",
    issuingVoucher: "جارٍ إصدار السند...",
    switchFullEditor: "النموذج الكامل التقليدي",
    switchDocWizard: "معالج السندات الذكي (Doc Wizard)",
    presetCorporateServices: "دفعة عقد خدمات وحلول تقنية",
    presetHardwareSale: "مبيعات أجهزة وشاشات تفاعلية",
    presetOfficeRent: "سند صرف إيجار المقر التجاري",
    presetNetworkConsulting: "استشارات وصيانة شبكات سحابية",
    docCategory: "تصنيف المستند المالي",
    docCategoryCustomer: "سند قبض عملاء (إيرادات)",
    docCategorySupplier: "سند صرف موردين ومصروفات",
    docCategoryTaxInvoice: "فاتورة ضريبية رسمية",
    docCategoryPettyCash: "سند عهدة ومصروفات نثرية",
    docCategoryQuotation: "عرض سعر مالي معتمد",
    stepSummary: "ملخص المستند السريع",
    quickFillPresets: "نماذج التعبئة السريعة بضغطة زر:",
    selectCustomerOrSupplier: "اختر من قائمة العملاء أو الموردين المسجلين",
    addNewPartyDirect: "أو أضف جهة / عميل جديد مباشرة",
    previewSideTip: "تنعكس جميع التعديلات فوراً على المستند المعتمد",
    phone: "رقم الهاتف / الجوال",
    email: "البريد الإلكتروني",
    address: "العنوان والمدينة",
    vatNumber: "الرقم الضريبي (VAT)",
    taxAmount: "مبلغ الضريبة",
    issueDate: "تاريخ الإصدار",
    referenceNo: "الرقم المرجعي / العقد",
    addLineItem: "إضافة بند جديد",
    chequeNumber: "رقم الشيك",
    chequeDate: "تاريخ استحقاق الشيك",
    transferRefNumber: "رقم الحوالة البنكية",
    drawDigitalSignature: "رسم التوقيع الرقمي",
    currencyConversion: "تحويل العملات وأسعار الصرف",
    exchangeRates: "أسعار الصرف المباشرة",
    liveExchangeRates: "أسعار الصرف اللحظية",
    refreshRates: "تحديث الأسعار الآن",
    thermalPrinter80: "طابعة حرارية (80mm)",
    equivalentInBase: "المعادل بالعملة الأساسية",
    digitalSignatureTitle: "التوقيع الرقمي المعتمد"
  },

  en: {
    // Brand & General
    appName: "Deshal Business Management ERP",
    appSubtitle: "Deshal Enterprise Platform - Finance, POS, Lease Contracts, Spaces, Services & CRM 360°",
    appVersion: "Version 2.5",
    online: "Online Connected",
    offline: "Offline Storage Mode",
    pwaReady: "PWA Installed & Ready",
    searchPlaceholder: "Search by voucher #, client name, phone, details...",
    filterAll: "View All",
    actions: "Actions",
    save: "Save Voucher",
    saving: "Saving...",
    saved: "Saved Successfully",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add New",
    create: "Create New",
    update: "Update Data",
    print: "Instant Print",
    exportPdf: "Export HD PDF",
    share: "Share Voucher",
    copy: "Copy",
    copied: "Copied!",
    close: "Close",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    previous: "Previous",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    status: "Status",
    date: "Date",
    dueDate: "Due Date",
    notes: "Notes & Instructions",
    currency: "Currency",
    amount: "Amount",
    subtotal: "Subtotal",
    tax: "Tax",
    vat: "Value Added Tax (VAT)",
    discount: "Discount",
    total: "Grand Total",
    netTotal: "Net Total",
    yes: "Yes",
    no: "No",
    loading: "Loading...",
    noDataFound: "No matching records found",
    quickActions: "Quick Actions",
    overview: "Overview",
    details: "Details",
    language: "Language",
    arabic: "العربية",
    english: "English",
    switchLanguage: "Switch Display Language",
    bilingual: "Bilingual (Arabic / English)",
    langBilingual: "Bilingual",
    langArabic: "Arabic Only",
    langEnglish: "English Only",
    printLanguage: "Print & Export Language",

    // Navigation Tabs
    tabHome: "Home",
    tabPos: "POS Register",
    tabEditor: "Voucher Studio",
    tabPreview: "Preview & Print",
    tabHistory: "Voucher Archive",
    tabCrm: "CRM & Clients",
    tabInventory: "Inventory & Stock",
    tabPurchases: "Purchases & Vendors",
    tabBranches: "Branches & Transfers",
    tabSettings: "Settings & Brand",
    tabEmployees: "Staff & Permissions",

    // Voucher Types
    voucherType: "Voucher Document Type",
    voucherTypeReceipt: "Official Receipt Voucher",
    voucherTypePayment: "Official Payment Voucher",
    voucherTypePettyCash: "Petty Cash Voucher",
    voucherTypeTaxInvoice: "Official Tax Invoice",
    voucherTypeQuotation: "Official Price Quotation",
    receiptVoucher: "Receipt Voucher",
    paymentVoucher: "Payment Voucher",
    pettyCashVoucher: "Petty Cash Voucher",
    taxInvoiceVoucher: "Tax Invoice",
    allTypes: "All Types",

    // Payment Methods
    paymentMethod: "Payment Method",
    paymentMethodCash: "Cash Payment",
    paymentMethodBankTransfer: "Bank Wire Transfer",
    paymentMethodCheck: "Certified Check",
    paymentMethodCreditCard: "Credit Card / POS",
    paymentMethodOnline: "Online Gateway",
    paymentMethodOther: "Other Method",

    // Voucher Statuses
    voucherStatusIssued: "Issued & Certified",
    voucherStatusDraft: "Draft Document",
    voucherStatusPaid: "Paid in Full",
    voucherStatusCancelled: "Cancelled",
    allStatuses: "All Statuses",
    paid: "Paid",
    issued: "Issued",
    draft: "Draft",
    cancelled: "Cancelled",

    // Voucher Form Fields
    voucherInfo: "Voucher Information & Details",
    voucherNumber: "Voucher Number",
    referenceNumber: "Reference / Invoice #",
    voucherDate: "Voucher Date",
    assignedBranch: "Issuing Branch",
    mainBranch: "Headquarters Branch",
    partyDetails: "Counterparty Information (Customer / Payee)",
    receivedFrom: "Received From (Payer)",
    paidTo: "Pay To (Payee)",
    clientPayer: "Client / Company Name",
    clientPhone: "Phone / Mobile Number",
    clientEmail: "Email Address",
    clientAddress: "City & Address",
    customerAddress: "Customer Address",
    clientTaxId: "Client Tax Identification #",
    taxNumber: "Tax Number (VAT ID)",
    financialBreakdown: "Financial Breakdown & Line Items",
    category: "Financial Category",
    paymentDetails: "Payment & Banking Details",
    checkNumber: "Check Number",
    bankName: "Drawee Bank Name",
    transferRef: "Wire Transfer Reference #",
    transactionRef: "Payment Reference / Check #",
    amountInWords: "Amount in Words",
    autoWords: "Auto-Generate",
    customWords: "Custom Override",
    lineItems: "Line Items & Description Table",
    addItem: "Add Line Item",
    itemDescription: "Service / Product Description",
    description: "Description & Particulars",
    quantity: "Qty",
    unitPrice: "Unit Price",
    itemAmount: "Total Amount",
    taxRate: "Tax Rate (%)",
    taxRatePercent: "Tax Rate (VAT %)",
    discountAmount: "Trade Discount Amount",
    termsAndConditions: "Standard Terms & Return Policy",
    authorizedSignatory: "Authorized Management Signatory",
    signatures: "Official Signatures & Approval Lines",
    preparedBy: "Prepared By / Cashier",
    approvedBy: "Financial Approval",
    receivedBy: "Received By / Customer",
    newVoucher: "Create New Voucher",
    quickAiAssist: "Smart AI Assistant",
    aiAssistTitle: "AI Assistant",
    saveVoucher: "Save Financial Voucher",
    customFields: "Custom Additional Fields",
    createNew: "Create New",
    type: "Type",
    totalAmount: "Total Amount",
    noVouchersFound: "No vouchers match your current filters",
    duplicate: "Duplicate Voucher",

    // Dashboard Metrics & Headers
    dashboardWelcome: "Financial Intelligence Hub",
    dashboardSubtitle: "Deshal Business Management ERP - Enterprise Suite for Inflows, Outflows, Stock, Multi-Branch & CRM",
    totalCollections: "Total Inflows (Receipt Vouchers)",
    totalPayments: "Total Outflows (Payment Vouchers)",
    netCashflow: "Net Cash Flow Balance",
    activeClientsCount: "Active Client Accounts",
    inventoryValuation: "Total Inventory Valuation",
    recentVouchers: "Recent Financial Vouchers",
    quickCreateVoucher: "Issue Instant Voucher",
    financialInsights: "Financial Insights & Ratios",
    monthlyRevenueChart: "Monthly Cashflow Trajectory",
    branchPerformance: "Branch & Location Performance",
    stockAlerts: "Low Stock Inventory Alerts",

    // History & Filters
    historyTitle: "Voucher History & Records Archive",
    historySubtitle: "Search, filter, batch export, download merged PDF, and manage financial documents",
    allVouchers: "All Vouchers",
    bulkExport: "Batch Export",
    filterByType: "Filter by Type",
    filterByStatus: "Filter by Status",
    filterByBranch: "Filter by Branch",
    filterByDateRange: "Date Range",
    duplicateVoucher: "Duplicate Record",
    deleteConfirmation: "Are you sure you want to permanently delete this voucher?",
    deleteSelectedConfirm: "Are you sure you want to permanently delete the selected vouchers?",
    generatingBatch: "Generating batch export files...",
    completed: "Completed",
    totalInflow: "Total Inflow (Collections)",
    totalOutflow: "Total Outflow (Payments)",
    totalRecordsLogged: "Total Logged Records",
    vouchersCount: "Vouchers",
    selected: "Selected",
    bulkActionHint: "Execute batch actions on selected vouchers",
    downloadZip: "Download ZIP Archive",
    mergedPdf: "Merged PDF File",
    printSelected: "Print Selected",
    deleteSelected: "Delete Selected",
    deselectAll: "Deselect All",
    selectAll: "Select All",

    // CRM Module
    crmTitle: "Customer Relationship Management (CRM)",
    crmSubtitle: "Corporate accounts, payment tracking, live messaging, and 1-click voucher creation",
    addCustomer: "Add New Client",
    customerName: "Client / Company Name",
    customerCompany: "Organization / Entity",
    customerPhone: "Primary Phone Number",
    customerEmail: "Contact Email",
    customerType: "Customer Account Type",
    customerBalance: "Total Collections",
    statementOfAccount: "Account Statement",
    newInteraction: "Log Activity / Call",
    lead: "Sales Lead",
    corporate: "Corporate Entity",
    individual: "Individual Client",
    vip: "VIP Strategic Client",

    // Inventory Module
    inventoryTitle: "Inventory & Warehouse Management",
    inventorySubtitle: "Product catalog, real-time stock levels, multi-warehouse tracking, and stock adjustments",
    addItemStock: "Add Stock Item",
    stockTransfers: "Branch Transfers",
    stockMovements: "Audit & Movement Log",
    itemName: "Product Name",
    skuCode: "Item Code (SKU)",
    stockQty: "Available Quantity",
    minStockAlert: "Min Stock Alert Level",
    unitCostPrice: "Unit Cost Price",
    sellingPrice: "Unit Selling Price",
    inStock: "In Stock Available",
    lowStock: "Low Stock Alert",
    outOfStock: "Out of Stock",
    adjustStock: "Stock Level Adjustment",
    transferStock: "Inter-Branch Stock Transfer",

    // Purchases Module
    purchasesTitle: "Purchasing & Supplier Management",
    purchasesSubtitle: "Supplier bills, procurement purchase orders, payables, and automated stock updates",
    newPurchaseOrder: "New Purchase Invoice",
    suppliersManager: "Suppliers Directory",
    supplierName: "Vendor / Supplier Name",
    purchaseInvoiceNo: "Supplier Invoice #",
    paymentStatus: "Payment Status",
    receivedStock: "Goods Received",
    pendingDelivery: "Pending Dispatch & Delivery",

    // Branches Module
    branchesTitle: "Multi-Branch & Location Network",
    branchesSubtitle: "Monitor location revenues, inter-branch transfers, and warehouse distribution",
    addBranch: "Add New Branch",
    branchCode: "Branch Code",
    branchName: "Branch Name",
    branchManager: "Branch Manager",
    branchCity: "City / Region",
    headquarters: "Main Headquarters",
    stockTransferDispatch: "Dispatch Transfer to Branch",

    // Employees & Roles Module
    employeesTitle: "Employee Directory & Permission Matrix",
    employeesSubtitle: "Staff profiles, departments, payroll compensation, and granular RBAC security rules",
    addEmployee: "Add New Staff Member",
    employeeCode: "Staff ID Code",
    fullNameAr: "Full Name (Arabic)",
    fullNameEn: "Full Name (English)",
    civilId: "Civil ID / National ID",
    jobTitle: "Job Title",
    department: "Department",
    role: "Assigned Role & Permissions",
    hireDate: "Date of Employment",
    basicSalary: "Basic Salary",
    allowances: "Allowances & Bonus",
    totalSalary: "Total Monthly Payroll",
    bankIban: "Bank IBAN Number",
    permissionsMatrix: "Granted Permissions Matrix",
    activeOperator: "Currently Active User Session",
    setActiveUser: "Set as Active User",

    // Settings Module
    settingsTitle: "System Configuration & Brand Studio",
    settingsSubtitle: "Corporate profile, visual identity, print templates, and authorized bank accounts",
    settingsStudioTitle: "Visual Identity & Settings Studio",
    settingsStudioSubtitle: "Customize company details, brand logo, official seal, colors, templates, and bank accounts",
    resetDefaults: "Restore Default Settings",
    saveSettings: "Save All Settings",
    settingsSavedSuccess: "Settings and branding identity saved successfully!",
    tabCompany: "Company Profile",
    tabBrand: "Logo & Seals",
    tabTheme: "Colors & Templates",
    tabNotices: "Terms & Notices",
    tabBank: "Bank Accounts",
    companyProfile: "Corporate Profile Details",
    companyProfileTitle: "Corporate Profile & Commercial Registration",
    companyLegalName: "Legal Company Name",
    businessTagline: "Business Tagline / Subtitle",
    taxIdNumber: "Tax ID (VAT Number)",
    crNumber: "Commercial Registration (CR)",
    taxRegistrationNo: "Tax Identification (VAT ID)",
    streetAddress: "Headquarters Street Address",
    cityStateZip: "City, State / Province & Zip",
    country: "Country",
    defaultCurrency: "Default System Currency",
    primaryPhone: "Primary Contact Phone",
    phoneNumbers: "Contact Phone Numbers",
    billingEmail: "Billing & Financial Email",
    emailAddress: "Official Corporate Email",
    physicalAddress: "Physical Headquarters Address",
    websiteUrl: "Official Website",
    brandCustomization: "Brand Colors & Styling",
    brandIdentityAssets: "Brand Identity Assets & Official Seals",
    companyBrandLogo: "Company Brand Logo",
    companyLogo: "Corporate Logo Image",
    uploadLogoImage: "Upload Custom Logo Image",
    pasteLogoUrl: "Or Paste Direct Logo Image URL",
    sampleLogoPresets: "Quick Sample Logo Presets:",
    officialSealSignature: "Official Seal & Authorized Signature",
    signatoryName: "Signatory Name",
    signatoryTitle: "Signatory Title",
    uploadDigitalSignature: "Upload Digital Signature Image",
    removeSignature: "Remove Signature",
    digitalStamp: "Official Corporate Seal / Stamp",
    officialSignature: "Authorized Management Signature",
    uploadOfficialStamp: "Upload Official Company Stamp Seal",
    removeStamp: "Remove Stamp",
    themeStyle: "Print Templates & Layout",
    themeColorsTitle: "Theme Colors, Layout Style & Paper Format",
    palettePresets: "Color Palette Presets:",
    primaryColor: "Primary Color",
    secondaryColor: "Secondary Color",
    templateStyle: "Layout Template Design",
    modernClean: "Modern Clean (Split Header & Bold Colors)",
    corporateClassic: "Corporate Classic (Formal Borders & Box Layout)",
    executiveStamp: "Executive Stamp (Seal Overlay & Premium Borders)",
    minimalistLight: "Minimalist Light (Clean Typography)",
    thermalReceipt: "Thermal Receipt (Compact Roll Ticket)",
    pageSize: "Default Paper Format",
    elementVisibility: "Print Element Visibility Controls:",
    showLogo: "Show Logo",
    showStamp: "Show Official Seal",
    showSignatures: "Show Signature Lines",
    showQrCode: "Show E-Invoice QR",
    showWatermark: "Show Watermark",
    showBankDetails: "Show Bank Info",
    headerFooterTermsTitle: "Header Banners, Footer Notices & Standard Terms",
    headerNotice: "Header Top Notice Banner",
    footerNotice: "Footer Acknowledgment Notice",
    noticesAndTerms: "Terms, Legal Notices & Header",
    bankingInfoTitle: "Company Banking & Wire Transfer Details",
    bankDetailsSetting: "Authorized Bank Accounts",
    accountName: "Account Beneficiary Name",
    accountNumber: "Account Number",
    ibanNumber: "IBAN / Account Identifier",
    saveChanges: "Save All System Changes",

    // Printable Vouchers & Invoices
    officialReceiptVoucher: "OFFICIAL RECEIPT VOUCHER",
    officialPaymentVoucher: "OFFICIAL PAYMENT VOUCHER",
    officialTaxInvoice: "OFFICIAL TAX INVOICE",
    officialQuotation: "OFFICIAL PRICE QUOTATION",
    receiptSubtitleNotice: "Official Certified Financial Document Issued by Management",
    receiptFromLabel: "Received From:",
    payToLabel: "Paid To:",
    sumOfAmount: "The Sum of:",
    forPaymentOf: "Being Payment For:",
    paymentMethodLabel: "Payment Method:",
    authorizedSignatureLabel: "Authorized Management Signature",
    clientSignatureLabel: "Client / Receiver Signature",
    companySealLabel: "Official Corporate Seal",
    qrVerificationText: "Scan QR Code for Electronic Document Verification",
    verifiedOfficialDocument: "Certified Official Financial Voucher - Electronically Verified",

    // Audit Logs & Activity Tracker (English)
    tabAuditLogs: "Activity Logs",
    auditLogTitle: "System Audit & Activity Logs",
    auditLogSubtitle: "Comprehensive audit trail tracking creation, modifications, deletions, and prints across branches and staff",
    totalLoggedOperations: "Total Logged Operations",
    exportLogsCsv: "Export Logs CSV",
    clearLogs: "Clear Logs",
    clearLogsConfirm: "Are you sure you want to clear all audit records? This action cannot be undone.",
    searchLogsPlaceholder: "Search logs (description, voucher #, employee, branch...)",
    filterModule: "Module / Section",
    filterAction: "Action Type",
    filterTime: "Time Range",
    actionCreate: "Created",
    actionUpdate: "Updated",
    actionDelete: "Deleted",
    actionBatchDelete: "Batch Deleted",
    actionPrint: "Printed",
    actionExport: "Exported PDF",
    actionTransfer: "Stock Transfer",
    actionSettingsUpdate: "Settings Updated",
    actionDuplicate: "Duplicated",
    actionLogin: "User Switched",
    moduleVouchers: "Vouchers & Invoices",
    moduleCrm: "CRM & Clients",
    moduleInventory: "Inventory & Stock",
    modulePurchases: "Purchases & Suppliers",
    moduleBranches: "Branches",
    moduleEmployees: "Employees & RBAC",
    moduleSettings: "Settings & Branding",
    moduleSystem: "System Core",
    performedBy: "Performed By",
    operatorRole: "Job Role",
    timestamp: "Timestamp",
    logDetails: "Details & Notes",
    noAuditLogs: "No audit records match the current search filters",
    logDetailModalTitle: "Audit Record Details",
    today: "Today",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
    allTime: "All Records",
    topOperator: "Top Active Operator",
    mostActiveModule: "Most Active Module",
    criticalEvents: "Sensitive Actions (Deletions/Edits)",

    // Dashboard Analytics (English)
    dashboardAnalytics: "Dashboard Analytics & Financial Metrics",
    analyticsSubtitle: "Interactive visual charts for revenue trends, top-selling items, cashflow comparison, and client activity",
    revenueTrends: "Revenue, Expenses & Cash Flow Trends",
    monthlyIncome: "Income / Collections",
    monthlyExpenses: "Expenses & Purchases",
    netMargin: "Net Cash Flow",
    topSellingProducts: "Top-Selling Products & Services",
    categoryDistribution: "Inventory & Sales Distribution",
    recentCustomerActivity: "Recent Customer Activity & Payment Stream",
    paymentMethodBreakdown: "Payment Methods Breakdown",
    avgTicketSize: "Avg Transaction Size",
    collectionEfficiency: "Collection Efficiency",
    totalRevenueGenerated: "Total Revenue Collected",
    totalPurchasesMade: "Total Purchases Made",
    liveDataSync: "Live Real-Time Sync",
    cashflowComparison: "Income vs. Expenses Cashflow",
    clientPayments: "Client Payments Stream",
    unitsSold: "Units Sold",

    // Authentication & Security (English)
    login: "Sign In",
    logout: "Sign Out",
    lockScreen: "Quick Screen Lock",
    unlock: "Unlock System",
    emailOrUsername: "Official Work Email",
    password: "Password",
    enterPassword: "Enter your account password",
    pinCode: "Quick 4-Digit PIN",
    rememberMe: "Remember this device",
    forgotPassword: "Forgot Password?",
    magicLinkLogin: "Magic Link Sign In",
    passwordLogin: "Password Sign In",
    staffQuickLogin: "Staff Quick Access",
    sendMagicLink: "Send Direct Magic Link",
    magicLinkSent: "Magic Link Generated Successfully",
    magicLinkInstruction: "A secure cryptographic sign-in link has been prepared. Click below to sign in instantly without typing a password.",
    openMagicLink: "Sign In with Magic Link Now",
    copyMagicLink: "Copy Magic Auth Link",
    resetPassword: "Reset Account Password",
    requestResetCode: "Send Verification Code (OTP)",
    verificationCode: "Verification Code (6 Digits)",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    currentPassword: "Current Password",
    changePassword: "Change Password",
    passwordChangedSuccess: "Password has been successfully updated",
    twoFactorAuth: "Two-Factor Auth (2FA)",
    twoFactorEnabled: "2FA Active & Protected",
    twoFactorDisabled: "2FA Disabled",
    enable2FA: "Enable Two-Factor Authentication (2FA)",
    disable2FA: "Disable 2FA",
    enter2FACode: "Enter 6-digit verification code from Authenticator App",
    backupCodes: "Backup Recovery Codes",
    activeSessions: "Active Devices & Sessions",
    revokeSession: "Terminate Session",
    revokeAllOtherSessions: "Sign Out From All Other Devices",
    securitySettings: "Account & Security",
    securitySubtitle: "Manage passwords, PIN codes, 2-Factor Authentication, and active device sessions",
    moduleSecurity: "Security & Auth",
    accountLocked: "Account temporarily locked due to failed attempts",
    invalidCredentials: "The entered email or password is incorrect",
    loginSuccess: "Signed in successfully",
    switchAccount: "Switch Account",
    sessionExpiryNotice: "Session is encrypted and secured by system policies",

    // POS English Translations
    posSales: "Point of Sale & Cashier Terminal",
    newSale: "New Sale",
    holdOrder: "Hold Order",
    heldOrders: "Held Orders",
    recallOrder: "Recall Held Order",
    clearCart: "Clear Cart",
    customItem: "Custom Item",
    barcodeScanner: "Barcode Scanner",
    scanBarcode: "Scan Barcode",
    scanOrTypeBarcode: "Scan barcode with camera or enter SKU...",
    cashierShift: "Cashier Shift & Drawer",
    openShift: "Open New Shift",
    closeShift: "Close Cashier Shift (Z-Report)",
    openingBalance: "Opening Cash Balance",
    expectedCash: "Expected Cash in Drawer",
    actualCash: "Actual Cash in Drawer",
    cashDifference: "Difference (Short / Over)",
    cashIn: "Cash In Deposit",
    cashOut: "Cash Out Withdrawal",
    quickCash: "Quick Cash",
    exactAmount: "Exact Amount",
    payAndPrint: "Pay & Print POS Receipt",
    payOnly: "Pay Only",
    changeDue: "Change Due",
    cashReceived: "Cash Received",
    splitPayment: "Split Payment (Cash + Card)",
    payCash: "Cash",
    payCard: "Card / Mada",
    payCredit: "On Account (Credit)",
    payBank: "Bank Transfer",
    walkInCustomer: "Walk-in Cash Customer",
    selectCustomer: "Select Customer",
    addNewCustomer: "Add New Customer",
    orderCompleted: "Sale Completed & Stock Updated Successfully!",
    printThermalReceipt: "Print Thermal Receipt (80mm)",
    orderHistory: "POS Sales Archive",
    refundOrder: "Refund POS Order",
    refundReason: "Reason for Refund",
    refundSuccess: "Order refunded & stock restored to warehouse successfully",
    allCategories: "All Categories",
    inStockCount: "In Stock: {count}",
    shiftReport: "Shift Closing Summary (Z-Report)",
    xReport: "Current Shift Reading (X-Report)",
    soundEffects: "Cashier Sound Effects",
    posShortcuts: "Quick Keyboard Shortcuts",

    // Recurring Schedules & Installments
    tabSchedules: "Recurring Schedules",
    recurringSchedules: "Recurring Schedules & Installments Manager",
    recurringSubtitle: "Manage and track installments, rent, utility subscriptions and recurring operations with auto reminders & direct posting",
    newSchedule: "Schedule New Recurring Operation",
    editSchedule: "Edit Recurring Schedule",
    deleteScheduleConfirm: "Are you sure you want to delete this recurring schedule? Previously generated vouchers will remain safe in archive.",
    scheduleTitle: "Operation Title / Description",
    frequency: "Recurrence Frequency",
    freqDaily: "Daily",
    freqWeekly: "Weekly",
    freqBiweekly: "Bi-Weekly",
    freqMonthly: "Monthly",
    freqQuarterly: "Quarterly (Every 3 Months)",
    freqSemiAnnually: "Semi-Annually (Every 6 Months)",
    freqAnnually: "Annually",
    nextDueDate: "Next Due Date",
    lastExecuted: "Last Recorded Voucher",
    installmentsProgress: "Installments Progress",
    totalOccurrences: "Total Installments / Limit",
    unlimitedInstallments: "Continuous (No limit)",
    postVoucherNow: "Generate & Post Voucher Now",
    postingVoucher: "Posting voucher...",
    voucherPostedSuccess: "Voucher generated, posted to accounts ledger and next due date updated successfully!",
    pauseSchedule: "Pause Schedule",
    resumeSchedule: "Resume Schedule",
    dueToday: "Due Today!",
    overdue: "Overdue",
    dueInDays: "Due in {days} days",
    scheduleHistory: "Linked Vouchers History",
    monthlyCommitments: "Total Monthly Commitments",
    monthlyReceivables: "Total Monthly Receivables",
    presetCarInstallment: "Car Finance Installment",
    presetRentQuarterly: "Property Rent (Quarterly)",
    presetInternetMonthly: "Fiber Internet Subscription",
    presetMaintenanceContract: "Maintenance & Support Contract",
    presetInsuranceAnnual: "Annual Vehicle & Property Insurance",
    scheduleSimulation: "Upcoming Due Dates Schedule Preview",
    scheduleCode: "Schedule Code",
    partyName: "Party / Payee / Payer Name",

    // Doc Wizard
    tabDocWizard: "Doc Wizard",
    docWizardTitle: "Smart Document Issuance (Doc Wizard)",
    docWizardSubtitle: "A guided, professional step-by-step experience to issue financial vouchers with real-time interactive side preview",
    wizardStep1: "Document Type & Details",
    wizardStep2: "Counterparty & Contact",
    wizardStep3: "Line Items & Amounts",
    wizardStep4: "Payment & Settlement",
    wizardStep5: "Terms, Notes & Approvals",
    wizardStep1Desc: "Select classification, branch, dates & numbers",
    wizardStep2Desc: "Pick customer or supplier with VAT details",
    wizardStep3Desc: "Add items, quantities, taxes & discounts",
    wizardStep4Desc: "Choose payment method, bank & transaction info",
    wizardStep5Desc: "Remarks, terms and signature sign-offs",
    livePreview: "Live Document Preview",
    toggleLivePreview: "Toggle Side Preview",
    nextStep: "Next Step",
    prevStep: "Previous Step",
    issueVoucherNow: "Issue & Post Document Now",
    issuingVoucher: "Issuing document...",
    switchFullEditor: "Standard Full Form",
    switchDocWizard: "Smart Doc Wizard",
    presetCorporateServices: "Tech & Corporate Services Contract",
    presetHardwareSale: "Interactive Screen & Hardware Sale",
    presetOfficeRent: "Commercial Office Rent Voucher",
    presetNetworkConsulting: "Cloud Infrastructure & Maintenance",
    docCategory: "Financial Document Classification",
    docCategoryCustomer: "Customer Receipt (Income)",
    docCategorySupplier: "Supplier Payment (Expense)",
    docCategoryTaxInvoice: "Official Tax Invoice",
    docCategoryPettyCash: "Petty Cash Voucher",
    docCategoryQuotation: "Certified Price Quotation",
    stepSummary: "Document Live Summary",
    quickFillPresets: "1-Click Quick Fill Presets:",
    selectCustomerOrSupplier: "Select from saved Customers or Suppliers",
    addNewPartyDirect: "Or add a new contact / party directly",
    previewSideTip: "All inputs update the live document preview in real time",
    phone: "Phone / Mobile",
    email: "Email Address",
    address: "Address & City",
    vatNumber: "Tax / VAT ID",
    taxAmount: "Tax Amount",
    issueDate: "Issue Date",
    referenceNo: "Reference # / Contract",
    addLineItem: "Add Line Item",
    chequeNumber: "Cheque Number",
    chequeDate: "Cheque Due Date",
    transferRefNumber: "Transfer Reference #",
    drawDigitalSignature: "Draw Digital Signature",
    currencyConversion: "Currency Conversion & FX",
    exchangeRates: "Exchange Rates",
    liveExchangeRates: "Live Exchange Rates",
    refreshRates: "Refresh Live Rates",
    thermalPrinter80: "Thermal Printer (80mm)",
    equivalentInBase: "Equivalent in Base Currency",
    digitalSignatureTitle: "Certified Digital Signature"
  }
};

export function getTranslation(lang: Language, key: keyof TranslationDictionary): string {
  return translations[lang]?.[key] || translations.ar[key] || "";
}
