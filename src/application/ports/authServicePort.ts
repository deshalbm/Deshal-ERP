import type { AuthUserProfile } from '../auth/authUseCases';

export interface AuthResult {
  success: boolean;
  user?: AuthUserProfile;
  accessToken?: string;
  error?: string;
  message?: string;
}

export interface AuthServicePort {
  isConfigured(): boolean;
  signInWithEmail(email: string, password?: string): Promise<AuthResult>;
  signUpWithEmail(email: string, password?: string, fullName?: string, companyName?: string): Promise<AuthResult>;
}
