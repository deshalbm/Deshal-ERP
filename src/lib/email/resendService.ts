/**
 * Resend Email Integration Service
 * Provides transactional email delivery, onboarding welcome credentials, and test connection utilities.
 */

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

/**
 * Core function to send email via Resend API or local server endpoint proxy
 */
export async function sendResendEmail(
  settings: ResendSettings,
  payload: SendEmailPayload
): Promise<ResendResponse> {
  if (!settings.apiKey || !settings.apiKey.trim()) {
    return {
      success: false,
      error: 'لم يتم ضبط مفتاح Resend API Key في الإعدادات.'
    };
  }

  const fromAddress = settings.fromEmail && settings.fromEmail.includes('@')
    ? `${settings.fromName || 'نظام ديشال ERP'} <${settings.fromEmail}>`
    : `${settings.fromName || 'نظام ديشال ERP'} <onboarding@resend.dev>`;

  const bodyData = {
    from: fromAddress,
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  };

  // 1. Try local server endpoint proxy if available (/api/send-email)
  try {
    const serverRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: settings.apiKey,
        ...bodyData
      })
    });

    if (serverRes.ok) {
      const json = await serverRes.json();
      if (json.id || json.success) {
        return { success: true, messageId: json.id };
      }
    }
  } catch {
    // Fall back to direct Resend API call
  }

  // 2. Direct Resend API Call (https://api.resend.com/emails)
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    const data = await resendRes.json();

    if (!resendRes.ok) {
      return {
        success: false,
        error: data.message || data.error?.message || `خطأ استجابة من Resend (كود ${resendRes.status})`
      };
    }

    return {
      success: true,
      messageId: data.id
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'حدث خطأ في شبكة الاتصال بـ Resend API.'
    };
  }
}

/**
 * Send test email to verify Resend settings connection
 */
export async function sendTestEmail(
  settings: ResendSettings,
  targetEmail: string
): Promise<ResendResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 16px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">اختبار اتصال بريد Resend - ديشال ERP</h2>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">مرحباً بك،</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">هذه الرسالة تؤكد أن ربط خدمة البريد الإلكتروني <strong>Resend API</strong> يعمل بنجاح وكفاءة على منصة ديشال لإدارة الأعمال.</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 10px; font-size: 12px; color: #475569; margin: 20px 0;">
          <strong>وقت الاختبار:</strong> ${new Date().toLocaleString('ar-OM')}<br/>
          <strong>البريد المرسل:</strong> ${settings.fromEmail || 'onboarding@resend.dev'}
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          نظام ديشال لإدارة الأعمال (Deshal ERP) © ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  `;

  return sendResendEmail(settings, {
    to: targetEmail,
    subject: 'اختبار نجاح اتصال بريد Resend - ديشال ERP',
    html
  });
}

/**
 * Send welcome invitation email with login credentials for new Employees, Collaborators, or Auditors
 */
export async function sendWelcomeCredentialsEmail(
  settings: ResendSettings,
  employee: Employee,
  loginDetails: {
    email: string;
    pinCode?: string;
    tempPassword?: string;
  },
  companyName: string
): Promise<ResendResponse> {
  const roleTitleMap: Record<string, string> = {
    ADMIN: 'مدير النظام (Admin)',
    ACCOUNTANT: 'محاسب عام (Accountant)',
    SALES: 'مسؤول مبيعات وعقود (Sales)',
    STOREKEEPER: 'أمين مستودع (Storekeeper)',
    MANAGER: 'مدير فرع / قسم (Manager)',
    RECEPTIONIST: 'استقبال (Receptionist)',
    COLLABORATOR: 'متعاون خارجي / مستشار (Collaborator)',
    AUDITOR: 'مراقب ومدقق حسابات (Auditor)',
    CUSTOM: 'مستخدم مخصص (Custom User)'
  };

  const roleName = roleTitleMap[employee.role] || employee.jobTitle || 'عضو النظام';

  const subject = settings.customWelcomeSubject || `دعوة انضمام وحساب دخول إلى نظام ${companyName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        {/* Header */}
        <div style="background: linear-gradient(135deg, #1e1b4b, #4338ca); padding: 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #fbbf24;">${companyName}</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe;">حساب تسجيل الدخول والصلاحيات المعتمدة</p>
        </div>

        {/* Body */}
        <p style="color: #1e293b; font-size: 15px; font-weight: bold; margin-bottom: 12px;">
          أهلاً وسهلاً بك ${employee.fullName}،
        </p>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          تم إنشاء وتفعيل بروفايل حسابك الخاص على نظام <strong>${companyName}</strong> بصفة: <span style="color: #4338ca; font-weight: bold;">${roleName}</span>.
        </p>

        {/* Credentials Card */}
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            🔑 بيانات تسجيل الدخول الخاصة بك:
          </h3>
          
          <table style="width: 100%; text-align: right; font-size: 13px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">البريد الإلكتروني:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #0f172a;">${loginDetails.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">الرقم الوظيفي / الكود:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #0f172a;">${employee.employeeCode}</td>
            </tr>
            ${loginDetails.pinCode ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">رمز الـ PIN السريع للكشك والحضور:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #d97706; font-size: 16px;">${loginDetails.pinCode}</td>
            </tr>
            ` : ''}
            ${loginDetails.tempPassword ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">كلمة المرور المؤقتة:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #dc2626;">${loginDetails.tempPassword}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        {/* Permissions Scope Summary */}
        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 14px; margin-bottom: 24px; font-size: 12px; color: #3730a3;">
          ℹ️ <strong>الصلاحيات المتاحة للحساب:</strong> تم منحك صلاحيات دور (${roleName}) مع إمكانية الوصول لوظائف النظام وفق حوكمة الأمان المعتمدة.
        </div>

        {/* Footer Note */}
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          هذه رسالة آليّة صادرة من منصة ديشال لإدارة الأعمال © ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  `;

  return sendResendEmail(settings, {
    to: loginDetails.email,
    subject,
    html
  });
}
