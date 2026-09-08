import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Client-side public environment keys (supports Vite & Node.js tsx runner)
const getEnvVar = (key: string): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch {
    // Ignore
  }
  return process.env[key] || '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Singleton Supabase Client for browser React UI
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

/**
 * Diagnostic helper to test active Supabase connection
 */
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase credentials are not configured in environment.' };
  }

  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Connected to Supabase PostgreSQL successfully.' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection failed' };
  }
}

/**
 * Graceful error logging for Supabase client queries.
 * Converts permission/unauthorized errors into informative warnings rather than noisy console errors.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleSupabaseError(context: string, error: any): void {
  if (!error) return;
  const msg = typeof error === 'string' ? error : error.message || String(error);
  const code = error?.code || '';
  if (
    code === '42501' ||
    msg.includes('auth_user_company_ids') ||
    msg.includes('permission denied') ||
    msg.includes('Unauthorized')
  ) {
    console.warn(`[Supabase Permission Notice] ${context}: ${msg}. (To sync Supabase DB, execute 0032_grant_function_permissions.sql in Supabase SQL Editor)`);
  } else {
    console.error(`[${context}]`, msg);
  }
}

