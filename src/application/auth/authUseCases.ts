import { AuthSession, UserAccount } from '../../types';
import type { AuthServicePort, AuthResult } from '../ports/authServicePort';

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName: string;
  fullNameEn?: string;
  role: string;
  branchId?: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Pure Use Case: Validates login form input credentials.
 */
export function validateLoginCredentials(
  email: string,
  password?: string
): ValidationResult {
  if (!email || email.trim() === '') {
    return { valid: false, message: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم.' };
  }
  if (password !== undefined && password.trim() === '') {
    return { valid: false, message: 'يرجى إدخال كلمة المرور.' };
  }
  return { valid: true };
}

/**
 * Pure Use Case: Evaluates if a given AuthSession represents a dedicated Kiosk Tablet user.
 * Kiosk accounts are restricted to full-screen attendance tablet mode.
 */
export function evaluateKioskTabletGuard(session: AuthSession | null): boolean {
  if (!session) return false;

  const role = session.user?.role || session.employee?.role || '';
  const permissions = session.employee?.permissions || [];

  return (
    role === 'KIOSK_TABLET' ||
    (role as string) === 'KIOSK_TABLET' ||
    permissions.includes('kiosk_mode_only')
  );
}

/**
 * Pure Use Case: Maps an AuthUserProfile into a backward-compatible AuthSession object.
 */
export function createCompatibleAuthSession(
  user: AuthUserProfile,
  existingToken?: string
): AuthSession {
  const compatUser: UserAccount = {
    id: user.id,
    employeeId: user.id,
    email: user.email,
    fullName: user.fullName,
    fullNameEn: user.fullNameEn || user.fullName,
    role: user.role as any,
    passwordHash: '',
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const compatEmp: any = {
    id: user.id,
    employeeCode: 'EMP-SUPABASE',
    fullName: user.fullName,
    fullNameEn: user.fullNameEn || user.fullName,
    email: user.email,
    phone: '',
    role: user.role as any,
    jobTitle: user.role,
    department: 'الإدارة العامة',
    branchId: user.branchId || '',
    status: 'ACTIVE',
    hireDate: new Date().toISOString(),
    basicSalary: 0,
    allowances: 0,
    currency: 'OMR',
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    user: compatUser,
    employee: compatEmp,
    token: existingToken || 'active-session-token',
    loginMethod: 'PASSWORD',
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isLocked: false,
    activeBranchId: user.branchId || undefined,
  };
}

export function isRemoteAuthAvailable(adapter?: AuthServicePort): boolean {
  return adapter ? adapter.isConfigured() : false;
}

export async function executeRemoteSignIn(
  email: string,
  password: string,
  adapter?: AuthServicePort
): Promise<AuthResult> {
  if (!adapter) return { success: false, error: 'Auth service adapter not provided.' };
  return adapter.signInWithEmail(email, password);
}

export async function executeRemoteSignUp(
  email: string,
  password: string,
  fullName: string,
  companyName: string,
  adapter?: AuthServicePort
): Promise<AuthResult> {
  if (!adapter) return { success: false, error: 'Auth service adapter not provided.' };
  return adapter.signUpWithEmail(email, password, fullName, companyName);
}
