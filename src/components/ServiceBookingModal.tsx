import React, { useState, useEffect } from "react";
import {
  ConsultingService,
  Customer,
  TenantSubscription,
  ServiceBooking,
  PaymentMethod,
  ReceiptVoucher
} from "../types";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Video,
  MapPin,
  FileText,
  FileCheck,
  CreditCard,
  Banknote,
  Receipt,
  HelpCircle,
  Briefcase
} from "lucide-react";
import { numberToWords } from "../utils/numberToWords";

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ConsultingService | null;
  services: ConsultingService[];
  customers: Customer[];
  subscriptions: TenantSubscription[];
  onConfirmBooking: (
    newBooking: ServiceBooking,
    autoGenerateVoucher: boolean,
    deductFromSubscriptionId?: string
  ) => void;
}

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  isOpen,
  onClose,
  service,
  services,
  customers,
  subscriptions,
  onConfirmBooking
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");

  const [consultationType, setConsultationType] = useState<
    "IN_PERSON" | "ONLINE_MEETING" | "OFFICE_VISIT" | "WRITTEN_REPORT"
  >("IN_PERSON");
  const [preferredDate, setPreferredDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [preferredTime, setPreferredTime] = useState<string>("10:00");
  const [scopeDetails, setScopeDetails] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [autoGenerateVoucher, setAutoGenerateVoucher] = useState<boolean>(true);

  // Tenant Quota Selection
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [useFreeQuota, setUseFreeQuota] = useState<boolean>(false);

  useEffect(() => {
    if (service) {
      setSelectedServiceId(service.id);
    } else if (services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [service, services]);

  const currentService = services.find((s) => s.id === selectedServiceId) || service;

  // Sync customer details when selecting an existing customer
  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    if (!cId) return;

    const c = customers.find((cust) => cust.id === cId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone || "");
      setCustomerEmail(c.email || "");
      setCompanyName(c.type === "CORPORATE" ? c.name : "");

      // Check if this customer has an active tenant subscription
      const sub = subscriptions.find(
        (s) => (s.customerId === c.id || s.customerName.trim().toLowerCase() === c.name.trim().toLowerCase()) && s.status === "ACTIVE"
      );
      if (sub) {
        setSelectedSubscriptionId(sub.id);
        // If service is eligible and client has remaining free consultations, enable quota by default
        const remainingConsultations = Math.max(0, sub.consultationSessionsQuota - sub.consultationSessionsUsed);
        if (remainingConsultations > 0 && currentService?.includedInTenantPackage) {
          setUseFreeQuota(true);
        } else {
          setUseFreeQuota(false);
        }
      } else {
        setSelectedSubscriptionId("");
        setUseFreeQuota(false);
      }
    }
  };

  const activeSub = subscriptions.find((s) => s.id === selectedSubscriptionId);
  const remainingConsultations = activeSub
    ? Math.max(0, activeSub.consultationSessionsQuota - activeSub.consultationSessionsUsed)
    : 0;

  // Financial Calculations
  const basePrice = currentService ? currentService.basePrice : 0;
  const discountPercent = activeSub && !useFreeQuota ? activeSub.discountOnExtraServicesPercent : 0;
  
  let finalAmount = basePrice;
  let discountAmount = 0;

  if (useFreeQuota && remainingConsultations > 0 && currentService?.includedInTenantPackage) {
    finalAmount = 0;
    discountAmount = basePrice;
  } else if (discountPercent > 0) {
    discountAmount = (basePrice * discountPercent) / 100;
    finalAmount = Math.max(0, basePrice - discountAmount);
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService || !customerName.trim() || !customerPhone.trim()) return;

    const bookingNum = `SBK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: ServiceBooking = {
      id: `sbk-${Date.now()}`,
      bookingNumber: bookingNum,
      serviceId: currentService.id,
      serviceName: currentService.name,
      category: currentService.category,
      customerId: customerId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      companyName: companyName.trim() || undefined,
      consultationType: consultationType,
      preferredDate: preferredDate,
      preferredTime: preferredTime,
      duration: currentService.estimatedDuration || "جلسة 60 دقيقة",
      scopeDetails: scopeDetails.trim() || `طلب خدمة / استشارة ${currentService.name}`,
      assignedConsultant: "فريق الخبراء والاستشاريين المعتمدين",
      isCoveredByMembership: useFreeQuota && remainingConsultations > 0,
      tenantSubscriptionId: useFreeQuota ? selectedSubscriptionId : undefined,
      price: basePrice,
      discount: discountAmount,
      finalAmount: finalAmount,
      currency: currentService.currency || "OMR",
      status: "CONFIRMED",
      paymentStatus: finalAmount === 0 ? "FREE_QUOTA" : "PAID",
      paymentMethod: finalAmount > 0 ? paymentMethod : undefined,
      meetingLink:
        consultationType === "ONLINE_MEETING"
          ? "https://meet.google.com/deshal-erp-consulting"
          : undefined,
      createdByType: "STAFF",
      createdByName: "فريق إدارة الخدمات",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onConfirmBooking(
      newBooking,
      autoGenerateVoucher && finalAmount > 0,
      useFreeQuota ? selectedSubscriptionId : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-l from-indigo-700 via-indigo-600 to-blue-600 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">حجز خدمة أو استشارة استراتيجية</h3>
              <p className="text-sm text-indigo-100 mt-0.5">
                تأكيد طلب الخدمات المحاسبية، التسويق، الاستوديو، المواقع، والـ PRO
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Service Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              الخدمة المطلوبة
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.basePrice} {s.currency} - {s.estimatedDuration || "مستمر"})
                </option>
              ))}
            </select>

            {currentService && (
              <div className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>{currentService.shortDescription}</span>
                <span className="font-bold text-indigo-600 whitespace-nowrap bg-indigo-50 px-2.5 py-1 rounded-md">
                  السعر الأساسي: {currentService.basePrice} {currentService.currency}
                </span>
              </div>
            )}
          </div>

          {/* Customer Selection & Tenant Quota Detection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                بيانات العميل / المستأجر
              </label>
              {customers.length > 0 && (
                <div className="w-56">
                  <select
                    value={customerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
                  >
                    <option value="">-- اختيار من دليل العملاء --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم العميل / المؤسسة *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: شركة الدليل الشامل"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">رقم الهاتف / الواتساب *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+968 7762 7500"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-left font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="info@company.om"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم الشركة / النشاط (اختياري)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="شركة الدليل الشامل للتجارة"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tenant Subscription & Free Quota Alert Box */}
          {activeSub && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      مشترك في {activeSub.packageName}
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      الرصيد المتبقي: <strong>{remainingConsultations}</strong> استشارات مجانية | خصم {activeSub.discountOnExtraServicesPercent}% على باقي الخدمات
                    </p>
                  </div>
                </div>

                {remainingConsultations > 0 && currentService?.includedInTenantPackage ? (
                  <label className="flex items-center gap-2 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors shadow-sm">
                    <input
                      type="checkbox"
                      checked={useFreeQuota}
                      onChange={(e) => setUseFreeQuota(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>استخدام استشارة مجانية</span>
                  </label>
                ) : (
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
                    يتم تطبيق خصم {activeSub.discountOnExtraServicesPercent}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Appointment Timing & Consultation Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                تاريخ الموعد
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                التوقيت المفضل
              </label>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" />
                طريقة التقديم
              </label>
              <select
                value={consultationType}
                onChange={(e) =>
                  setConsultationType(
                    e.target.value as "IN_PERSON" | "ONLINE_MEETING" | "OFFICE_VISIT" | "WRITTEN_REPORT"
                  )
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="IN_PERSON">حضورياً في مركز ومقر ديشال للأعمال</option>
                <option value="ONLINE_MEETING">اجتماع افتراضي أونلاين (Google Meet)</option>
                <option value="OFFICE_VISIT">زيارة ميدانية لمقر العميل</option>
                <option value="WRITTEN_REPORT">مخرجات / تقرير مكتوب وإلكتروني</option>
              </select>
            </div>
          </div>

          {/* Scope / Notes Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              تفاصيل وموضوع الطلب أو الاستشارة
            </label>
            <textarea
              value={scopeDetails}
              onChange={(e) => setScopeDetails(e.target.value)}
              placeholder="اكتب هنا أي تفاصيل أو ملفات مطلوبة لمساعدة المستشار في التحضير للجلسة..."
              rows={2}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Price Summary & Payment Setup */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">القيمة الإجمالية للخدمة:</span>
              <span className="font-semibold text-slate-800">
                {basePrice.toFixed(3)} {currentService?.currency || "OMR"}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600 font-medium">
                <span>
                  {useFreeQuota ? "تغطية كاملة من باقة المستأجر (استشارة مجانية):" : `خصم باقة المشترك (${discountPercent}%):`}
                </span>
                <span>
                  - {discountAmount.toFixed(3)} {currentService?.currency || "OMR"}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">المبلغ المستحق للدفع:</span>
              <span className="text-xl font-extrabold text-indigo-600">
                {finalAmount === 0 ? "مجاناً (0.000 ر.ع)" : `${finalAmount.toFixed(3)} ${currentService?.currency || "OMR"}`}
              </span>
            </div>

            {finalAmount > 0 && (
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    طريقة الدفع
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="CREDIT_CARD">بطاقة بنكية / خصم مباشر (Debit/Credit)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي مباشر</option>
                    <option value="CASH">نقداً في المركز</option>
                    <option value="CHECK">شيك مصرفي</option>
                  </select>
                </div>

                <div className="flex items-center mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateVoucher}
                      onChange={(e) => setAutoGenerateVoucher(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-800">
                      إنشاء سند قبض مالي وفاتورة رسمية تلقائياً
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-sm transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              تأكيد حجز الخدمة
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
