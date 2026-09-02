import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  HelpCircle,
  Keyboard,
  FileText,
  CreditCard,
  Users,
  Boxes,
  Truck,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Settings,
  ShieldCheck,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface HelpCenterViewProps {
  onNavigateTab: (tab: any) => void;
}

interface DocArticle {
  id: string;
  category: 'getting-started' | 'sales' | 'accounting' | 'inventory' | 'hr' | 'shortcuts' | 'faq';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  contentAr: string[];
  contentEn: string[];
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onNavigateTab }) => {
  const { isRTL, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('getting-started');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('gs-intro');

  const categories = [
    { id: 'getting-started', labelAr: 'البداية السريعة والتهيئة', labelEn: 'Getting Started', icon: Sparkles },
    { id: 'sales', labelAr: 'المبيعات والسندات والفواتير', labelEn: 'Sales & Invoicing', icon: FileText },
    { id: 'accounting', labelAr: 'المحاسبة ودفتر الأستاذ', labelEn: 'General Ledger', icon: Layers },
    { id: 'inventory', labelAr: 'المخزون والمشتريات', labelEn: 'Inventory & Purchases', icon: Boxes },
    { id: 'hr', labelAr: 'الموارد البشرية والرواتب', labelEn: 'HR & Payroll', icon: Users },
    { id: 'shortcuts', labelAr: 'اختصارات لوحة المفاتيح', labelEn: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'faq', labelAr: 'الأسئلة الشائعة والحلول', labelEn: 'FAQs & Troubleshooting', icon: HelpCircle }
  ];

  const articles: DocArticle[] = useMemo(
    () => [
      {
        id: 'gs-intro',
        category: 'getting-started',
        titleAr: 'مرحباً بك في نظام ديشال (Deshal ERP Overview)',
        titleEn: 'Welcome to Deshal ERP Overview',
        descAr: 'نظرة شاملة على بنية النظام وكيفية التنقل السريع بين الوحدات.',
        descEn: 'Comprehensive overview of the ERP structure and navigation model.',
        contentAr: [
          'ديشال ERP هو نظام متكامل مصمم لإدارة الأعمال والمبيعات والمخزون والمحاسبة والموارد البشرية في منصة موحدة.',
          'تعتمد تجربة الاستخدام على 3 مستويات: مساحة العمل المركزية (Home Workspace)، ثم لوحات الوحدات (Modules)، ثم شاشات العمل التخصصية.',
          'يمكنك الوصول لأي شاشة أو سجل في أقل من 3 نقرات، أو عبر شريط الأوامر السريع بالضغط على Ctrl + K.'
        ],
        contentEn: [
          'Deshal ERP is an integrated enterprise system designed to manage sales, inventory, double-entry accounting, and HR in a single unified platform.',
          'The user experience follows a 3-tier hierarchy: Central Workspace (Home), Module Hubs, and Specific Working Pages.',
          'You can navigate to any record or page in under 3 clicks, or instantly via the Command Palette (Ctrl + K).'
        ]
      },
      {
        id: 'gs-workspace',
        category: 'getting-started',
        titleAr: 'استخدام مساحة العمل والمفضلات (Workspace & Favorites)',
        titleEn: 'Using the Workspace & Favorites',
        descAr: 'كيفية تخصيص الشاشة الرئيسية وتثبيت الشاشات الأكثر استخداماً.',
        descEn: 'How to personalize your dashboard and pin favorite daily tools.',
        contentAr: [
          'تعرض الشاشة الرئيسية أهم مؤشرات الأداء الحية وحالة السيولة النقدية والمبيعات اليومية.',
          'يحتوي قسم التنبيهات المستعجلة على السندات المستحقة والأصناف التي بلغت حد الطلب الأدنى.',
          'استخدم زر "الإنشاء السريع + Create" في الشريط العلوي لبدء أي معاملة جديدة فوراً دون الحاجة للبحث داخل القوائم.'
        ],
        contentEn: [
          'The home workspace displays real-time cash balances, daily sales, and operational KPIs.',
          'The Action Center highlights pending due dates and low-stock replenishment warnings.',
          'Use the top "+ Create" quick-launch button to trigger any document creation immediately.'
        ]
      },
      {
        id: 'sales-vouchers',
        category: 'sales',
        titleAr: 'دورة إصدار سندات القبض والصرف والفواتير الضريبية',
        titleEn: 'Voucher Issuance & VAT Invoicing Workflow',
        descAr: 'شرح مفصل لطريقة إنشاء، معاينة، طباعة، وتصدير السندات.',
        descEn: 'Detailed guide on creating, previewing, printing, and exporting financial vouchers.',
        contentAr: [
          'سند القبض (Receipt Voucher): يستخدم لإثبات استلام مبالغ نقدية أو تحويلات بنكية أو شيكات من العملاء، ويحدث رصيد العميل فوراً.',
          'الفاتورة الضريبية (Tax Invoice): تتضمن تفاصيل الأصناف، ضريبة القيمة المضافة (VAT)، ورمز الاستجابة السريع (QR Code) المتوافق مع هيئة الزكاة والضرائب.',
          'سند الصرف (Payment Voucher): يستخدم لصرف دفعات للموردين أو المصروفات النثرية مع الربط المحاسبي التلقائي.',
          'طباعة وتصدير: يدعم النظام الطباعة الحرارية (80mm) وفواتير قياس A4 الرسمية وتصدير PDF ومشاركة واتساب مباشرة.'
        ],
        contentEn: [
          'Receipt Voucher: Used to record cash, bank transfers, or cheque receipts, immediately updating customer balance ledger.',
          'Tax Invoice: Includes itemized rows, automated VAT calculation, and official QR code verification.',
          'Payment Voucher: Used for vendor disbursements or petty cash with automated journal entry synchronization.',
          'Printing & Export: Full support for thermal 80mm receipts, official A4 letterheads, PDF export, and direct WhatsApp sharing.'
        ]
      },
      {
        id: 'accounting-ledger',
        category: 'accounting',
        titleAr: 'نظام القيد المزدوج ودفتر الأستاذ العام (General Ledger)',
        titleEn: 'Double-Entry Bookkeeping & General Ledger',
        descAr: 'كيف تضمن توازن القيود وقفل الفترات وعكس القيود المرحّلة.',
        descEn: 'Ensuring balanced entries, fiscal locking, and immutable reversal entries.',
        contentAr: [
          'قاعدة التوازن الصارمة: يشترط النظام تطابق طرفي القيد (المدين = الدائن) قبل السماح بترحيل القيد (POSTED) إلى الأستاذ العام.',
          'القيود العكسية (Reversal Entries): القيود المرحلة غير قابلة للحذف نهائياً. لتصحيح أو إلغاء قيد، استخدم زر "عكس القيد" مع تدوين السبب لتوثيقه في سجل الرقابة.',
          'التسوية البنكية: يمكنك مطابقة رصيد الدفاتر مع كشف حساب البنك آلياً أو يدوياً وتوليد قيود تسوية الفروق البنكية بنقرة واحدة.',
          'القوائم المالية الختامية: يستخرج النظام ميزان المراجعة، قائمة الدخل (الأرباح والخسائر)، والمركز المالي (الميزانية العمومية) لحظياً بناءً على الحسابات المرحلة.'
        ],
        contentEn: [
          'Strict Balancing: Every journal entry requires Total Debit = Total Credit before posting to the ledger.',
          'Reversal Entries: Posted entries are immutable. To correct errors, execute a Reversal Entry with mandatory audit trail explanation.',
          'Bank Reconciliation: Match bank ledger balances with actual statements via smart auto-match and post instant reconciliation adjustments.',
          'Financial Statements: Real-time generation of Trial Balance, Income Statement (P&L), and Balance Sheet.'
        ]
      },
      {
        id: 'inventory-guide',
        category: 'inventory',
        titleAr: 'إدارة بطاقات الأصناف وتتبع الحركات المخزنية',
        titleEn: 'Item Catalog & Stock Movement Tracking',
        descAr: 'تسجيل الأصناف، الباركود، حد الطلب، والتحويلات بين الفروع.',
        descEn: 'Registering products, barcodes, reorder levels, and branch transfers.',
        contentAr: [
          'بطاقة الصنف: تشمل كود الصنف (SKU)، الباركود، سعر التكلفة، سعر البيع، والكمية الافتتاحية.',
          'التحديث الآلي للمخزون: فواتير المشتريات تزيد المخزون، بينما فواتير المبيعات ونقاط البيع (POS) تخصم الكميات تلقائياً.',
          'تنبيهات حد الطلب: يظهر تنبيه فوري في مساحة العمل عند هبوط رصيد أي صنف عن الحد الأدنى المحدد.'
        ],
        contentEn: [
          'Product Master: Configure SKU, barcode, cost price, retail price, and initial stock quantities.',
          'Automated Sync: Purchase bills restock items while sales and POS automatically deduct warehouse stock.',
          'Reorder Alerts: The system fires instant low-stock notifications on the dashboard when items fall below minimum thresholds.'
        ]
      },
      {
        id: 'hr-payroll',
        category: 'hr',
        titleAr: 'إدارة الموظفين، كشك البصمة، ومسيرات الرواتب',
        titleEn: 'HR Management, Attendance Kiosk & Payroll',
        descAr: 'دليل شامل لملفات الموظفين، أجهزة الحضور، واحتساب الرواتب.',
        descEn: 'Managing personnel, tablet attendance kiosk, and monthly salary disbursement.',
        contentAr: [
          'ملف الموظف: يشمل الراتب الأساسي، البدلات، فرع العمل، وبيانات الاتصال والوثائق.',
          'كشك الحضور (Attendance Kiosk): واجهة مخصصة للأجهزة اللوحية لتسجيل الحضور والانصراف برقم التعريف أو الباركود.',
          'مسيرات الرواتب (Payroll): احتساب صافي الراتب بعد إضافة المكافآت وخصم السلف والغياب، مع إصدار قسائم الرواتب وترحيلها محاسبياً.'
        ],
        contentEn: [
          'Employee Profile: Basic salary, allowances, branch allocation, and contact files.',
          'Attendance Kiosk: Tablet-optimized kiosk interface for clock-in/out via PIN or QR code.',
          'Payroll Run: Automated calculation of net salaries accounting for advances, bonuses, and leaves, with instant GL posting.'
        ]
      },
      {
        id: 'shortcuts-guide',
        category: 'shortcuts',
        titleAr: 'قائمة اختصارات لوحة المفاتيح (Keyboard Shortcuts)',
        titleEn: 'System Keyboard Shortcuts',
        descAr: 'تنقل ونفذ العمليات بسرعة فائقة باستخدام لوحة المفاتيح.',
        descEn: 'Navigate and execute tasks with speed using keyboard shortcuts.',
        contentAr: [
          'Ctrl + K أو Cmd + K: فتح محرك البحث الشامل ولوحة الأوامر السريعة.',
          'Ctrl + P: طباعة المستند أو التقرير المعروض حالياً.',
          'Esc: إغلاق النوافذ المنبثقة والشاشات الجانبية.',
          '/ (Slash): التركيز المباشر على شريط البحث في أي جدول.'
        ],
        contentEn: [
          'Ctrl + K / Cmd + K: Open Global Search & Command Palette.',
          'Ctrl + P: Print current document or financial statement.',
          'Esc: Close active modal or drawer.',
          '/ (Slash): Focus search bar in tables and lists.'
        ]
      },
      {
        id: 'faq-guide',
        category: 'faq',
        titleAr: 'الأسئلة الشائعة واستكشاف الأخطاء (FAQs)',
        titleEn: 'Frequently Asked Questions & Troubleshooting',
        descAr: 'إجابات على أكثر الاستفسارات والحلول الموصى بها.',
        descEn: 'Common operational inquiries and recommended resolutions.',
        contentAr: [
          'س: كيف أعدل قيداً تم ترحيله للأستاذ العام؟ ج: القيود المرحلة لا تعدل مباشرة لضمان النزاهة المحاسبية؛ اضغط على زر "عكس القيد" لإنشاء قيد عكسي، ثم أنشئ القيد الصحيح.',
          'س: هل يمكن استخدام النظام بدون إنترنت؟ ج: نعم، النظام يدعم العمل دون اتصال (Offline-first PWA) ويقوم بمزامنة البيانات تلقائياً عند عودة الاتصال.',
          'س: كيف أضيف شعار وترويسة المؤسسة؟ ج: انتقل إلى "إعدادات النظام والمؤسسة" ثم قسم "الهوية والترويسة" وقم برفع الشعار وتخصيص الألوان.'
        ],
        contentEn: [
          'Q: How to edit a posted journal entry? A: Posted entries cannot be altered directly; use the "Reverse Entry" tool to generate an audit-logged reversal, then create the corrected entry.',
          'Q: Can I use the system offline? A: Yes, Deshal ERP is an offline-ready PWA that caches local actions and syncs when reconnected.',
          'Q: How to set up company branding? A: Navigate to Settings -> Company Profile to upload your logo, letterhead, and tax details.'
        ]
      }
    ],
    []
  );

  const filteredArticles = useMemo(() => {
    let list = articles.filter((a) => a.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = articles.filter(
        (a) =>
          a.titleAr.toLowerCase().includes(q) ||
          a.titleEn.toLowerCase().includes(q) ||
          a.descAr.toLowerCase().includes(q) ||
          a.descEn.toLowerCase().includes(q) ||
          a.contentAr.some((c) => c.toLowerCase().includes(q)) ||
          a.contentEn.some((c) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [articles, selectedCategory, searchQuery]);

  const activeArticle = useMemo(() => {
    return (
      filteredArticles.find((a) => a.id === selectedArticleId) ||
      filteredArticles[0] ||
      articles[0]
    );
  }, [filteredArticles, selectedArticleId, articles]);

  return (
    <div id="help-center-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200 mb-3 border border-white/10">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRTL ? 'مركز المساعدة ودليل الاستخدام' : 'Deshal ERP Documentation & Help Center'}</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black mb-2">
            {isRTL ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you succeed today?'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed mb-6">
            {isRTL
              ? 'دليل استرشادي شامل لجميع وظائف النظام، مع خطوات العمل التفصيلية واختصارات لوحة المفاتيح والأسئلة الشائعة.'
              : 'Complete user guide covering all ERP workflows, double-entry ledger tutorials, shortcuts, and troubleshooting.'}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="w-5 h-5 text-slate-400 absolute start-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRTL
                  ? 'ابحث في مواضيع الدليل والأسئلة الشائعة...'
                  : 'Search documentation topics, tutorials, and FAQs...'
              }
              className="w-full ps-11 pe-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:outline-hidden shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Categories + Content Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-4 space-y-2 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs h-fit">
          <h3 className="text-xs font-black text-slate-400 px-3 py-1 uppercase tracking-wider">
            {isRTL ? 'أقسام الدليل' : 'Documentation Modules'}
          </h3>

          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id && !searchQuery;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-start font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{isRTL ? cat.labelAr : cat.labelEn}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick shortcuts summary card */}
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950">
            <h4 className="text-xs font-black flex items-center gap-2 mb-2 text-indigo-900">
              <Keyboard className="w-3.5 h-3.5" />
              <span>{isRTL ? 'أهم الاختصارات السريعة' : 'Key Shortcuts'}</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span>{isRTL ? 'البحث الشامل' : 'Global Search'}</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-[10px]">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>{isRTL ? 'طباعة المستند' : 'Print Document'}</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-[10px]">Ctrl + P</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>{isRTL ? 'إغلاق النوافذ' : 'Close Modal'}</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-[10px]">ESC</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Article Reader Area */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          {/* Articles list if multiple */}
          {filteredArticles.length > 1 && (
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
              {filteredArticles.map((art) => (
                <button
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeArticle.id === art.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isRTL ? art.titleAr : art.titleEn}
                </button>
              ))}
            </div>
          )}

          {/* Article Header */}
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-2">
              {isRTL ? activeArticle.titleAr : activeArticle.titleEn}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isRTL ? activeArticle.descAr : activeArticle.descEn}
            </p>
          </div>

          {/* Article Paragraphs */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {(isRTL ? activeArticle.contentAr : activeArticle.contentEn).map((paragraph, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-800 leading-relaxed">{paragraph}</p>
              </div>
            ))}
          </div>

          {/* Action to Jump directly to Module */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold">
                {isRTL ? 'جاهز للبدء وتطبيق الخطوات في النظام؟' : 'Ready to start using these features in the ERP?'}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('home')}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              {isRTL ? 'الانتقال لمساحة العمل' : 'Go to Workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
