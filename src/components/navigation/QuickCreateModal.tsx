import React from 'react';
import {
  FileText,
  CreditCard,
  Users,
  Truck,
  Boxes,
  Layers,
  Building2,
  Calendar,
  X,
  PlusCircle,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionType: string) => void;
}

interface QuickActionItem {
  id: string;
  category: 'finance' | 'partners' | 'supply' | 'hr';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const { isRTL } = useLanguage();

  if (!isOpen) return null;

  const actions: QuickActionItem[] = [
    {
      id: 'receipt',
      category: 'finance',
      titleAr: 'سند قبض مالي',
      titleEn: 'Receipt Voucher',
      descAr: 'تحصيل دفعة نقدية أو بنكية من عميل',
      descEn: 'Receive cash or bank payment',
      icon: PlusCircle,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200'
    },
    {
      id: 'tax-invoice',
      category: 'finance',
      titleAr: 'فاتورة ضريبية',
      titleEn: 'Tax Invoice',
      descAr: 'إصدار فاتورة مبيعات معتمدة بضريبة القيمة المضافة',
      descEn: 'Official VAT compliant sales invoice',
      icon: FileText,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200'
    },
    {
      id: 'payment',
      category: 'finance',
      titleAr: 'سند صرف / مصروف',
      titleEn: 'Payment Voucher',
      descAr: 'صرف دفعة لمورد أو تسديد مصروفات تشغيلية',
      descEn: 'Supplier payment or operational expense',
      icon: CreditCard,
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200'
    },
    {
      id: 'quotation',
      category: 'finance',
      titleAr: 'عرض سعر',
      titleEn: 'Quotation / Estimate',
      descAr: 'تقديم تسعيرة رسمية لعميل محتمل',
      descEn: 'Price estimate for prospective client',
      icon: FileText,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200'
    },
    {
      id: 'journal-entry',
      category: 'finance',
      titleAr: 'قيد يومية محاسبي',
      titleEn: 'Journal Entry',
      descAr: 'تسجيل قيد تسوية أو إثبات في دفتر الأستاذ',
      descEn: 'Double-entry ledger adjustment',
      icon: Layers,
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200'
    },
    {
      id: 'customer',
      category: 'partners',
      titleAr: 'عميل جديد (CRM)',
      titleEn: 'New Customer',
      descAr: 'إضافة ملف عميل وبيانات التواصل والضريبة',
      descEn: 'Register customer profile and tax info',
      icon: Users,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200'
    },
    {
      id: 'supplier',
      category: 'partners',
      titleAr: 'مورد جديد',
      titleEn: 'New Supplier',
      descAr: 'تسجيل مورد لربط المشتريات وفواتير الشراء',
      descEn: 'Add vendor for purchases and payables',
      icon: Truck,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200'
    },
    {
      id: 'inventory-item',
      category: 'supply',
      titleAr: 'صنف مخزني جديد',
      titleEn: 'New Inventory Product',
      descAr: 'إضافة صنف تجاري، باركود، وأسعار البيع والتكلفة',
      descEn: 'Add product, SKU, pricing, and stock',
      icon: Boxes,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200'
    },
    {
      id: 'employee',
      category: 'hr',
      titleAr: 'موظف جديد',
      titleEn: 'New Employee',
      descAr: 'إضافة موظف جديد للقسم، الراتب، وسجل الدوام',
      descEn: 'Onboard employee, salary, and branch',
      icon: UserCheck,
      colorClass: 'text-teal-600',
      bgClass: 'bg-teal-50 hover:bg-teal-100/80 border-teal-200'
    },
    {
      id: 'space-booking',
      category: 'supply',
      titleAr: 'حجز مساحة / عقد إيجار',
      titleEn: 'Space Booking / Lease',
      descAr: 'حجز قاعة، مكتب، أو إصدار عقد إيجار دوري',
      descEn: 'Book workspace, hall, or lease unit',
      icon: Building2,
      colorClass: 'text-cyan-600',
      bgClass: 'bg-cyan-50 hover:bg-cyan-100/80 border-cyan-200'
    }
  ];

  return (
    <div
      id="quick-create-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="quick-create-modal-container"
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isRTL ? 'الإنشاء السريع (Quick Create)' : 'Quick Create Launchpad'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRTL ? 'اختر الإجراء الذي تريد إنشاؤه مباشرة في النظام' : 'Choose what you want to create directly'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-start transition-all cursor-pointer group ${act.bgClass}`}
              >
                <div className={`p-2.5 rounded-xl bg-white shadow-2xs shrink-0 ${act.colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-950">
                    {isRTL ? act.titleAr : act.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {isRTL ? act.descAr : act.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{isRTL ? 'يمكنك دائماً استخدام الاختصار Ctrl + K للوصول الفوري' : 'You can always press Ctrl + K for quick access'}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            {isRTL ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
