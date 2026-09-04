export interface WelcomeEmailData {
  recipientName: string;
  recipientEmail: string;
  roleTitle?: string;
  tempPassword?: string;
  pinCode?: string;
  loginUrl?: string;
  companyName?: string;
}

export function renderWelcomeTemplate(data: WelcomeEmailData): { subject: string; html: string } {
  const company = data.companyName || "نظام ديشال ERP الإداري";
  const loginUrl = data.loginUrl || "https://erp.deshalbm.com";
  const subject = `مرحباً بك في ${company} — بيانات حسابك الجديد`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; direction: rtl;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${company}</h1>
              <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">تأكيد الدخول وإعداد الحساب</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; margin-bottom: 12px;">أهلاً بك، ${data.recipientName} 👋</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                تم إنشاء حساب جديد لك في <strong>${company}</strong> بصلاحية <strong>${data.roleTitle || "عضو فريق"}</strong>. تجد أدناه تفاصيل تسجيل الدخول الخاصة بك:
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; border-right: 4px solid #2563eb; margin-bottom: 24px;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">البريد الإلكتروني:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: bold; font-family: monospace;" align="left">${data.recipientEmail}</td>
                  </tr>
                  ${data.tempPassword ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">كلمة المرور المؤقتة:</td>
                    <td style="padding: 6px 0; color: #2563eb; font-size: 14px; font-weight: bold; font-family: monospace;" align="left">${data.tempPassword}</td>
                  </tr>
                  ` : ''}
                  ${data.pinCode ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">رمز السريع (PIN):</td>
                    <td style="padding: 6px 0; color: #059669; font-size: 15px; font-weight: bold; font-family: monospace;" align="left">${data.pinCode}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Login Button -->
              <div style="text-align: center; margin: 30px 0 20px 0;">
                <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
                  تسجيل الدخول للنظام الان
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                💡 يُنصح بتغيير كلمة المرور المؤقتة فور تسجيل الدخول لأول مرة لضمان أعلى مستويات الأمان.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">جميع الحقوق محفوظة © ${new Date().getFullYear()} ${company}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
