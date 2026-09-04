export interface ApprovalEmailData {
  requestTitle: string;
  requestNumber: string;
  requesterName: string;
  status: "APPROVED" | "REJECTED" | "PENDING";
  comments?: string;
  actionUrl?: string;
  companyName?: string;
}

export function renderApprovalTemplate(data: ApprovalEmailData): { subject: string; html: string } {
  const company = data.companyName || "ديشال ERP";
  const statusLabel = data.status === "APPROVED" ? "تمت الموافقة" : data.status === "REJECTED" ? "تم الرفض" : "قيد المراجعة والإجراء";
  const statusColor = data.status === "APPROVED" ? "#10b981" : data.status === "REJECTED" ? "#ef4444" : "#f59e0b";
  const subject = `تحديث طلب ${data.requestNumber} — ${statusLabel}`;

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
              <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">نظام الطلبات والموافقات الإدارية</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">أهلاً ${data.requesterName}،</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                تم تحديث حالة طلبك <strong>"${data.requestTitle}"</strong> رقم <strong>#${data.requestNumber}</strong>:
              </p>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border-right: 4px solid ${statusColor}; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">الحالة الجديدة:</p>
                <div style="font-size: 18px; font-weight: bold; color: ${statusColor};">${statusLabel}</div>
                ${data.comments ? `
                <p style="margin: 12px 0 0 0; color: #334155; font-size: 13px; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                  <strong>ملاحظات المراجع:</strong> ${data.comments}
                </p>
                ` : ''}
              </div>

              ${data.actionUrl ? `
              <div style="text-align: center; margin: 28px 0;">
                <a href="${data.actionUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  عرض تفاصيل الطلب بالنظام
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
