import React, { useState, useMemo } from "react";
import {
  Branch,
  StockTransfer,
  InventoryItem,
  ReceiptVoucher,
  PurchaseInvoice,
  CompanySettings
} from "../types";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import {
  Building2,
  Plus,
  ArrowRightLeft,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Package,
  FileText,
  DollarSign,
  Star,
  CheckCircle2,
  Edit3,
  Trash2,
  TrendingUp,
  Search,
  SlidersHorizontal,
  X,
  Printer,
  Download,
  AlertCircle,
  Warehouse,
  ShieldCheck,
  BarChart3,
  Layers,
  ArrowUpRight,
  Sparkles,
  ArrowDownRight
} from "lucide-react";

interface BranchesViewProps {
  branches: Branch[];
  activeBranchId: string;
  transfers: StockTransfer[];
  vouchers: ReceiptVoucher[];
  inventory: InventoryItem[];
  purchases: PurchaseInvoice[];
  companySettings?: CompanySettings;
  onSaveBranches: (branches: Branch[]) => void;
  onSaveTransfers: (transfers: StockTransfer[]) => void;
  onSelectActiveBranch: (branchId: string) => void;
  onUpdateInventoryAfterTransfer?: (updatedInventory: InventoryItem[]) => void;
  onNavigateToVouchersByBranch?: (branchName: string) => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({
  branches,
  activeBranchId,
  transfers,
  vouchers,
  inventory,
  purchases,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  onSaveBranches,
  onSaveTransfers,
  onSelectActiveBranch,
  onUpdateInventoryAfterTransfer,
  onNavigateToVouchersByBranch
}) => {
  const { t, language, dir, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<"directory" | "transfers" | "analytics">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals state
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Branch Form State
  const [branchFormData, setBranchFormData] = useState<Partial<Branch>>({
    code: "",
    name: "",
    nameEn: "",
    isMain: false,
    phone: "",
    email: "",
    address: "",
    city: "صحار",
    country: "سلطنة عمان",
    taxId: companySettings?.taxId || "",
    crNumber: companySettings?.crNumber || "",
    managerName: "",
    managerPhone: "",
    status: "ACTIVE",
    defaultWarehouse: "المستودع الرئيسي - صحار",
    color: "#4f46e5",
    notes: ""
  });

  // Transfer Form State
  const [transferFormData, setTransferFormData] = useState({
    transferNumber: `TR-2026-${String(transfers.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    fromBranchId: branches[0]?.id || "",
    toBranchId: branches[1]?.id || branches[0]?.id || "",
    itemId: inventory[0]?.id || "",
    quantity: 1,
    notes: "",
    transferByName: companySettings?.authorizedSignatoryName || "مسؤول التحويلات"
  });

  // Currency
  const currency = companySettings?.defaultCurrency || "OMR";

  // Calculate Branch Stats
  const branchMetrics = useMemo(() => {
    const metricsMap: Record<
      string,
      {
        revenue: number;
        voucherCount: number;
        purchasesTotal: number;
        inventoryValue: number;
        itemCount: number;
      }
    > = {};

    branches.forEach((b) => {
      metricsMap[b.id] = {
        revenue: 0,
        voucherCount: 0,
        purchasesTotal: 0,
        inventoryValue: 0,
        itemCount: 0
      };
    });

    // Compute vouchers revenue per branch
    vouchers.forEach((v) => {
      // match by branchId or branchName or fallback to main branch if unassigned
      const targetBranch =
        branches.find((b) => b.id === v.branchId) ||
        branches.find((b) => b.name === v.branchName) ||
        branches.find((b) => b.isMain) ||
        branches[0];

      if (targetBranch && metricsMap[targetBranch.id]) {
        if (v.type === "RECEIPT" || v.type === "TAX_INVOICE") {
          metricsMap[targetBranch.id].revenue += v.totalAmount || v.amount || 0;
        }
        metricsMap[targetBranch.id].voucherCount += 1;
      }
    });

    // Compute purchases per branch
    purchases.forEach((p) => {
      const targetBranch =
        branches.find((b) => b.id === p.branchId) ||
        branches.find((b) => b.name === p.branchName) ||
        branches.find((b) => b.defaultWarehouse === p.warehouse) ||
        branches[0];

      if (targetBranch && metricsMap[targetBranch.id]) {
        metricsMap[targetBranch.id].purchasesTotal += p.totalAmount || 0;
      }
    });

    // Compute inventory per branch
    inventory.forEach((item) => {
      const targetBranch =
        branches.find((b) => b.id === item.branchId) ||
        branches.find((b) => b.defaultWarehouse === item.warehouse) ||
        branches[0];

      if (targetBranch && metricsMap[targetBranch.id]) {
        metricsMap[targetBranch.id].inventoryValue += (item.quantity || 0) * (item.costPrice || 0);
        metricsMap[targetBranch.id].itemCount += 1;
      }
    });

    return metricsMap;
  }, [branches, vouchers, purchases, inventory]);

  // Overall totals
  const overallTotals = useMemo(() => {
    const metricsList = Object.values(branchMetrics) as Array<{
      revenue: number;
      voucherCount: number;
      purchasesTotal: number;
      inventoryValue: number;
      itemCount: number;
    }>;
    const totalRev = metricsList.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const totalInv = metricsList.reduce((acc, curr) => acc + (curr.inventoryValue || 0), 0);
    const totalPurch = metricsList.reduce((acc, curr) => acc + (curr.purchasesTotal || 0), 0);
    const activeCount = branches.filter((b) => b.status === "ACTIVE").length;

    return { totalRev, totalInv, totalPurch, activeCount };
  }, [branchMetrics, branches]);

  // Filtered branches list
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.managerName && b.managerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.phone && b.phone.includes(searchQuery));

      const matchesCity = cityFilter === "ALL" || b.city === cityFilter;
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [branches, searchQuery, cityFilter, statusFilter]);

  const uniqueCities = useMemo(() => {
    return Array.from(new Set(branches.map((b) => b.city).filter(Boolean)));
  }, [branches]);

  // Handlers for Branch Modal
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchFormData({
      code: `BR-0${branches.length + 1}`,
      name: "",
      nameEn: "",
      isMain: branches.length === 0,
      phone: "+968 ",
      email: "",
      address: "",
      city: "صحار",
      country: "سلطنة عمان",
      taxId: companySettings.taxId || "",
      crNumber: companySettings.crNumber || "",
      managerName: "",
      managerPhone: "",
      status: "ACTIVE",
      defaultWarehouse: `مستودع فرع جديد`,
      color: "#3b82f6",
      notes: ""
    });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchFormData({ ...branch });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchFormData.name?.trim() || !branchFormData.code?.trim()) {
      alert("يرجى إدخال اسم الفرع وكود الفرع بشكل صحيح");
      return;
    }

    const now = new Date().toISOString();

    if (editingBranch) {
      // If marking this as main, unmark others
      const updatedList = branches.map((b) => {
        if (b.id === editingBranch.id) {
          return {
            ...b,
            ...branchFormData,
            updatedAt: now
          } as Branch;
        }
        if (branchFormData.isMain) {
          return { ...b, isMain: false };
        }
        return b;
      });
      onSaveBranches(updatedList);
    } else {
      const newId = `br-${Date.now()}`;
      const newBranch: Branch = {
        id: newId,
        code: branchFormData.code.trim().toUpperCase(),
        name: branchFormData.name.trim(),
        nameEn: branchFormData.nameEn?.trim() || "",
        isMain: Boolean(branchFormData.isMain),
        phone: branchFormData.phone || "",
        email: branchFormData.email || "",
        address: branchFormData.address || "",
        city: branchFormData.city || "صحار",
        country: branchFormData.country || "سلطنة عمان",
        taxId: branchFormData.taxId || companySettings.taxId || "",
        crNumber: branchFormData.crNumber || companySettings.crNumber || "",
        managerName: branchFormData.managerName || "",
        managerPhone: branchFormData.managerPhone || "",
        status: branchFormData.status || "ACTIVE",
        defaultWarehouse: branchFormData.defaultWarehouse || `مستودع ${branchFormData.name}`,
        color: branchFormData.color || "#4f46e5",
        notes: branchFormData.notes || "",
        createdAt: now,
        updatedAt: now
      };

      let updatedList = [...branches];
      if (newBranch.isMain) {
        updatedList = updatedList.map((b) => ({ ...b, isMain: false }));
      }
      updatedList.push(newBranch);
      onSaveBranches(updatedList);
    }

    setIsBranchModalOpen(false);
  };

  const handleToggleBranchStatus = (branchId: string) => {
    const updated = branches.map((b) => {
      if (b.id === branchId) {
        return {
          ...b,
          status: b.status === "ACTIVE" ? ("INACTIVE" as const) : ("ACTIVE" as const),
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });
    onSaveBranches(updated);
  };

  const handleSetMainBranch = (branchId: string) => {
    const updated = branches.map((b) => ({
      ...b,
      isMain: b.id === branchId,
      updatedAt: new Date().toISOString()
    }));
    onSaveBranches(updated);
  };

  const handleDeleteBranch = (branch: Branch) => {
    if (branch.isMain) {
      alert("لا يمكن حذف المقر الرئيسي للشركة. يرجى تعيين فرع رئيسي آخر أولاً.");
      return;
    }
    if (confirm(`هل أنت متأكد من رغبتك في حذف فرع (${branch.name})؟`)) {
      const updated = branches.filter((b) => b.id !== branch.id);
      onSaveBranches(updated);
      if (activeBranchId === branch.id) {
        onSelectActiveBranch("ALL");
      }
    }
  };

  // Stock Transfer Handler
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const fromBranch = branches.find((b) => b.id === transferFormData.fromBranchId);
    const toBranch = branches.find((b) => b.id === transferFormData.toBranchId);
    const targetItem = inventory.find((i) => i.id === transferFormData.itemId);

    if (!fromBranch || !toBranch || !targetItem) {
      alert("يرجى اختيار فرع المصدر وفرع الوجهة والصنف المراد تحويله");
      return;
    }

    if (fromBranch.id === toBranch.id) {
      alert("لا يمكن التحويل لنفس الفرع!");
      return;
    }

    const qty = Number(transferFormData.quantity);
    if (qty <= 0) {
      alert("يرجى إدخال كمية صحيحة أكبر من الصفر");
      return;
    }

    if (targetItem.quantity < qty) {
      alert(`الكمية المتاحة في المخزون الحالي (${targetItem.quantity} ${targetItem.unit}) أقل من الكمية المطلوبة للتحويل (${qty} ${targetItem.unit}).`);
      return;
    }

    const now = new Date().toISOString();

    const newTransfer: StockTransfer = {
      id: `tr-${Date.now()}`,
      transferNumber: transferFormData.transferNumber || `TR-${Date.now().toString().slice(-4)}`,
      date: transferFormData.date,
      fromBranchId: fromBranch.id,
      fromBranchName: fromBranch.name,
      fromWarehouse: fromBranch.defaultWarehouse || "المستودع الرئيسي",
      toBranchId: toBranch.id,
      toBranchName: toBranch.name,
      toWarehouse: toBranch.defaultWarehouse || "مستودع الوجهة",
      items: [
        {
          itemId: targetItem.id,
          sku: targetItem.sku,
          name: targetItem.name,
          quantity: qty,
          unit: targetItem.unit
        }
      ],
      status: "COMPLETED",
      notes: transferFormData.notes || `تحويل مخزني من ${fromBranch.name} إلى ${toBranch.name}`,
      transferByName: transferFormData.transferByName,
      receivedByName: toBranch.managerName || "أمين مستودع الوجهة",
      createdAt: now,
      updatedAt: now
    };

    // Update transfers list
    const updatedTransfers = [newTransfer, ...transfers];
    onSaveTransfers(updatedTransfers);

    // Update inventory quantity if callback is available
    if (onUpdateInventoryAfterTransfer) {
      // Find if item exists in destination warehouse
      const existingInDest = inventory.find(
        (i) => i.sku === targetItem.sku && (i.warehouse === toBranch.defaultWarehouse || i.branchId === toBranch.id)
      );

      let updatedInventory = inventory.map((i) => {
        if (i.id === targetItem.id) {
          const newQ = Math.max(0, i.quantity - qty);
          return {
            ...i,
            quantity: newQ,
            status: newQ === 0 ? ("OUT_OF_STOCK" as const) : newQ <= i.minAlertQuantity ? ("LOW_STOCK" as const) : ("IN_STOCK" as const),
            updatedAt: now
          };
        }
        if (existingInDest && i.id === existingInDest.id) {
          const newQ = i.quantity + qty;
          return {
            ...i,
            quantity: newQ,
            status: newQ <= i.minAlertQuantity ? ("LOW_STOCK" as const) : ("IN_STOCK" as const),
            updatedAt: now
          };
        }
        return i;
      });

      // If destination item doesn't exist yet, create a duplicate record assigned to that branch
      if (!existingInDest) {
        const newItemForDest: InventoryItem = {
          ...targetItem,
          id: `item-${Date.now()}-dest`,
          warehouse: toBranch.defaultWarehouse || `مستودع ${toBranch.name}`,
          branchId: toBranch.id,
          branchName: toBranch.name,
          quantity: qty,
          status: qty <= targetItem.minAlertQuantity ? "LOW_STOCK" : "IN_STOCK",
          createdAt: now,
          updatedAt: now
        };
        updatedInventory.push(newItemForDest);
      }

      onUpdateInventoryAfterTransfer(updatedInventory);
    }

    setIsTransferModalOpen(false);
    alert(`✅ تم إتمام التحويل المخزني رقم ${newTransfer.transferNumber} بنجاح بين ${fromBranch.name} و ${toBranch.name}`);
  };

  // Export Branches Report CSV
  const handleExportCSV = () => {
    const headers = [
      "كود الفرع",
      "اسم الفرع",
      "المدينة",
      "المدير المسؤول",
      "الهاتف",
      "المستودع",
      "الحالة",
      `إجمالي الإيرادات (${currency})`,
      `إجمالي المشتريات (${currency})`,
      `قيمة المخزون (${currency})`,
      "عدد السندات"
    ];

    const rows = branches.map((b) => {
      const stats = branchMetrics[b.id] || { revenue: 0, purchasesTotal: 0, inventoryValue: 0, voucherCount: 0 };
      return [
        b.code,
        `"${b.name}"`,
        b.city,
        b.managerName || "",
        b.phone,
        `"${b.defaultWarehouse || ""}"`,
        b.status === "ACTIVE" ? "نشط" : "معطل",
        stats.revenue.toFixed(2),
        stats.purchasesTotal.toFixed(2),
        stats.inventoryValue.toFixed(2),
        stats.voucherCount
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_فروع_${companySettings?.companyName || "DeshalERP"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeBranchObj = branches.find((b) => b.id === activeBranchId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" dir={dir}>
      
      {/* Header & Main Control Hub */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-sky-500/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  إدارة الفروع والمواقع المتعددة
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full">
                    {branches.length} فروع
                  </span>
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  متابعة عمليات ومبيعات ومخازن فروع الشركة، والتحكم بالتحويلات المخزنية وإيرادات كل فرع
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>تحويل مخزني بين الفروع</span>
            </button>

            <button
              onClick={handleOpenAddBranch}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Branch Scope Filter Pill */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">الفرع التشغيلي المختار:</span>
            
            <button
              onClick={() => onSelectActiveBranch("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeBranchId === "ALL"
                  ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>🌐 جميع الفروع (مجمّع)</span>
            </button>

            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectActiveBranch(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeBranchId === b.id
                    ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: b.color || "#4f46e5" }}
                />
                <span>{b.name}</span>
                {b.isMain && <Star className="w-3 h-3 fill-amber-300 text-amber-300 inline" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="تصدير بيانات الفروع إلى CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">الفروع النشطة</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{overallTotals.activeCount}</span>
            <span className="text-xs text-slate-400 font-semibold">من إجمالي {branches.length}</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مقر رئيسي + {branches.length - 1} فروع فرعية</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">إجمالي إيرادات الفروع</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {overallTotals.totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-bold">{currency}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            مجموع سندات القبض والفواتير
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">قيمة مخزون الفروع</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-600">
              {overallTotals.totalInv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-bold">{currency}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            موزعة على كافة المستودعات
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">التحويلات بين الفروع</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{transfers.length}</span>
            <span className="text-xs text-slate-400 font-bold">عملية تحويل</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>مناقلات بضائع موثقة بالكامل</span>
          </div>
        </div>

      </div>

      {/* Main Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-fit max-w-full overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "directory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>دليل الفروع ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "transfers" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>التحويلات المخزنية بين الفروع ({transfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "analytics" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>مقارنة أداء الفروع</span>
        </button>
      </div>

      {/* TAB 1: BRANCHES DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث باسم الفرع، الكود، المدينة، المدير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">المدينة:</span>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none"
                >
                  <option value="ALL">جميع المدن</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">الحالة:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="ACTIVE">نشط فقط</option>
                  <option value="INACTIVE">معطل فقط</option>
                </select>
              </div>
            </div>
          </div>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBranches.map((branch) => {
              const stats = branchMetrics[branch.id] || {
                revenue: 0,
                voucherCount: 0,
                purchasesTotal: 0,
                inventoryValue: 0,
                itemCount: 0
              };
              const isSelected = activeBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-sm flex flex-col justify-between ${
                    isSelected
                      ? "ring-2 ring-indigo-600 border-indigo-600 shadow-md"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {/* Top Color Accent */}
                  <div
                    style={{ backgroundColor: branch.color || "#4f46e5" }}
                    className="h-2 w-full"
                  />

                  <div className="p-6 space-y-5">
                    
                    {/* Branch Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{
                              backgroundColor: `${branch.color || "#4f46e5"}15`,
                              color: branch.color || "#4f46e5",
                              borderColor: `${branch.color || "#4f46e5"}40`
                            }}
                            className="font-mono text-[11px] font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider"
                          >
                            {branch.code}
                          </span>
                          {branch.isMain && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>المقر الرئيسي</span>
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              branch.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {branch.status === "ACTIVE" ? "نشط" : "معطل"}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 pt-1">
                          {branch.name}
                        </h3>
                        {branch.nameEn && (
                          <p className="text-xs text-slate-400 font-medium">{branch.nameEn}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditBranch(branch)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="تعديل بيانات الفرع"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!branch.isMain && (
                          <button
                            onClick={() => handleDeleteBranch(branch)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="حذف الفرع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Branch Contacts & Location Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700">
                          المدير: {branch.managerName || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700">{branch.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate" title={branch.address}>
                          {branch.city} - {branch.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate" title={branch.defaultWarehouse}>
                          {branch.defaultWarehouse || "المستودع الرئيسي"}
                        </span>
                      </div>
                    </div>

                    {/* Financial & Operational Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                      <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-slate-500 block">إيرادات الفرع</span>
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          {stats.revenue.toLocaleString()} {currency}
                        </span>
                      </div>

                      <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
                        <span className="text-[10px] font-bold text-slate-500 block">قيمة المخزون</span>
                        <span className="text-xs font-black text-sky-700 font-mono">
                          {stats.inventoryValue.toLocaleString()} {currency}
                        </span>
                      </div>

                      <div className="p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-slate-500 block">السندات</span>
                        <span className="text-xs font-black text-indigo-700 font-mono">
                          {stats.voucherCount} سند
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Actions Card Bar */}
                  <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectActiveBranch(branch.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {isSelected ? "✓ الفرع النشط حالياً" : "التبديل إلى هذا الفرع"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {!branch.isMain && (
                        <button
                          onClick={() => handleSetMainBranch(branch.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                        >
                          تعيين كرئيسي
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleBranchStatus(branch.id)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                          branch.status === "ACTIVE"
                            ? "text-rose-600 hover:bg-rose-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {branch.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 2: INTER-BRANCH STOCK TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                سجل التحويلات والمناقلات المخزنية بين الفروع
              </h3>
              <p className="text-xs text-slate-500">
                توثيق حركة الأصناف والمعدات المحولة من مستودع فرع إلى مستودع فرع آخر
              </p>
            </div>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إجراء تحويل جديد</span>
            </button>
          </div>

          {/* Transfers Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">رقم التحويل</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">من فرع / مستودع</th>
                    <th className="p-4">إلى فرع / مستودع</th>
                    <th className="p-4">الأصناف المحولة</th>
                    <th className="p-4">المسؤول</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600">
                        {tr.transferNumber}
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {formatDateToDDMMMMYYYY(tr.date)}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{tr.fromBranchName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tr.fromWarehouse}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{tr.toBranchName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tr.toWarehouse}</div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {tr.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-800">
                              <span className="font-semibold">{item.name}</span>
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                                {item.quantity} {item.unit || "حبة"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div>{tr.transferByName}</div>
                        {tr.receivedByName && (
                          <div className="text-[10px] text-slate-400">استلام: {tr.receivedByName}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مكتمل ومرحّل</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: PERFORMANCE & ANALYTICS COMPARISON */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          
          {/* Comparison Matrix Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              جدول المقارنة المالية والتشغيلية بين كافة الفروع
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">الفرع</th>
                    <th className="p-3">المدينة</th>
                    <th className="p-3 text-center">عدد السندات</th>
                    <th className="p-3">إجمالي الإيرادات ({currency})</th>
                    <th className="p-3">المشتريات ({currency})</th>
                    <th className="p-3">قيمة المخزون ({currency})</th>
                    <th className="p-3">صافي المساهمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map((b) => {
                    const stats = branchMetrics[b.id] || { revenue: 0, purchasesTotal: 0, inventoryValue: 0, voucherCount: 0 };
                    const netContribution = stats.revenue - stats.purchasesTotal;
                    const revShare = overallTotals.totalRev > 0 ? (stats.revenue / overallTotals.totalRev) * 100 : 0;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: b.color || "#4f46e5" }}
                          />
                          <span>{b.name}</span>
                          {b.isMain && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">رئيسي</span>}
                        </td>
                        <td className="p-3 text-slate-600">{b.city}</td>
                        <td className="p-3 text-center font-mono font-bold">{stats.voucherCount}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">
                          {stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[10px] text-slate-400 block font-sans">
                            {revShare.toFixed(1)}% من الإجمالي
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-rose-600">
                          {stats.purchasesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-mono font-bold text-sky-600">
                          {stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-mono font-black text-slate-900">
                          <span className={netContribution >= 0 ? "text-emerald-700" : "text-rose-700"}>
                            {netContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BRANCH */}
      {/* ========================================================================= */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع جديد للشركة"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    إدخال بيانات الفرع والاتصال والمستودع الافتراضي والمدير المسؤول
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">اسم الفرع (بالعربية) *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: فرع مسقط - غلا التجارية"
                      value={branchFormData.name}
                      onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">كود الفرع *</label>
                    <input
                      type="text"
                      required
                      placeholder="BR-MCT-02"
                      value={branchFormData.code}
                      onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">الاسم بالإنجليزية</label>
                    <input
                      type="text"
                      placeholder="Muscat Branch - Ghala"
                      value={branchFormData.nameEn}
                      onChange={(e) => setBranchFormData({ ...branchFormData, nameEn: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">المدينة / المحافظة</label>
                    <input
                      type="text"
                      placeholder="مثال: مسقط، صحار، صلالة، لوى"
                      value={branchFormData.city}
                      onChange={(e) => setBranchFormData({ ...branchFormData, city: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">هاتف الفرع</label>
                    <input
                      type="text"
                      placeholder="+968 91234567"
                      value={branchFormData.phone}
                      onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">البريد الإلكتروني للفرع</label>
                    <input
                      type="email"
                      placeholder="branch@digititech.com"
                      value={branchFormData.email}
                      onChange={(e) => setBranchFormData({ ...branchFormData, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">اسم المدير المسؤول</label>
                    <input
                      type="text"
                      placeholder="أ. فيصل البلوشي"
                      value={branchFormData.managerName}
                      onChange={(e) => setBranchFormData({ ...branchFormData, managerName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">المستودع الافتراضي التابع للفرع</label>
                    <input
                      type="text"
                      placeholder="مستودع مسقط الإقليمي"
                      value={branchFormData.defaultWarehouse}
                      onChange={(e) => setBranchFormData({ ...branchFormData, defaultWarehouse: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">العنوان التفصيلي</label>
                  <input
                    type="text"
                    placeholder="شارع المعارض - أبراج غلا التجارية - مسقط"
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">اللون المميز للفرع</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branchFormData.color || "#4f46e5"}
                        onChange={(e) => setBranchFormData({ ...branchFormData, color: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                      />
                      <span className="font-mono text-slate-600 text-[11px]">{branchFormData.color}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">حالة الفرع</label>
                    <select
                      value={branchFormData.status}
                      onChange={(e) => setBranchFormData({ ...branchFormData, status: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                    >
                      <option value="ACTIVE">نشط ويعمل</option>
                      <option value="INACTIVE">معطل مؤقتاً</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(branchFormData.isMain)}
                        onChange={(e) => setBranchFormData({ ...branchFormData, isMain: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-800">تعيين كمقر رئيسي (HQ)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  {editingBranch ? "حفظ التعديلات" : "إضافة الفرع"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INTER-BRANCH STOCK TRANSFER */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">إجراء مناقلة وتحويل مخزني</h3>
                  <p className="text-xs text-slate-500">نقل كميات وبضائع بين مستودعات فروع الشركة</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">رقم مستند التحويل *</label>
                    <input
                      type="text"
                      required
                      value={transferFormData.transferNumber}
                      onChange={(e) => setTransferFormData({ ...transferFormData, transferNumber: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">تاريخ التحويل *</label>
                    <input
                      type="date"
                      required
                      value={transferFormData.date}
                      onChange={(e) => setTransferFormData({ ...transferFormData, date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="font-bold text-indigo-900 block">من فرع (المصدر) *</label>
                    <select
                      value={transferFormData.fromBranchId}
                      onChange={(e) => setTransferFormData({ ...transferFormData, fromBranchId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold focus:outline-none"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-emerald-900 block">إلى فرع (الوجهة) *</label>
                    <select
                      value={transferFormData.toBranchId}
                      onChange={(e) => setTransferFormData({ ...transferFormData, toBranchId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold focus:outline-none"
                    >
                      {branches
                        .filter((b) => b.id !== transferFormData.fromBranchId)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اختر الصنف المراد تحويله *</label>
                  <select
                    value={transferFormData.itemId}
                    onChange={(e) => setTransferFormData({ ...transferFormData, itemId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none"
                  >
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.sku}] {item.name} - متوفر ({item.quantity} {item.unit}) في {item.warehouse}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">الكمية المحولة *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={transferFormData.quantity}
                      onChange={(e) => setTransferFormData({ ...transferFormData, quantity: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">المسؤول عن التحويل</label>
                    <input
                      type="text"
                      value={transferFormData.transferByName}
                      onChange={(e) => setTransferFormData({ ...transferFormData, transferByName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ملاحظات التحويل والمناقلة</label>
                  <textarea
                    rows={2}
                    placeholder="سبب التحويل أو اسم المشروع / الطلبية..."
                    value={transferFormData.notes}
                    onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  تنفيذ التحويل وترحيل المخزون
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
