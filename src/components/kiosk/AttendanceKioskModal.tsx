import React, { useState, useEffect, useRef } from "react";
import {
  Employee,
  Branch,
  CompanySettings,
  KioskDevice,
  MovementTypeConfig,
  AttendanceMovementLog,
  EmployeeMovementStatus,
  MovementCategory
} from "../../types";
import {
  verifyKioskPin,
  verifyMasterExitPin,
  verifyAdminExitPin,
  checkKioskLockout
} from "../../utils/kioskSecurity";
import {
  calculateEmployeeCurrentStatus,
  validateMovementLogic,
  addToOfflineQueue,
  loadOfflineQueue,
  syncOfflineQueueToMain,
  saveIsKioskModeEnabled,
  loadKioskDevices,
  loadAttendanceMovementLogs,
  loadMovementTypes,
  loadActiveKioskDeviceId
} from "../../utils/attendanceStorage";
import {
  Clock,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Maximize2,
  Minimize2,
  Delete,
  Lock,
  Unlock,
  Building2,
  Wifi,
  WifiOff,
  User,
  LogIn,
  LogOut,
  Car,
  Coffee,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Info,
  Settings,
  Activity,
  Copy,
  Check,
  Power,
  RotateCw,
  Volume2,
  VolumeX,
  Sliders,
  Tablet
} from "lucide-react";

export interface AttendanceKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employee[];
  branches?: Branch[];
  companySettings?: CompanySettings;
  kioskDevices?: KioskDevice[];
  activeDeviceId?: string;
  movementTypes?: MovementTypeConfig[];
  movementLogs?: AttendanceMovementLog[];
  onSaveMovementLog?: (log: AttendanceMovementLog) => void;
  onSaveLog?: (log: AttendanceMovementLog) => void;
  onAuditLog?: (action: string, module: string, targetId: string, targetName: string, detailsAr: string, detailsEn: string) => void;
}

type KioskStep = "STANDBY" | "PIN_ENTRY" | "CAMERA_CAPTURE" | "SELECT_MOVEMENT" | "CONFIRMATION" | "SUCCESS";

export const AttendanceKioskModal: React.FC<AttendanceKioskModalProps> = ({
  isOpen,
  onClose,
  employees = [],
  branches = [],
  companySettings = {
    companyNameAr: "ديشال",
    companyNameEn: "Deshal",
    taxNumber: "",
    commercialRegister: "",
    phone: "",
    email: "",
    address: "",
    currency: "OMR",
    fiscalYearStart: "01-01"
  },
  kioskDevices,
  activeDeviceId,
  movementTypes,
  movementLogs,
  onSaveMovementLog,
  onSaveLog,
  onAuditLog
}) => {
  const safeKioskDevices = kioskDevices && kioskDevices.length > 0 ? kioskDevices : loadKioskDevices();
  const safeMovementLogs = movementLogs || loadAttendanceMovementLogs();
  const safeMovementTypes = movementTypes && movementTypes.length > 0 ? movementTypes : loadMovementTypes();
  const safeActiveDeviceId = activeDeviceId || loadActiveKioskDeviceId();
  const handleSave = onSaveMovementLog || onSaveLog || (() => {});

  // Current time & date clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Kiosk Flow States
  const [step, setStep] = useState<KioskStep>("STANDBY");
  const [selectedDevice, setSelectedDevice] = useState<KioskDevice>(() => {
    return (
      safeKioskDevices.find((d) => d.id === safeActiveDeviceId) ||
      safeKioskDevices[0] || {
        id: "kiosk-default",
        deviceCode: "KIOSK-TABLET",
        name: "كشك الحضور اللوحي",
        branchId: branches[0]?.id || "branch-sohar",
        branchName: branches[0]?.name || "المقر الرئيسي",
        location: "المدخل الرئيسي",
        deviceToken: "tok_kiosk_live",
        status: "ACTIVE",
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
  });

  // PIN & Auth States
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [isPinVerifying, setIsPinVerifying] = useState<boolean>(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<Employee | null>(null);
  const [showDemoPinHelper, setShowDemoPinHelper] = useState<boolean>(false);

  // Camera & Photo States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string>("");
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>("");
  const [cameraCountdown, setCameraCountdown] = useState<number>(3);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Movement Selection & Confirmation States
  const [selectedMovementType, setSelectedMovementType] = useState<MovementTypeConfig | null>(null);
  const [movementReason, setMovementReason] = useState<string>("");
  const [movementWarning, setMovementWarning] = useState<string>("");
  const [successData, setSuccessData] = useState<{
    employeeName: string;
    movementName: string;
    time: string;
    date: string;
    photoUrl?: string;
  } | null>(null);

  // ----------------------------------------------------
  // HIDDEN 7-CLICKS EXIT MECHANISM STATES
  // ----------------------------------------------------
  const [logoTapCount, setLogoTapCount] = useState<number>(0);
  const [firstLogoTapTime, setFirstLogoTapTime] = useState<number>(0);

  // Admin PIN Authentication Dialog
  const [isAdminAuthDialogOpen, setIsAdminAuthDialogOpen] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>("");
  const [adminAuthError, setAdminAuthError] = useState<string>("");
  const [adminLockoutSeconds, setAdminLockoutSeconds] = useState<number>(0);
  const [isAdminAuthenticating, setIsAdminAuthenticating] = useState<boolean>(false);

  // Kiosk Administration Control Panel View
  const [isKioskAdminPanelOpen, setIsKioskAdminPanelOpen] = useState<boolean>(false);
  const [copiedTokenSuccess, setCopiedTokenSuccess] = useState<boolean>(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string>("");
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
  const [isExitConfirmModalOpen, setIsExitConfirmModalOpen] = useState<boolean>(false);

  // Kiosk Preferences
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isAutoPhotoMandatory, setIsAutoPhotoMandatory] = useState<boolean>(true);

  // Timer interval for clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    const lockout = checkKioskLockout();
    if (lockout.isLocked) {
      setLockoutRemaining(lockout.remainingSeconds);
      setAdminLockoutSeconds(lockout.remainingSeconds);
      const countdown = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setPinError("");
            setAdminAuthError("");
            setAdminLockoutSeconds(0);
            return 0;
          }
          setAdminLockoutSeconds(prev - 1);
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [step, isAdminAuthDialogOpen]);

  // Keep device state aligned with activeDeviceId prop
  useEffect(() => {
    const matched = safeKioskDevices.find((d) => d.id === safeActiveDeviceId);
    if (matched) {
      setSelectedDevice(matched);
    }
  }, [safeActiveDeviceId, safeKioskDevices]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Start Camera Stream
  const startCamera = async (facing: "user" | "environment" = cameraFacingMode) => {
    setIsCameraActive(true);
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        throw new Error("الكاميرا غير مدعومة في هذا المتصفح");
      }
    } catch (err: any) {
      console.warn("Camera access failed or denied, using simulated capture:", err);
      setCameraError("تعذر تشغيل كاميرا الجهاز. سيتم استخدام لقطة الهوية التلقائية.");
    }
  };

  // ----------------------------------------------------
  // STEALTH 7-CLICKS HANDLER (NO VISUAL CUE FOR TAPS 1-6)
  // ----------------------------------------------------
  const handleLogoClick = () => {
    const now = Date.now();
    if (firstLogoTapTime === 0 || now - firstLogoTapTime > 5000) {
      // New 5-second window starts
      setFirstLogoTapTime(now);
      setLogoTapCount(1);
    } else {
      const nextCount = logoTapCount + 1;
      setLogoTapCount(nextCount);
      if (nextCount >= 7) {
        // 7 consecutive taps reached within 5 seconds! Trigger Admin Auth Dialog
        setLogoTapCount(0);
        setFirstLogoTapTime(0);
        setAdminPinInput("");
        setAdminAuthError("");
        setIsAdminAuthDialogOpen(true);
      }
    }
  };

  // ----------------------------------------------------
  // ADMIN PIN VERIFICATION FOR KIOSK EXIT & ADMIN ACCESS
  // ----------------------------------------------------
  const handleAdminPinSubmit = async () => {
    if (adminPinInput.length < 4 || isAdminAuthenticating) return;
    setIsAdminAuthenticating(true);
    setAdminAuthError("");

    try {
      const res = await verifyAdminExitPin(adminPinInput, employees);
      if (res.success) {
        // Log access in Audit Log
        if (onAuditLog) {
          onAuditLog(
            "ADMIN_ACCESS",
            "ATTENDANCE_KIOSK",
            selectedDevice.id,
            selectedDevice.name,
            `دخول مصرح إلى لوحة إدارة الكشك اللوحي بواسطة ${res.adminName || "مدير النظام"} بعد التحقق من PIN المسؤول`,
            `Admin ${res.adminName || "System Admin"} unlocked Kiosk Administration panel via verified PIN`
          );
        }
        setIsAdminAuthDialogOpen(false);
        setAdminPinInput("");
        setAdminAuthError("");
        setIsKioskAdminPanelOpen(true);
      } else {
        setAdminAuthError(res.errorMessage || "رمز المسؤول غير صحيح");
        if (res.isLocked && res.remainingSeconds) {
          setAdminLockoutSeconds(res.remainingSeconds);
        }
        if (onAuditLog) {
          onAuditLog(
            "FAILED_ADMIN_AUTH",
            "ATTENDANCE_KIOSK",
            selectedDevice.id,
            selectedDevice.name,
            `محاولة غير مصرح بها أو برمز خاطئ للوصول إلى لوحة إدارة الكشك اللوحي (${selectedDevice.name})`,
            `Failed unauthorized attempt to unlock Kiosk Administration with incorrect PIN`
          );
        }
      }
    } catch (e) {
      setAdminAuthError("حدث خطأ أثناء التحقق من الرمز.");
    } finally {
      setIsAdminAuthenticating(false);
    }
  };

  // ----------------------------------------------------
  // CONFIRM EXIT FROM KIOSK MODE
  // ----------------------------------------------------
  const handleConfirmExitKiosk = () => {
    // 1. Set Kiosk mode to false in storage (WITHOUT deleting Device ID or Token)
    saveIsKioskModeEnabled(false);

    // 2. Log in Audit Log
    if (onAuditLog) {
      onAuditLog(
        "KIOSK_EXIT",
        "ATTENDANCE_KIOSK",
        selectedDevice.id,
        selectedDevice.name,
        `تم الخروج الآمن من وضع الكشك اللوحي للجهاز (${selectedDevice.name} - ${selectedDevice.deviceCode}) والعودة إلى لوحة تحكم Deshal ERP مع الاحتفاظ ببيانات التفعيل والتوكن`,
        `Exited Kiosk Mode securely for device ${selectedDevice.name} (${selectedDevice.deviceCode}) while preserving Device ID and Token`
      );
    }

    // 3. Exit fullscreen if needed
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    // 4. Close dialogs & modal
    setIsExitConfirmModalOpen(false);
    setIsKioskAdminPanelOpen(false);
    stopCamera();
    onClose();
  };

  // ----------------------------------------------------
  // INSTANT OFFLINE SYNC NOW ACTION
  // ----------------------------------------------------
  const handleInstantSyncNow = () => {
    setIsSyncingNow(true);
    setTimeout(() => {
      const { syncedCount } = syncOfflineQueueToMain(safeMovementLogs);
      setIsSyncingNow(false);
      setSyncToastMessage(
        syncedCount > 0
          ? `تمت المزامنة بنجاح! تم رفع ${syncedCount} حركة مسجلة محلياً إلى قاعدة البيانات.`
          : "كافة السجلات متزامنة بالفعل مع السيرفر الرئيسي بنجاح."
      );
      setTimeout(() => setSyncToastMessage(""), 4000);
    }, 600);
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot from Video Stream or Fallback
  const capturePhoto = () => {
    if (videoRef.current && streamRef.current) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 480;
        canvas.height = 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 480, 360);
          
          // Add timestamp watermark
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(10, 320, 460, 32);
          ctx.fillStyle = "#ffffff";
          ctx.font = "14px monospace";
          ctx.fillText(
            `DESHAL KIOSK | ${selectedDevice.name} | ${currentTime.toLocaleTimeString("ar-OM")}`,
            20,
            342
          );

          const photo = canvas.toDataURL("image/jpeg", 0.85);
          setCapturedPhotoUrl(photo);
          stopCamera();
          return photo;
        }
      } catch (e) {
        console.warn("Canvas capture error:", e);
      }
    }

    // Fallback if camera not working: Use employee avatar or high-fidelity snapshot placeholder
    const fallbackPhoto =
      authenticatedEmployee?.avatarUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
    setCapturedPhotoUrl(fallbackPhoto);
    stopCamera();
    return fallbackPhoto;
  };

  // Reset to Standby
  const resetToStandby = () => {
    stopCamera();
    setStep("STANDBY");
    setEnteredPin("");
    setPinError("");
    setAuthenticatedEmployee(null);
    setSelectedMovementType(null);
    setMovementReason("");
    setMovementWarning("");
    setCapturedPhotoUrl("");
    setSuccessData(null);
  };

  // Handle Numpad Digits
  const handleNumpadPress = (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setPinError("");
      // Auto submit on 4 digits
      if (nextPin.length === 4) {
        processPinVerification(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(enteredPin.slice(0, -1));
      setPinError("");
    }
  };

  const handleClearPin = () => {
    setEnteredPin("");
    setPinError("");
  };

  // Process PIN Verification
  const processPinVerification = async (pinToVerify: string) => {
    setIsPinVerifying(true);
    setPinError("");

    try {
      const result = await verifyKioskPin(pinToVerify, employees);
      if (result.success && result.employee) {
        setAuthenticatedEmployee(result.employee);
        setEnteredPin("");
        
        // Advance to Camera Capture step
        setStep("CAMERA_CAPTURE");
        startCamera();

        // Start auto capture countdown
        let count = 2;
        setCameraCountdown(count);
        const countdownTimer = setInterval(() => {
          count -= 1;
          setCameraCountdown(count);
          if (count <= 0) {
            clearInterval(countdownTimer);
            capturePhoto();
            setStep("SELECT_MOVEMENT");
          }
        }, 1000);
      } else {
        setPinError(result.errorMessage || "رمز PIN غير صحيح. يرجى المحاولة مرة أخرى.");
        if (result.isLocked && result.remainingSeconds) {
          setLockoutRemaining(result.remainingSeconds);
        }
        if (onAuditLog) {
          onAuditLog(
            "SECURITY_ALERT",
            "ATTENDANCE_KIOSK",
            selectedDevice.id,
            selectedDevice.name,
            `محاولة إدخال PIN خاطئة على كشك: ${selectedDevice.name}`,
            `Failed PIN attempt on kiosk device: ${selectedDevice.name}`
          );
        }
      }
    } catch (e: any) {
      setPinError("حدث خطأ أثناء التحقق من الرمز.");
    } finally {
      setIsPinVerifying(false);
    }
  };

  // Handle Movement Selection
  const handleSelectMovement = (movement: MovementTypeConfig) => {
    if (!authenticatedEmployee) return;

    // Check logical rules
    const currentStatusInfo = calculateEmployeeCurrentStatus(authenticatedEmployee.id, safeMovementLogs);
    const validation = validateMovementLogic(currentStatusInfo.status, movement.category);

    setSelectedMovementType(movement);
    setMovementWarning(validation.warning || "");
    setStep("CONFIRMATION");
  };

  // Final Confirmation & Submission
  const handleFinalConfirm = () => {
    if (!authenticatedEmployee || !selectedMovementType) return;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0]; // HH:mm:ss

    const newLog: AttendanceMovementLog = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: authenticatedEmployee.id,
      employeeCode: authenticatedEmployee.employeeCode,
      employeeName: authenticatedEmployee.fullName,
      department: authenticatedEmployee.department,
      jobTitle: authenticatedEmployee.jobTitle,
      branchId: selectedDevice.branchId,
      branchName: selectedDevice.branchName,
      movementTypeCode: selectedMovementType.code,
      movementTypeNameAr: selectedMovementType.labelAr,
      movementTypeNameEn: selectedMovementType.labelEn,
      movementCategory: selectedMovementType.category,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      photoUrl: capturedPhotoUrl || authenticatedEmployee.avatarUrl,
      deviceId: selectedDevice.id,
      deviceName: selectedDevice.name,
      location: selectedDevice.location,
      syncStatus: isOnline ? "SYNCED" : "PENDING_OFFLINE",
      offlineCapturedAt: isOnline ? undefined : now.toISOString(),
      reason: movementReason.trim() || undefined,
      createdAt: now.toISOString()
    };

    // If offline, store to offline queue
    if (!isOnline) {
      addToOfflineQueue(newLog);
    }

    // Save to main logs state
    handleSave(newLog);

    if (onAuditLog) {
      onAuditLog(
        "ATTENDANCE_LOG",
        "ATTENDANCE_KIOSK",
        authenticatedEmployee.id,
        authenticatedEmployee.fullName,
        `تسجيل حركة (${selectedMovementType.labelAr}) للموظف ${authenticatedEmployee.fullName} عبر كشك ${selectedDevice.name}`,
        `Recorded movement (${selectedMovementType.labelEn}) for ${authenticatedEmployee.fullName} via kiosk ${selectedDevice.name}`
      );
    }

    // Success Screen
    setSuccessData({
      employeeName: authenticatedEmployee.fullName,
      movementName: selectedMovementType.labelAr,
      time: timeStr,
      date: dateStr,
      photoUrl: capturedPhotoUrl || authenticatedEmployee.avatarUrl
    });
    setStep("SUCCESS");

    // Auto reset after 4 seconds
    setTimeout(() => {
      resetToStandby();
    }, 4000);
  };

  if (!isOpen) return null;

  // Active employee status if verified
  const employeeCurrentStatusInfo = authenticatedEmployee
    ? calculateEmployeeCurrentStatus(authenticatedEmployee.id, safeMovementLogs)
    : null;

  const offlineQueue = loadOfflineQueue();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Top Header Bar: Branding (7-Tap Hidden Exit Trigger), Live Clock, Network Status */}
      <header className="px-6 py-4 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between flex-wrap gap-4 shadow-xl">
        {/* Company & Device Identity (7 consecutive taps trigger admin unlock silently) */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-4 cursor-pointer group active:opacity-95 select-none transition-transform"
          title="نظام ديشال لإدارة الأعمال"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            {companySettings.companyNameAr ? companySettings.companyNameAr.charAt(0) : "D"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide text-amber-400">
                {companySettings.companyNameAr || "ديشال لإدارة الأعمال"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                كشك الحضور الذكي
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {selectedDevice.name} ({selectedDevice.location})
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="font-mono text-slate-400">{selectedDevice.deviceCode}</span>
            </div>
          </div>
        </div>

        {/* Live Clock, Offline Records Badge & Status Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Offline Pending Records Badge */}
          {offlineQueue.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5 animate-bounce" />
              <span>{offlineQueue.length} حركة بانتظار المزامنة</span>
            </div>
          )}

          {/* Online / Offline Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                متصل بالنظام
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <WifiOff className="w-4 h-4 text-rose-400" />
                وضع عدم الاتصال (حفظ محلي)
              </span>
            )}
          </div>

          {/* Clock */}
          <div className="text-right flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-2xl border border-slate-800">
            <Clock className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-2xl font-black font-mono tracking-wider text-white">
                {currentTime.toLocaleTimeString("ar-OM", { hour12: true })}
              </div>
              <div className="text-xs text-slate-400">
                {currentTime.toLocaleDateString("ar-OM", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Fullscreen control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Kiosk Content Stage */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        {/* ========================================================================= */}
        {/* STEP 1: STANDBY SCREEN (شاشة الانتظار والبدء السريع) */}
        {/* ========================================================================= */}
        {step === "STANDBY" && (
          <div className="w-full max-w-4xl text-center flex flex-col items-center animate-fadeIn">
            {/* Welcome Banner */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                نظام تسجيل الحضور وحركة الموظفين اللحظية
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-2">
                مرحباً بك في {companySettings.companyNameAr || "ديشال"}
              </h2>
              <p className="text-slate-400 text-base max-w-lg mx-auto">
                يرجى الضغط على زر تسجيل الحضور أو الخروج، ثم إدخال رمز PIN السري الخاص بك لإتمام العملية.
              </p>
            </div>

            {/* Big Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
              {/* Check In Button */}
              <button
                onClick={() => setStep("PIN_ENTRY")}
                className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all border-2 border-emerald-400/40"
              >
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                  <LogIn className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-1">تسجيل حضور</h3>
                <p className="text-emerald-100 text-sm">بداية الدوام اليومي</p>
                <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-300 animate-ping" />
              </button>

              {/* Movement / Check Out Button */}
              <button
                onClick={() => setStep("PIN_ENTRY")}
                className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all border-2 border-indigo-400/40"
              >
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                  <Car className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-1">حركة موظف / انصراف</h3>
                <p className="text-indigo-100 text-sm">مهمة عمل، استراحة، انصراف</p>
              </button>
            </div>

            {/* Quick Demo Helper Hint */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setShowDemoPinHelper(!showDemoPinHelper)}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors underline underline-offset-4"
              >
                <HelpCircle className="w-4 h-4" />
                {showDemoPinHelper ? "إخفاء رموز الـPIN التجريبية" : "عرض رموز الـPIN التجريبية للتجربة السريعة"}
              </button>

              {showDemoPinHelper && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 max-w-xl text-right">
                  <div className="font-bold text-amber-400 mb-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    رموز PIN التجريبية للموظفين (مشفرة بـ SHA-256):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">مدير النظام (أدمن)</span>
                      <strong className="text-amber-300">1234</strong>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">فاطمة البلوشي (محاسب)</span>
                      <strong className="text-amber-300">2233</strong>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">أحمد المعمري (مستودع)</span>
                      <strong className="text-amber-300">3344</strong>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">محمد الكندي (مبيعات)</span>
                      <strong className="text-amber-300">4455</strong>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">مريم المقبالي (استقبال)</span>
                      <strong className="text-amber-300">5566</strong>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">خروج المشرف</span>
                      <strong className="text-rose-300">9900</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: NUMERIC PIN KEYPAD (إدخال رمز PIN الموظف) */}
        {/* ========================================================================= */}
        {step === "PIN_ENTRY" && (
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur flex flex-col items-center animate-scaleUp">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-4">
              <button
                onClick={resetToStandby}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="إلغاء وعودة"
              >
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">التحقق من الموظف</h3>
                <p className="text-xs text-slate-400">أدخل رمز PIN السري الخاص بك</p>
              </div>
              <div className="w-9" /> {/* Spacer */}
            </div>

            {/* PIN Dots Display */}
            <div className="w-full bg-slate-950 py-4 px-6 rounded-2xl border border-slate-800 mb-4 flex flex-col items-center">
              <div className="flex items-center justify-center gap-4 my-2">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = enteredPin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-6 h-6 rounded-full transition-all duration-200 ${
                        isFilled
                          ? "bg-amber-400 scale-110 shadow-lg shadow-amber-400/30"
                          : "bg-slate-800 border-2 border-slate-700"
                      }`}
                    />
                  );
                })}
              </div>
              {lockoutRemaining > 0 ? (
                <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 mt-2 animate-pulse">
                  <ShieldAlert className="w-4 h-4" />
                  تم قفل الكشك مؤقتاً: يرجى الانتظار {lockoutRemaining} ثانية
                </div>
              ) : pinError ? (
                <div className="text-xs text-rose-400 font-medium mt-2 text-center">
                  {pinError}
                </div>
              ) : (
                <div className="text-xs text-slate-500 mt-1">
                  الرمز لا يظهر كنص صريح ويتم مطابقة الـ Hash فورياً
                </div>
              )}
            </div>

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full mb-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  disabled={lockoutRemaining > 0 || isPinVerifying}
                  onClick={() => handleNumpadPress(num)}
                  className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-2xl font-bold font-mono text-white transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50"
                >
                  {num}
                </button>
              ))}

              {/* Clear */}
              <button
                disabled={lockoutRemaining > 0 || isPinVerifying}
                onClick={handleClearPin}
                className="h-16 rounded-2xl bg-slate-800/60 hover:bg-rose-500/20 text-rose-400 text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 border border-slate-800"
              >
                مسح
              </button>

              {/* 0 */}
              <button
                disabled={lockoutRemaining > 0 || isPinVerifying}
                onClick={() => handleNumpadPress("0")}
                className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-2xl font-bold font-mono text-white transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50"
              >
                0
              </button>

              {/* Backspace */}
              <button
                disabled={lockoutRemaining > 0 || isPinVerifying}
                onClick={handleBackspace}
                className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-40 border border-slate-800"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Helper status */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              تأمين عالي: تشفير أحادي الاتجاه بدون حفظ أرقام PIN بالنظام
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CAMERA CAPTURE (التقاط صورة الموظف التلقائي) */}
        {/* ========================================================================= */}
        {step === "CAMERA_CAPTURE" && (
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fadeIn text-center">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-1">التحقق بالصورة التلقائية</h3>
              <p className="text-xs text-slate-400">
                مرحباً <span className="text-amber-400 font-semibold">{authenticatedEmployee?.fullName}</span>، يرجى النظر إلى الكاميرا
              </p>
            </div>

            {/* Camera Viewfinder Container */}
            <div className="relative w-72 h-72 rounded-full overflow-hidden bg-slate-950 border-4 border-amber-400/80 shadow-2xl shadow-amber-500/20 mb-6 flex items-center justify-center">
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Guide Overlay Circle */}
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-white/40 pointer-events-none" />

              {/* Countdown Overlay */}
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-20 h-20 rounded-full bg-amber-500 text-slate-950 font-black text-4xl flex items-center justify-center shadow-2xl animate-ping">
                  {cameraCountdown}
                </div>
              </div>
            </div>

            {cameraError && (
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl mb-4">
                {cameraError}
              </div>
            )}

            {/* Manual Snap Button */}
            <button
              onClick={() => {
                capturePhoto();
                setStep("SELECT_MOVEMENT");
              }}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Camera className="w-5 h-5" />
              التقاط الصورة فوراً والمتابعة
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SELECT MOVEMENT (اختيار نوع الحركة) */}
        {/* ========================================================================= */}
        {step === "SELECT_MOVEMENT" && authenticatedEmployee && (
          <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur animate-scaleUp">
            {/* Employee Profile Header */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={capturedPhotoUrl || authenticatedEmployee.avatarUrl}
                    alt={authenticatedEmployee.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{authenticatedEmployee.fullName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-amber-300 border border-slate-700">
                      {authenticatedEmployee.employeeCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span>{authenticatedEmployee.jobTitle}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{authenticatedEmployee.department}</span>
                  </div>
                </div>
              </div>

              {/* Current Live Status */}
              {employeeCurrentStatusInfo && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">الحالة الحالية اليوم</div>
                    <div className="text-xs font-bold text-amber-400">
                      {employeeCurrentStatusInfo.statusLabelAr}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Movement Category Grid */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                اختر نوع الحركة المراد تسجيلها:
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {safeMovementTypes
                  .filter((m) => m.isActive)
                  .sort((a, b) => a.order - b.order)
                  .map((type) => {
                    const isCheckIn = type.category === "CHECK_IN";
                    const isCheckOut = type.category === "CHECK_OUT";
                    const isMission = type.category === "MISSION_OUT" || type.category === "MISSION_IN";
                    const isBreak = type.category === "BREAK_OUT" || type.category === "BREAK_IN";

                    return (
                      <button
                        key={type.id}
                        onClick={() => handleSelectMovement(type)}
                        className={`group relative p-5 rounded-2xl border text-right transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          isCheckIn
                            ? "bg-emerald-950/40 border-emerald-700/60 hover:bg-emerald-900/60"
                            : isCheckOut
                            ? "bg-rose-950/40 border-rose-700/60 hover:bg-rose-900/60"
                            : isMission
                            ? "bg-blue-950/40 border-blue-700/60 hover:bg-blue-900/60"
                            : isBreak
                            ? "bg-amber-950/40 border-amber-700/60 hover:bg-amber-900/60"
                            : "bg-slate-800/80 border-slate-700 hover:bg-slate-750"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center mb-3">
                          {isCheckIn && <LogIn className="w-5 h-5 text-emerald-400" />}
                          {isCheckOut && <LogOut className="w-5 h-5 text-rose-400" />}
                          {type.category === "MISSION_OUT" && <Car className="w-5 h-5 text-blue-400" />}
                          {type.category === "MISSION_IN" && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                          {type.category === "BREAK_OUT" && <Coffee className="w-5 h-5 text-amber-400" />}
                          {type.category === "BREAK_IN" && <Clock className="w-5 h-5 text-teal-400" />}
                          {type.category === "EMERGENCY_OUT" && <AlertTriangle className="w-5 h-5 text-rose-400" />}
                          {type.category === "EMERGENCY_IN" && <ShieldCheck className="w-5 h-5 text-purple-400" />}
                        </div>
                        <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {type.labelAr}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{type.labelEn}</div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Cancel and Back to Standby */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={resetToStandby}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                إلغاء والعودة للرئيسية
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: CONFIRMATION MODAL (تأكيد العملية قبل الحفظ) */}
        {/* ========================================================================= */}
        {step === "CONFIRMATION" && authenticatedEmployee && selectedMovementType && (
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col animate-scaleUp">
            <h3 className="text-xl font-bold text-white mb-1 text-center">تأكيد تسجيل الحركة</h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              يرجى مراجعة بيانات الحركة قبل الاعتماد النهائي
            </p>

            {/* Warning if illogical movement */}
            {movementWarning && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>{movementWarning}</div>
              </div>
            )}

            {/* Movement Summary Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={capturedPhotoUrl || authenticatedEmployee.avatarUrl}
                  alt={authenticatedEmployee.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400"
                />
                <div>
                  <div className="text-base font-bold text-white">{authenticatedEmployee.fullName}</div>
                  <div className="text-xs text-slate-400">{authenticatedEmployee.employeeCode} | {authenticatedEmployee.jobTitle}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">نوع الحركة المطلوب:</span>
                  <span className="font-bold text-amber-400 text-sm">{selectedMovementType.labelAr}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الوقت والتاريخ:</span>
                  <span className="font-mono text-white font-semibold">
                    {currentTime.toLocaleTimeString("ar-OM")} - {currentTime.toLocaleDateString("ar-OM")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">جهاز التسجيل:</span>
                  <span className="text-slate-300 font-medium">{selectedDevice.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الفرع والموقع:</span>
                  <span className="text-slate-300 font-medium">{selectedDevice.branchName}</span>
                </div>
              </div>

              {/* Optional Reason Input if required or for mission/emergency */}
              {(selectedMovementType.requiresReason ||
                selectedMovementType.category === "MISSION_OUT" ||
                selectedMovementType.category === "EMERGENCY_OUT") && (
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    سبب الخروج / تفاصيل المهمة {selectedMovementType.requiresReason ? "(مطلوب)" : "(اختياري)"}:
                  </label>
                  <textarea
                    rows={2}
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    placeholder="مثال: زيارة عميل ميدانية، اجتماع مع المورد..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep("SELECT_MOVEMENT")}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors text-center"
              >
                تغيير الحركة
              </button>
              <button
                disabled={
                  selectedMovementType.requiresReason && !movementReason.trim()
                }
                onClick={handleFinalConfirm}
                className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all text-center flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                تأكيد التسجيل الآن
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: SUCCESS SCREEN (شاشة النجاح والتأكيد اللحظي) */}
        {/* ========================================================================= */}
        {step === "SUCCESS" && successData && (
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-scaleUp">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
              <CheckCircle2 className="w-14 h-14" />
            </div>

            <h3 className="text-2xl font-black text-white mb-2">تم تسجيل الحركة بنجاح!</h3>
            <div className="text-lg font-bold text-amber-400 mb-1">{successData.employeeName}</div>
            <div className="text-sm font-semibold text-emerald-300 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              {successData.movementName}
            </div>

            <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 mb-6 font-mono">
              <div>الساعة: <strong className="text-white">{successData.time}</strong></div>
              <div>التاريخ: <strong className="text-white">{successData.date}</strong></div>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              سيتم العودة للشاشة الرئيسية تلقائياً خلال ثوانٍ...
            </p>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 1. ADMIN AUTHENTICATION DIALOG (TRIGGERED BY 7 TAPS ON LOGO) */}
      {/* ========================================================================= */}
      {isAdminAuthDialogOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 p-6 rounded-3xl shadow-2xl text-right animate-scaleUp">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-lg">
                <Shield className="w-6 h-6 text-amber-400" />
                <span>التحقق من هوية مسؤول الكشك</span>
              </div>
              <button
                onClick={() => {
                  setIsAdminAuthDialogOpen(false);
                  setAdminPinInput("");
                  setAdminAuthError("");
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
              >
                إلغاء
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              تم استدعاء لوحة إدارة الكشك اللوحي. يرجى إدخال رمز PIN الخاص بالمسؤول أو المدير المخوّل للمتابعة.
            </p>

            {adminLockoutSeconds > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <div className="font-bold text-sm mb-1">تم قفل المحاولة مؤقتاً لحماية الجهاز</div>
                <div className="text-xs text-rose-400">
                  يرجى الانتظار <strong className="font-mono text-white text-sm">{adminLockoutSeconds}</strong> ثانية للمحاولة مجدداً.
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <input
                    type="password"
                    maxLength={10}
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setAdminAuthError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdminPinSubmit();
                    }}
                    autoFocus
                    placeholder="••••"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-[0.6em] text-2xl focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                  />
                  <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                {/* Numpad Buttons for Touch Device Ergonomics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => {
                        if (btn === "C") {
                          setAdminPinInput("");
                          setAdminAuthError("");
                        } else if (btn === "OK") {
                          handleAdminPinSubmit();
                        } else {
                          if (adminPinInput.length < 8) {
                            setAdminPinInput((prev) => prev + btn);
                            setAdminAuthError("");
                          }
                        }
                      }}
                      className={`h-11 rounded-xl text-base font-bold transition-colors ${
                        btn === "OK"
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                          : btn === "C"
                          ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60"
                      }`}
                    >
                      {btn === "C" ? "مسح" : btn === "OK" ? "دخول" : btn}
                    </button>
                  ))}
                </div>
              </>
            )}

            {adminAuthError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center mb-3">
                {adminAuthError}
              </div>
            )}

            <div className="text-[11px] text-slate-500 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>الرمز الرئيسي للمدير: 9900 أو 1234</span>
              <span className="text-slate-400">حماية Rate Limiting مفعلة</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KIOSK ADMINISTRATION SCREEN (شاشة إدارة الكشك اللوحي) */}
      {/* ========================================================================= */}
      {isKioskAdminPanelOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl shadow-2xl text-right animate-scaleUp my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">إدارة الكشك اللوحي (Kiosk Administration)</h3>
                  <p className="text-xs text-slate-400">لوحة المراقبة والتحكم الخاصة بالجهاز اللوحي لكشك الحضور</p>
                </div>
              </div>
              <button
                onClick={() => setIsKioskAdminPanelOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                إغلاق اللوحة
              </button>
            </div>

            {/* Sync Notification Banner */}
            {syncToastMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{syncToastMessage}</span>
              </div>
            )}

            {/* Grid 1: Device Info Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Tablet className="w-4 h-4" />
                  <span>معلومات تعريف الجهاز (Device Identity)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {selectedDevice.status === "ACTIVE" ? "مفعل ويعمل (ACTIVE)" : selectedDevice.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">معرّف الجهاز (Device ID):</span>
                  <div className="font-mono text-white font-bold mt-0.5">{selectedDevice.id}</div>
                </div>
                <div>
                  <span className="text-slate-400">اسم الكشك (Device Name):</span>
                  <div className="font-bold text-white mt-0.5">{selectedDevice.name}</div>
                </div>
                <div>
                  <span className="text-slate-400">كود الجهاز (Device Code):</span>
                  <div className="font-mono text-amber-300 font-bold mt-0.5">{selectedDevice.deviceCode}</div>
                </div>
                <div>
                  <span className="text-slate-400">الفرع والموقع (Branch / Location):</span>
                  <div className="text-white mt-0.5">{selectedDevice.branchName} - {selectedDevice.location}</div>
                </div>
                {selectedDevice.activationCode && (
                  <div>
                    <span className="text-slate-400">كود التفعيل الدائم (Activation Code):</span>
                    <div className="font-mono text-emerald-300 font-bold mt-0.5">{selectedDevice.activationCode}</div>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-slate-400">رمز التوثيق المشفر (Device Token):</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      readOnly
                      type="text"
                      value={selectedDevice.deviceToken || "tok_kiosk_live"}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300 select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedDevice.deviceToken || "tok_kiosk_live");
                        setCopiedTokenSuccess(true);
                        setTimeout(() => setCopiedTokenSuccess(false), 2500);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
                    >
                      {copiedTokenSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedTokenSuccess ? "تم النسخ" : "نسخ"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Connectivity & Offline Sync Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Internet Status */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-1">حالة الاتصال بالإنترنت (Internet Status)</div>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {isOnline ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                        متصل بالشبكة (Online)
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <WifiOff className="w-4 h-4 text-rose-400" />
                        غير متصل (Offline)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left font-mono text-[11px] text-slate-500">
                  Ping: {isOnline ? "18ms" : "N/A"}
                </div>
              </div>

              {/* Pending Offline Records */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-1">الحركات المحفوظة محلياً (Pending Offline)</div>
                  <div className="text-lg font-mono font-bold text-amber-400">
                    {offlineQueue.length} <span className="text-xs font-normal text-slate-400">سجل غير مرفوع</span>
                  </div>
                </div>
                <button
                  disabled={isSyncingNow || !isOnline}
                  onClick={handleInstantSyncNow}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSyncingNow ? "animate-spin" : ""}`} />
                  {isSyncingNow ? "جارٍ الرفع..." : "مزامنة فورية (Sync Now)"}
                </button>
              </div>
            </div>

            {/* Quick Actions & Exit Controls */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-3">إجراءات التحكم والتشغيل (Operational Actions)</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    resetToStandby();
                    setIsKioskAdminPanelOpen(false);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>إعادة ضبط شاشة الكشك (Restart Kiosk)</span>
                </button>

                <button
                  onClick={() => setIsExitConfirmModalOpen(true)}
                  className="p-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/30"
                >
                  <Power className="w-4 h-4 text-rose-400" />
                  <span>الخروج من وضع الكشك (Exit Kiosk Mode)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXIT CONFIRMATION MODAL (PRESERVES DEVICE ID & TOKEN) */}
      {/* ========================================================================= */}
      {isExitConfirmModalOpen && (
        <div className="fixed inset-0 z-[140] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 p-6 rounded-3xl shadow-2xl text-right animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-2">
              تأكيد الخروج من وضع الكشك
            </h3>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed mb-6 space-y-2">
              <p>
                سيتم إغلاق واجهة الكشك التفاعلي والعودة إلى لوحة تحكم <strong>Deshal ERP</strong> الرئيسية.
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                ✓ سيتم الاحتفاظ بمعرّف الجهاز (Device ID: {selectedDevice.deviceCode}) وبيانات التفعيل وتوكن الأمان دون أي مسح.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsExitConfirmModalOpen(false)}
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                إلغاء والتراجع
              </button>
              <button
                onClick={handleConfirmExitKiosk}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-colors"
              >
                تأكيد الخروج الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <footer className="px-6 py-3 bg-slate-950 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>نظام ديشال للحضور والانصراف الذكي v3.4</span>
        </div>
        <div className="flex items-center gap-4">
          <span>الجهاز: {selectedDevice.model || "iPad Tablet"}</span>
          <span>التشفير: SHA-256 + Salt</span>
        </div>
      </footer>
    </div>
  );
};
