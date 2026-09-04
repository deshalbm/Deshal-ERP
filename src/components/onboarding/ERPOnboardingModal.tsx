import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Users,
  Layers,
  Truck,
  Boxes,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronRight,
  Check,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface ERPOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onCompleteOnboarding?: () => void;
}

interface OnboardingStep {
  id: string;
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  targetTab: string;
  icon: React.ElementType;
}

export const ERPOnboardingModal: React.FC<ERPOnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onCompleteOnboarding
}) => {
  const { isRTL } = useLanguage();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    'step-company': true
  });

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const steps: OnboardingStep[] = [
    {
      id: 'step-company',
      stepNumber: 1,
      titleAr: 'تهيئة هوية المؤسسة والترويسة',
      titleEn: 'Company Profile & Branding',
      descAr: 'تحديد اسم المنشأة، الشعار، العملة الافتراضية، والرقم الضريبي للفواتير.',
      descEn: 'Configure company name, official logo, default currency, and tax ID.',
      targetTab: 'settings',
      icon: Building2
    },
    {
      id: 'step-accounts',
      stepNumber: 2,
      titleAr: 'مراجعة دليل الحسابات المالي',
      titleEn: 'Chart of Accounts Setup',
      descAr: 'استعراض شجرة الحسابات، الصناديق، البنوك، وحسابات الإيرادات والمصروفات.',
      descEn: 'Verify financial tree, cash boxes, bank accounts, and P&L categories.',
      targetTab: 'accounting',
      icon: Layers
    },
    {
      id: 'step-customers',
      stepNumber: 3,
      titleAr: 'إضافة أول عميل في النظام',
      titleEn: 'Register First Customer',
      descAr: 'تسجيل بيانات العملاء لإصدار الفواتير وسندات القبض وعقود الإيجار.',
      descEn: 'Add customer profiles to start issuing invoices, receipts, and leases.',
      targetTab: 'crm',
      icon: Users
    },
    {
      id: 'step-inventory',
      stepNumber: 4,
      titleAr: 'إضافة الأصناف والخدمات في المخزون',
      titleEn: 'Configure Catalog & Inventory',
      descAr: 'تسجيل المنتجات، الأسعار، الباركود، والكميات المتوفرة للبيع الفوري.',
      descEn: 'Add products, pricing, barcodes, and on-hand inventory balances.',
      targetTab: 'inventory',
      icon: Boxes
    },
    {
      id: 'step-suppliers',
      stepNumber: 5,
      titleAr: 'تسجيل الموردين وإدخال فواتير الشراء',
      titleEn: 'Suppliers & Purchase Bills',
      descAr: 'ربط الموردين وتوثيق مشتريات البضائع والمصروفات التشغيلية.',
      descEn: 'Onboard vendors and record restocking bills and expenses.',
      targetTab: 'purchases',
      icon: Truck
    },
    {
      id: 'step-vouchers',
      stepNumber: 6,
      titleAr: 'إصدار أول سند أو فاتورة مبيعات',
      titleEn: 'Issue First Invoice / Receipt',
      descAr: 'تجربة دورة البيع والتحصيل الفوري وطباعة الإيصال الحراري والرسمي.',
      descEn: 'Test instant sales billing, receipt vouchers, and receipt printing.',
      targetTab: 'pos',
      icon: CreditCard
    }
  ];

  if (!isOpen) return null;

  const currentStep = steps[currentStepIdx];
  const progressPercent = Math.round((Object.keys(completedSteps).length / steps.length) * 100);

  const handleToggleStepCompleted = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleNext = () => {
    if (currentStepIdx + 1 < steps.length) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      if (onCompleteOnboarding) onCompleteOnboarding();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  return (
    <div
      id="onboarding-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="onboarding-modal-container"
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Banner */}
        <div className="p-6 bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRTL ? 'معالج التهيئة السريعة' : 'Guided ERP Onboarding'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mb-1">
            {isRTL ? 'مرحباً بك في نظام ديشال ERP' : 'Welcome to Deshal ERP'}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200">
            {isRTL
              ? 'اتبع هذه الخطوات البسيطة لتهيئة النظام والبدء في إدارة أعمالك باحترافية وسرعة.'
              : 'Follow these quick steps to configure the system and jumpstart your operations.'}
          </p>

          {/* Progress Bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-indigo-200">
              <span>{isRTL ? 'نسبة الجاهزية والتهيئة' : 'Setup Progress'}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Step Pill Navigator */}
          <div className="grid grid-cols-6 gap-1.5">
            {steps.map((st, idx) => {
              const isDone = !!completedSteps[st.id];
              const isCurrent = idx === currentStepIdx;

              return (
                <button
                  key={st.id}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Step Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                {React.createElement(currentStep.icon, { className: 'w-6 h-6' })}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {isRTL ? `الخطوة ${currentStep.stepNumber} من ${steps.length}` : `Step ${currentStep.stepNumber} of ${steps.length}`}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!completedSteps[currentStep.id]}
                      onChange={() => handleToggleStepCompleted(currentStep.id)}
                      className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {isRTL ? 'تم الإنجاز' : 'Mark Completed'}
                    </span>
                  </label>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {isRTL ? currentStep.titleAr : currentStep.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {isRTL ? currentStep.descAr : currentStep.descEn}
                </p>
              </div>
            </div>

            {/* Jump Action Button */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  onNavigateTab(currentStep.targetTab);
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>{isRTL ? 'الانتقال لهذه الشاشة والبدء فوراً' : 'Go to this screen now'}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer ${
              currentStepIdx === 0 ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isRTL ? 'السابق' : 'Previous'}
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            {currentStepIdx === steps.length - 1 ? (isRTL ? 'إنهاء المعالج' : 'Finish') : (isRTL ? 'التالي' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
};
