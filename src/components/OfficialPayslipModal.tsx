import React from "react";
import { PayrollSlip, CompanySettings } from "../types";
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText
} from "lucide-react";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { numberToWords } from "../utils/numberToWords";
import { useLanguage } from "../utils/LanguageContext";

interface OfficialPayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: PayrollSlip | null;
  companySettings: CompanySettings;
}

export const OfficialPayslipModal: React.FC<OfficialPayslipModalProps> = ({
  isOpen,
  onClose,
  slip,
  companySettings
}) => {
  const { language, isRTL } = useLanguage();

  if (!isOpen || !slip) return null;

  const totalEarnings =
    Number(slip.basicSalary || 0) +
    Number(slip.housingAllowance || 0) +
    Number(slip.transportAllowance || 0) +
    Number(slip.otherAllowances || 0) +
    Number(slip.bonus || 0);

  const totalDeductions =
    Number(slip.socialSecurityDeduction || 0) + Number(slip.deductions || 0);

  const netSalaryWords = numberToWords(slip.netSalary, companySettings.currency || "OMR");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none print:w-full">
        
        {/* Header Bar - Hidden in print */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {language === "ar" ? "قسيمة الراتب الرسمية (Payslip)" : "Official Salary Slip"}
              </h3>
              <p className="text-xs text-slate-300">
                {slip.employeeName} - {slip.payrollMonth}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === "ar" ? "طباعة القسيمة" : "Print Slip"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 print:p-0">
          
          {/* Header & Company Logo */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
              {companySettings.logoUrl ? (
                <img
                  src={companySettings.logoUrl}
                  alt={companySettings.name}
                  className="w-14 h-14 object-contain rounded-xl border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                  {companySettings.name.charAt(0) || "D"}
                </div>
              )}
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {companySettings.name}
                </h1>
                {companySettings.nameEn && (
                  <p className="text-xs text-slate-500 font-medium">{companySettings.nameEn}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {companySettings.address || "سلطنة عمان"} | هاتف: {companySettings.phone || "+968"}
                </p>
              </div>
            </div>

            <div className="text-end rtl:text-start">
              <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 font-bold text-xs">
                {language === "ar" ? "مسير رواتب رسمي" : "Official Payroll Slip"}
              </div>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1.5">
                {language === "ar" ? "الشهر المالي:" : "Month:"} <span className="text-indigo-600">{slip.payrollMonth}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {slip.referenceNo || `PAY-${slip.payrollMonth}-${slip.employeeCode}`}
              </p>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{language === "ar" ? "اسم الموظف" : "Employee"}</span>
              <span className="font-bold text-slate-900 block mt-0.5">{slip.employeeName}</span>
              {slip.fullNameEn && <span className="text-[10px] text-slate-500 block">{slip.fullNameEn}</span>}
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{language === "ar" ? "الرقم الوظيفي / المدني" : "Emp Code / Civil ID"}</span>
              <span className="font-mono font-bold text-slate-900 block mt-0.5">{slip.employeeCode}</span>
              {slip.civilId && <span className="text-[10px] font-mono text-slate-500 block">ID: {slip.civilId}</span>}
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{language === "ar" ? "المسمى والقسم" : "Job / Dept"}</span>
              <span className="font-semibold text-slate-900 block mt-0.5">{slip.jobTitle}</span>
              <span className="text-[10px] text-slate-500 block">{slip.department}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{language === "ar" ? "الحساب والبنك" : "Bank & IBAN"}</span>
              <span className="font-semibold text-slate-900 block mt-0.5">{slip.bankName || "بنك مسقط"}</span>
              <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[140px]">{slip.bankIban || "—"}</span>
            </div>
          </div>

          {/* Financial Breakdown: Earnings vs Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Earnings Column */}
            <div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/20">
              <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between">
                <span className="font-bold text-xs">{language === "ar" ? "الاستحقاقات والبدلات (Earnings)" : "Earnings & Allowances"}</span>
                <span className="text-[10px] font-mono font-bold">{companySettings.currency || "OMR"}</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{language === "ar" ? "الراتب الأساسي" : "Basic Salary"}</span>
                  <span className="font-mono font-bold text-slate-900">{Number(slip.basicSalary).toFixed(3)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{language === "ar" ? "بدل السكن" : "Housing Allowance"}</span>
                  <span className="font-mono font-bold text-slate-900">{Number(slip.housingAllowance).toFixed(3)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{language === "ar" ? "بدل النقل والمواصلات" : "Transport Allowance"}</span>
                  <span className="font-mono font-bold text-slate-900">{Number(slip.transportAllowance).toFixed(3)}</span>
                </div>
                {Number(slip.otherAllowances) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">{language === "ar" ? "بدلات أخرى" : "Other Allowances"}</span>
                    <span className="font-mono font-bold text-slate-900">{Number(slip.otherAllowances).toFixed(3)}</span>
                  </div>
                )}
                {Number(slip.bonus) > 0 && (
                  <div className="py-1 border-b border-slate-100 text-emerald-700">
                    <div className="flex justify-between font-bold">
                      <span>{language === "ar" ? "مكافآت وحوافز إنجاز" : "Incentives / Bonus"}</span>
                      <span className="font-mono">+{Number(slip.bonus).toFixed(3)}</span>
                    </div>
                    {slip.bonusReason && (
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        {language === "ar" ? "البيان:" : "Note:"} {slip.bonusReason}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t-2 border-emerald-200 font-bold text-emerald-800">
                  <span>{language === "ar" ? "إجمالي الاستحقاقات" : "Total Earnings"}</span>
                  <span className="font-mono text-sm">{totalEarnings.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/20">
              <div className="bg-rose-600 text-white px-4 py-2 flex items-center justify-between">
                <span className="font-bold text-xs">{language === "ar" ? "الاستقطاعات والخصومات (Deductions)" : "Deductions & Social Security"}</span>
                <span className="text-[10px] font-mono font-bold">{companySettings.currency || "OMR"}</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{language === "ar" ? "التأمينات الاجتماعية (PASI 7%)" : "Social Security (PASI)"}</span>
                  <span className="font-mono font-bold text-rose-700">-{Number(slip.socialSecurityDeduction).toFixed(3)}</span>
                </div>
                {Number(slip.deductions) > 0 && (
                  <div className="py-1 border-b border-slate-100 text-rose-700">
                    <div className="flex justify-between font-bold">
                      <span>{language === "ar" ? "خصومات / جزاءات / سلف" : "Other Deductions / Advances"}</span>
                      <span className="font-mono font-bold">-{Number(slip.deductions).toFixed(3)}</span>
                    </div>
                    {slip.deductionReason && (
                      <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                        {language === "ar" ? "السبب:" : "Reason:"} {slip.deductionReason}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-400">
                  <span>{language === "ar" ? "ضريبة الدخل" : "Income Tax"}</span>
                  <span className="font-mono">0.000</span>
                </div>
                <div className="flex justify-between pt-5 border-t-2 border-rose-200 font-bold text-rose-800">
                  <span>{language === "ar" ? "إجمالي الاستقطاعات" : "Total Deductions"}</span>
                  <span className="font-mono text-sm">-{totalDeductions.toFixed(3)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Linked Accounting Voucher & Payment Details */}
          {(slip.linkedVoucherNumber || slip.paymentDate || slip.paymentMethod) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-slate-500 font-bold">{language === "ar" ? "التوثيق المحاسبي وطريقة الصرف:" : "Payment & Voucher Details:"}</span>
                {slip.linkedVoucherNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono font-bold rounded-md text-[11px]">
                    سند صرف #{slip.linkedVoucherNumber}
                  </span>
                )}
                {slip.paymentMethod && (
                  <span className="text-slate-600 font-medium">
                    ({slip.paymentMethod === "BANK_TRANSFER" ? "تحويل بنكي" : slip.paymentMethod === "CASH" ? "نقداً من الخزينة" : slip.paymentMethod})
                  </span>
                )}
              </div>
              {slip.paymentDate && (
                <div className="text-slate-500 font-mono text-[11px]">
                  {language === "ar" ? "تاريخ الصرف:" : "Disbursed on:"} <span className="font-bold text-slate-700">{slip.paymentDate}</span>
                </div>
              )}
            </div>
          )}

          {/* Net Pay Box */}
          <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                {language === "ar" ? "صافي الراتب المستحق للصرف (Net Pay)" : "Net Salary Payable"}
              </span>
              <p className="text-xs text-indigo-700 font-medium mt-0.5">
                {netSalaryWords}
              </p>
            </div>
            <div className="text-center sm:text-end rtl:sm:text-start">
              <div className="text-2xl font-black font-mono text-indigo-900 tracking-tight">
                {Number(slip.netSalary).toFixed(3)}{" "}
                <span className="text-sm font-bold text-indigo-600">{companySettings.currency || "OMR"}</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1">
                <CheckCircle2 className="w-3 h-3 me-1" />
                {slip.status === "PAID" ? (language === "ar" ? "تم التحويل بنكياً" : "Paid via Bank") : (language === "ar" ? "معتمد للصرف" : "Approved for Payment")}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center text-xs">
            <div className="space-y-6">
              <span className="text-slate-500 font-bold block">{language === "ar" ? "إعداد الموارد البشرية" : "Prepared by HR"}</span>
              <div className="h-10 border-b border-dashed border-slate-300 flex items-center justify-center font-serif text-slate-700">
                قسم شؤون الموظفين
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-slate-500 font-bold block">{language === "ar" ? "الاعتماد المالي والختم" : "Financial Approval & Seal"}</span>
              <div className="h-10 border-b border-dashed border-slate-300 flex items-center justify-center">
                {companySettings.sealUrl ? (
                  <img src={companySettings.sealUrl} alt="Seal" className="h-10 object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">[الختم الرسمي]</span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-slate-500 font-bold block">{language === "ar" ? "توقيع واستلام الموظف" : "Employee Signature"}</span>
              <div className="h-10 border-b border-dashed border-slate-300 flex items-center justify-center font-serif text-slate-700">
                {slip.employeeName}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 pt-2 print:text-[9px]">
            {language === "ar"
              ? "تم استخراج هذا الكشف آلياً بواسطة منظومة ديشال لإدارة الأعمال (Deshal ERP). يعتبر مستنداً معتمداً."
              : "This document is electronically generated by Deshal Business Management ERP. Confidential."}
          </div>

        </div>

      </div>
    </div>
  );
};
