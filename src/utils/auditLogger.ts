import { AuditLogEntry, AuditAction, AuditModule } from "../types";

const STORAGE_KEY = "rv_studio_audit_logs";

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-08-25T14:35:10.000Z",
    action: "CREATE",
    module: "VOUCHERS",
    entityId: "rv-gen-833",
    entityName: "RV-2026-0833",
    descriptionAr: "إصدار سند قبض جديد للعميل شركة الدليل الشامل بمبلغ 2,000.000 ر.ع.",
    descriptionEn: "Created new receipt voucher RV-2026-0833 for Comprehensive Guide Co. (2,000.000 OMR)",
    details: "تركيب الكاميرات والشاشات التفاعلية الذكية - تحويل بنكي بنك ظفار",
    performedByName: "سعيد بن راشد الشحي",
    performedByRole: "المدير التنفيذي العام",
    performedByEmployeeId: "emp-1",
    branchName: "فرع صحار الرئيسي"
  },
  {
    id: "log-2",
    timestamp: "2026-08-25T12:10:45.000Z",
    action: "EXPORT",
    module: "VOUCHERS",
    entityId: "rv-gen-833",
    entityName: "RV-2026-0833",
    descriptionAr: "تصدير سند القبض RV-2026-0833 إلى ملف PDF عالي الدقة",
    descriptionEn: "Exported receipt voucher RV-2026-0833 to high-definition PDF file",
    details: "تنسيق قالب عصري A4 مع تضمين الختم ورمز QR الإلكتروني",
    performedByName: "فاطمة بنت ناصر البلوشي",
    performedByRole: "رئيسة قسم المحاسبة والمالية",
    performedByEmployeeId: "emp-2",
    branchName: "فرع صحار الرئيسي"
  },
  {
    id: "log-3",
    timestamp: "2026-08-24T16:20:00.000Z",
    action: "CREATE",
    module: "VOUCHERS",
    entityId: "rv-gen-834",
    entityName: "RV-2026-0834",
    descriptionAr: "إصدار سند قبض RV-2026-0834 للعميل شركة الدليل الشامل بمبلغ 2,500.000 ر.ع.",
    descriptionEn: "Issued receipt voucher RV-2026-0834 for Comprehensive Guide Co. (2,500.000 OMR)",
    details: "دفعة أعمال التجهيزات التقنية والشبكات",
    performedByName: "سعيد بن راشد الشحي",
    performedByRole: "المدير التنفيذي العام",
    performedByEmployeeId: "emp-1",
    branchName: "فرع صحار الرئيسي"
  },
  {
    id: "log-4",
    timestamp: "2026-08-24T10:45:12.000Z",
    action: "TRANSFER",
    module: "INVENTORY",
    entityId: "tr-001",
    entityName: "TR-2026-0001",
    descriptionAr: "مناقلة مخزنية (15 كاميرا 4K + 5 لفات كابل Cat6) من فرع صحار إلى فرع مسقط",
    descriptionEn: "Inter-branch stock transfer (15x 4K Cameras + 5x Cat6 Rolls) from Sohar HQ to Muscat Branch",
    details: "إرسال شحنة دعم فني ومشاريع إلى مستودع مسقط الإقليمي",
    performedByName: "أحمد بن سالم المعمري",
    performedByRole: "مسؤول المستودعات والمخازن",
    performedByEmployeeId: "emp-3",
    branchName: "فرع صحار الرئيسي"
  },
  {
    id: "log-5",
    timestamp: "2026-08-23T15:18:22.000Z",
    action: "CREATE",
    module: "PURCHASES",
    entityId: "po-3",
    entityName: "PO-2026-0103",
    descriptionAr: "تسجيل فاتورة مشتريات PO-2026-0103 من مؤسسة الحلول الرقمية بمبلغ 1,823.250 ر.ع.",
    descriptionEn: "Recorded purchase order PO-2026-0103 from Digital Solutions (1,823.250 OMR)",
    details: "توريد سويتشات PoE وكابلات شبكات نحاسية مدرعة",
    performedByName: "فاطمة بنت ناصر البلوشي",
    performedByRole: "رئيسة قسم المحاسبة والمالية",
    performedByEmployeeId: "emp-2",
    branchName: "فرع صحار الرئيسي"
  },
  {
    id: "log-6",
    timestamp: "2026-08-22T11:05:30.000Z",
    action: "UPDATE",
    module: "CRM",
    entityId: "cust-1",
    entityName: "شركة الدليل الشامل",
    descriptionAr: "تحديث بيانات العميل شركة الدليل الشامل وإضافة نشاط متابعة جديد",
    descriptionEn: "Updated customer profile for Comprehensive Guide Co. & logged new meeting interaction",
    details: "تعديل الحد الائتماني وتحديث أرقام الاتصال",
    performedByName: "محمد بن علي الكندي",
    performedByRole: "مسؤول المبيعات وحلول المشاريع",
    performedByEmployeeId: "emp-4",
    branchName: "فرع مسقط - غلا"
  },
  {
    id: "log-7",
    timestamp: "2026-08-21T09:30:15.000Z",
    action: "SETTINGS_UPDATE",
    module: "SETTINGS",
    entityId: "settings-brand",
    entityName: "استوديو الهوية والأختام",
    descriptionAr: "تحديث بيانات الترويسة الرسمية والحسابات البنكية المعتمدة",
    descriptionEn: "Updated corporate identity headers, official stamp, and authorized bank accounts",
    details: "تأكيد رقم الآيبان لبنك ظفار وتعديل الشروط والأحكام الرسمية",
    performedByName: "سعيد بن راشد الشحي",
    performedByRole: "المدير التنفيذي العام",
    performedByEmployeeId: "emp-1",
    branchName: "فرع صحار الرئيسي"
  },
  {
    id: "log-8",
    timestamp: "2026-08-20T14:12:00.000Z",
    action: "PRINT",
    module: "VOUCHERS",
    entityId: "rv-gen-838",
    entityName: "RV-2026-0838",
    descriptionAr: "طباعة سند استلام RV-2026-0838 نموذج A4 رسمي",
    descriptionEn: "Printed official A4 receipt voucher RV-2026-0838",
    details: "طباعة نسختين لتقديمها للعميل مع الختم الرسمي",
    performedByName: "مريم بنت حمد المقبالي",
    performedByRole: "موظفة خدمة عملاء واستقبال",
    performedByEmployeeId: "emp-5",
    branchName: "فرع صحار الرئيسي"
  }
];

export function loadAuditLogs(): AuditLogEntry[] {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load audit logs from localStorage:", e);
  }
  saveAuditLogs(INITIAL_AUDIT_LOGS);
  return INITIAL_AUDIT_LOGS;
}

export function saveAuditLogs(logs: AuditLogEntry[]): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 1000))); // Keep last 1000 logs
    }
  } catch (e) {
    console.error("Failed to save audit logs to localStorage:", e);
  }
}

export function logActivity(
  entry: Omit<AuditLogEntry, "id" | "timestamp">,
  currentLogs?: AuditLogEntry[]
): AuditLogEntry[] {
  const existing = currentLogs || loadAuditLogs();
  const newLog: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString()
  };

  const updated = [newLog, ...existing];
  saveAuditLogs(updated);

  // Asynchronously push to Supabase audit_logs
  import('../lib/supabase/auditService').then((svc) => {
    svc.logToSupabase(newLog, '00000000-0000-0000-0000-000000000001').catch(console.error);
  }).catch(console.error);

  return updated;
}

export function clearAuditLogs(): AuditLogEntry[] {
  const empty: AuditLogEntry[] = [];
  saveAuditLogs(empty);
  return empty;
}

export function exportAuditLogsToCsv(logs: AuditLogEntry[]): void {
  if (!logs || logs.length === 0) return;

  const headers = [
    "ID",
    "Timestamp (ISO)",
    "Action",
    "Module",
    "Entity Name",
    "Description (AR)",
    "Description (EN)",
    "Performed By",
    "Role",
    "Branch",
    "Details"
  ];

  const escapeCsv = (val: string | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map((log) => [
    escapeCsv(log.id),
    escapeCsv(log.timestamp),
    escapeCsv(log.action),
    escapeCsv(log.module),
    escapeCsv(log.entityName || ""),
    escapeCsv(log.descriptionAr),
    escapeCsv(log.descriptionEn),
    escapeCsv(log.performedByName),
    escapeCsv(log.performedByRole || ""),
    escapeCsv(log.branchName || ""),
    escapeCsv(log.details || "")
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Audit_Activity_Logs_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
