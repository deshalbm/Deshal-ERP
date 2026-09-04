import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Command,
  FileText,
  Users,
  Building2,
  Boxes,
  Truck,
  Layers,
  Sparkles,
  CreditCard,
  PlusCircle,
  TrendingUp,
  Settings,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  BookCheck
} from 'lucide-react';
import {
  ReceiptVoucher,
  Customer,
  Supplier,
  InventoryItem,
  Account,
  JournalEntry,
  Employee,
  PurchaseInvoice
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onQuickCreate: (type: string) => void;
  onSelectVoucher?: (voucher: ReceiptVoucher) => void;
  vouchers?: ReceiptVoucher[];
  customers?: Customer[];
  suppliers?: Supplier[];
  inventory?: InventoryItem[];
  accounts?: Account[];
  journalEntries?: JournalEntry[];
  employees?: Employee[];
  purchases?: PurchaseInvoice[];
  recentSearches?: string[];
  onSaveRecentSearch?: (query: string) => void;
  onOpenAiAssistant?: () => void;
  onOpenAttendanceKiosk?: () => void;
  onOpenOnboarding?: () => void;
}

interface SearchResultItem {
  id: string;
  category: 'pages' | 'actions' | 'customers' | 'suppliers' | 'vouchers' | 'inventory' | 'accounts' | 'journalEntries' | 'employees' | 'purchases';
  categoryLabelAr: string;
  categoryLabelEn: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ElementType;
  iconColor: string;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onQuickCreate,
  onSelectVoucher,
  vouchers = [],
  customers = [],
  suppliers = [],
  inventory = [],
  accounts = [],
  journalEntries = [],
  employees = [],
  purchases = [],
  onOpenAiAssistant,
  onOpenAttendanceKiosk,
  onOpenOnboarding
}) => {
  const { isRTL } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Core navigation pages
  const staticPages: SearchResultItem[] = useMemo(
    () => [
      {
        id: 'page-home',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'الرئيسية ومساحة العمل' : 'ERP Home Workspace',
        subtitle: isRTL ? 'نظرة عامة على النظام والمؤشرات' : 'System Overview & KPIs',
        icon: TrendingUp,
        iconColor: 'text-indigo-600',
        onSelect: () => {
          onNavigateTab('home');
          onClose();
        }
      },
      {
        id: 'page-pos',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'نقطة البيع الكاشير (POS)' : 'Point of Sale (POS)',
        subtitle: isRTL ? 'إصدار الفواتير الفورية والباركود' : 'Instant POS billing and barcode',
        icon: CreditCard,
        iconColor: 'text-emerald-600',
        onSelect: () => {
          onNavigateTab('pos');
          onClose();
        }
      },
      {
        id: 'page-accounting',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'المحاسبة ودفتر الأستاذ العام' : 'General Ledger & Accounting',
        subtitle: isRTL ? 'دليل الحسابات، ميزان المراجعة، القيود المحاسبية' : 'Chart of Accounts, Journal Entries',
        icon: BookOpen,
        iconColor: 'text-indigo-700',
        onSelect: () => {
          onNavigateTab('accounting');
          onClose();
        }
      },
      {
        id: 'page-crm',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'العملاء وإدارة العلاقات (CRM)' : 'CRM & Customers Directory',
        subtitle: isRTL ? 'دليل العملاء وكشوف الحسابات والشركات' : 'Customer profiles, contacts & balances',
        icon: Users,
        iconColor: 'text-blue-600',
        onSelect: () => {
          onNavigateTab('crm');
          onClose();
        }
      },
      {
        id: 'page-inventory',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'المخزون والمستودعات' : 'Inventory & Stock Management',
        subtitle: isRTL ? 'بطاقات الأصناف والكميات والباركود' : 'Stock items, barcodes and SKU tracking',
        icon: Boxes,
        iconColor: 'text-amber-600',
        onSelect: () => {
          onNavigateTab('inventory');
          onClose();
        }
      },
      {
        id: 'page-purchases',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'المشتريات وإدارة الموردين' : 'Purchases & Suppliers',
        subtitle: isRTL ? 'فواتير الشراء، الموردين وسندات الصرف' : 'Purchase Invoices & Vendors',
        icon: Truck,
        iconColor: 'text-purple-600',
        onSelect: () => {
          onNavigateTab('purchases');
          onClose();
        }
      },
      {
        id: 'page-employees',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'الموارد البشرية والرواتب (HR)' : 'HR & Payroll Management',
        subtitle: isRTL ? 'ملفات الموظفين، الحضور، ومسيرات الرواتب' : 'Staff, Attendance, and Payroll',
        icon: Users,
        iconColor: 'text-teal-600',
        onSelect: () => {
          onNavigateTab('employees');
          onClose();
        }
      },
      {
        id: 'page-spaces',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'المساحات التأجيرية والعقود' : 'Rental Spaces & Leases',
        subtitle: isRTL ? 'عقود الإيجار وحجز القاعات والمكاتب' : 'Lease contracts and meeting spaces',
        icon: Building2,
        iconColor: 'text-cyan-600',
        onSelect: () => {
          onNavigateTab('spaces');
          onClose();
        }
      },
      {
        id: 'page-history',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'سجل السندات والفواتير' : 'Vouchers & Invoice History',
        subtitle: isRTL ? 'سندات القبض، الصرف، والضريبية' : 'All issued vouchers and receipts',
        icon: FileText,
        iconColor: 'text-emerald-700',
        onSelect: () => {
          onNavigateTab('history');
          onClose();
        }
      },
      {
        id: 'page-settings',
        category: 'pages',
        categoryLabelAr: 'الشاشات الرئيسية',
        categoryLabelEn: 'Core Pages',
        title: isRTL ? 'إعدادات النظام والمؤسسة' : 'System Settings & Company Profile',
        subtitle: isRTL ? 'الترويسة، العملة، الضريبة، والمستخدمين' : 'Branding, Tax, and Security',
        icon: Settings,
        iconColor: 'text-slate-600',
        onSelect: () => {
          onNavigateTab('settings');
          onClose();
        }
      }
    ],
    [isRTL, onNavigateTab, onClose]
  );

  // Quick Action triggers
  const staticActions: SearchResultItem[] = useMemo(
    () => [
      {
        id: 'action-new-receipt',
        category: 'actions',
        categoryLabelAr: 'إجراءات سريعة',
        categoryLabelEn: 'Quick Actions',
        title: isRTL ? 'إصدار سند قبض جديد' : 'Create Receipt Voucher',
        subtitle: isRTL ? 'استلام دفعة نقدية أو بنكية من عميل' : 'Receive cash or bank payment',
        icon: PlusCircle,
        iconColor: 'text-emerald-600',
        onSelect: () => {
          onQuickCreate('receipt');
          onClose();
        }
      },
      {
        id: 'action-new-tax-invoice',
        category: 'actions',
        categoryLabelAr: 'إجراءات سريعة',
        categoryLabelEn: 'Quick Actions',
        title: isRTL ? 'إصدار فاتورة ضريبية' : 'Create Tax Invoice',
        subtitle: isRTL ? 'فاتورة مبيعات معتمدة مع رمز الاستجابة QR' : 'Official VAT sales invoice',
        icon: FileText,
        iconColor: 'text-blue-600',
        onSelect: () => {
          onQuickCreate('tax-invoice');
          onClose();
        }
      },
      {
        id: 'action-new-payment-voucher',
        category: 'actions',
        categoryLabelAr: 'إجراءات سريعة',
        categoryLabelEn: 'Quick Actions',
        title: isRTL ? 'إصدار سند صرف / مصروف' : 'Create Payment / Expense Voucher',
        subtitle: isRTL ? 'صرف مبالغ لمورد أو مصروفات تشغيلية' : 'Disburse payments or expenses',
        icon: CreditCard,
        iconColor: 'text-rose-600',
        onSelect: () => {
          onQuickCreate('payment');
          onClose();
        }
      },
      {
        id: 'action-new-customer',
        category: 'actions',
        categoryLabelAr: 'إجراءات سريعة',
        categoryLabelEn: 'Quick Actions',
        title: isRTL ? 'إضافة عميل جديد (CRM)' : 'Add New Customer (CRM)',
        subtitle: isRTL ? 'تسجيل عميل جديد في دليل العملاء' : 'Register customer profile',
        icon: Users,
        iconColor: 'text-indigo-600',
        onSelect: () => {
          onQuickCreate('customer');
          onClose();
        }
      },
      {
        id: 'action-new-journal-entry',
        category: 'actions',
        categoryLabelAr: 'إجراءات سريعة',
        categoryLabelEn: 'Quick Actions',
        title: isRTL ? 'إنشاء قيد يومية محاسبي' : 'New Journal Entry',
        subtitle: isRTL ? 'تسجيل قيد مزدوج في دفتر الأستاذ العام' : 'Double-entry general ledger record',
        icon: Layers,
        iconColor: 'text-purple-600',
        onSelect: () => {
          onQuickCreate('journal-entry');
          onClose();
        }
      }
    ],
    [isRTL, onQuickCreate, onClose]
  );

  // Dynamic search results across records
  const dynamicResults = useMemo(() => {
    if (!query.trim()) {
      return [...staticActions, ...staticPages];
    }

    const q = query.toLowerCase().trim();
    const results: SearchResultItem[] = [];

    // Match static actions & pages
    staticActions.forEach((item) => {
      if (item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q))) {
        results.push(item);
      }
    });

    staticPages.forEach((item) => {
      if (item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q))) {
        results.push(item);
      }
    });

    // Search Customers
    customers.forEach((c) => {
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchPhone = c.phone ? c.phone.includes(q) : false;
      const matchEmail = c.email ? c.email.toLowerCase().includes(q) : false;
      const matchCity = c.city ? c.city.toLowerCase().includes(q) : false;
      const matchContact = c.contactPerson ? c.contactPerson.toLowerCase().includes(q) : false;

      if (matchName || matchPhone || matchEmail || matchCity || matchContact) {
        results.push({
          id: `cust-${c.id}`,
          category: 'customers',
          categoryLabelAr: 'دليل العملاء',
          categoryLabelEn: 'Customers',
          title: c.name,
          subtitle: `${c.phone || ''} ${c.city ? '• ' + c.city : ''} ${c.email ? '• ' + c.email : ''}`,
          badge: isRTL ? 'عميل' : 'Customer',
          icon: Users,
          iconColor: 'text-blue-600',
          onSelect: () => {
            onNavigateTab('crm');
            onClose();
          }
        });
      }
    });

    // Search Suppliers
    suppliers.forEach((s) => {
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchPhone = s.phone ? s.phone.includes(q) : false;
      const matchEmail = s.email ? s.email.toLowerCase().includes(q) : false;
      const matchContact = s.contactPerson ? s.contactPerson.toLowerCase().includes(q) : false;

      if (matchName || matchPhone || matchEmail || matchContact) {
        results.push({
          id: `supp-${s.id}`,
          category: 'suppliers',
          categoryLabelAr: 'الموردين',
          categoryLabelEn: 'Suppliers',
          title: s.name,
          subtitle: `${s.contactPerson ? s.contactPerson + ' • ' : ''}${s.phone || ''} ${s.email ? '• ' + s.email : ''}`,
          badge: isRTL ? 'مورد' : 'Supplier',
          icon: Truck,
          iconColor: 'text-purple-600',
          onSelect: () => {
            onNavigateTab('purchases');
            onClose();
          }
        });
      }
    });

    // Search Vouchers
    vouchers.slice(0, 150).forEach((v) => {
      const matchNum = (v.voucherNumber || '').toLowerCase().includes(q);
      const matchParty = (v.receivedFrom || '').toLowerCase().includes(q);
      const matchRef = v.referenceNo ? v.referenceNo.toLowerCase().includes(q) : false;
      const matchNotes = v.notes ? v.notes.toLowerCase().includes(q) : false;

      if (matchNum || matchParty || matchRef || matchNotes) {
        results.push({
          id: `vouch-${v.id}`,
          category: 'vouchers',
          categoryLabelAr: 'السندات والفواتير',
          categoryLabelEn: 'Vouchers & Invoices',
          title: `${v.voucherNumber} - ${v.receivedFrom || 'مستند مالي'}`,
          subtitle: `${v.totalAmount ? v.totalAmount.toLocaleString() : 0} ${v.currency || 'OMR'} • ${v.date || ''}`,
          badge: v.type,
          icon: FileText,
          iconColor: 'text-emerald-600',
          onSelect: () => {
            if (onSelectVoucher) {
              onSelectVoucher(v);
            } else {
              onNavigateTab('preview');
            }
            onClose();
          }
        });
      }
    });

    // Search Inventory Items
    inventory.forEach((inv) => {
      const matchName = (inv.name || '').toLowerCase().includes(q);
      const matchSku = inv.sku ? inv.sku.toLowerCase().includes(q) : false;
      const matchBarcode = inv.barcode ? inv.barcode.includes(q) : false;
      const matchCategory = inv.category ? inv.category.toLowerCase().includes(q) : false;

      if (matchName || matchSku || matchBarcode || matchCategory) {
        results.push({
          id: `inv-${inv.id}`,
          category: 'inventory',
          categoryLabelAr: 'المخزون والأصناف',
          categoryLabelEn: 'Inventory Items',
          title: inv.name,
          subtitle: `SKU: ${inv.sku} • ${isRTL ? 'الكمية:' : 'Qty:'} ${inv.quantity} • ${inv.sellingPrice} OMR`,
          badge: inv.category,
          icon: Boxes,
          iconColor: 'text-amber-600',
          onSelect: () => {
            onNavigateTab('inventory');
            onClose();
          }
        });
      }
    });

    // Search Chart of Accounts
    accounts.forEach((acc) => {
      const matchCode = (acc.code || '').includes(q);
      const matchNameAr = (acc.nameAr || '').toLowerCase().includes(q);
      const matchNameEn = acc.nameEn ? acc.nameEn.toLowerCase().includes(q) : false;

      if (matchCode || matchNameAr || matchNameEn) {
        results.push({
          id: `acc-${acc.id}`,
          category: 'accounts',
          categoryLabelAr: 'دليل الحسابات',
          categoryLabelEn: 'Chart of Accounts',
          title: `${acc.code} - ${isRTL ? acc.nameAr : acc.nameEn || acc.nameAr}`,
          subtitle: `${acc.category || ''} • ${isRTL ? 'الرصيد:' : 'Balance:'} ${(acc.currentBalance || 0).toLocaleString()} ${acc.currency || 'OMR'}`,
          badge: acc.type,
          icon: Layers,
          iconColor: 'text-indigo-600',
          onSelect: () => {
            onNavigateTab('accounting');
            onClose();
          }
        });
      }
    });

    // Search Journal Entries (القيود اليومية)
    journalEntries.forEach((je) => {
      const matchEntryNum = (je.entryNumber || '').toLowerCase().includes(q);
      const matchDescAr = (je.descriptionAr || '').toLowerCase().includes(q);
      const matchDescEn = je.descriptionEn ? je.descriptionEn.toLowerCase().includes(q) : false;
      const matchRef = je.referenceNumber ? je.referenceNumber.toLowerCase().includes(q) : false;

      if (matchEntryNum || matchDescAr || matchDescEn || matchRef) {
        results.push({
          id: `je-${je.id}`,
          category: 'journalEntries',
          categoryLabelAr: 'القيود المحاسبية',
          categoryLabelEn: 'Journal Entries',
          title: `${je.entryNumber} - ${isRTL ? je.descriptionAr : je.descriptionEn || je.descriptionAr}`,
          subtitle: `${je.date} • ${isRTL ? 'الإجمالي:' : 'Total:'} ${(je.totalDebit || 0).toLocaleString()} ${je.currency || 'OMR'}`,
          badge: je.status,
          icon: BookCheck,
          iconColor: 'text-purple-600',
          onSelect: () => {
            onNavigateTab('accounting');
            onClose();
          }
        });
      }
    });

    // Search Employees
    employees.forEach((emp) => {
      const matchName = (emp.fullName || '').toLowerCase().includes(q);
      const matchNameEn = emp.fullNameEn ? emp.fullNameEn.toLowerCase().includes(q) : false;
      const matchJob = (emp.jobTitle || '').toLowerCase().includes(q);
      const matchCode = emp.employeeCode ? emp.employeeCode.toLowerCase().includes(q) : false;
      const matchPhone = emp.phone ? emp.phone.includes(q) : false;

      if (matchName || matchNameEn || matchJob || matchCode || matchPhone) {
        results.push({
          id: `emp-${emp.id}`,
          category: 'employees',
          categoryLabelAr: 'الموظفين',
          categoryLabelEn: 'Employees',
          title: `${emp.fullName} (${emp.jobTitle})`,
          subtitle: `${emp.employeeCode ? 'Code: ' + emp.employeeCode + ' • ' : ''}${emp.phone || ''} ${emp.department ? '• ' + emp.department : ''}`,
          badge: emp.department,
          icon: Users,
          iconColor: 'text-teal-600',
          onSelect: () => {
            onNavigateTab('employees');
            onClose();
          }
        });
      }
    });

    // Search Purchases
    purchases.forEach((p) => {
      const matchNum = (p.purchaseNumber || '').toLowerCase().includes(q);
      const matchSupplier = (p.supplierName || '').toLowerCase().includes(q);
      const matchInvoiceNo = p.supplierInvoiceNo ? p.supplierInvoiceNo.toLowerCase().includes(q) : false;

      if (matchNum || matchSupplier || matchInvoiceNo) {
        results.push({
          id: `pur-${p.id}`,
          category: 'purchases',
          categoryLabelAr: 'فواتير المشتريات',
          categoryLabelEn: 'Purchase Orders',
          title: `${p.purchaseNumber} - ${p.supplierName}`,
          subtitle: `${(p.totalAmount || 0).toLocaleString()} ${p.currency || 'OMR'} • ${p.date}`,
          badge: p.paymentStatus,
          icon: Truck,
          iconColor: 'text-indigo-600',
          onSelect: () => {
            onNavigateTab('purchases');
            onClose();
          }
        });
      }
    });

    return results;
  }, [query, staticActions, staticPages, customers, suppliers, vouchers, inventory, accounts, journalEntries, employees, purchases, isRTL, onNavigateTab, onSelectVoucher, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < dynamicResults.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : dynamicResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (dynamicResults[selectedIndex]) {
          dynamicResults[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dynamicResults, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="command-palette-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 md:p-12 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="command-palette-container"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              isRTL
                ? 'ابحث عن عميل، مورد، فاتورة، قيد محاسبي، حساب، موظف، أصناف، أو أمر سريع... (Ctrl + K)'
                : 'Search customers, suppliers, invoices, journal entries, accounts, employees, items... (Ctrl + K)'
            }
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-white border border-slate-300 rounded-md shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="command-palette-results"
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100"
        >
          {dynamicResults.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">
                {isRTL ? 'لم يتم العثور على نتائج مطابقة' : 'No matching records found'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isRTL ? `لا توجد سجلات تطابق "${query}"` : `No entries found for "${query}"`}
              </p>
            </div>
          ) : (
            dynamicResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-50/90 text-indigo-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate">{item.title}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 hidden sm:block shrink-0 px-2 py-0.5 rounded bg-slate-100/60 font-medium">
                    {isRTL ? item.categoryLabelAr : item.categoryLabelEn}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">↓</kbd>
              <span>{isRTL ? 'للتنقل' : 'Navigate'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">↵</kbd>
              <span>{isRTL ? 'للاختيار والفتح' : 'Select'}</span>
            </span>
          </div>
          <span className="text-slate-400">
            {dynamicResults.length} {isRTL ? 'نتيجة متوفرة' : 'results'}
          </span>
        </div>
      </div>
    </div>
  );
};
