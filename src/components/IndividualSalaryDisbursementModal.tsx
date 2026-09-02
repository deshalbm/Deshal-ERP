import React, { useState, useEffect } from "react";
import {
  Employee,
  PayrollSlip,
  PayrollStatus,
  CompanySettings,
  ReceiptVoucher,
  Branch
} from "../types";
import {
  DollarSign,
  Banknote,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileCheck2,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Sliders,
  ShieldAlert,
  Wallet
} from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import { numberToWords } from "../utils/numberToWords";

export interface IndividualSalaryDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  initialSlip?: PayrollSlip | null;
  payrollMonth: string;
  branches: Branch[];
  companySettings: CompanySettings;
  onSaveSlip: (slip: PayrollSlip, generateVoucher: boolean) => void;
  onViewVoucher?: (voucher: ReceiptVoucher) => void;
  linkedVoucher?: ReceiptVoucher | null;
}

export const IndividualSalaryDisbursementModal: React.FC<IndividualSalaryDisbursementModalProps> = ({
  isOpen,
  onClose,
  employee,
  initialSlip,
  payrollMonth,
  branches,
  companySettings,
  onSaveSlip,
  onViewVoucher,
  linkedVoucher
}) => {
  const { language, isRTL } = useLanguage();

  const [basicSalary, setBasicSalary] = useState<number>(600);
  const [housingAllowance, setHousingAllowance] = useState<number>(100);
  const [transportAllowance, setTransportAllowance] = useState<number>(50);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [bonusReason, setBonusReason] = useState<string>("");
  const [deductions, setDeductions] = useState<number>(0);
  const [deductionReason, setDeductionReason] = useState<string>("");
  const [customPasi, setCustomPasi] = useState<boolean>(false);
  const [socialSecurityDeduction, setSocialSecurityDeduction] = useState<number>(42);
  const [status, setStatus] = useState<PayrollStatus>("APPROVED");
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [paymentTreasury, setPaymentTreasury] = useState<string>("حساب بنك مسقط الجاري");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [autoGenerateVoucher, setAutoGenerateVoucher] = useState<boolean>(true);
  const [allowCapOverride, setAllowCapOverride] = useState<boolean>(false);

  // Sync state when opening with an employee or existing slip
  useEffect(() => {
    if (!isOpen) return;

    if (initialSlip) {
      setBasicSalary(Number(initialSlip.basicSalary) || 0);
      setHousingAllowance(Number(initialSlip.housingAllowance) || 0);
      setTransportAllowance(Number(initialSlip.transportAllowance) || 0);
      setOtherAllowances(Number(initialSlip.otherAllowances) || 0);
      setBonus(Number(initialSlip.bonus) || 0);
      setBonusReason(initialSlip.bonusReason || "");
      setDeductions(Number(initialSlip.deductions) || 0);
      setDeductionReason(initialSlip.deductionReason || "");
      setSocialSecurityDeduction(Number(initialSlip.socialSecurityDeduction) || 0);
      setCustomPasi(true);
      setStatus(initialSlip.status || "APPROVED");
      setPaymentMethod(initialSlip.paymentMethod || "BANK_TRANSFER");
      setPaymentDate(initialSlip.paymentDate || new Date().toISOString().split("T")[0]);
      setPaymentTreasury(initialSlip.bonusTreasuryAccount || employee?.preferredBonusTreasury || "حساب بنك مسقط الجاري");
      setReferenceNo(initialSlip.referenceNo || `PAY-${payrollMonth}-${initialSlip.employeeCode}`);
      setNotes(initialSlip.notes || "");
    } else if (employee) {
      const basic = Number(employee.basicSalary) || 600;
      const allowances = Number(employee.allowances) || 150;
      const housing = Math.round(allowances * 0.6) || 100;
      const transport = Math.round(allowances * 0.4) || 50;
      const pasi = Number((basic * 0.07).toFixed(3));

      setBasicSalary(basic);
      setHousingAllowance(housing);
      setTransportAllowance(transport);
      setOtherAllowances(0);
      setBonus(0);
      setBonusReason("");
      setDeductions(0);
      setDeductionReason("");
      setSocialSecurityDeduction(pasi);
      setCustomPasi(false);
      setStatus("APPROVED");
      setPaymentMethod("BANK_TRANSFER");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentTreasury(employee.preferredBonusTreasury || "حساب بنك مسقط الجاري");
      setReferenceNo(`PAY-${payrollMonth}-${employee.employeeCode}`);
      setNotes(`صرف راتب شهر ${payrollMonth} للموظف ${employee.fullName}`);
    }
    setAllowCapOverride(false);
  }, [isOpen, initialSlip, employee, payrollMonth]);

  // Recalculate PASI if not manually customized
  useEffect(() => {
    if (!customPasi) {
      const autoPasi = Number((basicSalary * 0.07).toFixed(3));
      setSocialSecurityDeduction(autoPasi);
    }
  }, [basicSalary, customPasi]);

  if (!isOpen || (!employee && !initialSlip)) return null;

  const currentEmp = employee || {
    id: initialSlip?.employeeId || "",
    employeeCode: initialSlip?.employeeCode || "EMP-001",
    fullName: initialSlip?.employeeName || "",
    fullNameEn: initialSlip?.fullNameEn,
    jobTitle: initialSlip?.jobTitle || "",
    department: initialSlip?.department || "",
    civilId: initialSlip?.civilId,
    bankName: initialSlip?.bankName || "بنك مسقط",
    bankIban: initialSlip?.bankIban,
    branchName: initialSlip?.branchName,
    maxSalaryCap: 0,
    maxBonusCap: 0,
    preferredBonusTreasury: "الخزينة النقدية الرئيسية"
  };

  const currency = companySettings.currency || "OMR";
  const maxBonusCap = Number(employee?.maxBonusCap || 0);
  const maxSalaryCap = Number(employee?.maxSalaryCap || 0);

  // Financial Calculations
  const grossEarnings = basicSalary + housingAllowance + transportAllowance + otherAllowances + bonus;
  const totalDeductions = socialSecurityDeduction + deductions;
  const netSalary = Math.max(0, grossEarnings - totalDeductions);
  const netSalaryWords = numberToWords(netSalary, currency, language === "en" ? "en" : "ar");

  // Ceiling Validations
  const isBonusExceedingCap = maxBonusCap > 0 && bonus > maxBonusCap;
  const isSalaryExceedingCap = maxSalaryCap > 0 && grossEarnings > maxSalaryCap;

  const BONUS_PRESETS = [
    "مكافأة تحقيق هدف المبيعات (Target)",
    "بدل عمل إضافي وساعات مناوبة",
    "حافز تميز وإتقان استثنائي",
    "بدل تكليف وانتداب خارجي"
  ];

  const DEDUCTION_PRESETS = [
    "استقطاع قسط سلفة شهرية",
    "خصم تأخير متكرر عن الدوام",
    "خصم غياب غير مصرح به",
    "تسوية عهدة ومشتريات عينية"
  ];

  const handleSubmit = (forceDisburse: boolean = false) => {
    const finalStatus: PayrollStatus = forceDisburse ? "PAID" : status;
    const finalSlip: PayrollSlip = {
      id: initialSlip?.id || `pay-${payrollMonth}-${currentEmp.id}`,
      payrollMonth,
      employeeId: currentEmp.id,
      employeeCode: currentEmp.employeeCode,
      employeeName: currentEmp.fullName,
      fullNameEn: currentEmp.fullNameEn,
      jobTitle: currentEmp.jobTitle,
      department: currentEmp.department,
      civilId: currentEmp.civilId,
      bankName: currentEmp.bankName,
      bankIban: currentEmp.bankIban,
      branchName: currentEmp.branchName || branches[0]?.name || "الفرع الرئيسي",
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      bonus,
      bonusReason: bonus > 0 ? bonusReason : undefined,
      bonusTreasuryAccount: bonus > 0 ? paymentTreasury : undefined,
      deductions,
      deductionReason: deductions > 0 ? deductionReason : undefined,
      socialSecurityDeduction,
      netSalary,
      status: finalStatus,
      paymentDate: finalStatus === "PAID" ? paymentDate : initialSlip?.paymentDate,
      paymentMethod,
      referenceNo: referenceNo.trim() || `PAY-${payrollMonth}-${currentEmp.employeeCode}`,
      notes: notes.trim() || undefined,
      linkedVoucherId: initialSlip?.linkedVoucherId,
      linkedVoucherNumber: initialSlip?.linkedVoucherNumber,
      disbursedBy: finalStatus === "PAID" ? "الإدارة المالية" : initialSlip?.disbursedBy,
      generatedAt: initialSlip?.generatedAt || new Date().toISOString()
    };

    onSaveSlip(finalSlip, autoGenerateVoucher && finalStatus === "PAID");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl">
              <Banknote className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {language === "ar" ? "التحكم في صرف الراتب والتسوية الفردية" : "Individual Salary Control & Disbursement"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                  {payrollMonth}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === "ar"
                  ? "تعديل بنود الراتب، تخصيص الأسقف المالية والمكافآت، وتوليد سند الصرف المحاسبي تلقائياً"
                  : "Adjust salary components, enforce caps/bonuses, and auto-issue accounting voucher"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-700 bg-slate-50/50">
          
          {/* Employee Overview Card & Limits */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {currentEmp.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <h3 className="text-sm font-black text-slate-900">{currentEmp.fullName}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] font-bold text-slate-600 rounded-md">
                      {currentEmp.employeeCode}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-slate-500 text-[11px] mt-0.5">
                    <span>{currentEmp.jobTitle}</span>
                    <span>•</span>
                    <span>{currentEmp.department}</span>
                    {currentEmp.branchName && (
                      <>
                        <span>•</span>
                        <span>{currentEmp.branchName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 rtl:space-x-reverse bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">{currentEmp.bankName || "بنك مسقط"}</span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{currentEmp.bankIban || "لا يوجد آيبان مسجل"}</span>
                </div>
              </div>
            </div>

            {/* Caps Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-bold text-amber-950">{language === "ar" ? "سقف المكافأة المعتمد:" : "Approved Bonus Cap:"}</span>
                </div>
                <span className="font-mono font-black text-amber-800 text-xs">
                  {maxBonusCap > 0 ? `${maxBonusCap.toFixed(3)} ${currency}` : (language === "ar" ? "غير مقيد" : "No Cap")}
                </span>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-bold text-indigo-950">{language === "ar" ? "سقف الراتب الكلي:" : "Total Salary Cap:"}</span>
                </div>
                <span className="font-mono font-black text-indigo-800 text-xs">
                  {maxSalaryCap > 0 ? `${maxSalaryCap.toFixed(3)} ${currency}` : (language === "ar" ? "غير مقيد" : "No Cap")}
                </span>
              </div>
            </div>
          </div>

          {/* Ceiling Warning Alerts */}
          {isBonusExceedingCap && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start space-x-3 rtl:space-x-reverse text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs">
                  {language === "ar" ? "⚠️ تنبيه رقابي: قيمة المكافأة تتجاوز السقف المحدد للموظف!" : "Warning: Bonus exceeds employee cap!"}
                </h4>
                <p className="text-[11px] text-rose-700">
                  {language === "ar"
                    ? `المكافأة المسجلة (${bonus.toFixed(3)} ${currency}) تتجاوز سقف المكافآت المعتمد للموظف (${maxBonusCap.toFixed(3)} ${currency}). يرجى التحقق أو الحصول على اعتماد مالي استثنائي.`
                    : `Recorded bonus (${bonus.toFixed(3)} ${currency}) exceeds cap (${maxBonusCap.toFixed(3)} ${currency}).`}
                </p>
              </div>
            </div>
          )}

          {isSalaryExceedingCap && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start space-x-3 rtl:space-x-reverse text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs">
                  {language === "ar" ? "⚠️ تنبيه: إجمالي الاستحقاقات يتجاوز سقف الراتب الشهري المعتمد!" : "Warning: Gross earnings exceed total salary cap!"}
                </h4>
                <p className="text-[11px] text-amber-800">
                  {language === "ar"
                    ? `إجمالي الاستحقاقات (${grossEarnings.toFixed(3)} ${currency}) يتجاوز سقف الراتب المخصص للموظف (${maxSalaryCap.toFixed(3)} ${currency}).`
                    : `Gross earnings (${grossEarnings.toFixed(3)} ${currency}) exceed ceiling of (${maxSalaryCap.toFixed(3)} ${currency}).`}
                </p>
              </div>
            </div>
          )}

          {/* Grid of Salary Components: Earnings vs Deductions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 1. EARNINGS & BONUSES */}
            <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    {language === "ar" ? "الاستحقاقات والبدلات والمكافآت" : "Earnings, Allowances & Bonuses"}
                  </h4>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {currency}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === "ar" ? "الراتب الأساسي *" : "Basic Salary *"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === "ar" ? "بدل السكن" : "Housing Allowance"}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={housingAllowance}
                    onChange={(e) => setHousingAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === "ar" ? "بدل النقل والمواصلات" : "Transport Allowance"}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={transportAllowance}
                    onChange={(e) => setTransportAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === "ar" ? "بدلات أخرى (هاتف / معيشة)" : "Other Allowances"}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={otherAllowances}
                    onChange={(e) => setOtherAllowances(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Bonus / Incentive Section */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs flex items-center space-x-1.5 rtl:space-x-reverse">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === "ar" ? "تسجيل مكافأة أو حافز إنجاز" : "Record Bonus / Incentive"}</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    +{bonus.toFixed(3)} {currency}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={bonus || ""}
                      onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder={language === "ar" ? "بيان ومبرر المكافأة (مثال: عمولة مبيعات، أداء متميز...)" : "Bonus reason..."}
                      value={bonusReason}
                      onChange={(e) => setBonusReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Preset Bonus Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {BONUS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBonusReason(preset)}
                      className="px-2 py-0.5 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Earnings Subtotal */}
              <div className="flex justify-between items-center pt-2 border-t border-emerald-100 text-emerald-950 font-bold">
                <span>{language === "ar" ? "إجمالي الاستحقاقات (Gross):" : "Total Gross Earnings:"}</span>
                <span className="font-mono text-sm">{grossEarnings.toFixed(3)} {currency}</span>
              </div>
            </div>

            {/* 2. DEDUCTIONS & SOCIAL SECURITY */}
            <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-rose-950">
                    {language === "ar" ? "الاستقطاعات والتأمينات والخصومات" : "Deductions & Social Security"}
                  </h4>
                </div>
                <span className="font-mono font-bold text-rose-700 text-xs bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {currency}
                </span>
              </div>

              {/* Social Security (PASI 7%) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-xs">
                      {language === "ar" ? "التأمينات الاجتماعية (PASI 7%)" : "Social Security (PASI 7%)"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomPasi(!customPasi)}
                    className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                  >
                    {customPasi ? (language === "ar" ? "حساب آلي 7%" : "Auto 7%") : (language === "ar" ? "تعديل يدوي" : "Manual Edit")}
                  </button>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    disabled={!customPasi}
                    value={socialSecurityDeduction}
                    onChange={(e) => setSocialSecurityDeduction(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-rose-700 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">
                    (7% من الراتب الأساسي {basicSalary.toFixed(3)})
                  </span>
                </div>
              </div>

              {/* Deductions / Penalties */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 text-xs flex items-center space-x-1.5 rtl:space-x-reverse">
                    <Minus className="w-3.5 h-3.5 text-rose-600" />
                    <span>{language === "ar" ? "تسجيل خصومات أو جزاءات أو سلف" : "Deductions / Penalties / Advances"}</span>
                  </span>
                  <span className="text-[10px] text-rose-700 font-bold">
                    -{deductions.toFixed(3)} {currency}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={deductions || ""}
                      onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl font-mono font-bold text-rose-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder={language === "ar" ? "سبب الخصم (مثال: قسط سلفة، غياب بدون إذن، جزاء...)" : "Deduction reason..."}
                      value={deductionReason}
                      onChange={(e) => setDeductionReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DEDUCTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeductionReason(preset)}
                      className="px-2 py-0.5 bg-rose-100/70 hover:bg-rose-200 text-rose-800 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      - {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Deductions Subtotal */}
              <div className="flex justify-between items-center pt-2 border-t border-rose-100 text-rose-950 font-bold">
                <span>{language === "ar" ? "إجمالي الاستقطاعات:" : "Total Deductions:"}</span>
                <span className="font-mono text-sm text-rose-600">-{totalDeductions.toFixed(3)} {currency}</span>
              </div>
            </div>

          </div>

          {/* Live Net Pay Display Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                {language === "ar" ? "صافي الراتب المستحق للصرف النهائي (Net Payable)" : "Net Salary Payable to Employee"}
              </span>
              <p className="text-xs text-indigo-200 font-medium">
                {netSalaryWords}
              </p>
            </div>

            <div className="text-center md:text-end rtl:md:text-start">
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {netSalary.toFixed(3)}{" "}
                <span className="text-sm font-bold text-indigo-300">{currency}</span>
              </div>
              <div className="text-[11px] text-indigo-300 font-mono mt-0.5">
                (استحقاقات {grossEarnings.toFixed(3)} - استقطاعات {totalDeductions.toFixed(3)})
              </div>
            </div>
          </div>

          {/* Accounting Settlement & Disbursement Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse pb-3 border-b border-slate-100">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">
                {language === "ar" ? "بيانات الصرف المالي وحساب الخزينة والتوثيق المحاسبي" : "Disbursement & Accounting Settlement"}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === "ar" ? "حالة الصرف" : "Disbursement Status"}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PayrollStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="APPROVED">{language === "ar" ? "معتمد للصرف (Approved)" : "Approved"}</option>
                  <option value="PAID">{language === "ar" ? "تم الصرف الفعلي (Paid)" : "Paid"}</option>
                  <option value="DRAFT">{language === "ar" ? "مسودة (Draft)" : "Draft"}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center space-x-1 rtl:space-x-reverse">
                  <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{language === "ar" ? "الخزينة المنفذة للصرف" : "Disbursement Treasury"}</span>
                </label>
                <select
                  value={paymentTreasury}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPaymentTreasury(val);
                    if (val.includes("بنك")) {
                      setPaymentMethod("BANK_TRANSFER");
                    } else {
                      setPaymentMethod("CASH");
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-indigo-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="حساب بنك مسقط الجاري">حساب بنك مسقط الجاري (Bank Muscat)</option>
                  <option value="حساب بنك ظفار التجاري">حساب بنك ظفار التجاري (Bank Dhofar)</option>
                  <option value="الخزينة النقدية الرئيسية">الخزينة النقدية الرئيسية (Main Cash Vault)</option>
                  <option value="عهدة الفرع النقدية">عهدة الفرع النقدية (Branch Petty Cash)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === "ar" ? "طريقة الصرف" : "Payment Method"}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BANK_TRANSFER">{language === "ar" ? "تحويل بنكي (حماية الأجور)" : "Bank Transfer"}</option>
                  <option value="CASH">{language === "ar" ? "نقداً من الخزينة الرئيسية" : "Cash Treasury"}</option>
                  <option value="CHEQUE">{language === "ar" ? "شيك بنكي معتمد" : "Bank Cheque"}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === "ar" ? "تاريخ الصرف" : "Payment Date"}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Auto Generate Payment Voucher Checkbox */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-start space-x-3 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="autoGenerateVoucherCheck"
                checked={autoGenerateVoucher}
                onChange={(e) => setAutoGenerateVoucher(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="autoGenerateVoucherCheck" className="text-xs text-indigo-950 font-medium cursor-pointer">
                <span className="font-bold block">
                  {language === "ar"
                    ? "توليد وترحيل سند صرف محاسبي رسمي (Payment Voucher) فور الصرف"
                    : "Auto-generate official Payment Voucher upon disbursement"}
                </span>
                <span className="text-[11px] text-indigo-700 block mt-0.5">
                  {language === "ar"
                    ? "سيتم تسجيل حركة الصرف وقيدها محاسبياً على حساب (مصروف رواتب وأجور موظفين) مع تفاصيل الراتب والبدلات والمكافآت والخصومات وربطها بالخزينة المحددة."
                    : "Automatically records a payment voucher in company ledgers under Salary & Compensation Expense."}
                </span>
              </label>
            </div>

            {/* Linked Voucher Notice if already existing */}
            {initialSlip?.linkedVoucherNumber && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-900 font-bold">
                    {language === "ar" ? "مسجل له سند صرف مالي برقم:" : "Linked Payment Voucher:"}
                  </span>
                  <span className="font-mono font-black text-emerald-800">{initialSlip.linkedVoucherNumber}</span>
                </div>
                {onViewVoucher && linkedVoucher && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewVoucher(linkedVoucher);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 rtl:space-x-reverse transition-colors cursor-pointer"
                  >
                    <span>{language === "ar" ? "عرض السند المحاسبي" : "View Voucher"}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </button>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              {language === "ar" ? "حفظ كمسودة / معتمد" : "Save as Draft / Approved"}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-md transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === "ar" ? "صرف الراتب وتوثيق السند فوراً" : "Disburse & Issue Voucher"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
