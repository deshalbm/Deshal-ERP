import React, { useState, useMemo } from "react";
import {
  Customer,
  CustomerType,
  CustomerStatus,
  CustomerInteraction,
  ReceiptVoucher,
  LeaseContract,
  TenantSubscription,
  MembershipPackage,
  ConsultingService,
  ServiceBooking,
  RentalSpace,
  SpaceBooking,
  Branch,
  CompanySettings,
  PaymentInstallment
} from "../types";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import { addCustomerInteraction } from "../lib/supabase/crmService";
import { upsertCustomer } from "../lib/supabase/customerService";
import { generateUuid } from "../utils/uuid";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  FileCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  MessageCircle,
  ExternalLink,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  Tag,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Briefcase,
  X,
  PhoneCall,
  Calendar,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Eye,
  Award,
  Zap,
  Check,
  Share2,
  DollarSign,
  AlertTriangle,
  Bookmark,
  Home,
  CheckSquare,
  Percent,
  Receipt,
  FileSpreadsheet
} from "lucide-react";
import { ERPEmptyState } from "./common/ERPEmptyState";
import { StatusBadge } from "./common/StatusBadge";

interface CRMViewProps {
  customers: Customer[];
  vouchers: ReceiptVoucher[];
  leaseContracts?: LeaseContract[];
  subscriptions?: TenantSubscription[];
  packages?: MembershipPackage[];
  services?: ConsultingService[];
  serviceBookings?: ServiceBooking[];
  spaces?: RentalSpace[];
  spaceBookings?: SpaceBooking[];
  branches?: Branch[];
  companySettings?: CompanySettings;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onCreateVoucherForCustomer: (customer: Customer) => void;
  onViewVoucher: (voucher: ReceiptVoucher) => void;
  onSyncWithVouchers: () => void;
  defaultCurrency?: string;
  onSaveContract?: (contract: LeaseContract) => void;
  onCollectInstallment?: (contract: LeaseContract, installment: PaymentInstallment) => void;
  onSaveSubscription?: (sub: TenantSubscription) => void;
  onSaveServiceBooking?: (booking: ServiceBooking) => void;
  onOpenServiceBookingModal?: (service?: ConsultingService, client?: Customer) => void;
  onOpenTenantSubModal?: (pkg?: MembershipPackage, client?: Customer) => void;
  onOpenSpaceBookingModal?: (space?: RentalSpace, client?: Customer) => void;
  onNavigateTab?: (tab: any) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  customers,
  vouchers,
  leaseContracts = [],
  subscriptions = [],
  packages = [],
  services = [],
  serviceBookings = [],
  spaces = [],
  spaceBookings = [],
  branches = [],
  companySettings,
  onSaveCustomer,
  onDeleteCustomer,
  onCreateVoucherForCustomer,
  onViewVoucher,
  onSyncWithVouchers,
  defaultCurrency = "OMR",
  onSaveContract,
  onCollectInstallment,
  onSaveSubscription,
  onSaveServiceBooking,
  onOpenServiceBookingModal,
  onOpenTenantSubModal,
  onOpenSpaceBookingModal,
  onNavigateTab
}) => {
  const { t, language, dir, isRTL } = useLanguage();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<"ALL" | "TENANTS" | "SUBSCRIBERS" | "CORPORATE" | "VIP" | "LEAD">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "revenue" | "recent" | "vouchers" | "contracts">("revenue");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals & Profile
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<Customer | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<"overview" | "contracts" | "subscriptions" | "services" | "spaces" | "vouchers" | "activities">("overview");
  
  // Statement Modal
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Interaction Log Form
  const [newInteractionType, setNewInteractionType] = useState<CustomerInteraction["type"]>("CALL");
  const [newInteractionTitle, setNewInteractionTitle] = useState<string>("");
  const [newInteractionNotes, setNewInteractionNotes] = useState<string>("");

  // Helper to match customer with contracts, subscriptions, services, etc.
  const getCustomerRelations = useMemo(() => {
    const map = new Map<string, {
      contracts: LeaseContract[];
      activeContract?: LeaseContract;
      subscriptions: TenantSubscription[];
      activeSubscription?: TenantSubscription;
      serviceBookings: ServiceBooking[];
      spaceBookings: SpaceBooking[];
      vouchers: ReceiptVoucher[];
      totalPaid: number;
      totalDueInstallments: number;
      heldDeposit: number;
      isTenant: boolean;
      hasActiveSubscription: boolean;
      activeSpaceName?: string;
      activePackageName?: string;
    }>();

    customers.forEach((c) => {
      const cId = c.id;
      const cName = (c.name || "").trim().toLowerCase();
      const cPhone = (c.phone || "").replace(/\D/g, "");

      // Match Lease Contracts
      const matchedContracts = leaseContracts.filter((con) => {
        if (con.customerId && con.customerId === cId) return true;
        if (con.tenantName && con.tenantName.trim().toLowerCase() === cName) return true;
        if (con.tenantPhone && cPhone && con.tenantPhone.replace(/\D/g, "").includes(cPhone)) return true;
        return false;
      });

      const activeContract = matchedContracts.find((con) => con.status === "ACTIVE" || con.status === "EXPIRING_SOON");

      // Match Tenant Subscriptions
      const matchedSubscriptions = subscriptions.filter((sub) => {
        if (sub.customerId && sub.customerId === cId) return true;
        if (sub.customerName && sub.customerName.trim().toLowerCase() === cName) return true;
        if (sub.customerPhone && cPhone && sub.customerPhone.replace(/\D/g, "").includes(cPhone)) return true;
        return false;
      });
      const activeSubscription = matchedSubscriptions.find((sub) => sub.status === "ACTIVE");

      // Match Service Bookings
      const matchedServices = serviceBookings.filter((sb) => {
        if (sb.clientId && sb.clientId === cId) return true;
        if (sb.clientName && sb.clientName.trim().toLowerCase() === cName) return true;
        if (sb.clientPhone && cPhone && sb.clientPhone.replace(/\D/g, "").includes(cPhone)) return true;
        return false;
      });

      // Match Space Bookings
      const matchedSpaceBookings = spaceBookings.filter((spb) => {
        if (spb.customerId && spb.customerId === cId) return true;
        if (spb.customerName && spb.customerName.trim().toLowerCase() === cName) return true;
        if (spb.customerPhone && cPhone && spb.customerPhone.replace(/\D/g, "").includes(cPhone)) return true;
        return false;
      });

      // Match Receipt/Payment Vouchers
      const matchedVouchers = vouchers.filter((v) => {
        if (v.receivedFrom && v.receivedFrom.trim().toLowerCase() === cName) return true;
        if (v.payerPhone && cPhone && v.payerPhone.replace(/\D/g, "").includes(cPhone)) return true;
        if (v.paidTo && v.paidTo.trim().toLowerCase() === cName) return true;
        return false;
      });

      const totalPaid = matchedVouchers
        .filter((v) => v.type === "RECEIPT" || v.type === "TAX_INVOICE")
        .reduce((sum, v) => sum + (v.totalAmount || v.amount || 0), 0);

      // Pending installments from all contracts
      let totalDueInstallments = 0;
      matchedContracts.forEach((con) => {
        con.installments?.forEach((inst) => {
          if (inst.status === "PENDING" || inst.status === "OVERDUE") {
            totalDueInstallments += inst.totalAmount;
          }
        });
      });

      // Held Security Deposit
      let heldDeposit = 0;
      matchedContracts.forEach((con) => {
        if (con.securityDeposit?.status === "HELD_IN_CUSTODY") {
          heldDeposit += con.securityDeposit.depositAmount || 0;
        }
      });

      const isTenant = matchedContracts.length > 0 || !!activeContract || !!c.isTenant || (c.tags || []).some(t => t.includes("مستأجر"));
      const hasActiveSubscription = matchedSubscriptions.length > 0 || !!activeSubscription;

      map.set(cId, {
        contracts: matchedContracts,
        activeContract,
        subscriptions: matchedSubscriptions,
        activeSubscription,
        serviceBookings: matchedServices,
        spaceBookings: matchedSpaceBookings,
        vouchers: matchedVouchers,
        totalPaid,
        totalDueInstallments,
        heldDeposit,
        isTenant,
        hasActiveSubscription,
        activeSpaceName: activeContract ? `${activeContract.spaceName} (${activeContract.spaceCode})` : c.tenantSpaceName,
        activePackageName: activeSubscription ? activeSubscription.packageName : activeContract?.packageName || c.tenantPackageName
      });
    });

    return map;
  }, [customers, leaseContracts, subscriptions, serviceBookings, spaceBookings, vouchers]);

  // Key CRM Stats
  const stats = useMemo(() => {
    const totalClients = customers.length;
    const activeClients = customers.filter((c) => c.status === "ACTIVE").length;
    
    let tenantCount = 0;
    let subscriberCount = 0;
    let totalRevenue = 0;
    let totalPendingInstallments = 0;
    let totalHeldDeposits = 0;

    getCustomerRelations.forEach((data) => {
      if (data.isTenant) tenantCount++;
      if (data.hasActiveSubscription) subscriberCount++;
      totalRevenue += data.totalPaid;
      totalPendingInstallments += data.totalDueInstallments;
      totalHeldDeposits += data.heldDeposit;
    });

    const totalInteractions = customers.reduce((acc, c) => acc + (c.interactions?.length || 0), 0);

    return {
      totalClients,
      activeClients,
      tenantCount,
      subscriberCount,
      totalRevenue,
      totalPendingInstallments,
      totalHeldDeposits,
      totalInteractions
    };
  }, [customers, getCustomerRelations]);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const rel = getCustomerRelations.get(c.id);

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (c.name || "").toLowerCase().includes(q);
          const matchPhone = (c.phone || "").toLowerCase().includes(q);
          const matchEmail = (c.email || "").toLowerCase().includes(q);
          const matchContact = (c.contactPerson || "").toLowerCase().includes(q);
          const matchCR = (c.crNumber || "").toLowerCase().includes(q);
          const matchTax = (c.taxId || "").toLowerCase().includes(q);
          const matchTag = c.tags?.some((t) => t.toLowerCase().includes(q));
          const matchSpace = rel?.activeSpaceName?.toLowerCase().includes(q);
          const matchPkg = rel?.activePackageName?.toLowerCase().includes(q);
          const matchContractNum = rel?.contracts.some(con => con.contractNumber.toLowerCase().includes(q));

          if (!matchName && !matchPhone && !matchEmail && !matchContact && !matchCR && !matchTax && !matchTag && !matchSpace && !matchPkg && !matchContractNum) {
            return false;
          }
        }

        // Category Tab filter
        if (activeCategoryTab === "TENANTS") {
          if (!rel?.isTenant) return false;
        } else if (activeCategoryTab === "SUBSCRIBERS") {
          if (!rel?.hasActiveSubscription) return false;
        } else if (activeCategoryTab === "CORPORATE") {
          if (c.type !== "CORPORATE") return false;
        } else if (activeCategoryTab === "VIP") {
          if (c.type !== "VIP") return false;
        } else if (activeCategoryTab === "LEAD") {
          if (c.status !== "LEAD" && c.status !== "PROSPECT") return false;
        }

        // Status filter
        if (selectedStatus !== "ALL" && c.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const relA = getCustomerRelations.get(a.id);
        const relB = getCustomerRelations.get(b.id);

        if (sortBy === "revenue") {
          return (relB?.totalPaid || 0) - (relA?.totalPaid || 0);
        } else if (sortBy === "contracts") {
          return (relB?.contracts.length || 0) - (relA?.contracts.length || 0);
        } else if (sortBy === "vouchers") {
          return (relB?.vouchers.length || 0) - (relA?.vouchers.length || 0);
        } else if (sortBy === "recent") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return a.name.localeCompare(b.name, "ar");
        }
      });
  }, [customers, searchQuery, activeCategoryTab, selectedStatus, sortBy, getCustomerRelations]);

  // Handler: Open Add Modal
  const handleOpenAddModal = (presetTenant: boolean = false) => {
    setEditingCustomer({
      id: generateUuid(),
      name: "",
      contactPerson: "",
      phone: "+968 ",
      email: "",
      address: "",
      city: "صحار",
      country: "سلطنة عمان",
      taxId: "",
      crNumber: "",
      type: presetTenant ? "CORPORATE" : "CORPORATE",
      status: "ACTIVE",
      notes: presetTenant ? "مستأجر جديد - مساحات العمل والمكاتب" : "",
      tags: presetTenant ? ["مستأجر", "مكتب"] : ["عميل"],
      creditLimit: 10000,
      assignedProject: "",
      isTenant: presetTenant,
      interactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsAddEditModalOpen(true);
  };

  // Handler: Open Edit Modal
  const handleOpenEditModal = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer({ ...customer });
    setIsAddEditModalOpen(true);
  };

  // Handler: Save Customer
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) {
      alert("يرجى إدخال اسم العميل أو الشركة");
      return;
    }
    const customerToSave: Customer = {
      ...editingCustomer,
      updatedAt: new Date().toISOString()
    };
    onSaveCustomer(customerToSave);
    const targetCompanyId = (companySettings as any)?.companyId || "00000000-0000-0000-0000-000000000001";
    upsertCustomer(customerToSave, targetCompanyId).catch(console.error);
    setIsAddEditModalOpen(false);
    if (selectedCustomerProfile && selectedCustomerProfile.id === customerToSave.id) {
      setSelectedCustomerProfile(customerToSave);
    }
  };

  // Handler: Add Interaction to Profile
  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerProfile || !newInteractionTitle.trim()) return;

    const newActivity: CustomerInteraction = {
      id: `act-${Date.now()}`,
      date: new Date().toISOString(),
      type: newInteractionType,
      title: newInteractionTitle.trim(),
      notes: newInteractionNotes.trim(),
      createdByName: "إدارة علاقات المستأجرين والعملاء"
    };

    const updatedCustomer: Customer = {
      ...selectedCustomerProfile,
      interactions: [newActivity, ...(selectedCustomerProfile.interactions || [])],
      updatedAt: new Date().toISOString()
    };

    onSaveCustomer(updatedCustomer);
    setSelectedCustomerProfile(updatedCustomer);

    // Sync interaction and updated customer to Supabase
    const targetCompanyId = (companySettings as any)?.companyId || "00000000-0000-0000-0000-000000000001";
    addCustomerInteraction(selectedCustomerProfile.id, newActivity, targetCompanyId).catch(console.error);
    upsertCustomer(updatedCustomer, targetCompanyId).catch(console.error);

    setNewInteractionTitle("");
    setNewInteractionNotes("");
  };

  // Export CSV of Clients & Tenants
  const handleExportCSV = () => {
    const headers = ["الاسم", "نوع العميل", "الحالة", "هل هو مستأجر", "الوحدة المؤجرة", "الباقة النشطة", "الهاتف", "البريد", "المدينة", "السجل التجاري", "الرقم الضريبي", "إجمالي التحصيل", "الأقساط المستحقة", "التأمين المحتجز", "عدد العقود", "عدد السندات"];
    const rows = filteredCustomers.map((c) => {
      const rel = getCustomerRelations.get(c.id);
      return [
        `"${c.name}"`,
        `"${c.type}"`,
        `"${c.status}"`,
        `"${rel?.isTenant ? "نعم" : "لا"}"`,
        `"${rel?.activeSpaceName || ""}"`,
        `"${rel?.activePackageName || ""}"`,
        `"${c.phone}"`,
        `"${c.email}"`,
        `"${c.city || ""}"`,
        `"${c.crNumber || ""}"`,
        `"${c.taxId || ""}"`,
        (rel?.totalPaid || 0).toFixed(3),
        (rel?.totalDueInstallments || 0).toFixed(3),
        (rel?.heldDeposit || 0).toFixed(3),
        rel?.contracts.length || 0,
        rel?.vouchers.length || 0
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_tenants_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick WhatsApp sender
  const handleWhatsAppSend = (customer: Customer, templateType: "GREETING" | "RENT_DUE" | "PACKAGE" | "GENERAL" = "GENERAL") => {
    const rel = getCustomerRelations.get(customer.id);
    let msg = `مرحباً ${customer.contactPerson || customer.name}، تحية طيبة من إدارة مساحات العمل والخدمات.`;
    
    if (templateType === "RENT_DUE" && rel?.activeContract) {
      msg = `مرحباً ${customer.contactPerson || customer.name}، نود تذكيركم بموعد استحقاق الدفعة الإيجارية للوحدة (${rel.activeContract.spaceName}) - عقد رقم (${rel.activeContract.contractNumber}). شاكرين لكم حسن تعاونكم.`;
    } else if (templateType === "PACKAGE" && rel?.activeSubscription) {
      msg = `مرحباً ${customer.contactPerson || customer.name}، نود إحاطتكم بأن رصيد باقتكم الشهرية (${rel.activeSubscription.packageName}) متاح لاستخدام القاعات والاستشارات. نتمنى لكم يوماً مثمراً.`;
    }

    const cleanPhone = (customer.phone || "").replace(/\D/g, "");
    const targetUrl = cleanPhone.length > 6
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(targetUrl, "_blank");
  };

  // Open Full Statement
  const handleOpenStatement = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStatementCustomer(customer);
    setIsStatementModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" dir={dir}>
      
      {/* 1. Header & Summary Metrics */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
                  إدارة العملاء والمستأجرين (CRM 360°)
                </h1>
                <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  Unified CRM & Tenant Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                سجل متكامل وشامل لجميع العملاء والمستأجرين، عقود الإيجار، الباقات الشهرية، الخدمات الاستشارية، وسندات القبض.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAddModal(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all shadow-md shadow-indigo-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>

            <button
              onClick={() => handleOpenAddModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all shadow-md shadow-emerald-200 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>+ إضافة مستأجر</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="تصدير كشف العملاء والمستأجرين CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onSyncWithVouchers}
              className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="مزامنة وتحديث السجلات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold">إجمالي السجل</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-900">{stats.totalClients}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{stats.activeClients} نشط ومفعل</div>
          </div>

          <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-[11px] font-bold">المستأجرون</span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-indigo-950">{stats.tenantCount}</div>
            <div className="text-[10px] text-indigo-600 mt-0.5">عقود مكاتب ومساحات</div>
          </div>

          <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between text-purple-700 mb-1">
              <span className="text-[11px] font-bold">مشتركو الباقات</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-black text-purple-950">{stats.subscriberCount}</div>
            <div className="text-[10px] text-purple-600 mt-0.5">اشتراكات دورية نشطة</div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-bold">إجمالي التحصيل</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-950">
              {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{defaultCurrency} بسندات معتمدة</div>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-bold">أقساط إيجار مستحقة</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-amber-950">
              {stats.totalPendingInstallments.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">{defaultCurrency} دفعات قادمة</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-[11px] font-bold">الضمانات المحتجزة</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-blue-950">
              {stats.totalHeldDeposits.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">{defaultCurrency} تأمينات مستردة</div>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveCategoryTab("ALL")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategoryTab === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>جميع العملاء ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("TENANTS")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategoryTab === "TENANTS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>المستأجرون النشطون ({stats.tenantCount})</span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("SUBSCRIBERS")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategoryTab === "SUBSCRIBERS"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/50"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>مشتركو الباقات ({stats.subscriberCount})</span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("CORPORATE")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategoryTab === "CORPORATE"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>الشركات والمؤسسات</span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("VIP")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategoryTab === "VIP"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>عملاء VIP</span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("LEAD")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategoryTab === "LEAD"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>عملاء محتملون (Leads)</span>
          </button>
        </div>

        {/* Search, Sort, View Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، رقم الهاتف، السجل التجاري، اسم المكتب/القاعة، رقم العقد أو الباقة..."
              className="w-full pl-4 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">نشط (Active)</option>
              <option value="LEAD">محتمل (Lead)</option>
              <option value="PROSPECT">قيد التفاوض</option>
              <option value="INACTIVE">غير نشط</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="revenue">الأعلى تحصيلاً</option>
              <option value="contracts">الأكثر عقوداً</option>
              <option value="vouchers">الأكثر سندات</option>
              <option value="recent">الأحدث تسجيلاً</option>
              <option value="name">أبجدياً (أ-ي)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                }`}
                title="عرض بطاقات"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                }`}
                title="عرض جدول"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Main Customer List / Grid */}
      {filteredCustomers.length === 0 ? (
        <ERPEmptyState
          icon={Users}
          titleAr="لم يتم العثور على عملاء أو مستأجرين مطابقة"
          titleEn="No customers or tenants found"
          descriptionAr={
            searchQuery || activeCategoryTab !== "ALL"
              ? "لم تظهر نتائج تطابق معايير البحث أو التصفية الحالية. جرب البحث برقم هاتف آخر أو إعادة ضبط الفلاتر."
              : "لم تقم بتسجيل أي عملاء أو مستأجرين حتى الآن. ابدأ بإضافة بيانات العميل لربط السندات والعقود تلقائياً."
          }
          descriptionEn="No matching customer records found. Try adjusting your filters or create a new profile."
          actionLabelAr="+ إضافة عميل جديد"
          actionLabelEn="+ Add New Customer"
          onAction={() => handleOpenAddModal(false)}
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const rel = getCustomerRelations.get(customer.id);
            const cleanPhone = (customer.phone || "").replace(/[^0-9+]/g, "");

            return (
              <div
                key={customer.id}
                onClick={() => {
                  setSelectedCustomerProfile(customer);
                  setProfileActiveTab("overview");
                }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1.5 ${
                    rel?.isTenant
                      ? "bg-indigo-600"
                      : customer.type === "VIP"
                      ? "bg-amber-500"
                      : customer.status === "ACTIVE"
                      ? "bg-emerald-500"
                      : customer.status === "LEAD"
                      ? "bg-blue-500"
                      : "bg-slate-300"
                  }`}
                />

                <div>
                  {/* Header Badges & Actions */}
                  <div className="flex items-start justify-between gap-2 mt-1 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rel?.isTenant && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>مستأجر</span>
                        </span>
                      )}

                      {rel?.hasActiveSubscription && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>مشترك باقة</span>
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          customer.type === "VIP"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : customer.type === "GOVERNMENT"
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {customer.type === "VIP" ? "VIP" : customer.type === "CORPORATE" ? "شركة" : "فردي"}
                      </span>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          customer.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : customer.status === "LEAD"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {customer.status === "ACTIVE" ? "نشط" : customer.status === "LEAD" ? "محتمل" : customer.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenStatement(customer, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="كشف حساب العميل والمستأجر"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleOpenEditModal(customer, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="تعديل العميل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
                            onDeleteCustomer(customer.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف العميل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Name */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {customer.name}
                  </h3>
                  {customer.contactPerson && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      المسؤول: <span className="text-slate-700">{customer.contactPerson}</span>
                    </p>
                  )}

                  {/* Highlight Tenant Leased Space or Active Package */}
                  {rel?.activeSpaceName && (
                    <div className="mt-2 p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs">
                      <Home className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block font-bold">العين المؤجرة:</span>
                        <span className="font-bold text-indigo-950 truncate">{rel.activeSpaceName}</span>
                      </div>
                    </div>
                  )}

                  {rel?.activePackageName && !rel?.activeSpaceName && (
                    <div className="mt-2 p-2 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center gap-2 text-xs">
                      <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block font-bold">الباقة النشطة:</span>
                        <span className="font-bold text-purple-950 truncate">{rel.activePackageName}</span>
                      </div>
                    </div>
                  )}

                  {/* Contact Direct Links */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    {customer.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-slate-800 text-[11px]">{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleWhatsAppSend(customer, "GENERAL")}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="محادثة واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="اتصال هاتفي"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}

                    {customer.city && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.city} {customer.address ? `• ${customer.address}` : ""}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Footer & Fast Action */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">إجمالي التحصيل</span>
                      <span className="font-black text-slate-900 text-sm">
                        {(rel?.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}{" "}
                        <span className="text-[10px] font-semibold text-slate-500">{defaultCurrency}</span>
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 font-bold block">العقود والسندات</span>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {rel && rel.contracts.length > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                            {rel.contracts.length} عقد
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                          {rel?.vouchers.length || 0} سند
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onCreateVoucherForCustomer(customer)}
                      className="py-2 px-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1 space-x-reverse transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>تحرير سند</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCustomerProfile(customer);
                        setProfileActiveTab(rel?.isTenant ? "contracts" : "overview");
                      }}
                      className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1 space-x-reverse transition-colors cursor-pointer border border-indigo-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>الملف الشامل 360°</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="px-4 py-3">العميل / المنشأة</th>
                  <th className="px-4 py-3">التصنيف والصفة</th>
                  <th className="px-4 py-3">الوحدة أو الباقة</th>
                  <th className="px-4 py-3">معلومات التواصل</th>
                  <th className="px-4 py-3 text-center">العقود والسندات</th>
                  <th className="px-4 py-3 text-left">إجمالي المسدد</th>
                  <th className="px-4 py-3 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((customer) => {
                  const rel = getCustomerRelations.get(customer.id);
                  const cleanPhone = (customer.phone || "").replace(/[^0-9+]/g, "");

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomerProfile(customer);
                        setProfileActiveTab("overview");
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                        {customer.contactPerson && (
                          <div className="text-[11px] text-slate-500">{customer.contactPerson}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          {rel?.isTenant ? (
                            <span className="px-2 py-0.5 text-[9px] font-black rounded bg-indigo-100 text-indigo-800">
                              مستأجر
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-700">
                              {customer.type}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                              customer.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {rel?.activeSpaceName ? (
                          <span className="font-bold text-indigo-900 text-[11px] block">{rel.activeSpaceName}</span>
                        ) : rel?.activePackageName ? (
                          <span className="font-bold text-purple-900 text-[11px] block">{rel.activePackageName}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-800 text-xs">{customer.phone}</div>
                        <div className="text-slate-400 text-[11px]">{customer.email || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {rel && rel.contracts.length > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">
                              {rel.contracts.length} عقد
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                            {rel?.vouchers.length || 0} سند
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-left font-bold text-slate-900 text-sm">
                        {(rel?.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}{" "}
                        <span className="text-[10px] font-normal text-slate-500">{defaultCurrency}</span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onCreateVoucherForCustomer(customer)}
                            title="تحرير سند قبض"
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleWhatsAppSend(customer, "GENERAL")}
                            title="واتساب"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenStatement(customer, e)}
                            title="كشف الحساب"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenEditModal(customer, e)}
                            title="تعديل"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* 4. MODAL: Add / Edit Customer */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 relative"
            dir="rtl"
          >
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCustomer.id && customers.some((c) => c.id === editingCustomer.id)
                    ? "تعديل بيانات العميل / المستأجر"
                    : "إضافة عميل / مستأجر جديد"}
                </h2>
                <p className="text-xs text-slate-500">سجل وتوثيق بيانات المنشأة لإدارة العقود، الباقات والربط التلقائي بالسندات</p>
              </div>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              
              {/* Row 1: Name & Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم العميل / المستأجر / الشركة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    placeholder="مثال: شركة الدليل الشامل للحلول"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشخص المسؤول / المفوض بالتوقيع</label>
                  <input
                    type="text"
                    value={editingCustomer.contactPerson || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, contactPerson: e.target.value })}
                    placeholder="مثال: المهندس / أحمد الحوسني"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    رقم الهاتف / الواتساب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="+968 77627500"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    placeholder="info@company.com"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: City & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة / الفرع</label>
                  <input
                    type="text"
                    value={editingCustomer.city || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                    placeholder="صحار / مسقط / لوى"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">العنوان التفصيلي</label>
                  <input
                    type="text"
                    value={editingCustomer.address || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    placeholder="مبنى الأعمال - صحار"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Commercial Register & Tax ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السجل التجاري (CR Number)</label>
                  <input
                    type="text"
                    value={editingCustomer.crNumber || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, crNumber: e.target.value })}
                    placeholder="CR-1092831"
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الضريبي (VAT ID)</label>
                  <input
                    type="text"
                    value={editingCustomer.taxId || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, taxId: e.target.value })}
                    placeholder="OM-TAX-7762"
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Type, Status, Is Tenant */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الكيان</label>
                  <select
                    value={editingCustomer.type}
                    onChange={(e: any) => setEditingCustomer({ ...editingCustomer, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="CORPORATE">شركة / مؤسسة</option>
                    <option value="INDIVIDUAL">فرد / رائد أعمال</option>
                    <option value="VIP">عميل VIP مميز</option>
                    <option value="GOVERNMENT">جهة حكومية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة العميل</label>
                  <select
                    value={editingCustomer.status}
                    onChange={(e: any) => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVE">نشط ومفعل</option>
                    <option value="LEAD">عميل محتمل (Lead)</option>
                    <option value="PROSPECT">قيد التفاوض</option>
                    <option value="INACTIVE">غير نشط</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">صفة المستأجر</label>
                  <div className="flex items-center h-9 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingCustomer.isTenant || false}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, isTenant: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="font-bold text-indigo-950 text-xs">تصنيف كمستأجر معتمد</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وشروط إضافية</label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="أي اتفاقيات أو تفاصيل تعاقدية..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-indigo-200 cursor-pointer"
                >
                  حفظ العميل
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL / DRAWER: Customer 360° Profile (Unified CRM & Tenant Dossier) */}
      {/* ========================================================================= */}
      {selectedCustomerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] overflow-hidden flex flex-col border border-slate-200 relative"
            dir="rtl"
          >
            {/* Drawer Header */}
            {(() => {
              const rel = getCustomerRelations.get(selectedCustomerProfile.id);
              const cleanPhone = (selectedCustomerProfile.phone || "").replace(/[^0-9+]/g, "");

              return (
                <>
                  <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                        {rel?.isTenant ? <Building2 className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white">{selectedCustomerProfile.name}</h2>
                          {rel?.isTenant && (
                            <span className="px-2 py-0.5 text-[10px] font-black rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              مستأجر معتمد
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                            {selectedCustomerProfile.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {selectedCustomerProfile.city || "سلطنة عمان"} • {selectedCustomerProfile.phone}
                          {rel?.activeSpaceName ? ` • العين المؤجرة: ${rel.activeSpaceName}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenStatement(selectedCustomerProfile)}
                        className="hidden sm:flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700 cursor-pointer"
                        title="كشف حساب العميل والمستأجر"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>كشف الحساب</span>
                      </button>

                      <button
                        onClick={() => onCreateVoucherForCustomer(selectedCustomerProfile)}
                        className="hidden sm:flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>سند جديد</span>
                      </button>

                      <button
                        onClick={() => setSelectedCustomerProfile(null)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Profile Navigation Tabs */}
                  <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold shrink-0 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setProfileActiveTab("overview")}
                      className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        profileActiveTab === "overview"
                          ? "border-indigo-600 text-indigo-600 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>الملف العام والبيانات</span>
                    </button>

                    <button
                      onClick={() => setProfileActiveTab("contracts")}
                      className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        profileActiveTab === "contracts"
                          ? "border-indigo-600 text-indigo-600 bg-white font-black"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>عقود الإيجار ({rel?.contracts.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setProfileActiveTab("subscriptions")}
                      className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        profileActiveTab === "subscriptions"
                          ? "border-indigo-600 text-indigo-600 bg-white font-black"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>الباقات والاشتراكات ({rel?.subscriptions.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setProfileActiveTab("services")}
                      className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        profileActiveTab === "services"
                          ? "border-indigo-600 text-indigo-600 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>الخدمات الاستشارية ({rel?.serviceBookings.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setProfileActiveTab("spaces")}
                      className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        profileActiveTab === "spaces"
                          ? "border-indigo-600 text-indigo-600 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>حجوزات القاعات ({rel?.spaceBookings.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setProfileActiveTab("vouchers")}
                      className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        profileActiveTab === "vouchers"
                          ? "border-indigo-600 text-indigo-600 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>السندات والمالية ({rel?.vouchers.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setProfileActiveTab("activities")}
                      className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        profileActiveTab === "activities"
                          ? "border-indigo-600 text-indigo-600 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>سجل التتبع ({selectedCustomerProfile.interactions?.length || 0})</span>
                    </button>
                  </div>

                  {/* Profile Content Body */}
                  <div className="p-6 overflow-y-auto flex-1 text-xs">
                    
                    {/* TAB 1: OVERVIEW */}
                    {profileActiveTab === "overview" && (
                      <div className="space-y-6">
                        
                        {/* Financial Stats Ribbon */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold">إجمالي المبالغ المسددة</p>
                            <h4 className="text-base sm:text-lg font-black text-indigo-950 mt-0.5">
                              {(rel?.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}{" "}
                              <span className="text-xs font-semibold">{defaultCurrency}</span>
                            </h4>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-500 font-bold">أقساط إيجار مستحقة</p>
                            <h4 className="text-base sm:text-lg font-black text-amber-900 mt-0.5">
                              {(rel?.totalDueInstallments || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}{" "}
                              <span className="text-xs font-semibold">{defaultCurrency}</span>
                            </h4>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-500 font-bold">الضمان المالي (التأمين)</p>
                            <h4 className="text-base sm:text-lg font-black text-blue-900 mt-0.5">
                              {(rel?.heldDeposit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}{" "}
                              <span className="text-xs font-semibold">{defaultCurrency}</span>
                            </h4>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-500 font-bold">إجمالي السندات</p>
                            <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                              {rel?.vouchers.length || 0} سند رسمي
                            </h4>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                              <Phone className="w-4 h-4 text-indigo-600" />
                              <span>بيانات الاتصال والتواصل</span>
                            </h4>
                            <p><span className="text-slate-500">الهاتف:</span> <span className="font-mono font-bold text-slate-800">{selectedCustomerProfile.phone}</span></p>
                            <p><span className="text-slate-500">البريد:</span> <span className="font-medium text-slate-800">{selectedCustomerProfile.email || "غير مسجل"}</span></p>
                            <p><span className="text-slate-500">المسؤول / المفوض:</span> <span className="font-medium text-slate-800">{selectedCustomerProfile.contactPerson || "غير محدد"}</span></p>
                            <p><span className="text-slate-500">العنوان / المدينة:</span> <span className="font-medium text-slate-800">{selectedCustomerProfile.city} • {selectedCustomerProfile.address || "غير مسجل"}</span></p>
                          </div>

                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-indigo-600" />
                              <span>البيانات الرسمية والصفة</span>
                            </h4>
                            <p><span className="text-slate-500">السجل التجاري:</span> <span className="font-mono font-bold text-slate-800">{selectedCustomerProfile.crNumber || "CR-N/A"}</span></p>
                            <p><span className="text-slate-500">الرقم الضريبي:</span> <span className="font-mono font-bold text-slate-800">{selectedCustomerProfile.taxId || "TAX-N/A"}</span></p>
                            <p><span className="text-slate-500">تصنيف العميل:</span> <span className="font-bold text-indigo-700">{selectedCustomerProfile.type} ({selectedCustomerProfile.status})</span></p>
                            <p><span className="text-slate-500">تاريخ التسجيل:</span> <span className="font-mono text-slate-600">{formatDateToDDMMMMYYYY(selectedCustomerProfile.createdAt.slice(0, 10))}</span></p>
                          </div>
                        </div>

                        {/* Active Leased Space Banner */}
                        {rel?.activeContract && (
                          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-indigo-950 text-sm">
                                  عقد إيجار نشط: {rel.activeContract.spaceName} ({rel.activeContract.spaceCode})
                                </h4>
                                <p className="text-xs text-indigo-700 mt-0.5">
                                  رقم العقد: <span className="font-mono font-bold">{rel.activeContract.contractNumber}</span> • المدة: {rel.activeContract.durationMonths} شهر (حتى {rel.activeContract.endDate})
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setProfileActiveTab("contracts")}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs cursor-pointer"
                            >
                              عرض تفاصيل العقد والأقساط
                            </button>
                          </div>
                        )}

                        {/* Notes */}
                        {selectedCustomerProfile.notes && (
                          <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/40">
                            <h4 className="font-bold text-amber-900 mb-1">ملاحظات واتفاقيات إضافية:</h4>
                            <p className="text-slate-700 leading-relaxed">{selectedCustomerProfile.notes}</p>
                          </div>
                        )}

                        {/* Direct Action Hub */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => onCreateVoucherForCustomer(selectedCustomerProfile)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>تحرير سند قبض جديد</span>
                          </button>

                          <button
                            onClick={() => handleOpenStatement(selectedCustomerProfile)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                            <span>كشف حساب معتمد</span>
                          </button>

                          <button
                            onClick={() => handleWhatsAppSend(selectedCustomerProfile, "GENERAL")}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>واتساب فوري</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(selectedCustomerProfile)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>تعديل الملف</span>
                          </button>
                        </div>

                      </div>
                    )}

                    {/* TAB 2: LEASE CONTRACTS */}
                    {profileActiveTab === "contracts" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">عقود الإيجار والوحدات المؤجرة</h3>
                            <p className="text-slate-500 text-xs">إدارة ومتابعة عقود المكاتب، الأقساط الشهرية، والضمانات المالية</p>
                          </div>
                          
                          {onNavigateTab && (
                            <button
                              onClick={() => {
                                setSelectedCustomerProfile(null);
                                onNavigateTab("contracts");
                              }}
                              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>إدارة العقود المركزية</span>
                            </button>
                          )}
                        </div>

                        {(!rel?.contracts || rel.contracts.length === 0) ? (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                            <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">لا توجد عقود إيجار مسجلة لهذا العميل حتى الآن</p>
                            <p className="text-xs text-slate-400 mt-1">يمكنك صياغة وتوثيق عقد إيجار مكتب أو قاعة لهذا العميل مباشرة</p>
                            {onNavigateTab && (
                              <button
                                onClick={() => {
                                  setSelectedCustomerProfile(null);
                                  onNavigateTab("contracts");
                                }}
                                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700"
                              >
                                + صياغة عقد إيجار جديد
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {rel.contracts.map((con) => (
                              <div key={con.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
                                      <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 text-sm">{con.spaceName} ({con.spaceCode})</h4>
                                        <span className={`px-2 py-0.5 text-[9px] font-black rounded ${
                                          con.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                        }`}>
                                          {con.status === "ACTIVE" ? "ساري ومعتمد" : con.status}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                        عقد رقم: <span className="text-indigo-600 font-bold">{con.contractNumber}</span> • المدة: من {con.startDate} إلى {con.endDate} ({con.durationMonths} شهر)
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-left">
                                    <span className="text-[10px] text-slate-400 font-bold block">القيمة الإجمالية للعقد</span>
                                    <span className="font-black text-indigo-950 text-sm">
                                      {con.finalContractValue.toFixed(3)} {con.currency || defaultCurrency}
                                    </span>
                                  </div>
                                </div>

                                {/* Contract Installments Schedule */}
                                <div>
                                  <h5 className="font-bold text-slate-700 text-xs mb-2 flex items-center justify-between">
                                    <span>جدول الأقساط والدفعات الإيجارية:</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      {con.installments?.filter(i => i.status === "PAID").length || 0} من {con.installments?.length || 0} مسدد
                                    </span>
                                  </h5>

                                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                    {con.installments?.map((inst) => (
                                      <div
                                        key={inst.id}
                                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                          inst.status === "PAID"
                                            ? "bg-emerald-50/40 border-emerald-200/60"
                                            : "bg-slate-50 border-slate-200"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            inst.status === "PAID" ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
                                          }`}>
                                            {inst.installmentNumber}
                                          </span>
                                          <div>
                                            <div className="font-bold text-slate-900">{inst.titleAr}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                              استحقاق: {inst.dueDate} {inst.paidDate ? `• تم السداد بتاريخ ${inst.paidDate}` : ""}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="text-left">
                                            <span className="font-black text-slate-900 block">
                                              {inst.totalAmount.toFixed(3)} {inst.currency || defaultCurrency}
                                            </span>
                                            <span className={`text-[9px] font-bold ${
                                              inst.status === "PAID" ? "text-emerald-700" : "text-amber-700"
                                            }`}>
                                              {inst.status === "PAID" ? "مدفوع بالكامل" : "مستحق السداد"}
                                            </span>
                                          </div>

                                          {inst.status !== "PAID" && onCollectInstallment && (
                                            <button
                                              onClick={() => onCollectInstallment(con, inst)}
                                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer shadow-xs"
                                              title="تحصيل وإصدار سند قبض فوري"
                                            >
                                              تحصيل
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Security Deposit Status */}
                                {con.securityDeposit && (
                                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                                      <div>
                                        <span className="font-bold text-blue-950">مبلغ التأمين والضمان المالي: </span>
                                        <span className="font-mono font-bold text-blue-900">
                                          {con.securityDeposit.depositAmount.toFixed(3)} {con.securityDeposit.currency || defaultCurrency}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-md">
                                      {con.securityDeposit.status === "HELD_IN_CUSTODY" ? "أمانة محتجزة" : con.securityDeposit.status}
                                    </span>
                                  </div>
                                )}

                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: SUBSCRIPTIONS & PACKAGES */}
                    {profileActiveTab === "subscriptions" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">باقات واشتراكات المستأجرين</h3>
                            <p className="text-slate-500 text-xs">متابعة الباقة الشهرية، حصص الساعات المجانية للقاعات، والخصومات</p>
                          </div>
                          
                          {onOpenTenantSubModal && (
                            <button
                              onClick={() => onOpenTenantSubModal(undefined, selectedCustomerProfile)}
                              className="px-3.5 py-1.5 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>+ اشتراك في باقة جديدة</span>
                            </button>
                          )}
                        </div>

                        {(!rel?.subscriptions || rel.subscriptions.length === 0) ? (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                            <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">لا توجد اشتراكات باقات نشطة لهذا العميل</p>
                            <p className="text-xs text-slate-400 mt-1">تتيح الباقات الشهرية للمستأجرين ساعات مجانية في القاعات واستشارات إدارية</p>
                            {onOpenTenantSubModal && (
                              <button
                                onClick={() => onOpenTenantSubModal(undefined, selectedCustomerProfile)}
                                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700"
                              >
                                + تفعيل باقة اشتراك
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {rel.subscriptions.map((sub) => (
                              <div key={sub.id} className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                                      <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-purple-950 text-sm">{sub.packageName}</h4>
                                        <span className="px-2 py-0.5 text-[9px] font-black rounded bg-purple-100 text-purple-800">
                                          {sub.status === "ACTIVE" ? "نشط ومفعل" : sub.status}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                        رقم الاشتراك: <span className="font-bold text-slate-700">{sub.subscriptionNumber}</span> • تجديد: {sub.billingCycle === "MONTHLY" ? "شهري" : sub.billingCycle} (ينتهي في {sub.endDate})
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Quotas Progress */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                                      <span>ساعات قاعات الاجتماعات:</span>
                                      <span className="font-mono">{sub.meetingRoomHoursUsed} / {sub.meetingRoomHoursQuota} س</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                      <div
                                        className="bg-purple-600 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (sub.meetingRoomHoursUsed / (sub.meetingRoomHoursQuota || 1)) * 100)}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                                      <span>استوديو التصوير والبودكاست:</span>
                                      <span className="font-mono">{sub.mediaStudioHoursUsed} / {sub.mediaStudioHoursQuota} س</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                      <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (sub.mediaStudioHoursUsed / (sub.mediaStudioHoursQuota || 1)) * 100)}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                                      <span>الجلسات الاستشارية:</span>
                                      <span className="font-mono">{sub.consultationSessionsUsed} / {sub.consultationSessionsQuota} جلسة</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                      <div
                                        className="bg-emerald-600 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (sub.consultationSessionsUsed / (sub.consultationSessionsQuota || 1)) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: CONSULTING & SUPPORT SERVICES */}
                    {profileActiveTab === "services" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">الخدمات الاستشارية والإدارية</h3>
                            <p className="text-slate-500 text-xs">دراسات الجدوى، استشارات مالية وضريبية، تسويق رقمي، وإجراءات PRO</p>
                          </div>
                          
                          {onOpenServiceBookingModal && (
                            <button
                              onClick={() => onOpenServiceBookingModal(undefined, selectedCustomerProfile)}
                              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>+ حجز خدمة جديدة</span>
                            </button>
                          )}
                        </div>

                        {(!rel?.serviceBookings || rel.serviceBookings.length === 0) ? (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                            <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">لم يطلب هذا العميل خدمات استشارية بعد</p>
                            {onOpenServiceBookingModal && (
                              <button
                                onClick={() => onOpenServiceBookingModal(undefined, selectedCustomerProfile)}
                                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700"
                              >
                                + طلب خدمة استشارية الآن
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {rel.serviceBookings.map((bk) => (
                              <div key={bk.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                                    <Briefcase className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-slate-900 text-xs">{bk.serviceName}</h4>
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 rounded">
                                        {bk.bookingNumber}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      الموعد: {bk.scheduledDate} {bk.scheduledTime ? `الساعة ${bk.scheduledTime}` : ""} {bk.assignedConsultant ? `• المستشار: ${bk.assignedConsultant}` : ""}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-left">
                                  <span className="font-black text-slate-900 text-xs block">
                                    {bk.totalFee.toFixed(3)} {bk.currency || defaultCurrency}
                                  </span>
                                  <span className="text-[9px] font-bold text-emerald-700">{bk.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 5: SPACES & HALLS BOOKINGS */}
                    {profileActiveTab === "spaces" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">حجوزات القاعات ومساحات العمل</h3>
                            <p className="text-slate-500 text-xs">قاعات التدريب والاجتماعات، استوديو البودكاست والمكاتب المشتركة</p>
                          </div>
                        </div>

                        {(!rel?.spaceBookings || rel.spaceBookings.length === 0) ? (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                            <Home className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">لا توجد حجوزات قاعات مسجلة</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {rel.spaceBookings.map((spb) => (
                              <div key={spb.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                    <Home className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-slate-900 text-xs">{spb.spaceName}</h4>
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                        {spb.bookingNumber}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      الفترة: {spb.startDate} {spb.startTime ? `من ${spb.startTime} إلى ${spb.endTime}` : ""} • الغرض: {spb.purpose || "نشاط تدريبي/اجتماع"}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-left">
                                  <span className="font-black text-slate-900 text-xs block">
                                    {spb.totalAmount.toFixed(3)} {spb.currency || defaultCurrency}
                                  </span>
                                  <span className="text-[9px] font-bold text-emerald-700">{spb.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 6: VOUCHERS & FINANCIAL LEDGER */}
                    {profileActiveTab === "vouchers" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 text-sm">سجل السندات المالية المحررة</h3>
                          <button
                            onClick={() => onCreateVoucherForCustomer(selectedCustomerProfile)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                          >
                            + سند قبض جديد
                          </button>
                        </div>

                        {(!rel?.vouchers || rel.vouchers.length === 0) ? (
                          <div className="text-center py-8 text-slate-500">
                            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-bold">لم يتم تحرير سندات لهذا العميل بعد</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {rel.vouchers.map((v) => (
                              <div
                                key={v.id}
                                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors"
                              >
                                <div className="flex items-center space-x-3 space-x-reverse">
                                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                    <Receipt className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900">{v.voucherNumber}</span>
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                        {v.status}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono">{formatDateToDDMMMMYYYY(v.date)}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-left">
                                    <span className="font-black text-slate-900 text-sm">
                                      {(v.totalAmount || v.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                    </span>
                                    <span className="text-[10px] text-slate-500 mr-1">{v.currency || defaultCurrency}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedCustomerProfile(null);
                                      onViewVoucher(v);
                                    }}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="معاينة وطباعة السند"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 7: ACTIVITIES & TRACKING */}
                    {profileActiveTab === "activities" && (
                      <div className="space-y-5">
                        {/* Form to Add Activity */}
                        <form onSubmit={handleAddInteraction} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <span>تسجيل متابعة / نشاط جديد مع العميل</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">نوع النشاط</label>
                              <select
                                value={newInteractionType}
                                onChange={(e: any) => setNewInteractionType(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                              >
                                <option value="CALL">مكالمة هاتفية 📞</option>
                                <option value="MEETING">اجتماع عمل 🤝</option>
                                <option value="WHATSAPP">رسالة واتساب 💬</option>
                                <option value="EMAIL">بريد إلكتروني ✉️</option>
                                <option value="NOTE">ملاحظة داخلية 📝</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">عنوان المتابعة / الموضوع</label>
                              <input
                                type="text"
                                required
                                value={newInteractionTitle}
                                onChange={(e) => setNewInteractionTitle(e.target.value)}
                                placeholder="مثال: متابعة تسليم مفاتيح المكتب وبطاقات الدخول"
                                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">التفاصيل والنتائج</label>
                            <textarea
                              rows={2}
                              value={newInteractionNotes}
                              onChange={(e) => setNewInteractionNotes(e.target.value)}
                              placeholder="تم الاتفاق على موعد التسليم وتفعيل الباقة..."
                              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>

                          <div className="text-left">
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              + إضافة السجل
                            </button>
                          </div>
                        </form>

                        {/* Timeline */}
                        <div className="space-y-3">
                          {(!selectedCustomerProfile.interactions || selectedCustomerProfile.interactions.length === 0) ? (
                            <p className="text-center text-slate-400 py-4">لا توجد سجلات تواصل مسجلة بعد</p>
                          ) : (
                            selectedCustomerProfile.interactions.map((act) => (
                              <div key={act.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-start gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5 ${
                                    act.type === "CALL"
                                      ? "bg-blue-600"
                                      : act.type === "MEETING"
                                      ? "bg-purple-600"
                                      : act.type === "WHATSAPP"
                                      ? "bg-emerald-600"
                                      : act.type === "VOUCHER_ISSUED"
                                      ? "bg-indigo-600"
                                      : "bg-slate-700"
                                  }`}
                                >
                                  {act.type === "CALL" ? (
                                    <PhoneCall className="w-4 h-4" />
                                  ) : act.type === "MEETING" ? (
                                    <Users className="w-4 h-4" />
                                  ) : act.type === "WHATSAPP" ? (
                                    <MessageCircle className="w-4 h-4" />
                                  ) : act.type === "VOUCHER_ISSUED" ? (
                                    <Receipt className="w-4 h-4" />
                                  ) : (
                                    <Clock className="w-4 h-4" />
                                  )}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="font-bold text-slate-900 text-xs">{act.title}</h5>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {formatDateToDDMMMMYYYY(act.date.slice(0, 10))}
                                    </span>
                                  </div>
                                  {act.notes && <p className="text-slate-600 text-xs mt-1 leading-relaxed">{act.notes}</p>}
                                  {act.createdByName && (
                                    <span className="text-[10px] text-slate-400 block mt-1">بواسطة: {act.createdByName}</span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: Printable Account Statement (كشف حساب معتمد للعميل والمستأجر) */}
      {/* ========================================================================= */}
      {isStatementModalOpen && statementCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 relative"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">كشف حساب العميل والمستأجر المعتمد</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكشف</span>
                </button>
                <button
                  onClick={() => setIsStatementModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statement Document Body */}
            {(() => {
              const rel = getCustomerRelations.get(statementCustomer.id);

              return (
                <div className="space-y-6 text-xs" id="printable-statement">
                  
                  {/* Company & Statement Header */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">
                        {companySettings?.companyName || "مساحات الأعمال والحلول الذكية"}
                      </h2>
                      <p className="text-slate-500 mt-0.5 font-medium">
                        {companySettings?.crNumber ? `سجل تجاري: ${companySettings.crNumber}` : ""} • {companySettings?.taxNumber ? `رقم ضريبي: ${companySettings.taxNumber}` : ""}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {companySettings?.address || "صحار - سلطنة عمان"} • هاتف: {companySettings?.phone || "+968 77627500"}
                      </p>
                    </div>

                    <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">STATEMENT OF ACCOUNT</span>
                      <span className="text-base font-black text-indigo-900 block font-mono">
                        STMT-{new Date().getFullYear()}-{statementCustomer.id.slice(-4).toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-600 font-mono mt-0.5 block">
                        تاريخ الإصدار: {formatDateToDDMMMMYYYY(new Date().toISOString().slice(0, 10))}
                      </span>
                    </div>
                  </div>

                  {/* Customer / Tenant Box */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">العميل / المستأجر:</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{statementCustomer.name}</h3>
                      <p className="text-slate-600 mt-1">المسؤول: {statementCustomer.contactPerson || statementCustomer.name}</p>
                      <p className="text-slate-600">الهاتف: <span className="font-mono">{statementCustomer.phone}</span></p>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 font-bold block">البيانات التعاقدية:</span>
                      {rel?.activeSpaceName && (
                        <p className="text-indigo-700 font-bold mt-0.5">العين المؤجرة: {rel.activeSpaceName}</p>
                      )}
                      <p className="text-slate-600 mt-0.5 font-mono">CR: {statementCustomer.crNumber || "N/A"} • VAT: {statementCustomer.taxId || "N/A"}</p>
                      <p className="text-slate-600">{statementCustomer.city} {statementCustomer.address ? `• ${statementCustomer.address}` : ""}</p>
                    </div>
                  </div>

                  {/* Vouchers & Transactions Table */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-2">سجل الحركات المالية والسندات المعتمدة:</h4>
                    <table className="w-full text-right border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5 border-b">التاريخ</th>
                          <th className="p-2.5 border-b">رقم السند / المستند</th>
                          <th className="p-2.5 border-b">البيان والتفاصيل</th>
                          <th className="p-2.5 border-b text-left">المبلغ المسدد ({defaultCurrency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!rel?.vouchers || rel.vouchers.length === 0) ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">لا توجد حركات مالية مسجلة</td>
                          </tr>
                        ) : (
                          rel.vouchers.map((v) => (
                            <tr key={v.id}>
                              <td className="p-2.5 font-mono text-slate-600">{formatDateToDDMMMMYYYY(v.date)}</td>
                              <td className="p-2.5 font-bold font-mono text-indigo-700">{v.voucherNumber}</td>
                              <td className="p-2.5 text-slate-800">{v.notes || v.category || "سداد دفعة مالية"}</td>
                              <td className="p-2.5 font-black text-slate-900 text-left font-mono">
                                {(v.totalAmount || v.amount || 0).toFixed(3)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="bg-slate-900 text-white font-bold">
                        <tr>
                          <td colSpan={3} className="p-3 text-right">إجمالي المبالغ المسددة:</td>
                          <td className="p-3 text-left font-black text-sm font-mono">
                            {(rel?.totalPaid || 0).toFixed(3)} {defaultCurrency}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Installments Remaining Status */}
                  {rel && rel.totalDueInstallments > 0 && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-950 block text-xs">الأقساط والدفعات الإيجارية المستحقة:</span>
                        <span className="text-[11px] text-amber-800">وفقاً لجداول عقود الإيجار المعتمدة</span>
                      </div>
                      <span className="font-black text-amber-950 text-sm font-mono">
                        {rel.totalDueInstallments.toFixed(3)} {defaultCurrency}
                      </span>
                    </div>
                  )}

                  {/* Stamp & Signature area */}
                  <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-slate-600 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">إعداد وتدقيق الإدارة المالية:</p>
                      <p className="mt-6 text-slate-400 font-medium">الختم والتوقيع الرسمي</p>
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-slate-800">اعتماد المستأجر / العميل:</p>
                      <p className="mt-6 text-slate-400 font-medium">التوقيع / المفوض</p>
                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
};
