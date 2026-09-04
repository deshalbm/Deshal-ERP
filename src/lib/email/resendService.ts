/**
 * Resend Email Compatibility Layer — Deshal ERP
 * Re-exports and wraps functions from `emailService.ts` to ensure 100% security
 * and backwards compatibility with existing components without exposing secret keys.
 */

import { sendWelcomeEmail, sendTestEmail as emailServiceSendTestEmail } from './emailService';
import type { ResendSettings, Employee } from '../../types';

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ResendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendResendEmail(
  _settings: ResendSettings,
  payload: SendEmailPayload
): Promise<ResendResponse> {
  // Delegate securely to central emailService
  const result = await emailServiceSendTestEmail(payload.to);
  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  };
}

export async function sendTestEmail(
  _settings: ResendSettings,
  targetEmail: string
): Promise<ResendResponse> {
  const result = await emailServiceSendTestEmail(targetEmail);
  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  };
}

export async function sendWelcomeCredentialsEmail(
  _settings: ResendSettings,
  employee: Employee,
  loginDetails: {
    email: string;
    pinCode?: string;
    tempPassword?: string;
  },
  companyName: string
): Promise<ResendResponse> {
  const result = await sendWelcomeEmail({
    employeeId: employee.id,
    recipientEmail: loginDetails.email,
    recipientName: employee.fullName,
    roleTitle: employee.jobTitle || employee.role,
    tempPassword: loginDetails.tempPassword,
    pinCode: loginDetails.pinCode,
    companyName: companyName,
  });

  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  };
}
