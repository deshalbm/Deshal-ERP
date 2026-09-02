import React, { useMemo } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  Info,
  Lightbulb,
  Keyboard
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface ContextualHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigateTab?: (tab: string) => void;
  onOpenFullHelpCenter?: () => void;
}

interface PageHelpContent {
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  whatCanIDoAr: string[];
  whatCanIDoEn: string[];
  howItWorksAr: string[];
  howItWorksEn: string[];
  relatedPages: { id: string; labelAr: string; labelEn: string }[];
  tipsAr?: string[];
  tipsEn?: string[];
}

export const ContextualHelpDrawer: React.FC<ContextualHelpDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
  onOpenFullHelpCenter
}) => {
  const { isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const helpMap: Record<string, PageHelpContent> = useMemo(
    () => ({
      home: {
        titleAr: 'الرئيسية ومساحة العمل (ERP Workspace)',
        titleEn: 'ERP Home Workspace',
        summaryAr: 'لوحة القيادة المركزية التي تجمع أهم مؤشرات الأداء، الإجراءات المستعجلة، والوصول السريع لجميع أقسام المؤسسة.',
        summaryEn: 'Central executive dashboard combining key performance indicators, urgent action items, and quick launchpads across all business modules.',
        whatCanIDoAr: [
          'الاطلاع على الرصيد المالي وحجم المبيعات والمشتريات الحية.',
          'متابعة التنبيهات المستعجلة مثل المستندات المستحقة والأصناف المنخفضة في المستودع.',
          'الوصول الفوري للوظائف اليومية الأكثر استخداماً.',
          'متابعة سجل آخر العمليات المنفذة في النظام.'
        ],
        whatCanIDoEn: [
          'View real-time cash balance, total sales, and purchases.',
          'Track urgent alerts such as due payments and low-stock inventory items.',
          'Quickly launch frequently used tasks and workflows.',
          'Inspect the latest operations audit stream.'
        ],
        howItWorksAr: [
          'يتم تحديث البيانات تلقائياً بناءً على العمليات المسجلة في السندات، المبيعات، المحاسبة، والمستودع.',
          'يمكنك استخدام زر + Create أو اختصار Ctrl + K من أي مكان للبدء بعمل جديد.'
        ],
        howItWorksEn: [
          'Data syncs in real-time across vouchers, inventory, POS, and accounting.',
          'Use the + Create button or Ctrl + K shortcut from anywhere to start a new task.'
        ],
        relatedPages: [
          { id: 'pos', labelAr: 'نقطة البيع (POS)', labelEn: 'Point of Sale' },
          { id: 'accounting', labelAr: 'دفتر الأستاذ العام', labelEn: 'General Ledger' },
          { id: 'crm', labelAr: 'دليل العملاء', labelEn: 'CRM Customers' }
        ],
        tipsAr: ['اضغط Ctrl + K لفتح شريط الأوامر السريعة والبحث عن أي عميل أو فاتورة أو وظيفة.'],
        tipsEn: ['Press Ctrl + K to open the command palette and quickly search for records or actions.']
      },
      accounting: {
        titleAr: 'المحاسبة العامة ودفتر الأستاذ (General Ledger)',
        titleEn: 'General Ledger & Financial Reporting',
        summaryAr: 'المحرك المالي للنظام، يتيح إدارة قيود اليومية، دليل الحسابات، ميزان المراجعة، قائمة الدخل، والمركز المالي وفق نظام القيد المزدوج.',
        summaryEn: 'The core financial engine enforcing double-entry bookkeeping, chart of accounts, trial balance, P&L, balance sheet, and bank reconciliation.',
        whatCanIDoAr: [
          'إنشاء وترحيل قيود اليومية (Journal Entries) مع فحص توازن المدين والدائن.',
          'إجراء قيود عكسية وتصحيحية مع توثيق الأسباب في سجل التدقيق.',
          'متابعة وتحديث دليل الحسابات (Chart of Accounts) واستعراض كشف حساب أي بند.',
          'إجراء المطابقة والتسوية البنكية الآلية بين الدفاتر وكشف البنك.',
          'استعراض وتصدير القوائم المالية الختامية وميزان المراجعة.'
        ],
        whatCanIDoEn: [
          'Create and post balanced double-entry journal entries.',
          'Generate reversal entries with documented reasons in the audit log.',
          'Manage the chart of accounts and print detailed account statements.',
          'Perform smart bank reconciliations between books and bank statements.',
          'View and export Trial Balance, Income Statement, and Balance Sheet.'
        ],
        howItWorksAr: [
          'كل عملية بيع، شراء، أو سند مالي تقوم بتوليد قيود محاسبية تلقائية متوازنة.',
          'لا يمكن حذف قيد مرحل، بل يتم تصحيحه عبر القيد العكسي (Reversal) لضمان الامتثال المحاسبي.'
        ],
        howItWorksEn: [
          'Operational transactions automatically sync balanced journal entries.',
          'Posted entries are immutable and must be corrected via reversal entries.'
        ],
        relatedPages: [
          { id: 'history', labelAr: 'سجل السندات', labelEn: 'Voucher History' },
          { id: 'settings', labelAr: 'إعدادات الفترات المالية', labelEn: 'Fiscal Periods Settings' }
        ]
      },
      pos: {
        titleAr: 'نقطة البيع الكاشير (Point of Sale)',
        titleEn: 'Point of Sale (POS)',
        summaryAr: 'واجهة سريعة للبائعين والكاشير لإصدار الفواتير الفورية، قراءة الباركود، وإدارة السداد النقدي والبنكي.',
        summaryEn: 'High-speed billing interface for cashiers with barcode scanning, instant receipts, and multi-payment support.',
        whatCanIDoAr: [
          'إضافة الأصناف للسلة بالباركود أو البحث السريع أو التصنيفات.',
          'تطبيق الخصومات والضرائب تلقائياً وحساب المتبقي للعميل.',
          'طباعة الإيصال الحراري أو مشاركة الفاتورة عبر واتساب.'
        ],
        whatCanIDoEn: [
          'Add items via barcode scanner, category clicks, or instant search.',
          'Apply discounts and tax calculations automatically with change return display.',
          'Print thermal 80mm receipts or share via WhatsApp.'
        ],
        howItWorksAr: [
          'عند إتمام البيع، يتم خصم الكميات تلقائياً من المستودع وتحديث الخزينة والقيود.'
        ],
        howItWorksEn: [
          'Completed sales automatically deduct inventory and update cashier ledger.'
        ],
        relatedPages: [
          { id: 'inventory', labelAr: 'المخزون والمستودعات', labelEn: 'Inventory' },
          { id: 'history', labelAr: 'سجل الفواتير', labelEn: 'Invoice History' }
        ]
      },
      crm: {
        titleAr: 'العملاء وإدارة العلاقات (CRM)',
        titleEn: 'CRM & Customer Directory',
        summaryAr: 'دليل شامل لبيانات العملاء، أرقام التواصل، الأرقام الضريبية، والأرصدة المستحقة وسجل المعاملات.',
        summaryEn: 'Customer directory managing profiles, contact information, VAT numbers, outstanding balances, and activity logs.',
        whatCanIDoAr: [
          'تسجيل وتعديل بيانات العملاء وسقف الائتمان.',
          'إصدار سند قبض فوري أو فاتورة خاصة بالعميل بنقرة واحدة.',
          'استعراض كشف حساب تفصيلي بحركات العميل.'
        ],
        whatCanIDoEn: [
          'Register and update client profiles and credit limits.',
          'Issue one-click receipt vouchers or invoices for specific customers.',
          'View detailed customer statement of accounts.'
        ],
        howItWorksAr: [
          'يقوم النظام تلقائياً بربط وحفظ العملاء الجدد عند إصدار أي سند مالي باسمهم.'
        ],
        howItWorksEn: [
          'The system auto-captures and syncs new customer names during voucher creation.'
        ],
        relatedPages: [
          { id: 'history', labelAr: 'سجل السندات', labelEn: 'Vouchers' },
          { id: 'contracts', labelAr: 'عقود الإيجار', labelEn: 'Lease Contracts' }
        ]
      },
      inventory: {
        titleAr: 'المخزون والمستودعات (Inventory)',
        titleEn: 'Inventory & Warehouse Management',
        summaryAr: 'متابعة أصناف المنتجات، الكميات المتوفرة، تكلفة الشراء، أسعار البيع، وتنبيهات النواقص.',
        summaryEn: 'Track inventory catalog, on-hand quantities, cost/selling prices, and low-stock reorder thresholds.',
        whatCanIDoAr: [
          'إضافة وتعديل بطاقات الأصناف والباركود والصور.',
          'متابعة حركات الوارد والمنصرف والتحويلات بين الفروع.',
          'تلقي تنبيهات عند اقتراب الكمية من الحد الأدنى.'
        ],
        whatCanIDoEn: [
          'Add and update product cards, barcodes, and images.',
          'Monitor in/out stock movements and branch transfers.',
          'Receive instant warnings for low-stock items.'
        ],
        howItWorksAr: [
          'يتم تحديث الكميات تلقائياً مع كل فاتورة بيع أو شراء أو تسوية جردية.'
        ],
        howItWorksEn: [
          'Stock quantities auto-update upon sales, purchases, or inventory adjustments.'
        ],
        relatedPages: [
          { id: 'purchases', labelAr: 'المشتريات والموردين', labelEn: 'Purchases' },
          { id: 'branches', labelAr: 'الفروع والتحويلات', labelEn: 'Branches & Transfers' }
        ]
      },
      purchases: {
        titleAr: 'المشتريات والموردين (Purchases)',
        titleEn: 'Purchases & Supplier Management',
        summaryAr: 'تسجيل فواتير الشراء من الموردين، وإثبات الدفعات والمصروفات، وزيادة رصيد المستودع.',
        summaryEn: 'Record supplier purchase bills, track payables, disburse payments, and restock warehouse inventory.',
        whatCanIDoAr: [
          'إدخال فواتير الشراء وربطها بالمورد والأصناف.',
          'إصدار سند صرف مباشر للمورد لتسوية الفاتورة.',
          'متابعة الذمم الدائنة ومواعيد السداد.'
        ],
        whatCanIDoEn: [
          'Log purchase bills linked to suppliers and inventory items.',
          'Issue one-click payment vouchers to settle supplier dues.',
          'Track accounts payable and due settlement dates.'
        ],
        howItWorksAr: [
          'تسجيل فاتورة الشراء يزيد كمية الأصناف في المستودع ويثبت التزام المورد محاسبياً.'
        ],
        howItWorksEn: [
          'Posting a purchase invoice automatically adds stock and credits supplier payable account.'
        ],
        relatedPages: [
          { id: 'inventory', labelAr: 'المستودع', labelEn: 'Inventory' },
          { id: 'accounting', labelAr: 'الأستاذ العام', labelEn: 'General Ledger' }
        ]
      },
      employees: {
        titleAr: 'الموارد البشرية والرواتب (HR & Payroll)',
        titleEn: 'HR & Payroll Management',
        summaryAr: 'إدارة ملفات الموظفين، الحضور والانصراف، الإجازات، واحتساب وإصدار مسيرات الرواتب الشهرية.',
        summaryEn: 'Manage employee directory, daily biometric attendance, leave requests, and monthly payroll processing.',
        whatCanIDoAr: [
          'إضافة ملفات الموظفين، بيانات الرواتب، والبدلات والخصومات.',
          'متابعة سجلات الحضور والانصراف وتطبيق كشك البصمة/الرمز (Kiosk).',
          'معالجة طلبات الإجازات والسلف والمكافآت الفورية.',
          'إصدار قسائم الرواتب الرسمية وترحيل قيود الرواتب للمحاسبة.'
        ],
        whatCanIDoEn: [
          'Add employee records, salary breakdowns, and allowances/deductions.',
          'Track attendance logs and operate the tablet attendance kiosk.',
          'Process leave requests, advances, and instant performance bonuses.',
          'Generate official salary payslips and sync payroll journal entries.'
        ],
        howItWorksAr: [
          'عند اعتماد مسير الرواتب، يتم توليد قيد مصروفات الرواتب وسندات الصرف تلقائياً.'
        ],
        howItWorksEn: [
          'Approving payroll dispatches salary expenses and links to disbursement ledger.'
        ],
        relatedPages: [
          { id: 'requests', labelAr: 'لوحة الطلبات', labelEn: 'Requests Dashboard' },
          { id: 'accounting', labelAr: 'دفتر الأستاذ', labelEn: 'General Ledger' }
        ]
      },
      spaces: {
        titleAr: 'المساحات التأجيرية والمكاتب (Rental Spaces)',
        titleEn: 'Rental Spaces & Units',
        summaryAr: 'إدارة وتأجير المساحات المشتركة، المكاتب، القاعات، وحجز الفترات بالساعة أو اليوم أو الشهر.',
        summaryEn: 'Manage co-working spaces, private offices, meeting rooms, and periodic bookings.',
        whatCanIDoAr: [
          'إضافة المساحات، القاعات، والسعة وأسعار الإيجار.',
          'تسجيل الحجوزات وإصدار سندات القبض التأمينية والإيجارية.',
          'متابعة حالة الإشغال والتوفر في الفروع المختلفة.'
        ],
        whatCanIDoEn: [
          'Add spaces, capacities, and hourly/daily/monthly rental tariffs.',
          'Log tenant bookings and issue rent or security deposit vouchers.',
          'Monitor occupancy status and unit availability across branches.'
        ],
        howItWorksAr: [
          'يتم ربط كل حجز بملف العميل وسند القبض وعقد الإيجار آلياً.'
        ],
        howItWorksEn: [
          'Bookings seamlessly link customer profiles, payments, and lease contracts.'
        ],
        relatedPages: [
          { id: 'contracts', labelAr: 'عقود الإيجار', labelEn: 'Lease Contracts' },
          { id: 'portal', labelAr: 'بوابة الحجز الذاتي', labelEn: 'Booking Portal' }
        ]
      },
      history: {
        titleAr: 'سجل السندات والفواتير (Vouchers History)',
        titleEn: 'Voucher & Document History',
        summaryAr: 'أرشيف موحد لكافة سندات القبض، الصرف، الفواتير الضريبية، وعروض الأسعار الصادرة مع خيارات البحث والطباعة والتصدير.',
        summaryEn: 'Unified searchable archive of all issued receipt vouchers, tax invoices, quotations, and expense payments.',
        whatCanIDoAr: [
          'البحث والفلترة برقم المستند، اسم العميل، التاريخ، أو نوع السند.',
          'معاينة المستند وإعادة الطباعة الحرارية أو A4 وتصدير PDF.',
          'تكرار المستند لإصدار نسخة جديدة مشابهة بضغطة زر.'
        ],
        whatCanIDoEn: [
          'Search and filter by document number, customer, date, or type.',
          'Preview, reprint in thermal or A4 formats, and export to PDF.',
          'Duplicate documents to issue similar records in one click.'
        ],
        howItWorksAr: [
          'يحفظ النظام كافة الحركات التاريخية مع سجل المراجعة والتعديلات.'
        ],
        howItWorksEn: [
          'Maintains immutable historic trails with full audit logs.'
        ],
        relatedPages: [
          { id: 'editor', labelAr: 'محرر السندات', labelEn: 'Voucher Editor' },
          { id: 'accounting', labelAr: 'الأستاذ العام', labelEn: 'General Ledger' }
        ]
      },
      settings: {
        titleAr: 'إعدادات النظام والمؤسسة (System Settings)',
        titleEn: 'Settings & Company Profile',
        summaryAr: 'تخصيص هوية المؤسسة، الشعار، الرقم الضريبي، العملة الافتراضية، إدارة الفروع، والمستخدمين وسجل الرقابة.',
        summaryEn: 'Customize company identity, logo, VAT ID, default currency, branch configurations, and security audit logs.',
        whatCanIDoAr: [
          'تحديث الترويسة والشعار وبيانات الاتصال للطباعة.',
          'ضبط نسبة الضريبة والعملة ومعدلات التقريب.',
          'مراجعة سجل الرقابة والتدقيق الأمني (Audit Logs).'
        ],
        whatCanIDoEn: [
          'Update company letterhead, logo, and contact info for printouts.',
          'Configure VAT rates, default currencies, and rounding rules.',
          'Audit system security logs and user activities.'
        ],
        howItWorksAr: [
          'تطبق التغييرات فوراً على جميع الفواتير والمستندات والتقارير في النظام.'
        ],
        howItWorksEn: [
          'Changes reflect immediately across all invoices, printouts, and reports.'
        ],
        relatedPages: [
          { id: 'branches', labelAr: 'الفروع', labelEn: 'Branches' },
          { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home' }
        ]
      }
    }),
    []
  );

  const currentHelp = helpMap[activeTab] || helpMap.home;

  if (!isOpen) return null;

  return (
    <div
      id="contextual-help-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="contextual-help-drawer"
        className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-s border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isRTL ? 'دليل الصفحة والمساعدة' : 'Page Guide & Help'}
              </h2>
              <p className="text-xs text-slate-500">{isRTL ? currentHelp.titleAr : currentHelp.titleEn}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 text-sm leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1 text-indigo-900">
                {isRTL ? 'ما هي هذه الشاشة؟' : 'What is this page?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">
                {isRTL ? currentHelp.summaryAr : currentHelp.summaryEn}
              </p>
            </div>
          </div>

          {/* What Can I Do? */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isRTL ? 'ماذا يمكنك فعله هنا؟' : 'What can you do here?'}</span>
            </h3>
            <div className="space-y-2">
              {(isRTL ? currentHelp.whatCanIDoAr : currentHelp.whatCanIDoEn).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isRTL ? 'كيف يعمل هذا القسم؟' : 'How does it work?'}</span>
            </h3>
            <div className="space-y-2">
              {(isRTL ? currentHelp.howItWorksAr : currentHelp.howItWorksEn).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-50/40 border border-amber-100/60 text-xs sm:text-sm text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {currentHelp.tipsAr && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 text-xs sm:text-sm flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{isRTL ? 'تلميحة سريعة: ' : 'Quick Tip: '}</span>
                <span>{isRTL ? currentHelp.tipsAr[0] : currentHelp.tipsEn?.[0]}</span>
              </div>
            </div>
          )}

          {/* Related Pages */}
          {currentHelp.relatedPages.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-slate-900 mb-2.5">
                {isRTL ? 'شاشات وأقسام مرتبطة' : 'Related Modules & Pages'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentHelp.relatedPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab(page.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{isRTL ? page.labelAr : page.labelEn}</span>
                    <ArrowIcon className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with full help center trigger */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (onOpenFullHelpCenter) onOpenFullHelpCenter();
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isRTL ? 'فتح مركز المساعدة ودليل المستخدم الكامل' : 'Open Full Help Center & Docs'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            {isRTL ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
