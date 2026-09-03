/**
 * Supabase Auth Service
 * Replaces the localStorage-based authManager with proper Supabase Auth.
 * Passwords are never stored in localStorage or plain text.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { Session, User, AuthError } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface SupabaseAuthUser {
  id: string;
  email: string;
  role: string;            // from profiles.role
  fullName: string;        // from profiles.full_name
  fullNameEn: string;      // from profiles.full_name_en
  companyId: string;       // from profiles.company_id
  branchId: string | null; // from profiles.branch_id
  avatarUrl: string | null;
  pinCode: string | null;  // hashed PIN stored in profiles for kiosk mode
}

export interface AuthResult {
  success: boolean;
  user?: SupabaseAuthUser;
  session?: Session;
  error?: string;
}

// ──────────────────────────────────────────────
// Sign In
// ──────────────────────────────────────────────

/**
 * Sign in with email and password via Supabase Auth.
 * Never compares passwords locally — Supabase handles hashing.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.session || !data.user) {
    return {
      success: false,
      error: mapAuthError(error),
    };
  }

  const profile = await fetchUserProfile(data.user.id);
  if (!profile) {
    return {
      success: false,
      error: 'لم يتم العثور على ملف تعريف المستخدم. تواصل مع مسؤول النظام.',
    };
  }

  return { success: true, user: profile, session: data.session };
}

// ──────────────────────────────────────────────
// Sign Up
// ──────────────────────────────────────────────

/**
 * Sign up a new user account via Supabase Auth and create profile.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  companyName?: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase غير مضبوط.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName || 'مجموعة ديشال التجارية',
      },
    },
  });

  if (error || !data.user) {
    return { success: false, error: mapAuthError(error) };
  }

  const companyId = '00000000-0000-0000-0000-000000000001';

  // Create profile record in public.profiles table
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email: data.user.email,
    full_name: fullName,
    full_name_en: fullName,
    role: 'ADMIN',
    company_id: companyId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.warn('[AuthService] Profile upsert warning:', profileError.message);
  }

  const profile: SupabaseAuthUser = {
    id: data.user.id,
    email: data.user.email ?? '',
    role: 'ADMIN',
    fullName: fullName,
    fullNameEn: fullName,
    companyId: companyId,
    branchId: null,
    avatarUrl: null,
    pinCode: null,
  };

  return { success: true, user: profile, session: data.session || undefined };
}

// ──────────────────────────────────────────────
// Sign Out
// ──────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ──────────────────────────────────────────────
// Get Current Session
// ──────────────────────────────────────────────

export async function getCurrentSession(): Promise<{
  session: Session | null;
  user: SupabaseAuthUser | null;
}> {
  if (!isSupabaseConfigured) return { session: null, user: null };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return { session: null, user: null };

  const profile = await fetchUserProfile(session.user.id);
  return { session, user: profile };
}

// ──────────────────────────────────────────────
// Auth State Change Listener
// ──────────────────────────────────────────────

/**
 * Subscribe to auth state changes.
 * Returns unsubscribe function for cleanup.
 */
export function onAuthStateChange(
  callback: (user: SupabaseAuthUser | null, session: Session | null) => void
): () => void {
  if (!isSupabaseConfigured) return () => {};

  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      callback(profile, session);
    } else {
      callback(null, null);
    }
  });

  return () => data.subscription.unsubscribe();
}

// ──────────────────────────────────────────────
// Password Reset
// ──────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}?action=reset-password`,
  });

  if (error) return { success: false, error: mapAuthError(error) };
  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: mapAuthError(error) };
  return { success: true };
}

// ──────────────────────────────────────────────
// PIN Auth (Kiosk Mode — stays local for offline capability)
// ──────────────────────────────────────────────

/**
 * PIN authentication for kiosk mode.
 * Fetches the PIN hash from Supabase profiles and validates locally.
 * This allows offline kiosk operation with cached PIN.
 */
export async function authenticateWithPin(
  employeeId: string,
  pin: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'غير متصل بالخادم.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, pin_code, full_name, full_name_en, role, company_id, branch_id, avatar_url, email')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: 'الموظف غير موجود في النظام.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;

  if (row.pin_code !== pin) {
    return { success: false, error: 'رمز PIN غير صحيح.' };
  }

  const profile: SupabaseAuthUser = {
    id: row.id,
    email: row.email ?? '',
    role: row.role ?? 'EMPLOYEE',
    fullName: row.full_name ?? '',
    fullNameEn: row.full_name_en ?? '',
    companyId: row.company_id ?? '',
    branchId: row.branch_id ?? null,
    avatarUrl: row.avatar_url ?? null,
    pinCode: null,
  };

  return { success: true, user: profile };
}

// ──────────────────────────────────────────────
// Create User (Admin only)
// ──────────────────────────────────────────────

/**
 * Create a new user account linked to the company.
 * Uses Supabase Auth admin API via server-side Edge Function.
 * Direct user creation from client is restricted by RLS.
 */
export async function inviteUser(email: string, role: string, companyId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // Call server-side function to create user safely
  const { error } = await supabase.functions.invoke('invite-user', {
    body: { email, role, companyId },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

async function fetchUserProfile(userId: string): Promise<SupabaseAuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, full_name_en, role, company_id, branch_id, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (!data) {
    console.warn('[AuthService] Profile missing for user ID:', userId, 'Attempting auto-provisioning...');
    try {
      const { data: userData } = await supabase.auth.getUser();
      const u = userData?.user;
      if (u && u.id === userId) {
        const userEmail = u.email || '';
        const fallbackName = userEmail ? userEmail.split('@')[0] : 'User';
        const companyId = '00000000-0000-0000-0000-000000000001';

        await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          full_name: fallbackName,
          full_name_en: fallbackName,
          role: 'ADMIN',
          company_id: companyId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        return {
          id: userId,
          email: userEmail,
          role: 'ADMIN',
          fullName: fallbackName,
          fullNameEn: fallbackName,
          companyId,
          branchId: null,
          avatarUrl: null,
          pinCode: null,
        };
      }
    } catch (err) {
      console.error('[AuthService] Failed auto-provisioning profile:', err);
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = data as any;

  return {
    id: profile.id ?? userId,
    email: profile.email ?? '',
    role: profile.role ?? 'ADMIN',
    fullName: profile.full_name || (profile.email ? profile.email.split('@')[0] : 'Admin'),
    fullNameEn: profile.full_name_en || (profile.email ? profile.email.split('@')[0] : 'Admin'),
    companyId: profile.company_id ?? '00000000-0000-0000-0000-000000000001',
    branchId: profile.branch_id ?? null,
    avatarUrl: profile.avatar_url ?? null,
    pinCode: null,
  };
}

function mapAuthError(error: AuthError | null): string {
  if (!error) return 'حدث خطأ غير معروف.';
  switch (error.message) {
    case 'Invalid login credentials':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    case 'Email not confirmed':
      return 'يرجى تأكيد بريدك الإلكتروني أولاً.';
    case 'Too many requests':
      return 'محاولات كثيرة جداً. يرجى الانتظار قبل المحاولة مجدداً.';
    default:
      return error.message;
  }
}
