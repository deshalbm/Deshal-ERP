import React, { useState, useMemo } from "react";
import {
  RecurringSchedule,
  RecurrenceFrequency,
  RecurringScheduleStatus,
  ReceiptVoucher,
  Customer,
  Supplier,
  Branch,
  PaymentMethod,
  VoucherType,
  CompanySettings
} from "../types";
import { useLanguage } from "../utils/LanguageContext";
import {
  calculateNextDueDate,
  getUpcomingPreviewDates,
  getDaysUntilDue,
  getFrequencyLabel,
  getTodayYMD,
  buildVoucherFromSchedule
} from "../utils/recurrenceUtils";
import {
  Calendar,
  Clock,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  FileText,
  CreditCard,
  Building2,
  Wifi,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Sparkles,
  Bell,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Receipt,
  Car
} from "lucide-react";

interface RecurringSchedulesViewProps {
  schedules: RecurringSchedule[];
  vouchers: ReceiptVoucher[];
  customers: Customer[];
  suppliers: Supplier[];
  branches: Branch[];
  activeBranchId?: string;
  companySettings: CompanySettings;
  onSaveSchedules: (schedules: RecurringSchedule[]) => void;
  onSaveVouchers: (vouchers: ReceiptVoucher[]) => void;
  onViewVoucher?: (voucher: ReceiptVoucher) => void;
  onAuditLog?: (action: string, category: string, refId: string, refName: string, descAr: string, descEn: string) => void;
}

export function RecurringSchedulesView({
  schedules,
  vouchers,
  customers,
  suppliers,
  branches,
  activeBranchId,
  companySettings,
  onSaveSchedules,
  onSaveVouchers,
  onViewVoucher,
  onAuditLog
}: RecurringSchedulesViewProps) {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dueFilter, setDueFilter] = useState<"ALL" | "DUE_TODAY" | "OVERDUE" | "DUE_7_DAYS">("ALL");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);
  const [historySchedule, setHistorySchedule] = useState<RecurringSchedule | null>(null);
  const [executingScheduleId, setExecutingScheduleId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formType, setFormType] = useState<VoucherType>("PAYMENT");
  const [formTitle, setFormTitle] = useState("");
  const [formFrequency, setFormFrequency] = useState<RecurrenceFrequency>("MONTHLY");
  const [formAmount, setFormAmount] = useState<number | string>(100);
  const [formPartyName, setFormPartyName] = useState("");
  const [formPartyType, setFormPartyType] = useState<"CUSTOMER" | "SUPPLIER" | "EMPLOYEE" | "OTHER">("SUPPLIER");
  const [formPartyPhone, setFormPartyPhone] = useState("");
  const [formPartyEmail, setFormPartyEmail] = useState("");
  const [formCategory, setFormCategory] = useState("أقساط سيارات وتمويل");
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [formBankName, setFormBankName] = useState("بنك مسقط (Bank Muscat)");
  const [formStartDate, setFormStartDate] = useState(getTodayYMD());
  const [formNextDueDate, setFormNextDueDate] = useState(getTodayYMD());
  const [formLimitType, setFormLimitType] = useState<"UNLIMITED" | "INSTALLMENTS" | "END_DATE">("INSTALLMENTS");
  const [formTotalOccurrences, setFormTotalOccurrences] = useState<number>(12);
  const [formEndDate, setFormEndDate] = useState("");
  const [formReminderDays, setFormReminderDays] = useState<number>(3);
  const [formDescription, setFormDescription] = useState("");
  const [formBranchId, setFormBranchId] = useState<string>(activeBranchId || "branch-sohar");

  // Calculated Metrics
  const metrics = useMemo(() => {
    const today = getTodayYMD();
    let totalMonthlyCommitments = 0;
    let totalMonthlyReceivables = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let due7DaysCount = 0;
    let activeCount = 0;

    schedules.forEach((s) => {
      if (s.status === "ACTIVE") {
        activeCount++;

        // Monthly normalized commitment calculation
        let multiplier = 1;
        if (s.frequency === "DAILY") multiplier = 30;
        else if (s.frequency === "WEEKLY") multiplier = 4.33;
        else if (s.frequency === "BIWEEKLY") multiplier = 2.16;
        else if (s.frequency === "MONTHLY") multiplier = 1;
        else if (s.frequency === "QUARTERLY") multiplier = 1 / 3;
        else if (s.frequency === "SEMI_ANNUALLY") multiplier = 1 / 6;
        else if (s.frequency === "ANNUALLY") multiplier = 1 / 12;

        const normalizedMonthly = s.amount * multiplier;

        if (s.type === "PAYMENT" || s.type === "PETTY_CASH") {
          totalMonthlyCommitments += normalizedMonthly;
        } else if (s.type === "RECEIPT" || s.type === "TAX_INVOICE") {
          totalMonthlyReceivables += normalizedMonthly;
        }

        const days = getDaysUntilDue(s.nextDueDate, today);
        if (days < 0) overdueCount++;
        else if (days === 0) dueTodayCount++;
        else if (days <= 7) due7DaysCount++;
      }
    });

    return {
      totalMonthlyCommitments,
      totalMonthlyReceivables,
      dueTodayCount,
      overdueCount,
      due7DaysCount,
      activeCount
    };
  }, [schedules]);

  // Urgent Schedules (Due Today or Overdue)
  const urgentSchedules = useMemo(() => {
    const today = getTodayYMD();
    return schedules.filter((s) => {
      if (s.status !== "ACTIVE") return false;
      const days = getDaysUntilDue(s.nextDueDate, today);
      return days <= 0;
    });
  }, [schedules]);

  // Filtered List
  const filteredSchedules = useMemo(() => {
    const today = getTodayYMD();
    return schedules.filter((s) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchCode = s.scheduleCode.toLowerCase().includes(q);
        const matchParty = s.partyName.toLowerCase().includes(q);
        const matchCat = s.category.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchParty && !matchCat) return false;
      }

      // Type Filter
      if (selectedType !== "ALL") {
        if (selectedType === "PAYMENT" && s.type !== "PAYMENT" && s.type !== "PETTY_CASH") return false;
        if (selectedType === "RECEIPT" && s.type !== "RECEIPT" && s.type !== "TAX_INVOICE") return false;
      }

      // Frequency Filter
      if (selectedFrequency !== "ALL" && s.frequency !== selectedFrequency) return false;

      // Status Filter
      if (selectedStatus !== "ALL" && s.status !== selectedStatus) return false;

      // Due Timing Filter
      if (dueFilter !== "ALL") {
        const days = getDaysUntilDue(s.nextDueDate, today);
        if (dueFilter === "DUE_TODAY" && days !== 0) return false;
        if (dueFilter === "OVERDUE" && days >= 0) return false;
        if (dueFilter === "DUE_7_DAYS" && (days < 0 || days > 7)) return false;
      }

      return true;
    });
  }, [schedules, searchTerm, selectedType, selectedFrequency, selectedStatus, dueFilter]);

  // Handle Preset Fast-Fill
  const applyPreset = (presetKey: "car" | "rent" | "internet" | "maintenance" | "insurance") => {
    const today = getTodayYMD();
    if (presetKey === "car") {
      setFormType("PAYMENT");
      setFormTitle(isRtl ? "قسط تمويل السيارة - لاندكروزر" : "Car Finance Installment");
      setFormCategory(isRtl ? "أقساط سيارات وتمويل" : "Auto Finance & Loans");
      setFormFrequency("MONTHLY");
      setFormAmount(250);
      setFormPartyName(isRtl ? "شركة مسقط للتمويل وتأجير المركبات" : "Muscat Finance Co.");
      setFormPartyType("SUPPLIER");
      setFormPaymentMethod("BANK_TRANSFER");
      setFormBankName("بنك مسقط (Bank Muscat)");
      setFormLimitType("INSTALLMENTS");
      setFormTotalOccurrences(36);
      setFormReminderDays(3);
      setFormDescription(isRtl ? "القسط الشهري لمركبة العمل - عقد تمويل رقم MFC-9921" : "Monthly vehicle financing installment");
    } else if (presetKey === "rent") {
      setFormType("PAYMENT");
      setFormTitle(isRtl ? "إيجار مقر الشركة والمستودع (كل 3 أشهر - ربع سنوي)" : "Headquarters & Warehouse Rent (Quarterly)");
      setFormCategory(isRtl ? "إيجارات ومقرات" : "Property Rent");
      setFormFrequency("QUARTERLY");
      setFormAmount(1200);
      setFormPartyName(isRtl ? "الشيخ سالم بن راشد المعمري (مالك العقار)" : "Sheikh Salem Al-Maamari (Landlord)");
      setFormPartyType("OTHER");
      setFormPaymentMethod("CHECK");
      setFormBankName("بنك ظفار");
      setFormLimitType("INSTALLMENTS");
      setFormTotalOccurrences(8);
      setFormReminderDays(7);
      setFormDescription(isRtl ? "إيجار ربع سنوي لمقر الشركة والمستودع - عقد موثق بلدية صحار" : "Quarterly rent for office & warehouse");
    } else if (presetKey === "internet") {
      setFormType("PAYMENT");
      setFormTitle(isRtl ? "فاتورة باقة إنترنت الأعمال والاتصالات الفايبر" : "Business Fiber Internet Subscription");
      setFormCategory(isRtl ? "خدمات إنترنت واتصالات" : "Internet & Telecom");
      setFormFrequency("MONTHLY");
      setFormAmount(45);
      setFormPartyName(isRtl ? "الشركة العمانية للاتصالات (عمانتل Omantel)" : "Omantel");
      setFormPartyType("SUPPLIER");
      setFormPaymentMethod("ONLINE");
      setFormLimitType("UNLIMITED");
      setFormReminderDays(3);
      setFormDescription(isRtl ? "اشتراك باقة فايبر الأعمال بسرعة 500Mbps مع عنوان IP ثابت" : "High speed fiber 500Mbps static IP");
    } else if (presetKey === "maintenance") {
      setFormType("RECEIPT");
      setFormTitle(isRtl ? "عقد صيانة الكاميرات والشبكات - مركز الدليل الشامل" : "CCTV & Network Maintenance Contract");
      setFormCategory(isRtl ? "عقود صيانة ودعم فني" : "Maintenance & Support");
      setFormFrequency("MONTHLY");
      setFormAmount(350);
      setFormPartyName(isRtl ? "شركة الدليل الشامل" : "Deshal Comprehensive Center");
      setFormPartyType("CUSTOMER");
      setFormPaymentMethod("BANK_TRANSFER");
      setFormBankName("بنك ظفار");
      setFormLimitType("INSTALLMENTS");
      setFormTotalOccurrences(24);
      setFormReminderDays(5);
      setFormDescription(isRtl ? "دفعة عقد الدعم الفني والصيانة الوقائية للشاشات التفاعلية والسيرفرات" : "Monthly preventive maintenance contract");
    } else if (presetKey === "insurance") {
      setFormType("PAYMENT");
      setFormTitle(isRtl ? "وثيقة التأمين الشامل السنوية للمركبات والمستودع" : "Annual Comprehensive Fleet & Property Insurance");
      setFormCategory(isRtl ? "تأمين ومخاطر" : "Insurance");
      setFormFrequency("ANNUALLY");
      setFormAmount(480);
      setFormPartyName(isRtl ? "شركة ظفار للتأمين" : "Dhofar Insurance");
      setFormPartyType("SUPPLIER");
      setFormPaymentMethod("BANK_TRANSFER");
      setFormLimitType("INSTALLMENTS");
      setFormTotalOccurrences(5);
      setFormReminderDays(14);
      setFormDescription(isRtl ? "التأمين السنوي الشامل على أسطول المركبات ومستودع المعدات" : "Annual comprehensive fleet & warehouse policy");
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = (preset?: "car" | "rent" | "internet" | "maintenance" | "insurance") => {
    setEditingSchedule(null);
    const today = getTodayYMD();
    setFormType("PAYMENT");
    setFormTitle("");
    setFormFrequency("MONTHLY");
    setFormAmount(100);
    setFormPartyName("");
    setFormPartyType("SUPPLIER");
    setFormPartyPhone("");
    setFormPartyEmail("");
    setFormCategory("أقساط سيارات وتمويل");
    setFormPaymentMethod("BANK_TRANSFER");
    setFormBankName("بنك مسقط (Bank Muscat)");
    setFormStartDate(today);
    setFormNextDueDate(today);
    setFormLimitType("INSTALLMENTS");
    setFormTotalOccurrences(12);
    setFormEndDate("");
    setFormReminderDays(3);
    setFormDescription("");
    setFormBranchId(activeBranchId || "branch-sohar");

    if (preset) {
      applyPreset(preset);
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (schedule: RecurringSchedule) => {
    setEditingSchedule(schedule);
    setFormType(schedule.type);
    setFormTitle(schedule.title);
    setFormFrequency(schedule.frequency);
    setFormAmount(schedule.amount);
    setFormPartyName(schedule.partyName);
    setFormPartyType(schedule.partyType);
    setFormPartyPhone(schedule.partyPhone || "");
    setFormPartyEmail(schedule.partyEmail || "");
    setFormCategory(schedule.category);
    setFormPaymentMethod(schedule.paymentMethod);
    setFormBankName(schedule.bankName || "");
    setFormStartDate(schedule.startDate);
    setFormNextDueDate(schedule.nextDueDate);
    if (schedule.totalOccurrences && schedule.totalOccurrences > 0) {
      setFormLimitType("INSTALLMENTS");
      setFormTotalOccurrences(schedule.totalOccurrences);
    } else if (schedule.endDate) {
      setFormLimitType("END_DATE");
      setFormEndDate(schedule.endDate);
    } else {
      setFormLimitType("UNLIMITED");
    }
    setFormReminderDays(schedule.reminderDaysBefore || 3);
    setFormDescription(schedule.description || "");
    setFormBranchId(schedule.branchId || "branch-sohar");
    setIsModalOpen(true);
  };

  // Save Schedule (Create or Update)
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPartyName.trim() || Number(formAmount) <= 0) {
      alert(isRtl ? "يرجى ملء الحقول الإلزامية (العنوان، الجهة، المبلغ)" : "Please fill required fields (Title, Party, Amount)");
      return;
    }

    const branch = branches.find((b) => b.id === formBranchId);
    const branchName = branch ? branch.name : undefined;

    let totalOccur: number | undefined = undefined;
    if (formLimitType === "INSTALLMENTS") {
      totalOccur = Number(formTotalOccurrences) || 12;
    }

    if (editingSchedule) {
      // Update existing
      const updated: RecurringSchedule = {
        ...editingSchedule,
        title: formTitle.trim(),
        type: formType,
        frequency: formFrequency,
        amount: Number(formAmount),
        currency: companySettings.defaultCurrency || "OMR",
        partyName: formPartyName.trim(),
        partyType: formPartyType,
        partyPhone: formPartyPhone.trim() || undefined,
        partyEmail: formPartyEmail.trim() || undefined,
        category: formCategory,
        paymentMethod: formPaymentMethod,
        bankName: formBankName.trim() || undefined,
        startDate: formStartDate,
        nextDueDate: formNextDueDate,
        totalOccurrences: totalOccur,
        endDate: formLimitType === "END_DATE" ? formEndDate : undefined,
        reminderDaysBefore: formReminderDays,
        branchId: formBranchId,
        branchName,
        description: formDescription.trim() || undefined,
        updatedAt: new Date().toISOString()
      };

      const newList = schedules.map((s) => (s.id === updated.id ? updated : s));
      onSaveSchedules(newList);
      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "SCHEDULE",
          updated.id,
          updated.title,
          `تعديل إعدادات العملية المجدولة [${updated.title}]`,
          `Updated recurring schedule [${updated.title}]`
        );
      }
      setSuccessToast(isRtl ? "تم تحديث العملية المجدولة بنجاح" : "Schedule updated successfully");
    } else {
      // Create new
      const nextCodeNum = schedules.length + 1;
      const scheduleCode = `REC-2026-${nextCodeNum.toString().padStart(3, "0")}`;
      const newSchedule: RecurringSchedule = {
        id: `rec-${Date.now()}`,
        scheduleCode,
        title: formTitle.trim(),
        type: formType,
        frequency: formFrequency,
        amount: Number(formAmount),
        currency: companySettings.defaultCurrency || "OMR",
        partyName: formPartyName.trim(),
        partyType: formPartyType,
        partyPhone: formPartyPhone.trim() || undefined,
        partyEmail: formPartyEmail.trim() || undefined,
        category: formCategory,
        paymentMethod: formPaymentMethod,
        bankName: formBankName.trim() || undefined,
        startDate: formStartDate,
        nextDueDate: formNextDueDate || formStartDate,
        totalOccurrences: totalOccur,
        completedOccurrences: 0,
        endDate: formLimitType === "END_DATE" ? formEndDate : undefined,
        autoGenerateVoucher: true,
        reminderDaysBefore: formReminderDays,
        status: "ACTIVE",
        branchId: formBranchId,
        branchName,
        description: formDescription.trim() || undefined,
        executions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newList = [newSchedule, ...schedules];
      onSaveSchedules(newList);
      if (onAuditLog) {
        onAuditLog(
          "CREATE",
          "SCHEDULE",
          newSchedule.id,
          newSchedule.title,
          `إنشاء جدولة عملية دورية جديدة [${newSchedule.title}] بقيمة ${newSchedule.amount} ${newSchedule.currency}`,
          `Created recurring schedule [${newSchedule.title}]`
        );
      }
      setSuccessToast(isRtl ? "تمت إضافة العملية المجدولة بنجاح" : "Recurring schedule created successfully");
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Toggle Pause / Resume
  const handleToggleStatus = (schedule: RecurringSchedule) => {
    const newStatus: RecurringScheduleStatus = schedule.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const updated = {
      ...schedule,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    const newList = schedules.map((s) => (s.id === schedule.id ? updated : s));
    onSaveSchedules(newList);
    if (onAuditLog) {
      onAuditLog(
        "STATUS_CHANGE",
        "SCHEDULE",
        schedule.id,
        schedule.title,
        `${newStatus === "ACTIVE" ? "استئناف تفعيل" : "إيقاف مؤقت"} للجدولة [${schedule.title}]`,
        `Changed status of schedule [${schedule.title}] to ${newStatus}`
      );
    }
  };

  // Delete / Cancel Schedule
  const handleDeleteSchedule = (schedule: RecurringSchedule) => {
    if (confirm(t("deleteScheduleConfirm"))) {
      const newList = schedules.filter((s) => s.id !== schedule.id);
      onSaveSchedules(newList);
      if (onAuditLog) {
        onAuditLog(
          "DELETE",
          "SCHEDULE",
          schedule.id,
          schedule.title,
          `حذف العملية المجدولة [${schedule.title}]`,
          `Deleted recurring schedule [${schedule.title}]`
        );
      }
      setSuccessToast(isRtl ? "تم حذف الجدولة بنجاح" : "Schedule deleted successfully");
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Execute / Post Voucher Now
  const handlePostVoucherNow = (schedule: RecurringSchedule) => {
    setExecutingScheduleId(schedule.id);

    try {
      const { voucher, updatedSchedule } = buildVoucherFromSchedule(schedule, vouchers, getTodayYMD());

      // Update vouchers list
      const newVouchersList = [voucher, ...vouchers];
      onSaveVouchers(newVouchersList);

      // Update schedules list
      const newSchedulesList = schedules.map((s) => (s.id === schedule.id ? updatedSchedule : s));
      onSaveSchedules(newSchedulesList);

      if (onAuditLog) {
        onAuditLog(
          "POST_VOUCHER",
          "SCHEDULE",
          voucher.id,
          voucher.voucherNumber,
          `تسجيل وترحيل سند مالي رسمي ${voucher.voucherNumber} للعملية المجدولة [${schedule.title}] بمبلغ ${voucher.amount} ${voucher.currency}`,
          `Generated and posted voucher ${voucher.voucherNumber} for schedule [${schedule.title}]`
        );
      }

      setSuccessToast(
        isRtl
          ? `تم بنجاح إصدار السند رقم ${voucher.voucherNumber} وترحيله للسجلات، وتحديث الاستحقاق القادم إلى ${updatedSchedule.nextDueDate}`
          : `Voucher ${voucher.voucherNumber} generated & next due date updated to ${updatedSchedule.nextDueDate}`
      );
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error("Failed to post scheduled voucher:", err);
      alert(isRtl ? "حدث خطأ أثناء تسجيل السند" : "Error posting voucher");
    } finally {
      setExecutingScheduleId(null);
    }
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string, title: string) => {
    const text = (category + " " + title).toLowerCase();
    if (text.includes("سيار") || text.includes("مركب") || text.includes("car") || text.includes("auto")) {
      return <Car className="w-5 h-5 text-amber-600" />;
    }
    if (text.includes("إيجار") || text.includes("عقار") || text.includes("مقر") || text.includes("rent") || text.includes("building")) {
      return <Building2 className="w-5 h-5 text-indigo-600" />;
    }
    if (text.includes("إنترنت") || text.includes("اتصال") || text.includes("عمانتل") || text.includes("wifi") || text.includes("telecom")) {
      return <Wifi className="w-5 h-5 text-sky-600" />;
    }
    if (text.includes("تأمين") || text.includes("insurance") || text.includes("مخاطر")) {
      return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
    }
    if (text.includes("صيانة") || text.includes("دعم") || text.includes("كامير") || text.includes("maintenance")) {
      return <Briefcase className="w-5 h-5 text-purple-600" />;
    }
    return <Repeat className="w-5 h-5 text-slate-600" />;
  };

  // Preview dates for simulation modal
  const simulatedDates = useMemo(() => {
    return getUpcomingPreviewDates(formNextDueDate || formStartDate, formFrequency, 5, formLimitType === "END_DATE" ? formEndDate : undefined);
  }, [formNextDueDate, formStartDate, formFrequency, formLimitType, formEndDate]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-slideUp">
          <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
          <span className="text-sm font-bold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="p-1 hover:bg-emerald-600 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Repeat className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                {isRtl ? "نظام الجدولة والأقساط الذكي" : "Smart Recurring & Installments"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t("recurringSchedules")}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {t("recurringSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t("newSchedule")}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isRtl ? "قوالب مجدولة سريعة:" : "Quick Schedule Presets:"}
          </span>
          <button
            onClick={() => handleOpenCreateModal("car")}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("presetCarInstallment")}</span>
          </button>
          <button
            onClick={() => handleOpenCreateModal("rent")}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t("presetRentQuarterly")}</span>
          </button>
          <button
            onClick={() => handleOpenCreateModal("internet")}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wifi className="w-3.5 h-3.5 text-sky-400" />
            <span>{t("presetInternetMonthly")}</span>
          </button>
          <button
            onClick={() => handleOpenCreateModal("maintenance")}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
            <span>{t("presetMaintenanceContract")}</span>
          </button>
          <button
            onClick={() => handleOpenCreateModal("insurance")}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("presetInsuranceAnnual")}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Commitments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">{t("monthlyCommitments")}</span>
            <div className="text-2xl font-black text-rose-600">
              {metrics.totalMonthlyCommitments.toFixed(3)}{" "}
              <span className="text-xs font-medium text-slate-500">{companySettings.defaultCurrency || "OMR"}</span>
            </div>
            <p className="text-[11px] text-slate-400">{isRtl ? "معدل المصروفات الشهرية المقدرة" : "Normalized monthly payments"}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Total Monthly Receivables */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">{t("monthlyReceivables")}</span>
            <div className="text-2xl font-black text-emerald-600">
              {metrics.totalMonthlyReceivables.toFixed(3)}{" "}
              <span className="text-xs font-medium text-slate-500">{companySettings.defaultCurrency || "OMR"}</span>
            </div>
            <p className="text-[11px] text-slate-400">{isRtl ? "معدل الإيرادات الدورية الشهرية" : "Normalized monthly receipts"}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Due & Overdue Today */}
        <div
          onClick={() => setDueFilter(dueFilter === "DUE_TODAY" ? "ALL" : "DUE_TODAY")}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            metrics.dueTodayCount > 0 || metrics.overdueCount > 0 ? "border-amber-400 bg-amber-50/40" : "border-slate-200"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">{isRtl ? "مستحق اليوم / متأخر" : "Due Today / Overdue"}</span>
            <div className="text-2xl font-black text-amber-600 flex items-center gap-2">
              <span>{metrics.dueTodayCount + metrics.overdueCount}</span>
              {metrics.overdueCount > 0 && (
                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {metrics.overdueCount} {isRtl ? "متأخر" : "overdue"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">{isRtl ? "انقر للفلترة الفورية" : "Click to filter urgent"}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        {/* Active Schedules */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">{isRtl ? "العمليات المجدولة النشطة" : "Active Schedules"}</span>
            <div className="text-2xl font-black text-indigo-600">
              {metrics.activeCount} <span className="text-xs font-medium text-slate-400">/ {schedules.length}</span>
            </div>
            <p className="text-[11px] text-slate-400">{isRtl ? "قيد المتابعة الدورية" : "Under active tracking"}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Repeat className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Urgent Schedules Action Banner (if any) */}
      {urgentSchedules.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950">
                {isRtl
                  ? `يوجد ${urgentSchedules.length} عملية مجدولة مستحقة الدفع أو السداد اليوم!`
                  : `You have ${urgentSchedules.length} scheduled operations due or overdue!`}
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                {isRtl
                  ? "يمكنك إصدار السند المالي وترحيله إلى الحسابات بلمسة زر واحدة."
                  : "You can generate and post official financial vouchers with one click."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setDueFilter("DUE_TODAY")}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isRtl ? "عرض المستحقات فقط" : "View Due Only"}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? "بحث بعنوان القسط، المستفيد، الكود، التصنيف..." : "Search title, party, code..."}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedType === "ALL" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isRtl ? "الكل" : "All"}
            </button>
            <button
              onClick={() => setSelectedType("PAYMENT")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedType === "PAYMENT" ? "bg-white text-rose-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isRtl ? "أقساط ومصروفات (صرف)" : "Payments"}
            </button>
            <button
              onClick={() => setSelectedType("RECEIPT")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedType === "RECEIPT" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isRtl ? "إيرادات دورية (قبض)" : "Receipts"}
            </button>
          </div>
        </div>

        {/* Sub-Filters: Frequency & Status */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            {isRtl ? "التكرار:" : "Frequency:"}
          </span>
          <select
            value={selectedFrequency}
            onChange={(e) => setSelectedFrequency(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">{isRtl ? "جميع الدوريات" : "All Frequencies"}</option>
            <option value="DAILY">{isRtl ? "يومياً" : "Daily"}</option>
            <option value="WEEKLY">{isRtl ? "أسبوعياً" : "Weekly"}</option>
            <option value="MONTHLY">{isRtl ? "شهرياً" : "Monthly"}</option>
            <option value="QUARTERLY">{isRtl ? "كل 3 أشهر (ربع سنوي)" : "Quarterly"}</option>
            <option value="SEMI_ANNUALLY">{isRtl ? "كل 6 أشهر (نصف سنوي)" : "Semi-Annually"}</option>
            <option value="ANNUALLY">{isRtl ? "سنوياً" : "Annually"}</option>
          </select>

          <span className="font-bold text-slate-500 mr-2">{isRtl ? "الحالة:" : "Status:"}</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">{isRtl ? "جميع الحالات" : "All Statuses"}</option>
            <option value="ACTIVE">{isRtl ? "نشط" : "Active"}</option>
            <option value="PAUSED">{isRtl ? "موقوف مؤقتاً" : "Paused"}</option>
            <option value="COMPLETED">{isRtl ? "مكتمل" : "Completed"}</option>
          </select>

          <span className="font-bold text-slate-500 mr-2">{isRtl ? "تاريخ الاستحقاق:" : "Due:"}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDueFilter("ALL")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                dueFilter === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isRtl ? "الكل" : "All"}
            </button>
            <button
              onClick={() => setDueFilter("DUE_TODAY")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                dueFilter === "DUE_TODAY" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              {isRtl ? "مستحق اليوم" : "Due Today"}
            </button>
            <button
              onClick={() => setDueFilter("DUE_7_DAYS")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                dueFilter === "DUE_7_DAYS" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
              }`}
            >
              {isRtl ? "خلال 7 أيام" : "Next 7 Days"}
            </button>
            <button
              onClick={() => setDueFilter("OVERDUE")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                dueFilter === "OVERDUE" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            >
              {isRtl ? "متأخر" : "Overdue"}
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Cards Grid */}
      {filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Repeat className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{isRtl ? "لا توجد عمليات مجدولة تطابق البحث" : "No matching recurring schedules"}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {isRtl
                ? "يمكنك إنشاء جدولة جديدة أو اختيار أحد القوالب السريعة (قسط سيارة، إيجار ربع سنوي، باقة إنترنت)."
                : "Create a new schedule or select from quick templates."}
            </p>
          </div>
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t("newSchedule")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.map((schedule) => {
            const daysUntilDue = getDaysUntilDue(schedule.nextDueDate, getTodayYMD());
            const isDueToday = daysUntilDue === 0;
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue > 0 && daysUntilDue <= 7;

            const isPayment = schedule.type === "PAYMENT" || schedule.type === "PETTY_CASH";
            const progressPercent =
              schedule.totalOccurrences && schedule.totalOccurrences > 0
                ? Math.min(100, Math.round((schedule.completedOccurrences / schedule.totalOccurrences) * 100))
                : null;

            return (
              <div
                key={schedule.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  isOverdue
                    ? "border-rose-300 ring-1 ring-rose-200"
                    : isDueToday
                    ? "border-amber-400 ring-2 ring-amber-300/40"
                    : "border-slate-200"
                }`}
              >
                {/* Card Top Pill Badge */}
                <div className="p-5 pb-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                        {getCategoryIcon(schedule.category, schedule.title)}
                      </div>
                      <div>
                        <span className="text-[11px] font-black text-slate-400 tracking-wider">
                          {schedule.scheduleCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isPayment ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isPayment ? (isRtl ? "صرف / قسط" : "Payment") : (isRtl ? "قبض / إيراد" : "Receipt")}
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                            {getFrequencyLabel(schedule.frequency, language)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {schedule.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {isRtl ? "نشط" : "Active"}
                        </span>
                      ) : schedule.status === "PAUSED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                          <Pause className="w-3 h-3" />
                          {isRtl ? "موقوف" : "Paused"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-slate-200 text-slate-800 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {isRtl ? "مكتمل" : "Completed"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Counterparty */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 line-clamp-1" title={schedule.title}>
                      {schedule.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-0.5">
                      <span>{schedule.partyName}</span>
                      {schedule.partyPhone && (
                        <span className="text-[10px] text-slate-400 mr-1" dir="ltr">
                          ({schedule.partyPhone})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount Display */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-500">{isRtl ? "قيمة الدفعة:" : "Installment Amount:"}</span>
                    <div className="text-xl font-black text-slate-900">
                      {schedule.amount.toFixed(3)}{" "}
                      <span className="text-xs font-medium text-slate-500">{schedule.currency}</span>
                    </div>
                  </div>

                  {/* Installments Progress Bar (if limited) */}
                  {progressPercent !== null ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>
                          {isRtl ? "الأقساط المسددة:" : "Paid Installments:"} {schedule.completedOccurrences} / {schedule.totalOccurrences}
                        </span>
                        <span className="text-indigo-600">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                      <span>{isRtl ? "نظام الجدولة:" : "Schedule Mode:"}</span>
                      <span className="text-indigo-600 font-black">{isRtl ? "اشتراك مستمر (غير محدد بأقساط)" : "Continuous Subscription"}</span>
                    </div>
                  )}

                  {/* Next Due Date Highlight */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isOverdue
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : isDueToday
                        ? "bg-amber-50 border-amber-300 text-amber-950 font-bold"
                        : "bg-indigo-50/50 border-indigo-100 text-indigo-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 shrink-0 text-indigo-600" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">{t("nextDueDate")}</div>
                        <div className="font-black text-xs font-mono">{schedule.nextDueDate}</div>
                      </div>
                    </div>

                    <div className="text-end">
                      {isOverdue ? (
                        <span className="text-[11px] font-black text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded-md">
                          {isRtl ? `متأخر (${Math.abs(daysUntilDue)} يوم)` : `Overdue (${Math.abs(daysUntilDue)}d)`}
                        </span>
                      ) : isDueToday ? (
                        <span className="text-[11px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                          {t("dueToday")}
                        </span>
                      ) : isDueSoon ? (
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                          {isRtl ? `مستحق خلال ${daysUntilDue} أيام` : `Due in ${daysUntilDue}d`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {isRtl ? `بعد ${daysUntilDue} يوم` : `In ${daysUntilDue} days`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(schedule)}
                      title={t("edit")}
                      className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(schedule)}
                      title={schedule.status === "ACTIVE" ? t("pauseSchedule") : t("resumeSchedule")}
                      className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-amber-600 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    >
                      {schedule.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setHistorySchedule(schedule)}
                      title={t("scheduleHistory")}
                      className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule)}
                      title={t("delete")}
                      className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-rose-600 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary 1-Click Post Voucher Button */}
                  <button
                    onClick={() => handlePostVoucherNow(schedule)}
                    disabled={executingScheduleId === schedule.id || schedule.status === "COMPLETED"}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isDueToday || isOverdue
                        ? "bg-amber-600 hover:bg-amber-700 text-white font-black"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    } ${executingScheduleId === schedule.id ? "opacity-60 cursor-wait" : ""}`}
                  >
                    {executingScheduleId === schedule.id ? (
                      <span>{t("postingVoucher")}</span>
                    ) : (
                      <>
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{t("postVoucherNow")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT SCHEDULE MODAL                                              */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-scaleUp overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {editingSchedule ? t("editSchedule") : t("newSchedule")}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isRtl
                      ? "تسجيل وتعديل تفاصيل العملية، التاريخ، الدورية والمبالغ المستحقة"
                      : "Configure recurring dates, installments limit and amounts"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Presets Bar inside modal */}
              {!editingSchedule && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isRtl ? "اختر قالباً للتعبئة التلقائية السريعة:" : "Select quick preset to autofill:"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset("car")}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      🚗 {t("presetCarInstallment")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("rent")}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      🏢 {t("presetRentQuarterly")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("internet")}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      🌐 {t("presetInternetMonthly")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("maintenance")}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      💼 {t("presetMaintenanceContract")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("insurance")}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      🛡️ {t("presetInsuranceAnnual")}
                    </button>
                  </div>
                </div>
              )}

              {/* Type Toggle: Payment vs Receipt */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormType("PAYMENT")}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black text-sm cursor-pointer transition-all ${
                    formType === "PAYMENT"
                      ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>{isRtl ? "صرف / قسط دوري (التزام مالي)" : "Recurring Payment / Expense"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormType("RECEIPT")}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black text-sm cursor-pointer transition-all ${
                    formType === "RECEIPT"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{isRtl ? "قبض / إيراد دوري (تحصيل)" : "Recurring Receipt / Income"}</span>
                </button>
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-black text-slate-700">
                    {t("scheduleTitle")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={isRtl ? "مثال: قسط سيارة لاندكروزر - بنك مسقط" : "e.g. Car installment"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">
                    {t("amount")} ({companySettings.defaultCurrency || "OMR"}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Party & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">
                    {t("partyName")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formPartyName}
                    onChange={(e) => setFormPartyName(e.target.value)}
                    placeholder={isRtl ? "اسم المستفيد / الدافع / البنك" : "Party / Counterparty Name"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">{isRtl ? "التصنيف المالي" : "Category"}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="أقساط سيارات وتمويل">{isRtl ? "أقساط سيارات وتمويل" : "Auto Finance & Loans"}</option>
                    <option value="إيجارات ومقرات">{isRtl ? "إيجارات ومقرات" : "Property Rent"}</option>
                    <option value="خدمات إنترنت واتصالات">{isRtl ? "خدمات إنترنت واتصالات" : "Internet & Telecom"}</option>
                    <option value="فواتير ومرافق (كهرباء ومياه)">{isRtl ? "فواتير ومرافق (كهرباء ومياه)" : "Utilities"}</option>
                    <option value="عقود صيانة ودعم فني">{isRtl ? "عقود صيانة ودعم فني" : "Maintenance & Support"}</option>
                    <option value="تأمين ومخاطر">{isRtl ? "تأمين ومخاطر" : "Insurance"}</option>
                    <option value="رواتب والتزامات عمالية">{isRtl ? "رواتب والتزامات عمالية" : "Payroll & Labor"}</option>
                    <option value="اشتراكات برمجية ورقمية">{isRtl ? "اشتراكات برمجية ورقمية" : "Software Subscriptions"}</option>
                    <option value="إيرادات دورية عامة">{isRtl ? "إيرادات دورية عامة" : "General Recurring Income"}</option>
                  </select>
                </div>
              </div>

              {/* Recurrence Frequency & Timing */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? "قواعد التكرار ومواعيد الاستحقاق" : "Recurrence Rules & Scheduling"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">{t("frequency")}</label>
                    <select
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(e.target.value as RecurrenceFrequency)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-indigo-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="DAILY">{t("freqDaily")}</option>
                      <option value="WEEKLY">{t("freqWeekly")}</option>
                      <option value="BIWEEKLY">{t("freqBiweekly")}</option>
                      <option value="MONTHLY">{t("freqMonthly")}</option>
                      <option value="QUARTERLY">{t("freqQuarterly")}</option>
                      <option value="SEMI_ANNUALLY">{t("freqSemiAnnually")}</option>
                      <option value="ANNUALLY">{t("freqAnnually")}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">{isRtl ? "تاريخ البداية" : "Start Date"}</label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => {
                        setFormStartDate(e.target.value);
                        if (!editingSchedule) setFormNextDueDate(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">{t("nextDueDate")}</label>
                    <input
                      type="date"
                      required
                      value={formNextDueDate}
                      onChange={(e) => setFormNextDueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Limit Option */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormLimitType("INSTALLMENTS")}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      formLimitType === "INSTALLMENTS"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isRtl ? "محدد بعدد أقساط (مثلاً 12)" : "Fixed Installments"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormLimitType("UNLIMITED")}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      formLimitType === "UNLIMITED"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isRtl ? "مستمر دون حد (اشتراك)" : "Continuous (No limit)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormLimitType("END_DATE")}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      formLimitType === "END_DATE"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isRtl ? "محدد بتاريخ انتهاء" : "Fixed End Date"}
                  </button>
                </div>

                {/* Limit Input details */}
                {formLimitType === "INSTALLMENTS" && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700">{isRtl ? "إجمالي عدد الأقساط:" : "Total Installments:"}</label>
                    <input
                      type="number"
                      min="1"
                      max="360"
                      value={formTotalOccurrences}
                      onChange={(e) => setFormTotalOccurrences(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center"
                    />
                    <span className="text-xs text-slate-500">
                      {isRtl ? `(إجمالي القيمة: ${(Number(formAmount) * formTotalOccurrences).toFixed(3)} ${companySettings.defaultCurrency || "OMR"})` : ""}
                    </span>
                  </div>
                )}

                {formLimitType === "END_DATE" && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700">{isRtl ? "تاريخ النهاية:" : "End Date:"}</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                )}

                {/* Simulation Preview of Upcoming Dates */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-black text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    {t("scheduleSimulation")}
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {simulatedDates.map((d, i) => (
                      <span
                        key={i}
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          i === 0
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {i + 1}. {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Method & Bank */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">{t("paymentMethod")}</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="BANK_TRANSFER">{t("paymentMethodBankTransfer")}</option>
                    <option value="CHECK">{t("paymentMethodCheck")}</option>
                    <option value="CASH">{t("paymentMethodCash")}</option>
                    <option value="CREDIT_CARD">{t("paymentMethodCreditCard")}</option>
                    <option value="ONLINE">{t("paymentMethodOnline")}</option>
                    <option value="OTHER">{t("paymentMethodOther")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">{isRtl ? "اسم البنك / جهة الصرف" : "Bank Name"}</label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    placeholder="بنك مسقط / بنك ظفار..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Description & Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">{isRtl ? "البيان والملاحظات" : "Description & Notes"}</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={isRtl ? "مثال: القسط الشهري لعقد تمويل رقم MFC-9921..." : "Notes & contract details..."}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  {editingSchedule ? t("update") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTORY OF GENERATED VOUCHERS MODAL                                       */}
      {/* ========================================================================= */}
      {historySchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-scaleUp overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">{t("scheduleHistory")}</h3>
                  <p className="text-xs text-slate-300">{historySchedule.title}</p>
                </div>
              </div>
              <button
                onClick={() => setHistorySchedule(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {historySchedule.executions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">{isRtl ? "لم يتم إصدار أي سندات بعد لهذه الجدولة" : "No vouchers posted yet"}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historySchedule.executions.map((exec, idx) => (
                    <div
                      key={exec.id || idx}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          #{historySchedule.executions.length - idx}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{exec.voucherNumber}</div>
                          <div className="text-xs text-slate-500">
                            {isRtl ? "تاريخ التنفيذ:" : "Execution Date:"} <span className="font-mono">{exec.executionDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="text-sm font-black text-emerald-700">
                          {exec.amount.toFixed(3)} {exec.currency}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {isRtl ? "مرحل بنجاح" : "Posted"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-end">
              <button
                onClick={() => setHistorySchedule(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
