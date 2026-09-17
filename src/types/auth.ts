/**
 * Authentication & Identity Core Types — Deshal ERP
 */

export type { Session, User } from '@supabase/supabase-js';
export type { SupabaseAuthUser, AuthResult } from '../lib/supabase/authService';

export interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  employeeId: string;
  role: string;
  branchId?: string;
  companyId?: string;
}

export interface AuthSession {
  user: AuthSessionUser;
  token?: string;
  isLocked?: boolean;
  employee?: {
    id: string;
    branchId: string;
    role: string;
    permissions?: string[];
  };
}
