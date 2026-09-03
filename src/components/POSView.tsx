import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Banknote,
  DollarSign,
  User,
  UserPlus,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Camera,
  Volume2,
  VolumeX,
  Clock,
  Building2,
  Receipt,
  FileText,
  AlertCircle,
  Share2,
  ChevronDown,
  Percent,
  Calculator,
  RefreshCw,
  SlidersHorizontal,
  Package,
  History,
  ShieldCheck,
  Send,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import {
  InventoryItem,
  StockMovement,
  Customer,
  CompanySettings,
  Branch,
  Employee,
  ReceiptVoucher,
  POSOrder,
  POSOrderItem,
  POSHeldCart,
  CashierShift,
  CashMovement,
  POSPaymentMethod,
  PaymentMethod
} from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { numberToWords } from "../utils/numberToWords";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { BarcodeRenderer } from "./BarcodeRenderer";
import {
  loadPOSOrders,
  savePOSOrders,
  loadPOSHeldCarts,
  savePOSHeldCarts,
  loadCashierShifts,
  saveCashierShifts,
  loadActiveShift,
  DEFAULT_COMPANY_SETTINGS
} from "../utils/storage";
import { upsertPOSOrder, upsertCashierShift } from "../lib/supabase/posService";

interface POSViewProps {
  inventory: InventoryItem[];
  customers: Customer[];
  branches: Branch[];
  activeBranchId: string;
  activeEmployee: Employee;
  companySettings?: CompanySettings;
  vouchers: ReceiptVoucher[];
  onSaveInventory: (updated: InventoryItem[]) => void;
  onSaveMovements: (movements: StockMovement[]) => void;
  onSaveVouchers: (vouchers: ReceiptVoucher[]) => void;
  onSaveCustomers: (customers: Customer[]) => void;
  onAuditLog: (
    action: any,
    module: any,
    entityId: string,
    entityName: string,
    descAr: string,
    descEn: string,
    details?: string
  ) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  inventory,
  customers,
  branches,
  activeBranchId,
  activeEmployee,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  vouchers,
  onSaveInventory,
  onSaveMovements,
  onSaveVouchers,
  onSaveCustomers,
  onAuditLog,
  onNavigateToTab
}) => {
  const { t, language, isRTL } = useLanguage();
  const currency = companySettings?.defaultCurrency || "OMR";

  // POS State
  const [posOrders, setPosOrders] = useState<POSOrder[]>(() => loadPOSOrders());
  const [heldCarts, setHeldCarts] = useState<POSHeldCart[]>(() => loadPOSHeldCarts());
  const [shifts, setShifts] = useState<CashierShift[]>(() => loadCashierShifts());
  const [activeShift, setActiveShift] = useState<CashierShift | null>(() => loadActiveShift());

  // Active Cart State
  const [cartItems, setCartItems] = useState<POSOrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [cartNotes, setCartNotes] = useState<string>("");

  // Product Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals & Panels
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isShiftReportOpen, setIsShiftReportOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState<boolean>(false);
  const [completedOrderForReceipt, setCompletedOrderForReceipt] = useState<POSOrder | null>(null);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const [splitCardAmount, setSplitCardAmount] = useState<string>("");
  const [splitCardRef, setSplitCardRef] = useState<string>("");

  // Quick Customer Creation State
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [newCustTaxId, setNewCustTaxId] = useState<string>("");

  // Custom Ad-Hoc Item State
  const [customName, setCustomName] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customQty, setCustomQty] = useState<number>(1);
  const [customTaxRate, setCustomTaxRate] = useState<number>(5);

  // Cash In/Out State for Shift
  const [cashMovementType, setCashMovementType] = useState<"IN" | "OUT">("IN");
  const [cashMovementAmount, setCashMovementAmount] = useState<string>("");
  const [cashMovementReason, setCashMovementReason] = useState<string>("");

  // Shift Close Actual Cash
  const [shiftClosingActualCash, setShiftClosingActualCash] = useState<string>("");

  // Barcode manual input
  const [barcodeInput, setBarcodeInput] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sound Synthesizer
  const playBeep = (type: "beep" | "success" | "remove") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "beep") {
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.value = 400;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {
      // Audio context may be restricted
    }
  };

  // Resolve Active Branch
  const currentBranch = useMemo(() => {
    return branches.find((b) => b.id === activeBranchId) || branches[0] || {
      id: "branch-sohar",
      name: "فرع صحار الرئيسي",
      nameEn: "Sohar Main Branch",
      defaultWarehouse: "المستودع الرئيسي - صحار"
    };
  }, [branches, activeBranchId]);

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [inventory]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return inventory.filter((item) => {
      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    });
  }, [inventory, selectedCategory, searchQuery]);

  // Calculations for Active Cart
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (discountType === "PERCENT") {
      return (cartSubtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(cartSubtotal, Math.max(0, discountValue));
  }, [cartSubtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
  const taxRate = 5; // 5% VAT in GCC / Oman
  const taxAmount = (taxableAmount * taxRate) / 100;
  const netTotal = taxableAmount + taxAmount;

  // Sync Customer info
  useEffect(() => {
    if (selectedCustomerId === "walk-in") {
      setSelectedCustomer(null);
    } else {
      const found = customers.find((c) => c.id === selectedCustomerId);
      setSelectedCustomer(found || null);
    }
  }, [selectedCustomerId, customers]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        setIsCustomItemModalOpen(true);
      } else if (e.key === "F7") {
        e.preventDefault();
        setIsShiftModalOpen(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        handleHoldCurrentCart();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cartItems.length > 0) {
          setPaymentMethod("CARD");
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === "F10") {
        e.preventDefault();
        if (cartItems.length > 0) {
          setPaymentMethod("CASH");
          setCashTendered(netTotal.toFixed(3));
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === "Escape") {
        setIsPaymentModalOpen(false);
        setIsCustomItemModalOpen(false);
        setIsBarcodeModalOpen(false);
        setIsHeldCartsModalOpen(false);
        setIsShortcutsModalOpen(false);
        setCompletedOrderForReceipt(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cartItems, netTotal]);

  // Add Item to Cart
  const handleAddToCart = (product: InventoryItem, customQtyToAdd?: number) => {
    if (product.quantity <= 0) {
      alert(language === "ar" ? "المنتج غير متوفر حالياً في المخزن!" : "Item is out of stock!");
      return;
    }

    playBeep("beep");

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.itemId === product.id);
      const qtyToAdd = customQtyToAdd || 1;

      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + qtyToAdd;

        if (newQty > product.quantity) {
          alert(
            language === "ar"
              ? `الكمية المطلوبة (${newQty}) تتجاوز الرصيد المتوفر في المخزن (${product.quantity})`
              : `Requested quantity exceeds available warehouse stock (${product.quantity})`
          );
          return prev;
        }

        const lineSub = newQty * current.unitPrice - current.discount;
        const lineTax = (lineSub * (current.taxRate / 100));
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          taxAmount: lineTax,
          total: lineSub + lineTax
        };
        return updated;
      } else {
        const unitPrice = product.sellingPrice || product.costPrice || 0;
        const lineSub = qtyToAdd * unitPrice;
        const lineTax = (lineSub * 5) / 100;
        const newItem: POSOrderItem = {
          id: `pos-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          itemId: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          quantity: qtyToAdd,
          unitPrice: unitPrice,
          costPrice: product.costPrice,
          discount: 0,
          taxRate: 5,
          taxAmount: lineTax,
          total: lineSub + lineTax,
          unit: product.unit,
          category: product.category,
          imageUrl: product.imageUrl,
          warehouse: product.warehouse || currentBranch.defaultWarehouse
        };
        return [newItem, ...prev];
      }
    });
  };

  // Add Custom Manual Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customPrice);
    if (isNaN(price) || price < 0 || !customName.trim()) {
      alert(language === "ar" ? "يرجى كتابة اسم صحيح وسعر مناسب" : "Please enter a valid name and price");
      return;
    }

    const lineSub = customQty * price;
    const lineTax = (lineSub * customTaxRate) / 100;

    const newItem: POSOrderItem = {
      id: `pos-custom-${Date.now()}`,
      name: customName.trim(),
      sku: "CUSTOM",
      quantity: customQty,
      unitPrice: price,
      discount: 0,
      taxRate: customTaxRate,
      taxAmount: lineTax,
      total: lineSub + lineTax,
      unit: "حبة",
      category: "خدمات وبنود حرة",
      warehouse: currentBranch.defaultWarehouse
    };

    setCartItems((prev) => [newItem, ...prev]);
    setIsCustomItemModalOpen(false);
    setCustomName("");
    setCustomPrice("");
    setCustomQty(1);
    playBeep("beep");
  };

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (codeToSearch?: string) => {
    const raw = (codeToSearch || barcodeInput).trim();
    if (!raw) return;

    const found = inventory.find(
      (item) =>
        (item.barcode && item.barcode.toLowerCase() === raw.toLowerCase()) ||
        item.sku.toLowerCase() === raw.toLowerCase()
    );

    if (found) {
      handleAddToCart(found, 1);
      setBarcodeInput("");
      setIsBarcodeModalOpen(false);
    } else {
      alert(
        language === "ar"
          ? `لم يتم العثور على منتج يطابق الباركود: ${raw}`
          : `No product found matching barcode: ${raw}`
      );
    }
  };

  // Update Cart Item Quantity
  const handleUpdateItemQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // Check stock limitation if linked to real item
        if (item.itemId) {
          const product = inventory.find((p) => p.id === item.itemId);
          if (product && newQty > product.quantity) {
            alert(
              language === "ar"
                ? `الكمية المتوفرة في المخزن (${product.quantity}) فقط!`
                : `Only (${product.quantity}) items available in stock!`
            );
            return item;
          }
        }

        const lineSub = newQty * item.unitPrice - item.discount;
        const lineTax = (lineSub * item.taxRate) / 100;
        return {
          ...item,
          quantity: newQty,
          taxAmount: lineTax,
          total: lineSub + lineTax
        };
      })
    );
  };

  // Remove Item from Cart
  const handleRemoveCartItem = (id: string) => {
    playBeep("remove");
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear Entire Cart
  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm(language === "ar" ? "هل أنت متأكد من تفريغ سلة المشتريات بالكامل؟" : "Are you sure you want to clear the entire cart?")) {
      setCartItems([]);
      setDiscountValue(0);
      setCartNotes("");
      setSelectedCustomerId("walk-in");
    }
  };

  // Hold Current Cart
  const handleHoldCurrentCart = () => {
    if (cartItems.length === 0) {
      alert(language === "ar" ? "السلة فارغة، لا يوجد طلب لتعليقه" : "Cart is empty, nothing to hold");
      return;
    }

    const customerDisplayName = selectedCustomer
      ? selectedCustomer.name
      : language === "ar"
      ? "عميل نقدي عام"
      : "Walk-in Customer";

    const newHeldCart: POSHeldCart = {
      id: `held-${Date.now()}`,
      cartNumber: heldCarts.length + 1,
      label: `${customerDisplayName} (${cartItems.length} ${language === "ar" ? "أصناف" : "items"})`,
      customerName: customerDisplayName,
      customerId: selectedCustomerId,
      customerPhone: selectedCustomer?.phone,
      items: cartItems,
      discountType: discountType,
      discountValue: discountValue,
      notes: cartNotes,
      heldAt: new Date().toISOString(),
      branchId: activeBranchId
    };

    const updatedHeld = [newHeldCart, ...heldCarts];
    setHeldCarts(updatedHeld);
    savePOSHeldCarts(updatedHeld);

    // Reset Cart
    setCartItems([]);
    setDiscountValue(0);
    setCartNotes("");
    setSelectedCustomerId("walk-in");

    playBeep("beep");
    alert(language === "ar" ? "تم تعليق الفاتورة بنجاح. يمكنك استرجاعها في أي وقت." : "Order held successfully. You can recall it anytime.");
  };

  // Recall Held Cart
  const handleRecallHeldCart = (held: POSHeldCart) => {
    if (cartItems.length > 0) {
      if (!window.confirm(language === "ar" ? "يوجد طلب نشط حالياً، هل تريد استبداله بالطلب المعلق؟" : "Current cart will be replaced by the held order. Continue?")) {
        return;
      }
    }

    setCartItems(held.items);
    setDiscountType(held.discountType || "PERCENT");
    setDiscountValue(held.discountValue || 0);
    setCartNotes(held.notes || "");
    setSelectedCustomerId(held.customerId || "walk-in");

    const updatedHeld = heldCarts.filter((h) => h.id !== held.id);
    setHeldCarts(updatedHeld);
    savePOSHeldCarts(updatedHeld);
    setIsHeldCartsModalOpen(false);
    playBeep("success");
  };

  // Open Checkout Modal
  const handleOpenCheckout = (method: POSPaymentMethod = "CASH") => {
    if (cartItems.length === 0) {
      alert(language === "ar" ? "يرجى إضافة منتجات إلى السلة أولاً" : "Please add products to cart first");
      return;
    }
    setPaymentMethod(method);
    setCashTendered(netTotal.toFixed(3));
    setSplitCashAmount((netTotal / 2).toFixed(3));
    setSplitCardAmount((netTotal / 2).toFixed(3));
    setIsPaymentModalOpen(true);
  };

  // Complete Payment & Atomic Transaction
  const handleExecutePayment = (andPrint: boolean = true) => {
    const parsedCash = parseFloat(cashTendered) || netTotal;
    const changeDue = paymentMethod === "CASH" ? Math.max(0, parsedCash - netTotal) : 0;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0];
    const orderSeq = (posOrders.length + 1).toString().padStart(4, "0");
    const orderNumber = `POS-${now.getFullYear()}-${orderSeq}`;
    const invoiceNumber = `INV-${now.getFullYear()}-${(vouchers.length + 850).toString().padStart(4, "0")}`;

    const customerName = selectedCustomer ? selectedCustomer.name : (language === "ar" ? "عميل نقدي عام (Walk-in)" : "Walk-in Customer");
    const customerPhone = selectedCustomer?.phone || "";
    const customerTaxId = selectedCustomer?.taxId || "";

    // 1. Create POS Order
    const newOrder: POSOrder = {
      id: `pos-ord-${Date.now()}`,
      orderNumber: orderNumber,
      voucherNumber: invoiceNumber,
      date: dateStr,
      time: timeStr,
      branchId: activeBranchId,
      branchName: currentBranch.name,
      warehouse: currentBranch.defaultWarehouse || "المستودع الرئيسي - صحار",
      cashierId: activeEmployee.id,
      cashierName: language === "ar" ? activeEmployee.fullName : (activeEmployee.fullNameEn || activeEmployee.fullName),
      customerId: selectedCustomerId !== "walk-in" ? selectedCustomerId : undefined,
      customerName: customerName,
      customerPhone: customerPhone,
      customerTaxId: customerTaxId,
      items: [...cartItems],
      subtotal: cartSubtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      discountType: discountType,
      discountValue: discountValue,
      discountAmount: discountAmount,
      totalAmount: netTotal,
      currency: currency,
      paymentMethod: paymentMethod,
      splitPayments: paymentMethod === "SPLIT" ? [
        { id: "sp-1", method: "CASH", amount: parseFloat(splitCashAmount) || 0 },
        { id: "sp-2", method: "CREDIT_CARD", amount: parseFloat(splitCardAmount) || 0, reference: splitCardRef }
      ] : undefined,
      cashReceived: paymentMethod === "CASH" ? parsedCash : netTotal,
      changeDue: changeDue,
      status: "COMPLETED",
      shiftId: activeShift ? activeShift.id : undefined,
      notes: cartNotes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // 2. Interconnect with Inventory: Deduct Stocks & Create Stock Movements
    const updatedInventory = [...inventory];
    const newStockMovements: StockMovement[] = [];

    cartItems.forEach((cartItem) => {
      if (cartItem.itemId) {
        const itemIdx = updatedInventory.findIndex((inv) => inv.id === cartItem.itemId);
        if (itemIdx > -1) {
          const invItem = updatedInventory[itemIdx];
          const prevQty = invItem.quantity;
          const newQty = Math.max(0, prevQty - cartItem.quantity);

          updatedInventory[itemIdx] = {
            ...invItem,
            quantity: newQty,
            status: newQty === 0 ? "OUT_OF_STOCK" : newQty <= invItem.minAlertQuantity ? "LOW_STOCK" : "IN_STOCK",
            updatedAt: now.toISOString()
          };

          newStockMovements.push({
            id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemId: invItem.id,
            itemSku: invItem.sku,
            itemName: invItem.name,
            type: "SALE_OUT",
            quantity: cartItem.quantity,
            previousQuantity: prevQty,
            newQuantity: newQty,
            referenceNo: orderNumber,
            warehouse: invItem.warehouse || currentBranch.defaultWarehouse || "المستودع الرئيسي - صحار",
            branchId: activeBranchId,
            branchName: currentBranch.name,
            date: now.toISOString(),
            notes: `مبيعات نقطة بيع POS - طلب رقم ${orderNumber}`,
            createdByName: activeEmployee.fullName
          });
        }
      }
    });

    onSaveInventory(updatedInventory);
    if (newStockMovements.length > 0) {
      onSaveMovements(newStockMovements);
    }

    // 3. Interconnect with Accounting / Vouchers: Generate Official Tax Invoice Voucher
    const lineItemsForVoucher = cartItems.map((ci, idx) => ({
      id: `li-pos-${idx + 1}`,
      itemId: ci.itemId,
      sku: ci.sku,
      description: ci.name,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      amount: ci.quantity * ci.unitPrice,
      unit: ci.unit
    }));

    const newVoucher: ReceiptVoucher = {
      id: `v-pos-${Date.now()}`,
      type: "TAX_INVOICE",
      voucherNumber: invoiceNumber,
      referenceNo: orderNumber,
      date: dateStr,
      branchId: activeBranchId,
      branchName: currentBranch.name,
      receivedFrom: customerName,
      payerEmail: selectedCustomer?.email || "",
      payerPhone: customerPhone,
      payerAddress: selectedCustomer?.address || "",
      payerTaxId: customerTaxId,
      amount: netTotal,
      currency: currency,
      amountInWords: numberToWords(netTotal, currency),
      isCustomWords: false,
      paymentMethod: paymentMethod === "CARD" ? "CREDIT_CARD" : paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CASH",
      category: "مبيعات نقطة البيع (POS Sales)",
      lineItems: lineItemsForVoucher,
      subtotal: cartSubtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      discountAmount: discountAmount,
      totalAmount: netTotal,
      notes: `فاتورة ضريبية من نقطة البيع - كاشير: ${activeEmployee.fullName}`,
      terms: companySettings.termsAndConditions,
      customFields: [{ id: "cf-pos", label: "رقم الوردية", value: activeShift?.shiftNumber || "وردية عامة" }],
      status: "PAID",
      preparedBy: activeEmployee.fullName,
      approvedBy: "نظام نقاط البيع المعتمد",
      receivedBy: customerName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const updatedVouchers = [newVoucher, ...vouchers];
    onSaveVouchers(updatedVouchers);

    // 4. Interconnect with CRM Customers
    if (selectedCustomer) {
      const updatedCustomers = customers.map((c) => {
        if (c.id === selectedCustomer.id) {
          const interaction = {
            id: `act-${Date.now()}`,
            date: now.toISOString(),
            type: "VOUCHER_ISSUED" as const,
            title: `فاتورة كاشير ${orderNumber}`,
            notes: `عملية شراء بمبلغ ${netTotal.toFixed(3)} ${currency}`,
            createdByName: activeEmployee.fullName
          };
          return {
            ...c,
            interactions: [interaction, ...(c.interactions || [])],
            updatedAt: now.toISOString()
          };
        }
        return c;
      });
      onSaveCustomers(updatedCustomers);
    }

    // 5. Update Cashier Shift Statistics
    if (activeShift) {
      const isCash = paymentMethod === "CASH" || (paymentMethod === "SPLIT" && (parseFloat(splitCashAmount) > 0));
      const cashAmountAdded = paymentMethod === "CASH" ? netTotal : paymentMethod === "SPLIT" ? (parseFloat(splitCashAmount) || 0) : 0;
      const cardAmountAdded = paymentMethod === "CARD" ? netTotal : paymentMethod === "SPLIT" ? (parseFloat(splitCardAmount) || 0) : 0;

      const updatedShift: CashierShift = {
        ...activeShift,
        expectedCash: activeShift.expectedCash + cashAmountAdded,
        totalSalesCash: activeShift.totalSalesCash + cashAmountAdded,
        totalSalesCard: activeShift.totalSalesCard + cardAmountAdded,
        totalDiscounts: activeShift.totalDiscounts + discountAmount,
        totalTax: activeShift.totalTax + taxAmount,
        totalNetSales: activeShift.totalNetSales + netTotal,
        ordersCount: activeShift.ordersCount + 1
      };

      setActiveShift(updatedShift);
      const updatedShiftsList = shifts.map((s) => (s.id === activeShift.id ? updatedShift : s));
      setShifts(updatedShiftsList);
      saveCashierShifts(updatedShiftsList);
    }

    // 6. Save POS Order
    const updatedOrders = [newOrder, ...posOrders];
    setPosOrders(updatedOrders);
    savePOSOrders(updatedOrders);

    // Sync with Supabase asynchronously
    const targetCompanyId = (companySettings as any)?.companyId || "00000000-0000-0000-0000-000000000001";
    upsertPOSOrder(newOrder, targetCompanyId).catch(console.error);
    if (activeShift) {
      upsertCashierShift(activeShift, targetCompanyId).catch(console.error);
    }

    // 7. Log Audit Activity
    onAuditLog(
      "CREATE",
      "VOUCHERS",
      newOrder.id,
      orderNumber,
      `إتمام عملية بيع كاشير رقم ${orderNumber} بمبلغ ${netTotal.toFixed(3)} ${currency}`,
      `Completed POS sale ${orderNumber} totaling ${netTotal.toFixed(3)} ${currency}`,
      `العميل: ${customerName} | طريقة الدفع: ${paymentMethod} | الأصناف: ${cartItems.length}`
    );

    // Reset Cart
    setCartItems([]);
    setDiscountValue(0);
    setCartNotes("");
    setSelectedCustomerId("walk-in");
    setIsPaymentModalOpen(false);

    playBeep("success");

    // Open Receipt Preview/Print
    setCompletedOrderForReceipt(newOrder);
  };

  // Shift Management Operations
  const handleOpenNewShift = () => {
    const opening = parseFloat(cashMovementAmount) || 0;
    const now = new Date();
    const shiftSeq = (shifts.length + 1).toString().padStart(3, "0");
    const newShift: CashierShift = {
      id: `shift-${Date.now()}`,
      shiftNumber: `SH-${now.getFullYear()}-${shiftSeq}`,
      cashierId: activeEmployee.id,
      cashierName: activeEmployee.fullName,
      branchId: activeBranchId,
      branchName: currentBranch.name,
      openedAt: now.toISOString(),
      openingCash: opening,
      expectedCash: opening,
      totalSalesCash: 0,
      totalSalesCard: 0,
      totalSalesCredit: 0,
      totalSalesOnline: 0,
      totalSalesBank: 0,
      totalReturns: 0,
      totalDiscounts: 0,
      totalTax: 0,
      totalNetSales: 0,
      ordersCount: 0,
      cashMovements: [],
      status: "OPEN",
      notes: "وردية كاشير جديدة"
    };

    const updated = [newShift, ...shifts];
    setShifts(updated);
    setActiveShift(newShift);
    saveCashierShifts(updated);
    setCashMovementAmount("");
    setIsShiftModalOpen(false);
    playBeep("success");
  };

  const handleCashMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const amt = parseFloat(cashMovementAmount);
    if (isNaN(amt) || amt <= 0 || !cashMovementReason.trim()) {
      alert(language === "ar" ? "يرجى كتابة مبلغ وسبب صحيح" : "Please enter a valid amount and reason");
      return;
    }

    const movement: CashMovement = {
      id: `cm-${Date.now()}`,
      type: cashMovementType,
      amount: amt,
      reason: cashMovementReason.trim(),
      time: new Date().toLocaleTimeString(),
      performedByName: activeEmployee.fullName
    };

    const delta = cashMovementType === "IN" ? amt : -amt;
    const updatedShift: CashierShift = {
      ...activeShift,
      expectedCash: Math.max(0, activeShift.expectedCash + delta),
      cashMovements: [...activeShift.cashMovements, movement]
    };

    setActiveShift(updatedShift);
    const updatedShifts = shifts.map((s) => (s.id === activeShift.id ? updatedShift : s));
    setShifts(updatedShifts);
    saveCashierShifts(updatedShifts);

    setCashMovementAmount("");
    setCashMovementReason("");
    playBeep("beep");
  };

  const handleCloseShift = () => {
    if (!activeShift) return;
    const actual = parseFloat(shiftClosingActualCash);
    if (isNaN(actual)) {
      alert(language === "ar" ? "يرجى كتابة المبلغ الفعلي الموجود في الدرج" : "Please enter actual cash in drawer");
      return;
    }

    const diff = actual - activeShift.expectedCash;
    const closedShift: CashierShift = {
      ...activeShift,
      closedAt: new Date().toISOString(),
      actualCash: actual,
      difference: diff,
      status: "CLOSED",
      notes: `إغلاق الوردية - الفرق: ${diff > 0 ? `+${diff.toFixed(3)} زيادة` : diff < 0 ? `${diff.toFixed(3)} عجز` : "مطابق تماماً"}`
    };

    const updatedShifts = shifts.map((s) => (s.id === activeShift.id ? closedShift : s));
    setShifts(updatedShifts);
    saveCashierShifts(updatedShifts);
    setActiveShift(null);
    setShiftClosingActualCash("");
    setIsShiftModalOpen(false);

    onAuditLog(
      "STATUS_CHANGE",
      "SECURITY",
      closedShift.id,
      closedShift.shiftNumber,
      `إغلاق وردية الكاشير ${closedShift.shiftNumber} - الفرق: ${diff.toFixed(3)} ${currency}`,
      `Closed Cashier Shift ${closedShift.shiftNumber} with difference ${diff.toFixed(3)} ${currency}`
    );

    alert(language === "ar" ? "تم إغلاق الوردية وتوليد التقرير المالي Z-Report بنجاح!" : "Shift closed and Z-Report generated successfully!");
  };

  // Quick Customer Creation
  const handleQuickCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      taxId: newCustTaxId.trim(),
      email: "",
      type: "INDIVIDUAL",
      status: "ACTIVE",
      notes: "تمت الإضافة السريعة من نقطة البيع POS",
      tags: ["عميل كاشير"],
      creditLimit: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newCustomer, ...customers];
    onSaveCustomers(updated);
    setSelectedCustomerId(newCustomer.id);
    setSelectedCustomer(newCustomer);
    setIsNewCustomerModalOpen(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustTaxId("");
    playBeep("success");
  };

  // Refund POS Order
  const handleRefundOrder = (order: POSOrder) => {
    const reason = prompt(
      language === "ar" ? "يرجى كتابة سبب استرجاع الفاتورة وإعادة البضاعة للمخزن:" : "Please enter refund reason:"
    );
    if (reason === null) return;

    // Restore Inventory Items
    const updatedInventory = [...inventory];
    const newMovements: StockMovement[] = [];

    order.items.forEach((item) => {
      if (item.itemId) {
        const itemIdx = updatedInventory.findIndex((p) => p.id === item.itemId);
        if (itemIdx > -1) {
          const invItem = updatedInventory[itemIdx];
          const prevQty = invItem.quantity;
          const newQty = prevQty + item.quantity;
          updatedInventory[itemIdx] = {
            ...invItem,
            quantity: newQty,
            status: "IN_STOCK",
            updatedAt: new Date().toISOString()
          };

          newMovements.push({
            id: `mov-ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemId: invItem.id,
            itemSku: invItem.sku,
            itemName: invItem.name,
            type: "RETURN_IN",
            quantity: item.quantity,
            previousQuantity: prevQty,
            newQuantity: newQty,
            referenceNo: order.orderNumber,
            warehouse: invItem.warehouse || currentBranch.defaultWarehouse || "المستودع الرئيسي - صحار",
            date: new Date().toISOString(),
            notes: `استرجاع مبيعات POS - ${reason || "مرتجع كاشير"}`,
            createdByName: activeEmployee.fullName
          });
        }
      }
    });

    onSaveInventory(updatedInventory);
    if (newMovements.length > 0) {
      onSaveMovements(newMovements);
    }

    // Update POS Order Status
    const updatedOrders = posOrders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          status: "REFUNDED" as const,
          isRefunded: true,
          refundReason: reason,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });

    setPosOrders(updatedOrders);
    savePOSOrders(updatedOrders);

    onAuditLog(
      "UPDATE",
      "VOUCHERS",
      order.id,
      order.orderNumber,
      `استرجاع فاتورة POS رقم ${order.orderNumber} بمبلغ ${order.totalAmount.toFixed(3)} ${currency}`,
      `Refunded POS order ${order.orderNumber}`
    );

    playBeep("success");
    alert(t("refundSuccess"));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-full overflow-hidden bg-slate-900 text-slate-100 font-sans select-none">
      
      {/* Top POS Control Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-md">
        
        {/* Left: Brand / Branch / Cashier Info */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-tight">
                {language === "ar" ? "نقطة البيع الذكية" : "Smart POS Terminal"}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{language === "ar" ? "نشط ومترابط" : "Active & Synced"}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentBranch.name}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === "ar" ? activeEmployee.fullName : (activeEmployee.fullNameEn || activeEmployee.fullName)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search & Quick Barcode Input */}
        <div className="flex-1 max-w-md hidden md:flex items-center relative">
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                handleBarcodeSubmit(searchQuery);
              }
            }}
            placeholder={language === "ar" ? "بحث بالاسم، الباركود، أو SKU (اضغط F2)..." : "Search item, barcode or SKU (F2)..."}
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-xl ps-9 pe-20 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-indigo-500 font-medium"
          />
          <div className="absolute inset-y-0 end-0 pe-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsBarcodeModalOpen(true)}
              className="p-1 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="قارئ الباركود"
            >
              <Barcode className="w-4 h-4" />
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          
          {/* Held Carts Badge Button */}
          <button
            type="button"
            onClick={() => setIsHeldCartsModalOpen(true)}
            className="relative px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("heldOrders")}</span>
            {heldCarts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center -me-1">
                {heldCarts.length}
              </span>
            )}
          </button>

          {/* Shift / Drawer Control Button */}
          <button
            type="button"
            onClick={() => setIsShiftModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeShift
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{activeShift ? activeShift.shiftNumber : (language === "ar" ? "فتح وردية" : "Open Shift")}</span>
          </button>

          {/* Sales History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            title="سجل مبيعات POS"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t("orderHistory")}</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? "bg-slate-800 text-slate-300 border-slate-700"
                : "bg-slate-800 text-slate-600 border-slate-700"
            }`}
            title="المؤثرات الصوتية"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Keyboard Shortcuts Guide */}
          <button
            type="button"
            onClick={() => setIsShortcutsModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="اختصارات لوحة المفاتيح"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* Main Work Area: Split Grid (Products on Left/Center, Cart on Right/Left in RTL) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Products Catalogue Section */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 border-e border-slate-800 p-3 sm:p-4 overflow-hidden">
          
          {/* Categories Bar & Quick Actions */}
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white border border-slate-750"
                  }`}
                >
                  {cat === "ALL" ? t("allCategories") : cat}
                </button>
              ))}
            </div>

            {/* Custom Item Button */}
            <button
              type="button"
              onClick={() => setIsCustomItemModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("customItem")}</span>
            </button>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pe-1">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500">
                <Package className="w-12 h-12 mb-3 text-slate-600" />
                <p className="text-sm font-bold text-slate-400">{t("noDataFound")}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {language === "ar" ? "جرب البحث باسم آخر أو أضف بنداً يدوياً" : "Try a different search or add custom item"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {t("customItem")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.quantity <= 0;
                  const isLowStock = product.quantity > 0 && product.quantity <= product.minAlertQuantity;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product, 1)}
                      className={`relative flex flex-col justify-between p-3 rounded-2xl border text-start transition-all cursor-pointer select-none group ${
                        isOutOfStock
                          ? "bg-slate-900/50 border-slate-800/60 opacity-50 cursor-not-allowed"
                          : "bg-slate-850 hover:bg-slate-800 border-slate-750 hover:border-indigo-500/50 shadow-sm hover:shadow-indigo-500/10 active:scale-[0.98]"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[90px]">
                          {product.sku}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                            isOutOfStock
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : isLowStock
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {isOutOfStock ? t("outOfStock") : `${product.quantity} ${product.unit || ""}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <div className="my-1 flex-1">
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      {/* Bottom Price & Add Action */}
                      <div className="flex items-end justify-between w-full mt-2 pt-2 border-t border-slate-750">
                        <div>
                          <p className="text-[10px] text-slate-400 leading-none">{language === "ar" ? "السعر" : "Price"}</p>
                          <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                            {product.sellingPrice.toFixed(3)}
                            <span className="text-[10px] font-normal text-slate-400 ms-1">{currency}</span>
                          </p>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right POS Cart & Fast Checkout Panel */}
        <div className="w-80 sm:w-96 lg:w-[420px] flex flex-col bg-slate-950 border-s border-slate-800 shrink-0 select-none">
          
          {/* Customer Selection Row */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                {t("selectCustomer")}
              </label>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium truncate cursor-pointer"
                >
                  <option value="walk-in">
                    {language === "ar" ? "👤 عميل نقدي عام (Walk-in)" : "👤 Walk-in Customer"}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="mt-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
              title="إضافة عميل جديد"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Header with Count & Clear */}
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs bg-slate-900/30">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === "ar" ? "أصناف الفاتورة" : "Cart Items"}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                {cartItems.length}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHoldCurrentCart}
                disabled={cartItems.length === 0}
                className="text-[11px] text-amber-400 hover:text-amber-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <PauseCircle className="w-3 h-3" />
                <span>{t("holdOrder")}</span>
              </button>

              <button
                type="button"
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
                className="text-[11px] text-rose-400 hover:text-rose-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t("clearCart")}</span>
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-600">
                <ShoppingCart className="w-10 h-10 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-400">{language === "ar" ? "السلة فارغة" : "Cart is Empty"}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {language === "ar" ? "اختر منتجات من القائمة أو امسح الباركود" : "Select items from grid or scan barcode"}
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white line-clamp-1 leading-snug">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{item.unitPrice.toFixed(3)} {currency}</span>
                        {item.sku && <span>• {item.sku}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCartItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Qty & Line Total Row */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center bg-slate-950 rounded-xl border border-slate-750 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-9 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-end">
                      <p className="text-xs font-black text-emerald-400 font-mono">
                        {(item.quantity * item.unitPrice).toFixed(3)} {currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Discount & Order Calculation Summary */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2 shrink-0">
            
            {/* Quick Discount Toggle */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Percent className="w-3 h-3 text-indigo-400" />
                <span>{t("discount")}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-950 border border-slate-750 rounded-lg p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENT")}
                    className={`px-1.5 py-0.5 rounded ${discountType === "PERCENT" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("FIXED")}
                    className={`px-1.5 py-0.5 rounded ${discountType === "FIXED" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"}`}
                  >
                    {currency}
                  </button>
                </div>

                <input
                  type="number"
                  min="0"
                  max={discountType === "PERCENT" ? "100" : String(cartSubtotal)}
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-xs text-center text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs border-t border-slate-800/80 pt-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>{t("subtotal")}</span>
                <span className="font-mono text-slate-200">{cartSubtotal.toFixed(3)} {currency}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-amber-400">
                  <span>{t("discount")}</span>
                  <span className="font-mono">-{discountAmount.toFixed(3)} {currency}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400">
                <span>{t("vat")} (5%)</span>
                <span className="font-mono text-slate-200">{taxAmount.toFixed(3)} {currency}</span>
              </div>

              {/* Net Grand Total */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-base font-black">
                <span className="text-white">{t("total")}</span>
                <span className="text-emerald-400 font-mono text-xl">
                  {netTotal.toFixed(3)} <span className="text-xs font-normal text-slate-400">{currency}</span>
                </span>
              </div>
            </div>

            {/* Fast Payment Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              
              {/* Quick Cash Button */}
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => handleOpenCheckout("CASH")}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-1">
                  <Banknote className="w-4 h-4" />
                  <span>{t("payCash")} (F10)</span>
                </div>
                <span className="text-[10px] font-mono font-normal opacity-80">
                  {netTotal.toFixed(3)} {currency}
                </span>
              </button>

              {/* Card / Network Button */}
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => handleOpenCheckout("CARD")}
                className="py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-black text-xs shadow-lg shadow-indigo-600/20 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  <span>{t("payCard")} (F9)</span>
                </div>
                <span className="text-[10px] font-mono font-normal opacity-80">
                  {language === "ar" ? "مدى / بطاقة" : "Card POS"}
                </span>
              </button>

            </div>

            {/* Split & More Payment Options */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => handleOpenCheckout("SPLIT")}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-bold border border-slate-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {t("splitPayment")}
              </button>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => handleOpenCheckout("BANK_TRANSFER")}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-bold border border-slate-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {t("payBank")}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. Fast Payment Modal (نافذة إتمام الدفع والكاشير)                         */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {language === "ar" ? "إتمام عملية البيع والدفع" : "Complete POS Checkout"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedCustomer ? selectedCustomer.name : (language === "ar" ? "عميل نقدي عام" : "Walk-in Customer")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Required Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-center">
              <div>
                <p className="text-xs text-slate-400">{language === "ar" ? "المبلغ المستحق للدفع" : "Total Due"}</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {netTotal.toFixed(3)} <span className="text-xs text-slate-400 font-normal">{currency}</span>
                </p>
              </div>

              <div className="text-end">
                <p className="text-xs text-slate-400">{language === "ar" ? "عدد الأصناف" : "Items Count"}</p>
                <p className="text-lg font-bold text-white font-mono">{cartItems.length}</p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "CASH", label: t("payCash"), icon: Banknote },
                { id: "CARD", label: t("payCard"), icon: CreditCard },
                { id: "SPLIT", label: t("splitPayment"), icon: Layers },
                { id: "BANK_TRANSFER", label: t("payBank"), icon: Building2 }
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tender Keypad Input */}
            {paymentMethod === "CASH" && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-300">{t("cashReceived")}</label>
                  <span className="text-[11px] text-slate-500">
                    {language === "ar" ? "اختر فئة سريعة أو اكتب المبلغ" : "Quick currency buttons"}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={netTotal.toFixed(3)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xl font-mono font-black rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-center"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: t("exactAmount"), val: netTotal },
                    { label: `+5 ${currency}`, val: Math.ceil(netTotal / 5) * 5 },
                    { label: `+10 ${currency}`, val: Math.ceil(netTotal / 10) * 10 },
                    { label: `+20 ${currency}`, val: Math.ceil(netTotal / 20) * 20 },
                    { label: `+50 ${currency}`, val: Math.ceil(netTotal / 50) * 50 },
                    { label: `+100 ${currency}`, val: Math.ceil(netTotal / 100) * 100 }
                  ].map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCashTendered(btn.val.toFixed(3))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold border border-slate-750 transition-colors cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Change Due Highlight */}
                {parseFloat(cashTendered) >= netTotal && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">{t("changeDue")}:</span>
                    <span className="font-mono text-base font-black text-emerald-400">
                      {(parseFloat(cashTendered) - netTotal).toFixed(3)} {currency}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Split Payment Fields */}
            {paymentMethod === "SPLIT" && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">{t("payCash")}</label>
                    <input
                      type="number"
                      step="0.001"
                      value={splitCashAmount}
                      onChange={(e) => setSplitCashAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-xl p-2 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">{t("payCard")}</label>
                    <input
                      type="number"
                      step="0.001"
                      value={splitCardAmount}
                      onChange={(e) => setSplitCardAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-xl p-2 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">{language === "ar" ? "رقم مرجع الشبكة (اختياري)" : "Card Ref (Optional)"}</label>
                  <input
                    type="text"
                    value={splitCardRef}
                    onChange={(e) => setSplitCardRef(e.target.value)}
                    placeholder="MADA-XXXX"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Complete Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={() => handleExecutePayment(true)}
                className="flex-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t("payAndPrint")}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Cashier Shift & Cash Drawer Modal (إدارة الوردية والصندوق)             */}
      {/* ========================================================================= */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {activeShift ? `${t("cashierShift")} (${activeShift.shiftNumber})` : t("openShift")}
                  </h3>
                  <p className="text-xs text-slate-400">{currentBranch.name} • {activeEmployee.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!activeShift ? (
              // Open New Shift Form
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <p className="text-slate-300 font-bold">{language === "ar" ? "لا توجد وردية مفتوحة حالياً" : "No active open shift"}</p>
                  <p className="text-slate-500">
                    {language === "ar" ? "يرجى إدخال رصيد افتتاح الصندوق النقدي لبدء تسجيل عمليات البيع." : "Enter opening float to begin selling."}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">{t("openingBalance")}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={cashMovementAmount}
                    onChange={(e) => setCashMovementAmount(e.target.value)}
                    placeholder="50.000"
                    className="w-full bg-slate-950 border border-slate-750 text-white font-mono text-lg rounded-xl p-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenNewShift}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  {t("openShift")}
                </button>
              </div>
            ) : (
              // Active Shift Overview & Controls
              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400">{t("openingBalance")}</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">{activeShift.openingCash.toFixed(3)}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[11px] text-emerald-400">{t("payCash")}</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{activeShift.totalSalesCash.toFixed(3)}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[11px] text-indigo-400">{t("payCard")}</p>
                    <p className="text-sm font-bold text-indigo-400 font-mono mt-0.5">{activeShift.totalSalesCard.toFixed(3)}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400">{language === "ar" ? "عدد الفواتير" : "Orders"}</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">{activeShift.ordersCount}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center col-span-2">
                    <p className="text-[11px] text-amber-400 font-bold">{t("expectedCash")}</p>
                    <p className="text-base font-black text-amber-400 font-mono mt-0.5">
                      {activeShift.expectedCash.toFixed(3)} <span className="text-xs font-normal text-slate-400">{currency}</span>
                    </p>
                  </div>
                </div>

                {/* Cash In / Out Form */}
                <form onSubmit={handleCashMovement} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">{language === "ar" ? "سحب أو إيداع نقدي بالصندوق" : "Cash In / Out"}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCashMovementType("IN")}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${cashMovementType === "IN" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}
                      >
                        {t("cashIn")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashMovementType("OUT")}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${cashMovementType === "OUT" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                      >
                        {t("cashOut")}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.001"
                      value={cashMovementAmount}
                      onChange={(e) => setCashMovementAmount(e.target.value)}
                      placeholder={language === "ar" ? "المبلغ..." : "Amount..."}
                      className="bg-slate-900 border border-slate-700 text-white rounded-xl p-2 outline-none font-mono"
                    />
                    <input
                      type="text"
                      value={cashMovementReason}
                      onChange={(e) => setCashMovementReason(e.target.value)}
                      placeholder={language === "ar" ? "السبب (مثلاً: عهدة، صيانة)..." : "Reason..."}
                      className="bg-slate-900 border border-slate-700 text-white rounded-xl p-2 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold transition-colors cursor-pointer"
                  >
                    {language === "ar" ? "تسجيل حركة النقدية" : "Record Movement"}
                  </button>
                </form>

                {/* Close Shift Section */}
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-rose-300">{t("closeShift")}</h4>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300 block">{t("actualCash")}</label>
                    <input
                      type="number"
                      step="0.001"
                      value={shiftClosingActualCash}
                      onChange={(e) => setShiftClosingActualCash(e.target.value)}
                      placeholder={activeShift.expectedCash.toFixed(3)}
                      className="w-full bg-slate-950 border border-slate-750 text-white font-mono rounded-xl p-2.5 outline-none focus:border-rose-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseShift}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    {t("closeShift")}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Thermal Receipt Print & Preview Modal (إيصال الكاشير الحراري 80mm)    */}
      {/* ========================================================================= */}
      {completedOrderForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[95vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{t("orderCompleted")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletedOrderForReceipt(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Paper Layout (80mm Style) */}
            <div className="flex-1 overflow-y-auto bg-white text-slate-900 p-4 rounded-2xl shadow-inner font-mono text-xs space-y-3 selection:bg-slate-300">
              
              {/* Header Info */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
                <h2 className="text-sm font-black text-slate-950">{companySettings?.companyName}</h2>
                <p className="text-[10px] text-slate-600">{companySettings?.tagline}</p>
                <p className="text-[10px] text-slate-700">{completedOrderForReceipt.branchName} • {companySettings?.phone}</p>
                {companySettings?.taxId && (
                  <p className="text-[10px] font-bold text-slate-800">الرقم الضريبي: {companySettings.taxId}</p>
                )}
                {companySettings?.crNumber && (
                  <p className="text-[10px] text-slate-600">السجل التجاري: {companySettings.crNumber}</p>
                )}
              </div>

              {/* Order Metadata */}
              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>رقم الفاتورة:</span>
                  <span className="font-bold">{completedOrderForReceipt.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ والوقت:</span>
                  <span>{completedOrderForReceipt.date} {completedOrderForReceipt.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>الكاشير:</span>
                  <span>{completedOrderForReceipt.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <span>{completedOrderForReceipt.customerName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-b border-dashed border-slate-400 pb-2">
                <table className="w-full text-start text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1 text-start">البند</th>
                      <th className="py-1 text-center">الكمية</th>
                      <th className="py-1 text-end">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedOrderForReceipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">@{item.unitPrice.toFixed(3)}</p>
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-end font-bold font-mono">
                          {(item.quantity * item.unitPrice).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{completedOrderForReceipt.subtotal.toFixed(3)} {currency}</span>
                </div>
                {completedOrderForReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>الخصم:</span>
                    <span className="font-mono">-{completedOrderForReceipt.discountAmount.toFixed(3)} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة (5%):</span>
                  <span className="font-mono">{completedOrderForReceipt.taxAmount.toFixed(3)} {currency}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-300">
                  <span>الصافي الإجمالي:</span>
                  <span className="font-mono">{completedOrderForReceipt.totalAmount.toFixed(3)} {currency}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold">{completedOrderForReceipt.paymentMethod}</span>
                </div>
                {completedOrderForReceipt.paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between">
                      <span>المستلم نقداً:</span>
                      <span className="font-mono">{completedOrderForReceipt.cashReceived.toFixed(3)} {currency}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>الباقي للعميل:</span>
                      <span className="font-mono">{completedOrderForReceipt.changeDue.toFixed(3)} {currency}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Notice */}
              <div className="text-center pt-2 text-[9px] text-slate-600 space-y-1">
                <p className="font-bold">شكراً لتعاملكم معنا - نسعد بخدمتكم دائماً</p>
                <p>البضاعة المباعة ترد وتستبدل خلال 3 أيام بموجب أصل الفاتورة</p>
              </div>

            </div>

            {/* Print & Share Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t("printThermalReceipt")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = encodeURIComponent(
                    `مرحباً، إشعار فاتورة شراء رقم ${completedOrderForReceipt.orderNumber} بمبلغ ${completedOrderForReceipt.totalAmount.toFixed(3)} ${currency}. شكراً لتعاملكم مع ${companySettings?.companyName || "مؤسستنا"}.`
                  );
                  window.open(`https://wa.me/?text=${msg}`, "_blank");
                }}
                className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer"
                title="مشاركة عبر واتساب"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Custom Item Quick Entry Modal                                          */}
      {/* ========================================================================= */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{t("customItem")}</h3>
              <button
                type="button"
                onClick={() => setIsCustomItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">{language === "ar" ? "اسم البند أو الخدمة" : "Item / Service Name"}</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={language === "ar" ? "مثال: خدمة برمجة وتركيب، كابل إضافي..." : "e.g. Installation Service"}
                  className="w-full bg-slate-950 border border-slate-750 text-white rounded-xl p-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">{language === "ar" ? "سعر الوحدة" : "Unit Price"}</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="10.000"
                    className="w-full bg-slate-950 border border-slate-750 text-white font-mono rounded-xl p-3 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">{language === "ar" ? "الكمية" : "Quantity"}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-750 text-white font-mono rounded-xl p-3 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-all cursor-pointer"
                >
                  {language === "ar" ? "إضافة إلى السلة" : "Add to Cart"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Barcode Scanner Camera & Manual Entry Modal                            */}
      {/* ========================================================================= */}
      {isBarcodeModalOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          onScanSuccess={(detectedCode) => {
            playBeep("beep");
            handleBarcodeSubmit(detectedCode);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. Quick New Customer Creation Modal                                      */}
      {/* ========================================================================= */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span>{t("addNewCustomer")}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">{language === "ar" ? "اسم العميل أو الشركة" : "Customer / Company Name"}</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={language === "ar" ? "مثال: مؤسسة النور الحديثة" : "Customer Name"}
                  className="w-full bg-slate-950 border border-slate-750 text-white rounded-xl p-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">{language === "ar" ? "رقم الهاتف / واتساب" : "Phone"}</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+968 9XXXXXXX"
                    className="w-full bg-slate-950 border border-slate-750 text-white rounded-xl p-3 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">{language === "ar" ? "الرقم الضريبي (اختياري)" : "Tax ID (Optional)"}</label>
                  <input
                    type="text"
                    value={newCustTaxId}
                    onChange={(e) => setNewCustTaxId(e.target.value)}
                    placeholder="OM-TAX-XXXX"
                    className="w-full bg-slate-950 border border-slate-750 text-white rounded-xl p-3 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-all cursor-pointer"
                >
                  {language === "ar" ? "حفظ وتعيين للفاتورة" : "Save & Set Active"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Held Orders Switcher Modal                                             */}
      {/* ========================================================================= */}
      {isHeldCartsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-400" />
                <span>{t("heldOrders")} ({heldCarts.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHeldCartsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {heldCarts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {language === "ar" ? "لا توجد طلبات معلقة حالياً" : "No held orders currently"}
                </div>
              ) : (
                heldCarts.map((held) => {
                  const heldSubtotal = held.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
                  return (
                    <div
                      key={held.id}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{held.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {held.items.length} {language === "ar" ? "أصناف" : "items"} • {heldSubtotal.toFixed(3)} {currency}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(held.heldAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRecallHeldCart(held)}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{t("recallOrder")}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. POS Sales History & Refunds Archive Modal                              */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">{t("orderHistory")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs text-start">
                <thead className="text-[11px] text-slate-400 bg-slate-950 sticky top-0">
                  <tr className="border-b border-slate-800">
                    <th className="p-3 text-start">رقم الطلب</th>
                    <th className="p-3 text-start">التاريخ والوقت</th>
                    <th className="p-3 text-start">العميل</th>
                    <th className="p-3 text-start">طريقة الدفع</th>
                    <th className="p-3 text-start">الإجمالي</th>
                    <th className="p-3 text-start">الحالة</th>
                    <th className="p-3 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {posOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">{ord.orderNumber}</td>
                      <td className="p-3 text-slate-400 font-mono">{ord.date} {ord.time}</td>
                      <td className="p-3 text-slate-300">{ord.customerName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {ord.totalAmount.toFixed(3)} {currency}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === "REFUNDED"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {ord.status === "REFUNDED" ? "مسترجع (Refunded)" : "مكتمل (Paid)"}
                        </span>
                      </td>
                      <td className="p-3 text-end space-x-1 rtl:space-x-reverse">
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedOrderForReceipt(ord);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                          title="معاينة وطباعة الإيصال"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {ord.status !== "REFUNDED" && (
                          <button
                            type="button"
                            onClick={() => handleRefundOrder(ord)}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                            title="استرجاع الفاتورة للمخزن"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. Keyboard Shortcuts Guide Modal                                         */}
      {/* ========================================================================= */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>{t("posShortcuts")}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: "F2", desc: language === "ar" ? "التركيز على شريط البحث" : "Focus Search bar" },
                { key: "F4", desc: language === "ar" ? "إضافة بند يدوي حر" : "Add Custom Item" },
                { key: "F7", desc: language === "ar" ? "إدارة وردية الكاشير والصندوق" : "Cashier Shift / Drawer" },
                { key: "F8", desc: language === "ar" ? "تعليق الطلب الحالي" : "Hold Current Cart" },
                { key: "F9", desc: language === "ar" ? "دفع فوري بالبطاقة / شبكة" : "Pay with Card / Mada" },
                { key: "F10", desc: language === "ar" ? "دفع فوري نقداً (Cash)" : "Pay with Cash" },
                { key: "Esc", desc: language === "ar" ? "إغلاق النوافذ المنبثقة" : "Close active modal" }
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 font-mono font-bold">{s.key}</span>
                  <span className="text-slate-300">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
