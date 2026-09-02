import React, { useState } from "react";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  Key,
  RefreshCw
} from "lucide-react";
import { AuthSession } from "../../types";
import { authenticateUser } from "../../utils/authManager";
import { useLanguage } from "../../utils/LanguageContext";

interface LockScreenModalProps {
  session: AuthSession;
  onUnlock: () => void;
  onSwitchAccount: () => void;
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({
  session,
  onUnlock,
  onSwitchAccount
}) => {
  const { language, isRTL, t } = useLanguage();
  const [passOrPin, setPassOrPin] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Try both PIN and Password
      const res = authenticateUser(session.user.email, passOrPin, false);
      const resPin = authenticateUser(session.user.email, passOrPin, true);

      if (res.success || resPin.success) {
        onUnlock();
      } else {
        setErrorMessage(language === "ar" ? "رمز PIN أو كلمة المرور غير صحيحة" : "Incorrect PIN or Password");
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      
      {/* Background Accent Glow */}
      <div className="absolute w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95">
        
        {/* User Avatar with Locked Badge */}
        <div className="relative inline-block mx-auto">
          <img
            src={session.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
            alt={session.user.fullName}
            className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-xl mx-auto"
          />
          <div className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* User Identity */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {language === "ar" ? session.user.fullName : session.user.fullNameEn || session.user.fullName}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {session.user.role}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {session.user.email}
            </span>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
              <Key className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              autoFocus
              value={passOrPin}
              onChange={(e) => setPassOrPin(e.target.value)}
              placeholder={language === "ar" ? "أدخل رمز PIN أو كلمة المرور" : "Enter PIN or Password"}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 text-white text-center text-sm rounded-xl ps-10 pe-10 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{t("unlock")}</span>
                {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </form>

        {/* Bottom Switch Account Option */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onSwitchAccount}
            className="text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("switchAccount")}</span>
          </button>

          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Encrypted Session</span>
          </span>
        </div>

      </div>
    </div>
  );
};
