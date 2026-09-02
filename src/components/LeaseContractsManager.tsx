import React, { useState, useMemo } from "react";
import {
  LeaseContract,
  RentalSpace,
  Customer,
  CompanySettings,
  MembershipPackage,
  LeaseContractStatus,
  LeaseContractType,
  PaymentInstallment,
  ReceiptVoucher
} from "../types";
import {
  Building2,
  FileCheck,
  Plus,
  Search,
  Filter,
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  Calendar,
  Users,
  Sparkles,
  Share2,
  Download,
  FileText,
  Upload,
  Layers,
  ArrowUpRight,
  Eye,
  PenTool,
  Check,
  RefreshCw,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { LeaseContractPrintView } from "./LeaseContractPrintView";
import { LeaseContractEditorModal } from "./LeaseContractEditorModal";
import { SecurityDepositModal } from "./SecurityDepositModal";

interface LeaseContractsManagerProps {
  contracts: LeaseContract[];
  spaces: RentalSpace[];
  customers: Customer[];
  packages: MembershipPackage[];
  companySettings: CompanySettings;
  onSaveContract: (contract: LeaseContract) => void;
  onDeleteContract: (contractId: string) => void;
  onCollectInstallment: (contract: LeaseContract, installment: PaymentInstallment) => void;
  onSaveDepositSettlement: (contract: LeaseContract, refundData?: any) => void;
  onOpenPackagesModal?: () => void;
  onShareWhatsApp?: (contract: LeaseContract) => void;
}

export const LeaseContractsManager: React.FC<LeaseContractsManagerProps> = ({
  contracts,
  spaces,
  customers,
  packages,
  companySettings,
  onSaveContract,
  onDeleteContract,
  onCollectInstallment,
  onSaveDepositSettlement,
  onOpenPackagesModal,
  onShareWhatsApp
}) => {
  // Navigation View Tab
  const [activeSubTab, setActiveSubTab] = useState<
    "contracts" | "installments" | "deposits" | "documents" | "packages"
  >("contracts");

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [contractToEdit, setContractToEdit] = useState<LeaseContract | null>(null);
  const [viewingContract, setViewingContract] = useState<LeaseContract | null>(null);
  const [depositSettlementContract, setDepositSettlementContract] = useState<LeaseContract | null>(null);

  // Formatting helpers
  const formatCurrency = (amount: number, curr = "OMR") => {
    return `${amount.toFixed(3)} ${curr === "OMR" ? "ر.ع" : curr}`;
  };

  // KPIs Calculations
  const kpis = useMemo(() => {
    const activeContracts = contracts.filter((c) => c.status === "ACTIVE");
    const totalActiveValue = activeContracts.reduce((sum, c) => sum + c.finalContractValue, 0);

    const expiringSoon = contracts.filter((c) => {
      if (c.status !== "ACTIVE") return false;
      const end = new Date(c.endDate).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    // Total Held Deposits
    const totalHeldDeposits = contracts
      .filter((c) => c.securityDeposit.status === "HELD_IN_CUSTODY")
      .reduce((sum, c) => sum + (c.securityDeposit.depositAmount || 0), 0);

    // All installments
    const allInsts: { contract: LeaseContract; installment: PaymentInstallment }[] = [];
    contracts.forEach((c) => {
      c.installments.forEach((inst) => {
        allInsts.push({ contract: c, installment: inst });
      });
    });

    const pendingInsts = allInsts.filter((i) => i.installment.status === "PENDING");
    const pendingAmount = pendingInsts.reduce((sum, i) => sum + i.installment.totalAmount, 0);

    // Occupancy estimation
    const totalSpacesCount = spaces.length || 1;
    const leasedSpaceIds = new Set(activeContracts.map((c) => c.spaceId));
    const occupancyRate = Math.round((leasedSpaceIds.size / totalSpacesCount) * 100);

    return {
      totalContracts: contracts.length,
      activeCount: activeContracts.length,
      totalActiveValue,
      expiringSoon,
      totalHeldDeposits,
      pendingInstsCount: pendingInsts.length,
      pendingAmount,
      occupancyRate: Math.min(100, occupancyRate)
    };
  }, [contracts, spaces]);

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch =
        c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.spaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.spaceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.tenantCrNumber && c.tenantCrNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        selectedStatusFilter === "ALL" || c.status === selectedStatusFilter;

      const matchType =
        selectedTypeFilter === "ALL" || c.contractType === selectedTypeFilter;

      const matchBranch =
        selectedBranchFilter === "ALL" || c.branchName === selectedBranchFilter;

      return matchSearch && matchStatus && matchType && matchBranch;
    });
  }, [contracts, searchQuery, selectedStatusFilter, selectedTypeFilter, selectedBranchFilter]);

  // All Flattened Installments for Installments Tab
  const allInstallmentsList = useMemo(() => {
    const list: { contract: LeaseContract; installment: PaymentInstallment }[] = [];
    contracts.forEach((c) => {
      c.installments.forEach((inst) => {
        list.push({ contract: c, installment: inst });
      });
    });
    // Sort by due date
    return list.sort((a, b) => new Date(a.installment.dueDate).getTime() - new Date(b.installment.dueDate).getTime());
  }, [contracts]);

  const getStatusBadge = (status: LeaseContractStatus) => {
    switch (status) {
      case "ACTIVE":
        return { label: "ساري ومعتمد", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "PENDING_SIGNATURE":
        return { label: "بانتظار التوقيع", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "EXPIRING_SOON":
        return { label: "ينتهي قريباً", bg: "bg-rose-50 text-rose-700 border-rose-200" };
      case "EXPIRED":
        return { label: "منتهي", bg: "bg-slate-100 text-slate-700 border-slate-300" };
      case "TERMINATED":
        return { label: "مفسوخ", bg: "bg-red-50 text-red-700 border-red-200" };
      case "DRAFT":
        return { label: "مسودة", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      default:
        return { label: status, bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const getContractTypeLabel = (type: LeaseContractType) => {
    switch (type) {
      case "COMMERCIAL_OFFICE":
        return "مكتب تجاري خاص";
      case "COWORKING_DEDICATED_DESK":
        return "مكتب مشترك مخصص";
      case "FLEX_SPACE":
        return "مساحة مرنة";
      case "VIRTUAL_OFFICE":
        return "مكتب افتراضي";
      case "EVENT_HALL_RETAINER":
        return "حجز قاعات دوري";
      default:
        return "مساحة أعمال";
    }
  };

  // Branches list for filter
  const branchNames = Array.from(new Set(contracts.map((c) => c.branchName).filter(Boolean)));

  return (
    <div className="space-y-6 text-right font-sans pb-12">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-950/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  نظام إدارة وتأجير المكاتب ومساحات العمل وعقود المستأجرين
                </h1>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  إدارة عقود ذكية متكاملة
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl">
                إصدار وتوثيق العقود إلكترونياً، جدولة الدفعات والأقساط، إدارة أمانات التأمين المستردة، وأرشفة وثائق المستأجرين
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenPackagesModal && (
              <button
                onClick={onOpenPackagesModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>باقات المستأجرين والحصص</span>
              </button>
            )}

            <button
              onClick={() => {
                setContractToEdit(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء عقد إيجار جديد (New Lease)</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-indigo-900/60 relative z-10 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">إجمالي القيمة الإيجارية السارية</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-300 font-mono">
              {formatCurrency(kpis.totalActiveValue)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {kpis.activeCount} عقود سارية وموثقة
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">معدل إشغال المكاتب</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-indigo-300 font-mono">
              {kpis.occupancyRate}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              من إجمالي {spaces.length} مساحات ووحدات
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">أقساط بانتظار التحصيل</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-amber-300 font-mono">
              {formatCurrency(kpis.pendingAmount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              عدد {kpis.pendingInstsCount} دفعات مستحقة
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">أمانات التأمين المستردة</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-teal-300 font-mono">
              {formatCurrency(kpis.totalHeldDeposits)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              محفوظة كودائع ضمان للمستأجرين
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 backdrop-blur col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">عقود تنتهي خلال شهر</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-rose-300 font-mono">
              {kpis.expiringSoon} عقود
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              تتطلب تجديداً أو إشعار إخلاء
            </div>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("contracts")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "contracts"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>سجل العقود والمستأجرين ({contracts.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("installments")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "installments"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>جدول الأقساط والدفعات ({allInstallmentsList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("deposits")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "deposits"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>الضمانات والتأمينات المالية</span>
          </button>

          <button
            onClick={() => setActiveSubTab("documents")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "documents"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>أرشيف الوثائق والتراخيص</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar for Contracts Tab */}
      {activeSubTab === "contracts" && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث برقم العقد، اسم المستأجر، السجل التجاري، كود الوحدة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-700"
            >
              <option value="ALL">كافة الحالات</option>
              <option value="ACTIVE">ساري ومعتمد</option>
              <option value="PENDING_SIGNATURE">بانتظار التوقيع</option>
              <option value="EXPIRING_SOON">ينتهي قريباً</option>
              <option value="EXPIRED">منتهي</option>
              <option value="TERMINATED">مفسوخ</option>
              <option value="DRAFT">مسودة</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-700"
            >
              <option value="ALL">كافة أنواع المساحات</option>
              <option value="COMMERCIAL_OFFICE">مكتب تجاري خاص</option>
              <option value="COWORKING_DEDICATED_DESK">مكتب مشترك مخصص</option>
              <option value="FLEX_SPACE">مساحة عمل مرنة</option>
              <option value="VIRTUAL_OFFICE">مكتب افتراضي</option>
              <option value="EVENT_HALL_RETAINER">حجز دوري لقاعات</option>
            </select>

            {branchNames.length > 1 && (
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-700"
              >
                <option value="ALL">كافة الفروع</option>
                {branchNames.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 1: CONTRACTS LIST */}
      {activeSubTab === "contracts" && (
        <div className="space-y-4">
          {filteredContracts.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">لا توجد عقود إيجار مطابقة</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكنك إنشاء وتوثيق عقد إيجار تجاري جديد لأي مستأجر وتحديد الوحدة، الأقساط، والتوقيع الرقمي.
              </p>
              <button
                onClick={() => {
                  setContractToEdit(null);
                  setIsEditorOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار عقد إيجار جديد الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredContracts.map((contract) => {
                const statusInfo = getStatusBadge(contract.status);
                const paidInstallments = contract.installments.filter((i) => i.status === "PAID").length;
                const totalInstallments = contract.installments.length;

                return (
                  <div
                    key={contract.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all p-5 space-y-4 text-xs"
                  >
                    {/* Top Row: Contract No, Title, Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {contract.contractNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {getContractTypeLabel(contract.contractType)}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">
                            {contract.titleAr}
                          </h3>
                        </div>
                      </div>

                      {/* Verification Code Tag */}
                      <div className="flex items-center gap-2">
                        {contract.isDigitallySigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>موقع ومعتمد إلكترونياً</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>بانتظار التوقيع الرقمي</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                      {/* Tenant */}
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">المستأجر (الطرف الثاني)</span>
                        <span className="font-bold text-slate-900 text-xs block truncate mt-0.5">
                          {contract.tenantName}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {contract.tenantSignatoryName} • {contract.tenantPhone}
                        </span>
                      </div>

                      {/* Leased Space */}
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">العين المؤجرة</span>
                        <span className="font-bold text-indigo-900 text-xs block truncate mt-0.5">
                          {contract.spaceName}
                        </span>
                        <span className="text-slate-500 text-[10px] font-mono">
                          كود: {contract.spaceCode} • {contract.branchName}
                        </span>
                      </div>

                      {/* Term */}
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">مدة التعاقد</span>
                        <span className="font-bold text-slate-800 text-xs block mt-0.5">
                          {contract.durationMonths} شهراً ({contract.startDate} إلى {contract.endDate})
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          دورية السداد: {contract.paymentFrequency}
                        </span>
                      </div>

                      {/* Financials & Deposit */}
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">القيمة الإجمالية والتأمين</span>
                        <span className="font-black text-slate-900 text-xs block font-mono mt-0.5">
                          {formatCurrency(contract.finalContractValue, contract.currency)}
                        </span>
                        <span className="text-emerald-700 text-[10px] font-semibold">
                          تأمين: {formatCurrency(contract.securityDeposit.depositAmount, contract.currency)} ({contract.securityDeposit.status})
                        </span>
                      </div>
                    </div>

                    {/* Progress & Bottom Actions Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      {/* Installment Progress */}
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs">سداد الأقساط:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{
                                width: `${totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">
                            {paidInstallments} من {totalInstallments} مسددة
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* View / Print Official Agreement */}
                        <button
                          onClick={() => setViewingContract(contract)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs transition-all cursor-pointer"
                          title="عرض وطباعة العقد القانوني الرسمي"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة العقد (Print)</span>
                        </button>

                        {/* Security Deposit Settlement */}
                        <button
                          onClick={() => setDepositSettlementContract(contract)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs transition-all cursor-pointer"
                          title="تسوية الضمان المالي والتأمين المسترد ومحضر الإخلاء"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>التأمين ({contract.securityDeposit.depositAmount} ر.ع)</span>
                        </button>

                        {/* WhatsApp Share */}
                        {onShareWhatsApp && (
                          <button
                            onClick={() => onShareWhatsApp(contract)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                            title="إرسال العقد عبر واتساب"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Contract */}
                        <button
                          onClick={() => {
                            setContractToEdit(contract);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer"
                          title="تعديل بيانات العقد"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Contract */}
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف عقد الإيجار رقم (${contract.contractNumber}) نهائياً؟`)) {
                              onDeleteContract(contract.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-200 transition-all cursor-pointer"
                          title="حذف العقد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: INSTALLMENTS SCHEDULES LEDGER */}
      {activeSubTab === "installments" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                دفتر جدولة الأقساط والدفعات الإيجارية المستحقة
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                تتبع مواعيد استحقاق الدفعات الإيجارية لكل مستأجر مع إمكانية التحصيل وإصدار سند قبض فوري
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs">
                بانتظار السداد: {kpis.pendingInstsCount} أقساط ({formatCurrency(kpis.pendingAmount)})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-700 text-[11px]">
                <tr>
                  <th className="p-3">رقم العقد والمستأجر</th>
                  <th className="p-3">العين المؤجرة</th>
                  <th className="p-3">بيان الدفعة الإيجارية</th>
                  <th className="p-3 text-center">تاريخ الاستحقاق</th>
                  <th className="p-3 text-left">المبلغ الصافي</th>
                  <th className="p-3 text-left">الضريبة (5%)</th>
                  <th className="p-3 text-left">الإجمالي</th>
                  <th className="p-3 text-center">حالة السداد</th>
                  <th className="p-3 text-center">الإجراء المالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allInstallmentsList.map(({ contract, installment }) => {
                  const isPaid = installment.status === "PAID";
                  const isOverdue = !isPaid && new Date(installment.dueDate).getTime() < new Date().getTime();

                  return (
                    <tr key={installment.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{contract.contractNumber}</div>
                        <div className="text-slate-500 text-[11px]">{contract.tenantName}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {contract.spaceName}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {installment.titleAr}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-800">
                        {installment.dueDate}
                      </td>
                      <td className="p-3 text-left font-mono">{installment.amount.toFixed(3)} ر.ع</td>
                      <td className="p-3 text-left font-mono text-slate-500">{installment.taxAmount.toFixed(3)} ر.ع</td>
                      <td className="p-3 text-left font-mono font-black text-indigo-900">
                        {installment.totalAmount.toFixed(3)} ر.ع
                      </td>
                      <td className="p-3 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            مسددة {installment.linkedVoucherNumber ? `(${installment.linkedVoucherNumber})` : ""}
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            متأخرة عن السداد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            مستحقة بالسداد
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {isPaid ? (
                          <button
                            onClick={() => setViewingContract(contract)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs"
                            title="معاينة العقد"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onCollectInstallment(contract, installment)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>تحصيل وإصدار سند قبض</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SECURITY DEPOSITS LEDGER */}
      {activeSubTab === "deposits" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                سجل الضمانات والتأمينات المالية المستردة (Security Deposits Custody)
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                إجمالي مبالغ التأمين المحفوظة كأمانة لضمان التزامات المستأجرين وسلامة الأصول
              </p>
            </div>

            <span className="bg-teal-100 text-teal-900 font-bold px-3 py-1 rounded-full text-xs">
              إجمالي الأمانات المحفوظة: {formatCurrency(kpis.totalHeldDeposits)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-700 text-[11px]">
                <tr>
                  <th className="p-3">رقم العقد</th>
                  <th className="p-3">المستأجر</th>
                  <th className="p-3">الوحدة / المكتب</th>
                  <th className="p-3 text-left">مبلغ التأمين</th>
                  <th className="p-3">حساب الأمانة المودع به</th>
                  <th className="p-3 text-center">حالة التأمين</th>
                  <th className="p-3 text-center">الإجراء والتسوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((contract) => {
                  const dep = contract.securityDeposit;
                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-slate-900">{contract.contractNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{contract.tenantName}</td>
                      <td className="p-3 text-slate-700">{contract.spaceName}</td>
                      <td className="p-3 text-left font-mono font-black text-emerald-900">
                        {formatCurrency(dep.depositAmount, dep.currency)}
                      </td>
                      <td className="p-3 text-slate-600 text-[11px]">
                        {dep.heldAccountLedger || "حساب أمانات وتأمينات المستأجرين"}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            dep.status === "HELD_IN_CUSTODY"
                              ? "bg-emerald-100 text-emerald-800"
                              : dep.status === "FULLY_REFUNDED"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {dep.status === "HELD_IN_CUSTODY"
                            ? "محفوظ كأمانة"
                            : dep.status === "FULLY_REFUNDED"
                            ? "مسترد بالكامل"
                            : dep.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setDepositSettlementContract(contract)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer mx-auto"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>تسوية واسترداد التأمين</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: DOCUMENTS ARCHIVE */}
      {activeSubTab === "documents" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                أرشيف وثائق ومستندات المستأجرين والتراخيص البلدية
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                مستودع مركزي لحفظ شهادات السجل التجاري CR، بطاقات الهوية، ومحاضر فحص واستلام المكاتب
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">{contract.tenantName}</span>
                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                    {contract.contractNumber}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {contract.documents.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-[11px] bg-white rounded-lg border border-dashed border-slate-200">
                      لا توجد مستندات مرفقة بالعقد
                    </div>
                  ) : (
                    contract.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[11px]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{doc.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{doc.fileSize}</span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    setContractToEdit(contract);
                    setIsEditorOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>إدارة وإضافة مستندات</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Contract Print / View Modal */}
      {viewingContract && (
        <LeaseContractPrintView
          contract={viewingContract}
          companySettings={companySettings}
          onClose={() => setViewingContract(null)}
          onShareWhatsApp={onShareWhatsApp}
        />
      )}

      {/* 2. Contract Editor / Builder Modal */}
      {isEditorOpen && (
        <LeaseContractEditorModal
          contractToEdit={contractToEdit}
          spaces={spaces}
          customers={customers}
          packages={packages}
          companySettings={companySettings}
          onSaveContract={(c) => {
            onSaveContract(c);
            setIsEditorOpen(false);
            setContractToEdit(null);
          }}
          onClose={() => {
            setIsEditorOpen(false);
            setContractToEdit(null);
          }}
        />
      )}

      {/* 3. Security Deposit Settlement Modal */}
      {depositSettlementContract && (
        <SecurityDepositModal
          contract={depositSettlementContract}
          onSaveDepositSettlement={(updatedContract, refundData) => {
            onSaveDepositSettlement(updatedContract, refundData);
            setDepositSettlementContract(null);
          }}
          onClose={() => setDepositSettlementContract(null)}
        />
      )}

    </div>
  );
};
