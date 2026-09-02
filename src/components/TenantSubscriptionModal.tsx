import React, { useState, useEffect } from "react";
import {
  TenantSubscription,
  MembershipPackage,
  Customer
} from "../types";
import {
  X,
  Sparkles,
  User,
  Calendar,
  Layers,
  Clock,
  Mic,
  Award,
  CheckCircle2,
  AlertCircle,
  Building
} from "lucide-react";

interface TenantSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: TenantSubscription | null;
  packages: MembershipPackage[];
  customers: Customer[];
  onSaveSubscription: (sub: TenantSubscription) => void;
}

export const TenantSubscriptionModal: React.FC<TenantSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  packages,
  customers,
  onSaveSubscription
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [status, setStatus] = useState<"ACTIVE" | "EXPIRED" | "SUSPENDED">("ACTIVE");

  // Quota Controls
  const [meetingRoomHoursQuota, setMeetingRoomHoursQuota] = useState<number>(20);
  const [meetingRoomHoursUsed, setMeetingRoomHoursUsed] = useState<number>(0);
  const [mediaStudioHoursQuota, setMediaStudioHoursQuota] = useState<number>(2);
  const [mediaStudioHoursUsed, setMediaStudioHoursUsed] = useState<number>(0);
  const [consultationSessionsQuota, setConsultationSessionsQuota] = useState<number>(2);
  const [consultationSessionsUsed, setConsultationSessionsUsed] = useState<number>(0);

  const [monthlyFee, setMonthlyFee] = useState<number>(95);
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (subscription) {
      setSelectedPackageId(subscription.packageId);
      setCustomerId(subscription.customerId);
      setCustomerName(subscription.customerName);
      setCustomerPhone(subscription.customerPhone);
      setCustomerEmail(subscription.customerEmail || "");
      setCompanyName(subscription.companyName || "");
      setBillingCycle(subscription.billingCycle);
      setStartDate(subscription.startDate);
      setEndDate(subscription.endDate);
      setStatus(subscription.status);
      setMeetingRoomHoursQuota(subscription.meetingRoomHoursQuota);
      setMeetingRoomHoursUsed(subscription.meetingRoomHoursUsed);
      setMediaStudioHoursQuota(subscription.mediaStudioHoursQuota);
      setMediaStudioHoursUsed(subscription.mediaStudioHoursUsed);
      setConsultationSessionsQuota(subscription.consultationSessionsQuota);
      setConsultationSessionsUsed(subscription.consultationSessionsUsed);
      setMonthlyFee(subscription.monthlyFee);
      setDiscountPercent(subscription.discountOnExtraServicesPercent);
      setAutoRenew(subscription.autoRenew);
      setNotes(subscription.notes || "");
    } else {
      if (packages.length > 0) {
        applyPackagePreset(packages[0]);
      }
    }
  }, [subscription, packages]);

  const applyPackagePreset = (pkg: MembershipPackage) => {
    setSelectedPackageId(pkg.id);
    setMeetingRoomHoursQuota(pkg.freeMeetingRoomHoursPerMonth);
    setMediaStudioHoursQuota(pkg.freeMediaStudioHoursPerMonth);
    setConsultationSessionsQuota(pkg.freeConsultationSessionsPerMonth);
    setMonthlyFee(pkg.monthlyFee);
    setDiscountPercent(pkg.discountOnExtraServicesPercent);
  };

  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const c = customers.find((cust) => cust.id === cId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone || "");
      setCustomerEmail(c.email || "");
      setCompanyName(c.type === "CORPORATE" ? c.name : "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    const pkg = packages.find((p) => p.id === selectedPackageId);
    const packageName = pkg ? pkg.name : "باقة المستأجرين المخصصة";

    const subNumber =
      subscription?.subscriptionNumber ||
      `SUB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const saved: TenantSubscription = {
      id: subscription?.id || `sub-${Date.now()}`,
      subscriptionNumber: subNumber,
      customerId: customerId || `cust-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      companyName: companyName.trim() || undefined,
      packageId: selectedPackageId,
      packageName: packageName,
      billingCycle: billingCycle,
      startDate: startDate,
      endDate: endDate,
      status: status,
      meetingRoomHoursQuota: Number(meetingRoomHoursQuota),
      meetingRoomHoursUsed: Number(meetingRoomHoursUsed),
      mediaStudioHoursQuota: Number(mediaStudioHoursQuota),
      mediaStudioHoursUsed: Number(mediaStudioHoursUsed),
      consultationSessionsQuota: Number(consultationSessionsQuota),
      consultationSessionsUsed: Number(consultationSessionsUsed),
      monthlyFee: Number(monthlyFee),
      currency: "OMR",
      discountOnExtraServicesPercent: Number(discountPercent),
      autoRenew: autoRenew,
      notes: notes.trim() || undefined,
      createdAt: subscription?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveSubscription(saved);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-l from-purple-700 via-indigo-600 to-blue-600 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {subscription ? "تعديل اشتراك المستأجر / الباقة" : "إضافة اشتراك مستأجر جديد في الباقات"}
              </h3>
              <p className="text-sm text-purple-100 mt-0.5">
                تخصيص الساعات المجانية لقاعات الاجتماعات والاستوديو والاستشارات الاستراتيجية
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Package Selection Cards */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              اختيار باقة الاشتراك
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => applyPackagePreset(pkg)}
                    className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{pkg.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-semibold text-indigo-700">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{pkg.freeMeetingRoomHoursPerMonth} ساعة قاعات مجاناً</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-700">
                          <Mic className="w-3.5 h-3.5" />
                          <span>{pkg.freeMediaStudioHoursPerMonth} ساعات استوديو</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-700">
                          <Award className="w-3.5 h-3.5" />
                          <span>{pkg.freeConsultationSessionsPerMonth} استشارات مجانية</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/80 font-bold text-slate-800 text-xs flex justify-between">
                      <span>الرسوم:</span>
                      <span>{pkg.monthlyFee} {pkg.currency} / شهر</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                بيانات المستأجر / العميل المشترك
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
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم المستأجر / الشركة *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="شركة الدليل الشامل"
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
                <label className="block text-xs font-medium text-slate-600 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="contact@company.om"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">رقم المكتب / الوحدة المؤجرة</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مكتب رقم 204 - الطابق الثاني"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quota Customization Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              أرصدة الحصص الشهرية والساعات المجانية
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Meeting Rooms Quota */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ساعات قاعات الاجتماعات (شهرياً)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500">الحصة الكلية:</span>
                    <input
                      type="number"
                      min="0"
                      value={meetingRoomHoursQuota}
                      onChange={(e) => setMeetingRoomHoursQuota(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-bold text-indigo-700"
                    />
                  </div>
                  <div className="w-20">
                    <span className="text-[10px] text-slate-500">المستهلك:</span>
                    <input
                      type="number"
                      min="0"
                      value={meetingRoomHoursUsed}
                      onChange={(e) => setMeetingRoomHoursUsed(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-700"
                    />
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-emerald-600">
                  المتبقي: {Math.max(0, meetingRoomHoursQuota - meetingRoomHoursUsed)} ساعة
                </div>
              </div>

              {/* Media Studio Quota */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ساعات الاستوديو الإعلامي (شهرياً)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500">الحصة الكلية:</span>
                    <input
                      type="number"
                      min="0"
                      value={mediaStudioHoursQuota}
                      onChange={(e) => setMediaStudioHoursQuota(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-bold text-purple-700"
                    />
                  </div>
                  <div className="w-20">
                    <span className="text-[10px] text-slate-500">المستهلك:</span>
                    <input
                      type="number"
                      min="0"
                      value={mediaStudioHoursUsed}
                      onChange={(e) => setMediaStudioHoursUsed(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-700"
                    />
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-emerald-600">
                  المتبقي: {Math.max(0, mediaStudioHoursQuota - mediaStudioHoursUsed)} ساعة
                </div>
              </div>

              {/* Consultation Sessions Quota */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  الاستشارات المجانية (شهرياً)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500">الحصة الكلية:</span>
                    <input
                      type="number"
                      min="0"
                      value={consultationSessionsQuota}
                      onChange={(e) => setConsultationSessionsQuota(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-bold text-blue-700"
                    />
                  </div>
                  <div className="w-20">
                    <span className="text-[10px] text-slate-500">المستهلك:</span>
                    <input
                      type="number"
                      min="0"
                      value={consultationSessionsUsed}
                      onChange={(e) => setConsultationSessionsUsed(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-700"
                    />
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-emerald-600">
                  المتبقي: {Math.max(0, consultationSessionsQuota - consultationSessionsUsed)} جلسات
                </div>
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ بداية الاشتراك</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ نهاية الاشتراك / التجديد</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">حالة الاشتراك</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "EXPIRED" | "SUSPENDED")}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
              >
                <option value="ACTIVE">نشط وفعّال (ACTIVE)</option>
                <option value="EXPIRED">منتهي الصلاحية (EXPIRED)</option>
                <option value="SUSPENDED">موقوف مؤقتاً (SUSPENDED)</option>
              </select>
            </div>
          </div>

          {/* Pricing & Auto-renew */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الرسوم الشهرية (ر.ع)</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نسبة الخصم على الخدمات الإضافية (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات إدارية</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: عقد سنوي يبدأ من بداية أغسطس 2026..."
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {subscription ? "حفظ التعديلات" : "تفعيل اشتراك المستأجر"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
