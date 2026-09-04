/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { renderWelcomeTemplate } from "./templates/welcome.ts";
import { renderInvoiceTemplate } from "./templates/invoice.ts";
import { renderApprovalTemplate } from "./templates/approval.ts";
import { renderBookingTemplate } from "./templates/booking.ts";
import { renderNotificationTemplate } from "./templates/notification.ts";
import { renderPasswordResetTemplate } from "./templates/passwordReset.ts";
import { renderTestTemplate } from "./templates/test.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequestPayload {
  type: "WELCOME_USER" | "INVOICE_CREATED" | "REQUEST_APPROVAL" | "BOOKING_CONFIRMATION" | "GENERAL_NOTIFICATION" | "PASSWORD_RESET" | "TEST_EMAIL";
  entityId?: string;
  recipientEmail?: string;
  companyId?: string;
  data?: Record<string, any>;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseAnonKey;
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const defaultFrom = Deno.env.get("EMAIL_FROM") || "Deshal ERP <app@portal.deshalbm.com>";
    const emailEnabled = (Deno.env.get("EMAIL_ENABLED") ?? "true").toLowerCase() !== "false";

    // 1. Verify User Authentication (JWT)
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    });

    let authenticatedUserId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        authenticatedUserId = user.id;
      }
    }

    const payload: EmailRequestPayload = await req.json();

    if (!payload.type) {
      return new Response(
        JSON.stringify({ error: "نوع البريد الإلكتروني غير محدد (Missing email type)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let recipient = payload.recipientEmail || "";
    let companyId = payload.companyId || null;
    let subject = "";
    let htmlContent = "";
    let relatedEntityType: string | null = null;
    let relatedEntityId: string | null = payload.entityId || null;

    // 2. Fetch Entity & Render Modular Email Templates
    switch (payload.type) {
      case "WELCOME_USER": {
        relatedEntityType = "employees";
        const empData = payload.data || {};
        recipient = payload.recipientEmail || empData.recipientEmail;
        if (!recipient && payload.entityId) {
          const { data: emp } = await supabase.from("employees").select("*").eq("id", payload.entityId).single();
          if (emp) {
            recipient = emp.email;
            companyId = emp.company_id;
            empData.recipientName = empData.recipientName || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.name;
            empData.roleTitle = empData.roleTitle || emp.position || emp.role;
          }
        }
        if (!recipient) {
          throw new Error("البريد الإلكتروني للمستلم مطلوب لإرسال بريد الترحيب");
        }
        const rendered = renderWelcomeTemplate({
          recipientName: empData.recipientName || "الموظف/العضو الجديد",
          recipientEmail: recipient,
          roleTitle: empData.roleTitle,
          tempPassword: empData.tempPassword,
          pinCode: empData.pinCode,
          loginUrl: empData.loginUrl || Deno.env.get("APP_URL") || "https://erp.deshalbm.com",
          companyName: empData.companyName,
        });
        subject = rendered.subject;
        htmlContent = rendered.html;
        break;
      }

      case "INVOICE_CREATED": {
        relatedEntityType = "invoices";
        const invData = payload.data || {};
        if (payload.entityId) {
          const { data: inv } = await supabase.from("invoices").select("*").eq("id", payload.entityId).single();
          if (inv) {
            companyId = inv.company_id;
            invData.invoiceNumber = invData.invoiceNumber || inv.invoice_number || inv.id;
            invData.customerName = invData.customerName || inv.customer_name || "العميل المحترم";
            invData.totalAmount = invData.totalAmount ?? inv.total_amount ?? 0;
            invData.dueDate = invData.dueDate || inv.due_date;
            recipient = recipient || inv.customer_email;
          }
        }
        if (!recipient && invData.customerEmail) recipient = invData.customerEmail;
        if (!recipient) {
          throw new Error("لا يوجد عنوان بريد إلكتروني مسجل للعميل المستهدف بالفاتورة");
        }
        const rendered = renderInvoiceTemplate({
          invoiceNumber: invData.invoiceNumber || payload.entityId || "INV-000",
          customerName: invData.customerName || "العميل المحترم",
          totalAmount: Number(invData.totalAmount || 0),
          dueDate: invData.dueDate,
          invoiceUrl: invData.invoiceUrl,
          companyName: invData.companyName,
        });
        subject = rendered.subject;
        htmlContent = rendered.html;
        break;
      }

      case "REQUEST_APPROVAL": {
        relatedEntityType = "requests";
        const reqData = payload.data || {};
        if (payload.entityId) {
          const { data: reqItem } = await supabase.from("requests").select("*").eq("id", payload.entityId).single();
          if (reqItem) {
            companyId = reqItem.company_id;
            reqData.requestTitle = reqData.requestTitle || reqItem.title || "طلب إداري";
            reqData.requestNumber = reqData.requestNumber || reqItem.request_number || reqItem.id;
            reqData.requesterName = reqData.requesterName || reqItem.employee_name || "الموظف";
            reqData.status = reqData.status || reqItem.status;
            recipient = recipient || reqItem.employee_email;
          }
        }
        if (!recipient) {
          throw new Error("عنوان بريد صاحب الطلب غير متاح لإرسال تحديث الموافقة");
        }
        const rendered = renderApprovalTemplate({
          requestTitle: reqData.requestTitle || "طلب إداري",
          requestNumber: reqData.requestNumber || payload.entityId || "REQ-000",
          requesterName: reqData.requesterName || "الموظف",
          status: reqData.status || "PENDING",
          comments: reqData.comments,
          actionUrl: reqData.actionUrl,
          companyName: reqData.companyName,
        });
        subject = rendered.subject;
        htmlContent = rendered.html;
        break;
      }

      case "BOOKING_CONFIRMATION": {
        relatedEntityType = "space_bookings";
        const bookData = payload.data || {};
        if (payload.entityId) {
          const { data: b } = await supabase.from("space_bookings").select("*").eq("id", payload.entityId).single();
          if (b) {
            companyId = b.company_id;
            bookData.bookingNumber = bookData.bookingNumber || b.booking_number || b.id;
            bookData.customerName = bookData.customerName || b.customer_name || "العميل";
            bookData.spaceOrServiceName = bookData.spaceOrServiceName || b.space_name || "مساحة عمل / خدمة";
            bookData.bookingDate = bookData.bookingDate || b.start_time || new Date().toISOString().split("T")[0];
            bookData.totalAmount = bookData.totalAmount ?? b.total_price ?? 0;
            recipient = recipient || b.customer_email;
          }
        }
        if (!recipient) {
          throw new Error("بريد المستلم غير محدد لإرسال تأكيد الحجز");
        }
        const rendered = renderBookingTemplate({
          bookingNumber: bookData.bookingNumber || payload.entityId || "BK-000",
          customerName: bookData.customerName || "العميل المحترم",
          spaceOrServiceName: bookData.spaceOrServiceName || "المساحة / الخدمة",
          bookingDate: bookData.bookingDate || new Date().toLocaleDateString("ar-OM"),
          bookingTime: bookData.bookingTime,
          totalAmount: bookData.totalAmount,
          companyName: bookData.companyName,
        });
        subject = rendered.subject;
        htmlContent = rendered.html;
        break;
      }

      case "GENERAL_NOTIFICATION": {
        const notifData = payload.data || {};
        if (!recipient) {
          throw new Error("البريد الإلكتروني للمستلم مطلوب للإشعارات العامة");
        }
        const rendered = renderNotificationTemplate({
          title: notifData.title || "إشعار من النظام",
          message: notifData.message || "",
          recipientName: notifData.recipientName,
          actionUrl: notifData.actionUrl,
          actionText: notifData.actionText,
          companyName: notifData.companyName,
        });
        subject = rendered.subject;
        htmlContent = rendered.html;
        break;
      }

      case "PASSWORD_RESET": {
        const pwdData = payload.data || {};
        if (!recipient) {
          throw new Error("بريد المستلم مطلوب لإرسال رابط إعادة تعيين كلمة المرور");
        }
        const rendered = renderPasswordResetTemplate({
          recipientName: pwdData.recipientName || "المستخدم المحترم",
          resetUrl: pwdData.resetUrl || `${Deno.env.get("APP_URL") || "https://erp.deshalbm.com"}/reset-password`,
          companyName: pwdData.companyName,
        });
        subject = rendered.subject;
        htmlContent = rendered.html;
        break;
      }

      case "TEST_EMAIL": {
        if (!recipient) {
          throw new Error("يرجى تزويد عنوان بريد اختباري صحيح");
        }
        const rendered = renderTestTemplate({
          recipientEmail: recipient,
          senderEmail: defaultFrom,
          companyName: payload.data?.companyName,
        });
        subject = rendered.subject;
        htmlContent = rendered.html;
        break;
      }

      default:
        throw new Error(`نوع البريد المطلوب غير مدعوم: ${payload.type}`);
    }

    // 3. Insert PENDING record in email_logs
    const { data: logEntry, error: logErr } = await supabase
      .from("email_logs")
      .insert({
        company_id: companyId,
        recipient: recipient,
        email_type: payload.type,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        status: "PENDING",
        metadata: {
          requested_by_user_id: authenticatedUserId,
          subject: subject,
        },
      })
      .select("id")
      .single();

    const emailLogId = logEntry?.id;

    // 4. Handle EMAIL_ENABLED=false (Development/Mock Mode)
    if (!emailEnabled) {
      console.log(`[EMAIL_DISABLED] Mock email rendered for ${recipient}. Subject: "${subject}"`);
      if (emailLogId) {
        await supabase
          .from("email_logs")
          .update({
            status: "SENT",
            provider_message_id: `mock_disabled_${Date.now()}`,
            error_message: "EMAIL_ENABLED is set to false (Simulated delivery)",
            sent_at: new Date().toISOString(),
          })
          .eq("id", emailLogId);
      }
      return new Response(
        JSON.stringify({
          success: true,
          mock: true,
          message: "تم محاكاة إرسال البريد الإلكتروني بنجاح (EMAIL_ENABLED=false)",
          logId: emailLogId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      const errorMsg = "مفتاح RESEND_API_KEY غير متاح في بيئة السيرفر (Server Secret Missing)";
      if (emailLogId) {
        await supabase.from("email_logs").update({ status: "FAILED", error_message: errorMsg }).eq("id", emailLogId);
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Send Email via Server Secret RESEND_API_KEY
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: defaultFrom,
        to: [recipient],
        subject: subject,
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      const resendError = resendData.message || resendData.error?.message || `Resend Error (${resendRes.status})`;
      if (emailLogId) {
        await supabase
          .from("email_logs")
          .update({
            status: "FAILED",
            error_message: resendError,
          })
          .eq("id", emailLogId);
      }
      return new Response(
        JSON.stringify({ success: false, error: resendError, logId: emailLogId }),
        { status: resendRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Update email_logs status to SENT
    if (emailLogId) {
      await supabase
        .from("email_logs")
        .update({
          status: "SENT",
          provider_message_id: resendData.id,
          sent_at: new Date().toISOString(),
        })
        .eq("id", emailLogId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        logId: emailLogId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("send-email Edge Function error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "حدث خطأ غير متوقع أثناء معالجة البريد" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
