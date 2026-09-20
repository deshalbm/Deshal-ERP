/**
 * Centralized Supabase & API Error Mapper — Deshal ERP
 * Standardizes raw Supabase, PostgREST, PostgreSQL, and HTTP errors into domain API error codes.
 */

export type ApiErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_REQUEST'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface ApiErrorResult {
  code: ApiErrorCode;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originalError?: any;
  status?: number;
}

/**
 * Maps any raw error object or exception into a standardized ApiErrorResult.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseError(error: any, contextMsg = ''): ApiErrorResult {
  if (!error) {
    return { code: 'UNKNOWN_ERROR', message: 'حدث خطأ غير معروف.' };
  }

  const msg = typeof error === 'string' ? error : error.message || String(error);
  const status = error?.status || error?.statusCode;
  const pgCode = error?.code || '';

  // 1. Invalid input / UUID syntax / Bad request (HTTP 400)
  if (
    status === 400 ||
    pgCode === '22P02' ||
    msg.includes('invalid input syntax for type uuid') ||
    msg.includes('malformed') ||
    msg.includes('bad request') ||
    msg.includes('does not exist')
  ) {
    return {
      code: 'INVALID_REQUEST',
      message: 'طلب غير صالح. يرجى التحقق من البيانات المدخلة والمعرفات.',
      originalError: error,
      status: 400,
    };
  }

  // 2. Auth Invalid Credentials / Expired Session (HTTP 401)
  if (
    status === 401 ||
    msg.includes('Invalid login credentials') ||
    msg.includes('JWT expired') ||
    msg.includes('invalid JWT') ||
    msg.includes('JWT issued at future')
  ) {
    if (msg.includes('Invalid login credentials')) {
      return {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        originalError: error,
        status: 401,
      };
    }
    return {
      code: 'AUTH_SESSION_EXPIRED',
      message: 'انتهت جلسة العمل. يرجى إعادة تسجيل الدخول.',
      originalError: error,
      status: 401,
    };
  }

  // 3. Permission Denied / RLS Violation (HTTP 403 / PG 42501)
  if (
    status === 403 ||
    pgCode === '42501' ||
    msg.includes('permission denied') ||
    msg.includes('row-level security') ||
    msg.includes('Unauthorized')
  ) {
    return {
      code: 'PERMISSION_DENIED',
      message: 'ليس لديك صلاحية للوصول إلى هذه البيانات.',
      originalError: error,
      status: 403,
    };
  }

  // 4. Not Found (HTTP 404 / PG PGRST116)
  if (status === 404 || pgCode === 'PGRST116' || msg.includes('not found')) {
    return {
      code: 'NOT_FOUND',
      message: 'السجل المطلوب غير موجود في النظام.',
      originalError: error,
      status: 404,
    };
  }

  // 5. Conflict / Duplicate Key (HTTP 409 / PG 23505)
  if (status === 409 || pgCode === '23505' || msg.includes('duplicate key')) {
    return {
      code: 'CONFLICT',
      message: 'السجل موجود بالفعل أو يتضارب مع بيانات أخرى.',
      originalError: error,
      status: 409,
    };
  }

  // 6. Network failure / Connection Error
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('offline')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.',
      originalError: error,
    };
  }

  // 7. Timeout
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) {
    return {
      code: 'TIMEOUT',
      message: 'انتهت مهلة الانتظار للاتصال بالخادم.',
      originalError: error,
    };
  }

  // 8. General Database Error (500+)
  if ((typeof status === 'number' && status >= 500) || pgCode.startsWith('23') || pgCode.startsWith('42')) {
    return {
      code: 'DATABASE_ERROR',
      message: 'حدث خطأ في قاعدة البيانات.',
      originalError: error,
      status: status || 500,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: contextMsg ? `${contextMsg}: ${msg}` : msg,
    originalError: error,
  };
}
