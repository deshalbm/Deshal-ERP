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
  CheckCircle2
} from 'lucide-react';
import {
  ReceiptVoucher,
  Customer,
  Supplier,
  InventoryItem,
  Account,
  Employee,
  PurchaseInvoice
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onQuickCreate: (type: string) => void;
  vouchers?: ReceiptVoucher[];
  customers?: Customer[];
  suppliers?: Supplier[];
  inventory?: InventoryItem[];
  accounts?: Account[];
  employees?: Employee[];
  purchases?: PurchaseInvoice[];
  recentSearches?: string[];
  onSaveRecentSearch?: (query: string) => void;
}

interface SearchResultItem {
  id: string;
  category: 'pages' | 'actions' | 'customers' | 'suppliers' | 'vouchers' | 'inventory' | 'accounts' | 'employees';
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
  vouchers = [],
  customers = [],
  suppliers = [],
  inventory = [],
  accounts = [],
  employees = [],
  purchases = []
}) => {
  const { isRTL, language } = useLanguage();
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
        subtitle: isRTL ? 'دليل الحسابات، ميزان المراجعة، والتسويات' : 'Chart of Accounts, Trial Balance',
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
        subtitle: isRTL ? 'دليل العملاء وكشوف الحسابات' : 'Customer profiles and balances',
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
        subtitle: isRTL ? 'بطاقات الأصناف والكميات' : 'Stock items and quantities',
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
        subtitle: isRTL ? 'فواتير الشراء وسندات الصرف' : 'Purchase Invoices & Bills',
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
        subtitle: isRTL ? 'عقود الإيجار والوحدات' : 'Lease contracts and spaces',
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
        title: isRTL ? 'إضافة عميل جديد' : 'Add New Customer',
        subtitle: isRTL ? 'تسجيل عميل جديد في دليل العملاء' : 'Register customer profile',
        icon: Users,
        iconColor: 'text-indigo-600',
        onSelect: () => {
          onNavigateTab('crm');
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
          onNavigateTab('accounting');
          onClose();
        }
      }
    ],
    [isRTL, onQuickCreate, onNavigateTab, onClose]
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
      if (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      ) {
        results.push({
          id: `cust-${c.id}`,
          category: 'customers',
          categoryLabelAr: 'دليل العملاء',
          categoryLabelEn: 'Customers',
          title: c.name,
          subtitle: `${c.phone || ''} ${c.email ? '• ' + c.email : ''}`,
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
      if (
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.company && s.company.toLowerCase().includes(q))
      ) {
        results.push({
          id: `supp-${s.id}`,
          category: 'suppliers',
          categoryLabelAr: 'الموردين',
          categoryLabelEn: 'Suppliers',
          title: s.name,
          subtitle: `${s.company || ''} ${s.phone ? '• ' + s.phone : ''}`,
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
    vouchers.slice(0, 100).forEach((v) => {
      if (
        v.voucherNumber.toLowerCase().includes(q) ||
        v.receivedFrom.toLowerCase().includes(q) ||
        (v.notes && v.notes.toLowerCase().includes(q))
      ) {
        results.push({
          id: `vouch-${v.id}`,
          category: 'vouchers',
          categoryLabelAr: 'السندات والفواتير',
          categoryLabelEn: 'Vouchers & Invoices',
          title: `${v.voucherNumber} - ${v.receivedFrom}`,
          subtitle: `${v.totalAmount.toLocaleString()} ${v.currency} • ${v.date}`,
          badge: v.type,
          icon: FileText,
          iconColor: 'text-emerald-600',
          onSelect: () => {
            onNavigateTab('history');
            onClose();
          }
        });
      }
    });

    // Search Inventory
    inventory.forEach((inv) => {
      if (
        inv.nameAr.toLowerCase().includes(q) ||
        (inv.nameEn && inv.nameEn.toLowerCase().includes(q)) ||
        (inv.sku && inv.sku.toLowerCase().includes(q)) ||
        (inv.barcode && inv.barcode.includes(q))
      ) {
        results.push({
          id: `inv-${inv.id}`,
          category: 'inventory',
          categoryLabelAr: 'المخزون والأصناف',
          categoryLabelEn: 'Inventory Items',
          title: isRTL ? inv.nameAr : inv.nameEn || inv.nameAr,
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
      if (
        acc.code.includes(q) ||
        acc.nameAr.toLowerCase().includes(q) ||
        (acc.nameEn && acc.nameEn.toLowerCase().includes(q))
      ) {
        results.push({
          id: `acc-${acc.id}`,
          category: 'accounts',
          categoryLabelAr: 'دليل الحسابات',
          categoryLabelEn: 'Chart of Accounts',
          title: `${acc.code} - ${isRTL ? acc.nameAr : acc.nameEn || acc.nameAr}`,
          subtitle: `${acc.category} • ${isRTL ? 'الرصيد:' : 'Balance:'} ${acc.currentBalance.toLocaleString()}`,
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

    // Search Employees
    employees.forEach((emp) => {
      if (
        emp.name.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q) ||
        (emp.employeeCode && emp.employeeCode.includes(q)) ||
        (emp.phone && emp.phone.includes(q))
      ) {
        results.push({
          id: `emp-${emp.id}`,
          category: 'employees',
          categoryLabelAr: 'الموظفين',
          categoryLabelEn: 'Employees',
          title: `${emp.name} (${emp.jobTitle})`,
          subtitle: `${emp.employeeCode ? 'Code: ' + emp.employeeCode + ' • ' : ''}${emp.phone || ''}`,
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

    return results;
  }, [query, staticActions, staticPages, customers, suppliers, vouchers, inventory, accounts, employees, isRTL, onNavigateTab, onClose]);

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
                ? 'ابحث عن عميل، مورد، فاتورة، قيد، حساب، موظف، أو أمر سريع... (Ctrl + K)'
                : 'Search customers, invoices, vouchers, ledger, employees, or command... (Ctrl + K)'
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
