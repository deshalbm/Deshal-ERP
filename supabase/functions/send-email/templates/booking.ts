export interface BookingEmailData {
  bookingNumber: string;
  customerName: string;
  spaceOrServiceName: string;
  bookingDate: string;
  bookingTime?: string;
  totalAmount?: number;
  currency?: string;
  companyName?: string;
}

export function renderBookingTemplate(data: BookingEmailData): { subject: string; html: string } {
  const company = data.companyName || "ديشال ERP";
  const currency = data.currency || "ر.ع.";
  const subject = `تأكيد حجز ${data.spaceOrServiceName} — رقم #${data.bookingNumber}`;

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
              <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">تأكيد الحجز والخدمات</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">عزيزنا العميل ${data.customerName}،</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                يسعدنا إبلاغك بأنه تم تأكيد حجزك لـ <strong>"${data.spaceOrServiceName}"</strong> بنجاح.
              </p>

              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; border-right: 4px solid #10b981; margin: 20px 0;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">رقم الحجز:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: bold;" align="left">#${data.bookingNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">تاريخ الحجز:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;" align="left">${data.bookingDate}</td>
                  </tr>
                  ${data.bookingTime ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">توقيت الحجز:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;" align="left">${data.bookingTime}</td>
                  </tr>
                  ` : ''}
                  ${data.totalAmount ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">الإجمالي المدفوع:</td>
                    <td style="padding: 6px 0; color: #10b981; font-size: 15px; font-weight: bold;" align="left">${data.totalAmount.toLocaleString("ar-OM", { minimumFractionDigits: 2 })} ${currency}</td>
                  </tr>
                  ` : ''}
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
