import React, { useState, useMemo } from "react";
import {
  PurchaseInvoice,
  PurchaseItem,
  Supplier,
  InventoryItem,
  StockMovement,
  CompanySettings,
  PaymentMethod,
  PurchaseStatus,
  PurchasePaymentStatus,
  ReceiptVoucher,
  Branch
} from "../types";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  FileText,
  Truck,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Package,
  ArrowRight,
  Send,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  CreditCard,
  Building,
  UserPlus
} from "lucide-react";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { numberToWords } from "../utils/numberToWords";
import { useLanguage } from "../utils/LanguageContext";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";

interface PurchasesViewProps {
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  companySettings?: CompanySettings;
  branches?: Branch[];
  onSavePurchases: (purchases: PurchaseInvoice[]) => void;
  onSaveSuppliers: (suppliers: Supplier[]) => void;
  onSaveInventory: (inventory: InventoryItem[]) => void;
  onSaveMovements: (movements: StockMovement[]) => void;
  onCreatePaymentVoucher?: (purchase: PurchaseInvoice) => void;
  onNavigateToInventory?: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  suppliers,
  inventory,
  movements,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  branches = [],
  onSavePurchases,
  onSaveSuppliers,
  onSaveInventory,
  onSaveMovements,
  onCreatePaymentVoucher,
  onNavigateToInventory
}) => {
  const { t, language, dir, isRTL } = useLanguage();
  const currency = companySettings?.defaultCurrency || "OMR";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>("" );
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>("ALL");

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseInvoice | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPurchase, setPreviewPurchase] = useState<PurchaseInvoice | null>(null);
  const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState<boolean>(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);

  // Supplier Form state
  const [newSupplierData, setNewSupplierData] = useState<Partial<Supplier>>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "صحار",
    taxId: "",
    crNumber: "",
    category: "توريدات تقنية وكاميرات"
  });

  // Purchase Form state
  const [purchaseForm, setPurchaseForm] = useState<{
    purchaseNumber: string;
    supplierInvoiceNo: string;
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
    supplierEmail: string;
    supplierTaxId: string;
    supplierAddress: string;
    date: string;
    dueDate: string;
    warehouse: string;
    branchId?: string;
    branchName?: string;
    items: PurchaseItem[];
    taxRate: number;
    discountAmount: number;
    shippingFee: number;
    paymentStatus: PurchasePaymentStatus;
    paymentMethod: PaymentMethod;
    status: PurchaseStatus;
    notes: string;
    autoUpdateStock: boolean;
  }>({
    purchaseNumber: "",
    supplierInvoiceNo: "",
    supplierId: "",
    supplierName: "",
    supplierPhone: "",
    supplierEmail: "",
    supplierTaxId: "",
    supplierAddress: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    warehouse: "المستودع الرئيسي - صحار",
    branchId: "",
    branchName: "",
    items: [],
    taxRate: 5,
    discountAmount: 0,
    shippingFee: 0,
    paymentStatus: "UNPAID",
    paymentMethod: "BANK_TRANSFER",
    status: "RECEIVED",
    notes: "فاتورة مشتريات وتوريد بضاعة للمستودع",
    autoUpdateStock: true
  });

  // Calculations for active form
  const formSubtotal = useMemo(() => {
    return purchaseForm.items.reduce((sum, it) => sum + (it.amount || 0), 0);
  }, [purchaseForm.items]);

  const formTaxAmount = useMemo(() => {
    return (formSubtotal * (purchaseForm.taxRate || 0)) / 100;
  }, [formSubtotal, purchaseForm.taxRate]);

  const formTotalAmount = useMemo(() => {
    return formSubtotal + formTaxAmount + (purchaseForm.shippingFee || 0) - (purchaseForm.discountAmount || 0);
  }, [formSubtotal, formTaxAmount, purchaseForm.shippingFee, purchaseForm.discountAmount]);

  // Overall Financial KPIs
  const totalPurchasesAmount = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  const totalPaidAmount = useMemo(() => {
    return purchases
      .filter((p) => p.paymentStatus === "PAID")
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  const totalUnpaidAmount = useMemo(() => {
    return purchases
      .filter((p) => p.paymentStatus === "UNPAID" || p.paymentStatus === "PARTIAL")
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplierInvoiceNo && p.supplierInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSupplier =
        selectedSupplierFilter === "ALL" || p.supplierName === selectedSupplierFilter;

      const matchesBranch =
        selectedBranchFilter === "ALL" ||
        p.branchId === selectedBranchFilter ||
        (!p.branchId && selectedBranchFilter === "main");

      const matchesStatus =
        selectedStatusFilter === "ALL" || p.status === selectedStatusFilter;

      const matchesPayment =
        selectedPaymentFilter === "ALL" || p.paymentStatus === selectedPaymentFilter;

      return matchesSearch && matchesSupplier && matchesBranch && matchesStatus && matchesPayment;
    });
  }, [purchases, searchTerm, selectedSupplierFilter, selectedBranchFilter, selectedStatusFilter, selectedPaymentFilter]);

  // Handle Open Create Purchase
  const handleOpenCreateModal = () => {
    const year = new Date().getFullYear();
    const nextSeq = (purchases.length + 101).toString().padStart(4, "0");
    const autoPO = `PO-${year}-${nextSeq}`;

    setEditingPurchase(null);
    setPurchaseForm({
      purchaseNumber: autoPO,
      supplierInvoiceNo: `INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: suppliers[0]?.id || "",
      supplierName: suppliers[0]?.name || "الشركة الخليجية للأنظمة الأمنية",
      supplierPhone: suppliers[0]?.phone || "+968 91122334",
      supplierEmail: suppliers[0]?.email || "",
      supplierTaxId: suppliers[0]?.taxId || "",
      supplierAddress: suppliers[0]?.address || "مسقط",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      warehouse: "المستودع الرئيسي - صحار",
      items: [
        {
          id: `pi-${Date.now()}`,
          name: inventory[0]?.name || "كاميرا مراقبة شبكية 4K",
          itemId: inventory[0]?.id || "",
          sku: inventory[0]?.sku || "CAM-IP4K",
          quantity: 10,
          unitCost: inventory[0]?.costPrice || 25,
          amount: (inventory[0]?.costPrice || 25) * 10,
          unit: inventory[0]?.unit || "حبة"
        }
      ],
      taxRate: 5,
      discountAmount: 0,
      shippingFee: 0,
      paymentStatus: "PAID",
      paymentMethod: "BANK_TRANSFER",
      status: "RECEIVED",
      notes: "توريد بضاعة معتمدة للمشاريع والمخازن",
      autoUpdateStock: true
    });

    setIsPurchaseModalOpen(true);
  };

  // Handle Open Edit Purchase
  const handleOpenEditModal = (p: PurchaseInvoice) => {
    setEditingPurchase(p);
    setPurchaseForm({
      purchaseNumber: p.purchaseNumber,
      supplierInvoiceNo: p.supplierInvoiceNo || "",
      supplierId: p.supplierId || "",
      supplierName: p.supplierName,
      supplierPhone: p.supplierPhone || "",
      supplierEmail: p.supplierEmail || "",
      supplierTaxId: p.supplierTaxId || "",
      supplierAddress: p.supplierAddress || "",
      date: p.date,
      dueDate: p.dueDate || "",
      warehouse: p.warehouse,
      branchId: p.branchId || "",
      branchName: p.branchName || "",
      items: p.items || [],
      taxRate: p.taxRate,
      discountAmount: p.discountAmount,
      shippingFee: p.shippingFee,
      paymentStatus: p.paymentStatus,
      paymentMethod: p.paymentMethod,
      status: p.status,
      notes: p.notes || "",
      autoUpdateStock: p.autoUpdateStock
    });
    setIsPurchaseModalOpen(true);
  };

  // Handle Supplier Selection
  const handleSelectSupplier = (supId: string) => {
    const sup = suppliers.find((s) => s.id === supId);
    if (sup) {
      setPurchaseForm((prev) => ({
        ...prev,
        supplierId: sup.id,
        supplierName: sup.name,
        supplierPhone: sup.phone || "",
        supplierEmail: sup.email || "",
        supplierTaxId: sup.taxId || "",
        supplierAddress: sup.address || ""
      }));
    }
  };

  // Add Item Line
  const handleAddItemLine = () => {
    const newItem: PurchaseItem = {
      id: `pi-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      name: "",
      quantity: 1,
      unitCost: 0,
      amount: 0,
      unit: "حبة"
    };
    setPurchaseForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remove Item Line
  const handleRemoveItemLine = (id: string) => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id)
    }));
  };

  // Update Item Line
  const handleUpdateItemLine = (id: string, updates: Partial<PurchaseItem>) => {
    setPurchaseForm((prev) => {
      const updated = prev.items.map((it) => {
        if (it.id === id) {
          const merged = { ...it, ...updates };
          const qty = Number(merged.quantity) || 0;
          const cost = Number(merged.unitCost) || 0;
          merged.amount = qty * cost;
          return merged;
        }
        return it;
      });
      return { ...prev, items: updated };
    });
  };

  // Select Item from Catalog
  const handleSelectCatalogItem = (lineId: string, inventoryItemId: string) => {
    const invItem = inventory.find((i) => i.id === inventoryItemId);
    if (!invItem) return;

    handleUpdateItemLine(lineId, {
      itemId: invItem.id,
      sku: invItem.sku,
      name: invItem.name,
      unitCost: invItem.costPrice,
      unit: invItem.unit
    });
  };

  // Save Purchase Invoice
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseForm.supplierName.trim()) {
      alert("يرجى إدخال اسم المورد.");
      return;
    }

    if (purchaseForm.items.length === 0) {
      alert("يرجى إضافة صنف واحد على الأقل في الفاتورة.");
      return;
    }

    const now = new Date().toISOString();

    const invoiceData: PurchaseInvoice = {
      id: editingPurchase?.id || `po-${Date.now()}`,
      purchaseNumber: purchaseForm.purchaseNumber,
      supplierInvoiceNo: purchaseForm.supplierInvoiceNo,
      supplierId: purchaseForm.supplierId,
      supplierName: purchaseForm.supplierName.trim(),
      supplierPhone: purchaseForm.supplierPhone,
      supplierEmail: purchaseForm.supplierEmail,
      supplierTaxId: purchaseForm.supplierTaxId,
      supplierAddress: purchaseForm.supplierAddress,
      date: purchaseForm.date,
      dueDate: purchaseForm.dueDate,
      warehouse: purchaseForm.warehouse,
      branchId: purchaseForm.branchId || undefined,
      branchName: purchaseForm.branchName || undefined,
      items: purchaseForm.items,
      subtotal: formSubtotal,
      taxRate: purchaseForm.taxRate,
      taxAmount: formTaxAmount,
      discountAmount: purchaseForm.discountAmount,
      shippingFee: purchaseForm.shippingFee,
      totalAmount: formTotalAmount,
      currency: currency,
      paymentStatus: purchaseForm.paymentStatus,
      paymentMethod: purchaseForm.paymentMethod,
      status: purchaseForm.status,
      notes: purchaseForm.notes,
      autoUpdateStock: purchaseForm.autoUpdateStock,
      createdAt: editingPurchase?.createdAt || now,
      updatedAt: now
    };

    let updatedPurchasesList: PurchaseInvoice[];
    if (editingPurchase) {
      updatedPurchasesList = purchases.map((p) => (p.id === editingPurchase.id ? invoiceData : p));
    } else {
      updatedPurchasesList = [invoiceData, ...purchases];
    }
    onSavePurchases(updatedPurchasesList);

    // If autoUpdateStock and status is RECEIVED, update inventory & log movements
    if (purchaseForm.autoUpdateStock && purchaseForm.status === "RECEIVED") {
      let updatedInventory = [...inventory];
      let newMovements = [...movements];

      purchaseForm.items.forEach((pItem) => {
        if (pItem.itemId) {
          const invIndex = updatedInventory.findIndex((i) => i.id === pItem.itemId);
          if (invIndex !== -1) {
            const currentItem = updatedInventory[invIndex];
            const prevQty = currentItem.quantity;
            const newQty = prevQty + (pItem.quantity || 0);

            updatedInventory[invIndex] = {
              ...currentItem,
              quantity: newQty,
              costPrice: pItem.unitCost || currentItem.costPrice,
              status: newQty <= 0 ? "OUT_OF_STOCK" : newQty <= currentItem.minAlertQuantity ? "LOW_STOCK" : "IN_STOCK",
              updatedAt: now
            };

            newMovements.unshift({
              id: `mov-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
              itemId: currentItem.id,
              itemSku: currentItem.sku,
              itemName: currentItem.name,
              type: "PURCHASE_IN",
              quantity: pItem.quantity,
              previousQuantity: prevQty,
              newQuantity: newQty,
              referenceNo: purchaseForm.purchaseNumber,
              warehouse: purchaseForm.warehouse,
              date: purchaseForm.date,
              notes: `وارد من فاتورة المشتريات ${purchaseForm.purchaseNumber} (المورد: ${purchaseForm.supplierName})`,
              createdByName: "نظام المشتريات"
            });
          }
        }
      });

      onSaveInventory(updatedInventory);
      onSaveMovements(newMovements);
    }

    setIsPurchaseModalOpen(false);
  };

  // Delete Purchase
  const handleDeletePurchase = (id: string, poNum: string) => {
    if (window.confirm(`هل أنت متأكد من حذف فاتورة المشتريات "${poNum}"؟`)) {
      const updated = purchases.filter((p) => p.id !== id);
      onSavePurchases(updated);
    }
  };

  // Quick Add Supplier
  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierData.name?.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplierData.name.trim(),
      contactPerson: newSupplierData.contactPerson || "",
      phone: newSupplierData.phone || "",
      email: newSupplierData.email || "",
      address: newSupplierData.address || "",
      city: newSupplierData.city || "صحار",
      taxId: newSupplierData.taxId || "",
      crNumber: newSupplierData.crNumber || "",
      category: newSupplierData.category || "عام",
      notes: newSupplierData.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedSuppliers = [newSup, ...suppliers];
    onSaveSuppliers(updatedSuppliers);

    // Auto-select for current purchase form
    setPurchaseForm((prev) => ({
      ...prev,
      supplierId: newSup.id,
      supplierName: newSup.name,
      supplierPhone: newSup.phone,
      supplierEmail: newSup.email,
      supplierTaxId: newSup.taxId,
      supplierAddress: newSup.address
    }));

    setIsNewSupplierModalOpen(false);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "رقم أمر الشراء",
      "فاتورة المورد",
      "اسم المورد",
      "الهاتف",
      "التاريخ",
      "تاريخ الاستحقاق",
      "المستودع",
      "المبلغ الفرعي",
      "الضريبة",
      "الخصم",
      "الشحن",
      "الإجمالي",
      "حالة الدفع",
      "حالة التوريد"
    ];

    const rows = purchases.map((p) => [
      `"${p.purchaseNumber}"`,
      `"${p.supplierInvoiceNo || ""}"`,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      `"${p.supplierPhone || ""}"`,
      p.date,
      p.dueDate || "",
      `"${p.warehouse}"`,
      p.subtotal.toFixed(3),
      p.taxAmount.toFixed(3),
      p.discountAmount.toFixed(3),
      p.shippingFee.toFixed(3),
      p.totalAmount.toFixed(3),
      p.paymentStatus === "PAID" ? "مسدد بالكامل" : p.paymentStatus === "PARTIAL" ? "مسدد جزئياً" : "غير مسدد",
      p.status === "RECEIVED" ? "تم الاستلام" : p.status === "ORDERED" ? "قيد الشحن والتوريد" : "مسودة"
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_المشتريات_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir={dir}>
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                إدارة المشتريات والموردين
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                تسجيل فواتير الشراء، تتبع طلبيات التوريد، ومستحقات الموردين وتحديث المخزون
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSuppliersModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>دليل الموردين ({suppliers.length})</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ تسجيل فاتورة مشتريات</span>
          </button>
        </div>
      </div>

      {/* 2. Key Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Purchases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">إجمالي المشتريات والتوريدات</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {totalPurchasesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-sans font-bold text-slate-500 mr-1.5">{currency}</span>
            </p>
            <p className="text-[11px] text-indigo-600 font-medium">{purchases.length} فواتير مسجلة</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Paid Purchases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">المسدد للموردين</span>
            <p className="text-2xl font-black text-emerald-700 font-mono">
              {totalPaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-sans font-bold text-emerald-600 mr-1.5">{currency}</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">مدفوع عبر التحويلات والنقد</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Unpaid / Pending Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">مستحقات الموردين المتبقية</span>
            <p className="text-2xl font-black text-amber-700 font-mono">
              {totalUnpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-sans font-bold text-amber-600 mr-1.5">{currency}</span>
            </p>
            <p className="text-[11px] text-amber-600 font-medium">فواتير قيد السداد والآجل</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Suppliers Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">الموردون المعتمدون</span>
            <p className="text-2xl font-black text-slate-900 font-mono">{suppliers.length}</p>
            <button
              onClick={() => setIsSuppliersModalOpen(true)}
              className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              عرض وتعديل الموردين ←
            </button>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم أمر الشراء، المورد، أو فاتورة المورد..."
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
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
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

          {/* Supplier Filter */}
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 font-medium"
          >
            <option value="ALL">جميع الموردين</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          {/* Delivery Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 font-medium"
          >
            <option value="ALL">جميع حالات التوريد</option>
            <option value="RECEIVED">تم الاستلام بالمستودع</option>
            <option value="ORDERED">قيد الشحن والتوريد</option>
            <option value="DRAFT">مسودة أمر شراء</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={selectedPaymentFilter}
            onChange={(e) => setSelectedPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 font-medium"
          >
            <option value="ALL">جميع حالات الدفع</option>
            <option value="PAID">مسدد بالكامل</option>
            <option value="PARTIAL">مسدد جزئياً</option>
            <option value="UNPAID">غير مسدد (مستحق)</option>
          </select>
        </div>
      </div>

      {/* 4. Purchases List Table */}
      {filteredPurchases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">لا توجد فواتير مشتريات مطابقة</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            يمكنك تسجيل فواتير وأوامر الشراء لتتبع الوارد من الموردين وتحديث رصيد المخزن مباشرة.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 cursor-pointer"
          >
            + تسجيل فاتورة مشتريات الآن
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                  <th className="py-3.5 px-4">رقم أمر الشراء / الفاتورة</th>
                  <th className="py-3.5 px-4">المورد وبيانات الاتصال</th>
                  <th className="py-3.5 px-4">التاريخ والاستحقاق</th>
                  <th className="py-3.5 px-4">المستودع المستلم</th>
                  <th className="py-3.5 px-4 text-center">الأصناف</th>
                  <th className="py-3.5 px-4">المبلغ الإجمالي</th>
                  <th className="py-3.5 px-4">حالة التوريد</th>
                  <th className="py-3.5 px-4">حالة الدفع</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredPurchases.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* PO Number & Supplier Invoice Ref */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-900">{p.purchaseNumber}</div>
                        {p.supplierInvoiceNo && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            فاتورة المورد: {p.supplierInvoiceNo}
                          </div>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{p.supplierName}</div>
                        {p.supplierPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">{p.supplierPhone}</div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{formatDateToDDMMMMYYYY(p.date)}</div>
                        {p.dueDate && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            استحقاق: {formatDateToDDMMMMYYYY(p.dueDate)}
                          </div>
                        )}
                      </td>

                      {/* Warehouse */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {p.warehouse}
                          </span>
                          {p.branchName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md w-fit">
                              <Building2 className="w-2.5 h-2.5" />
                              {p.branchName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {p.items?.length || 0}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {p.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 3 })} {currency}
                        </div>
                        {p.taxAmount > 0 && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            يشمل ضريبة {p.taxAmount.toFixed(3)} {currency}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.status === "RECEIVED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            تم الاستلام بالمخزن
                          </span>
                        ) : p.status === "ORDERED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            <Truck className="w-3 h-3 text-blue-600" />
                            قيد التوريد والشحن
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            مسودة أمر شراء
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        {p.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            مسدد بالكامل
                          </span>
                        ) : p.paymentStatus === "PARTIAL" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            مسدد جزئياً
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            غير مسدد
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setPreviewPurchase(p);
                              setIsPreviewModalOpen(true);
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                            title="معاينة وطباعة الفاتورة"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {onCreatePaymentVoucher && p.paymentStatus !== "PAID" && (
                            <button
                              onClick={() => onCreatePaymentVoucher(p)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                              title="إصدار سند صرف لسداد المورد"
                            >
                              سند صرف
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="تعديل الفاتورة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeletePurchase(p.id, p.purchaseNumber)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="حذف"
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
      )}

      {/* ======================================================= */}
      {/* MODAL 1: CREATE / EDIT PURCHASE INVOICE */}
      {/* ======================================================= */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPurchase ? "تعديل فاتورة المشتريات" : "تسجيل فاتورة مشتريات وتوريد جديدة"}
                </h3>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-6 text-xs">
              
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                
                {/* PO Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم أمر الشراء</label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.purchaseNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Supplier Invoice Ref */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم فاتورة المورد</label>
                  <input
                    type="text"
                    value={purchaseForm.supplierInvoiceNo}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierInvoiceNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900"
                    placeholder="INV-SUP-..."
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الفاتورة</label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={purchaseForm.dueDate}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

              </div>

              {/* Supplier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                {/* Supplier Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">المورد المعتمد</label>
                    <button
                      type="button"
                      onClick={() => setIsNewSupplierModalOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <UserPlus className="w-3 h-3" />
                      + مورد جديد
                    </button>
                  </div>
                  <select
                    value={purchaseForm.supplierId}
                    onChange={(e) => handleSelectSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  >
                    <option value="">-- اختر من قائمة الموردين --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Supplier Name (Free input if not selected) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم المورد <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.supplierName}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white"
                  />
                </div>

                {/* Receiving Branch */}
                {branches.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الفرع المستلم</label>
                    <select
                      value={purchaseForm.branchId || ""}
                      onChange={(e) => {
                        const bId = e.target.value;
                        const bObj = branches.find((b) => b.id === bId);
                        setPurchaseForm({
                          ...purchaseForm,
                          branchId: bId,
                          branchName: bObj ? bObj.name : ""
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white"
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

                {/* Receiving Warehouse */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستودع المستلم</label>
                  <input
                    type="text"
                    value={purchaseForm.warehouse}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, warehouse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>

              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    الأصناف المشتراة
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + إضافة سطر صنف
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="p-2.5">الصنف (اختيار من المخزن أو كتابة)</th>
                        <th className="p-2.5 w-24 text-center">الكمية</th>
                        <th className="p-2.5 w-20">الوحدة</th>
                        <th className="p-2.5 w-28">سعر التكلفة</th>
                        <th className="p-2.5 w-28">الإجمالي</th>
                        <th className="p-2.5 w-12 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseForm.items.map((item, idx) => (
                        <tr key={item.id} className="bg-white">
                          
                          {/* Item Selector & Name */}
                          <td className="p-2 space-y-1">
                            {inventory.length > 0 && (
                              <select
                                value={item.itemId || ""}
                                onChange={(e) => handleSelectCatalogItem(item.id, e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-indigo-900 font-medium mb-1"
                              >
                                <option value="">-- 📦 ربط بصنف من المخزن الحالي --</option>
                                {inventory.map((inv) => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.sku} - {inv.name} (تكلفة: {inv.costPrice} {currency})
                                  </option>
                                ))}
                              </select>
                            )}
                            <input
                              type="text"
                              required
                              placeholder="اسم الصنف / البيان..."
                              value={item.name}
                              onChange={(e) => handleUpdateItemLine(item.id, { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemLine(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-900"
                            />
                          </td>

                          {/* Unit */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit || "حبة"}
                              onChange={(e) => handleUpdateItemLine(item.id, { unit: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-center"
                            />
                          </td>

                          {/* Unit Cost */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              required
                              value={item.unitCost}
                              onChange={(e) => handleUpdateItemLine(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 font-bold"
                            />
                          </td>

                          {/* Line Amount */}
                          <td className="p-2 font-mono font-bold text-slate-900">
                            {(item.amount || 0).toFixed(3)} {currency}
                          </td>

                          {/* Delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(item.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">حالة التوريد والاستلام</label>
                    <select
                      value={purchaseForm.status}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, status: e.target.value as PurchaseStatus })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    >
                      <option value="RECEIVED">تم الاستلام بالمستودع (RECEIVED)</option>
                      <option value="ORDERED">قيد التوريد والشحن (ORDERED)</option>
                      <option value="DRAFT">مسودة أمر شراء (DRAFT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">حالة السداد للمورد</label>
                    <select
                      value={purchaseForm.paymentStatus}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value as PurchasePaymentStatus })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    >
                      <option value="PAID">مسدد بالكامل (PAID)</option>
                      <option value="PARTIAL">مسدد جزئياً (PARTIAL)</option>
                      <option value="UNPAID">غير مسدد (UNPAID)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="auto-stock-chk"
                      checked={purchaseForm.autoUpdateStock}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, autoUpdateStock: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-md"
                    />
                    <label htmlFor="auto-stock-chk" className="font-bold text-indigo-900 cursor-pointer">
                      إضافة كميات الأصناف لرصيد المخزون تلقائياً عند الاستلام
                    </label>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono font-bold">{formSubtotal.toFixed(3)} {currency}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      ضريبة القيمة المضافة (VAT):
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={purchaseForm.taxRate}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, taxRate: parseFloat(e.target.value) || 0 })}
                        className="w-12 px-1.5 py-0.5 text-center bg-white border border-slate-200 rounded-md font-mono"
                      />
                      %
                    </span>
                    <span className="font-mono font-bold">{formTaxAmount.toFixed(3)} {currency}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>رسوم الشحن والتوصيل:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={purchaseForm.shippingFee}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, shippingFee: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 text-left bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>الخصم المكتسب:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={purchaseForm.discountAmount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, discountAmount: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 text-left bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>

                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2 mt-2">
                    <span>الإجمالي النهائي للفاتورة:</span>
                    <span className="font-mono text-indigo-700 text-base">{formTotalAmount.toFixed(3)} {currency}</span>
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer"
                >
                  {editingPurchase ? "حفظ التعديلات" : "اعتماد وحفظ فاتورة المشتريات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: PREVIEW & PRINT PURCHASE INVOICE */}
      {/* ======================================================= */}
      {isPreviewModalOpen && previewPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  معاينة فاتورة أمر الشراء: {previewPurchase.purchaseNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-800" id="printable-purchase-invoice">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{companySettings?.companyName}</h2>
                  <p className="text-xs text-slate-500">{companySettings?.tagline}</p>
                  <p className="text-xs text-slate-600 mt-1">{companySettings?.address} - {companySettings?.cityStateZip}</p>
                  <p className="text-xs text-slate-600">الرقم الضريبي: {companySettings?.taxId}</p>
                </div>
                <div className="text-left font-mono">
                  <div className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-sm font-bold">
                    {previewPurchase.purchaseNumber}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">التاريخ: {formatDateToDDMMMMYYYY(previewPurchase.date)}</p>
                  {previewPurchase.supplierInvoiceNo && (
                    <p className="text-xs text-slate-500">فاتورة المورد: {previewPurchase.supplierInvoiceNo}</p>
                  )}
                </div>
              </div>

              {/* Supplier Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold mb-0.5">بيانات المورد:</span>
                  <p className="font-bold text-slate-900 text-sm">{previewPurchase.supplierName}</p>
                  {previewPurchase.supplierPhone && <p className="text-slate-600">هاتف: {previewPurchase.supplierPhone}</p>}
                  {previewPurchase.supplierAddress && <p className="text-slate-600">العنوان: {previewPurchase.supplierAddress}</p>}
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block font-bold mb-0.5">مستودع الاستلام:</span>
                  <p className="font-bold text-slate-900">{previewPurchase.warehouse}</p>
                  <p className="text-slate-600 mt-1">
                    حالة الدفع:{" "}
                    <strong>{previewPurchase.paymentStatus === "PAID" ? "مسدد" : "غير مسدد"}</strong>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">الصنف والمواصفات</th>
                    <th className="p-2.5 text-center">الكمية</th>
                    <th className="p-2.5">سعر التكلفة</th>
                    <th className="p-2.5 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewPurchase.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {it.name}
                        {it.sku && <span className="text-[10px] text-slate-400 font-mono block">SKU: {it.sku}</span>}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="p-2.5 font-mono">{it.unitCost.toFixed(3)} {currency}</td>
                      <td className="p-2.5 text-left font-mono font-bold">{(it.amount || 0).toFixed(3)} {currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono font-bold">{previewPurchase.subtotal.toFixed(3)} {currency}</span>
                  </div>
                  {previewPurchase.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة ({previewPurchase.taxRate}%):</span>
                      <span className="font-mono font-bold">{previewPurchase.taxAmount.toFixed(3)} {currency}</span>
                    </div>
                  )}
                  {previewPurchase.shippingFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>الشحن والتوصيل:</span>
                      <span className="font-mono font-bold">{previewPurchase.shippingFee.toFixed(3)} {currency}</span>
                    </div>
                  )}
                  {previewPurchase.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>الخصم:</span>
                      <span className="font-mono font-bold">-{previewPurchase.discountAmount.toFixed(3)} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2 mt-2">
                    <span>الإجمالي النهائي:</span>
                    <span className="font-mono text-indigo-700 text-base">
                      {previewPurchase.totalAmount.toFixed(3)} {currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
                <div className="text-center space-y-8">
                  <p className="font-bold text-slate-700">توقيع المستلم بالمستودع</p>
                  <p className="text-slate-400">.................................</p>
                </div>
                <div className="text-center space-y-8">
                  <p className="font-bold text-slate-700">اعتماد إدارة المشتريات والمالية</p>
                  <p className="text-slate-400">.................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 3: SUPPLIERS DIRECTORY */}
      {/* ======================================================= */}
      {isSuppliersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">دليل الموردين المعتمدين</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewSupplierModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ مورد جديد</span>
                </button>
                <button
                  onClick={() => setIsSuppliersModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((sup) => (
                  <div key={sup.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{sup.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {sup.category || "مورد"}
                      </span>
                    </div>
                    {sup.contactPerson && <p className="text-slate-600">المسؤول: {sup.contactPerson}</p>}
                    {sup.phone && <p className="text-slate-600 font-mono">الهاتف: {sup.phone}</p>}
                    {sup.email && <p className="text-slate-600 font-mono">البريد: {sup.email}</p>}
                    {sup.address && <p className="text-slate-600">العنوان: {sup.address}</p>}
                    {sup.notes && <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-200">{sup.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSuppliersModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 4: ADD NEW SUPPLIER */}
      {/* ======================================================= */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">إضافة مورد جديد</h3>
              </div>
              <button
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSupplier} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم شركة المورد *</label>
                <input
                  type="text"
                  required
                  value={newSupplierData.name || ""}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  placeholder="مثال: شركة التوريدات التقنية المحدودة"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الشخص المسؤول / جهة الاتصال</label>
                <input
                  type="text"
                  value={newSupplierData.contactPerson || ""}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  placeholder="المهندس / مدير المبيعات"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={newSupplierData.phone || ""}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white"
                    placeholder="+968..."
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={newSupplierData.email || ""}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white"
                    placeholder="sales@..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان / المدينة</label>
                <input
                  type="text"
                  value={newSupplierData.address || ""}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  placeholder="المنطقة الصناعية - صحار / مسقط"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
