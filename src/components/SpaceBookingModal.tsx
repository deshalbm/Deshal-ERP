import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Building2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Users,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building,
  ShieldCheck,
  Tag,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Check,
  Info,
  Layers,
  ChevronRight
} from "lucide-react";
import { RentalSpace, SpaceBooking, SpaceType, RentalType, PaymentMethod, Customer, Branch } from "../types";
import { useLanguage } from "../utils/LanguageContext";

interface SpaceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  space?: RentalSpace | null;
  spaces: RentalSpace[];
  branches: Branch[];
  bookings?: SpaceBooking[];
  customers?: Customer[];
  onConfirmBooking: (booking: SpaceBooking, autoGenerateVoucher?: boolean) => void;
}

export const SpaceBookingModal: React.FC<SpaceBookingModalProps> = ({
  isOpen,
  onClose,
  space,
  spaces,
  branches,
  bookings = [],
  customers = [],
  onConfirmBooking
}) => {
  const { language, isRTL, t } = useLanguage();

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(space?.id || spaces[0]?.id || "");
  const currentSpace = spaces.find((s) => s.id === selectedSpaceId) || space || spaces[0];

  // Booking Form State
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerCompany, setCustomerCompany] = useState<string>("");
  
  const [rentalType, setRentalType] = useState<RentalType>("HOURLY");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(3); // e.g. 3 hours, or 1 day, or 1 month
  
  const [attendeesCount, setAttendeesCount] = useState<number>(10);
  const [purpose, setPurpose] = useState<string>("");
  const [hospitalityNotes, setHospitalityNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [autoGenerateVoucher, setAutoGenerateVoucher] = useState<boolean>(true);

  // Helper to compute end time based on start time + duration hours
  const calculateEndTime = (start: string, hours: number): string => {
    try {
      const [h, m] = start.split(":").map(Number);
      const totalMinutes = (h || 0) * 60 + (m || 0) + (hours || 1) * 60;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    } catch {
      return "12:00";
    }
  };

  const computedEndTime = useMemo(() => {
    if (rentalType === "HOURLY") {
      return calculateEndTime(startTime, duration);
    }
    return undefined;
  }, [rentalType, startTime, duration]);

  useEffect(() => {
    if (space?.id) {
      setSelectedSpaceId(space.id);
    }
  }, [space]);

  // Autocomplete customer info when typing name or selecting from CRM
  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    const matched = customers.find((c) => c.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (matched) {
      if (matched.phone) setCustomerPhone(matched.phone);
      if (matched.email) setCustomerEmail(matched.email);
    }
  };

  // --- SMART CONFLICT DETECTION LOGIC ---
  const conflictDetection = useMemo(() => {
    if (!currentSpace || !startDate) return { hasConflict: false, conflictingBooking: null, alternativeSlots: [], alternativeSpaces: [] };

    const spaceBookingsOnDate = bookings.filter((b) => {
      if (b.status === "CANCELLED") return false;
      if (b.spaceId !== currentSpace.id) return false;
      
      // Check date matching
      if (rentalType === "HOURLY" || rentalType === "DAILY") {
        return b.startDate === startDate || (b.startDate <= startDate && b.endDate >= startDate);
      }
      return true;
    });

    let conflictingBooking: SpaceBooking | null = null;

    if (rentalType === "HOURLY") {
      const reqStart = startTime;
      const reqEnd = computedEndTime || calculateEndTime(startTime, duration);

      for (const b of spaceBookingsOnDate) {
        if (b.rentalType === "DAILY" || b.rentalType === "MONTHLY") {
          conflictingBooking = b;
          break;
        }
        if (b.rentalType === "HOURLY" && b.startTime && b.endTime) {
          // Check overlap: (reqStart < b.endTime) && (reqEnd > b.startTime)
          if (reqStart < b.endTime && reqEnd > b.startTime) {
            conflictingBooking = b;
            break;
          }
        }
      }
    } else {
      // DAILY or MONTHLY conflict: any active booking on this space
      if (spaceBookingsOnDate.length > 0) {
        conflictingBooking = spaceBookingsOnDate[0];
      }
    }

    if (!conflictingBooking) {
      return { hasConflict: false, conflictingBooking: null, alternativeSlots: [], alternativeSpaces: [] };
    }

    // --- GENERATE INTELLIGENT ALTERNATIVE TIME SLOTS ---
    const candidateStartTimes = ["08:00", "11:30", "14:00", "16:30", "19:00", "20:30"];
    const validAltSlots: { startTime: string; endTime: string }[] = [];

    for (const candStart of candidateStartTimes) {
      const candEnd = calculateEndTime(candStart, duration);
      let slotConflict = false;

      for (const b of spaceBookingsOnDate) {
        if (b.rentalType === "DAILY" || b.rentalType === "MONTHLY") {
          slotConflict = true;
          break;
        }
        if (b.rentalType === "HOURLY" && b.startTime && b.endTime) {
          if (candStart < b.endTime && candEnd > b.startTime) {
            slotConflict = true;
            break;
          }
        }
      }

      if (!slotConflict) {
        validAltSlots.push({ startTime: candStart, endTime: candEnd });
      }
      if (validAltSlots.length >= 3) break;
    }

    // --- GENERATE INTELLIGENT ALTERNATIVE SPACES ---
    const reqStart = startTime;
    const reqEnd = computedEndTime || calculateEndTime(startTime, duration);
    const validAltSpaces: RentalSpace[] = [];

    for (const otherSpace of spaces) {
      if (otherSpace.id === currentSpace.id || otherSpace.status !== "AVAILABLE") continue;

      const otherBookings = bookings.filter(
        (b) => b.spaceId === otherSpace.id && b.status !== "CANCELLED" && b.startDate === startDate
      );

      let otherConflict = false;
      for (const b of otherBookings) {
        if (rentalType === "HOURLY") {
          if (b.rentalType === "DAILY" || b.rentalType === "MONTHLY") {
            otherConflict = true;
            break;
          }
          if (b.rentalType === "HOURLY" && b.startTime && b.endTime) {
            if (reqStart < b.endTime && reqEnd > b.startTime) {
              otherConflict = true;
              break;
            }
          }
        } else {
          otherConflict = true;
          break;
        }
      }

      if (!otherConflict) {
        validAltSpaces.push(otherSpace);
      }
      if (validAltSpaces.length >= 2) break;
    }

    return {
      hasConflict: true,
      conflictingBooking,
      alternativeSlots: validAltSlots,
      alternativeSpaces: validAltSpaces
    };
  }, [currentSpace, startDate, rentalType, startTime, duration, computedEndTime, bookings, spaces]);

  if (!isOpen || !currentSpace) return null;

  // Rate calculation
  let unitPrice = currentSpace.hourlyRate;
  if (rentalType === "DAILY") unitPrice = currentSpace.dailyRate;
  if (rentalType === "MONTHLY") unitPrice = currentSpace.monthlyRate;

  const subtotal = unitPrice * (duration || 1);
  const taxAmount = +(subtotal * 0.05).toFixed(2); // 5% VAT in Oman
  const totalAmount = +(subtotal + taxAmount).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    const newBooking: SpaceBooking = {
      id: `bk-${Date.now()}`,
      bookingNumber: `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      spaceId: currentSpace.id,
      spaceName: currentSpace.name,
      spaceType: currentSpace.type,
      branchId: currentSpace.branchId,
      branchName: currentSpace.branchName,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerCompany: customerCompany.trim() || undefined,
      rentalType,
      startDate,
      startTime: rentalType === "HOURLY" ? startTime : undefined,
      endDate: startDate,
      endTime: rentalType === "HOURLY" ? computedEndTime : undefined,
      duration: duration || 1,
      unitPrice,
      subtotal,
      discountAmount: 0,
      taxAmount,
      totalAmount,
      currency: currentSpace.currency || "OMR",
      attendeesCount,
      purpose: purpose.trim() || (language === "ar" ? "حجز مساحة / قاعة" : "Space Reservation"),
      hospitalityNotes: hospitalityNotes.trim() || undefined,
      status: "CONFIRMED",
      paymentStatus: autoGenerateVoucher ? "PAID" : "UNPAID",
      paymentMethod,
      createdByType: "CLIENT_SELF_SERVICE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onConfirmBooking(newBooking, autoGenerateVoucher);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-4.5 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  {language === "ar" ? "طلب حجز قاعة / مساحة عمل ذكية" : "Reserve Space or Meeting Room"}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {language === "ar" ? "نظام آلي متكامل" : "Automated Booking"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "ar" ? "كشف فوري للتعارضات، تسعير دقيق، وإصدار تلقائي لسندات القبض" : "Instant conflict checks, real-time pricing & auto voucher generation"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- SMART CONFLICT ALERT & ALTERNATIVES BANNER --- */}
        {conflictDetection.hasConflict && conflictDetection.conflictingBooking && (
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-950">
                  {language === "ar" ? "تنبيه تعارض في موعد الحجز!" : "Schedule Conflict Detected!"}
                </h4>
                <p className="text-xs text-amber-900/90 mt-0.5">
                  {language === "ar" ? (
                    <>
                      القاعة (<span className="font-bold">{currentSpace.name}</span>) محجوزة مسبقاً في نفس الفترة (
                      <span className="font-mono font-bold">
                        {conflictDetection.conflictingBooking.startTime || "طوال اليوم"} - {conflictDetection.conflictingBooking.endTime || ""}
                      </span>
                      ) لحساب العميل: <span className="font-bold">{conflictDetection.conflictingBooking.customerName}</span>.
                    </>
                  ) : (
                    <>
                      Space (<span className="font-bold">{currentSpace.name}</span>) is already booked on this period (
                      <span className="font-mono font-bold">
                        {conflictDetection.conflictingBooking.startTime || "Full Day"} - {conflictDetection.conflictingBooking.endTime || ""}
                      </span>
                      ) by {conflictDetection.conflictingBooking.customerName}.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Smart Suggested Alternative Slots */}
            {conflictDetection.alternativeSlots.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{language === "ar" ? "مواعيد بديلة متاحة في نفس القاعة اليوم:" : "Alternative Available Slots in Same Space Today:"}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {conflictDetection.alternativeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStartTime(slot.startTime);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                      <span className="text-[10px] font-sans text-indigo-500 font-normal">
                        ({language === "ar" ? "اختر هذا الموعد" : "Apply"})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Suggested Alternative Spaces */}
            {conflictDetection.alternativeSpaces.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === "ar" ? "قاعات بديلة متاحة بنفس التوقيت تماماً:" : "Alternative Available Spaces at Same Time:"}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {conflictDetection.alternativeSpaces.map((altSpace) => (
                    <button
                      key={altSpace.id}
                      type="button"
                      onClick={() => setSelectedSpaceId(altSpace.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{altSpace.name} ({altSpace.capacity} {language === "ar" ? "شخص" : "seats"})</span>
                      <span className="text-[10px] text-emerald-600 font-normal">
                        - {altSpace.hourlyRate} OMR/hr ({language === "ar" ? "التبديل للقاعة" : "Switch"})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Space Selection Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 space-y-2">
            <label className="block font-bold text-indigo-950 text-xs">
              {language === "ar" ? "اختر القاعة أو مساحة العمل" : "Select Space / Hall"}
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl font-bold text-slate-900 shadow-xs focus:outline-hidden"
            >
              {spaces.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.code}) - {sp.capacity} {language === "ar" ? "شخص" : "seats"} - {sp.hourlyRate} OMR/hr ({sp.branchName})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === "ar" ? "بيانات العميل / الجهة المستأجرة" : "Customer / Tenant Information"}</span>
              </h3>
              {customers.length > 0 && (
                <span className="text-[10px] text-slate-400">
                  {language === "ar" ? "ربط تلقائي مع سجل العملاء (CRM)" : "Synced with CRM"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "اسم العميل / المستأجر *" : "Full Name *"}</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  placeholder={language === "ar" ? "مثال: م. أحمد المعمري" : "e.g. Ahmed Al-Mamari"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "رقم الهاتف / واتساب *" : "Phone Number *"}</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+968 9123 4567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "البريد الإلكتروني" : "Email Address"}</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "اسم الشركة / المؤسسة" : "Company / Organization"}</label>
                <input
                  type="text"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  placeholder={language === "ar" ? "مثال: أكاديمية الرواد" : "e.g. Pioneers Academy"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Reservation Duration & Timing */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "ar" ? "فترة وتوقيت الحجز" : "Reservation Timing"}</span>
            </h3>

            {/* Rental Model Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setRentalType("HOURLY"); setDuration(2); }}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  rentalType === "HOURLY"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {language === "ar" ? "بالساعة" : "Hourly"} ({currentSpace.hourlyRate} OMR)
              </button>

              <button
                type="button"
                onClick={() => { setRentalType("DAILY"); setDuration(1); }}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  rentalType === "DAILY"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {language === "ar" ? "باليوم" : "Daily"} ({currentSpace.dailyRate} OMR)
              </button>

              <button
                type="button"
                onClick={() => { setRentalType("MONTHLY"); setDuration(1); }}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  rentalType === "MONTHLY"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {language === "ar" ? "بالشهر" : "Monthly"} ({currentSpace.monthlyRate} OMR)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "تاريخ الحجز" : "Reservation Date"}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                />
              </div>

              {rentalType === "HOURLY" ? (
                <>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "وقت البدء" : "Start Time"}</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 font-semibold">{language === "ar" ? "المدة (ساعات)" : "Hours"}</label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {computedEndTime ? `حتى ${computedEndTime}` : ""}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={duration}
                      onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">
                    {rentalType === "DAILY" ? (language === "ar" ? "عدد الأيام" : "Days Count") : (language === "ar" ? "عدد الأشهر" : "Months Count")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Operational Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "عدد الحضور المتوقع" : "Expected Attendees"}</label>
              <input
                type="number"
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "الغرض من الحجز" : "Purpose / Event Title"}</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={language === "ar" ? "مثال: ورشة عمل، اجتماع مجلس إدارة..." : "Workshop, board meeting..."}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "ملاحظات الضيافة والتجهيزات" : "Hospitality & Setup Notes"}</label>
              <input
                type="text"
                value={hospitalityNotes}
                onChange={(e) => setHospitalityNotes(e.target.value)}
                placeholder={language === "ar" ? "مثال: تجهيز الشاشة التفاعلية، قهوة وشاي، ميكروفون لاسلكي..." : "Screen setup, coffee, wireless mic..."}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          {/* AUTO INVOICE / VOUCHER GENERATION TOGGLE */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
            <input
              type="checkbox"
              id="auto-generate-voucher-check"
              checked={autoGenerateVoucher}
              onChange={(e) => setAutoGenerateVoucher(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
            <label htmlFor="auto-generate-voucher-check" className="cursor-pointer space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === "ar" ? "إنشاء سند مالي وفاتورة رسمية تلقائياً عند التأكيد" : "Auto-generate official receipt voucher on confirmation"}</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                {language === "ar"
                  ? "سيتم توليد سند قبض مالي رسمي برقم تسلسلي، وتفقيط المبلغ، وربطه برقم الحجز وحساب العميل في السجلات المحاسبية فوراً."
                  : "Generates an official receipt voucher, numbers in words, and links booking # directly to accounting ledgers."}
              </p>
            </label>
          </div>

          {/* Summary & Price Breakdown Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{language === "ar" ? "سعر الوحدة" : "Unit Rate"} ({duration} × {unitPrice} OMR)</span>
              <span className="font-mono font-bold">{subtotal.toFixed(2)} OMR</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{language === "ar" ? "ضريبة القيمة المضافة (5% VAT)" : "VAT (5%)"}</span>
              <span className="font-mono font-bold">{taxAmount.toFixed(2)} OMR</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-sm font-black">
              <span className="text-emerald-400">{language === "ar" ? "الإجمالي النهائي للحجز" : "Total Booking Price"}</span>
              <span className="text-xl font-mono text-white">{totalAmount.toFixed(2)} <span className="text-xs font-sans font-normal text-slate-400">OMR</span></span>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={conflictDetection.hasConflict}
              className={`px-6 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-all ${
                conflictDetection.hasConflict
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {conflictDetection.hasConflict
                  ? (language === "ar" ? "يوجد تعارض في الموعد" : "Conflict Exists")
                  : (language === "ar" ? "تأكيد الحجز الفوري" : "Confirm Reservation")}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
