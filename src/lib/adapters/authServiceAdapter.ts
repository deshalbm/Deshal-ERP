import type { AuthServicePort, AuthResult } from '../../application/ports/authServicePort';
import { isSupabaseConfigured } from '../supabase/client';
import { signInWithEmail as supabaseSignIn, signUpWithEmail as supabaseSignUp } from '../supabase/authService';

export const defaultAuthServiceAdapter: AuthServicePort = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },
  async signInWithEmail(email: string, password?: string): Promise<AuthResult> {
    if (!password) return { success: false, error: 'Password required.' };
    const res = await supabaseSignIn(email, password);
    return {
      success: res.success,
      user: res.user ? {
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.fullName,
        fullNameEn: res.user.fullNameEn,
        role: res.user.role,
        branchId: res.user.branchId || undefined,
      } : undefined,
      accessToken: res.session?.access_token,
      error: res.error,
    };
  },
  async signUpWithEmail(email: string, password?: string, fullName?: string, companyName?: string): Promise<AuthResult> {
    if (!password || !fullName || !companyName) return { success: false, error: 'All fields required for registration.' };
    const res = await supabaseSignUp(email, password, fullName, companyName);
    return {
      success: res.success,
      user: res.user ? {
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.fullName,
        fullNameEn: res.user.fullNameEn,
        role: res.user.role,
        branchId: res.user.branchId || undefined,
      } : undefined,
      accessToken: res.session?.access_token,
      error: res.error,
    };
  }
};
