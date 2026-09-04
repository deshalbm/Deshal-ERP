/**
 * Centralized & Secure Email Dispatch Service — Deshal ERP
 * 
 * Rules:
 * 1. Resend API key exists ONLY on the backend server / Supabase Edge Functions.
 * 2. NO raw HTML, arbitrary recipients, or raw Resend API calls from client components.
 * 3. Non-blocking design: Email dispatch failures NEVER crash core business operations.
 * 4. Automatic Audit Trail logging in `email_logs` database table.
 */

import { supabase } from '../supabase/client';
import type { EmailLogEntry } from '../../types';

export type EmailType = 
  | 'WELCOME_USER' 
  | 'INVOICE_CREATED' 
  | 'REQUEST_APPROVAL' 
  | 'BOOKING_CONFIRMATION' 
  | 'GENERAL_NOTIFICATION' 
  | 'PASSWORD_RESET' 
  | 'TEST_EMAIL';

export interface EmailDispatchOptions {
  type: EmailType;
  entityId?: string;
  recipientEmail?: string;
  companyId?: string;
  data?: Record<string, any>;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  logId?: string;
  mock?: boolean;
  error?: string;
}

/**
 * Dispatch system email via Supabase Edge Function with Express Server Proxy fallback.
 */
export async function sendSystemEmail(options: EmailDispatchOptions): Promise<EmailDispatchResult> {
  try {
    // 1. Primary Route: Invoke Supabase Edge Function 'send-email'
    if (supabase && typeof supabase.functions?.invoke === 'function') {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: options,
      });

      if (!error && data) {
        return {
          success: data.success ?? true,
          messageId: data.messageId,
          logId: data.logId,
          mock: data.mock,
          error: data.error,
        };
      }

      if (error) {
        console.warn('[EmailService] Edge function invoke notice, trying server fallback:', error.message);
      }
    }

    // 2. Secondary Route: Fallback to Server Proxy (/api/send-email)
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const resData = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: resData.error || resData.message || `خطأ استجابة من السيرفر (كود ${res.status})`,
      };
    }

    return {
      success: true,
      messageId: resData.id || resData.messageId,
      mock: resData.mock,
    };
  } catch (err: any) {
    console.error('[EmailService] Dispatch error:', err);
    return {
      success: false,
      error: err?.message || 'تعذر الاتصال بمركز خدمة البريد الإلكتروني.',
    };
  }
}

/**
 * Helper: Send welcome email to new employee or user
 */
export async function sendWelcomeEmail(params: {
  employeeId?: string;
  recipientEmail: string;
  recipientName: string;
  roleTitle?: string;
  tempPassword?: string;
  pinCode?: string;
  companyName?: string;
}): Promise<EmailDispatchResult> {
  return sendSystemEmail({
    type: 'WELCOME_USER',
    entityId: params.employeeId,
    recipientEmail: params.recipientEmail,
    data: {
      recipientName: params.recipientName,
      roleTitle: params.roleTitle,
      tempPassword: params.tempPassword,
      pinCode: params.pinCode,
      companyName: params.companyName,
    },
  });
}

/**
 * Helper: Send sales or purchase invoice notification
 */
export async function sendInvoiceEmail(params: {
  invoiceId: string;
  customerEmail?: string;
  customerName?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  dueDate?: string;
  invoiceUrl?: string;
  companyName?: string;
}): Promise<EmailDispatchResult> {
  return sendSystemEmail({
    type: 'INVOICE_CREATED',
    entityId: params.invoiceId,
    recipientEmail: params.customerEmail,
    data: {
      customerName: params.customerName,
      invoiceNumber: params.invoiceNumber,
      totalAmount: params.totalAmount,
      dueDate: params.dueDate,
      invoiceUrl: params.invoiceUrl,
      companyName: params.companyName,
    },
  });
}

/**
 * Helper: Send request approval / rejection status update
 */
export async function sendApprovalEmail(params: {
  requestId: string;
  recipientEmail?: string;
  requestTitle?: string;
  requestNumber?: string;
  requesterName?: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  comments?: string;
  actionUrl?: string;
  companyName?: string;
}): Promise<EmailDispatchResult> {
  return sendSystemEmail({
    type: 'REQUEST_APPROVAL',
    entityId: params.requestId,
    recipientEmail: params.recipientEmail,
    data: {
      requestTitle: params.requestTitle,
      requestNumber: params.requestNumber,
      requesterName: params.requesterName,
      status: params.status,
      comments: params.comments,
      actionUrl: params.actionUrl,
      companyName: params.companyName,
    },
  });
}

/**
 * Helper: Send space booking or service confirmation
 */
export async function sendBookingEmail(params: {
  bookingId: string;
  customerEmail?: string;
  customerName?: string;
  bookingNumber?: string;
  spaceOrServiceName?: string;
  bookingDate?: string;
  bookingTime?: string;
  totalAmount?: number;
  companyName?: string;
}): Promise<EmailDispatchResult> {
  return sendSystemEmail({
    type: 'BOOKING_CONFIRMATION',
    entityId: params.bookingId,
    recipientEmail: params.customerEmail,
    data: {
      customerName: params.customerName,
      bookingNumber: params.bookingNumber,
      spaceOrServiceName: params.spaceOrServiceName,
      bookingDate: params.bookingDate,
      bookingTime: params.bookingTime,
      totalAmount: params.totalAmount,
      companyName: params.companyName,
    },
  });
}

/**
 * Helper: Send general alert notification
 */
export async function sendNotificationEmail(params: {
  recipientEmail: string;
  title: string;
  message: string;
  recipientName?: string;
  actionUrl?: string;
  actionText?: string;
  companyName?: string;
}): Promise<EmailDispatchResult> {
  return sendSystemEmail({
    type: 'GENERAL_NOTIFICATION',
    recipientEmail: params.recipientEmail,
    data: {
      title: params.title,
      message: params.message,
      recipientName: params.recipientName,
      actionUrl: params.actionUrl,
      actionText: params.actionText,
      companyName: params.companyName,
    },
  });
}

/**
 * Helper: Send test connection email
 */
export async function sendTestEmail(targetEmail: string, companyName?: string): Promise<EmailDispatchResult> {
  return sendSystemEmail({
    type: 'TEST_EMAIL',
    recipientEmail: targetEmail,
    data: { companyName },
  });
}

/**
 * Fetch recent email audit logs from database
 */
export async function fetchEmailLogs(companyId?: string, limit = 50): Promise<EmailLogEntry[]> {
  try {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[EmailService] fetchEmailLogs error:', error.message);
      return [];
    }
    return (data as EmailLogEntry[]) || [];
  } catch (err) {
    console.error('[EmailService] Error loading email logs:', err);
    return [];
  }
}
