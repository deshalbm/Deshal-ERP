import React, { useState, useEffect } from "react";
import {
  LeaseContract,
  RentalSpace,
  Customer,
  CompanySettings,
  MembershipPackage,
  PaymentFrequency,
  LeaseContractType,
  LeaseContractStatus,
  PaymentInstallment,
  ContractClause,
  TenantDocument,
  TenantDocumentType
} from "../types";
import {
  DEFAULT_CONTRACT_CLAUSES
} from "../utils/storage";
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  PenTool,
  Upload,
  RefreshCw,
  Clock,
  Layers,
  FileCheck,
  Percent,
  Check
} from "lucide-react";
import { DigitalSignaturePad } from "./DigitalSignaturePad";

interface LeaseContractEditorModalProps {
  contractToEdit?: LeaseContract | null;
  spaces: RentalSpace[];
  customers: Customer[];
  packages: MembershipPackage[];
  companySettings: CompanySettings;
  onSaveContract: (contract: LeaseContract) => void;
  onClose: () => void;
}

export const LeaseContractEditorModal: React.FC<LeaseContractEditorModalProps> = ({
  contractToEdit,
  spaces,
  customers,
  packages,
  companySettings,
  onSaveContract,
  onClose
}) => {
  const [activeStep, setActiveStep] = useState<
    "parties" | "space" | "financials" | "deposit" | "quotas" | "clauses" | "signatures" | "documents"
  >("parties");

  // Form State
  const [contractNumber, setContractNumber] = useState<string>(
    contractToEdit?.contractNumber || `LC-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [titleAr, setTitleAr] = useState<string>(
    contractToEdit?.titleAr || "عقد إيجار مكتب تنفيذي خاص وتوفير خدمات أعمال مساندة"
  );
  const [contractType, setContractType] = useState<LeaseContractType>(
    contractToEdit?.contractType || "COMMERCIAL_OFFICE"
  );
  const [status, setStatus] = useState<LeaseContractStatus>(
    contractToEdit?.status || "ACTIVE"
  );

  // 1. Lessor State
  const [lessorCompanyName, setLessorCompanyName] = useState<string>(
    contractToEdit?.lessorCompanyName || companySettings.companyName
  );
  const [lessorCrNumber, setLessorCrNumber] = useState<string>(
    contractToEdit?.lessorCrNumber || companySettings.crNumber || "CR-1092831"
  );
  const [lessorTaxNumber, setLessorTaxNumber] = useState<string>(
    contractToEdit?.lessorTaxNumber || companySettings.taxId || "OM-94288394-B"
  );
  const [lessorRepresentative, setLessorRepresentative] = useState<string>(
    contractToEdit?.lessorRepresentative || companySettings.authorizedSignatoryName || "المفوض بالتوقيع"
  );
  const [lessorRepresentativeTitle, setLessorRepresentativeTitle] = useState<string>(
    contractToEdit?.lessorRepresentativeTitle || companySettings.authorizedSignatoryTitle || "المدير العام"
  );
  const [lessorPhone, setLessorPhone] = useState<string>(
    contractToEdit?.lessorPhone || companySettings.phone || "+968 77438203"
  );
  const [lessorEmail, setLessorEmail] = useState<string>(
    contractToEdit?.lessorEmail || companySettings.email || "digititech.com@gmail.com"
  );
  const [lessorAddress, setLessorAddress] = useState<string>(
    contractToEdit?.lessorAddress || companySettings.address || "لوى - شمال الباطنة - سلطنة عمان"
  );

  // 2. Tenant State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    contractToEdit?.customerId || (customers.length > 0 ? customers[0].id : "")
  );
  const [tenantName, setTenantName] = useState<string>(
    contractToEdit?.tenantName || (customers.length > 0 ? customers[0].name : "شركة الدليل الشامل")
  );
  const [tenantType, setTenantType] = useState<"CORPORATE" | "INDIVIDUAL">(
    contractToEdit?.tenantType || "CORPORATE"
  );
  const [tenantCrNumber, setTenantCrNumber] = useState<string>(
    contractToEdit?.tenantCrNumber || "CR-1088492"
  );
  const [tenantTaxNumber, setTenantTaxNumber] = useState<string>(
    contractToEdit?.tenantTaxNumber || "OM-TAX-7762"
  );
  const [tenantSignatoryName, setTenantSignatoryName] = useState<string>(
    contractToEdit?.tenantSignatoryName || "المهندس / أحمد بن خلفان المقبالي"
  );
  const [tenantSignatoryCivilId, setTenantSignatoryCivilId] = useState<string>(
    contractToEdit?.tenantSignatoryCivilId || "10982341"
  );
  const [tenantPhone, setTenantPhone] = useState<string>(
    contractToEdit?.tenantPhone || "+968 77627500"
  );
  const [tenantEmail, setTenantEmail] = useState<string>(
    contractToEdit?.tenantEmail || "info@deshalbm.com"
  );
  const [tenantAddress, setTenantAddress] = useState<string>(
    contractToEdit?.tenantAddress || "صحار - مبنى مدين للأعمال"
  );

  // 3. Space State
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    contractToEdit?.spaceId || (spaces.length > 0 ? spaces[0].id : "")
  );
  const [spaceCode, setSpaceCode] = useState<string>(
    contractToEdit?.spaceCode || (spaces.length > 0 ? spaces[0].code : "OFFICE-301")
  );
  const [spaceName, setSpaceName] = useState<string>(
    contractToEdit?.spaceName || (spaces.length > 0 ? spaces[0].name : "مكتب تنفيذي رقم 301")
  );
  const [branchName, setBranchName] = useState<string>(
    contractToEdit?.branchName || (spaces.length > 0 ? spaces[0].branchName : "فرع صحار الرئيسي")
  );
  const [branchId, setBranchId] = useState<string>(
    contractToEdit?.branchId || (spaces.length > 0 ? spaces[0].branchId : "br-sohar")
  );
  const [floorLocation, setFloorLocation] = useState<string>(
    contractToEdit?.floorLocation || "الطابق الثالث - جناح الأعمال"
  );
  const [areaSqm, setAreaSqm] = useState<number>(contractToEdit?.areaSqm || 30);
  const [capacityPersons, setCapacityPersons] = useState<number>(contractToEdit?.capacityPersons || 4);
  const [accessKeyCardsCount, setAccessKeyCardsCount] = useState<number>(contractToEdit?.accessKeyCardsCount || 3);
  const [assignedParkingSlots, setAssignedParkingSlots] = useState<string>(contractToEdit?.assignedParkingSlots || "موقف رقم B-12");

  // 4. Term & Duration
  const [startDate, setStartDate] = useState<string>(
    contractToEdit?.startDate || new Date().toISOString().split("T")[0]
  );
  const [durationMonths, setDurationMonths] = useState<number>(contractToEdit?.durationMonths || 12);
  const [endDate, setEndDate] = useState<string>(() => {
    if (contractToEdit?.endDate) return contractToEdit.endDate;
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(contractToEdit?.gracePeriodDays || 7);
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(contractToEdit?.noticePeriodDays || 60);
  const [autoRenew, setAutoRenew] = useState<boolean>(contractToEdit?.autoRenew ?? true);

  // 5. Financials
  const [monthlyRentRate, setMonthlyRentRate] = useState<number>(() => {
    if (contractToEdit) return contractToEdit.totalRentAmount / (contractToEdit.durationMonths || 12);
    return 350;
  });
  const [totalRentAmount, setTotalRentAmount] = useState<number>(contractToEdit?.totalRentAmount || 4200);
  const [discountAmount, setDiscountAmount] = useState<number>(contractToEdit?.discountAmount || 0);
  const [taxRate, setTaxRate] = useState<number>(contractToEdit?.taxRate || 5);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    contractToEdit?.paymentFrequency || "QUARTERLY"
  );
  const [installments, setInstallments] = useState<PaymentInstallment[]>(
    contractToEdit?.installments || []
  );

  // 6. Security Deposit
  const [depositAmount, setDepositAmount] = useState<number>(
    contractToEdit?.securityDeposit.depositAmount ?? 350
  );
  const [depositStatus, setDepositStatus] = useState(
    contractToEdit?.securityDeposit.status || "HELD_IN_CUSTODY"
  );
  const [heldAccountLedger, setHeldAccountLedger] = useState<string>(
    contractToEdit?.securityDeposit.heldAccountLedger || "حساب أمانات وتأمينات المستأجرين - بنك ظفار"
  );

  // 7. Included Quotas & Packages
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    contractToEdit?.linkedPackageId || (packages.length > 0 ? packages[0].id : "")
  );
  const [monthlyFreeMeetingRoomHours, setMonthlyFreeMeetingRoomHours] = useState<number>(
    contractToEdit?.monthlyFreeMeetingRoomHours ?? 20
  );
  const [monthlyFreeMediaStudioHours, setMonthlyFreeMediaStudioHours] = useState<number>(
    contractToEdit?.monthlyFreeMediaStudioHours ?? 4
  );
  const [monthlyFreeConsultations, setMonthlyFreeConsultations] = useState<number>(
    contractToEdit?.monthlyFreeConsultations ?? 2
  );
  const [tenantDiscountOnExtraServicesPercent, setTenantDiscountOnExtraServicesPercent] = useState<number>(
    contractToEdit?.tenantDiscountOnExtraServicesPercent ?? 20
  );

  // 8. Clauses
  const [clauses, setClauses] = useState<ContractClause[]>(
    contractToEdit?.clauses || DEFAULT_CONTRACT_CLAUSES
  );
  const [customTermsNotes, setCustomTermsNotes] = useState<string>(
    contractToEdit?.customTermsNotes || ""
  );

  // 9. Signatures
  const [lessorSignatureUrl, setLessorSignatureUrl] = useState<string>(
    contractToEdit?.lessorSignature?.signatureDataUrl || ""
  );
  const [tenantSignatureUrl, setTenantSignatureUrl] = useState<string>(
    contractToEdit?.tenantSignature?.signatureDataUrl || ""
  );
  const [activeSigningParty, setActiveSigningParty] = useState<"lessor" | "tenant" | null>(null);

  // 10. Documents
  const [documents, setDocuments] = useState<TenantDocument[]>(
    contractToEdit?.documents || []
  );
  const [newDocTitle, setNewDocTitle] = useState<string>("");
  const [newDocType, setNewDocType] = useState<TenantDocumentType>("CR_CERTIFICATE");
  const [newDocUrl, setNewDocUrl] = useState<string>("");

  // Auto update endDate when startDate or durationMonths change
  const updateDates = (start: string, months: number) => {
    setStartDate(start);
    setDurationMonths(months);
    try {
      const d = new Date(start);
      d.setMonth(d.getMonth() + months);
      d.setDate(d.getDate() - 1);
      setEndDate(d.toISOString().split("T")[0]);
    } catch {
      // fallback
    }
  };

  // Recalculate rent totals
  useEffect(() => {
    const total = monthlyRentRate * durationMonths;
    setTotalRentAmount(total);
  }, [monthlyRentRate, durationMonths]);

  // Handle Space Selection Change
  const handleSpaceChange = (sId: string) => {
    setSelectedSpaceId(sId);
    const sp = spaces.find((s) => s.id === sId);
    if (sp) {
      setSpaceCode(sp.code);
      setSpaceName(sp.name);
      setBranchName(sp.branchName);
      setBranchId(sp.branchId);
      if (sp.floorLocation) setFloorLocation(sp.floorLocation);
      if (sp.capacity) setCapacityPersons(sp.capacity);
      if (sp.monthlyRate) {
        setMonthlyRentRate(sp.monthlyRate);
      }
    }
  };

  // Handle Customer Selection Change
  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    const cust = customers.find((c) => c.id === cId);
    if (cust) {
      setTenantName(cust.name);
      if (cust.phone) setTenantPhone(cust.phone);
      if (cust.email) setTenantEmail(cust.email);
      if (cust.address) setTenantAddress(cust.address);
      if (cust.taxId) setTenantTaxNumber(cust.taxId);
    }
  };

  // Handle Package Selection Change
  const handlePackageChange = (pId: string) => {
    setSelectedPackageId(pId);
    const pkg = packages.find((p) => p.id === pId);
    if (pkg) {
      setMonthlyFreeMeetingRoomHours(pkg.freeMeetingRoomHoursPerMonth);
      setMonthlyFreeMediaStudioHours(pkg.freeMediaStudioHoursPerMonth);
      setMonthlyFreeConsultations(pkg.freeConsultationSessionsPerMonth);
      setTenantDiscountOnExtraServicesPercent(pkg.discountOnExtraServicesPercent);
    }
  };

  // Auto Generate Installments Schedule
  const generateInstallmentsSchedule = () => {
    const netTotal = Math.max(0, totalRentAmount - discountAmount);
    let count = 1;
    let monthsStep = 12;

    switch (paymentFrequency) {
      case "MONTHLY":
        count = durationMonths;
        monthsStep = 1;
        break;
      case "QUARTERLY":
        count = Math.max(1, Math.ceil(durationMonths / 3));
        monthsStep = 3;
        break;
      case "SEMI_ANNUAL":
        count = Math.max(1, Math.ceil(durationMonths / 6));
        monthsStep = 6;
        break;
      case "ANNUAL":
        count = Math.max(1, Math.ceil(durationMonths / 12));
        monthsStep = 12;
        break;
      case "LUMP_SUM":
        count = 1;
        monthsStep = durationMonths;
        break;
    }

    const perInstAmount = Number((netTotal / count).toFixed(3));
    const perInstTax = Number((perInstAmount * (taxRate / 100)).toFixed(3));
    const perInstTotal = perInstAmount + perInstTax;

    const newInsts: PaymentInstallment[] = [];
    const baseDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
      const dueDateObj = new Date(baseDate);
      dueDateObj.setMonth(baseDate.getMonth() + i * monthsStep);
      const dueDateStr = dueDateObj.toISOString().split("T")[0];

      let title = `الدفعة الإيجارية رقم ${i + 1}`;
      if (paymentFrequency === "MONTHLY") {
        title = `الإيجار الشهري - الدفعة ${i + 1}`;
      } else if (paymentFrequency === "QUARTERLY") {
        title = `الدفعة الإيجارية (الربع ${i + 1}) لسنة التعاقد`;
      } else if (paymentFrequency === "SEMI_ANNUAL") {
        title = `الدفعة الإيجارية (النصف ${i + 1})`;
      }

      newInsts.push({
        id: `inst-gen-${Date.now()}-${i + 1}`,
        installmentNumber: i + 1,
        titleAr: title,
        dueDate: dueDateStr,
        amount: perInstAmount,
        taxRate: taxRate,
        taxAmount: perInstTax,
        totalAmount: perInstTotal,
        currency: "OMR",
        status: i === 0 && contractToEdit?.installments?.[0]?.status === "PAID" ? "PAID" : "PENDING",
        paidDate: i === 0 && contractToEdit?.installments?.[0]?.status === "PAID" ? startDate : undefined,
        linkedVoucherNumber: i === 0 ? contractToEdit?.installments?.[0]?.linkedVoucherNumber : undefined
      });
    }

    setInstallments(newInsts);
  };

  // Add Document
  const handleAddDocument = () => {
    if (!newDocTitle.trim()) return;
    const doc: TenantDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      type: newDocType,
      fileName: `${newDocTitle.trim().replace(/\s+/g, "_")}.pdf`,
      fileSize: "1.2 MB",
      fileUrl: newDocUrl || "https://example.com/document.pdf",
      uploadedAt: new Date().toISOString()
    };
    setDocuments((prev) => [...prev, doc]);
    setNewDocTitle("");
    setNewDocUrl("");
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Final Save Handler
  const handleSave = () => {
    const netRent = Math.max(0, totalRentAmount - discountAmount);
    const calcTax = Number((netRent * (taxRate / 100)).toFixed(3));
    const finalVal = netRent + calcTax;

    const targetSpace = spaces.find((s) => s.id === selectedSpaceId);

    const contract: LeaseContract = {
      id: contractToEdit?.id || `lc-${Date.now()}`,
      contractNumber,
      titleAr,
      contractType,
      status,
      lessorCompanyName,
      lessorCrNumber,
      lessorTaxNumber,
      lessorRepresentative,
      lessorRepresentativeTitle,
      lessorPhone,
      lessorEmail,
      lessorAddress,
      customerId: selectedCustomerId,
      tenantName,
      tenantType,
      tenantCrNumber,
      tenantTaxNumber,
      tenantSignatoryName,
      tenantSignatoryCivilId,
      tenantPhone,
      tenantEmail,
      tenantAddress,
      spaceId: selectedSpaceId,
      spaceCode,
      spaceName,
      spaceType: targetSpace?.type || "PRIVATE_OFFICE",
      branchId,
      branchName,
      floorLocation,
      areaSqm,
      capacityPersons,
      accessKeyCardsCount,
      assignedParkingSlots,
      startDate,
      endDate,
      durationMonths,
      gracePeriodDays,
      noticePeriodDays,
      autoRenew,
      totalRentAmount,
      discountAmount,
      taxRate,
      taxAmount: calcTax,
      finalContractValue: finalVal,
      currency: "OMR",
      paymentFrequency,
      includedAmenities: {
        highSpeedInternet: true,
        electricityAndWater: true,
        centralAirConditioning: true,
        dailyCleaningService: true,
        receptionAndMailHandling: true,
        smartAccessControl: true,
        maintenanceSupport: true,
        beverageAndCoffeeStation: true
      },
      securityDeposit: {
        depositAmount,
        currency: "OMR",
        status: depositStatus as any,
        heldAccountLedger,
        paidDate: contractToEdit?.securityDeposit?.paidDate || startDate,
        paidReceiptVoucherNumber: contractToEdit?.securityDeposit?.paidReceiptVoucherNumber
      },
      installments: installments.length > 0 ? installments : [
        {
          id: `inst-1`,
          installmentNumber: 1,
          titleAr: "الدفعة الإيجارية الأولى",
          dueDate: startDate,
          amount: netRent,
          taxRate,
          taxAmount: calcTax,
          totalAmount: finalVal,
          currency: "OMR",
          status: "PENDING"
        }
      ],
      linkedPackageId: selectedPackageId,
      packageName: packages.find((p) => p.id === selectedPackageId)?.name || "باقة المستأجرين",
      monthlyFreeMeetingRoomHours,
      monthlyFreeMediaStudioHours,
      monthlyFreeConsultations,
      tenantDiscountOnExtraServicesPercent,
      clauses,
      customTermsNotes,
      lessorSignature: lessorSignatureUrl
        ? {
            signatureDataUrl: lessorSignatureUrl,
            signatoryName: lessorRepresentative,
            signatoryTitle: lessorRepresentativeTitle,
            signedAt: contractToEdit?.lessorSignature?.signedAt || new Date().toISOString()
          }
        : undefined,
      tenantSignature: tenantSignatureUrl
        ? {
            signatureDataUrl: tenantSignatureUrl,
            signatoryName: tenantSignatoryName,
            signatoryCivilId: tenantSignatoryCivilId,
            signedAt: contractToEdit?.tenantSignature?.signedAt || new Date().toISOString()
          }
        : undefined,
      isDigitallySigned: Boolean(lessorSignatureUrl && tenantSignatureUrl),
      signatureVerificationCode: contractToEdit?.signatureVerificationCode || `VER-OM-${Math.floor(100000 + Math.random() * 900000)}-SIGN`,
      documents,
      preparedByName: lessorRepresentative,
      createdAt: contractToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveContract(contract);
  };

  const stepsList = [
    { id: "parties", label: "أطراف العقد", icon: Users },
    { id: "space", label: "العين المؤجرة", icon: Building2 },
    { id: "financials", label: "المدة وجدولة الدفعات", icon: DollarSign },
    { id: "deposit", label: "الضمان المالي والتأمين", icon: ShieldCheck },
    { id: "quotas", label: "الباقة والحصص المجانية", icon: Sparkles },
    { id: "clauses", label: "الشروط والبنود القانونية", icon: FileText },
    { id: "signatures", label: "التوقيع الإلكتروني", icon: PenTool },
    { id: "documents", label: "أرشيف الوثائق والمستندات", icon: Upload }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 text-right font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {contractToEdit ? "تعديل وإدارة عقد الإيجار" : "إنشاء وإصدار عقد إيجار تجاري ذكي جديد"}
                </h2>
                <span className="text-xs bg-indigo-600/60 font-mono px-2 py-0.5 rounded text-indigo-100">
                  {contractNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                إدارة عقود المستأجرين، ربط الدفعات، التوقيع الرقمي وتتبع الضمانات المالية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {stepsList.map((st, idx) => {
              const Icon = st.icon;
              const isActive = activeStep === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setActiveStep(st.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: PARTIES */}
          {activeStep === "parties" && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">نوع العقد</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as LeaseContractType)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                  >
                    <option value="COMMERCIAL_OFFICE">مكتب تجاري / تنفيذي خاص</option>
                    <option value="COWORKING_DEDICATED_DESK">مكتب مخصص بمساحة عمل مشتركة</option>
                    <option value="FLEX_SPACE">مساحة عمل مرنة</option>
                    <option value="VIRTUAL_OFFICE">مكتب افتراضي وترخيص بلدي</option>
                    <option value="EVENT_HALL_RETAINER">حجز دوري لقاعات التدريب والفعاليات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">حالة العقد</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeaseContractStatus)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                  >
                    <option value="ACTIVE">ساري ومعتمد (Active)</option>
                    <option value="PENDING_SIGNATURE">بانتظار التوقيع (Pending)</option>
                    <option value="DRAFT">مسودة (Draft)</option>
                    <option value="EXPIRING_SOON">قريب الانتهاء (Expiring Soon)</option>
                    <option value="EXPIRED">منتهي (Expired)</option>
                    <option value="TERMINATED">مفسوخ (Terminated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">عنوان العقد بالعربية</label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              {/* Two Parties Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Party 1: Lessor */}
                <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-700" />
                      الطرف الأول (المؤجر / صاحب المنشأة)
                    </h3>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      Lessor
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">اسم الشركة / المؤجر</label>
                      <input
                        type="text"
                        value={lessorCompanyName}
                        onChange={(e) => setLessorCompanyName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">السجل التجاري CR</label>
                        <input
                          type="text"
                          value={lessorCrNumber}
                          onChange={(e) => setLessorCrNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">الرقم الضريبي VAT</label>
                        <input
                          type="text"
                          value={lessorTaxNumber}
                          onChange={(e) => setLessorTaxNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">المفوض بالتوقيع</label>
                        <input
                          type="text"
                          value={lessorRepresentative}
                          onChange={(e) => setLessorRepresentative(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">المسمى الوظيفي</label>
                        <input
                          type="text"
                          value={lessorRepresentativeTitle}
                          onChange={(e) => setLessorRepresentativeTitle(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">الهاتف</label>
                        <input
                          type="text"
                          value={lessorPhone}
                          onChange={(e) => setLessorPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={lessorEmail}
                          onChange={(e) => setLessorEmail(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">العنوان الرسمي</label>
                      <input
                        type="text"
                        value={lessorAddress}
                        onChange={(e) => setLessorAddress(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Party 2: Tenant */}
                <div className="bg-emerald-50/30 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-700" />
                      الطرف الثاني (المستأجر / العميل)
                    </h3>
                    {customers.length > 0 && (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-1 rounded border border-emerald-300"
                      >
                        <option value="">-- اختيار من سجل العملاء CRM --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">اسم المستأجر / المؤسسة</label>
                      <input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">السجل التجاري CR</label>
                        <input
                          type="text"
                          value={tenantCrNumber}
                          onChange={(e) => setTenantCrNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">الرقم الضريبي VAT</label>
                        <input
                          type="text"
                          value={tenantTaxNumber}
                          onChange={(e) => setTenantTaxNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">المفوض بالتوقيع</label>
                        <input
                          type="text"
                          value={tenantSignatoryName}
                          onChange={(e) => setTenantSignatoryName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">الرقم المدني / البطاقة</label>
                        <input
                          type="text"
                          value={tenantSignatoryCivilId}
                          onChange={(e) => setTenantSignatoryCivilId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">الهاتف</label>
                        <input
                          type="text"
                          value={tenantPhone}
                          onChange={(e) => setTenantPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-0.5">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={tenantEmail}
                          onChange={(e) => setTenantEmail(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">العنوان الوطني / صندوق البريد</label>
                      <input
                        type="text"
                        value={tenantAddress}
                        onChange={(e) => setTenantAddress(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LEASED SPACE */}
          {activeStep === "space" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    اختيار الوحدة / المساحة المؤجرة من القائمة
                  </h3>
                  {spaces.length > 0 && (
                    <span className="text-xs text-slate-500">
                      متاح {spaces.length} مساحات ومكاتب مسجلة
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {spaces.map((sp) => {
                    const isSelected = selectedSpaceId === sp.id;
                    return (
                      <div
                        key={sp.id}
                        onClick={() => handleSpaceChange(sp.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/60 border-indigo-600 ring-2 ring-indigo-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-900">{sp.name}</span>
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {sp.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <div>الفرع: {sp.branchName}</div>
                          <div>الإيجار الشهري: <span className="font-bold text-emerald-700">{sp.monthlyRate} ر.ع</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Specs for the selected space */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">كود الوحدة / المكتب</label>
                  <input
                    type="text"
                    value={spaceCode}
                    onChange={(e) => setSpaceCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">اسم الوحدة بالعقد</label>
                  <input
                    type="text"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الطابق والموقع</label>
                  <input
                    type="text"
                    value={floorLocation}
                    onChange={(e) => setFloorLocation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">المساحة المقدرة (م²)</label>
                  <input
                    type="number"
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">السعة القصوى (أشخاص)</label>
                  <input
                    type="number"
                    value={capacityPersons}
                    onChange={(e) => setCapacityPersons(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">بطاقات الدخول الذكية</label>
                  <input
                    type="number"
                    value={accessKeyCardsCount}
                    onChange={(e) => setAccessKeyCardsCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-600 font-semibold mb-1">المواقف المخصصة</label>
                  <input
                    type="text"
                    value={assignedParkingSlots}
                    onChange={(e) => setAssignedParkingSlots(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIALS & INSTALLMENTS */}
          {activeStep === "financials" && (
            <div className="space-y-6">
              {/* Term & Pricing Parameters */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  مدة التعاقد والقيمة المالية الإيجارية
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">تاريخ بداية العقد</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => updateDates(e.target.value, durationMonths)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">مدة العقد بالشهور</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={durationMonths}
                      onChange={(e) => updateDates(startDate, Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">تاريخ انتهاء العقد</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">دورية سداد الأقساط</label>
                    <select
                      value={paymentFrequency}
                      onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                    >
                      <option value="MONTHLY">شهري (Monthly)</option>
                      <option value="QUARTERLY">ربع سنوي - كل 3 أشهر</option>
                      <option value="SEMI_ANNUAL">نصف سنوي - كل 6 أشهر</option>
                      <option value="ANNUAL">سنوي دفعة واحدة</option>
                      <option value="LUMP_SUM">دفعة واحدة مقدماً</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">الإيجار الشهري الأساسي (ر.ع)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={monthlyRentRate}
                      onChange={(e) => setMonthlyRentRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">إجمالي الإيجار قبل الضريبة</label>
                    <input
                      type="number"
                      readOnly
                      value={totalRentAmount}
                      className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">الخصم الإجمالي (ر.ع)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ضريبة القيمة المضافة (5%)</label>
                    <div className="font-mono font-black text-slate-900 p-2 bg-slate-100 border border-slate-300 rounded-lg">
                      {((Math.max(0, totalRentAmount - discountAmount) * taxRate) / 100).toFixed(3)} ر.ع
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs">
                    <span className="text-slate-500">القيمة الإجمالية للعقد (شاملة الضريبة): </span>
                    <span className="text-base font-black text-indigo-950 font-mono">
                      {(
                        Math.max(0, totalRentAmount - discountAmount) +
                        (Math.max(0, totalRentAmount - discountAmount) * taxRate) / 100
                      ).toFixed(3)}{" "}
                      ر.ع
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={generateInstallmentsSchedule}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>توليد وتحديث جدول الأقساط آلياً</span>
                  </button>
                </div>
              </div>

              {/* Installments Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between border-b border-slate-200">
                  <span>جدول الأقساط والدفعات الإيجارية المجدولة ({installments.length} دفعات)</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    يمكن تعديل كل قسط أو تحصيله لاحقاً وإصدار سند قبض فوري
                  </span>
                </div>

                {installments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>لم يتم توليد أقساط بعد. اضغط على زر "توليد وتحديث جدول الأقساط آلياً".</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 text-[11px]">
                        <tr>
                          <th className="p-2.5 text-center w-10">#</th>
                          <th className="p-2.5">بيان الدفعة</th>
                          <th className="p-2.5 text-center">تاريخ الاستحقاق</th>
                          <th className="p-2.5 text-left">المبلغ الصافي</th>
                          <th className="p-2.5 text-left">الضريبة (5%)</th>
                          <th className="p-2.5 text-left">الإجمالي</th>
                          <th className="p-2.5 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {installments.map((inst, index) => (
                          <tr key={inst.id || index} className="hover:bg-slate-50/80">
                            <td className="p-2.5 text-center font-bold text-slate-600">
                              {inst.installmentNumber}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={inst.titleAr}
                                onChange={(e) => {
                                  const updated = [...installments];
                                  updated[index].titleAr = e.target.value;
                                  setInstallments(updated);
                                }}
                                className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 pb-0.5 text-slate-800"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="date"
                                value={inst.dueDate}
                                onChange={(e) => {
                                  const updated = [...installments];
                                  updated[index].dueDate = e.target.value;
                                  setInstallments(updated);
                                }}
                                className="bg-transparent border-b border-dashed border-slate-300 text-center font-mono"
                              />
                            </td>
                            <td className="p-2.5 text-left font-mono font-bold text-slate-700">
                              {inst.amount.toFixed(3)} ر.ع
                            </td>
                            <td className="p-2.5 text-left font-mono text-slate-500">
                              {inst.taxAmount.toFixed(3)} ر.ع
                            </td>
                            <td className="p-2.5 text-left font-mono font-bold text-indigo-900">
                              {inst.totalAmount.toFixed(3)} ر.ع
                            </td>
                            <td className="p-2.5 text-center">
                              <select
                                value={inst.status}
                                onChange={(e) => {
                                  const updated = [...installments];
                                  updated[index].status = e.target.value as any;
                                  setInstallments(updated);
                                }}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  inst.status === "PAID"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                }`}
                              >
                                <option value="PENDING">مستحقة بالسداد</option>
                                <option value="PAID">مسددة (Paid)</option>
                                <option value="OVERDUE">متأخرة (Overdue)</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SECURITY DEPOSIT */}
          {activeStep === "deposit" && (
            <div className="space-y-4">
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      الضمان المالي والتأمين المسترد (Security Deposit Custody)
                    </h3>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      مبلغ تأمين يحفظ كأمانة لدى المؤجر ويسترد بالكامل عند انتهاء العقد وتسليم العين المؤجرة
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                    أمانة مستردة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">مبلغ التأمين المسترد (ر.ع)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono font-black text-slate-900 text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">حالة التأمين</label>
                    <select
                      value={depositStatus}
                      onChange={(e) => setDepositStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                    >
                      <option value="HELD_IN_CUSTODY">محفوظ كأمانة تأمين (Held in Custody)</option>
                      <option value="UNPAID">لم يسدد بعد (Unpaid)</option>
                      <option value="FULLY_REFUNDED">تم رده بالكامل للمستأجر (Refunded)</option>
                      <option value="PARTIALLY_REFUNDED">مسترد جزئياً بعد الخصم</option>
                      <option value="FORFEITED">مصادر لتعويض تلفيات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">حساب الأمانة المودع به</label>
                    <input
                      type="text"
                      value={heldAccountLedger}
                      onChange={(e) => setHeldAccountLedger(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-slate-700 leading-relaxed">
                  <span className="font-bold text-emerald-950 block mb-1">إجراءات استرداد التأمين عند الإخلاء:</span>
                  يتم إجراء فحص استلام وتسليم المكتب بمعاينة الأثاث والتجهيزات وشاشات العرض وبطاقات الدخول الذكية وتسوية فواتير الخدمات الإضافية، ليتم تحويل التأمين لحساب المستأجر أو إصدار سند صرف فوري.
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: MEMBERSHIP & QUOTAS */}
          {activeStep === "quotas" && (
            <div className="space-y-4">
              <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-3">
                  <div>
                    <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-indigo-700" />
                      باقة المستأجر ورصيد الحصص الشهرية المجانية الملحقة
                    </h3>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      تتجدد هذه الحصص شهرياً طوال مدة سريان العقد وتخصم تلقائياً عند قيام المستأجر بالحجز
                    </p>
                  </div>
                  {packages.length > 0 && (
                    <select
                      value={selectedPackageId}
                      onChange={(e) => handlePackageChange(e.target.value)}
                      className="bg-indigo-100 text-indigo-950 font-bold px-3 py-1 rounded-lg border border-indigo-300 text-xs"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <label className="block text-slate-600 font-semibold mb-1">ساعات قاعات الاجتماعات</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={monthlyFreeMeetingRoomHours}
                        onChange={(e) => setMonthlyFreeMeetingRoomHours(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-900 text-base"
                      />
                      <span className="text-slate-500 text-xs">ساعة/شهر</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <label className="block text-slate-600 font-semibold mb-1">ساعات الاستوديو والبودكاست</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={monthlyFreeMediaStudioHours}
                        onChange={(e) => setMonthlyFreeMediaStudioHours(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-900 text-base"
                      />
                      <span className="text-slate-500 text-xs">ساعة/شهر</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <label className="block text-slate-600 font-semibold mb-1">جلسات الاستشارات المجانية</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={monthlyFreeConsultations}
                        onChange={(e) => setMonthlyFreeConsultations(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-900 text-base"
                      />
                      <span className="text-slate-500 text-xs">جلسة/شهر</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <label className="block text-slate-600 font-semibold mb-1">خصم الخدمات الإضافية</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={tenantDiscountOnExtraServicesPercent}
                        onChange={(e) => setTenantDiscountOnExtraServicesPercent(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-900 text-base"
                      />
                      <span className="text-slate-500 text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CLAUSES */}
          {activeStep === "clauses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    البنود والشروط والأحكام التعاقدية (Contract Clauses)
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    تمت صياغة هذه البنود وفق الأنظمة واللوائح القانونية المعتمدة في سلطنة عمان
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newClause: ContractClause = {
                      id: `cl-custom-${Date.now()}`,
                      titleAr: `بند إضافي رقم ${clauses.length + 1}`,
                      contentAr: "نص البند الإضافي...",
                      isMandatory: false,
                      order: clauses.length + 1
                    };
                    setClauses([...clauses, newClause]);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة بند خاص جديد</span>
                </button>
              </div>

              <div className="space-y-3">
                {clauses.map((clause, idx) => (
                  <div key={clause.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={clause.titleAr}
                        onChange={(e) => {
                          const updated = [...clauses];
                          updated[idx].titleAr = e.target.value;
                          setClauses(updated);
                        }}
                        className="font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 flex-1 text-xs"
                      />
                      {!clause.isMandatory && (
                        <button
                          type="button"
                          onClick={() => setClauses(clauses.filter((_, i) => i !== idx))}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="حذف البند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={clause.contentAr}
                      onChange={(e) => {
                        const updated = [...clauses];
                        updated[idx].contentAr = e.target.value;
                        setClauses(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-slate-700 leading-relaxed text-xs"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                  شروط وملاحظات استثنائية إضافية (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={customTermsNotes}
                  onChange={(e) => setCustomTermsNotes(e.target.value)}
                  placeholder="أدخل أي بنود أو اتفاقات خاصة بين الطرفين..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* STEP 7: DIGITAL SIGNATURES */}
          {activeStep === "signatures" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  التوقيع والاعتماد الإلكتروني الذكي للطرفين
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  يمكن التوقيع مباشرة على الشاشة أو رفع صورة التوقيع المعتمد وتوليد ختم التوثيق الرقمي
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lessor Signature */}
                <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <span className="font-bold text-indigo-950">توقيع الطرف الأول (المؤجر):</span>
                    <span className="text-slate-500">{lessorRepresentative}</span>
                  </div>

                  <div className="h-28 border border-dashed border-indigo-300 bg-white rounded-lg flex items-center justify-center relative overflow-hidden">
                    {lessorSignatureUrl ? (
                      <img
                        src={lessorSignatureUrl}
                        alt="توقيع المؤجر"
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs">لم يتم التوقيع بعد</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSigningParty("lessor")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{lessorSignatureUrl ? "إعادة التوقيع" : "توقيع المؤجر الآن"}</span>
                    </button>
                    {lessorSignatureUrl && (
                      <button
                        type="button"
                        onClick={() => setLessorSignatureUrl("")}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200"
                        title="مسح التوقيع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tenant Signature */}
                <div className="bg-emerald-50/30 border border-emerald-200 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <span className="font-bold text-emerald-950">توقيع الطرف الثاني (المستأجر):</span>
                    <span className="text-slate-500">{tenantSignatoryName}</span>
                  </div>

                  <div className="h-28 border border-dashed border-emerald-300 bg-white rounded-lg flex items-center justify-center relative overflow-hidden">
                    {tenantSignatureUrl ? (
                      <img
                        src={tenantSignatureUrl}
                        alt="توقيع المستأجر"
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs">لم يتم توقيع المستأجر بعد</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSigningParty("tenant")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{tenantSignatureUrl ? "إعادة التوقيع" : "توقيع المستأجر الآن"}</span>
                    </button>
                    {tenantSignatureUrl && (
                      <button
                        type="button"
                        onClick={() => setTenantSignatureUrl("")}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200"
                        title="مسح التوقيع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: DOCUMENTS ARCHIVE */}
          {activeStep === "documents" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  أرشيف وثائق ومستندات المستأجر والترخيص
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  حفظ السجل التجاري CR، بطاقة الهوية، الترخيص البلدي، ومحاضر فحص واستلام العين المؤجرة
                </p>
              </div>

              {/* Add Document Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">اسم الوثيقة</label>
                    <input
                      type="text"
                      placeholder="مثال: السجل التجاري CR"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">نوع المستند</label>
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as TenantDocumentType)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    >
                      <option value="CR_CERTIFICATE">شهادة السجل التجاري CR</option>
                      <option value="CIVIL_ID_CARD">بطاقة الهوية المدنية</option>
                      <option value="MUNICIPAL_LICENSE">الترخيص البلدي وعقد الإيجار</option>
                      <option value="HANDOVER_INSPECTION">محضر استلام وتسليم المكتب</option>
                      <option value="VAT_CERTIFICATE">شهادة ضريبة القيمة المضافة</option>
                      <option value="PAYMENT_RECEIPT">إيصال سداد / شيك بنكي</option>
                      <option value="OTHER_ATTACHMENT">مستندات ومرفقات أخرى</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة للأرشيف</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                    لا توجد مستندات مرفقة بالعقد حالياً.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          <div className="text-[11px] text-slate-500">{doc.fileName} • {doc.uploadedAt.split("T")[0]}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{contractToEdit ? "حفظ التعديلات على العقد" : "اعتماد وإصدار العقد رسمياً"}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Signature Capture Modal overlay */}
      {activeSigningParty && (
        <DigitalSignaturePad
          signatoryName={activeSigningParty === "lessor" ? lessorRepresentative : tenantSignatoryName}
          signatoryTitle={activeSigningParty === "lessor" ? lessorRepresentativeTitle : "المخول بالتوقيع"}
          onSaveSignature={(sigUrl) => {
            if (activeSigningParty === "lessor") {
              setLessorSignatureUrl(sigUrl);
            } else {
              setTenantSignatureUrl(sigUrl);
            }
            setActiveSigningParty(null);
          }}
          onClose={() => setActiveSigningParty(null)}
        />
      )}
    </div>
  );
};
