import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Phase 53A Website Requests Reliability & Intake E2E', () => {

  test('1. Verify root application load and public website view accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('2. Public website contact form submission issues HTTP POST /api/public/contact and receives tracking reference', async ({ request }) => {
    const contactPayload = {
      name: 'اختبار صحار الاتصال',
      phone: '+96891234567',
      email: 'sohar.test@deshalbm.com',
      company: 'مؤسسة صحار التجارية',
      serviceInterest: 'استشارات وتأجير مساحات',
      notes: 'طلب توضيح خطط الأسعار والخدمات المتاحة في صحار'
    };

    const response = await request.post('/api/public/contact', {
      data: contactPayload,
      headers: {
        'Host': 'localhost:3000'
      }
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.requestId).toContain('REQ-WEB-');
    expect(json.leadId).toContain('LEAD-WEB-');
    expect(json.correlationId).toContain('req_corr_');
  });

  test('3. Public website contact form payload validation rejects missing required phone field', async ({ request }) => {
    const invalidPayload = {
      name: 'مستخدم بدون هاتف',
      email: 'no-phone@example.com'
    };

    const response = await request.post('/api/public/contact', {
      data: invalidPayload
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('رقم الهاتف مطلوب.');
  });

  test('4. Anti-spam honeypot field triggers silent successful response without creating queue items', async ({ request }) => {
    const botPayload = {
      name: 'Spam Bot',
      phone: '+1555000111',
      websiteHoneypot: 'filled_by_automated_bot'
    };

    const response = await request.post('/api/public/contact', {
      data: botPayload
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.message).toBe('تم الاستلام.');
    expect(json.requestId).toBeUndefined();
  });

  test('5. Public website booking endpoint accepts space/service reservation request', async ({ request }) => {
    const bookingPayload = {
      name: 'سالم الكندي',
      phone: '+96899887711',
      email: 'salim@example.com',
      spaceOrServiceName: 'قاعة الاجتماعات الفاخرة - صحار',
      bookingType: 'SPACE',
      date: '2026-10-01',
      time: '14:00',
      durationHours: 2
    };

    const response = await request.post('/api/public/booking', {
      data: bookingPayload
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.booking).toBeDefined();
    expect(json.booking.id).toContain('BOOK-WEB-');
    expect(json.booking.spaceOrServiceName).toBe('قاعة الاجتماعات الفاخرة - صحار');
  });

});
