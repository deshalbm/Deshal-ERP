import React, { useState } from "react";
import {
  Shield,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
  Laptop,
  Trash2,
  LogOut,
  Clock,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Key,
  Camera,
  Upload,
  User
} from "lucide-react";
import {
  AuthSession,
  UserAccount,
  ActiveSession
} from "../../types";
import {
  changeUserPassword,
  changeUserPin,
  toggleUserTwoFactor,
  loadActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  loadUserAccounts,
  updateUserAvatar
} from "../../utils/authManager";
import { uploadImageToStorage } from "../../lib/supabase/storageService";
import { upsertEmployee } from "../../lib/supabase/employeeService";
import { useLanguage } from "../../utils/LanguageContext";

interface SecuritySettingsModalProps {
  session: AuthSession;
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: (updatedSession: AuthSession) => void;
  onAuditLog?: (action: any, module: any, entityId: string, entityName: string, descAr: string, descEn: string, details?: string) => void;
}

type SecurityTab = "password" | "two_factor" | "pin" | "sessions" | "avatar";

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  session,
  isOpen,
  onClose,
  onSessionUpdated,
  onAuditLog
}) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SecurityTab>("password");

  // Change Password Form States
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordSuccess, setPasswordSuccess] = useState<string>("");
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  // Quick PIN States
  const [newPin, setNewPin] = useState<string>(session.user.pinCode || "1234");
  const [pinSuccess, setPinSuccess] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(session.user.twoFactorEnabled || false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>(session.user.twoFactorSecret || "JBSWY3DPEHPK3PXP");
  const [twoFactorCodeTest, setTwoFactorCodeTest] = useState<string>("");
  const [twoFactorMessage, setTwoFactorMessage] = useState<string>("");
  const [twoFactorError, setTwoFactorError] = useState<string>("");
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  // Active Sessions
  const [sessionsList, setSessionsList] = useState<ActiveSession[]>(() => loadActiveSessions());
  const [sessionActionMessage, setSessionActionMessage] = useState<string>("");

  // Profile Picture (Avatar) States
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>(
    session.user.avatarUrl || session.employee?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [avatarSuccess, setAvatarSuccess] = useState<string>("");
  const [avatarError, setAvatarError] = useState<string>("");

  const presetAvatars = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  ];

  const handleSelectAvatarUrl = async (url: string) => {
    setAvatarError("");
    setAvatarSuccess("");
    setIsUploadingAvatar(true);

    try {
      let finalUrl = url;
      if (url.startsWith("data:")) {
        const filePath = `avatars/user_${session.user.id}_${Date.now()}.png`;
        const res = await uploadImageToStorage("company_assets", filePath, url);
        if (res.publicUrl) {
          finalUrl = res.publicUrl;
        }
      }

      setCurrentAvatarUrl(finalUrl);
      updateUserAvatar(session.user.id, finalUrl);

      if (session.employee) {
        const updatedEmp = { ...session.employee, avatarUrl: finalUrl };
        await upsertEmployee(updatedEmp, session.employee.branchId || "company-1");
      }

      const updatedUser = { ...session.user, avatarUrl: finalUrl };
      const updatedEmp = session.employee ? { ...session.employee, avatarUrl: finalUrl } : session.employee;
      onSessionUpdated({ ...session, user: updatedUser, employee: updatedEmp });

      setAvatarSuccess(
        language === "ar"
          ? "تم تحديث الصورة الشخصية بنجاح وحفظها في قاعدة البيانات والمخزن السحابي"
          : "Profile picture updated successfully and synced to Storage & DB"
      );

      if (onAuditLog) {
        onAuditLog(
          "UPDATE",
          "PROFILE",
          session.user.id,
          session.user.fullName,
          `تحديث الصورة الشخصية للمستخدم ${session.user.fullName}`,
          `Profile photo updated for user ${session.user.fullName}`
        );
      }
    } catch (err: any) {
      console.error("Avatar update error:", err);
      setAvatarError(err?.message || "فشل تحديث الصورة الشخصية");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(language === "ar" ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت" : "Photo size must not exceed 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        handleSelectAvatarUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Password Strength Calculation
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const strengthScore = calculateStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    if (score <= 25) return { label: language === "ar" ? "ضعيفة" : "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score <= 50) return { label: language === "ar" ? "متوسطة" : "Medium", color: "bg-amber-500", text: "text-amber-500" };
    if (score <= 75) return { label: language === "ar" ? "جيدة" : "Good", color: "bg-blue-500", text: "text-blue-500" };
    return { label: language === "ar" ? "قوية جداً" : "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف");
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      const res = changeUserPassword(session.user.id, currentPassword, newPassword);

      if (!res.success) {
        setPasswordError(res.error || "فشل تغيير كلمة المرور");
        return;
      }

      setPasswordSuccess(t("passwordChangedSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update session user in memory
      const updatedUser = { ...session.user, passwordHash: newPassword, lastPasswordChangeAt: new Date().toISOString() };
      onSessionUpdated({ ...session, user: updatedUser });

      if (onAuditLog) {
        onAuditLog(
          "PASSWORD_CHANGE",
          "SECURITY",
          session.user.id,
          session.user.fullName,
          `تغيير وتحديث كلمة المرور للمستخدم ${session.user.fullName}`,
          `Password changed successfully by user ${session.user.fullName}`
        );
      }
    }, 450);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess("");

    if (newPin.length < 4) {
      setPinError("رمز PIN يجب ألا يقل عن 4 أرقام");
      return;
    }

    const res = changeUserPin(session.user.id, newPin);
    if (!res.success) {
      setPinError(res.error || "فشل تحديث رمز PIN");
      return;
    }

    setPinSuccess("تم تحديث رمز PIN السريع بنجاح");
    const updatedUser = { ...session.user, pinCode: newPin };
    onSessionUpdated({ ...session, user: updatedUser });

    if (onAuditLog) {
      onAuditLog(
        "UPDATE",
        "SECURITY",
        session.user.id,
        session.user.fullName,
        `تحديث رمز PIN السريع للمستخدم ${session.user.fullName}`,
        `Quick PIN updated for user ${session.user.fullName}`
      );
    }
  };

  const handleToggle2FA = (enable: boolean) => {
    setTwoFactorError("");
    setTwoFactorMessage("");

    const res = toggleUserTwoFactor(session.user.id, enable);
    if (res.success && res.user) {
      setIs2FAEnabled(enable);
      setTwoFactorSecret(res.user.twoFactorSecret || "JBSWY3DPEHPK3PXP");
      setTwoFactorMessage(enable ? "تم تفعيل المصادقة الثنائية بنجاح" : "تم تعطيل المصادقة الثنائية");

      const updatedUser = {
        ...session.user,
        twoFactorEnabled: enable,
        twoFactorSecret: res.user.twoFactorSecret,
        twoFactorBackupCodes: res.user.twoFactorBackupCodes
      };
      onSessionUpdated({ ...session, user: updatedUser });

      if (onAuditLog) {
        onAuditLog(
          "2FA_VERIFY",
          "SECURITY",
          session.user.id,
          session.user.fullName,
          `${enable ? "تفعيل" : "تعطيل"} المصادقة الثنائية 2FA للمستخدم ${session.user.fullName}`,
          `2FA ${enable ? "enabled" : "disabled"} for user ${session.user.fullName}`
        );
      }
    }
  };

  const handleRevokeSingleSession = (sessId: string) => {
    const updated = revokeSession(sessId);
    setSessionsList(updated);
    setSessionActionMessage("تم إنهاء الجلسة بنجاح");
    setTimeout(() => setSessionActionMessage(""), 3000);
  };

  const handleRevokeAllOthers = () => {
    const updated = revokeAllOtherSessions();
    setSessionsList(updated);
    setSessionActionMessage("تم تسجيل الخروج من كافة الأجهزة الأخرى بنجاح");
    setTimeout(() => setSessionActionMessage(""), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t("securitySettings")}</h2>
              <p className="text-xs text-slate-400">{session.user.fullName} ({session.user.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800 bg-slate-900 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("avatar")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "avatar"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "الصورة الشخصية" : "Profile Photo"}</span>
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "password"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t("changePassword")}</span>
          </button>

          <button
            onClick={() => setActiveTab("two_factor")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "two_factor"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t("twoFactorAuth")}</span>
          </button>

          <button
            onClick={() => setActiveTab("pin")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "pin"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{t("pinCode")}</span>
          </button>

          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "sessions"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>{t("activeSessions")} ({sessionsList.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* TAB 0: PROFILE PICTURE (AVATAR) */}
          {/* ========================================================================= */}
          {activeTab === "avatar" && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                {language === "ar"
                  ? "يمكنك رفع صورة شخصية حديثة من جهازك أو الاختيار من الرموز المعتمدة. يتم حفظ وتحديث الصورة تلقائياً في قاعدة البيانات والمخزن السحابي."
                  : "Upload a profile photo or select a preset avatar. Changes are instantly saved to Supabase Storage & DB."}
              </div>

              {avatarError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}

              {avatarSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{avatarSuccess}</span>
                </div>
              )}

              {/* Current Avatar Display & File Upload */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4">
                <div className="relative group">
                  <img
                    src={currentAvatarUrl}
                    alt={session.user.fullName}
                    className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500/40 shadow-xl"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-full flex items-center justify-center text-white">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-white">{session.user.fullName}</h4>
                  <p className="text-xs text-slate-400">{session.user.email}</p>
                </div>

                {/* Upload Button */}
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 rtl:space-x-reverse cursor-pointer shadow-lg shadow-indigo-600/30 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{language === "ar" ? "رفع صورة شخصية جديدة" : "Upload New Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preset Avatars Selection */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-300">
                  {language === "ar" ? "أو اختر من الصور والرمز المتاحة:" : "Or select from preset avatars:"}
                </h5>
                <div className="grid grid-cols-6 gap-3">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAvatarUrl(url)}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        currentAvatarUrl === url ? "border-indigo-500 scale-105 shadow-md" : "border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-14 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: CHANGE PASSWORD */}
          {/* ========================================================================= */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
                {language === "ar"
                  ? "لضمان أمان حسابك، استخدم كلمة مرور قوية تحتوي على أرقام وحروف كبيرة وصغيرة."
                  : "To keep your account secure, use a strong password with mixed casing, digits and special characters."}
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t("currentPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t("newPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{language === "ar" ? "قوة كلمة المرور:" : "Password Strength:"}</span>
                      <span className={`font-bold ${getStrengthLabel(strengthScore).text}`}>
                        {getStrengthLabel(strengthScore).label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthLabel(strengthScore).color}`}
                        style={{ width: `${strengthScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t("confirmNewPassword")}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t("changePassword")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TWO-FACTOR AUTHENTICATION (2FA) */}
          {/* ========================================================================= */}
          {activeTab === "two_factor" && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    is2FAEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t("twoFactorAuth")}</h4>
                    <p className="text-[11px] text-slate-400">
                      {is2FAEnabled ? t("twoFactorEnabled") : t("twoFactorDisabled")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle2FA(!is2FAEnabled)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    is2FAEnabled
                      ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                  }`}
                >
                  {is2FAEnabled ? t("disable2FA") : t("enable2FA")}
                </button>
              </div>

              {twoFactorMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{twoFactorMessage}</span>
                </div>
              )}

              {is2FAEnabled && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shadow shrink-0">
                      {/* Stylized QR Code Visual */}
                      <QrCode className="w-full h-full text-slate-900" />
                    </div>
                    <div className="space-y-2 text-center sm:text-start rtl:sm:text-right">
                      <h5 className="text-xs font-bold text-white">
                        {language === "ar" ? "امسح الباركود بتطبيق المصادقة" : "Scan QR in Authenticator App"}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {language === "ar"
                          ? "استخدم تطبيق Google Authenticator أو Microsoft Authenticator للحصول على رموز التحقق المتجددة."
                          : "Use Google Authenticator or Microsoft Authenticator to generate periodic 6-digit TOTP codes."}
                      </p>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="font-mono text-xs text-indigo-300 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                          {twoFactorSecret}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined") {
                              navigator.clipboard.writeText(twoFactorSecret);
                              setCopiedSecret(true);
                              setTimeout(() => setCopiedSecret(false), 2000);
                            }
                          }}
                          className="text-slate-400 hover:text-white p-1 cursor-pointer"
                        >
                          {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Backup Codes */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">{t("backupCodes")}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const codes = (session.user.twoFactorBackupCodes || ["9382-1029", "4820-9182", "5510-3849"]).join("\n");
                          navigator.clipboard.writeText(codes);
                          setCopiedBackup(true);
                          setTimeout(() => setCopiedBackup(false), 2000);
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBackup ? t("copied") : t("copy")}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(session.user.twoFactorBackupCodes || ["9382-1029", "4820-9182", "5510-3849", "2910-4820"]).map((code, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-center font-mono text-xs text-slate-300">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: QUICK PIN CODE */}
          {/* ========================================================================= */}
          {activeTab === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-4 max-w-md mx-auto">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                {language === "ar"
                  ? "رمز PIN يتيح لك فك قفل شاشة النظام بسرعة دون الحاجة لكتابة كلمة المرور الكاملة في كل مرة."
                  : "Your quick PIN allows instant unlock when returning to a locked screen without typing full credentials."}
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t("pinCode")}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    className="w-full text-center font-mono text-2xl tracking-widest bg-slate-950 border border-slate-700 text-white rounded-xl py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  {language === "ar" ? "يتكون من 4 إلى 6 أرقام سرية" : "Must be 4 to 6 numeric digits"}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{t("update")}</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ACTIVE SESSIONS & DEVICES */}
          {/* ========================================================================= */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{t("activeSessions")}</h4>
                  <p className="text-[11px] text-slate-400">
                    {language === "ar" ? "الأجهزة والمتصفحات المسجل دخولها حالياً بحسابك:" : "Devices currently signed in with your account:"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRevokeAllOthers}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("revokeAllOtherSessions")}</span>
                </button>
              </div>

              {sessionActionMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{sessionActionMessage}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {sessionsList.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      sess.isCurrent
                        ? "bg-indigo-600/15 border-indigo-500/40"
                        : "bg-slate-950/60 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        sess.deviceType === "Mobile" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {sess.deviceType === "Mobile" ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="text-xs font-bold text-white">{sess.browser}</span>
                          {sess.isCurrent && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {language === "ar" ? "هذا الجهاز" : "Current Device"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{sess.ipAddress}</span>
                          <span>•</span>
                          <span className="text-slate-500">{sess.lastActive}</span>
                        </p>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSingleSession(sess.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 p-2 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title={t("revokeSession")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            {t("close")}
          </button>
        </div>

      </div>
    </div>
  );
};
