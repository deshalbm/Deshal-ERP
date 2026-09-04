import React, { useState } from "react";
import {
  LeaseContract,
  DepositStatus
} from "../types";
import {
  X,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calculator,
  Check,
  Sparkles,
  Building2,
  UserCheck
} from "lucide-react";

interface SecurityDepositModalProps {
  contract: LeaseContract;
  onSaveDepositSettlement: (updatedContract: LeaseContract, refundVoucherData?: any) => void;
  onClose: () => void;
}

export const SecurityDepositModal: React.FC<SecurityDepositModalProps> = ({
  contract,
  onSaveDepositSettlement,
  onClose
}) => {
  const deposit = contract.securityDeposit;
  const initialDeposit = deposit.depositAmount || 0;

  const [depositStatus, setDepositStatus] = useState<DepositStatus>(
    deposit.status || "HELD_IN_CUSTODY"
  );
  const [deductedAmount, setDeductedAmount] = useState<number>(
    deposit.deductedAmount || 0
  );
  const [deductionReason, setDeductionReason] = useState<string>(
    deposit.deductionReason || ""
  );
  const [settlementNotes, setSettlementNotes] = useState<string>(
    deposit.settlementNotes || ""
  );
  const [autoCreatePaymentVoucher, setAutoCreatePaymentVoucher] = useState<boolean>(true);

  // Inspection Checklist
  const [inspectionItems, setInspectionItems] = useState([
    { id: "keys", label: "تسليم كافة بطاقات الدخول الذكية والمفاتيح", passed: true },
    { id: "furniture", label: "سلامة المكاتب والكراسي والأثاث التجهيزي", passed: true },
    { id: "screens", label: "سلامة الشاشات التفاعلية وأجهزة العرض", passed: true },
    { id: "ac", label: "كفاءة ونظافة وحدات التكييف والإنارة", passed: true },
    { id: "walls", label: "سلامة الجدران والدهان وخلوها من التلفيات", passed: true },
    { id: "bills", label: "تسوية كافة فواتير الخدمات الإضافية والاستشارات", passed: true }
  ]);

  const netRefundAmount = Math.max(0, initialDeposit - deductedAmount);

  const handleToggleChecklist = (id: string) => {
    setInspectionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
  };

  const handleSave = () => {
    let finalStatus: DepositStatus = depositStatus;
    if (deductedAmount >= initialDeposit && initialDeposit > 0) {
      finalStatus = "FORFEITED";
    } else if (deductedAmount > 0 && netRefundAmount > 0) {
      finalStatus = "PARTIALLY_REFUNDED";
    } else if (netRefundAmount === initialDeposit && depositStatus !== "HELD_IN_CUSTODY") {
      finalStatus = "FULLY_REFUNDED";
    }

    const updatedContract: LeaseContract = {
      ...contract,
      securityDeposit: {
        ...deposit,
        status: finalStatus,
        deductedAmount,
        deductionReason,
        refundedAmount: netRefundAmount,
        refundDate: new Date().toISOString().split("T")[0],
        settlementNotes,
        refundPaymentVoucherNumber: autoCreatePaymentVoucher
          ? `PV-REF-${Math.floor(1000 + Math.random() * 9000)}`
          : undefined
      },
      updatedAt: new Date().toISOString()
    };

    onSaveDepositSettlement(updatedContract, {
      amount: netRefundAmount,
      tenantName: contract.tenantName,
      contractNumber: contract.contractNumber
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 text-right font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  إدارة وتسوية الضمان المالي والتأمين المسترد
                </h2>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                العقد: <span className="font-mono font-bold text-white">{contract.contractNumber}</span> • المستأجر: {contract.tenantName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[10px] block">مبلغ التأمين المحفوظ كأمانة</span>
              <span className="font-black text-slate-900 text-base font-mono">
                {initialDeposit.toFixed(3)} ر.ع
              </span>
            </div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-200">
              <span className="text-red-600 text-[10px] block font-semibold">استقطاع تلفيات / فواتير</span>
              <span className="font-black text-red-700 text-base font-mono">
                {deductedAmount.toFixed(3)} ر.ع
              </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span className="text-emerald-700 text-[10px] block font-bold">صافي المبلغ المسترد للمستأجر</span>
              <span className="font-black text-emerald-950 text-base font-mono">
                {netRefundAmount.toFixed(3)} ر.ع
              </span>
            </div>
          </div>

          {/* Inspection Checklist */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              قائمة الفحص والمعاينة عند الإخلاء والتسليم (Move-out Inspection):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inspectionItems.map((item) => (
                <label
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                    item.passed
                      ? "bg-white border-emerald-300 text-slate-800"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.passed}
                    onChange={() => {}}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Deduction & Status Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                مبلغ الخصم (للتلفيات أو الخدمات غير المسددة)
              </label>
              <input
                type="number"
                min={0}
                max={initialDeposit}
                step="0.001"
                value={deductedAmount}
                onChange={(e) => setDeductedAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                حالة التأمين والوديعة
              </label>
              <select
                value={depositStatus}
                onChange={(e) => setDepositStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
              >
                <option value="HELD_IN_CUSTODY">محفوظ كأمانة (Held in Custody)</option>
                <option value="FULLY_REFUNDED">رد التأمين بالكامل (Full Refund)</option>
                <option value="PARTIALLY_REFUNDED">رد جزئي بعد الخصم (Partial Refund)</option>
                <option value="FORFEITED">مصادرة التأمين بالكامل للتعويض</option>
              </select>
            </div>

            {deductedAmount > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  أسباب وتفاصيل الاستقطاع
                </label>
                <input
                  type="text"
                  placeholder="مثال: خصم قيمة دهان جدار المكتب وإصلاح مقبض الباب الذكي"
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                ملاحظات محضر التسليم والتسوية المالية
              </label>
              <textarea
                rows={2}
                placeholder="أدخل أي ملاحظات حول فحص المكتب أو طريقة تحويل مبلغ الاسترداد..."
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
              />
            </div>
          </div>

          {/* Auto Create Payment Voucher Checkbox */}
          <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="font-bold text-indigo-950 block">إصدار سند صرف تلقائي لمبلغ الاسترداد</span>
                <span className="text-[11px] text-slate-500">
                  توليد سند صرف محاسبي رسمي في دفتر الأستاذ العام وتسجيل تسوية التأمين
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoCreatePaymentVoucher}
              onChange={(e) => setAutoCreatePaymentVoucher(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>اعتماد تسوية التأمين وحفظ المحضر</span>
          </button>
        </div>

      </div>
    </div>
  );
};
