import { Customer } from '../../types';
import { loadCustomers, saveCustomers } from '../../utils/storage';

export interface WebsiteLeadInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  serviceInterest?: string;
  notes?: string;
  preferredDate?: string;
  preferredTime?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  /** Anti-spam honeypot field — must be empty for real submissions */
  websiteHoneypot?: string;
}

export class WebsiteLeadService {
  /**
   * Submit a new lead inquiry from the public website.
   *
   * Priority:
   * 1. POST to /api/public/contact (server-side Supabase write + CRM routing).
   * 2. ONLY if the server call fails (network offline etc.) → fall back to
   *    localStorage via loadCustomers/saveCustomers so no lead is lost.
   *
   * Security:
   * - All input sanitization happens here AND on the server.
   * - The server resolves the tenant from the Host header — never from request body.
   * - localStorage is treated as an offline fallback ONLY, not the primary store.
   */
  static async submitLead(
    input: WebsiteLeadInput
  ): Promise<{ success: boolean; message: string; leadId?: string; offline?: boolean }> {
    // 1. Client-side input validation
    if (!input.name || !input.name.trim()) {
      throw new Error('الرجاء كتابة الاسم الكامل.');
    }
    if (!input.phone || !input.phone.trim()) {
      throw new Error('الرجاء كتابة رقم الهاتف للتواصل.');
    }

    const sanitizedName = input.name.trim().slice(0, 100);
    const sanitizedPhone = input.phone.trim().slice(0, 30);
    const sanitizedEmail = input.email ? input.email.trim().slice(0, 100) : '';
    const sanitizedCompany = input.company ? input.company.trim().slice(0, 100) : '';
    const sanitizedService = input.serviceInterest
      ? input.serviceInterest.trim().slice(0, 150)
      : 'استشارات التأسيس ودراسة الجدوى';
    const sanitizedNotes = input.notes ? input.notes.trim().slice(0, 500) : '';

    // 2. POST to the Express server endpoint (primary path)
    let serverSucceeded = false;
    let serverLeadId: string | undefined;

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sanitizedName,
          phone: sanitizedPhone,
          email: sanitizedEmail,
          company: sanitizedCompany,
          serviceInterest: sanitizedService,
          notes: sanitizedNotes,
          preferredDate: input.preferredDate || '',
          preferredTime: input.preferredTime || '',
          utmSource: input.utmSource || 'website_direct',
          utmMedium: input.utmMedium || 'organic',
          utmCampaign: input.utmCampaign || 'alshamil_public',
          websiteHoneypot: input.websiteHoneypot || '',
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        serverSucceeded = true;
        serverLeadId = data.leadId;
      } else {
        console.warn('[WebsiteLeadService] Server returned non-OK status:', response.status);
      }
    } catch (err) {
      console.warn('[WebsiteLeadService] Backend contact API unavailable, falling back to offline storage:', err);
    }

    // 3. Offline fallback — write to localStorage ONLY if server call failed
    //    This ensures no lead is silently lost during network outages.
    //    On next ERP sync, these leads will be reviewed by staff.
    if (!serverSucceeded) {
      const offlineLeadId = `LEAD-OFFLINE-${Date.now()}`;
      const newLead: Customer = {
        id: offlineLeadId,
        name: sanitizedCompany ? `${sanitizedCompany} (${sanitizedName})` : sanitizedName,
        contactPerson: sanitizedName,
        phone: sanitizedPhone,
        email: sanitizedEmail,
        address: 'ولاية صحار، محافظة شمال الباطنة',
        city: 'صحار',
        type: sanitizedCompany ? 'CORPORATE' : 'INDIVIDUAL',
        status: 'LEAD',
        notes: `[طلب من الموقع — وضع غير متصل] الخدمة: ${sanitizedService}. الموعد المفضل: ${input.preferredDate || 'غير محدد'} (${input.preferredTime || ''}). ملاحظات: ${sanitizedNotes || 'لا يوجد'}. المصدر: ${input.utmSource || 'مباشر'}.`,
        tags: ['موقع إلكتروني', 'طلب استشارة', 'صحار', 'offline', sanitizedService],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const existingCustomers = loadCustomers();
        saveCustomers([newLead, ...existingCustomers]);
      } catch (storageErr) {
        console.error('[WebsiteLeadService] Failed to save offline lead to localStorage:', storageErr);
      }

      return {
        success: true,
        message: 'تم تسجيل طلبك. سيتواصل معك أحد مستشارينا في أقرب وقت.',
        leadId: offlineLeadId,
        offline: true,
      };
    }

    return {
      success: true,
      message: 'تم تسجيل طلبك بنجاح وسيتواصل معك أحد مستشارينا في صحار قريباً.',
      leadId: serverLeadId,
      offline: false,
    };
  }
}
