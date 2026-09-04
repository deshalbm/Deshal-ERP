export interface PasswordResetEmailData {
  recipientName: string;
  resetUrl: string;
  companyName?: string;
}

export function renderPasswordResetTemplate(data: PasswordResetEmailData): { subject: string; html: string } {
  const company = data.companyName || "ديشال ERP";
  const subject = `طلب إعادة تعيين كلمة المرور — ${company}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; direction: rtl;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${company}</h1>
              <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">إعادة تعيين كلمة المرور</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">أهلاً ${data.recipientName}،</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في <strong>${company}</strong>. انقر على الزر أدناه لتحديد كلمة مرور جديدة:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.25);">
                  إعادة تعيين كلمة المرور
                </a>
              </div>

              <p style="color: #64748b; font-size: 13px; line-height: 1.5; background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                🔒 ينتهي رابط التعيين تلقائياً لسلامة حسابك. إذا لم تقم بطلب إعادة التعيين، يمكنك إهمال هذه الرسالة وسيظل حسابك آمناً.
              </p>
            </td>
          </tr>
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
