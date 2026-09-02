import React from "react";
import {
  LeaseContract,
  CompanySettings
} from "../types";
import {
  Printer,
  X,
  FileCheck,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  QrCode,
  Share2,
  Download,
  CheckCircle2,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  FileText
} from "lucide-react";
import { BarcodeRenderer } from "./BarcodeRenderer";

interface LeaseContractPrintViewProps {
  contract: LeaseContract;
  companySettings: CompanySettings;
  onClose: () => void;
  onShareWhatsApp?: (contract: LeaseContract) => void;
}

export const LeaseContractPrintView: React.FC<LeaseContractPrintViewProps> = ({
  contract,
  companySettings,
  onClose,
  onShareWhatsApp
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number, curr = "OMR") => {
    return `${amount.toFixed(3)} ${curr === "OMR" ? "ر.ع" : curr}`;
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case "COMMERCIAL_OFFICE":
        return "عقد إيجار مكتب تجاري / تنفيذي خاص";
      case "COWORKING_DEDICATED_DESK":
        return "عقد مكتب مخصص بمساحة عمل مشتركة";
      case "FLEX_SPACE":
        return "عقد مساحة عمل مرنة";
      case "VIRTUAL_OFFICE":
        return "عقد مكتب افتراضي وترخيص بلدي وسجل تجاري";
      case "EVENT_HALL_RETAINER":
        return "عقد حجز دوري لقاعات التدريب والفعاليات";
      default:
        return "عقد إيجار مساحة أعمال";
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "MONTHLY":
        return "شهرياً (12 دفعة/سنة)";
      case "QUARTERLY":
        return "ربع سنوي (كل 3 أشهر)";
      case "SEMI_ANNUAL":
        return "نصف سنوي (كل 6 أشهر)";
      case "ANNUAL":
        return "سنوياً (دفعة واحدة)";
      case "LUMP_SUM":
        return "دفعة واحدة مقدماً";
      default:
        return freq;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Top Floating Action Bar (Hidden on Print) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 text-white px-4 py-2 rounded-full shadow-2xl border border-slate-700/60 backdrop-blur print:hidden">
        <span className="text-xs font-bold text-indigo-300 hidden sm:inline">
          {contract.contractNumber}
        </span>
        <div className="h-4 w-px bg-slate-700 hidden sm:inline" />
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>طباعة العقد الرسمي (Print)</span>
        </button>
        {onShareWhatsApp && (
          <button
            onClick={() => onShareWhatsApp(contract)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>واتساب</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="flex items-center gap-1 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Printable A4 Contract Sheet */}
      <div className="bg-white text-slate-900 w-full max-w-4xl min-h-screen my-auto p-6 sm:p-10 md:p-12 rounded-xl shadow-2xl border border-slate-200 print:border-none print:shadow-none print:m-0 print:p-6 print:w-full print:rounded-none relative text-right font-sans">
        
        {/* Top Legal Header */}
        <div className="flex justify-between items-start border-b-2 border-indigo-900/20 pb-5 mb-6 gap-4">
          <div className="flex items-center gap-3">
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={companySettings.companyName}
                className="h-16 max-w-[160px] object-contain rounded"
              />
            ) : (
              <div className="w-14 h-14 bg-indigo-900 text-white flex items-center justify-center rounded-lg font-bold text-xl">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {companySettings.companyName}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {companySettings.tagline}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 mt-1">
                <span>س.ت: {companySettings.crNumber || "CR-1092831"}</span>
                <span>•</span>
                <span>الرقم الضريبي: {companySettings.taxId || "OM-94288394-B"}</span>
              </div>
            </div>
          </div>

          <div className="text-left flex flex-col items-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-lg text-xs font-bold mb-1.5">
              <FileCheck className="w-3.5 h-3.5 text-indigo-700" />
              <span>{getContractTypeLabel(contract.contractType)}</span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-800 tracking-wider">
              {contract.contractNumber}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              تاريخ التحرير: {contract.createdAt.split("T")[0]}
            </div>
          </div>
        </div>

        {/* Contract Title Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-3 px-6 rounded-lg text-center mb-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold tracking-wide">
            {contract.titleAr || "عقد إيجار تجاري لمساحة مكتبية وخدمات أعمال مساندة"}
          </h2>
          <p className="text-xs text-indigo-200 font-medium mt-0.5">
            COMMERCIAL LEASE & SERVICED OFFICE AGREEMENT
          </p>
        </div>

        {/* Preamble / Introduction */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-4 mb-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            بعون الله وتوفيقه، تم الاتفاق والتعاقد في يوم{" "}
            <span className="font-bold text-slate-900">
              {new Date(contract.startDate).toLocaleDateString("ar-OM", { weekday: "long" })}
            </span>{" "}
            الموافق <span className="font-bold text-slate-900">{contract.startDate}</span>، في سلطنة عمان، بين كل من:
          </p>
        </div>

        {/* Dual Parties Info Box (المؤجر والمستأجر) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Party 1: Lessor */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-4 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
              <span className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-700" />
                الطرف الأول (المؤجر):
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                LESSOR
              </span>
            </div>
            <div className="space-y-1 text-slate-700">
              <p><span className="font-semibold text-slate-900">الشركة:</span> {contract.lessorCompanyName}</p>
              <p><span className="font-semibold text-slate-900">السجل التجاري:</span> {contract.lessorCrNumber}</p>
              <p><span className="font-semibold text-slate-900">الرقم الضريبي:</span> {contract.lessorTaxNumber}</p>
              <p><span className="font-semibold text-slate-900">يمثلها:</span> {contract.lessorRepresentative} ({contract.lessorRepresentativeTitle || "المدير العام"})</p>
              <p><span className="font-semibold text-slate-900">العنوان:</span> {contract.lessorAddress}</p>
              <p><span className="font-semibold text-slate-900">الهاتف / البريد:</span> {contract.lessorPhone} • {contract.lessorEmail}</p>
            </div>
          </div>

          {/* Party 2: Lessee / Tenant */}
          <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-4 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2">
              <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                الطرف الثاني (المستأجر):
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                LESSEE
              </span>
            </div>
            <div className="space-y-1 text-slate-700">
              <p><span className="font-semibold text-slate-900">الاسم / الشركة:</span> {contract.tenantName}</p>
              {contract.tenantCrNumber && (
                <p><span className="font-semibold text-slate-900">السجل التجاري:</span> {contract.tenantCrNumber}</p>
              )}
              <p><span className="font-semibold text-slate-900">المخول بالتوقيع:</span> {contract.tenantSignatoryName} {contract.tenantSignatoryCivilId ? `(بطاقة شخصية: ${contract.tenantSignatoryCivilId})` : ""}</p>
              <p><span className="font-semibold text-slate-900">العنوان:</span> {contract.tenantAddress}</p>
              <p><span className="font-semibold text-slate-900">الهاتف / البريد:</span> {contract.tenantPhone} • {contract.tenantEmail}</p>
            </div>
          </div>
        </div>

        {/* Leased Premises & Specs Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              بيانات ومواصفات العين المؤجرة (LEAP LEASED PREMISES)
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              كود الوحدة: {contract.spaceCode}
            </span>
          </div>
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700 w-1/4">اسم وموقع الوحدة:</td>
                <td className="p-2.5 text-slate-900 font-bold w-1/4">{contract.spaceName} ({contract.floorLocation || "الطابق التنفيذي"})</td>
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700 w-1/4">الفرع والمركز:</td>
                <td className="p-2.5 text-slate-900 w-1/4">{contract.branchName}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">المساحة المقدرة:</td>
                <td className="p-2.5 text-slate-900">{contract.areaSqm ? `${contract.areaSqm} متر مربع (م²)` : "مساحة مكتبية قياسية"}</td>
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">السعة الاستيعابية:</td>
                <td className="p-2.5 text-slate-900">{contract.capacityPersons || 1} أشخاص / مكاتب عمل</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">مدة العقد:</td>
                <td className="p-2.5 text-slate-900 font-bold text-indigo-700">
                  {contract.durationMonths} شهراً ({contract.startDate} إلى {contract.endDate})
                </td>
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">فترة السماح والإشعار:</td>
                <td className="p-2.5 text-slate-900">سماح: {contract.gracePeriodDays || 0} أيام • إشعار: {contract.noticePeriodDays} يوماً</td>
              </tr>
              <tr>
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">بطاقات الدخول والمواقف:</td>
                <td colSpan={3} className="p-2.5 text-slate-800">
                  عدد {contract.accessKeyCardsCount || 1} بطاقات دخول ذكية • {contract.assignedParkingSlots || "مواقف الزوار العامة"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financials & Scheduled Rent Installments Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              القيم المالية وجدول الأقساط والدفعات الإيجارية (RENTAL SCHEDULE)
            </span>
            <span className="text-slate-600 text-[11px]">
              دورية السداد: {getFrequencyLabel(contract.paymentFrequency)}
            </span>
          </div>

          <div className="p-3 bg-slate-50/50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
            <div className="bg-white p-2 rounded border border-slate-200">
              <div className="text-slate-500 text-[10px]">إجمالي الإيجار قبل الضريبة</div>
              <div className="font-bold text-slate-800">{formatCurrency(contract.totalRentAmount, contract.currency)}</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <div className="text-slate-500 text-[10px]">ضريبة القيمة المضافة (5%)</div>
              <div className="font-bold text-slate-800">{formatCurrency(contract.taxAmount, contract.currency)}</div>
            </div>
            <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
              <div className="text-indigo-600 text-[10px] font-bold">القيمة الإجمالية للعقد</div>
              <div className="font-black text-indigo-900 text-sm">{formatCurrency(contract.finalContractValue, contract.currency)}</div>
            </div>
            <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
              <div className="text-emerald-700 text-[10px] font-bold">الضمان المالي (التأمين المسترد)</div>
              <div className="font-black text-emerald-900 text-sm">{formatCurrency(contract.securityDeposit.depositAmount, contract.currency)}</div>
            </div>
          </div>

          {/* Installments Table */}
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 text-slate-700 text-[11px]">
              <tr>
                <th className="p-2 text-center w-10">#</th>
                <th className="p-2">بيان الدفعة الإيجارية</th>
                <th className="p-2 text-center">تاريخ الاستحقاق</th>
                <th className="p-2 text-left">صافي الدفعة</th>
                <th className="p-2 text-left">الضريبة (5%)</th>
                <th className="p-2 text-left">إجمالي الدفعة</th>
                <th className="p-2 text-center">حالة السداد والسند</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contract.installments.map((inst, index) => (
                <tr key={inst.id || index} className={inst.status === "PAID" ? "bg-emerald-50/20" : ""}>
                  <td className="p-2 text-center font-bold text-slate-600">{inst.installmentNumber}</td>
                  <td className="p-2 font-medium text-slate-900">{inst.titleAr}</td>
                  <td className="p-2 text-center font-mono font-semibold text-slate-800">{inst.dueDate}</td>
                  <td className="p-2 text-left font-mono">{formatCurrency(inst.amount, contract.currency)}</td>
                  <td className="p-2 text-left font-mono text-slate-500">{formatCurrency(inst.taxAmount, contract.currency)}</td>
                  <td className="p-2 text-left font-mono font-bold text-indigo-900">{formatCurrency(inst.totalAmount, contract.currency)}</td>
                  <td className="p-2 text-center">
                    {inst.status === "PAID" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        مسددة {inst.linkedVoucherNumber ? `(${inst.linkedVoucherNumber})` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        مستحقة بالسداد
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Included Amenities & Monthly Membership Quotas */}
        <div className="bg-indigo-50/30 border border-indigo-100 rounded-lg p-4 mb-6 text-xs">
          <h4 className="font-bold text-indigo-950 text-xs mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            المنافع المشمولة ورصيد الحصص الشهرية المجانية للمستأجر:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>إنترنت ألياف بصرية فائق السرعة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>الكهرباء والمياه والتكييف المركزي</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>خدمات النظافة والاستقبال والمراسلات</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>رصيد قاعات اجتماعات ({contract.monthlyFreeMeetingRoomHours || 20} ساعة/شهر)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>رصيد استوديو وبودكاست ({contract.monthlyFreeMediaStudioHours || 2} ساعات/شهر)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>استشارات إدارية ومحاسبية ({contract.monthlyFreeConsultations || 2} شهرياً)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>خصم {contract.tenantDiscountOnExtraServicesPercent || 15}% على الخدمات الإضافية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ضيافة القهوة والمشروبات الساخنة</span>
            </div>
          </div>
        </div>

        {/* Contract Legal Clauses */}
        <div className="mb-8 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-700" />
            البنود والشروط والأحكام التعاقدية الملزمة (TERMS & CONDITIONS):
          </h3>

          <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed text-justify">
            {contract.clauses.map((clause, idx) => (
              <div key={clause.id || idx} className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                <span className="font-bold text-slate-900 block mb-0.5">
                  {clause.titleAr}
                </span>
                <p>{clause.contentAr}</p>
              </div>
            ))}

            {contract.customTermsNotes && (
              <div className="bg-amber-50/60 p-2.5 rounded border border-amber-200 text-amber-950">
                <span className="font-bold block mb-0.5">شروط وأحكام خاصة إضافية:</span>
                <p>{contract.customTermsNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signatures & Approvals Section */}
        <div className="border-t-2 border-slate-900 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            {/* Lessor Signature Block */}
            <div className="space-y-2 flex flex-col items-center">
              <div className="font-bold text-slate-900 text-sm">
                الطرف الأول (المؤجر)
              </div>
              <div className="text-slate-600">
                عن / {contract.lessorCompanyName}
              </div>
              <div className="text-[11px] text-slate-500">
                المفوض بالتوقيع: {contract.lessorRepresentative}
              </div>

              <div className="w-48 h-20 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center relative overflow-hidden my-2">
                {contract.lessorSignature?.signatureDataUrl ? (
                  <img
                    src={contract.lessorSignature.signatureDataUrl}
                    alt="توقيع المؤجر"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">التوقيع والختم المعتمد</span>
                )}
                {companySettings.stampImageUrl && (
                  <img
                    src={companySettings.stampImageUrl}
                    alt="الختم الرسمي"
                    className="absolute inset-0 m-auto max-h-16 opacity-30 pointer-events-none"
                  />
                )}
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                التاريخ: {contract.lessorSignature?.signedAt ? contract.lessorSignature.signedAt.split("T")[0] : contract.startDate}
              </div>
            </div>

            {/* Lessee Signature Block */}
            <div className="space-y-2 flex flex-col items-center">
              <div className="font-bold text-slate-900 text-sm">
                الطرف الثاني (المستأجر)
              </div>
              <div className="text-slate-600">
                عن / {contract.tenantName}
              </div>
              <div className="text-[11px] text-slate-500">
                المفوض بالتوقيع: {contract.tenantSignatoryName}
              </div>

              <div className="w-48 h-20 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center relative overflow-hidden my-2">
                {contract.tenantSignature?.signatureDataUrl ? (
                  <img
                    src={contract.tenantSignature.signatureDataUrl}
                    alt="توقيع المستأجر"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">توقيع المستأجر / الختم</span>
                )}
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                التاريخ: {contract.tenantSignature?.signedAt ? contract.tenantSignature.signedAt.split("T")[0] : contract.startDate}
              </div>
            </div>
          </div>

          {/* Electronic Verification Stamp & QR */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                عقد موثق ومعتمد رقمياً عبر منصة ديشال لإدارة الأعمال ومساحات العمل (Deshal ERP) • كود التحقق:{" "}
                <span className="font-mono font-bold text-slate-800">{contract.signatureVerificationCode || "VER-OM-948123-SIGN"}</span>
              </span>
            </div>
            <div className="text-center sm:text-left font-mono">
              صفحة 1 من 1 • حرر هذا العقد من نسختين أصليتين
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
