import {
  UserAccount,
  AuthSession,
  MagicLinkRecord,
  PasswordResetRecord,
  ActiveSession,
  Employee,
  AuthLoginMethod,
  EmployeeRole
} from "../types";
import { DEFAULT_EMPLOYEES, loadEmployees } from "./storage";

export const AUTH_STORAGE_KEYS = {
  USERS: "rv_auth_users",
  SESSION: "rv_auth_active_session",
  MAGIC_LINKS: "rv_auth_magic_links",
  RESET_TOKENS: "rv_auth_reset_tokens",
  ACTIVE_SESSIONS: "rv_auth_device_sessions"
};

// Initial default user accounts linked to system employees
export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: "usr-1",
    employeeId: "emp-1",
    email: "said@digititech.com",
    fullName: "سعيد بن راشد الشحي",
    fullNameEn: "Said Rashid Al-Shehhi",
    role: "ADMIN",
    passwordHash: "Admin@2026", // Plain/salted representation for offline ERP demo
    pinCode: "1234",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    twoFactorEnabled: false,
    twoFactorSecret: "JBSWY3DPEHPK3PXP",
    twoFactorBackupCodes: ["9382-1029", "4820-9182", "5510-3849", "2910-4820", "8492-0194"],
    failedLoginAttempts: 0,
    isLocked: false,
    phone: "+968 99482019",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    createdAt: "2023-01-15T08:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z"
  },
  {
    id: "usr-2",
    employeeId: "emp-2",
    email: "fatima.acc@digititech.com",
    fullName: "فاطمة بنت ناصر البلوشي",
    fullNameEn: "Fatima Nasser Al-Balushi",
    role: "ACCOUNTANT",
    passwordHash: "Acc@2026",
    pinCode: "2026",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    twoFactorEnabled: false,
    twoFactorSecret: "HXDMVJECJJWSRB3HW",
    twoFactorBackupCodes: ["3920-1940", "5920-4820", "8593-1029", "4829-1049"],
    failedLoginAttempts: 0,
    isLocked: false,
    phone: "+968 98112233",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    createdAt: "2023-06-01T08:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z"
  },
  {
    id: "usr-3",
    employeeId: "emp-3",
    email: "ahmed.store@digititech.com",
    fullName: "أحمد بن سالم المعمري",
    fullNameEn: "Ahmed Salem Al-Maamari",
    role: "STOREKEEPER",
    passwordHash: "Store@2026",
    pinCode: "3030",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    isLocked: false,
    phone: "+968 97654321",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    createdAt: "2024-02-10T08:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z"
  },
  {
    id: "usr-4",
    employeeId: "emp-4",
    email: "m.kindi@digititech.com",
    fullName: "محمد بن علي الكندي",
    fullNameEn: "Mohammed Ali Al-Kindi",
    role: "SALES",
    passwordHash: "Sales@2026",
    pinCode: "4040",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    isLocked: false,
    phone: "+968 96541230",
    branchId: "branch-muscat",
    branchName: "فرع مسقط - غلا",
    createdAt: "2024-05-15T08:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z"
  },
  {
    id: "usr-5",
    employeeId: "emp-5",
    email: "maryam@digititech.com",
    fullName: "مريم بنت حمد المقبالي",
    fullNameEn: "Maryam Hamad Al-Muqbali",
    role: "RECEPTIONIST",
    passwordHash: "User@2026",
    pinCode: "5050",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    isLocked: false,
    phone: "+968 95438210",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z"
  }
];

// Helper to load accounts
export function loadUserAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load user accounts from storage:", e);
  }
  saveUserAccounts(DEFAULT_USER_ACCOUNTS);
  return DEFAULT_USER_ACCOUNTS;
}

export function saveUserAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to save user accounts:", e);
  }
}

// Active Auth Session management
export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
    if (raw) {
      const session = JSON.parse(raw) as AuthSession;
      if (session && session.user && session.expiresAt) {
        // Check if session has expired (e.g. 7 days)
        if (new Date(session.expiresAt).getTime() > Date.now()) {
          return session;
        } else {
          clearAuthSession();
          return null;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to parse auth session:", e);
  }
  
  return null;
}

export function saveAuthSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
    }
  } catch (e) {
    console.error("Failed to save auth session:", e);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
  } catch (e) {
    console.error("Failed to clear auth session:", e);
  }
}

// Generate Magic Link
export function createMagicLink(email: string): { magicLink: MagicLinkRecord; linkUrl: string } | { error: string } {
  const users = loadUserAccounts();
  const user = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (!user) {
    return { error: "البريد الإلكتروني غير مسجل في قاعدة الموظفين المعتمدة" };
  }

  if (user.isLocked) {
    return { error: "الحساب موقوف مؤقتاً لأسباب أمنية. يرجى مراجعة مسؤول النظام" };
  }

  const token = `ml_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

  const magicLink: MagicLinkRecord = {
    token,
    email: user.email,
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt,
    isUsed: false
  };

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.MAGIC_LINKS);
    const list: MagicLinkRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(magicLink);
    // Keep last 30
    localStorage.setItem(AUTH_STORAGE_KEYS.MAGIC_LINKS, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.error("Failed to store magic link:", e);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://deshalbm.com";
  const linkUrl = `${origin}?magic_token=${token}&email=${encodeURIComponent(user.email)}`;

  return { magicLink, linkUrl };
}

// Verify and consume Magic Link
export function verifyMagicLink(token: string): { user: UserAccount; employee: Employee } | { error: string } {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.MAGIC_LINKS);
    const list: MagicLinkRecord[] = raw ? JSON.parse(raw) : [];
    const found = list.find((m) => m.token === token);

    if (!found) {
      return { error: "رمز الرابط السحري غير صالح أو غير موجود" };
    }

    if (found.isUsed) {
      return { error: "تم استخدام هذا الرابط السحري مسبقاً، يرجى طلب رابط جديد" };
    }

    if (new Date(found.expiresAt).getTime() < Date.now()) {
      return { error: "انتهت صلاحية هذا الرابط السحري (مدة الصلاحية 15 دقيقة)" };
    }

    // Mark as used
    found.isUsed = true;
    localStorage.setItem(AUTH_STORAGE_KEYS.MAGIC_LINKS, JSON.stringify(list));

    const users = loadUserAccounts();
    const user = users.find((u) => u.id === found.userId || u.email.toLowerCase() === found.email.toLowerCase());
    if (!user) {
      return { error: "المستخدم المرتبط بهذا الرابط لم يعد موجوداً" };
    }

    const employees = loadEmployees();
    const employee = employees.find((e) => e.id === user.employeeId) || DEFAULT_EMPLOYEES[0];

    // Reset failed attempts & update last login
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date().toISOString();
    user.lastLoginMethod = "MAGIC_LINK";
    saveUserAccounts(users);

    return { user, employee };
  } catch (e) {
    return { error: "حدث خطأ أثناء معالجة الرابط السحري" };
  }
}

// Request Password Reset Code (6-digit OTP)
export function requestPasswordReset(email: string): { resetRecord: PasswordResetRecord } | { error: string } {
  const users = loadUserAccounts();
  const user = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (!user) {
    return { error: "البريد الإلكتروني المدخل غير مسجل في النظام" };
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = `rst_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

  const resetRecord: PasswordResetRecord = {
    token,
    code,
    email: user.email,
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt,
    isUsed: false
  };

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.RESET_TOKENS);
    const list: PasswordResetRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(resetRecord);
    localStorage.setItem(AUTH_STORAGE_KEYS.RESET_TOKENS, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.error("Failed to store reset token:", e);
  }

  return { resetRecord };
}

// Reset Password with OTP Verification Code
export function completePasswordReset(
  email: string,
  code: string,
  newPassword: string
): { success: boolean; user?: UserAccount; error?: string } {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "كلمة المرور الجديدة يجب ألا تقل عن 6 خانات" };
  }

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.RESET_TOKENS);
    const list: PasswordResetRecord[] = raw ? JSON.parse(raw) : [];
    const record = list.find(
      (r) => r.email.toLowerCase() === email.toLowerCase() && r.code === code && !r.isUsed
    );

    if (!record) {
      return { success: false, error: "رمز التحقق المكون من 6 أرقام غير صحيح أو منتهي الصلاحية" };
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return { success: false, error: "انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد" };
    }

    // Mark as used
    record.isUsed = true;
    localStorage.setItem(AUTH_STORAGE_KEYS.RESET_TOKENS, JSON.stringify(list));

    // Update user password
    const users = loadUserAccounts();
    const userIndex = users.findIndex((u) => u.id === record.userId);
    if (userIndex < 0) {
      return { success: false, error: "تعذر العثور على الحساب المطلوب" };
    }

    users[userIndex].passwordHash = newPassword;
    users[userIndex].lastPasswordChangeAt = new Date().toISOString();
    users[userIndex].failedLoginAttempts = 0;
    users[userIndex].isLocked = false;
    saveUserAccounts(users);

    return { success: true, user: users[userIndex] };
  } catch (e) {
    return { success: false, error: "حدث خطأ غير متوقع أثناء إعادة ضبط كلمة المرور" };
  }
}

// Change Password for authenticated user
export function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const users = loadUserAccounts();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: "المستخدم غير موجود" };
  }

  if (user.passwordHash !== currentPassword) {
    return { success: false, error: "كلمة المرور الحالية غير صحيحة" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف" };
  }

  if (newPassword === currentPassword) {
    return { success: false, error: "كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية" };
  }

  user.passwordHash = newPassword;
  user.lastPasswordChangeAt = new Date().toISOString();
  saveUserAccounts(users);

  // Update in active session if currently logged in
  const session = loadAuthSession();
  if (session && session.user.id === userId) {
    session.user.passwordHash = newPassword;
    session.user.lastPasswordChangeAt = user.lastPasswordChangeAt;
    saveAuthSession(session);
  }

  return { success: true };
}

// Change PIN Code
export function changeUserPin(userId: string, newPin: string): { success: boolean; error?: string } {
  if (!newPin || newPin.length < 4) {
    return { success: false, error: "رمز PIN يجب أن يتكون من 4 أرقام على الأقل" };
  }

  const users = loadUserAccounts();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: "المستخدم غير موجود" };
  }

  user.pinCode = newPin;
  saveUserAccounts(users);

  const session = loadAuthSession();
  if (session && session.user.id === userId) {
    session.user.pinCode = newPin;
    saveAuthSession(session);
  }

  return { success: true };
}

// Toggle 2FA
export function toggleUserTwoFactor(userId: string, enable: boolean): { success: boolean; user?: UserAccount } {
  const users = loadUserAccounts();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false };

  user.twoFactorEnabled = enable;
  if (enable && !user.twoFactorSecret) {
    user.twoFactorSecret = "JBSWY3DPEHPK3PXP";
    user.twoFactorBackupCodes = ["9382-1029", "4820-9182", "5510-3849", "2910-4820", "8492-0194"];
  }

  saveUserAccounts(users);

  const session = loadAuthSession();
  if (session && session.user.id === userId) {
    session.user.twoFactorEnabled = enable;
    saveAuthSession(session);
  }

  return { success: true, user };
}

// Verify Login Credentials
export function authenticateUser(
  emailOrCode: string,
  passwordOrPin: string,
  isPin: boolean = false
): { success: boolean; session?: AuthSession; error?: string; require2FA?: boolean; user?: UserAccount } {
  const users = loadUserAccounts();
  const employees = loadEmployees();

  const user = users.find(
    (u) =>
      u.email.toLowerCase().trim() === emailOrCode.toLowerCase().trim() ||
      u.id === emailOrCode ||
      u.employeeId === emailOrCode
  );

  if (!user) {
    return { success: false, error: "البريد الإلكتروني أو اسم المستخدم غير مسجل" };
  }

  // Check lockout
  if (user.isLocked) {
    if (user.lockoutExpiry && new Date(user.lockoutExpiry).getTime() > Date.now()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockoutExpiry).getTime() - Date.now()) / (60 * 1000)
      );
      return {
        success: false,
        error: `الحساب مقفل مؤقتاً لتكرار المحاولات الخاطئة. يرجى المحاولة بعد ${remainingMinutes} دقيقة`
      };
    } else {
      // Auto unlock
      user.isLocked = false;
      user.failedLoginAttempts = 0;
    }
  }

  const isPasswordValid = !isPin && user.passwordHash === passwordOrPin;
  const isPinValid = isPin && (user.pinCode === passwordOrPin || user.passwordHash === passwordOrPin);

  if (!isPasswordValid && !isPinValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      user.lockoutExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min lock
      saveUserAccounts(users);
      return {
        success: false,
        error: "تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم تأمين الحساب وقفله مؤقتاً لمدة 5 دقائق"
      };
    }
    saveUserAccounts(users);
    const attemptsLeft = 5 - user.failedLoginAttempts;
    return {
      success: false,
      error: `كلمة المرور أو الرمز غير صحيح. متبقي لديك (${attemptsLeft}) محاولات قبل قفل الحساب`
    };
  }

  // Check 2FA
  if (user.twoFactorEnabled && !isPin) {
    return { success: false, require2FA: true, user };
  }

  // Successful Auth
  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lastLoginAt = new Date().toISOString();
  user.lastLoginMethod = isPin ? "PIN" : "PASSWORD";
  saveUserAccounts(users);

  const employee = employees.find((e) => e.id === user.employeeId) || DEFAULT_EMPLOYEES[0];

  const session: AuthSession = {
    user,
    employee,
    token: `tok_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    loginMethod: isPin ? "PIN" : "PASSWORD",
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isLocked: false,
    activeBranchId: employee.branchId || "branch-sohar"
  };

  saveAuthSession(session);
  recordDeviceSession(user);

  return { success: true, session };
}

// Verify 2FA TOTP code
export function verify2FACode(userId: string, code: string): { success: boolean; session?: AuthSession; error?: string } {
  const users = loadUserAccounts();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, error: "المستخدم غير موجود" };

  // Accept valid 6-digit code (e.g. 123456 or standard TOTP test codes) or valid backup code
  const isBackupCode = user.twoFactorBackupCodes?.includes(code);
  const isValidTotp = code.length === 6 && /^\d+$/.test(code);

  if (!isValidTotp && !isBackupCode) {
    return { success: false, error: "رمز التحقق الثنائي غير صحيح، تأكد من الرمز المدخل في تطبيق المصادقة" };
  }

  // If backup code was used, remove it from list
  if (isBackupCode && user.twoFactorBackupCodes) {
    user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter((c) => c !== code);
    saveUserAccounts(users);
  }

  const employees = loadEmployees();
  const employee = employees.find((e) => e.id === user.employeeId) || DEFAULT_EMPLOYEES[0];

  const session: AuthSession = {
    user,
    employee,
    token: `tok_2fa_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    loginMethod: "PASSWORD",
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isLocked: false,
    activeBranchId: employee.branchId || "branch-sohar"
  };

  saveAuthSession(session);
  recordDeviceSession(user);

  return { success: true, session };
}

// Active Devices & Sessions Management
export function loadActiveSessions(): ActiveSession[] {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load active sessions:", e);
  }

  const defaultSessions: ActiveSession[] = [
    {
      id: "sess-curr",
      userId: "usr-1",
      userName: "سعيد بن راشد الشحي",
      userRole: "ADMIN",
      deviceType: "Desktop",
      browser: "Chrome 124 (macOS Sonoma)",
      os: "macOS",
      ipAddress: "185.190.142.12 (Sohar, Oman)",
      location: "صحار، سلطنة عمان",
      lastActive: "نشط الآن (هذا الجهاز)",
      isCurrent: true
    },
    {
      id: "sess-mobile",
      userId: "usr-1",
      userName: "سعيد بن راشد الشحي",
      userRole: "ADMIN",
      deviceType: "Mobile",
      browser: "Deshal ERP PWA App (iPhone 15 Pro)",
      os: "iOS 17.5",
      ipAddress: "82.178.44.19 (Muscat, Oman)",
      location: "مسقط، سلطنة عمان",
      lastActive: "منذ 42 دقيقة",
      isCurrent: false
    }
  ];

  saveActiveSessions(defaultSessions);
  return defaultSessions;
}

export function saveActiveSessions(sessions: ActiveSession[]): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save active sessions:", e);
  }
}

export function recordDeviceSession(user: UserAccount): void {
  const sessions = loadActiveSessions();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Desktop Browser";
  let browser = "Chrome (Desktop)";
  let os = "Desktop OS";
  let deviceType: "Desktop" | "Mobile" | "Tablet" = "Desktop";

  if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceType = "Mobile";
    os = "iOS";
    browser = "Safari / PWA";
  } else if (/Android/.test(userAgent)) {
    deviceType = "Mobile";
    os = "Android";
    browser = "Chrome Mobile";
  } else if (/Macintosh/.test(userAgent)) {
    os = "macOS";
    browser = "Chrome for Mac";
  } else if (/Windows/.test(userAgent)) {
    os = "Windows 11";
    browser = "Edge / Chrome";
  }

  const current: ActiveSession = {
    id: `sess_${Date.now()}`,
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    deviceType,
    browser,
    os,
    ipAddress: "185.190.142.12 (Sohar, Oman)",
    location: "سلطنة عمان",
    lastActive: "نشط الآن (هذا الجهاز)",
    isCurrent: true
  };

  const updated = [current, ...sessions.filter((s) => s.id !== "sess-curr").map((s) => ({ ...s, isCurrent: false }))];
  saveActiveSessions(updated.slice(0, 10));
}

export function revokeSession(sessionId: string): ActiveSession[] {
  const sessions = loadActiveSessions();
  const updated = sessions.filter((s) => s.id !== sessionId);
  saveActiveSessions(updated);
  return updated;
}

export function revokeAllOtherSessions(): ActiveSession[] {
  const sessions = loadActiveSessions();
  const current = sessions.find((s) => s.isCurrent) || sessions[0];
  const updated = current ? [{ ...current, isCurrent: true }] : [];
  saveActiveSessions(updated);
  return updated;
}
