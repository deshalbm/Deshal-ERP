import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  Copy,
  Check,
  Building2,
  Users,
  Key,
  Laptop,
  HelpCircle,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Receipt
} from "lucide-react";
import {
  AuthSession,
  UserAccount,
  Employee,
  CompanySettings
} from "../../types";
import {
  loadUserAccounts,
  authenticateUser,
  createMagicLink,
  verifyMagicLink,
  requestPasswordReset,
  completePasswordReset,
  verify2FACode,
  saveAuthSession,
  DEFAULT_USER_ACCOUNTS
} from "../../utils/authManager";
import { loadEmployees, DEFAULT_COMPANY_SETTINGS } from "../../utils/storage";
import { useLanguage } from "../../utils/LanguageContext";
import { signInWithEmail } from "../../lib/supabase/authService";
import { isSupabaseConfigured } from "../../lib/supabase/client";

interface LoginPageProps {
  companySettings?: CompanySettings;
  onLoginSuccess: (session: AuthSession) => void;
  onAuditLog?: (action: any, module: any, entityId: string, entityName: string, descAr: string, descEn: string, details?: string) => void;
}

type LoginTab = "password" | "magic_link" | "quick_staff";

export const LoginPage: React.FC<LoginPageProps> = ({
  companySettings = DEFAULT_COMPANY_SETTINGS,
  onLoginSuccess,
  onAuditLog
}) => {
  const { language, setLanguage, isRTL, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<LoginTab>("password");

  // Form States
  const [email, setEmail] = useState<string>("said@digititech.com");
  const [password, setPassword] = useState<string>("Admin@2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Quick Staff Selection
  const [usersList, setUsersList] = useState<UserAccount[]>(() => loadUserAccounts());
  const [employeesList, setEmployeesList] = useState<Employee[]>(() => loadEmployees());
  const [selectedStaffUser, setSelectedStaffUser] = useState<UserAccount | null>(null);
  const [staffPinInput, setStaffPinInput] = useState<string>("");

  // Magic Link States
  const [magicLinkEmail, setMagicLinkEmail] = useState<string>("said@digititech.com");
  const [generatedMagicLink, setGeneratedMagicLink] = useState<{ token: string; linkUrl: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Forgot Password / Reset States
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState<string>("said@digititech.com");
  const [resetOtpCode, setResetOtpCode] = useState<string>("");
  const [generatedOtpDisplay, setGeneratedOtpDisplay] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>("");
  const [resetSuccess, setResetSuccess] = useState<string>("");

  // 2FA Challenge States
  const [twoFactorChallengeUser, setTwoFactorChallengeUser] = useState<UserAccount | null>(null);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState<string>("");
  const [twoFactorError, setTwoFactorError] = useState<string>("");

  // Demo Helpers Drawer
  const [showDemoDrawer, setShowDemoDrawer] = useState<boolean>(true);

  // Check URL parameters for Magic Link on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const magicToken = params.get("magic_token");
      if (magicToken) {
        handleConsumeMagicLink(magicToken);
      }
    }
  }, []);

  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (isSupabaseConfigured) {
      const supaRes = await signInWithEmail(email, password);
      if (supaRes.success && supaRes.user) {
        setIsLoading(false);
        const emp: Employee = {
          id: supaRes.user.id,
          name: supaRes.user.fullName,
          jobTitle: supaRes.user.role,
          department: "Management",
          email: supaRes.user.email,
          phone: "",
          nationalId: "",
          hireDate: new Date().toISOString(),
          basicSalary: 0,
          allowances: 0,
          deductions: 0,
          netSalary: 0,
          status: "ACTIVE",
          branchId: supaRes.user.branchId || "branch-sohar",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const uAcc: UserAccount = {
          id: supaRes.user.id,
          employeeId: supaRes.user.id,
          email: supaRes.user.email,
          fullName: supaRes.user.fullName,
          fullNameEn: supaRes.user.fullNameEn,
          role: supaRes.user.role as any,
          passwordHash: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const session: AuthSession = {
          user: uAcc,
          employee: emp,
          token: supaRes.session?.access_token || `tok_supa_${Date.now()}`,
          loginMethod: "PASSWORD",
          authenticatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isLocked: false,
          activeBranchId: supaRes.user.branchId || "branch-sohar"
        };
        saveAuthSession(session);
        setSuccessMessage(t("loginSuccess"));
        onLoginSuccess(session);
        return;
      }
    }

    setTimeout(() => {
      const res = authenticateUser(email, password, false);
      setIsLoading(false);

      if (res.require2FA && res.user) {
        setTwoFactorChallengeUser(res.user);
        return;
      }

      if (!res.success || !res.session) {
        setErrorMessage(res.error || t("invalidCredentials"));
        if (onAuditLog) {
          onAuditLog(
            "LOGIN",
            "SECURITY",
            "failed-attempt",
            email,
            `محاولة تسجيل دخول فاشلة بالبريد (${email})`,
            `Failed password login attempt for (${email})`
          );
        }
        return;
      }

      setSuccessMessage(t("loginSuccess"));
      if (onAuditLog) {
        onAuditLog(
          "LOGIN",
          "SECURITY",
          res.session.user.id,
          res.session.user.fullName,
          `تسجيل دخول ناجح للمستخدم ${res.session.user.fullName} (${res.session.user.role}) عبر كلمة المرور`,
          `User ${res.session.user.fullName} (${res.session.user.role}) signed in successfully with password`
        );
      }

      onLoginSuccess(res.session);
    }, 450);
  };

  const handleSendMagicLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = createMagicLink(magicLinkEmail);
      if ("error" in res) {
        setErrorMessage(res.error);
        return;
      }

      setGeneratedMagicLink({
        token: res.magicLink.token,
        linkUrl: res.linkUrl
      });
      setSuccessMessage(t("magicLinkSent"));

      if (onAuditLog) {
        onAuditLog(
          "MAGIC_LINK_LOGIN",
          "SECURITY",
          res.magicLink.userId,
          magicLinkEmail,
          `توليد رابط تسجيل دخول سحري للحساب (${magicLinkEmail})`,
          `Generated one-click magic login link for (${magicLinkEmail})`
        );
      }
    }, 500);
  };

  const handleConsumeMagicLink = (token: string) => {
    setIsLoading(true);
    setErrorMessage("");

    setTimeout(() => {
      setIsLoading(false);
      const res = verifyMagicLink(token);
      if ("error" in res) {
        setErrorMessage(res.error);
        return;
      }

      const session: AuthSession = {
        user: res.user,
        employee: res.employee,
        token: `tok_ml_${Math.random().toString(36).substring(2)}_${Date.now()}`,
        loginMethod: "MAGIC_LINK",
        authenticatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isLocked: false,
        activeBranchId: res.employee.branchId || "branch-sohar"
      };

      saveAuthSession(session);
      setSuccessMessage("تم تسجيل الدخول بنجاح عبر الرابط السحري!");

      if (onAuditLog) {
        onAuditLog(
          "MAGIC_LINK_LOGIN",
          "SECURITY",
          res.user.id,
          res.user.fullName,
          `تسجيل دخول فوري للمستخدم ${res.user.fullName} باستخدام الرابط السحري المشفر`,
          `User ${res.user.fullName} authenticated via cryptographic magic link`
        );
      }

      onLoginSuccess(session);
    }, 400);
  };

  const handleStaffPinLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStaffUser) return;
    setErrorMessage("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = authenticateUser(selectedStaffUser.email, staffPinInput, true);

      if (!res.success || !res.session) {
        setErrorMessage(res.error || "رمز PIN غير صحيح");
        return;
      }

      if (onAuditLog) {
        onAuditLog(
          "LOGIN",
          "SECURITY",
          res.session.user.id,
          res.session.user.fullName,
          `تسجيل دخول سريع برمز PIN للموظف ${res.session.user.fullName}`,
          `Quick PIN sign-in for employee ${res.session.user.fullName}`
        );
      }

      onLoginSuccess(res.session);
    }, 350);
  };

  const handleVerify2FA = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!twoFactorChallengeUser) return;
    setTwoFactorError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = verify2FACode(twoFactorChallengeUser.id, twoFactorCodeInput.trim());

      if (!res.success || !res.session) {
        setTwoFactorError(res.error || "رمز التحقق الثنائي غير صحيح");
        return;
      }

      if (onAuditLog) {
        onAuditLog(
          "2FA_VERIFY",
          "SECURITY",
          res.session.user.id,
          res.session.user.fullName,
          `اجتياز التحقق الثنائي 2FA للمستخدم ${res.session.user.fullName}`,
          `2FA challenge passed for ${res.session.user.fullName}`
        );
      }

      setTwoFactorChallengeUser(null);
      onLoginSuccess(res.session);
    }, 400);
  };

  // Password Reset Steps
  const handleRequestResetCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = requestPasswordReset(resetEmail);
      if ("error" in res) {
        setResetError(res.error);
        return;
      }

      setGeneratedOtpDisplay(res.resetRecord.code);
      setResetStep(2);
      setResetSuccess(`تم إرسال رمز التحقق OTP إلى البريد ${resetEmail}`);
    }, 450);
  };

  const handleCompleteReset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError("");
    if (newPassword !== confirmNewPassword) {
      setResetError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("كلمة المرور يجب ألا تقل عن 6 خانات");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = completePasswordReset(resetEmail, resetOtpCode.trim(), newPassword);
      if (!res.success || !res.user) {
        setResetError(res.error || "فشل إعادة ضبط كلمة المرور");
        return;
      }

      setResetSuccess("تم تعيين كلمة المرور الجديدة بنجاح! يمكنك الآن تسجيل الدخول.");
      setUsersList(loadUserAccounts());

      if (onAuditLog) {
        onAuditLog(
          "PASSWORD_CHANGE",
          "SECURITY",
          res.user.id,
          res.user.fullName,
          `استعادة وإعادة ضبط كلمة المرور بنجاح للمستخدم ${res.user.fullName} عبر رمز التحقق`,
          `Password reset completed successfully for user ${res.user.fullName} via OTP`
        );
      }

      setTimeout(() => {
        setShowResetModal(false);
        setResetStep(1);
        setEmail(resetEmail);
        setPassword(newPassword);
        setActiveTab("password");
      }, 1500);
    }, 500);
  };

  const fillQuickCredentials = (u: UserAccount) => {
    setEmail(u.email);
    setPassword(u.passwordHash);
    setMagicLinkEmail(u.email);
    setResetEmail(u.email);
    setSelectedStaffUser(u);
    setStaffPinInput(u.pinCode || "1234");
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 flex items-center justify-center text-white font-black border border-indigo-400/30">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="font-bold text-lg text-white tracking-tight">
                {companySettings?.companyName || (language === "ar" ? "ديشال لإدارة الأعمال (ديشال ERP)" : "Deshal Business Management ERP")}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                v2.5 SECURE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {companySettings?.tagline || (language === "ar" ? "نظام إدارة السندات والفواتير والحسابات المعتمد" : "Unified Enterprise Financial & Billing Platform")}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 backdrop-blur-md">
            <button
              onClick={() => setLanguage("ar")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === "ar"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === "en"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left / Info Showcase Column */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{language === "ar" ? "بوابة تسجيل الدخول الآمنة للمؤسسة" : "Official Enterprise Secure Access"}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {language === "ar" ? (
                <>إدارة متكاملة للسندات، <br /><span className="text-indigo-400">المخازن والمحاسبة الذكية</span></>
              ) : (
                <>Next-Gen Vouchers, <br /><span className="text-indigo-400">Inventory & Smart ERP</span></>
              )}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {language === "ar"
                ? "تسجيل دخول مشفر ومحمي بصلاحيات الأدوار (RBAC)، دعم المصادقة الثنائية 2FA، والدخول السريع عبر الرابط السحري الفوري دون كلمة مرور."
                : "Role-based access control, cryptographic magic link sign-in, Two-Factor Authentication, and comprehensive activity audit logs."}
            </p>
          </div>

          {/* Feature Highlights Bento */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                {language === "ar" ? "الرابط السحري" : "Magic Link"}
              </h4>
              <p className="text-[11px] text-slate-400">
                {language === "ar" ? "دخول فوري بنقرة واحدة بدون كلمة سر" : "Passwordless 1-click token login"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                {language === "ar" ? "أمان ورقابة تامة" : "Account Security"}
              </h4>
              <p className="text-[11px] text-slate-400">
                {language === "ar" ? "حماية من المحاولات الخاطئة وسجل كامل" : "Anti-lockout & Audit logs"}
              </p>
            </div>
          </div>

          {/* Quick Switch Employee helper cards */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === "ar" ? "حسابات تجريبية سريعة المفعول:" : "Quick Demo Accounts:"}</span>
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">{language === "ar" ? "انقر للتعيين" : "Click to load"}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {usersList.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillQuickCredentials(u)}
                  className={`flex items-center space-x-2 rtl:space-x-reverse px-2.5 py-1.5 rounded-xl border text-left rtl:text-right transition-all cursor-pointer shrink-0 ${
                    email === u.email
                      ? "bg-indigo-600/30 border-indigo-500 text-white shadow-sm"
                      : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <img
                    src={u.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                    alt={u.fullName}
                    className="w-6 h-6 rounded-full object-cover border border-slate-600"
                  />
                  <div className="text-[11px] leading-tight">
                    <p className="font-bold truncate max-w-[90px]">{language === "ar" ? u.fullName.split(" ")[0] : u.fullNameEn?.split(" ")[0] || u.fullName.split(" ")[0]}</p>
                    <p className="text-[9px] text-indigo-300">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right / Login Card Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            
            {/* Top Navigation Tabs */}
            <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-6 gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab("password"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`flex-1 flex items-center justify-center space-x-1.5 rtl:space-x-reverse py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "password"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t("passwordLogin")}</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("magic_link"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`flex-1 flex items-center justify-center space-x-1.5 rtl:space-x-reverse py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "magic_link"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{t("magicLinkLogin")}</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("quick_staff"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`flex-1 flex items-center justify-center space-x-1.5 rtl:space-x-reverse py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "quick_staff"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-300" />
                <span>{t("staffQuickLogin")}</span>
              </button>
            </div>

            {/* Error / Success Feedback Banners */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 rtl:space-x-reverse animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2.5 rtl:space-x-reverse animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: PASSWORD LOGIN */}
            {/* ========================================================================= */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t("emailOrUsername")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="said@digititech.com"
                      className="w-full bg-slate-950/60 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white text-sm rounded-xl ps-10 pe-4 py-2.5 outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      {t("password")}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(true);
                        setResetStep(1);
                        setResetEmail(email);
                        setResetError("");
                        setResetSuccess("");
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer font-medium"
                    >
                      {t("forgotPassword")}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/60 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white text-sm rounded-xl ps-10 pe-10 py-2.5 outline-none transition-all placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
                    />
                    <span>{t("rememberMe")}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {language === "ar" ? "قفل تلقائي بعد 5 محاولات" : "Auto-lock after 5 attempts"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t("login")}</span>
                      {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: MAGIC LINK LOGIN */}
            {/* ========================================================================= */}
            {activeTab === "magic_link" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{language === "ar" ? "ما هو الرابط السحري؟" : "What is Magic Link?"}</span>
                  </p>
                  <p className="text-slate-300">
                    {t("magicLinkInstruction")}
                  </p>
                </div>

                <form onSubmit={handleSendMagicLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {language === "ar" ? "أدخل البريد الإلكتروني للموظف" : "Enter Work Email"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        placeholder="said@digititech.com"
                        className="w-full bg-slate-950/60 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white text-sm rounded-xl ps-10 pe-4 py-2.5 outline-none transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>{t("sendMagicLink")}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Generated Magic Link Action Simulator */}
                {generatedMagicLink && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{t("magicLinkSent")}</span>
                      </span>
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {language === "ar" ? "صالح لمدة 15 دقيقة" : "Expires in 15 mins"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {language === "ar"
                        ? "تم توليد رابط تسجيل الدخول المباشر لحسابك؛ يمكنك النقر على الزر الفوري التالي للدخول:"
                        : "Your cryptographic token link has been created. Click below to sign in instantly:"}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleConsumeMagicLink(generatedMagicLink.token)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t("openMagicLink")}</span>
                    </button>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="text"
                        readOnly
                        value={generatedMagicLink.linkUrl}
                        className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 rounded-lg px-2.5 py-1.5 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined") {
                            navigator.clipboard.writeText(generatedMagicLink.linkUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs shrink-0 flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? t("copied") : t("copy")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: QUICK STAFF LOGIN */}
            {/* ========================================================================= */}
            {activeTab === "quick_staff" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  {language === "ar"
                    ? "اختر حساب الموظف للتبديل السريع وإدخال رمز PIN المعتمد:"
                    : "Select a team member profile and enter their 4-digit PIN:"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {usersList.map((u) => {
                    const isSelected = selectedStaffUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffUser(u);
                          setStaffPinInput(u.pinCode || "1234");
                          setErrorMessage("");
                        }}
                        className={`p-3 rounded-2xl border text-left rtl:text-right flex items-center space-x-3 rtl:space-x-reverse transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/25 border-indigo-500 shadow-md"
                            : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <img
                          src={u.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                          alt={u.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {language === "ar" ? u.fullName : u.fullNameEn || u.fullName}
                          </p>
                          <div className="flex items-center space-x-1.5 rtl:space-x-reverse mt-0.5">
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300">
                              {u.role}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">PIN: {u.pinCode || "1234"}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedStaffUser && (
                  <form onSubmit={handleStaffPinLogin} className="pt-2 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        {t("pinCode")} ({selectedStaffUser.fullName})
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          maxLength={6}
                          value={staffPinInput}
                          onChange={(e) => setStaffPinInput(e.target.value)}
                          placeholder="••••"
                          className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white text-sm font-mono tracking-widest rounded-xl ps-10 pe-4 py-2.5 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>{language === "ar" ? "تأكيد الدخول برمز PIN" : "Sign In with PIN"}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Bottom Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t("sessionExpiryNotice")}</span>
              </span>
              <span className="font-mono">TLS 1.3 / AES-256</span>
            </div>

          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* 2-FACTOR AUTHENTICATION CHALLENGE MODAL */}
      {/* ========================================================================= */}
      {twoFactorChallengeUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t("twoFactorAuth")}</h3>
                <p className="text-xs text-slate-400">{twoFactorChallengeUser.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t("enter2FACode")}
            </p>

            {twoFactorError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{twoFactorError}</span>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={9}
                  value={twoFactorCodeInput}
                  onChange={(e) => setTwoFactorCodeInput(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center font-mono text-2xl tracking-widest bg-slate-950 border border-indigo-500/50 rounded-xl py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 text-center">
                  {language === "ar" ? "أو أدخل أحد رموز الاسترداد الاحتياطية (e.g. 9382-1029)" : "Or enter one of your backup recovery codes"}
                </p>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setTwoFactorChallengeUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : t("confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FORGOT & RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t("resetPassword")}</h3>
                  <span className="text-[10px] text-slate-400">
                    {language === "ar" ? `الخطوة ${resetStep} من 3` : `Step ${resetStep} of 3`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* STEP 1: Request Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <p className="text-xs text-slate-300">
                  {language === "ar"
                    ? "أدخل بريدك الإلكتروني المعتمد وسنقوم بإرسال رمز تحقق مؤقت (OTP) مكون من 6 أرقام لتغيير كلمة المرور."
                    : "Enter your work email and we will send a 6-digit verification code (OTP) to reset your password."}
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t("emailOrUsername")}
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : t("requestResetCode")}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 & 3: Enter OTP & New Password */}
            {resetStep >= 2 && (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                {/* OTP Display helper simulation */}
                {generatedOtpDisplay && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>{language === "ar" ? "رمز التحقق المرسل (للتجربة):" : "Simulated OTP Code:"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetOtpCode(generatedOtpDisplay)}
                      className="font-mono font-bold text-sm bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 cursor-pointer"
                    >
                      {generatedOtpDisplay}
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t("verificationCode")}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtpCode}
                    onChange={(e) => setResetOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center font-mono text-xl tracking-widest bg-slate-950 border border-slate-700 rounded-xl py-2 text-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t("newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t("confirmNewPassword")}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : t("save")}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Footer Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© 2026 {companySettings?.companyName || "Deshal Business ERP"}. All rights reserved.</p>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t("online")}</span>
          </span>
          <span>{companySettings?.phone || "+968 77438203"}</span>
        </div>
      </footer>

    </div>
  );
};
