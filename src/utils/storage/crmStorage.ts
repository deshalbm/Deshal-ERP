/**
 * DESHAL ERP — CRM STORAGE ENGINE (LEADS, OPPORTUNITIES & ACTIVITIES)
 * 
 * Provides local storage persistence and initial demo seed data for CRM leads,
 * sales opportunities (kanban pipeline), and sales activity logs.
 */

import { CRMLead, CRMOpportunity, CRMActivityRecord } from "../../types/crm";

const LEADS_STORAGE_KEY = "rv_crm_leads_v1";
const OPPORTUNITIES_STORAGE_KEY = "rv_crm_opportunities_v1";
const ACTIVITIES_STORAGE_KEY = "rv_crm_activities_v1";

// Default seed data for initial leads
export const INITIAL_SEED_LEADS: CRMLead[] = [
  {
    id: "lead-1",
    title: "استفسار عن حجز مكتب خاص - 4 مقاعد",
    contactName: "سالم الكعبي",
    phone: "+968 99123456",
    email: "salem.kaabi@example.om",
    companyName: "شركة الرؤية للحلول الرقمية",
    source: "WEBSITE",
    status: "NEW",
    priority: "HIGH",
    assignedToName: "سارة الزجالي",
    estimatedValue: 1200,
    notes: "يرغب في عقد سنوي لمكتب مؤثث في فرع صحار",
    tags: ["مكتب خاص", "عقد سنوي"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "lead-2",
    title: "طلب استئجار قاعة اجتماعات للتدريب",
    contactName: "د. هدى الحوسنية",
    phone: "+968 95678901",
    email: "huda.hosni@training.om",
    companyName: "معهد التميز الإداري",
    source: "REFERRAL",
    status: "CONTACTED",
    priority: "MEDIUM",
    assignedToName: "أحمد المعمري",
    estimatedValue: 450,
    notes: "طلب أسعار قاعة ورش العمل لمدة 3 أيام متتالية",
    tags: ["قاعة اجتماعات", "تدريب"],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "lead-3",
    title: "اشتراك باقة عمل مرنة - 10 ساعات",
    contactName: "خالد الفارسي",
    phone: "+968 92345678",
    email: "khalid.farsi@freelance.om",
    companyName: "مستقل / تصميم جرافيك",
    source: "SOCIAL_MEDIA",
    status: "QUALIFIED",
    priority: "LOW",
    assignedToName: "فاطمة البلوشي",
    estimatedValue: 150,
    notes: "مهتم بالحصول على عنوان تجاري وخدمات استقبال",
    tags: ["باقة مرنة", "عنوان تجاري"],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Default seed data for initial sales opportunities (Kanban Pipeline)
export const INITIAL_SEED_OPPORTUNITIES: CRMOpportunity[] = [
  {
    id: "opp-1",
    leadId: "lead-3",
    customerName: "خالد الفارسي",
    title: "عقد باقة العمل المرنة السنوية",
    dealValue: 350,
    currency: "OMR",
    stage: "QUALIFICATION",
    probabilityPercent: 40,
    expectedCloseDate: new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10),
    assignedToName: "فاطمة البلوشي",
    notes: "تم إرسال العرض المالي الأولي",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "opp-2",
    customerName: "شركة الأفق للتطوير العقاري",
    title: "تأجير المساحة التجارية A-102",
    dealValue: 3600,
    currency: "OMR",
    stage: "PROPOSAL",
    probabilityPercent: 65,
    expectedCloseDate: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
    assignedToName: "سارة الزجالي",
    notes: "مناقشة بنود عقد الإيجار وتأمين الصيانة",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "opp-3",
    customerName: "المؤسسة العمانية للابتكار",
    title: "حجز قاعة الفعاليات الكبرى",
    dealValue: 850,
    currency: "OMR",
    stage: "NEGOTIATION",
    probabilityPercent: 85,
    expectedCloseDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    assignedToName: "أحمد المعمري",
    notes: "في انتظار التوقيع النهائي على مواصفات الضيافة الصوتية",
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "opp-4",
    customerName: "مجموعة الخليج للحلول اللوجستية",
    title: "عقد استئجار جناح إداري كامل",
    dealValue: 5400,
    currency: "OMR",
    stage: "WON",
    probabilityPercent: 100,
    expectedCloseDate: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    assignedToName: "سارة الزجالي",
    notes: "تم تحصيل الدفعة الأولى وإصدار السند بنجاح",
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// Default seed data for initial sales activity logs
export const INITIAL_SEED_ACTIVITIES: CRMActivityRecord[] = [
  {
    id: "act-crm-1",
    leadId: "lead-1",
    entityName: "سالم الكعبي",
    type: "CALL",
    title: "اتصال هاتفي استكشافي",
    notes: "تم التأكيد على الميزانية المطلوبة وموعد زيارة الموقع غداً",
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    performedByName: "سارة الزجالي",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "act-crm-2",
    opportunityId: "opp-2",
    entityName: "شركة الأفق للتطوير العقاري",
    type: "SITE_VISIT",
    title: "معاينة ميدانية للمساحة التجارية A-102",
    notes: "حضر المدير التنفيذي وأبدى ارتياحه للموقع والخدمات المساندة",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    performedByName: "سارة الزجالي",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

/**
 * Load CRM leads from localStorage with fallback to seed data
 */
export function loadCRMLeads(): CRMLead[] {
  if (typeof window === "undefined") return INITIAL_SEED_LEADS;
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse CRM leads from localStorage:", e);
  }
  return INITIAL_SEED_LEADS;
}

/**
 * Save CRM leads to localStorage
 */
export function saveCRMLeads(leads: CRMLead[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error("Failed to save CRM leads to localStorage:", e);
  }
}

/**
 * Load CRM opportunities from localStorage with fallback to seed data
 */
export function loadCRMOpportunities(): CRMOpportunity[] {
  if (typeof window === "undefined") return INITIAL_SEED_OPPORTUNITIES;
  try {
    const raw = localStorage.getItem(OPPORTUNITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse CRM opportunities from localStorage:", e);
  }
  return INITIAL_SEED_OPPORTUNITIES;
}

/**
 * Save CRM opportunities to localStorage
 */
export function saveCRMOpportunities(opportunities: CRMOpportunity[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OPPORTUNITIES_STORAGE_KEY, JSON.stringify(opportunities));
  } catch (e) {
    console.error("Failed to save CRM opportunities to localStorage:", e);
  }
}

/**
 * Load CRM activity records from localStorage with fallback to seed data
 */
export function loadCRMActivities(): CRMActivityRecord[] {
  if (typeof window === "undefined") return INITIAL_SEED_ACTIVITIES;
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse CRM activities from localStorage:", e);
  }
  return INITIAL_SEED_ACTIVITIES;
}

/**
 * Save CRM activity records to localStorage
 */
export function saveCRMActivities(activities: CRMActivityRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  } catch (e) {
    console.error("Failed to save CRM activities to localStorage:", e);
  }
}
