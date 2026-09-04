export interface TestEmailData {
  recipientEmail: string;
  senderEmail?: string;
  companyName?: string;
}

export function renderTestTemplate(data: TestEmailData): { subject: string; html: string } {
  const company = data.companyName || "نظام ديشال ERP الإداري";
  const subject = `اختبار نجاح اتصال بريد Resend — ${company}`;

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
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${company}</h1>
              <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 13px;">اختبار الربط والخدمات البريدية</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="color: #059669; font-size: 18px; margin-top: 0;">نجح الاتصال بمركز البريد 🚀</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                هذه الرسالة تؤكد أن اتصال خدمة البريد الإلكتروني عبر <strong>Resend API</strong> يعمل بنجاح وبأعلى المعايير الأمنية من السيرفر.
              </p>

              <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; border: 1px solid #a7f3d0; margin: 20px 0;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; color: #047857; font-size: 13px;">المستلم:</td>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px; font-weight: bold;" align="left">${data.recipientEmail}</td>
                  </tr>
                  ${data.senderEmail ? `
                  <tr>
                    <td style="padding: 6px 0; color: #047857; font-size: 13px;">المرسل:</td>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px; font-weight: 600;" align="left">${data.senderEmail}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 6px 0; color: #047857; font-size: 13px;">تاريخ الاختبار:</td>
                    <td style="padding: 6px 0; color: #065f46; font-size: 13px;" align="left">${new Date().toLocaleString("ar-OM")}</td>
                  </tr>
                </table>
              </div>
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
