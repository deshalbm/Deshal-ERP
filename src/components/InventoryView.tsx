import React, { useState, useMemo } from "react";
import {
  InventoryItem,
  StockMovement,
  CompanySettings,
  StockStatus,
  MovementType,
  Branch
} from "../types";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  History,
  Boxes,
  Barcode,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  TrendingUp,
  DollarSign,
  Tag,
  Warehouse as WarehouseIcon,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Building2
} from "lucide-react";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import { ERPEmptyState } from "./common/ERPEmptyState";
import { StatusBadge } from "./common/StatusBadge";

interface InventoryViewProps {
  inventory: InventoryItem[];
  movements: StockMovement[];
  companySettings: CompanySettings;
  branches?: Branch[];
  onSaveInventory: (items: InventoryItem[]) => void;
  onSaveMovements: (movements: StockMovement[]) => void;
  onNavigateToPurchases?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  movements,
  companySettings,
  branches = [],
  onSaveInventory,
  onSaveMovements,
  onNavigateToPurchases
}) => {
  const { t, language, dir, isRTL } = useLanguage();
  const currency = companySettings.defaultCurrency || "OMR";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>("تسوية جرد دوري");
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState<boolean>(false);
  const [movementFilterItemId, setMovementFilterItemId] = useState<string>("ALL");

  // Item Form state
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    sku: "",
    barcode: "",
    name: "",
    category: "كاميرات مراقبة وأمن",
    warehouse: "المستودع الرئيسي - صحار",
    branchId: "",
    branchName: "",
    location: "",
    unit: "حبة",
    quantity: 1,
    minAlertQuantity: 5,
    costPrice: 0,
    sellingPrice: 0,
    supplierName: "",
    description: "",
    status: "IN_STOCK"
  });

  // Extract categories and warehouses
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [inventory]);

  const warehouses = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((item) => {
      if (item.warehouse) set.add(item.warehouse);
    });
    return Array.from(set);
  }, [inventory]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchTerm)) ||
        (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesBranch =
        selectedBranch === "ALL" ||
        item.branchId === selectedBranch ||
        (!item.branchId && selectedBranch === "main");

      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      const matchesWarehouse =
        selectedWarehouse === "ALL" || item.warehouse === selectedWarehouse;

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "LOW_STOCK" && item.quantity <= item.minAlertQuantity && item.quantity > 0) ||
        (selectedStatus === "OUT_OF_STOCK" && item.quantity <= 0) ||
        (selectedStatus === "IN_STOCK" && item.quantity > item.minAlertQuantity);

      return matchesSearch && matchesBranch && matchesCategory && matchesWarehouse && matchesStatus;
    });
  }, [inventory, searchTerm, selectedBranch, selectedCategory, selectedWarehouse, selectedStatus]);

  // Financial & Stats calculations
  const totalCostValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  }, [inventory]);

  const totalSellingValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((item) => item.quantity <= item.minAlertQuantity && item.quantity > 0).length;
  }, [inventory]);

  const outOfStockCount = useMemo(() => {
    return inventory.filter((item) => item.quantity <= 0).length;
  }, [inventory]);

  const totalQuantitySum = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
  }, [inventory]);

  // Open Create Item Modal
  const handleOpenCreateModal = () => {
    const nextSeq = (inventory.length + 1).toString().padStart(4, "0");
    const autoSku = `ITM-${nextSeq}`;
    setEditingItem(null);
    setFormData({
      sku: autoSku,
      barcode: `6291${Date.now().toString().slice(-8)}`,
      name: "",
      category: categories[0] || "كاميرات مراقبة وأمن",
      warehouse: warehouses[0] || "المستودع الرئيسي - صحار",
      location: "الرف A-01",
      unit: "حبة",
      quantity: 10,
      minAlertQuantity: 5,
      costPrice: 10,
      sellingPrice: 15,
      supplierName: "",
      description: "",
      status: "IN_STOCK"
    });
    setIsItemModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.sku?.trim()) {
      alert("يرجى ملء اسم الصنف ورمز الـ SKU.");
      return;
    }

    const qty = Number(formData.quantity) || 0;
    const minAlert = Number(formData.minAlertQuantity) || 0;
    const cost = Number(formData.costPrice) || 0;
    const selling = Number(formData.sellingPrice) || 0;

    let stockStatus: StockStatus = "IN_STOCK";
    if (qty <= 0) stockStatus = "OUT_OF_STOCK";
    else if (qty <= minAlert) stockStatus = "LOW_STOCK";

    const now = new Date().toISOString();

    if (editingItem) {
      // Update
      const oldQty = editingItem.quantity;
      const updatedItem: InventoryItem = {
        ...editingItem,
        ...formData,
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        quantity: qty,
        minAlertQuantity: minAlert,
        costPrice: cost,
        sellingPrice: selling,
        status: stockStatus,
        updatedAt: now
      } as InventoryItem;

      const updatedList = inventory.map((i) => (i.id === editingItem.id ? updatedItem : i));
      onSaveInventory(updatedList);

      // If quantity changed, log a manual adjustment movement
      if (qty !== oldQty) {
        const delta = Math.abs(qty - oldQty);
        const mov: StockMovement = {
          id: `mov-${Date.now()}`,
          itemId: editingItem.id,
          itemSku: updatedItem.sku,
          itemName: updatedItem.name,
          type: qty > oldQty ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
          quantity: delta,
          previousQuantity: oldQty,
          newQuantity: qty,
          referenceNo: "تعديل مباشر لبيانات الصنف",
          warehouse: updatedItem.warehouse,
          date: now,
          notes: "تعديل يدوي للكمية من شاشة تعديل الصنف",
          createdByName: "إدارة المخازن"
        };
        onSaveMovements([mov, ...movements]);
      }
    } else {
      // Create new
      const newItemId = `item-${Date.now()}`;
      const newItem: InventoryItem = {
        id: newItemId,
        sku: formData.sku.trim(),
        barcode: formData.barcode || "",
        name: formData.name.trim(),
        category: formData.category || "عام",
        warehouse: formData.warehouse || "المستودع الرئيسي",
        branchId: formData.branchId || undefined,
        branchName: formData.branchName || undefined,
        location: formData.location || "",
        unit: formData.unit || "حبة",
        quantity: qty,
        minAlertQuantity: minAlert,
        costPrice: cost,
        sellingPrice: selling,
        supplierName: formData.supplierName || "",
        description: formData.description || "",
        status: stockStatus,
        createdAt: now,
        updatedAt: now
      };

      const updatedList = [newItem, ...inventory];
      onSaveInventory(updatedList);

      if (qty > 0) {
        const mov: StockMovement = {
          id: `mov-${Date.now()}`,
          itemId: newItemId,
          itemSku: newItem.sku,
          itemName: newItem.name,
          type: "ADJUSTMENT_IN",
          quantity: qty,
          previousQuantity: 0,
          newQuantity: qty,
          referenceNo: "رصيد افتتاحي للصنف",
          warehouse: newItem.warehouse,
          date: now,
          notes: "إضافة صنف جديد للمخزون برصيد افتتاحي",
          createdByName: "إدارة المخازن"
        };
        onSaveMovements([mov, ...movements]);
      }
    }

    setIsItemModalOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الصنف "${name}" من المخزون؟`)) {
      const updatedList = inventory.filter((i) => i.id !== id);
      onSaveInventory(updatedList);
    }
  };

  // Open Quick Stock Adjustment Modal
  const handleOpenAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustType("IN");
    setAdjustQty(1);
    setAdjustReason("تسوية جرد دوري / إضافة بضاعة");
    setIsAdjustModalOpen(true);
  };

  // Save Stock Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const qtyChange = Number(adjustQty) || 0;
    if (qtyChange <= 0) {
      alert("يرجى إدخال كمية صحيحة أكبر من الصفر.");
      return;
    }

    const prevQty = adjustingItem.quantity;
    let newQty = adjustType === "IN" ? prevQty + qtyChange : prevQty - qtyChange;
    if (newQty < 0) newQty = 0;

    let stockStatus: StockStatus = "IN_STOCK";
    if (newQty <= 0) stockStatus = "OUT_OF_STOCK";
    else if (newQty <= adjustingItem.minAlertQuantity) stockStatus = "LOW_STOCK";

    const now = new Date().toISOString();

    const updatedItem: InventoryItem = {
      ...adjustingItem,
      quantity: newQty,
      status: stockStatus,
      updatedAt: now
    };

    const updatedList = inventory.map((i) => (i.id === adjustingItem.id ? updatedItem : i));
    onSaveInventory(updatedList);

    const movType: MovementType = adjustType === "IN" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
    const mov: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: adjustingItem.id,
      itemSku: adjustingItem.sku,
      itemName: adjustingItem.name,
      type: movType,
      quantity: qtyChange,
      previousQuantity: prevQty,
      newQuantity: newQty,
      referenceNo: `ADJ-${Date.now().toString().slice(-4)}`,
      warehouse: adjustingItem.warehouse,
      date: now,
      notes: adjustReason,
      createdByName: "أمين المستودع"
    };

    onSaveMovements([mov, ...movements]);
    setIsAdjustModalOpen(false);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "SKU",
      "اسم الصنف",
      "الباركود",
      "الفئة",
      "المستودع",
      "الرف / الموقع",
      "الوحدة",
      "الكمية المتوفرة",
      "حد التنبيه",
      "سعر التكلفة",
      "سعر البيع",
      "إجمالي قيمة التكلفة",
      "إجمالي قيمة البيع",
      "المورد",
      "الحالة"
    ];

    const rows = inventory.map((i) => [
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.barcode || ""}"`,
      `"${i.category}"`,
      `"${i.warehouse}"`,
      `"${i.location || ""}"`,
      `"${i.unit}"`,
      i.quantity,
      i.minAlertQuantity,
      i.costPrice.toFixed(3),
      i.sellingPrice.toFixed(3),
      (i.quantity * i.costPrice).toFixed(3),
      (i.quantity * i.sellingPrice).toFixed(3),
      `"${i.supplierName || ""}"`,
      i.quantity <= 0 ? "نفد" : i.quantity <= i.minAlertQuantity ? "منخفض" : "متوفر"
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_المخزون_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Stock Report
  const handlePrint = () => {
    window.print();
  };

  const getMovementTypeBadge = (type: MovementType) => {
    switch (type) {
      case "PURCHASE_IN":
        return { label: "وارد مشتريات (+)", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "SALE_OUT":
        return { label: "منصرف مبيعات (-)", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "ADJUSTMENT_IN":
        return { label: "تسوية إضافة (+)", bg: "bg-teal-100 text-teal-800 border-teal-200" };
      case "ADJUSTMENT_OUT":
        return { label: "تسوية خصم (-)", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "RETURN_IN":
        return { label: "مرتجع من عميل (+)", bg: "bg-purple-100 text-purple-800 border-purple-200" };
      case "DAMAGE_OUT":
        return { label: "تالف / هالك (-)", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      default:
        return { label: "حركة مخزنية", bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir={dir}>
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                إدارة المخازن والمخزون
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                متابعة الأصناف، مستويات الأرصدة، مستودعات التخزين، وحركات الجرد الفورية
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsMovementsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>سجل الحركات ({movements.length})</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة الجرد</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & Low Stock Alert Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">إجمالي الأصناف المسجلة</span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900 font-mono">{inventory.length}</p>
              <span className="text-xs text-slate-500 font-medium">({totalQuantitySum} قطعة)</span>
            </div>
            <p className="text-[11px] text-indigo-600 font-medium">{warehouses.length} مستودعات نشطة</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Cost Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">إجمالي قيمة المخزون (بالتكلفة)</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-sans font-bold text-slate-500 mr-1.5">{currency}</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">رأس مال البضاعة المتوفرة</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Estimated Selling Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">القيمة المقدرة للبيع</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {totalSellingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-sans font-bold text-slate-500 mr-1.5">{currency}</span>
            </p>
            <p className="text-[11px] text-indigo-600 font-medium">
              ربح متوقع: {(totalSellingValue - totalCostValue).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Low Stock Alert */}
        <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between transition-all ${
          lowStockCount > 0 || outOfStockCount > 0
            ? "bg-amber-50/70 border-amber-200 text-amber-900"
            : "bg-white border-slate-200 text-slate-900"
        }`}>
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              تنبيهات نقص المخزون
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-amber-950 font-mono">{lowStockCount + outOfStockCount}</p>
              <span className="text-xs text-amber-700 font-medium">
                ({lowStockCount} منخفض / {outOfStockCount} نفد)
              </span>
            </div>
            {onNavigateToPurchases && (
              <button
                onClick={onNavigateToPurchases}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                + إنشاء أمر شراء للموردين ←
              </button>
            )}
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم، رمز SKU، الباركود، أو المورد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Branch Filter */}
          {branches.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs bg-transparent text-slate-700 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="ALL">جميع الفروع ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 font-medium"
          >
            <option value="ALL">جميع الفئات ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 font-medium"
          >
            <option value="ALL">جميع المستودعات ({warehouses.length})</option>
            {warehouses.map((wh) => (
              <option key={wh} value={wh}>{wh}</option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 font-medium"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="IN_STOCK">متوفر بالمخزن</option>
            <option value="LOW_STOCK">منخفض (تحت حد التنبيه ⚠️)</option>
            <option value="OUT_OF_STOCK">نفد من المخزن (0) ❌</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
              }`}
              title="عرض كجدول"
            >
              جدول
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
              }`}
              title="عرض كبطاقات"
            >
              بطاقات
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Inventory Catalog (Table or Grid) */}
      {filteredItems.length === 0 ? (
        <ERPEmptyState
          icon={Boxes}
          titleAr="لا توجد أصناف مطابقة للبحث أو التصفية"
          titleEn="No inventory items found"
          descriptionAr={
            searchTerm || selectedCategory !== "ALL" || selectedWarehouse !== "ALL"
              ? "لم تظهر نتائج تطابق معايير البحث أو التصفية المحددة. يرجى تعديل خيارات التصفية أو البحث."
              : "لم يتم تعريف أي أصناف مخزنية بعد. ابدأ بإضافة المنتجات والأصناف وتحديد أسعار التكلفة والبيع وحدود التنبيه."
          }
          descriptionEn="No matching inventory items found. Add products to track stock, pricing, and reorder levels."
          actionLabelAr="+ إضافة صنف جديد"
          actionLabelEn="+ Add New Item"
          onAction={handleOpenCreateModal}
        />
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                  <th className="py-3.5 px-4">رمز الصنف (SKU) / الباركود</th>
                  <th className="py-3.5 px-4">اسم الصنف والوصف</th>
                  <th className="py-3.5 px-4">الفئة والمستودع</th>
                  <th className="py-3.5 px-4 text-center">الكمية المتوفرة</th>
                  <th className="py-3.5 px-4">سعر التكلفة</th>
                  <th className="py-3.5 px-4">سعر البيع</th>
                  <th className="py-3.5 px-4">إجمالي القيمة</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minAlertQuantity && item.quantity > 0;
                  const isOut = item.quantity <= 0;
                  const totalCost = item.quantity * item.costPrice;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* SKU & Barcode */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{item.sku}</div>
                        {item.barcode && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                            <Barcode className="w-3 h-3" />
                            <span>{item.barcode}</span>
                          </div>
                        )}
                      </td>

                      {/* Name & Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                            {item.description}
                          </div>
                        )}
                        {item.supplierName && (
                          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                            المورد: {item.supplierName}
                          </div>
                        )}
                      </td>

                      {/* Category & Warehouse */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          <span className="inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          {item.branchName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md">
                              <Building2 className="w-2.5 h-2.5" />
                              {item.branchName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <WarehouseIcon className="w-3 h-3 text-slate-400" />
                          <span>{item.warehouse}</span>
                          {item.location && <span className="text-slate-400">({item.location})</span>}
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-mono text-sm font-black ${
                            isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-700"
                          }`}>
                            {item.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{item.unit}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          تنبيه: {item.minAlertQuantity} {item.unit}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {item.costPrice.toLocaleString(undefined, { minimumFractionDigits: 3 })} {currency}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {item.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 3 })} {currency}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            نفد من المخزن
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            كمية منخفضة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            متوفر
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                            title="تسوية / تعديل المخزون"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>تسوية</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="تعديل بيانات الصنف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isLow = item.quantity <= item.minAlertQuantity && item.quantity > 0;
            const isOut = item.quantity <= 0;

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      {item.sku}
                    </span>
                    {isOut ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        نفد
                      </span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        منخفض
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        متوفر
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {item.description || "بدون وصف إضافي"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الكمية بالمخزن:</span>
                      <span className="font-mono font-black text-slate-900">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">سعر البيع:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {item.sellingPrice.toFixed(3)} {currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">سعر التكلفة:</span>
                      <span className="font-mono text-slate-600">
                        {item.costPrice.toFixed(3)} {currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] border-t border-slate-200 pt-1 mt-1">
                      <span className="text-slate-400">المستودع:</span>
                      <span className="text-slate-600 truncate max-w-[120px]">{item.warehouse}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenAdjustModal(item)}
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    تسوية
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: ADD / EDIT INVENTORY ITEM */}
      {/* ======================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? "تعديل بيانات الصنف" : "إضافة صنف جديد للمخزون"}
                </h3>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* SKU */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    رمز الصنف (SKU) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:bg-white focus:outline-indigo-500"
                    placeholder="مثال: CAM-4K-DOME"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الباركود (Barcode)</label>
                  <input
                    type="text"
                    value={formData.barcode || ""}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-indigo-500"
                    placeholder="رقم الباركود الدولي أو المطبوع"
                  />
                </div>

                {/* Item Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم الصنف / المنتج <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-indigo-500"
                    placeholder="مثال: كاميرا مراقبة شبكية 4K بدقة 8 ميجابكسل"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفئة / التصنيف</label>
                  <input
                    type="text"
                    list="cat-suggestions"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                    placeholder="كاميرات، شبكات، شاشات، كابلات..."
                  />
                  <datalist id="cat-suggestions">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستودع الافتراضي</label>
                  <input
                    type="text"
                    list="wh-suggestions"
                    value={formData.warehouse || ""}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                    placeholder="المستودع الرئيسي - صحار"
                  />
                  <datalist id="wh-suggestions">
                    {warehouses.map((w) => (
                      <option key={w} value={w} />
                    ))}
                  </datalist>
                </div>

                {/* Assigned Branch */}
                {branches.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الفرع المخصص</label>
                    <select
                      value={formData.branchId || ""}
                      onChange={(e) => {
                        const bId = e.target.value;
                        const bObj = branches.find((b) => b.id === bId);
                        setFormData({
                          ...formData,
                          branchId: bId,
                          branchName: bObj ? bObj.name : ""
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                    >
                      <option value="">-- عام لجميع الفروع --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Location / Shelf */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الموقع / الرف داخل المستودع</label>
                  <input
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                    placeholder="مثال: الرف A-03 / الممر 2"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وحدة القياس</label>
                  <select
                    value={formData.unit || "حبة"}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                  >
                    <option value="حبة">حبة (Piece)</option>
                    <option value="شاشة">شاشة (Screen)</option>
                    <option value="جهاز">جهاز (Device)</option>
                    <option value="لفة">لفة (Roll / 305m)</option>
                    <option value="متر">متر (Meter)</option>
                    <option value="طقم">طقم (Set)</option>
                    <option value="كرتون">كرتون (Box / Carton)</option>
                  </select>
                </div>

                {/* Initial Stock Quantity */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية المتوفرة بالمخزن</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.quantity ?? 0}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:bg-white focus:outline-indigo-500"
                  />
                </div>

                {/* Min Alert Threshold */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حد تنبيه نقص المخزون (Min Alert)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.minAlertQuantity ?? 5}
                    onChange={(e) => setFormData({ ...formData, minAlertQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-indigo-500"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    سعر الشراء / التكلفة ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData.costPrice ?? 0}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-indigo-500"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    سعر البيع المقترح ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData.sellingPrice ?? 0}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-800 font-bold focus:bg-white focus:outline-indigo-500"
                  />
                </div>

                {/* Supplier */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم المورد الافتراضي</label>
                  <input
                    type="text"
                    value={formData.supplierName || ""}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                    placeholder="مثال: الشركة الخليجية للأنظمة الأمنية"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">المواصفات والوصف الفني</label>
                  <textarea
                    rows={2}
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                    placeholder="مواصفات إضافية، الموديل، التوافق، فترة الضمان..."
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer"
                >
                  {editingItem ? "حفظ التعديلات" : "إضافة الصنف للمخزن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: QUICK STOCK ADJUSTMENT */}
      {/* ======================================================= */}
      {isAdjustModalOpen && adjustingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">تسوية كمية المخزون</h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-600">{adjustingItem.sku}</span>
                <p className="font-bold text-slate-900 text-sm">{adjustingItem.name}</p>
                <p className="text-slate-500 font-medium">
                  الرصيد الحالي بالمخزن:{" "}
                  <strong className="text-slate-900 font-mono text-sm">{adjustingItem.quantity}</strong> {adjustingItem.unit}
                </p>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">نوع العملية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("IN")}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      adjustType === "IN"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>+ إضافة / توريد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("OUT")}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      adjustType === "OUT"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>- صرف / تسوية خصم</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الكمية المراد {adjustType === "IN" ? "إضافتها (+)" : "خصمها (-)"} ({adjustingItem.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-base font-bold focus:bg-white focus:outline-indigo-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التسوية / الملاحظات</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-500"
                  placeholder="جرد سنوي، توريد إضافي، صرف لمشروع داخلي..."
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between">
                <span>الرصيد بعد العملية:</span>
                <span className="font-mono font-bold text-sm">
                  {adjustType === "IN"
                    ? adjustingItem.quantity + adjustQty
                    : Math.max(0, adjustingItem.quantity - adjustQty)}{" "}
                  {adjustingItem.unit}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer"
                >
                  تأكيد وحفظ التسوية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 3: STOCK MOVEMENTS TIMELINE LOG */}
      {/* ======================================================= */}
      {isMovementsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">سجل حركات وتدفقات المخزون</h3>
              </div>
              <button
                onClick={() => setIsMovementsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Movement Filter */}
              <div className="flex items-center justify-between gap-4">
                <select
                  value={movementFilterItemId}
                  onChange={(e) => setMovementFilterItemId(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 font-medium"
                >
                  <option value="ALL">جميع الأصناف ({movements.length} حركة مسجلة)</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {movements
                  .filter((m) => movementFilterItemId === "ALL" || m.itemId === movementFilterItemId)
                  .map((mov) => {
                    const badge = getMovementTypeBadge(mov.type);
                    const isIn = mov.type.includes("IN");

                    return (
                      <div key={mov.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="font-mono font-bold text-slate-900">{mov.itemSku}</span>
                            <span className="font-bold text-slate-700 truncate max-w-xs">{mov.itemName}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {mov.notes || "حركة مخزنية موثقة"} {mov.referenceNo ? `(مرجع: ${mov.referenceNo})` : ""}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>{formatDateToDDMMMMYYYY(mov.date)}</span>
                            <span>•</span>
                            <span>بواسطة: {mov.createdByName || "أمين المستودع"}</span>
                            <span>•</span>
                            <span>المستودع: {mov.warehouse}</span>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span className={`font-mono text-sm font-black ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                            {isIn ? "+" : "-"}{mov.quantity}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            من {mov.previousQuantity} إلى {mov.newQuantity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMovementsModalOpen(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
