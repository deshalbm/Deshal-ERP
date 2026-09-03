import {
  Account,
  AccountNature,
  AccountingSettings,
  CostCenter,
  BankAccount,
  BankStatementTransaction,
  BankReconciliationSession,
  BankMatchStatus,
  JournalEntry,
  JournalEntryStatus,
  AccountingRevisionLog,
  FiscalPeriod,
  FinancialReportPeriodFilter,
  TrialBalanceRow,
  IncomeStatementReport,
  BalanceSheetReport,
  UnbalancedEntryDiagnostic,
  BalanceDiscrepancyDiagnostic,
  ReceiptVoucher,
  PurchaseInvoice,
  PayrollSlip
} from '../types';

export const DEFAULT_CHART_OF_ACCOUNTS: Account[] = [
  // =================== ASSETS (1000) ===================
  {
    id: 'acc-1000',
    code: '1000',
    nameAr: 'الأصول',
    nameEn: 'Assets',
    type: 'ASSET',
    category: 'CURRENT_ASSET',
    isPosting: false,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1100',
    code: '1100',
    nameAr: 'الأصول المتداولة والنقدية',
    nameEn: 'Current Assets & Cash',
    type: 'ASSET',
    category: 'CURRENT_ASSET',
    parentId: 'acc-1000',
    isPosting: false,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1110',
    code: '1110',
    nameAr: 'الخزينة النقدية الرئيسية',
    nameEn: 'Main Cash Vault',
    type: 'ASSET',
    category: 'CASH_BANK',
    parentId: 'acc-1100',
    isPosting: true,
    openingBalance: 4500,
    currentBalance: 4500,
    currency: 'OMR',
    description: 'النقدية المتوفرة في الخزينة الرئيسية',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1120',
    code: '1120',
    nameAr: 'صندوق كاشير نقطة البيع (POS)',
    nameEn: 'POS Cash Register',
    type: 'ASSET',
    category: 'CASH_BANK',
    parentId: 'acc-1100',
    isPosting: true,
    openingBalance: 350,
    currentBalance: 350,
    currency: 'OMR',
    description: 'صندوق النقدية اليومية لورديات الكاشير',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1130',
    code: '1130',
    nameAr: 'بنك مسقط - الحساب الجاري',
    nameEn: 'Bank Muscat Current Account',
    type: 'ASSET',
    category: 'CASH_BANK',
    parentId: 'acc-1100',
    isPosting: true,
    openingBalance: 18500,
    currentBalance: 18500,
    currency: 'OMR',
    description: 'الحساب البنكي التشغيلي للشركة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1140',
    code: '1140',
    nameAr: 'بنك ظفار - حساب المدفوعات',
    nameEn: 'Bank Dhofar Account',
    type: 'ASSET',
    category: 'CASH_BANK',
    parentId: 'acc-1100',
    isPosting: true,
    openingBalance: 7200,
    currentBalance: 7200,
    currency: 'OMR',
    description: 'حساب بنكي ثانوي للتحويلات وسداد الرواتب',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1150',
    code: '1150',
    nameAr: 'العهدة النقدية للموظفين (Petty Cash)',
    nameEn: 'Petty Cash Fund',
    type: 'ASSET',
    category: 'CASH_BANK',
    parentId: 'acc-1100',
    isPosting: true,
    openingBalance: 250,
    currentBalance: 250,
    currency: 'OMR',
    description: 'العهدة المستديمة للمصاريف النثرية والطارئة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1200',
    code: '1200',
    nameAr: 'الذمم المدينة وحسابات العملاء (AR)',
    nameEn: 'Accounts Receivable',
    type: 'ASSET',
    category: 'ACCOUNTS_RECEIVABLE',
    parentId: 'acc-1000',
    isPosting: true,
    openingBalance: 3200,
    currentBalance: 3200,
    currency: 'OMR',
    description: 'مستحقات على عملاء الخدمات الاستشارية والمستأجرين',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1230',
    code: '1230',
    nameAr: 'ضريبة القيمة المضافة المستردة - المدخلات (5%)',
    nameEn: 'Input VAT Receivable (5%)',
    type: 'ASSET',
    category: 'CURRENT_ASSET',
    parentId: 'acc-1000',
    isPosting: true,
    openingBalance: 420,
    currentBalance: 420,
    currency: 'OMR',
    description: 'الضريبة المدفوعة على فواتير المشتريات والمصروفات',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1300',
    code: '1300',
    nameAr: 'مخزون البضائع والمستودعات',
    nameEn: 'Merchandise Inventory',
    type: 'ASSET',
    category: 'INVENTORY',
    parentId: 'acc-1000',
    isPosting: true,
    openingBalance: 8600,
    currentBalance: 8600,
    currency: 'OMR',
    description: 'قيمة مخزون المنتجات والمطبوعات المتاحة للبيع',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1500',
    code: '1500',
    nameAr: 'الأصول الثابتة',
    nameEn: 'Fixed Assets',
    type: 'ASSET',
    category: 'FIXED_ASSET',
    parentId: 'acc-1000',
    isPosting: false,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1510',
    code: '1510',
    nameAr: 'الأثاث والتجهيزات المكتبية والقاعات',
    nameEn: 'Furniture & Fixtures',
    type: 'ASSET',
    category: 'FIXED_ASSET',
    parentId: 'acc-1500',
    isPosting: true,
    openingBalance: 14500,
    currentBalance: 14500,
    currency: 'OMR',
    description: 'تجهيزات قاعات التدريب والاجتماعات والمكاتب',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1520',
    code: '1520',
    nameAr: 'أجهزة الحاسوب وتقنية المعلومات وشاشات العرض',
    nameEn: 'IT & Electronic Equipment',
    type: 'ASSET',
    category: 'FIXED_ASSET',
    parentId: 'acc-1500',
    isPosting: true,
    openingBalance: 9800,
    currentBalance: 9800,
    currency: 'OMR',
    description: 'خوادم، شاشات ذكية، أجهزة كاشير، وحواسيب',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-1590',
    code: '1590',
    nameAr: 'مجمع إهلاك الأصول الثابتة (حساب عكسي)',
    nameEn: 'Accumulated Depreciation (Contra Asset)',
    type: 'ASSET',
    category: 'FIXED_ASSET',
    parentId: 'acc-1500',
    isPosting: true,
    openingBalance: -3200,
    currentBalance: -3200,
    currency: 'OMR',
    description: 'مخصص الإهلاك المتراكم للأثاث والأجهزة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // =================== LIABILITIES (2000) ===================
  {
    id: 'acc-2000',
    code: '2000',
    nameAr: 'الالتزامات والخصوم',
    nameEn: 'Liabilities',
    type: 'LIABILITY',
    category: 'CURRENT_LIABILITY',
    isPosting: false,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-2110',
    code: '2110',
    nameAr: 'الذمم الدائنة والموردين (AP)',
    nameEn: 'Accounts Payable - Suppliers',
    type: 'LIABILITY',
    category: 'ACCOUNTS_PAYABLE',
    parentId: 'acc-2000',
    isPosting: true,
    openingBalance: 2450,
    currentBalance: 2450,
    currency: 'OMR',
    description: 'مستحقات وفواتير التوريد والخدمات للموردين',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-2120',
    code: '2120',
    nameAr: 'أمانات وتأمينات المستأجرين المستردة (Security Deposits)',
    nameEn: 'Tenants Security Deposits',
    type: 'LIABILITY',
    category: 'CURRENT_LIABILITY',
    parentId: 'acc-2000',
    isPosting: true,
    openingBalance: 1200,
    currentBalance: 1200,
    currency: 'OMR',
    description: 'مبالغ الضمان المحصلة من مستأجري المكاتب والمساحات',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-2130',
    code: '2130',
    nameAr: 'ضريبة القيمة المضافة المحصلة - المخرجات (5%)',
    nameEn: 'Output VAT Payable (5%)',
    type: 'LIABILITY',
    category: 'TAX_PAYABLE',
    parentId: 'acc-2000',
    isPosting: true,
    openingBalance: 980,
    currentBalance: 980,
    currency: 'OMR',
    description: 'الضريبة المستحقة لجهاز الضرائب عن المبيعات والخدمات',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-2140',
    code: '2140',
    nameAr: 'رواتب وأجور مستحقة للموظفين',
    nameEn: 'Accrued Payroll Payable',
    type: 'LIABILITY',
    category: 'ACCRUED_PAYROLL',
    parentId: 'acc-2000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'رواتب مستحقة غير مدفوعة حتى نهاية الفترة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-2150',
    code: '2150',
    nameAr: 'التأمينات الاجتماعية المستحقة (PASI Payable)',
    nameEn: 'Social Security Fund (PASI)',
    type: 'LIABILITY',
    category: 'CURRENT_LIABILITY',
    parentId: 'acc-2000',
    isPosting: true,
    openingBalance: 320,
    currentBalance: 320,
    currency: 'OMR',
    description: 'مستحقات صندوق الحماية الاجتماعية للتأمينات',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-2160',
    code: '2160',
    nameAr: 'إيرادات عقود واشتراكات مؤجلة (Unearned Revenue)',
    nameEn: 'Deferred / Unearned Revenue',
    type: 'LIABILITY',
    category: 'CURRENT_LIABILITY',
    parentId: 'acc-2000',
    isPosting: true,
    openingBalance: 1500,
    currentBalance: 1500,
    currency: 'OMR',
    description: 'مبالغ اشتراكات محصلة مقدماً لفترات قادمة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // =================== EQUITY (3000) ===================
  {
    id: 'acc-3000',
    code: '3000',
    nameAr: 'حقوق الملكية ورأس المال',
    nameEn: 'Equity & Capital',
    type: 'EQUITY',
    category: 'CAPITAL',
    isPosting: false,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-3100',
    code: '3100',
    nameAr: 'رأس المال المدفوع',
    nameEn: 'Paid-in Capital',
    type: 'EQUITY',
    category: 'CAPITAL',
    parentId: 'acc-3000',
    isPosting: true,
    openingBalance: 40000,
    currentBalance: 40000,
    currency: 'OMR',
    description: 'رأس مال الشركاء المؤسسين المعتمد في السجل التجاري',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-3200',
    code: '3200',
    nameAr: 'الأرباح المبقاة والمدورة',
    nameEn: 'Retained Earnings',
    type: 'EQUITY',
    category: 'RETAINED_EARNINGS',
    parentId: 'acc-3000',
    isPosting: true,
    openingBalance: 17670,
    currentBalance: 17670,
    currency: 'OMR',
    description: 'الأرباح المحتجزة والمرحلة من السنوات السابقة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-3300',
    code: '3300',
    nameAr: 'جاري الشركاء والمسحوبات الشخصية',
    nameEn: 'Partners Drawings / Current',
    type: 'EQUITY',
    category: 'DRAWINGS',
    parentId: 'acc-3000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'سحوبات وإيداعات الشركاء في الشركة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-3999',
    code: '3999',
    nameAr: 'حساب وسيط تسوية المركز المالي',
    nameEn: 'Balance Sheet Suspense Account',
    type: 'EQUITY',
    category: 'RETAINED_EARNINGS',
    parentId: 'acc-3000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'حساب وسيط لتسوية أي فروقات محاسبية ناتجة عن الترحيل أو قيود التسوية',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // =================== REVENUE (4000) ===================
  {
    id: 'acc-4000',
    code: '4000',
    nameAr: 'الإيرادات والمبيعات',
    nameEn: 'Revenues',
    type: 'REVENUE',
    category: 'SALES_REVENUE',
    isPosting: false,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-4100',
    code: '4100',
    nameAr: 'إيرادات تأجير المساحات وقاعات الاجتماعات',
    nameEn: 'Spaces & Halls Rental Revenue',
    type: 'REVENUE',
    category: 'RENTAL_REVENUE',
    parentId: 'acc-4000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'عائدات حجز القاعات التدريبية والمكاتب المشتركة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-4200',
    code: '4200',
    nameAr: 'إيرادات الخدمات الاستشارية والإدارية والتقنية',
    nameEn: 'Advisory & Tech Services Revenue',
    type: 'REVENUE',
    category: 'SERVICE_REVENUE',
    parentId: 'acc-4000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'عائدات الاستشارات المالية، التسويق، وتصميم المواقع',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-4300',
    code: '4300',
    nameAr: 'إيرادات مبيعات نقطة البيع والمنتجات (POS)',
    nameEn: 'POS & Retail Sales Revenue',
    type: 'REVENUE',
    category: 'SALES_REVENUE',
    parentId: 'acc-4000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'مبيعات المشروبات، المطبوعات والأصناف الفورية',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-4400',
    code: '4400',
    nameAr: 'إيرادات الاشتراكات وباقات العضوية للمستأجرين',
    nameEn: 'Memberships & Packages Revenue',
    type: 'REVENUE',
    category: 'SERVICE_REVENUE',
    parentId: 'acc-4000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'اشتراكات الباقات الدورية وحصص الساعات',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-4900',
    code: '4900',
    nameAr: 'إيرادات وأرباح متنوعة أخرى',
    nameEn: 'Other Miscellaneous Revenue',
    type: 'REVENUE',
    category: 'OTHER_REVENUE',
    parentId: 'acc-4000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'إيرادات فرعية، فروق تسوية أو أرباح بيع أصول',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // =================== EXPENSES (5000) ===================
  {
    id: 'acc-5000',
    code: '5000',
    nameAr: 'المصروفات والتكاليف التشغيلية',
    nameEn: 'Expenses & Operating Costs',
    type: 'EXPENSE',
    category: 'OPERATING_EXPENSE',
    isPosting: false,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5100',
    code: '5100',
    nameAr: 'تكلفة البضاعة والخدمات المباعة (COGS)',
    nameEn: 'Cost of Goods Sold (COGS)',
    type: 'EXPENSE',
    category: 'COST_OF_GOODS_SOLD',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'تكلفة المنتجات والمواد المستهلكة في تقديم الخدمات',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5200',
    code: '5200',
    nameAr: 'مصروفات الرواتب والأجور والبدلات',
    nameEn: 'Salaries, Wages & Allowances',
    type: 'EXPENSE',
    category: 'SALARIES_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'الرواتب الأساسية، بدلات السكن والنقل والمكافآت',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5210',
    code: '5210',
    nameAr: 'مساهمة الشركة في التأمينات الاجتماعية (PASI)',
    nameEn: 'Employer Social Security Contribution',
    type: 'EXPENSE',
    category: 'SALARIES_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'حصة صاحب العمل في صندوق الحماية الاجتماعية',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5300',
    code: '5300',
    nameAr: 'إيجار المقرات والمكاتب والمستودعات',
    nameEn: 'Rent Expense',
    type: 'EXPENSE',
    category: 'RENT_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'عقود إيجار مباني الفروع وصالات العمل',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5400',
    code: '5400',
    nameAr: 'الكهرباء، المياه، والاتصالات والإنترنت',
    nameEn: 'Utilities & Internet',
    type: 'EXPENSE',
    category: 'UTILITIES_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'فواتير مزودي الطاقة وخدمات الألياف البصرية',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5500',
    code: '5500',
    nameAr: 'التسويق والإعلانات والترويج الرقمي',
    nameEn: 'Marketing & Digital Ads',
    type: 'EXPENSE',
    category: 'MARKETING_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'حملات جوجل، تيك توك، انستقرام والمطبوعات الإعلانية',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5600',
    code: '5600',
    nameAr: 'الصيانة، النظافة والضيافة',
    nameEn: 'Maintenance & Hospitality',
    type: 'EXPENSE',
    category: 'OPERATING_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'صيانة المكيفات، مستلزمات القهوة والضيافة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5700',
    code: '5700',
    nameAr: 'مصروف إهلاك الأصول الثابتة (Depreciation Expense)',
    nameEn: 'Depreciation Expense',
    type: 'EXPENSE',
    category: 'DEPRECIATION_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'قسط الإهلاك الدوري للأثاث والأجهزة',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5800',
    code: '5800',
    nameAr: 'الرسوم الحكومية، التراخيص والسجل التجاري',
    nameEn: 'Government Fees & Licensing',
    type: 'EXPENSE',
    category: 'OPERATING_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'رسوم البلدية، الانتساب للغرفة وتجديد التراخيص',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc-5900',
    code: '5900',
    nameAr: 'العمولات البنكية ورسوم بوابات الدفع الإلكتروني',
    nameEn: 'Bank Charges & Payment Gateway Fees',
    type: 'EXPENSE',
    category: 'OPERATING_EXPENSE',
    parentId: 'acc-5000',
    isPosting: true,
    openingBalance: 0,
    currentBalance: 0,
    currency: 'OMR',
    description: 'رسوم التحويل وبطاقات الائتمان ومدفوعات ثواني / بوينت',
    isSystem: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];

export const DEFAULT_FISCAL_PERIODS: FiscalPeriod[] = Array.from({ length: 12 }, (_, idx) => {
  const month = idx + 1;
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const lastDay = new Date(2026, month, 0).getDate();
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    id: `fp-2026-${month}`,
    year: 2026,
    periodNumber: month,
    nameAr: `فترة ${monthsAr[idx]} 2026`,
    nameEn: `Period ${monthsEn[idx]} 2026`,
    startDate: `2026-${monthStr}-01`,
    endDate: `2026-${monthStr}-${lastDay}`,
    status: month <= 2 ? 'LOCKED' : 'OPEN'
  };
});

// ==========================================
// DEFAULT ACCOUNTING SETTINGS & CONFIGURATION
// ==========================================
export const DEFAULT_ACCOUNTING_SETTINGS: AccountingSettings = {
  id: 'settings-default',
  baseCurrency: 'OMR',
  fiscalYear: 2026,
  fiscalYearStartMonth: 1, // January
  journalNumberPrefix: 'JE-2026-',
  allowPostingToClosedPeriods: false,
  strictDoubleEntry: true,
  autoPostOperationalJournals: true,
  requireCostCenterForExpenses: false,
  defaultAccounts: {
    cashAccountId: 'acc-1110',              // Main Vault
    bankAccountId: 'acc-1130',              // Bank Muscat
    arAccountId: 'acc-1200',                // Accounts Receivable
    apAccountId: 'acc-2110',                // Accounts Payable
    salesAccountId: 'acc-4100',             // Space & Hall Rental Sales
    salesReturnAccountId: 'acc-4900',       // Returns / Sales Adj
    purchasesAccountId: 'acc-1300',         // Inventory / Purchases
    purchaseReturnAccountId: 'acc-1300',    // Purchase Returns
    inventoryAccountId: 'acc-1300',         // Merchandise Inventory
    cogsAccountId: 'acc-5100',              // Cost of Goods Sold
    taxPayableAccountId: 'acc-2130',        // Output VAT 5%
    taxReceivableAccountId: 'acc-1230',     // Input VAT 5%
    bankChargesAccountId: 'acc-5600',       // Bank Charges & Admin
    discountsAllowedAccountId: 'acc-5500',  // Marketing & Discounts
    discountsReceivedAccountId: 'acc-4900', // Other Revenue / Disc
    retainedEarningsAccountId: 'acc-3200',  // Retained Earnings (3200)
    suspenseAccountId: 'acc-3999'           // Suspense / Clearing (3999)
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'النظام المحاسبي'
};

// ==========================================
// DEFAULT COST CENTERS (P10)
// ==========================================
export const DEFAULT_COST_CENTERS: CostCenter[] = [
  {
    id: 'cc-100',
    code: 'CC-100',
    nameAr: 'الإدارة العامة والمكتب الرئيسي',
    nameEn: 'HQ & General Administration',
    description: 'المصاريف المشتركة والإدارية للمقر الرئيسي',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cc-200',
    code: 'CC-200',
    nameAr: 'فرع مجمع العريمي بوليفارد - الخوض',
    nameEn: 'Al Araimi Boulevard Branch',
    description: 'مركز تكلفة تشغيل وإيرادات فرع الخوض',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cc-300',
    code: 'CC-300',
    nameAr: 'فرع روي والأعمال التجارية',
    nameEn: 'Ruwi Commercial Branch',
    description: 'مركز تكلفة تشغيل وإيرادات فرع روي',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cc-400',
    code: 'CC-400',
    nameAr: 'قسم الفعاليات وقاعات المؤتمرات',
    nameEn: 'Events & Conference Halls',
    description: 'تشغيل القاعات الكبرى وتجهيزات المؤتمرات والندوات',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ==========================================
// DEFAULT BANK ACCOUNTS (P8/P9)
// ==========================================
export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-muscat-01',
    bankName: 'بنك مسقط (Bank Muscat)',
    accountName: 'ديشال للاستثمار وإدارة الأعمال - الحساب الجاري',
    accountNumber: '042301984210001',
    iban: 'OM82BMUS042301984210001',
    currency: 'OMR',
    branch: 'فرع الخوض التجاري',
    linkedAccountId: 'acc-1130',
    openingBalance: 18500,
    currentBookBalance: 18500,
    currentStatementBalance: 18450,
    lastReconciledDate: '2026-02-28',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bank-dhofar-01',
    bankName: 'بنك ظفار (Bank Dhofar)',
    accountName: 'ديشال للاستثمار - حساب رواتب الموظفين والتحويلات',
    accountNumber: '01020499210002',
    iban: 'OM54BKDH01020499210002',
    currency: 'OMR',
    branch: 'فرع الغبرة',
    linkedAccountId: 'acc-1140',
    openingBalance: 7200,
    currentBookBalance: 7200,
    currentStatementBalance: 7200,
    lastReconciledDate: '2026-02-28',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample imported bank statement transactions
export const DEFAULT_BANK_STATEMENT_TRANSACTIONS: BankStatementTransaction[] = [];

export const DEFAULT_BANK_RECON_SESSIONS: BankReconciliationSession[] = [];

// Storage Keys
const STORAGE_KEYS = {
  ACCOUNTS: 'deshal_chart_of_accounts',
  JOURNAL_ENTRIES: 'deshal_journal_entries',
  REVISION_LOGS: 'deshal_accounting_revision_logs',
  FISCAL_PERIODS: 'deshal_fiscal_periods',
  SETTINGS: 'deshal_accounting_settings',
  COST_CENTERS: 'deshal_cost_centers',
  BANK_ACCOUNTS: 'deshal_bank_accounts',
  BANK_TRANSACTIONS: 'deshal_bank_transactions',
  RECON_SESSIONS: 'deshal_bank_recon_sessions'
};

function normalizeAccount(acc: any): Account {
  const type = acc.type || 'ASSET';
  const normalBalance: AccountNature =
    acc.normalBalance ||
    (type === 'ASSET' || type === 'EXPENSE' || type === 'COGS' || type === 'OTHER_EXPENSE' ? 'DEBIT' : 'CREDIT');
  
  return {
    id: acc.id,
    code: acc.code,
    nameAr: acc.nameAr,
    nameEn: acc.nameEn || acc.nameAr,
    type,
    category: acc.category || 'CURRENT_ASSET',
    parentId: acc.parentId,
    isPosting: acc.isPosting ?? true,
    normalBalance,
    allowManualPosting: acc.allowManualPosting ?? acc.isPosting ?? true,
    reconciliationEnabled: acc.reconciliationEnabled ?? (acc.category === 'CASH_BANK' || acc.code?.startsWith('11')),
    costCenterRequired: acc.costCenterRequired ?? (acc.type === 'EXPENSE' && !acc.code?.startsWith('57')),
    openingBalance: Number(acc.openingBalance || 0),
    currentBalance: Number(acc.currentBalance ?? acc.openingBalance ?? 0),
    totalDebit: Number(acc.totalDebit || 0),
    totalCredit: Number(acc.totalCredit || 0),
    currency: acc.currency || 'OMR',
    description: acc.description || '',
    isSystem: acc.isSystem ?? false,
    isActive: acc.isActive ?? true,
    branchId: acc.branchId,
    createdAt: acc.createdAt || new Date().toISOString(),
    updatedAt: acc.updatedAt || new Date().toISOString()
  };
}

// Persistence functions
export function loadAccounts(): Account[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeAccount);
      }
    }
  } catch (err) {
    console.error('Error loading accounts:', err);
  }
  const defaults = DEFAULT_CHART_OF_ACCOUNTS.map(normalizeAccount);
  saveAccounts(defaults);
  return defaults;
}

export function saveAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving accounts:', err);
  }
}

export function loadAccountingSettings(): AccountingSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.defaultAccounts) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading accounting settings:', err);
  }
  saveAccountingSettings(DEFAULT_ACCOUNTING_SETTINGS);
  return DEFAULT_ACCOUNTING_SETTINGS;
}

export function saveAccountingSettings(settings: AccountingSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving accounting settings:', err);
  }
}

export function loadCostCenters(): CostCenter[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COST_CENTERS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading cost centers:', err);
  }
  saveCostCenters(DEFAULT_COST_CENTERS);
  return DEFAULT_COST_CENTERS;
}

export function saveCostCenters(costCenters: CostCenter[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COST_CENTERS, JSON.stringify(costCenters));
  } catch (err) {
    console.error('Error saving cost centers:', err);
  }
}

export function loadBankAccounts(): BankAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading bank accounts:', err);
  }
  saveBankAccounts(DEFAULT_BANK_ACCOUNTS);
  return DEFAULT_BANK_ACCOUNTS;
}

export function saveBankAccounts(bankAccounts: BankAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(bankAccounts));
  } catch (err) {
    console.error('Error saving bank accounts:', err);
  }
}

export function loadBankStatementTransactions(bankAccountId?: string): BankStatementTransaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BANK_TRANSACTIONS);
    if (data) {
      const parsed: BankStatementTransaction[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return bankAccountId ? parsed.filter((tx) => tx.bankAccountId === bankAccountId) : parsed;
      }
    }
  } catch (err) {
    console.error('Error loading bank transactions:', err);
  }
  saveBankStatementTransactions(DEFAULT_BANK_STATEMENT_TRANSACTIONS);
  return bankAccountId
    ? DEFAULT_BANK_STATEMENT_TRANSACTIONS.filter((tx) => tx.bankAccountId === bankAccountId)
    : DEFAULT_BANK_STATEMENT_TRANSACTIONS;
}

export function saveBankStatementTransactions(txs: BankStatementTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, JSON.stringify(txs));
  } catch (err) {
    console.error('Error saving bank transactions:', err);
  }
}

export function loadBankReconciliationSessions(bankAccountId?: string): BankReconciliationSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECON_SESSIONS);
    if (data) {
      const parsed: BankReconciliationSession[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return bankAccountId ? parsed.filter((s) => s.bankAccountId === bankAccountId) : parsed;
      }
    }
  } catch (err) {
    console.error('Error loading recon sessions:', err);
  }
  saveBankReconciliationSessions(DEFAULT_BANK_RECON_SESSIONS);
  return bankAccountId
    ? DEFAULT_BANK_RECON_SESSIONS.filter((s) => s.bankAccountId === bankAccountId)
    : DEFAULT_BANK_RECON_SESSIONS;
}

export function saveBankReconciliationSessions(sessions: BankReconciliationSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECON_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.error('Error saving recon sessions:', err);
  }
}

export function loadJournalEntries(): JournalEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading journal entries:', err);
  }
  saveJournalEntries(DEFAULT_INITIAL_JOURNAL_ENTRIES);
  return DEFAULT_INITIAL_JOURNAL_ENTRIES;
}

export function saveJournalEntries(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
  } catch (err) {
    console.error('Error saving journal entries:', err);
  }
}

export function loadAccountingRevisionLogs(): AccountingRevisionLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REVISION_LOGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading revision logs:', err);
  }
  return [];
}

export function saveAccountingRevisionLogs(logs: AccountingRevisionLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REVISION_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving revision logs:', err);
  }
}

export function logAccountingRevision(
  userId: string,
  userName: string,
  action: AccountingRevisionLog['action'],
  entityType: AccountingRevisionLog['entityType'],
  entityId: string,
  entityReference: string,
  detailsAr: string,
  detailsEn: string,
  previousState?: any,
  newState?: any
): AccountingRevisionLog {
  const log: AccountingRevisionLog = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    entityType,
    entityId,
    entityReference,
    detailsAr,
    detailsEn,
    previousState,
    newState
  };
  const logs = loadAccountingRevisionLogs();
  const updated = [log, ...logs].slice(0, 500); // Keep last 500 logs
  saveAccountingRevisionLogs(updated);
  return log;
}

export function loadFiscalPeriods(): FiscalPeriod[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FISCAL_PERIODS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading fiscal periods:', err);
  }
  saveFiscalPeriods(DEFAULT_FISCAL_PERIODS);
  return DEFAULT_FISCAL_PERIODS;
}

export function saveFiscalPeriods(periods: FiscalPeriod[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FISCAL_PERIODS, JSON.stringify(periods));
  } catch (err) {
    console.error('Error saving fiscal periods:', err);
  }
}

// =========================================================================
// ACCOUNTING CALCULATOR ENGINES (General Ledger, Trial Balance, P&L, Balance Sheet)
// =========================================================================

export function calculateAccountLedger(
  accounts: Account[],
  entries: JournalEntry[],
  filter?: FinancialReportPeriodFilter
): Account[] {
  const safeAccounts = [...accounts];
  const postedEntries = entries.filter((e) => {
    const isStatusOk = filter?.includeDrafts ? e.status !== 'CANCELLED' : (e.status === 'POSTED' || e.status === 'LOCKED');
    if (!isStatusOk) return false;
    if (filter?.startDate && e.date < filter.startDate) return false;
    if (filter?.endDate && e.date > filter.endDate) return false;
    if (filter?.branchId && filter.branchId !== 'all' && e.branchId && e.branchId !== filter.branchId) return false;
    return true;
  });

  // Calculate movements for each account
  const accountMovements: Record<string, { totalDebit: number; totalCredit: number }> = {};
  safeAccounts.forEach((acc) => {
    accountMovements[acc.id] = { totalDebit: 0, totalCredit: 0 };
    accountMovements[acc.code] = { totalDebit: 0, totalCredit: 0 };
  });

  postedEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const targetId = line.accountId;
      if (!accountMovements[targetId]) {
        accountMovements[targetId] = { totalDebit: 0, totalCredit: 0 };
      }
      accountMovements[targetId].totalDebit += Number(line.debit || 0);
      accountMovements[targetId].totalCredit += Number(line.credit || 0);

      // Also map by code
      if (line.accountCode && !accountMovements[line.accountCode]) {
        accountMovements[line.accountCode] = { totalDebit: 0, totalCredit: 0 };
      }
      if (line.accountCode) {
        accountMovements[line.accountCode].totalDebit += Number(line.debit || 0);
        accountMovements[line.accountCode].totalCredit += Number(line.credit || 0);
      }
    });
  });

  return safeAccounts.map((acc) => {
    const mov = accountMovements[acc.id] || accountMovements[acc.code] || { totalDebit: 0, totalCredit: 0 };
    const opening = Number(acc.openingBalance || 0);
    
    // Normal balance sign
    let current = opening;
    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      current = opening + mov.totalDebit - mov.totalCredit;
    } else {
      current = opening + mov.totalCredit - mov.totalDebit;
    }

    return {
      ...acc,
      totalDebit: mov.totalDebit,
      totalCredit: mov.totalCredit,
      currentBalance: current
    };
  });
}

export function generateTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  filter?: FinancialReportPeriodFilter
): {
  rows: TrialBalanceRow[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
} {
  const calculatedAccounts = calculateAccountLedger(accounts, entries, filter).filter((a) => a.isPosting);

  let totalOpeningDebit = 0;
  let totalOpeningCredit = 0;
  let totalPeriodDebit = 0;
  let totalPeriodCredit = 0;
  let totalClosingDebit = 0;
  let totalClosingCredit = 0;

  const rows: TrialBalanceRow[] = calculatedAccounts.map((acc) => {
    const opening = Number(acc.openingBalance || 0);
    const pDebit = Number(acc.totalDebit || 0);
    const pCredit = Number(acc.totalCredit || 0);

    let opDebit = 0;
    let opCredit = 0;
    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      if (opening >= 0) opDebit = opening;
      else opCredit = Math.abs(opening);
    } else {
      if (opening >= 0) opCredit = opening;
      else opDebit = Math.abs(opening);
    }

    // Closing Balance
    let clDebit = 0;
    let clCredit = 0;
    const netBal = acc.currentBalance;

    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      if (netBal >= 0) clDebit = netBal;
      else clCredit = Math.abs(netBal);
    } else {
      if (netBal >= 0) clCredit = netBal;
      else clDebit = Math.abs(netBal);
    }

    totalOpeningDebit += opDebit;
    totalOpeningCredit += opCredit;
    totalPeriodDebit += pDebit;
    totalPeriodCredit += pCredit;
    totalClosingDebit += clDebit;
    totalClosingCredit += clCredit;

    return {
      accountId: acc.id,
      accountCode: acc.code,
      accountNameAr: acc.nameAr,
      accountNameEn: acc.nameEn,
      type: acc.type,
      category: acc.category,
      openingDebit: opDebit,
      openingCredit: opCredit,
      periodDebit: pDebit,
      periodCredit: pCredit,
      closingDebit: clDebit,
      closingCredit: clCredit,
      netBalance: netBal
    };
  });

  const isBalanced =
    Math.abs(totalPeriodDebit - totalPeriodCredit) < 0.01 &&
    Math.abs(totalOpeningDebit - totalOpeningCredit) < 0.01 &&
    Math.abs(totalClosingDebit - totalClosingCredit) < 0.01;

  return {
    rows,
    totalOpeningDebit,
    totalOpeningCredit,
    totalPeriodDebit,
    totalPeriodCredit,
    totalClosingDebit,
    totalClosingCredit,
    isBalanced
  };
}

export function generateIncomeStatement(
  accounts: Account[],
  entries: JournalEntry[],
  filter?: FinancialReportPeriodFilter
): IncomeStatementReport {
  const calculatedAccounts = calculateAccountLedger(accounts, entries, filter);

  // Revenues (Type = REVENUE)
  const revenueAccounts = calculatedAccounts.filter((a) => a.type === 'REVENUE' && a.isPosting);
  const operatingRevItems = revenueAccounts
    .filter((a) => a.category !== 'OTHER_REVENUE')
    .map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const otherRevItems = revenueAccounts
    .filter((a) => a.category === 'OTHER_REVENUE')
    .map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));

  const totalOperatingRevenue = operatingRevItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOtherRevenue = otherRevItems.reduce((acc, curr) => acc + curr.amount, 0);

  // COGS
  const cogsAccounts = calculatedAccounts.filter((a) => a.category === 'COST_OF_GOODS_SOLD' && a.isPosting);
  const cogsItems = cogsAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalCogs = cogsItems.reduce((acc, curr) => acc + curr.amount, 0);

  const grossProfit = totalOperatingRevenue - totalCogs;

  // Operating Expenses (EXPENSE excluding COGS, OTHER_EXPENSE, TAX_EXPENSE)
  const opexAccounts = calculatedAccounts.filter(
    (a) => a.type === 'EXPENSE' && a.category !== 'COST_OF_GOODS_SOLD' && a.category !== 'OTHER_EXPENSE' && a.category !== 'TAX_EXPENSE' && a.isPosting
  );
  const opexItems = opexAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalOpex = opexItems.reduce((acc, curr) => acc + curr.amount, 0);

  const operatingIncome = grossProfit - totalOpex;

  // Other Expenses & Taxes
  const otherExpenseAccounts = calculatedAccounts.filter(
    (a) => a.type === 'EXPENSE' && (a.category === 'OTHER_EXPENSE' || a.category === 'TAX_EXPENSE') && a.isPosting
  );
  const totalOtherExpenses = otherExpenseAccounts.reduce((acc, curr) => acc + curr.currentBalance, 0);

  const netIncomeBeforeTax = operatingIncome + (totalOtherRevenue - totalOtherExpenses);
  const taxExpense = 0; // Standard GCC threshold / Corporate tax calc
  const netProfit = netIncomeBeforeTax - taxExpense;

  return {
    operatingRevenue: {
      items: operatingRevItems,
      total: totalOperatingRevenue
    },
    cogs: {
      items: cogsItems,
      total: totalCogs
    },
    grossProfit,
    operatingExpenses: {
      items: opexItems,
      total: totalOpex
    },
    operatingIncome,
    otherIncomeAndExpenses: {
      items: [
        ...otherRevItems,
        ...otherExpenseAccounts.map((a) => ({ code: a.code, nameAr: `(مصروف) ${a.nameAr}`, amount: -a.currentBalance }))
      ],
      total: totalOtherRevenue - totalOtherExpenses
    },
    netIncomeBeforeTax,
    taxExpense,
    netProfit
  };
}

export function generateBalanceSheet(
  accounts: Account[],
  entries: JournalEntry[],
  filter?: FinancialReportPeriodFilter
): BalanceSheetReport {
  const calculatedAccounts = calculateAccountLedger(accounts, entries, filter);
  const incomeStatement = generateIncomeStatement(accounts, entries, filter);

  // Current Assets
  const currentAssetAccounts = calculatedAccounts.filter(
    (a) => a.type === 'ASSET' && a.category !== 'FIXED_ASSET' && a.isPosting
  );
  const currentAssetItems = currentAssetAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalCurrentAssets = currentAssetItems.reduce((acc, curr) => acc + curr.amount, 0);

  // Non-Current Assets (Fixed Assets)
  const nonCurrentAssetAccounts = calculatedAccounts.filter(
    (a) => a.type === 'ASSET' && a.category === 'FIXED_ASSET' && a.isPosting
  );
  const nonCurrentAssetItems = nonCurrentAssetAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalNonCurrentAssets = nonCurrentAssetItems.reduce((acc, curr) => acc + curr.amount, 0);

  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  // Current Liabilities
  const currentLiabAccounts = calculatedAccounts.filter(
    (a) => a.type === 'LIABILITY' && a.category !== 'LONG_TERM_LIABILITY' && a.isPosting
  );
  const currentLiabItems = currentLiabAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalCurrentLiabilities = currentLiabItems.reduce((acc, curr) => acc + curr.amount, 0);

  // Long Term Liabilities
  const longTermLiabAccounts = calculatedAccounts.filter(
    (a) => a.type === 'LIABILITY' && a.category === 'LONG_TERM_LIABILITY' && a.isPosting
  );
  const longTermLiabItems = longTermLiabAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const totalLongTermLiabilities = longTermLiabItems.reduce((acc, curr) => acc + curr.amount, 0);

  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  // Equity
  const equityAccounts = calculatedAccounts.filter((a) => a.type === 'EQUITY' && a.isPosting);
  const equityItems = equityAccounts.map((a) => ({ code: a.code, nameAr: a.nameAr, amount: a.currentBalance }));
  const baseEquity = equityItems.reduce((acc, curr) => acc + curr.amount, 0);

  const currentPeriodProfit = incomeStatement.netProfit;
  const totalEquity = baseEquity + currentPeriodProfit;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const variance = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = variance < 0.01;

  return {
    assets: {
      currentAssets: { items: currentAssetItems, total: totalCurrentAssets },
      nonCurrentAssets: { items: nonCurrentAssetItems, total: totalNonCurrentAssets },
      totalAssets
    },
    liabilities: {
      currentLiabilities: { items: currentLiabItems, total: totalCurrentLiabilities },
      longTermLiabilities: { items: longTermLiabItems, total: totalLongTermLiabilities },
      totalLiabilities
    },
    equity: {
      items: equityItems,
      retainedEarnings: 0,
      currentPeriodProfit,
      totalEquity
    },
    totalLiabilitiesAndEquity,
    isBalanced,
    variance
  };
}

// =========================================================================
// FINANCIAL POSITION DIAGNOSTICS & RECONCILIATION ENGINE
// =========================================================================

export function diagnoseBalanceDiscrepancies(
  accounts: Account[],
  entries: JournalEntry[],
  vouchers: ReceiptVoucher[] = [],
  purchases: PurchaseInvoice[] = [],
  payrolls: PayrollSlip[] = [],
  filter?: FinancialReportPeriodFilter
): BalanceDiscrepancyDiagnostic {
  const balanceSheet = generateBalanceSheet(accounts, entries, filter);
  
  // 1. Diagnose Opening Balances
  const postingAccounts = accounts.filter((a) => a.isPosting);
  const totalOpeningAssets = postingAccounts
    .filter((a) => a.type === 'ASSET')
    .reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  
  const totalOpeningLiabilities = postingAccounts
    .filter((a) => a.type === 'LIABILITY')
    .reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  
  const totalOpeningEquity = postingAccounts
    .filter((a) => a.type === 'EQUITY')
    .reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  
  const totalOpeningLiabilitiesAndEquity = totalOpeningLiabilities + totalOpeningEquity;
  const openingVariance = Math.abs(totalOpeningAssets - totalOpeningLiabilitiesAndEquity);
  const isOpeningBalanced = openingVariance < 0.01;

  let openingExplanation = 'الأرصدة الافتتاحية متطابقة ومتوازنة محاسبياً (الأصول = الخصوم + حقوق الملكية).';
  if (!isOpeningBalanced) {
    if (totalOpeningAssets > totalOpeningLiabilitiesAndEquity) {
      openingExplanation = `الأصول الافتتاحية (${totalOpeningAssets.toFixed(3)} ر.ع) تتجاوز مجموع الخصوم وحقوق الملكية (${totalOpeningLiabilitiesAndEquity.toFixed(3)} ر.ع) بفارق ${openingVariance.toFixed(3)} ر.ع.`;
    } else {
      openingExplanation = `مجموع الخصوم وحقوق الملكية الافتتاحية (${totalOpeningLiabilitiesAndEquity.toFixed(3)} ر.ع) يتجاوز الأصول الافتتاحية (${totalOpeningAssets.toFixed(3)} ر.ع) بفارق ${openingVariance.toFixed(3)} ر.ع.`;
    }
  }

  // 2. Diagnose Unbalanced Journal Entries
  const unbalancedEntries: UnbalancedEntryDiagnostic[] = [];
  entries.forEach((entry) => {
    const sumDebit = entry.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const sumCredit = entry.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    const diff = Math.abs(sumDebit - sumCredit);
    if (diff > 0.005) {
      unbalancedEntries.push({
        entry,
        totalDebit: sumDebit,
        totalCredit: sumCredit,
        difference: diff,
        reason: sumDebit > sumCredit
          ? `إجمالي المدين (${sumDebit.toFixed(3)}) أعلى من الدائن (${sumCredit.toFixed(3)}) بفارق ${diff.toFixed(3)} ر.ع`
          : `إجمالي الدائن (${sumCredit.toFixed(3)}) أعلى من المدين (${sumDebit.toFixed(3)}) بفارق ${diff.toFixed(3)} ر.ع`
      });
    }
  });

  // 3. Diagnose Unposted Draft Entries
  const unpostedDraftEntries = entries.filter((e) => e.status === 'DRAFT');

  // 4. Diagnose Operational Transactions Unsynced to General Ledger
  const existingReferenceIds = new Set(entries.map((e) => e.referenceId).filter(Boolean));
  const existingReferenceNumbers = new Set(entries.map((e) => e.referenceNumber).filter(Boolean));

  const unpostedVouchers = vouchers.filter((v) => !existingReferenceIds.has(v.id) && !existingReferenceNumbers.has(v.voucherNumber) && v.status !== 'CANCELLED');
  const vouchersTotal = unpostedVouchers.reduce((s, v) => s + Number(v.amount || 0), 0);

  const unpostedPurchases = purchases.filter((p) => !existingReferenceIds.has(p.id) && !existingReferenceNumbers.has(p.purchaseNumber) && p.status !== 'CANCELLED');
  const purchasesTotal = unpostedPurchases.reduce((s, p) => s + Number(p.totalAmount || 0), 0);

  const unpostedPayrolls = payrolls.filter((pr) => !existingReferenceIds.has(pr.id) && pr.status !== 'DRAFT');
  const payrollsTotal = unpostedPayrolls.reduce((s, pr) => s + Number(pr.netSalary || pr.basicSalary || 0), 0);

  const totalUnsyncedAmount = vouchersTotal + purchasesTotal + payrollsTotal;

  // 5. Generate Actionable Recommendations
  const reconciliationRecommendations: BalanceDiscrepancyDiagnostic['reconciliationRecommendations'] = [];

  if (unbalancedEntries.length > 0) {
    unbalancedEntries.forEach((unb) => {
      reconciliationRecommendations.push({
        id: `rec-unb-${unb.entry.id}`,
        title: `معالجة القيد غير المتوازن ${unb.entry.entryNumber}`,
        description: `القيد يحتوي على فرق محاسبي قدره ${unb.difference.toFixed(3)} ر.ع (${unb.reason}).`,
        impact: `تعديل القيد أو إضافة بند موازنة لإلغاء الفارق في ميزان المراجعة والمركز المالي.`,
        actionType: 'AUTO_BALANCE_ENTRY',
        actionLabel: `موازنة القيد ${unb.entry.entryNumber} آلياً`,
        severity: 'ERROR',
        targetEntryId: unb.entry.id
      });
    });
  }

  if (!isOpeningBalanced) {
    reconciliationRecommendations.push({
      id: 'rec-opening-imbalance',
      title: 'موازنة الأرصدة الافتتاحية مع الأرباح المبقاة',
      description: openingExplanation,
      impact: `تعديل رصيد حساب الأرباح المبقاة والمدورة (3200) بقيمة ${openingVariance.toFixed(3)} ر.ع لضمان اتزان نقطة البداية المالية.`,
      actionType: 'FIX_OPENING',
      actionLabel: 'ضبط وموازنة الأرصدة الافتتاحية بنقرة واحدة',
      severity: 'ERROR'
    });
  }

  if (unpostedDraftEntries.length > 0) {
    reconciliationRecommendations.push({
      id: 'rec-post-drafts',
      title: `ترحيل القيود المسودة (${unpostedDraftEntries.length} قيد)`,
      description: `يوجد ${unpostedDraftEntries.length} قيد بحالة مسودة (DRAFT) بإجمالي ${unpostedDraftEntries.reduce((s, e) => s + e.totalDebit, 0).toFixed(3)} ر.ع لم ترحل بعد لدفتر الأستاذ.`,
      impact: 'القيود المسودة لا تحتسب في التقارير الختامية إلا بعد مراجعتها وترحيلها.',
      actionType: 'POST_ALL_DRAFTS',
      actionLabel: `ترحيل جميع القيود المسودة المتوازنة (${unpostedDraftEntries.length})`,
      severity: 'WARNING'
    });
  }

  if (unpostedVouchers.length > 0 || unpostedPurchases.length > 0 || unpostedPayrolls.length > 0) {
    reconciliationRecommendations.push({
      id: 'rec-sync-ops',
      title: 'مزامنة العمليات التشغيلية المعلقة مع الأستاذ العام',
      description: `توجد عمليات (${unpostedVouchers.length} سندات، ${unpostedPurchases.length} فواتير مشتريات، ${unpostedPayrolls.length} مسيرات رواتب) بإجمالي ${totalUnsyncedAmount.toFixed(3)} ر.ع لم تُنشأ لها قيود بعد.`,
      impact: 'توليد وترحيل قيود مزدوجة آلية للعمليات لتعكس الأرصدة الحقيقية للنقدية والبنك والمصروفات.',
      actionType: 'SYNC_TRANSACTIONS',
      actionLabel: 'مزامنة وترحيل كافة العمليات التشغيلية الآن',
      severity: 'INFO'
    });
  }

  if (!balanceSheet.isBalanced && balanceSheet.variance > 0.01 && reconciliationRecommendations.length === 0) {
    reconciliationRecommendations.push({
      id: 'rec-auto-adjust-bs',
      title: 'توليد قيد تسوية فارق المركز المالي',
      description: `يوجد فارق غير موجه قدره ${balanceSheet.variance.toFixed(3)} ر.ع بين إجمالي الأصول وإجمالي الخصوم وحقوق الملكية.`,
      impact: 'إنشاء قيد تسوية دوري متزن على حساب تسوية المركز المالي لمعادلة الميزانية.',
      actionType: 'AUTO_CREATE_BALANCING_ENTRY',
      actionLabel: `توليد قيد تسوية بقيمة ${balanceSheet.variance.toFixed(3)} ر.ع`,
      severity: 'WARNING'
    });
  }

  return {
    isBalanced: balanceSheet.isBalanced,
    totalAssets: balanceSheet.assets.totalAssets,
    totalLiabilitiesAndEquity: balanceSheet.totalLiabilitiesAndEquity,
    variance: balanceSheet.variance,
    openingStatus: {
      isBalanced: isOpeningBalanced,
      totalOpeningAssets,
      totalOpeningLiabilitiesAndEquity,
      variance: openingVariance,
      explanation: openingExplanation
    },
    unbalancedEntries,
    unpostedDraftEntries,
    unpostedOperationalTransactions: {
      vouchersCount: unpostedVouchers.length,
      vouchersTotal,
      purchasesCount: unpostedPurchases.length,
      purchasesTotal,
      payrollsCount: unpostedPayrolls.length,
      payrollsTotal,
      totalUnsyncedAmount
    },
    reconciliationRecommendations
  };
}

// ----------------------------------------------------
// SMART RECONCILIATION ACTIONS
// ----------------------------------------------------

export function autoRebalanceOpeningBalances(
  accounts: Account[],
  userName: string = 'المحاسب المسؤول'
): { updatedAccounts: Account[]; revisionLog: AccountingRevisionLog } {
  const safeAccounts = [...accounts];
  const postingAccounts = safeAccounts.filter((a) => a.isPosting);
  
  const totalOpeningAssets = postingAccounts
    .filter((a) => a.type === 'ASSET')
    .reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  
  const totalOpeningLiabilities = postingAccounts
    .filter((a) => a.type === 'LIABILITY')
    .reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  
  const totalOpeningEquityExcludingRE = postingAccounts
    .filter((a) => a.type === 'EQUITY' && a.code !== '3200')
    .reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);

  // Target Retained Earnings = Assets - Liabilities - Other Equity
  const targetRetainedEarnings = totalOpeningAssets - totalOpeningLiabilities - totalOpeningEquityExcludingRE;

  let reAccountIndex = safeAccounts.findIndex((a) => a.code === '3200');
  if (reAccountIndex === -1) {
    reAccountIndex = safeAccounts.findIndex((a) => a.type === 'EQUITY' && a.isPosting);
  }

  const previousBalance = reAccountIndex !== -1 ? safeAccounts[reAccountIndex].openingBalance : 0;

  if (reAccountIndex !== -1) {
    safeAccounts[reAccountIndex] = {
      ...safeAccounts[reAccountIndex],
      openingBalance: targetRetainedEarnings,
      currentBalance: targetRetainedEarnings,
      updatedAt: new Date().toISOString()
    };
  }

  saveAccounts(safeAccounts);

  const log: AccountingRevisionLog = {
    id: `log-rebal-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: 'user-rebal',
    userName,
    action: 'EDIT',
    entityType: 'ACCOUNT',
    entityId: reAccountIndex !== -1 ? safeAccounts[reAccountIndex].id : 'acc-3200',
    entityReference: 'ACC-3200-REBAL',
    detailsAr: `موازنة الأرصدة الافتتاحية آلياً: تعديل رصيد الأرباح المبقاة من ${previousBalance.toFixed(3)} إلى ${targetRetainedEarnings.toFixed(3)} ر.ع لمطابقة الأصول مع الخصوم وحقوق الملكية`,
    detailsEn: `Auto-rebalanced opening equity. Adjusted Retained Earnings to ${targetRetainedEarnings.toFixed(3)} OMR`,
    previousState: { openingBalance: previousBalance },
    newState: { openingBalance: targetRetainedEarnings }
  };

  const logs = loadAccountingRevisionLogs();
  saveAccountingRevisionLogs([log, ...logs]);

  return {
    updatedAccounts: safeAccounts,
    revisionLog: log
  };
}

export function postAllValidDraftEntries(
  entries: JournalEntry[],
  userName: string = 'المحاسب المسؤول'
): { updatedEntries: JournalEntry[]; postedCount: number } {
  let postedCount = 0;
  const updatedEntries = entries.map((entry) => {
    if (entry.status === 'DRAFT') {
      const sumDebit = entry.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
      const sumCredit = entry.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
      if (Math.abs(sumDebit - sumCredit) < 0.005) {
        postedCount++;
        return {
          ...entry,
          status: 'POSTED' as JournalEntryStatus,
          isBalanced: true,
          postedBy: userName,
          postedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    }
    return entry;
  });

  if (postedCount > 0) {
    saveJournalEntries(updatedEntries);
    const log: AccountingRevisionLog = {
      id: `log-postall-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'user-gl',
      userName,
      action: 'POST',
      entityType: 'JOURNAL_ENTRY',
      entityId: 'all-drafts',
      entityReference: `POST-${postedCount}-DRAFTS`,
      detailsAr: `ترحيل جماعي لعدد ${postedCount} قيد مسودة متوازن إلى دفتر الأستاذ العام`,
      detailsEn: `Batch posted ${postedCount} balanced draft journal entries to General Ledger`
    };
    const logs = loadAccountingRevisionLogs();
    saveAccountingRevisionLogs([log, ...logs]);
  }

  return {
    updatedEntries,
    postedCount
  };
}

export function autoBalanceSpecificEntry(
  entryId: string,
  entries: JournalEntry[],
  accounts: Account[],
  userName: string = 'المحاسب المسؤول'
): { updatedEntries: JournalEntry[]; balancedEntry: JournalEntry } {
  let balancedEntry: JournalEntry | null = null;

  const updatedEntries = entries.map((entry) => {
    if (entry.id !== entryId) return entry;

    const sumDebit = entry.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const sumCredit = entry.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    const diff = sumDebit - sumCredit;

    if (Math.abs(diff) < 0.005) {
      balancedEntry = entry;
      return entry;
    }

    const balancingAccount = accounts.find((a) => a.code === '3999') || accounts.find((a) => a.code === '3200') || accounts[0];
    const newLines = [...entry.lines];

    if (diff > 0) {
      // Debit > Credit -> Add Credit line
      newLines.push({
        id: `bal-line-${Date.now()}`,
        accountId: balancingAccount.id,
        accountCode: balancingAccount.code,
        accountNameAr: balancingAccount.nameAr,
        debit: 0,
        credit: diff,
        descriptionAr: `بند موازنة تسوية القيد (${entry.entryNumber})`
      });
    } else {
      // Credit > Debit -> Add Debit line
      newLines.push({
        id: `bal-line-${Date.now()}`,
        accountId: balancingAccount.id,
        accountCode: balancingAccount.code,
        accountNameAr: balancingAccount.nameAr,
        debit: Math.abs(diff),
        credit: 0,
        descriptionAr: `بند موازنة تسوية القيد (${entry.entryNumber})`
      });
    }

    const finalDebit = Math.max(sumDebit, sumCredit);
    balancedEntry = {
      ...entry,
      lines: newLines,
      totalDebit: finalDebit,
      totalCredit: finalDebit,
      isBalanced: true,
      updatedAt: new Date().toISOString()
    };

    return balancedEntry;
  });

  if (balancedEntry) {
    saveJournalEntries(updatedEntries);
    const log: AccountingRevisionLog = {
      id: `log-adj-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'user-gl',
      userName,
      action: 'EDIT',
      entityType: 'JOURNAL_ENTRY',
      entityId: entryId,
      entityReference: (balancedEntry as JournalEntry).entryNumber,
      detailsAr: `موازنة القيد ${(balancedEntry as JournalEntry).entryNumber} آلياً بإضافة سطر تسوية محاسبي`,
      detailsEn: `Auto-balanced journal entry ${(balancedEntry as JournalEntry).entryNumber}`
    };
    const logs = loadAccountingRevisionLogs();
    saveAccountingRevisionLogs([log, ...logs]);
  }

  return {
    updatedEntries,
    balancedEntry: balancedEntry || entries[0]
  };
}

export function createBalancingAdjustingEntry(
  variance: number,
  accounts: Account[],
  userName: string = 'المحاسب المسؤول'
): JournalEntry {
  const currentEntries = loadJournalEntries();
  const nextNum = currentEntries.length + 1;
  const entryNumber = `ADJ-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
  const amount = Math.abs(variance);

  const suspenseAccount = accounts.find((a) => a.code === '3999') || accounts.find((a) => a.code === '3200') || accounts[0];
  const bankAccount = accounts.find((a) => a.code === '1130') || accounts.find((a) => a.type === 'ASSET' && a.isPosting) || accounts[0];

  const lines = [
    {
      id: `adj-line-${Date.now()}-1`,
      accountId: suspenseAccount.id,
      accountCode: suspenseAccount.code,
      accountNameAr: suspenseAccount.nameAr,
      debit: variance > 0 ? 0 : amount,
      credit: variance > 0 ? amount : 0,
      descriptionAr: 'قيد تسوية فارق المركز المالي والميزانية العمومية'
    },
    {
      id: `adj-line-${Date.now()}-2`,
      accountId: bankAccount.id,
      accountCode: bankAccount.code,
      accountNameAr: bankAccount.nameAr,
      debit: variance > 0 ? amount : 0,
      credit: variance > 0 ? 0 : amount,
      descriptionAr: 'تسوية مقابلة لحساب المركز المالي'
    }
  ];

  const newEntry: JournalEntry = {
    id: `je-bal-adj-${Date.now()}`,
    entryNumber,
    date: new Date().toISOString().split('T')[0],
    type: 'ADJUSTING',
    status: 'POSTED',
    referenceType: 'MANUAL',
    referenceNumber: 'BS-RECON-AUTO',
    descriptionAr: `قيد تسوية لموازنة المركز المالي بمبلغ ${amount.toFixed(3)} ر.ع`,
    descriptionEn: `Adjusting entry to balance financial position by ${amount.toFixed(3)} OMR`,
    totalDebit: amount,
    totalCredit: amount,
    isBalanced: true,
    createdBy: userName,
    approvedBy: userName,
    postedBy: userName,
    postedAt: new Date().toISOString(),
    lines,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedEntries = [newEntry, ...currentEntries];
  saveJournalEntries(updatedEntries);

  const log: AccountingRevisionLog = {
    id: `log-bs-adj-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: 'user-gl',
    userName,
    action: 'CREATE',
    entityType: 'JOURNAL_ENTRY',
    entityId: newEntry.id,
    entityReference: entryNumber,
    detailsAr: `إنشاء قيد تسوية للمركز المالي بمبلغ ${amount.toFixed(3)} ر.ع`,
    detailsEn: `Created balancing adjusting entry ${entryNumber} for ${amount.toFixed(3)} OMR`
  };
  const logs = loadAccountingRevisionLogs();
  saveAccountingRevisionLogs([log, ...logs]);

  return newEntry;
}

// =========================================================================
// AUTOMATED TRANSACTION TO JOURNAL POSTING ENGINE
// Synchronizes Vouchers, Purchases, and Payroll into Balanced Double-Entry Journals
// =========================================================================

export function syncOperationalTransactionsToLedger(
  vouchers: ReceiptVoucher[],
  purchases: PurchaseInvoice[],
  payrolls: PayrollSlip[],
  currentEntries: JournalEntry[],
  creatorName: string = 'النظام الآلي (Posting Bot)'
): { updatedEntries: JournalEntry[]; newEntriesCount: number } {
  const existingReferenceIds = new Set(currentEntries.map((e) => e.referenceId).filter(Boolean));
  const newGeneratedEntries: JournalEntry[] = [];

  let nextJeNum = currentEntries.length + 1;

  // 1. Sync Vouchers (Receipts, Payments, Tax Invoices)
  vouchers.forEach((v) => {
    if (!v.id || existingReferenceIds.has(v.id) || v.status === 'CANCELLED') return;

    const entryNumber = `JE-${new Date().getFullYear()}-${String(nextJeNum++).padStart(4, '0')}`;
    const date = v.date || new Date().toISOString().split('T')[0];
    const totalAmount = Number(v.amount || 0);
    const taxAmount = Number(v.taxAmount || 0);
    const netAmount = totalAmount - taxAmount;

    if (totalAmount <= 0) return;

    if (v.type === 'RECEIPT' || v.type === 'TAX_INVOICE') {
      // Debit Cash/Bank, Credit Revenue + Credit Output VAT
      const cashAccountCode = v.paymentMethod === 'BANK_TRANSFER' ? '1130' : '1110';
      const cashAccountName = v.paymentMethod === 'BANK_TRANSFER' ? 'بنك مسقط - الحساب الجاري' : 'الخزينة النقدية الرئيسية';
      const cashAccountId = v.paymentMethod === 'BANK_TRANSFER' ? 'acc-1130' : 'acc-1110';

      const lines = [
        {
          id: `line-${Date.now()}-1`,
          accountId: cashAccountId,
          accountCode: cashAccountCode,
          accountNameAr: cashAccountName,
          debit: totalAmount,
          credit: 0,
          descriptionAr: `تحصيل سند قبض ${v.voucherNumber} - ${v.receivedFrom || 'عميل'}`
        },
        {
          id: `line-${Date.now()}-2`,
          accountId: 'acc-4100',
          accountCode: '4100',
          accountNameAr: 'إيرادات تأجير المساحات وقاعات الاجتماعات',
          debit: 0,
          credit: netAmount > 0 ? netAmount : totalAmount,
          descriptionAr: `إيراد سند ${v.voucherNumber} - ${v.category || 'خدمات'}`
        }
      ];

      if (taxAmount > 0) {
        lines.push({
          id: `line-${Date.now()}-3`,
          accountId: 'acc-2130',
          accountCode: '2130',
          accountNameAr: 'ضريبة القيمة المضافة المحصلة - المخرجات (5%)',
          debit: 0,
          credit: taxAmount,
          descriptionAr: `ضريبة مخرجات لسند ${v.voucherNumber}`
        });
      }

      newGeneratedEntries.push({
        id: `je-auto-vouch-${v.id}`,
        entryNumber,
        date,
        type: 'AUTOMATED',
        status: 'POSTED',
        referenceType: 'VOUCHER',
        referenceId: v.id,
        referenceNumber: v.voucherNumber,
        descriptionAr: `قيد آلي لسند قبض ${v.voucherNumber} - ${v.receivedFrom || ''}`,
        descriptionEn: `Automated posting for receipt voucher ${v.voucherNumber}`,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        isBalanced: true,
        createdBy: creatorName,
        postedBy: creatorName,
        postedAt: new Date().toISOString(),
        lines,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (v.type === 'PAYMENT' || v.type === 'PETTY_CASH') {
      // Debit Expense, Credit Cash/Bank
      const cashAccountCode = v.type === 'PETTY_CASH' ? '1150' : v.paymentMethod === 'BANK_TRANSFER' ? '1130' : '1110';
      const cashAccountName = v.type === 'PETTY_CASH' ? 'العهدة النقدية للموظفين' : v.paymentMethod === 'BANK_TRANSFER' ? 'بنك مسقط - الحساب الجاري' : 'الخزينة النقدية الرئيسية';
      const cashAccountId = v.type === 'PETTY_CASH' ? 'acc-1150' : v.paymentMethod === 'BANK_TRANSFER' ? 'acc-1130' : 'acc-1110';

      const lines = [
        {
          id: `line-${Date.now()}-1`,
          accountId: 'acc-5600',
          accountCode: '5600',
          accountNameAr: 'الصيانة، النظافة والضيافة والمصاريف التشغيلية',
          debit: totalAmount,
          credit: 0,
          descriptionAr: `سداد سند صرف ${v.voucherNumber} - ${v.paidTo || v.category || 'مصروف تشغيلي'}`
        },
        {
          id: `line-${Date.now()}-2`,
          accountId: cashAccountId,
          accountCode: cashAccountCode,
          accountNameAr: cashAccountName,
          debit: 0,
          credit: totalAmount,
          descriptionAr: `صرف نقدي/بنكي لسند ${v.voucherNumber}`
        }
      ];

      newGeneratedEntries.push({
        id: `je-auto-vouch-${v.id}`,
        entryNumber,
        date,
        type: 'AUTOMATED',
        status: 'POSTED',
        referenceType: 'VOUCHER',
        referenceId: v.id,
        referenceNumber: v.voucherNumber,
        descriptionAr: `قيد آلي لسند صرف ${v.voucherNumber} - ${v.paidTo || v.receivedFrom || v.category || ''}`,
        descriptionEn: `Automated posting for payment voucher ${v.voucherNumber}`,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        isBalanced: true,
        createdBy: creatorName,
        postedBy: creatorName,
        postedAt: new Date().toISOString(),
        lines,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  // 2. Sync Purchases
  purchases.forEach((p) => {
    if (!p.id || existingReferenceIds.has(p.id) || p.status === 'CANCELLED') return;

    const entryNumber = `JE-${new Date().getFullYear()}-${String(nextJeNum++).padStart(4, '0')}`;
    const date = p.date || new Date().toISOString().split('T')[0];
    const totalAmount = Number(p.totalAmount || 0);
    const taxAmount = Number(p.taxAmount || 0);
    const netAmount = totalAmount - taxAmount;

    if (totalAmount <= 0) return;

    const lines = [
      {
        id: `line-${Date.now()}-1`,
        accountId: 'acc-1300',
        accountCode: '1300',
        accountNameAr: 'مخزون البضائع والمستودعات',
        debit: netAmount > 0 ? netAmount : totalAmount,
        credit: 0,
        descriptionAr: `مشتريات بضاعة فاتورة ${p.purchaseNumber} - ${p.supplierName || 'مورد'}`
      }
    ];

    if (taxAmount > 0) {
      lines.push({
        id: `line-${Date.now()}-2`,
        accountId: 'acc-1230',
        accountCode: '1230',
        accountNameAr: 'ضريبة القيمة المضافة المستردة - المدخلات (5%)',
        debit: taxAmount,
        credit: 0,
        descriptionAr: `ضريبة مدخلات فاتورة شراء ${p.purchaseNumber}`
      });
    }

    lines.push({
      id: `line-${Date.now()}-3`,
      accountId: p.paymentStatus === 'PAID' ? 'acc-1130' : 'acc-2110',
      accountCode: p.paymentStatus === 'PAID' ? '1130' : '2110',
      accountNameAr: p.paymentStatus === 'PAID' ? 'بنك مسقط - الحساب الجاري' : 'الذمم الدائنة والموردين (AP)',
      debit: 0,
      credit: totalAmount,
      descriptionAr: p.paymentStatus === 'PAID' ? `سداد بنكي لفاتورة شراء ${p.purchaseNumber}` : `استحقاق مورد فاتورة ${p.purchaseNumber}`
    });

    newGeneratedEntries.push({
      id: `je-auto-purch-${p.id}`,
      entryNumber,
      date,
      type: 'AUTOMATED',
      status: 'POSTED',
      referenceType: 'PURCHASE',
      referenceId: p.id,
      referenceNumber: p.purchaseNumber,
      descriptionAr: `قيد آلي لفاتورة شراء ${p.purchaseNumber} - ${p.supplierName || ''}`,
      descriptionEn: `Automated posting for purchase invoice ${p.purchaseNumber}`,
      totalDebit: totalAmount,
      totalCredit: totalAmount,
      isBalanced: true,
      createdBy: creatorName,
      postedBy: creatorName,
      postedAt: new Date().toISOString(),
      lines,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // 3. Sync Payroll Slips
  payrolls.forEach((pr) => {
    if (!pr.id || existingReferenceIds.has(pr.id) || pr.status === 'DRAFT') return;

    const entryNumber = `JE-${new Date().getFullYear()}-${String(nextJeNum++).padStart(4, '0')}`;
    const date = pr.paymentDate || pr.generatedAt?.split('T')[0] || new Date().toISOString().split('T')[0];
    const basicSalary = Number(pr.basicSalary || 0);
    const allowances = Number((pr.housingAllowance || 0) + (pr.transportAllowance || 0) + (pr.otherAllowances || 0) + (pr.bonus || 0));
    const deductions = Number((pr.deductions || 0) + (pr.socialSecurityDeduction || 0));
    const netSalary = Number(pr.netSalary || basicSalary + allowances - deductions);
    const grossSalary = basicSalary + allowances;

    if (grossSalary <= 0) return;

    const lines = [
      {
        id: `line-${Date.now()}-1`,
        accountId: 'acc-5200',
        accountCode: '5200',
        accountNameAr: 'مصروفات الرواتب والأجور والبدلات',
        debit: grossSalary,
        credit: 0,
        descriptionAr: `استحقاق راتب شهر ${pr.payrollMonth || ''} - ${pr.employeeName || ''}`
      }
    ];

    if (deductions > 0) {
      lines.push({
        id: `line-${Date.now()}-2`,
        accountId: 'acc-2150',
        accountCode: '2150',
        accountNameAr: 'التأمينات الاجتماعية والخصومات المستحقة',
        debit: 0,
        credit: deductions,
        descriptionAr: `استقطاعات تأمينات وخصومات ${pr.employeeName || ''}`
      });
    }

    lines.push({
      id: `line-${Date.now()}-3`,
      accountId: 'acc-1130',
      accountCode: '1130',
      accountNameAr: 'بنك مسقط - الحساب الجاري (WPS)',
      debit: 0,
      credit: netSalary,
      descriptionAr: `تحويل صافي راتب الموظف ${pr.employeeName || ''} عبر نظام حماية الأجور WPS`
    });

    newGeneratedEntries.push({
      id: `je-auto-pay-${pr.id}`,
      entryNumber,
      date,
      type: 'AUTOMATED',
      status: 'POSTED',
      referenceType: 'PAYROLL',
      referenceId: pr.id,
      referenceNumber: pr.linkedVoucherNumber || `PAY-${pr.payrollMonth}-${pr.employeeCode || pr.employeeId}`,
      descriptionAr: `قيد آلي لمسير راتب الموظف ${pr.employeeName || ''} لشهر ${pr.payrollMonth || ''}`,
      descriptionEn: `Automated payroll slip posting for ${pr.employeeName || ''}`,
      totalDebit: grossSalary,
      totalCredit: grossSalary,
      isBalanced: true,
      createdBy: creatorName,
      postedBy: creatorName,
      postedAt: new Date().toISOString(),
      lines,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  const updatedEntries = [...newGeneratedEntries, ...currentEntries];
  saveJournalEntries(updatedEntries);

  return {
    updatedEntries,
    newEntriesCount: newGeneratedEntries.length
  };
}

// =========================================================================
// PHASE 3 & PHASE 7: GENERAL JOURNAL, STRICT POSTING, AND REVERSAL ENGINE
// =========================================================================

export function isPeriodClosed(date: string, periods: FiscalPeriod[], settings?: AccountingSettings): boolean {
  if (settings?.allowPostingToClosedPeriods) return false;
  const targetPeriod = periods.find((p) => date >= p.startDate && date <= p.endDate);
  if (!targetPeriod) return false;
  return targetPeriod.status === 'CLOSED' || targetPeriod.status === 'LOCKED';
}

export function canPostJournalEntry(
  entry: JournalEntry,
  periods: FiscalPeriod[],
  settings?: AccountingSettings
): { allowed: boolean; reason?: string } {
  const sumDebit = entry.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const sumCredit = entry.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const diff = Math.abs(sumDebit - sumCredit);

  if (diff > 0.005) {
    return {
      allowed: false,
      reason: `القيد غير متوازن: إجمالي المدين (${sumDebit.toFixed(3)}) لا يساوي إجمالي الدائن (${sumCredit.toFixed(3)}) بفارق ${diff.toFixed(3)} ر.ع.`
    };
  }

  if (entry.lines.length < 2) {
    return {
      allowed: false,
      reason: 'يجب أن يحتوي القيد على سطرين على الأقل (طرف مدين وطرف دائن).'
    };
  }

  if (isPeriodClosed(entry.date, periods, settings)) {
    return {
      allowed: false,
      reason: `الفترة المالية المقابلة للتاريخ (${entry.date}) مقفلة أو مغلقة، ولا يمكن الترحيل إليها.`
    };
  }

  return { allowed: true };
}

export function postJournalEntry(
  entryId: string,
  entries: JournalEntry[],
  accounts: Account[],
  periods: FiscalPeriod[],
  settings: AccountingSettings,
  userName: string = 'المحاسب المسؤول'
): { success: boolean; updatedEntries: JournalEntry[]; message?: string } {
  const target = entries.find((e) => e.id === entryId);
  if (!target) {
    return { success: false, updatedEntries: entries, message: 'القيد غير موجود.' };
  }

  if (target.status === 'POSTED' || target.status === 'LOCKED') {
    return { success: false, updatedEntries: entries, message: 'القيد مرحل بالفعل ولا يمكن إعادة ترحيله.' };
  }

  const check = canPostJournalEntry(target, periods, settings);
  if (!check.allowed) {
    return { success: false, updatedEntries: entries, message: check.reason };
  }

  const updatedEntries = entries.map((e) => {
    if (e.id === entryId) {
      return {
        ...e,
        status: 'POSTED' as JournalEntryStatus,
        isBalanced: true,
        postedBy: userName,
        postedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return e;
  });

  saveJournalEntries(updatedEntries);

  logAccountingRevision(
    'user-post',
    userName,
    'POST',
    'JOURNAL_ENTRY',
    entryId,
    target.entryNumber,
    `ترحيل القيد ${target.entryNumber} إلى الأستاذ العام بمبلغ ${target.totalDebit.toFixed(3)} ر.ع`,
    `Posted journal entry ${target.entryNumber} to General Ledger`,
    { status: target.status },
    { status: 'POSTED' }
  );

  return { success: true, updatedEntries, message: `تم ترحيل القيد ${target.entryNumber} بنجاح.` };
}

export function reverseJournalEntry(
  entryId: string,
  reversalReason: string,
  entries: JournalEntry[],
  accounts: Account[],
  periods: FiscalPeriod[],
  settings: AccountingSettings,
  userName: string = 'المحاسب المسؤول'
): { success: boolean; reversalEntry?: JournalEntry; updatedEntries: JournalEntry[]; message?: string } {
  const original = entries.find((e) => e.id === entryId);
  if (!original) {
    return { success: false, updatedEntries: entries, message: 'القيد الأصلي غير موجود.' };
  }

  if (original.status !== 'POSTED' && original.status !== 'LOCKED') {
    return { success: false, updatedEntries: entries, message: 'يمكن فقط عكس القيود المرحلة (POSTED).' };
  }

  if (original.reversalEntryId) {
    return { success: false, updatedEntries: entries, message: 'تم عكس هذا القيد مسبقاً.' };
  }

  const nextJeNum = entries.length + 1;
  const reversalEntryNumber = `REV-${new Date().getFullYear()}-${String(nextJeNum).padStart(4, '0')}`;
  const currentDate = new Date().toISOString().split('T')[0];

  if (isPeriodClosed(currentDate, periods, settings)) {
    return {
      success: false,
      updatedEntries: entries,
      message: 'الفترة المالية الحالية مقفلة، لا يمكن إنشاء قيد عكسي.'
    };
  }

  // Reverse all debit and credit lines
  const reversedLines = original.lines.map((line, idx) => ({
    id: `rev-line-${Date.now()}-${idx}`,
    accountId: line.accountId,
    accountCode: line.accountCode,
    accountNameAr: line.accountNameAr,
    accountNameEn: line.accountNameEn,
    debit: line.credit,  // Swap debit with credit
    credit: line.debit,  // Swap credit with debit
    currency: line.currency,
    exchangeRate: line.exchangeRate,
    baseAmount: line.baseAmount,
    descriptionAr: `[عكس قيد ${original.entryNumber}] ${line.descriptionAr}`,
    descriptionEn: `[Reversal of ${original.entryNumber}] ${line.descriptionEn || ''}`,
    costCenterId: line.costCenterId,
    costCenterName: line.costCenterName,
    branchId: line.branchId,
    referenceDoc: original.entryNumber
  }));

  const reversalEntry: JournalEntry = {
    id: `je-rev-${Date.now()}`,
    entryNumber: reversalEntryNumber,
    date: currentDate,
    type: 'REVERSAL',
    status: 'POSTED',
    referenceType: 'MANUAL',
    referenceId: original.id,
    referenceNumber: original.entryNumber,
    descriptionAr: `قيد عكسي للقيد رقم ${original.entryNumber} - السبب: ${reversalReason}`,
    descriptionEn: `Reversal entry for ${original.entryNumber} - Reason: ${reversalReason}`,
    lines: reversedLines,
    totalDebit: original.totalDebit,
    totalCredit: original.totalCredit,
    isBalanced: true,
    createdBy: userName,
    postedBy: userName,
    postedAt: new Date().toISOString(),
    reversedEntryId: original.id,
    reversalReason,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedEntries = entries.map((e) => {
    if (e.id === entryId) {
      return {
        ...e,
        status: 'REVERSED' as JournalEntryStatus,
        reversalEntryId: reversalEntry.id,
        reversalReason,
        updatedAt: new Date().toISOString()
      };
    }
    return e;
  });

  const finalEntries = [reversalEntry, ...updatedEntries];
  saveJournalEntries(finalEntries);

  logAccountingRevision(
    'user-rev',
    userName,
    'REVERSE',
    'JOURNAL_ENTRY',
    reversalEntry.id,
    reversalEntryNumber,
    `إنشاء قيد عكسي ${reversalEntryNumber} للقيد ${original.entryNumber}. السبب: ${reversalReason}`,
    `Created reversal entry ${reversalEntryNumber} for ${original.entryNumber}. Reason: ${reversalReason}`,
    { originalEntryId: original.id },
    { reversalEntryId: reversalEntry.id }
  );

  return {
    success: true,
    reversalEntry,
    updatedEntries: finalEntries,
    message: `تم إنشاء وترحيل القيد العكسي ${reversalEntryNumber} بنجاح.`
  };
}

export function duplicateJournalEntry(
  entryId: string,
  entries: JournalEntry[],
  userName: string = 'المحاسب المسؤول'
): { newDraftEntry: JournalEntry; updatedEntries: JournalEntry[] } {
  const source = entries.find((e) => e.id === entryId);
  if (!source) {
    throw new Error('القيد المراد نسخه غير موجود.');
  }

  const nextJeNum = entries.length + 1;
  const newEntryNumber = `JE-${new Date().getFullYear()}-${String(nextJeNum).padStart(4, '0')}`;
  const currentDate = new Date().toISOString().split('T')[0];

  const duplicatedLines = source.lines.map((line, idx) => ({
    id: `dup-line-${Date.now()}-${idx}`,
    accountId: line.accountId,
    accountCode: line.accountCode,
    accountNameAr: line.accountNameAr,
    accountNameEn: line.accountNameEn,
    debit: line.debit,
    credit: line.credit,
    currency: line.currency,
    exchangeRate: line.exchangeRate,
    baseAmount: line.baseAmount,
    descriptionAr: line.descriptionAr,
    descriptionEn: line.descriptionEn,
    costCenterId: line.costCenterId,
    costCenterName: line.costCenterName,
    branchId: line.branchId,
    referenceDoc: `نسخة من ${source.entryNumber}`
  }));

  const newDraftEntry: JournalEntry = {
    id: `je-dup-${Date.now()}`,
    entryNumber: newEntryNumber,
    date: currentDate,
    type: 'STANDARD',
    status: 'DRAFT',
    referenceType: 'MANUAL',
    referenceNumber: `نسخة من ${source.entryNumber}`,
    descriptionAr: `نسخة من ${source.entryNumber}: ${source.descriptionAr}`,
    descriptionEn: `Copy of ${source.entryNumber}: ${source.descriptionEn || ''}`,
    lines: duplicatedLines,
    totalDebit: source.totalDebit,
    totalCredit: source.totalCredit,
    isBalanced: source.isBalanced,
    createdBy: userName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedEntries = [newDraftEntry, ...entries];
  saveJournalEntries(updatedEntries);

  logAccountingRevision(
    'user-dup',
    userName,
    'CREATE',
    'JOURNAL_ENTRY',
    newDraftEntry.id,
    newEntryNumber,
    `تكرار وإنشاء مسودة قيد جديدة ${newEntryNumber} كنسخة من القيد ${source.entryNumber}`,
    `Duplicated journal entry ${source.entryNumber} into new draft ${newEntryNumber}`
  );

  return { newDraftEntry, updatedEntries };
}

// =========================================================================
// PHASE 2 & 7: CHART OF ACCOUNTS & FISCAL PERIOD MANAGEMENT
// =========================================================================

export function isAccountUsedInJournals(accountId: string, entries: JournalEntry[]): boolean {
  return entries.some((e) => e.lines.some((l) => l.accountId === accountId));
}

export function deactivateAccount(
  accountId: string,
  accounts: Account[],
  entries: JournalEntry[],
  userName: string = 'المحاسب المسؤول'
): { success: boolean; updatedAccounts: Account[]; message?: string } {
  const target = accounts.find((a) => a.id === accountId);
  if (!target) {
    return { success: false, updatedAccounts: accounts, message: 'الحساب غير موجود.' };
  }

  const updatedAccounts = accounts.map((a) => {
    if (a.id === accountId) {
      return {
        ...a,
        isActive: !a.isActive,
        updatedAt: new Date().toISOString()
      };
    }
    return a;
  });

  saveAccounts(updatedAccounts);

  const actionName = target.isActive ? 'تعطيل' : 'تفعيل';
  logAccountingRevision(
    'user-acc',
    userName,
    'EDIT',
    'ACCOUNT',
    target.id,
    target.code,
    `${actionName} الحساب المحاسبي ${target.code} - ${target.nameAr}`,
    `${actionName} account ${target.code} - ${target.nameEn || target.nameAr}`
  );

  return {
    success: true,
    updatedAccounts,
    message: `تم ${actionName} الحساب ${target.code} - ${target.nameAr} بنجاح.`
  };
}

export function closeFiscalPeriod(
  periodId: string,
  periods: FiscalPeriod[],
  userName: string = 'المحاسب المسؤول'
): { updatedPeriods: FiscalPeriod[]; period: FiscalPeriod } {
  let targetPeriod: FiscalPeriod | null = null;
  const updatedPeriods = periods.map((p) => {
    if (p.id === periodId) {
      targetPeriod = {
        ...p,
        status: 'CLOSED' as const,
        closedAt: new Date().toISOString(),
        closedBy: userName
      };
      return targetPeriod;
    }
    return p;
  });

  saveFiscalPeriods(updatedPeriods);

  if (targetPeriod) {
    logAccountingRevision(
      'user-fp',
      userName,
      'LOCK',
      'PERIOD',
      (targetPeriod as FiscalPeriod).id,
      (targetPeriod as FiscalPeriod).nameAr,
      `إقفال الفترة المالية ${(targetPeriod as FiscalPeriod).nameAr} ومنع ترحيل القيود إليها`,
      `Closed fiscal period ${(targetPeriod as FiscalPeriod).nameEn}`
    );
  }

  return { updatedPeriods, period: targetPeriod || periods[0] };
}

export function reopenFiscalPeriod(
  periodId: string,
  unlockReason: string,
  periods: FiscalPeriod[],
  userName: string = 'المحاسب المسؤول'
): { updatedPeriods: FiscalPeriod[]; period: FiscalPeriod } {
  let targetPeriod: FiscalPeriod | null = null;
  const updatedPeriods = periods.map((p) => {
    if (p.id === periodId) {
      targetPeriod = {
        ...p,
        status: 'OPEN' as const,
        unlockedAt: new Date().toISOString(),
        unlockedBy: userName,
        unlockReason
      };
      return targetPeriod;
    }
    return p;
  });

  saveFiscalPeriods(updatedPeriods);

  if (targetPeriod) {
    logAccountingRevision(
      'user-fp',
      userName,
      'UNLOCK',
      'PERIOD',
      (targetPeriod as FiscalPeriod).id,
      (targetPeriod as FiscalPeriod).nameAr,
      `إعادة فتح الفترة المالية ${(targetPeriod as FiscalPeriod).nameAr}. السبب: ${unlockReason}`,
      `Reopened fiscal period ${(targetPeriod as FiscalPeriod).nameEn}. Reason: ${unlockReason}`
    );
  }

  return { updatedPeriods, period: targetPeriod || periods[0] };
}

// =========================================================================
// PHASE 8 & 9: BANK RECONCILIATION & MATCHING ENGINE (P1)
// =========================================================================

export function autoMatchBankTransactions(
  statementTxs: BankStatementTransaction[],
  entries: JournalEntry[],
  bankAccountId: string,
  userName: string = 'المحاسب المسؤول'
): { matchedCount: number; updatedTxs: BankStatementTransaction[] } {
  let matchedCount = 0;
  const postedEntries = entries.filter((e) => e.status === 'POSTED' || e.status === 'LOCKED');

  const updatedTxs = statementTxs.map((tx) => {
    if (tx.bankAccountId !== bankAccountId || tx.matchStatus === 'MATCHED' || tx.matchStatus === 'RECONCILED') {
      return tx;
    }

    const txAmount = tx.debit > 0 ? tx.debit : tx.credit;
    const isOutflow = tx.debit > 0;

    // Search matching posted journal entry line
    const match = postedEntries.find((entry) => {
      // Check date proximity (within 5 days)
      const daysDiff = Math.abs((new Date(entry.date).getTime() - new Date(tx.transactionDate).getTime()) / (1000 * 3600 * 24));
      if (daysDiff > 7) return false;

      return entry.lines.some((l) => {
        // If statement is credit (deposit), entry should debit bank
        if (!isOutflow && Math.abs(Number(l.debit || 0) - txAmount) < 0.01) return true;
        // If statement is debit (expense/withdrawal), entry should credit bank
        if (isOutflow && Math.abs(Number(l.credit || 0) - txAmount) < 0.01) return true;
        return false;
      });
    });

    if (match) {
      matchedCount++;
      return {
        ...tx,
        matchStatus: 'MATCHED' as BankMatchStatus,
        matchedJournalEntryId: match.id,
        matchedTransactionRef: match.entryNumber,
        matchedAt: new Date().toISOString(),
        matchedBy: userName
      };
    }

    return tx;
  });

  saveBankStatementTransactions(updatedTxs);
  return { matchedCount, updatedTxs };
}

export function createBankDifferenceAdjustingEntry(
  diffType: 'BANK_FEE' | 'DIRECT_DEBIT' | 'DIRECT_CREDIT' | 'INTEREST',
  amount: number,
  bankAccountId: string,
  description: string,
  date: string,
  accounts: Account[],
  settings: AccountingSettings,
  userName: string = 'المحاسب المسؤول'
): { newEntry: JournalEntry; updatedEntries: JournalEntry[] } {
  const currentEntries = loadJournalEntries();
  const bankAccounts = loadBankAccounts();
  const bankAcc = bankAccounts.find((b) => b.id === bankAccountId);
  const linkedBankAccountId = bankAcc?.linkedAccountId || settings.defaultAccounts.bankAccountId;
  const linkedBankAcc = accounts.find((a) => a.id === linkedBankAccountId) || accounts[0];

  const nextJeNum = currentEntries.length + 1;
  const entryNumber = `JE-${new Date().getFullYear()}-${String(nextJeNum).padStart(4, '0')}`;

  let lines: any[] = [];

  if (diffType === 'BANK_FEE') {
    const feeAccount = accounts.find((a) => a.id === settings.defaultAccounts.bankChargesAccountId) || accounts.find((a) => a.code === '5600') || accounts[0];
    lines = [
      {
        id: `line-${Date.now()}-1`,
        accountId: feeAccount.id,
        accountCode: feeAccount.code,
        accountNameAr: feeAccount.nameAr,
        debit: amount,
        credit: 0,
        descriptionAr: `رسوم ومصاريف بنكية - ${description}`
      },
      {
        id: `line-${Date.now()}-2`,
        accountId: linkedBankAcc.id,
        accountCode: linkedBankAcc.code,
        accountNameAr: linkedBankAcc.nameAr,
        debit: 0,
        credit: amount,
        descriptionAr: `خصم من الحساب البنكي ${bankAcc?.bankName || ''}`
      }
    ];
  } else if (diffType === 'DIRECT_DEBIT') {
    const expAccount = accounts.find((a) => a.code === '5400') || accounts.find((a) => a.type === 'EXPENSE' && a.isPosting) || accounts[0];
    lines = [
      {
        id: `line-${Date.now()}-1`,
        accountId: expAccount.id,
        accountCode: expAccount.code,
        accountNameAr: expAccount.nameAr,
        debit: amount,
        credit: 0,
        descriptionAr: `خصم مباشر من البنك - ${description}`
      },
      {
        id: `line-${Date.now()}-2`,
        accountId: linkedBankAcc.id,
        accountCode: linkedBankAcc.code,
        accountNameAr: linkedBankAcc.nameAr,
        debit: 0,
        credit: amount,
        descriptionAr: `خصم من الحساب البنكي ${bankAcc?.bankName || ''}`
      }
    ];
  } else {
    const revAccount = accounts.find((a) => a.code === '4900') || accounts.find((a) => a.type === 'REVENUE' && a.isPosting) || accounts[0];
    lines = [
      {
        id: `line-${Date.now()}-1`,
        accountId: linkedBankAcc.id,
        accountCode: linkedBankAcc.code,
        accountNameAr: linkedBankAcc.nameAr,
        debit: amount,
        credit: 0,
        descriptionAr: `إيداع بنكي مباشر - ${description}`
      },
      {
        id: `line-${Date.now()}-2`,
        accountId: revAccount.id,
        accountCode: revAccount.code,
        accountNameAr: revAccount.nameAr,
        debit: 0,
        credit: amount,
        descriptionAr: `إيرادات / تحويل بنكي وارد - ${description}`
      }
    ];
  }

  const newEntry: JournalEntry = {
    id: `je-bank-diff-${Date.now()}`,
    entryNumber,
    date,
    type: 'STANDARD',
    status: 'POSTED',
    referenceType: 'BANK_RECON',
    referenceNumber: `RECON-ADJ-${bankAcc?.accountNumber || ''}`,
    descriptionAr: `قيد تسوية فروق بنكية: ${description}`,
    descriptionEn: `Bank reconciliation adjustment entry: ${description}`,
    totalDebit: amount,
    totalCredit: amount,
    isBalanced: true,
    createdBy: userName,
    postedBy: userName,
    postedAt: new Date().toISOString(),
    lines,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedEntries = [newEntry, ...currentEntries];
  saveJournalEntries(updatedEntries);

  logAccountingRevision(
    'user-recon',
    userName,
    'CREATE',
    'RECONCILIATION',
    newEntry.id,
    entryNumber,
    `إنشاء قيد تسوية بنكية ${entryNumber} بمبلغ ${amount.toFixed(3)} ر.ع (${description})`,
    `Created bank reconciliation adjustment entry ${entryNumber} for ${amount.toFixed(3)} OMR`
  );

  return { newEntry, updatedEntries };
}

export function calculateBankReconciliationSummary(
  bankAccountId: string,
  statementEndingBalance: number,
  statementStartDate: string,
  statementEndDate: string,
  accounts: Account[],
  entries: JournalEntry[],
  transactions: BankStatementTransaction[]
): {
  bookBalance: number;
  statementEndingBalance: number;
  outstandingDepositsTotal: number;
  outstandingPaymentsTotal: number;
  bankChargesTotal: number;
  adjustmentsTotal: number;
  reconciledBalance: number;
  difference: number;
  isBalanced: boolean;
} {
  const bankAccounts = loadBankAccounts();
  const bank = bankAccounts.find((b) => b.id === bankAccountId);
  const linkedAccountId = bank?.linkedAccountId || 'acc-1130';

  const calculatedAccounts = calculateAccountLedger(accounts, entries, {
    startDate: '2020-01-01',
    endDate: statementEndDate,
    branchId: 'all',
    includeDrafts: false
  });

  const bankAccountInGL = calculatedAccounts.find((a) => a.id === linkedAccountId || a.code === '1130');
  const bookBalance = bankAccountInGL?.currentBalance || bank?.currentBookBalance || 0;

  const sessionTxs = transactions.filter((tx) => tx.bankAccountId === bankAccountId);
  const unmatchedOrPendingTxs = sessionTxs.filter((tx) => tx.matchStatus !== 'MATCHED' && tx.matchStatus !== 'RECONCILED');

  const outstandingDepositsTotal = unmatchedOrPendingTxs
    .filter((tx) => tx.credit > 0)
    .reduce((s, tx) => s + tx.credit, 0);

  const outstandingPaymentsTotal = unmatchedOrPendingTxs
    .filter((tx) => tx.debit > 0)
    .reduce((s, tx) => s + tx.debit, 0);

  const bankChargesTotal = unmatchedOrPendingTxs
    .filter((tx) => tx.description.toLowerCase().includes('fee') || tx.description.toLowerCase().includes('charge') || tx.description.includes('رسوم'))
    .reduce((s, tx) => s + tx.debit, 0);

  const adjustmentsTotal = 0;

  // Standard Bank Reconciliation Formula:
  // Adjusted Bank Balance = Statement Ending Balance + Deposits in Transit - Outstanding Checks
  const reconciledBalance = statementEndingBalance + outstandingDepositsTotal - outstandingPaymentsTotal;
  const difference = Math.abs(reconciledBalance - bookBalance);
  const isBalanced = difference < 0.01;

  return {
    bookBalance,
    statementEndingBalance,
    outstandingDepositsTotal,
    outstandingPaymentsTotal,
    bankChargesTotal,
    adjustmentsTotal,
    reconciledBalance,
    difference,
    isBalanced
  };
}

// =========================================================================
// ACCOUNTING DASHBOARD METRICS CALCULATION
// =========================================================================

export function calculateAccountingDashboardKPIs(
  accounts: Account[],
  entries: JournalEntry[],
  bankAccounts: BankAccount[],
  periods: FiscalPeriod[]
) {
  const calculatedAccounts = calculateAccountLedger(accounts, entries);
  const pnl = generateIncomeStatement(accounts, entries);
  const balanceSheet = generateBalanceSheet(accounts, entries);
  const trialBalance = generateTrialBalance(accounts, entries);

  // Cash and Bank Balances
  const cashAccounts = calculatedAccounts.filter((a) => a.category === 'CASH_BANK' && a.code.startsWith('111'));
  const totalCash = cashAccounts.reduce((s, a) => s + a.currentBalance, 0);

  const totalBank = bankAccounts.reduce((s, b) => s + b.currentBookBalance, 0);

  // Accounts Receivable & Accounts Payable
  const arAccount = calculatedAccounts.find((a) => a.code === '1200' || a.category === 'ACCOUNTS_RECEIVABLE');
  const totalReceivables = arAccount?.currentBalance || 0;

  const apAccount = calculatedAccounts.find((a) => a.code === '2110' || a.category === 'ACCOUNTS_PAYABLE');
  const totalPayables = apAccount?.currentBalance || 0;

  // Unreconciled count
  const allBankTxs = loadBankStatementTransactions();
  const unreconciledCount = allBankTxs.filter((tx) => tx.matchStatus === 'UNMATCHED').length;

  // Current period
  const today = new Date().toISOString().split('T')[0];
  const currentPeriod = periods.find((p) => today >= p.startDate && today <= p.endDate) || periods[0];

  return {
    revenue: pnl.operatingRevenue.total,
    expenses: pnl.operatingExpenses.total + pnl.cogs.total,
    netProfit: pnl.netProfit,
    receivables: totalReceivables,
    payables: totalPayables,
    cash: totalCash,
    bank: totalBank,
    unreconciledCount,
    currentPeriodName: currentPeriod?.nameAr || 'الفترة الحالية',
    currentFiscalYear: currentPeriod?.year || 2026,
    isTrialBalanceBalanced: trialBalance.isBalanced,
    isBalanceSheetBalanced: balanceSheet.isBalanced,
    totalEntriesCount: entries.length,
    postedEntriesCount: entries.filter((e) => e.status === 'POSTED').length,
    draftEntriesCount: entries.filter((e) => e.status === 'DRAFT').length
  };
}
