import React from "react";
import { X, Share, PlusSquare, Smartphone, CheckCircle } from "lucide-react";

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative overflow-hidden"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 space-x-reverse mb-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">تثبيت التطبيق على iPhone / iPad</h3>
            <p className="text-xs text-slate-500 font-medium">منظومة ديشال لإدارة الأعمال (Deshal ERP) - تطبيق ويب تقدمي (PWA)</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">اضغط على زر المشاركة (Share)</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                أيقونة المربع مع سهم لأعلى في متصفح Safari <Share className="w-4 h-4 text-indigo-600 inline" />
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">اختر "إضافة إلى الشاشة الرئيسية"</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                تمرير لأسفل واختيار <span className="font-bold text-indigo-700">"Add to Home Screen"</span> <PlusSquare className="w-4 h-4 text-indigo-600 inline" />
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">اضغط على "إضافة" (Add)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                سيظهر التطبيق مباشرة على شاشتك الرئيسية ويعمل بكامل إمكانياته وبدون اتصال بالإنترنت!
              </p>
            </div>
          </div>

        </div>

        {/* Benefits Checklist */}
        <div className="space-y-2 mb-6 text-xs text-slate-600">
          <div className="flex items-center space-x-2 space-x-reverse text-emerald-700 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>يعمل بدون إنترنت (Offline Ready)</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse text-emerald-700 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تشغيل فوري وسريع وبملء الشاشة كالتطبيقات الأصلية</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse text-emerald-700 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>حفظ وتصدير وطباعة سندات القبض بدقة عالية</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm cursor-pointer text-center"
        >
          فهمت ذلك، شكراً
        </button>
      </div>
    </div>
  );
};
