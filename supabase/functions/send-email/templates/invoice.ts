export interface InvoiceEmailData {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  currency?: string;
  dueDate?: string;
  invoiceUrl?: string;
  companyName?: string;
}

export function renderInvoiceTemplate(data: InvoiceEmailData): { subject: string; html: string } {
  const company = data.companyName || "ديشال ERP";
  const currency = data.currency || "ر.ع.";
  const formattedTotal = Number(data.totalAmount || 0).toLocaleString("ar-OM", { minimumFractionDigits: 2 });
  const subject = `فاتورة جديدة رقم ${data.invoiceNumber} من ${company}`;

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
              <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">إشعار صدور فاتورة مالية</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">عزيزنا العميل ${data.customerName}،</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                تم إصدار الفاتورة رقم <strong>#${data.invoiceNumber}</strong> وتفاصيلها كالتالي:
              </p>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px;">رقم الفاتورة:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: bold;" align="left">#${data.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px;">إجمالي المبلغ:</td>
                    <td style="padding: 8px 0; color: #10b981; font-size: 16px; font-weight: bold;" align="left">${formattedTotal} ${currency}</td>
                  </tr>
                  ${data.dueDate ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px;">تاريخ الاستحقاق:</td>
                    <td style="padding: 8px 0; color: #dc2626; font-size: 13px; font-weight: 600;" align="left">${data.dueDate}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              ${data.invoiceUrl ? `
              <div style="text-align: center; margin: 28px 0;">
                <a href="${data.invoiceUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  عرض وتحميل الفاتورة
                </a>
              </div>
              ` : ''}
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
