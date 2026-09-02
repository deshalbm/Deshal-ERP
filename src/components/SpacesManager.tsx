import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Building2,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  FileText,
  DollarSign,
  Coffee,
  Tv,
  Wifi,
  Volume2,
  Mic,
  Monitor,
  Printer,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  ArrowRight,
  Send,
  Download,
  Receipt,
  Tag,
  Check,
  MapPin,
  Flame,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  CalendarDays,
  Percent,
  Clock3,
  Award,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { RentalSpace, SpaceBooking, SpaceType, RentalType, BookingStatus, BookingPaymentStatus, Branch, AuthSession } from "../types";
import { useLanguage } from "../utils/LanguageContext";

interface SpacesManagerProps {
  spaces: RentalSpace[];
  bookings: SpaceBooking[];
  branches: Branch[];
  session: AuthSession | null;
  onSaveSpace: (space: RentalSpace) => void;
  onDeleteSpace: (spaceId: string) => void;
  onSaveBooking: (booking: SpaceBooking) => void;
  onCancelBooking: (bookingId: string) => void;
  onOpenBookingModal: (space?: RentalSpace) => void;
  onGenerateVoucherForBooking: (booking: SpaceBooking) => void;
}

export const SpacesManager: React.FC<SpacesManagerProps> = ({
  spaces,
  bookings,
  branches,
  session,
  onSaveSpace,
  onDeleteSpace,
  onSaveBooking,
  onCancelBooking,
  onOpenBookingModal,
  onGenerateVoucherForBooking
}) => {
  const { language, isRTL, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"spaces" | "calendar" | "bookings" | "analytics">("spaces");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Calendar Specific State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarSpaceFilter, setCalendarSpaceFilter] = useState<string>("ALL");
  const [selectedCalendarBooking, setSelectedCalendarBooking] = useState<SpaceBooking | null>(null);

  // Space Edit Modal state
  const [editingSpace, setEditingSpace] = useState<RentalSpace | null>(null);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState<boolean>(false);

  // Filtered Spaces
  const filteredSpaces = useMemo(() => {
    return spaces.filter((sp) => {
      if (selectedTypeFilter !== "ALL" && sp.type !== selectedTypeFilter) return false;
      if (selectedBranchFilter !== "ALL" && sp.branchId !== selectedBranchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sp.name.toLowerCase().includes(q) || (sp.nameEn && sp.nameEn.toLowerCase().includes(q));
        const matchCode = sp.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [spaces, selectedTypeFilter, selectedBranchFilter, searchQuery]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCust = b.customerName.toLowerCase().includes(q) || (b.customerPhone && b.customerPhone.includes(q));
        const matchNum = b.bookingNumber.toLowerCase().includes(q);
        const matchSpace = b.spaceName.toLowerCase().includes(q);
        if (!matchCust && !matchNum && !matchSpace) return false;
      }
      return true;
    });
  }, [bookings, searchQuery]);

  // Amenity badge mapper
  const renderAmenityBadge = (amenity: string) => {
    switch (amenity) {
      case "wifi":
        return <span key={amenity} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"><Wifi className="w-3 h-3 text-indigo-500" /> WiFi</span>;
      case "smart_screen":
        return <span key={amenity} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"><Tv className="w-3 h-3 text-blue-500" /> {language === "ar" ? "شاشة ذكية" : "Smart Screen"}</span>;
      case "projector":
        return <span key={amenity} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"><Monitor className="w-3 h-3 text-purple-500" /> {language === "ar" ? "بروجكتور" : "Projector"}</span>;
      case "coffee":
        return <span key={amenity} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"><Coffee className="w-3 h-3 text-amber-600" /> {language === "ar" ? "بار ضيافة" : "Coffee/Tea"}</span>;
      case "sound":
        return <span key={amenity} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"><Volume2 className="w-3 h-3 text-emerald-500" /> {language === "ar" ? "نظام صوتي" : "Audio"}</span>;
      case "mic":
        return <span key={amenity} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"><Mic className="w-3 h-3 text-rose-500" /> {language === "ar" ? "ميكروفونات" : "Mic"}</span>;
      default:
        return <span key={amenity} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"><Check className="w-3 h-3 text-slate-400" /> {amenity}</span>;
    }
  };

  const getSpaceTypeLabel = (type: SpaceType) => {
    switch (type) {
      case "TRAINING_HALL":
        return language === "ar" ? "قاعة تدريب وتأهيل" : "Training Hall";
      case "MEETING_ROOM":
        return language === "ar" ? "قاعة اجتماعات" : "Meeting Room";
      case "PRIVATE_OFFICE":
        return language === "ar" ? "مكتب تنفيذي خاص" : "Private Office";
      case "COWORKING_DESK":
        return language === "ar" ? "مساحة عمل مشتركة" : "Coworking Desk";
      case "EVENT_SPACE":
        return language === "ar" ? "مساحة فعاليات ومعارض" : "Event Space";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> {language === "ar" ? "مؤكد" : "Confirmed"}</span>;
      case "PENDING":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> {language === "ar" ? "قيد المراجعة" : "Pending"}</span>;
      case "CHECKED_IN":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><CalendarCheck className="w-3 h-3" /> {language === "ar" ? "تم الدخول (نشط)" : "Checked In"}</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"><Check className="w-3 h-3" /> {language === "ar" ? "مكتمل" : "Completed"}</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> {language === "ar" ? "ملغي" : "Cancelled"}</span>;
    }
  };

  const handleOpenNewSpaceModal = () => {
    setEditingSpace({
      id: `space-${Date.now()}`,
      code: `SP-${spaces.length + 101}`,
      name: "",
      type: "TRAINING_HALL",
      branchId: branches[0]?.id || "branch-1",
      branchName: branches[0]?.name || "الفرع الرئيسي",
      capacity: 20,
      floorLocation: "",
      hourlyRate: 15,
      dailyRate: 90,
      monthlyRate: 1200,
      currency: "OMR",
      minBookingHours: 1,
      amenities: ["wifi", "smart_screen", "coffee", "sound"],
      images: ["https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800"],
      imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
      status: "AVAILABLE",
      color: "#6366f1",
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsSpaceModalOpen(true);
  };

  // --- CALENDAR GRID GENERATOR ---
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth(); // 0-indexed

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = calendarMonth === 0 ? 12 : calendarMonth;
      const y = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const todayStr = new Date().toISOString().split("T")[0];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding to fill complete grid (multiples of 7)
    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = calendarMonth === 11 ? 1 : calendarMonth + 2;
      const y = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [calendarYear, calendarMonth]);

  const monthNamesAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonthName = language === "ar" ? monthNamesAr[calendarMonth] : monthNamesEn[calendarMonth];

  // Bookings mapped by Date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, SpaceBooking[]> = {};
    bookings.forEach((b) => {
      if (b.status === "CANCELLED") return;
      if (calendarSpaceFilter !== "ALL" && b.spaceId !== calendarSpaceFilter) return;

      const d = b.startDate;
      if (!map[d]) map[d] = [];
      map[d].push(b);
    });
    return map;
  }, [bookings, calendarSpaceFilter]);

  // --- RECHARTS ANALYTICS METRICS & DATASETS ---
  const currentMonthStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`;
  const currentMonthBookings = useMemo(() => {
    return bookings.filter((b) => b.startDate?.startsWith(currentMonthStr) && b.status !== "CANCELLED");
  }, [bookings, currentMonthStr]);

  // 1. Occupancy Rate by Space Chart Data
  const occupancyChartData = useMemo(() => {
    // Assuming standard 30 days * 10 operational hours = 300 available hours per space per month
    const totalWorkingHoursPerMonth = 240; 

    return spaces.map((space) => {
      const spaceMonthBookings = currentMonthBookings.filter((b) => b.spaceId === space.id);
      let bookedHours = 0;
      spaceMonthBookings.forEach((b) => {
        if (b.rentalType === "HOURLY") bookedHours += b.duration || 1;
        else if (b.rentalType === "DAILY") bookedHours += (b.duration || 1) * 8;
        else if (b.rentalType === "MONTHLY") bookedHours += 200;
      });

      const occupancyRate = Math.min(100, +((bookedHours / totalWorkingHoursPerMonth) * 100).toFixed(1));
      const revenue = spaceMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      return {
        name: space.name.length > 14 ? `${space.name.substring(0, 14)}...` : space.name,
        fullName: space.name,
        code: space.code,
        occupancyRate,
        bookedHours,
        revenue: +revenue.toFixed(2),
        bookingsCount: spaceMonthBookings.length
      };
    });
  }, [spaces, currentMonthBookings]);

  // 2. Daily Booking & Revenue Trend Chart Data
  const dailyTrendChartData = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${currentMonthStr}-${String(day).padStart(2, "0")}`;
      const dayBookings = bookings.filter((b) => b.startDate === dStr && b.status !== "CANCELLED");
      const dayRev = dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      data.push({
        day: `${day}`,
        fullDate: dStr,
        bookingsCount: dayBookings.length,
        revenue: +dayRev.toFixed(2)
      });
    }
    return data;
  }, [calendarYear, calendarMonth, currentMonthStr, bookings]);

  // 3. Rental Type Distribution
  const rentalTypePieData = useMemo(() => {
    const hourlyCount = currentMonthBookings.filter((b) => b.rentalType === "HOURLY").length;
    const dailyCount = currentMonthBookings.filter((b) => b.rentalType === "DAILY").length;
    const monthlyCount = currentMonthBookings.filter((b) => b.rentalType === "MONTHLY").length;

    return [
      { name: language === "ar" ? "بالساعة (Hourly)" : "Hourly", value: hourlyCount, color: "#6366f1" },
      { name: language === "ar" ? "باليوم (Daily)" : "Daily", value: dailyCount, color: "#10b981" },
      { name: language === "ar" ? "بالشهر (Monthly)" : "Monthly", value: monthlyCount, color: "#f59e0b" }
    ].filter(item => item.value > 0 || currentMonthBookings.length === 0);
  }, [currentMonthBookings, language]);

  // 4. Peak Days Distribution (Day of week)
  const peakDaysData = useMemo(() => {
    const dayLabelsAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const dayLabelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    currentMonthBookings.forEach((b) => {
      const d = new Date(b.startDate);
      if (!isNaN(d.getTime())) {
        const dayIdx = d.getDay();
        counts[dayIdx] += 1;
      }
    });

    return counts.map((cnt, idx) => ({
      day: language === "ar" ? dayLabelsAr[idx] : dayLabelsEn[idx],
      bookings: cnt
    }));
  }, [currentMonthBookings, language]);

  // Analytics KPIs
  const totalMonthRevenue = useMemo(() => {
    return currentMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [currentMonthBookings]);

  const avgOccupancy = useMemo(() => {
    if (occupancyChartData.length === 0) return 0;
    const sum = occupancyChartData.reduce((acc, curr) => acc + curr.occupancyRate, 0);
    return +(sum / occupancyChartData.length).toFixed(1);
  }, [occupancyChartData]);

  const topSpace = useMemo(() => {
    if (occupancyChartData.length === 0) return null;
    return [...occupancyChartData].sort((a, b) => b.bookingsCount - a.bookingsCount)[0];
  }, [occupancyChartData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {language === "ar" ? "نظام حجز القاعات ومساحات العمل" : "Spaces & Halls Booking Engine"}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Smart Booking & Charts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "ar"
                ? "إدارة وتأجير قاعات التدريب والاجتماعات، عرض تقويمي تفاعلي، كشف التعارضات، وإحصائيات إشغال بصرية"
                : "Manage halls & coworking desks with interactive calendar, conflict avoidance, and visual analytics"}
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenBookingModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>{language === "ar" ? "حجز قاعة / مساحة جديدة" : "New Space Booking"}</span>
          </button>

          <button
            onClick={handleOpenNewSpaceModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === "ar" ? "إضافة قاعة جديدة" : "Add New Space"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>{language === "ar" ? "إجمالي القاعات والمساحات" : "Total Spaces"}</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{spaces.length}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {spaces.filter(s => s.status === "AVAILABLE").length} {language === "ar" ? "جاهزة للحجز الفوري" : "Available"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>{language === "ar" ? "معدل الإشغال الشهري" : "Occupancy Rate"}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{avgOccupancy}%</p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            {language === "ar" ? `خلال شهر ${currentMonthName}` : `During ${currentMonthName}`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>{language === "ar" ? "إيرادات حجز الشهر" : "Monthly Revenue"}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalMonthRevenue.toFixed(2)} <span className="text-xs font-sans text-slate-500 font-normal">OMR</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {currentMonthBookings.length} {language === "ar" ? "حجز نشط ومؤكد" : "confirmed bookings"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>{language === "ar" ? "القاعة الأكثر طلباً" : "Most Popular Space"}</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 truncate">
            {topSpace ? topSpace.fullName : (language === "ar" ? "لا توجد حجوزات" : "No Data")}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {topSpace ? `${topSpace.bookingsCount} ${language === "ar" ? "حجوزات هذا الشهر" : "bookings this month"}` : "-"}
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab("spaces")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "spaces"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "دليل القاعات والمساحات" : "Spaces Directory"} ({spaces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "التقويم وجدول الإتاحة" : "Calendar & Schedule"}</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "سجل الحجوزات" : "Bookings Log"} ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "لوحة الإحصائيات والإشغال" : "Analytics & Occupancy"}</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "ar" ? "بحث بالاسم، الرمز، العميل..." : "Search spaces, code, customer..."}
              className="w-full ps-9 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {activeTab === "spaces" && (
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">{language === "ar" ? "كافة الأنواع" : "All Types"}</option>
              <option value="TRAINING_HALL">{language === "ar" ? "قاعات تدريب" : "Training Halls"}</option>
              <option value="MEETING_ROOM">{language === "ar" ? "قاعات اجتماعات" : "Meeting Rooms"}</option>
              <option value="PRIVATE_OFFICE">{language === "ar" ? "مكاتب خاصة" : "Private Offices"}</option>
              <option value="COWORKING_DESK">{language === "ar" ? "مساحات عمل مشتركة" : "Coworking Desks"}</option>
              <option value="EVENT_SPACE">{language === "ar" ? "مساحات فعاليات" : "Event Spaces"}</option>
            </select>
          )}
        </div>
      </div>

      {/* --- TAB 1: SPACES DIRECTORY --- */}
      {activeTab === "spaces" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpaces.map((space) => (
              <div
                key={space.id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Space Image Header */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={space.imageUrl || space.images?.[0] || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800"}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 start-3 end-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-white/95 text-slate-900 shadow-sm backdrop-blur-xs font-mono">
                      {space.code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${
                      space.status === "AVAILABLE" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {space.status === "AVAILABLE" ? (language === "ar" ? "متاح للحجز" : "Available") : (language === "ar" ? "صيانة" : "Maintenance")}
                    </span>
                  </div>

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-3 start-3 end-3 text-white">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-xs mb-1">
                      {getSpaceTypeLabel(space.type)}
                    </span>
                    <h3 className="font-bold text-sm leading-snug line-clamp-1">{space.name}</h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  
                  <div className="space-y-2.5">
                    {/* Location & Capacity */}
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[150px]">{space.branchName}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{space.capacity} {language === "ar" ? "شخص" : "pax"}</span>
                      </span>
                    </div>

                    {space.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {space.description}
                      </p>
                    )}

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {space.amenities.slice(0, 4).map(a => renderAmenityBadge(a))}
                      {space.amenities.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-bold self-center px-1">
                          +{space.amenities.length - 4} {language === "ar" ? "مزايا أخرى" : "more"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rates and Instant Action Button */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-3 gap-1 text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === "ar" ? "الساعة" : "Hourly"}</span>
                        <span className="text-xs font-black text-slate-900 font-mono">{space.hourlyRate} <span className="text-[9px] font-sans font-normal">{space.currency}</span></span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] text-slate-400 block">{language === "ar" ? "اليوم" : "Daily"}</span>
                        <span className="text-xs font-black text-indigo-600 font-mono">{space.dailyRate} <span className="text-[9px] font-sans font-normal">{space.currency}</span></span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === "ar" ? "الشهر" : "Monthly"}</span>
                        <span className="text-xs font-black text-emerald-600 font-mono">{space.monthlyRate} <span className="text-[9px] font-sans font-normal">{space.currency}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenBookingModal(space)}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>{language === "ar" ? "حجز الآن" : "Book Space"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingSpace({ ...space });
                          setIsSpaceModalOpen(true);
                        }}
                        title={language === "ar" ? "تعديل بيانات القاعة" : "Edit Space"}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: INTERACTIVE CALENDAR & SCHEDULE VIEW --- */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          
          {/* Calendar Controls & Month Switcher */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                <button
                  onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                  className="p-2 hover:bg-white rounded-xl text-slate-700 transition-colors cursor-pointer"
                  title={language === "ar" ? "الشهر السابق" : "Previous Month"}
                >
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
                >
                  {language === "ar" ? "اليوم" : "Today"}
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                  className="p-2 hover:bg-white rounded-xl text-slate-700 transition-colors cursor-pointer"
                  title={language === "ar" ? "الشهر التالي" : "Next Month"}
                >
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{currentMonthName} {calendarYear}</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {language === "ar" ? "انقر على أي يوم فارغ لبدء حجز جديد، أو انقر على الحجز لعرض التفاصيل" : "Click on any date to book, or click a booking to view"}
                </p>
              </div>
            </div>

            {/* Filter by Space in Calendar */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 hidden md:inline">
                {language === "ar" ? "تصفية القاعة:" : "Filter Space:"}
              </span>
              <select
                value={calendarSpaceFilter}
                onChange={(e) => setCalendarSpaceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">{language === "ar" ? "كافة القاعات والمساحات" : "All Spaces"}</option>
                {spaces.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.name} ({sp.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-black text-slate-600 uppercase">
              <div>{language === "ar" ? "الأحد" : "Sun"}</div>
              <div>{language === "ar" ? "الإثنين" : "Mon"}</div>
              <div>{language === "ar" ? "الثلاثاء" : "Tue"}</div>
              <div>{language === "ar" ? "الأربعاء" : "Wed"}</div>
              <div>{language === "ar" ? "الخميس" : "Thu"}</div>
              <div>{language === "ar" ? "الجمعة" : "Fri"}</div>
              <div>{language === "ar" ? "السبت" : "Sat"}</div>
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 rtl:divide-x-reverse bg-slate-100/40">
              {calendarDays.map((d, index) => {
                const dayBookings = bookingsByDate[d.dateStr] || [];
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (dayBookings.length === 0) {
                        onOpenBookingModal();
                      }
                    }}
                    className={`min-h-[105px] p-2 bg-white transition-all group flex flex-col justify-between ${
                      !d.isCurrentMonth ? "bg-slate-50/50 text-slate-300" : "text-slate-800"
                    } hover:bg-indigo-50/20`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                          d.isToday
                            ? "bg-indigo-600 text-white shadow-xs font-black"
                            : d.isCurrentMonth
                            ? "text-slate-800 font-mono"
                            : "text-slate-300 font-mono"
                        }`}
                      >
                        {d.dayNum}
                      </span>

                      {d.isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBookingModal();
                          }}
                          title={language === "ar" ? "حجز في هذا التاريخ" : "Book on this date"}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Bookings inside day cell */}
                    <div className="space-y-1 overflow-y-auto max-h-[75px] custom-scrollbar">
                      {dayBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCalendarBooking(b);
                          }}
                          className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-[10px] text-indigo-950 font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center justify-between truncate">
                            <span className="truncate">{b.spaceName}</span>
                            {b.startTime && (
                              <span className="font-mono text-[9px] text-indigo-600 shrink-0 font-normal">
                                {b.startTime}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate font-normal">
                            {b.customerName}
                          </div>
                        </div>
                      ))}
                    </div>

                    {dayBookings.length === 0 && d.isCurrentMonth && (
                      <div className="text-[10px] text-emerald-600/70 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        {language === "ar" ? "متاح للحجز +" : "Available +"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 3: BOOKINGS LOG TABLE --- */}
      {activeTab === "bookings" && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4 text-start">{language === "ar" ? "رقم الحجز" : "Booking #"}</th>
                  <th className="py-3.5 px-4 text-start">{language === "ar" ? "القاعة / المساحة" : "Space / Hall"}</th>
                  <th className="py-3.5 px-4 text-start">{language === "ar" ? "العميل والمستأجر" : "Customer / Tenant"}</th>
                  <th className="py-3.5 px-4 text-start">{language === "ar" ? "تاريخ ووقت الحجز" : "Reservation Period"}</th>
                  <th className="py-3.5 px-4 text-start">{language === "ar" ? "المبلغ والحالة" : "Amount & Payment"}</th>
                  <th className="py-3.5 px-4 text-start">{language === "ar" ? "حالة الحجز" : "Status"}</th>
                  <th className="py-3.5 px-4 text-center">{language === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                      <p className="font-semibold">{language === "ar" ? "لا توجد حجوزات مسجلة حالياً" : "No bookings found"}</p>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.bookingNumber}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          {b.rentalType === "HOURLY" ? (language === "ar" ? "ساعات" : "Hourly") : b.rentalType === "DAILY" ? (language === "ar" ? "يومي" : "Daily") : (language === "ar" ? "شهري" : "Monthly")} ({b.duration})
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{b.spaceName}</span>
                        <span className="text-[10px] text-slate-400">{b.branchName}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{b.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">{b.customerPhone}</span>
                        {b.customerCompany && (
                          <span className="text-[10px] text-indigo-600 block">{b.customerCompany}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-slate-800">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          <span>{b.startDate}</span>
                        </div>
                        {b.startTime && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{b.startTime} - {b.endTime}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-slate-900 text-sm">
                          {b.totalAmount.toFixed(2)} <span className="text-[10px] font-sans font-normal text-slate-500">{b.currency}</span>
                        </span>
                        <span className="block">
                          {b.paymentStatus === "PAID" ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {language === "ar" ? "مدفوع بالكامل" : "Paid"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" /> {language === "ar" ? "مستحق الدفع" : "Unpaid"}
                            </span>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(b.status)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onGenerateVoucherForBooking(b)}
                            title={language === "ar" ? "إصدار سند قبض فوري للمبلغ" : "Issue Receipt Voucher"}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {b.status !== "CANCELLED" && (
                            <button
                              onClick={() => onCancelBooking(b.id)}
                              title={language === "ar" ? "إلغاء الحجز" : "Cancel Booking"}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: VISUAL ANALYTICS & OCCUPANCY CHARTS (RECHARTS) --- */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          
          {/* Top Analytics Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
                  {language === "ar" ? "مؤشرات حية" : "Live Metrics"}
                </span>
                <span className="text-xs text-indigo-200">
                  {language === "ar" ? `تحليل إحصائي لشهر ${currentMonthName} ${calendarYear}` : `Statistical analysis for ${currentMonthName} ${calendarYear}`}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-1">
                {language === "ar" ? "لوحة معدلات إشغال القاعات وحجم الحجوزات" : "Hall Occupancy & Booking Analytics Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] text-slate-300 block">{language === "ar" ? "حجوزات الشهر" : "Monthly Bookings"}</span>
                <span className="text-xl font-black font-mono text-emerald-400">{currentMonthBookings.length}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] text-slate-300 block">{language === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}</span>
                <span className="text-xl font-black font-mono text-white">{totalMonthRevenue.toFixed(0)} <span className="text-xs font-normal text-slate-300">OMR</span></span>
              </div>
            </div>
          </div>

          {/* Grid of Visual Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Space Occupancy Rate BarChart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>{language === "ar" ? "معدلات إشغال القاعات (%)" : "Space Occupancy Rates (%)"}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === "ar" ? "نسبة الساعات المحجوزة مقارنة بالطاقة الاستيعابية التشغيلية" : "Booked hours relative to operational capacity"}
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700">
                              <p className="font-bold">{data.fullName} ({data.code})</p>
                              <p className="text-emerald-400 font-mono mt-1">{language === "ar" ? "نسبة الإشغال:" : "Occupancy:"} {data.occupancyRate}%</p>
                              <p className="text-slate-300">{language === "ar" ? "الساعات المحجوزة:" : "Booked Hours:"} {data.bookedHours} ساعة</p>
                              <p className="text-slate-300">{language === "ar" ? "الإيراد:" : "Revenue:"} {data.revenue} OMR</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="occupancyRate" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Daily Bookings & Revenue AreaChart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>{language === "ar" ? "حجم الحجوزات والإيرادات اليومية" : "Daily Bookings & Revenue Trend"}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === "ar" ? `توزيع الحجوزات والإيرادات عبر أيام شهر ${currentMonthName}` : `Distribution across days of ${currentMonthName}`}
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700">
                              <p className="font-bold">{language === "ar" ? "التاريخ:" : "Date:"} {data.fullDate}</p>
                              <p className="text-emerald-400 font-mono mt-1">{language === "ar" ? "الإيراد:" : "Revenue:"} {data.revenue} OMR</p>
                              <p className="text-indigo-300">{language === "ar" ? "عدد الحجوزات:" : "Bookings:"} {data.bookingsCount}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Rental Type Breakdown PieChart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  <span>{language === "ar" ? "توزيع نماذج التأجير" : "Rental Models Distribution"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === "ar" ? "نسبة الحجوزات بالساعة، باليوم، وبالشهر" : "Hourly vs Daily vs Monthly contracts"}
                </p>
              </div>

              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rentalTypePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {rentalTypePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                              <p className="font-bold">{data.name}</p>
                              <p className="text-emerald-400 font-mono">{data.value} {language === "ar" ? "حجز" : "bookings"}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Peak Days of Week */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-amber-600" />
                  <span>{language === "ar" ? "أيام الذروة الأكثر طلباً" : "Peak Days of Week"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === "ar" ? "كثافة الحجوزات عبر أيام الأسبوع لتنظيم الجداول التشغيلية" : "Bookings density across days of the week"}
                </p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakDaysData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                              <p className="font-bold">{data.day}</p>
                              <p className="text-amber-400 font-mono">{data.bookings} {language === "ar" ? "حجز" : "bookings"}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="bookings" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- QUICK BOOKING DETAILS MODAL --- */}
      {selectedCalendarBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {selectedCalendarBooking.bookingNumber}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedCalendarBooking.spaceName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCalendarBooking(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === "ar" ? "العميل / المستأجر:" : "Customer:"}</span>
                <span className="font-bold text-slate-900">{selectedCalendarBooking.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === "ar" ? "رقم الهاتف:" : "Phone:"}</span>
                <span className="font-mono text-slate-800">{selectedCalendarBooking.customerPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === "ar" ? "التاريخ والتوقيت:" : "Date & Time:"}</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedCalendarBooking.startDate} ({selectedCalendarBooking.startTime || "كامل اليوم"} - {selectedCalendarBooking.endTime || ""})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === "ar" ? "الغرض من الحجز:" : "Purpose:"}</span>
                <span className="text-slate-800 font-semibold">{selectedCalendarBooking.purpose}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-400">{language === "ar" ? "إجمالي المبلغ:" : "Total Price:"}</span>
                <span className="text-sm font-black font-mono text-emerald-600">
                  {selectedCalendarBooking.totalAmount.toFixed(2)} {selectedCalendarBooking.currency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  onGenerateVoucherForBooking(selectedCalendarBooking);
                  setSelectedCalendarBooking(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Receipt className="w-4 h-4" />
                <span>{language === "ar" ? "إصدار سند قبض مالي" : "Issue Receipt Voucher"}</span>
              </button>

              <button
                onClick={() => setSelectedCalendarBooking(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SPACE EDIT / CREATE MODAL --- */}
      {isSpaceModalOpen && editingSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingSpace.id.startsWith("space-") ? (language === "ar" ? "إضافة قاعة جديدة" : "Add Space") : (language === "ar" ? "تعديل بيانات القاعة" : "Edit Space")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === "ar" ? "تحديد مواصفات القاعة، الأسعار، والمزايا التشغيلية" : "Define specifications, pricing & amenities"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSpaceModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveSpace(editingSpace);
                setIsSpaceModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "اسم القاعة / المساحة *" : "Space Name *"}</label>
                  <input
                    type="text"
                    required
                    value={editingSpace.name}
                    onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })}
                    placeholder={language === "ar" ? "مثال: قاعة الرواد الكبرى" : "e.g. Grand Hall"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "رمز القاعة *" : "Space Code *"}</label>
                  <input
                    type="text"
                    required
                    value={editingSpace.code}
                    onChange={(e) => setEditingSpace({ ...editingSpace, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "نوع المساحة" : "Space Type"}</label>
                  <select
                    value={editingSpace.type}
                    onChange={(e) => setEditingSpace({ ...editingSpace, type: e.target.value as SpaceType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                  >
                    <option value="TRAINING_HALL">{language === "ar" ? "قاعة تدريب وتأهيل" : "Training Hall"}</option>
                    <option value="MEETING_ROOM">{language === "ar" ? "قاعة اجتماعات" : "Meeting Room"}</option>
                    <option value="PRIVATE_OFFICE">{language === "ar" ? "مكتب تنفيذي خاص" : "Private Office"}</option>
                    <option value="COWORKING_DESK">{language === "ar" ? "مساحة عمل مشتركة" : "Coworking Desk"}</option>
                    <option value="EVENT_SPACE">{language === "ar" ? "مساحة فعاليات" : "Event Space"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "السعة (أشخاص)" : "Capacity (Seats)"}</label>
                  <input
                    type="number"
                    min={1}
                    value={editingSpace.capacity}
                    onChange={(e) => setEditingSpace({ ...editingSpace, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-500 mb-1">{language === "ar" ? "السعر بالساعة" : "Hourly (OMR)"}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={editingSpace.hourlyRate}
                    onChange={(e) => setEditingSpace({ ...editingSpace, hourlyRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{language === "ar" ? "السعر باليوم" : "Daily (OMR)"}</label>
                  <input
                    type="number"
                    min={0}
                    value={editingSpace.dailyRate}
                    onChange={(e) => setEditingSpace({ ...editingSpace, dailyRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{language === "ar" ? "السعر بالشهر" : "Monthly (OMR)"}</label>
                  <input
                    type="number"
                    min={0}
                    value={editingSpace.monthlyRate}
                    onChange={(e) => setEditingSpace({ ...editingSpace, monthlyRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "رابط الصورة (Image URL)" : "Image URL"}</label>
                <input
                  type="url"
                  value={editingSpace.imageUrl || ""}
                  onChange={(e) => setEditingSpace({ ...editingSpace, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">{language === "ar" ? "وصف وملاحظات القاعة" : "Description"}</label>
                <textarea
                  rows={2}
                  value={editingSpace.description || ""}
                  onChange={(e) => setEditingSpace({ ...editingSpace, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {!editingSpace.id.startsWith("space-") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(language === "ar" ? "هل أنت متأكد من حذف هذه القاعة؟" : "Are you sure you want to delete this space?")) {
                        onDeleteSpace(editingSpace.id);
                        setIsSpaceModalOpen(false);
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("delete")}</span>
                  </button>
                )}
                
                <div className="flex items-center gap-2 ms-auto">
                  <button
                    type="button"
                    onClick={() => setIsSpaceModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer transition-all"
                  >
                    {t("save")}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
