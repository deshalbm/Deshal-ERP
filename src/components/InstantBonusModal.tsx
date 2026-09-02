import React, { useState, useEffect } from "react";
import {
  Employee,
  PayrollSlip,
  CompanySettings,
  ReceiptVoucher,
  Branch,
  LineItem,
  PaymentMethod
} from "../types";
import {
  Award,
  Sparkles,
  ShieldAlert,
  Building2,
  Receipt,
  CheckCircle2,
  X,
  AlertTriangle,
  Wallet,
  Calendar,
  CreditCard,
  FileText,
  Sliders,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import { numberToWords } from "../utils/numberToWords";

export interface InstantBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  payrollMonth: string;
  branches: Branch[];
  companySettings: CompanySettings;
  payrollSlips?: PayrollSlip[];
  onSaveBonusDisbursement: (
    employee: Employee,
    bonusAmount: number,
    bonusReason: string,
    treasuryAccount: string,
    paymentMethod: PaymentMethod,
    paymentDate: string,
    voucher: ReceiptVoucher,
    updatedSlip?: PayrollSlip
  ) => void;
  onViewVoucher?: (voucher: ReceiptVoucher) => void;
}

export const TREASURY_ACCOUNTS = [
  { id: "treasury-cash-main", name: "الخزينة النقدية الرئيسية (Main Cash Vault)", type: "CASH" },
  { id: "treasury-bank-muscat", name: "حساب بنك مسقط الجاري (Bank Muscat)", type: "BANK_TRANSFER" },
  { id: "treasury-bank-dhofar", name: "حساب بنك ظفار التجاري (Bank Dhofar)", type: "BANK_TRANSFER" },
  { id: "treasury-petty-branch", name: "عهدة الفرع النقدية السريعة (Branch Petty Cash)", type: "CASH" }
];

export const BONUS_REASON_PRESETS = [
  "حافز تميز وإنجاز استثنائي في العمل",
  "عمولة إغلاق صفقة وعقد تأجير جديد",
  "مكافأة إتمام مشروع تقني قبل الموعد",
  "إكرامية ولاء وإتقان وخدمة عملاء ممتازة",
  "بدل عمل إضافي ومهام طارئة"
];

export const InstantBonusModal: React.FC<InstantBonusModalProps> = ({
  isOpen,
  onClose,
  employee,
  payrollMonth,
  branches,
  companySettings,
  payrollSlips = [],
  onSaveBonusDisbursement,
  onViewVoucher
}) => {
  const { language, dir, isRTL } = useLanguage();

  const [bonusAmount, setBonusAmount] = useState<number>(50);
  const [bonusReason, setBonusReason] = useState<string>(BONUS_REASON_PRESETS[0]);
  const [treasuryAccount, setTreasuryAccount] = useState<string>("الخزينة النقدية الرئيسية");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [overrideCapConfirmed, setOverrideCapConfirmed] = useState<boolean>(false);
  const [createdVoucher, setCreatedVoucher] = useState<ReceiptVoucher | null>(null);

  // Initialize form when opening
  useEffect(() => {
    if (!isOpen || !employee) return;

    const defaultBonus = employee.maxBonusCap ? Math.min(50, employee.maxBonusCap) : 50;
    setBonusAmount(defaultBonus);
    setBonusReason(BONUS_REASON_PRESETS[0]);
    setTreasuryAccount(employee.preferredBonusTreasury || "الخزينة النقدية الرئيسية");
    setPaymentMethod(employee.preferredBonusTreasury?.includes("بنك") ? "BANK_TRANSFER" : "CASH");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setReferenceNo(`BONUS-${payrollMonth}-${employee.employeeCode}`);
    setNotes(`صرف مكافأة تحفيزية مباشرة عبر الخزينة للموظف ${employee.fullName}`);
    setOverrideCapConfirmed(false);
    setCreatedVoucher(null);
  }, [isOpen, employee, payrollMonth]);

  if (!isOpen || !employee) return null;

  const maxBonusCap = employee.maxBonusCap || 0;
  const maxSalaryCap = employee.maxSalaryCap || 0;
  const currency = companySettings.currency || "OMR";

  // Calculate bonuses already given in the current month
  const existingSlip = payrollSlips.find(
    (s) => s.employeeId === employee.id && s.payrollMonth === payrollMonth
  );
  const currentMonthBonusSoFar = existingSlip ? Number(existingSlip.bonus || 0) : 0;
  const totalBonusWithNew = currentMonthBonusSoFar + Number(bonusAmount || 0);

  const isExceedingCap = maxBonusCap > 0 && totalBonusWithNew > maxBonusCap;
  const capSurplus = totalBonusWithNew - maxBonusCap;

  const currentTotalCompensation = Number(employee.basicSalary || 0) + Number(employee.allowances || 0) + totalBonusWithNew;
  const isExceedingSalaryCap = maxSalaryCap > 0 && currentTotalCompensation > maxSalaryCap;

  const bonusWords = numberToWords(bonusAmount, currency, language === "en" ? "en" : "ar");

  const handleDisburseAndIssueVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (bonusAmount <= 0) return;
    if (isExceedingCap && !overrideCapConfirmed) return;

    const currYear = new Date().getFullYear();
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const voucherNum = `PV-BONUS-${currYear}-${randSeq}`;

    const lineItems: LineItem[] = [
      {
        id: `li-bonus-${Date.now()}`,
        description: `مكافأة وحافز مالي [${bonusReason}] - للموظف: ${employee.fullName} (${employee.employeeCode})`,
        quantity: 1,
        unitPrice: bonusAmount,
        amount: bonusAmount
      }
    ];

    const newVoucher: ReceiptVoucher = {
      id: `rv-bonus-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "PAYMENT",
      voucherNumber: voucherNum,
      referenceNo: referenceNo.trim() || `BONUS-${payrollMonth}-${employee.employeeCode}`,
      date: paymentDate,
      receivedFrom: companySettings.name || "شركة ديشال المتميزة",
      paidTo: employee.fullName,
      amount: bonusAmount,
      currency,
      amountInWords: bonusWords,
      isCustomWords: false,
      paymentMethod,
      category: "مكافآت وحوافز موظفين",
      lineItems,
      subtotal: bonusAmount,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: bonusAmount,
      notes: `صرف مكافأة استثنائية من (${treasuryAccount}) للموظف ${employee.fullName} (${employee.employeeCode}) - المسمى: ${employee.jobTitle}. المبرر: ${bonusReason}`,
      terms: "تم الصرف النقدي/البنكي المباشر من الخزينة بموجب تفويض الإدارة وسقف المكافآت المعتمد.",
      customFields: [
        { id: "cf-dept", label: "القسم / الإدارة", value: employee.department },
        { id: "cf-code", label: "الرقم الوظيفي", value: employee.employeeCode },
        { id: "cf-treasury", label: "الخزينة المنفذة", value: treasuryAccount },
        { id: "cf-reason", label: "مبرر المكافأة", value: bonusReason }
      ],
      status: "PAID",
      preparedBy: "الإدارة التنفيذية والمالية",
      approvedBy: "المدير العام والاعتماد المالي",
      receivedBy: employee.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Construct or update monthly payroll slip with bonus voucher link
    let updatedSlip: PayrollSlip | undefined;
    if (existingSlip) {
      const newBonusTotal = Number(existingSlip.bonus || 0) + bonusAmount;
      const combinedReason = existingSlip.bonusReason
        ? `${existingSlip.bonusReason} + ${bonusReason}`
        : bonusReason;
      const newNet =
        existingSlip.basicSalary +
        existingSlip.housingAllowance +
        existingSlip.transportAllowance +
        existingSlip.otherAllowances +
        newBonusTotal -
        (existingSlip.socialSecurityDeduction + existingSlip.deductions);

      updatedSlip = {
        ...existingSlip,
        bonus: newBonusTotal,
        bonusReason: combinedReason,
        bonusVoucherId: newVoucher.id,
        bonusVoucherNumber: newVoucher.voucherNumber,
        bonusTreasuryAccount: treasuryAccount,
        netSalary: newNet,
        notes: existingSlip.notes
          ? `${existingSlip.notes} | تم صرف مكافأة بسند ${voucherNum}`
          : `تم صرف مكافأة بسند ${voucherNum}`
      };
    }

    onSaveBonusDisbursement(
      employee,
      bonusAmount,
      bonusReason,
      treasuryAccount,
      paymentMethod,
      paymentDate,
      newVoucher,
      updatedSlip
    );

    setCreatedVoucher(newVoucher);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs overflow-y-auto" dir={dir}>
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-2xl">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {language === "ar" ? "صرف مكافأة مالية فورية وربطها بسند الخزينة" : "Instant Bonus & Treasury Voucher Disbursement"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                  {payrollMonth}
                </span>
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                {language === "ar"
                  ? "تسجيل المكافأة مباشرة وخصمها من الخزينة المعتمدة وتوليد سند صرف مالي رسمي لضمان دقة التقارير"
                  : "Disburse bonus from selected treasury and issue a traceable payment voucher"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {createdVoucher ? (
          /* Success Screen with Voucher Link */
          <div className="p-8 text-center space-y-5 flex-1 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                {language === "ar" ? "تم صرف المكافأة وتوليد سند الخزينة بنجاح!" : "Bonus Disbursed & Voucher Issued Successfully!"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === "ar"
                  ? `تم صرف مبلغ ${bonusAmount.toFixed(3)} ${currency} للموظف (${employee.fullName}) وقيده على حساب (${treasuryAccount}) وتوليد سند الصرف المحاسبي المعتمد.`
                  : `Disbursed ${bonusAmount.toFixed(3)} ${currency} to ${employee.fullName} and linked to treasury voucher.`}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-start space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">{language === "ar" ? "رقم سند الصرف المحاسبي:" : "Payment Voucher No:"}</span>
                <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  #{createdVoucher.voucherNumber}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">{language === "ar" ? "الموظف المستفيد:" : "Beneficiary:"}</span>
                <span className="font-bold text-slate-800">{employee.fullName} ({employee.employeeCode})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">{language === "ar" ? "مبلغ المكافأة:" : "Bonus Amount:"}</span>
                <span className="font-mono font-bold text-emerald-600">+{bonusAmount.toFixed(3)} {currency}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">{language === "ar" ? "الخزينة المنفذة:" : "Disbursing Treasury:"}</span>
                <span className="font-bold text-slate-800">{treasuryAccount}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onViewVoucher && (
                <button
                  type="button"
                  onClick={() => {
                    onViewVoucher(createdVoucher);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 rtl:space-x-reverse shadow-md transition-colors cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{language === "ar" ? "معاينة وطباعة سند الصرف المحاسبي" : "View & Print Treasury Voucher"}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        ) : (
          /* Active Form Screen */
          <form onSubmit={handleDisburseAndIssueVoucher} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
            
            {/* Employee Banner & Caps Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                    {employee.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <h3 className="font-black text-slate-900 text-sm">{employee.fullName}</h3>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-600 rounded">
                        {employee.employeeCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {employee.jobTitle} • {employee.department} {employee.branchName ? `• ${employee.branchName}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse text-start">
                  <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-bold">{language === "ar" ? "الراتب الأساسي" : "Basic"}</span>
                    <span className="font-mono font-bold text-slate-800">{Number(employee.basicSalary).toFixed(3)} {currency}</span>
                  </div>
                </div>
              </div>

              {/* Caps & Limits Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-700 text-[11px]">
                      {language === "ar" ? "سقف المكافآت الشهري المعتمد:" : "Max Monthly Bonus Cap:"}
                    </span>
                  </div>
                  <span className="font-mono font-black text-amber-700 text-xs">
                    {maxBonusCap > 0 ? `${maxBonusCap.toFixed(3)} ${currency}` : (language === "ar" ? "غير مقيد" : "No Cap")}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-indigo-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-700 text-[11px]">
                      {language === "ar" ? "سقف إجمالي الراتب المعتمد:" : "Max Total Salary Cap:"}
                    </span>
                  </div>
                  <span className="font-mono font-black text-indigo-700 text-xs">
                    {maxSalaryCap > 0 ? `${maxSalaryCap.toFixed(3)} ${currency}` : (language === "ar" ? "غير مقيد" : "No Cap")}
                  </span>
                </div>
              </div>
            </div>

            {/* Ceiling Warning Alerts if Exceeded */}
            {isExceedingCap && (
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 space-y-2 animate-pulse">
                <div className="flex items-start space-x-2.5 rtl:space-x-reverse text-rose-800">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-rose-900">
                      {language === "ar" ? "⚠️ تنبيه رقابي: تجاوز سقف المكافأة المعتمد للموظف!" : "Warning: Exceeding Approved Bonus Cap!"}
                    </h4>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      {language === "ar"
                        ? `إجمالي المكافأة لهذا الشهر مع هذا المبلغ سيبلغ (${totalBonusWithNew.toFixed(3)} ${currency}) وهو يتجاوز السقف المسموح به (${maxBonusCap.toFixed(3)} ${currency}) بفارق (+${capSurplus.toFixed(3)} ${currency}).`
                        : `Total bonus will be ${totalBonusWithNew.toFixed(3)} ${currency}, exceeding cap of ${maxBonusCap.toFixed(3)} ${currency}.`}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200 flex items-center space-x-2 rtl:space-x-reverse">
                  <input
                    type="checkbox"
                    id="overrideBonusCapCheck"
                    checked={overrideCapConfirmed}
                    onChange={(e) => setOverrideCapConfirmed(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="overrideBonusCapCheck" className="font-bold text-rose-900 text-[11px] cursor-pointer">
                    {language === "ar"
                      ? "أقر بتجاوز سقف المكافأة بموجب تفويض استثنائي من الإدارة العليا"
                      : "I confirm overriding the cap with executive authorization"}
                  </label>
                </div>
              </div>
            )}

            {isExceedingSalaryCap && !isExceedingCap && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center space-x-2 rtl:space-x-reverse text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {language === "ar"
                    ? `تنبيه: إجمالي مستحقات الموظف (${currentTotalCompensation.toFixed(3)} ${currency}) تقترب أو تتجاوز سقف الراتب الكلي (${maxSalaryCap.toFixed(3)} ${currency}).`
                    : `Note: Total compensation (${currentTotalCompensation.toFixed(3)} ${currency}) reaches/exceeds overall salary cap.`}
                </span>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Bonus Amount */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "ar" ? "قيمة المكافأة المطلوبة *" : "Bonus Amount *"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={bonusAmount || ""}
                    onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-black text-amber-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
                    placeholder="0.000"
                  />
                  <span className="absolute top-2 end-3 text-xs font-bold text-amber-700 pointer-events-none">
                    {currency}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1 font-medium">
                  {bonusWords}
                </span>
              </div>

              {/* Treasury Account Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1 rtl:space-x-reverse">
                  <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{language === "ar" ? "خزينة صرف المكافأة (حساب الخصم) *" : "Disbursing Treasury Account *"}</span>
                </label>
                <select
                  value={treasuryAccount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTreasuryAccount(val);
                    if (val.includes("بنك")) {
                      setPaymentMethod("BANK_TRANSFER");
                    } else {
                      setPaymentMethod("CASH");
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {TREASURY_ACCOUNTS.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {language === "ar" ? "سيتم تسجيل حركة سند الصرف مباشرة على هذه الخزينة" : "Voucher will be ledgered directly to this account"}
                </span>
              </div>

              {/* Payment Method & Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "ar" ? "طريقة الصرف" : "Payment Method"}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH">{language === "ar" ? "نقداً من الخزينة (Cash)" : "Cash"}</option>
                  <option value="BANK_TRANSFER">{language === "ar" ? "تحويل بنكي مباشر (Bank Transfer)" : "Bank Transfer"}</option>
                  <option value="CHEQUE">{language === "ar" ? "شيك بنكي معتمد (Cheque)" : "Cheque"}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "ar" ? "تاريخ الصرف والسند" : "Disbursement Date"}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Bonus Reason */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "ar" ? "بيان ومبرر المكافأة (يظهر في سند الخزينة) *" : "Bonus Reason / Line Description *"}
                </label>
                <input
                  type="text"
                  required
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder={language === "ar" ? "اكتب بيان المكافأة بالتفصيل..." : "Enter detailed reason..."}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {BONUS_REASON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBonusReason(preset)}
                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Treasury Accounting Voucher Integration Banner */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 flex items-start space-x-3 rtl:space-x-reverse">
              <Receipt className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-indigo-950 block text-xs">
                  {language === "ar" ? "الربط المالي بسندات الخزينة وتقارير التدقيق" : "Treasury Voucher & Audit Integration"}
                </span>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  {language === "ar"
                    ? "عند تأكيد الصرف، سيتم إنشاء سند صرف خزينة رسمي برقم فريد، وربطه بسجل الموظف ومسير رواتب الشهر لضمان تطابق الأرصدة والتقارير المالية والمحاسبية."
                    : "A formal payment voucher will be registered and linked to employee logs and payroll slips."}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="submit"
                disabled={bonusAmount <= 0 || (isExceedingCap && !overrideCapConfirmed)}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Award className="w-4 h-4" />
                <span>{language === "ar" ? "صرف المكافأة وإصدار سند الخزينة فوراً" : "Disburse & Issue Treasury Voucher"}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
