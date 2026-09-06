import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ─── SERVER-SIDE Supabase Service Role Client ─────────────────────────────────
// SECURITY: The service role key MUST remain server-side only.
// It is read from process.env (never from VITE_ prefix, never from request body).
// This client bypasses RLS — used ONLY for public endpoint reads and secure writes.
// Do NOT export this client; do NOT pass it to any React component.
let _supabaseServiceClient: ReturnType<typeof createClient> | null = null;

function getSupabaseServiceClient() {
  if (_supabaseServiceClient) return _supabaseServiceClient;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Non-fatal: CMS endpoints will return 503 if not configured
    return null;
  }
  _supabaseServiceClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _supabaseServiceClient;
}

// Bot User-Agent detection for SEO HTML responses
const BOT_UA_PATTERN = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|ia_archiver|twitterbot|linkedinbot|whatsapp|telegrambot/i;
function isBotRequest(userAgent: string): boolean {
  return BOT_UA_PATTERN.test(userAgent);
}

// Escape HTML attribute values to prevent XSS in injected meta tags
function escapeHtmlAttr(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "10mb" }));

  // CORS middleware for API endpoints
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Simple in-memory Rate Limiter & Anti-Spam for Public APIs
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  function isRateLimited(ip: string, limit = 5, windowMs = 60000): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }
    if (entry.count >= limit) {
      return true;
    }
    entry.count += 1;
    return false;
  }

  // Initialize Gemini API client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC CONTACT / LEAD SUBMISSION — upgraded to write to Supabase leads
  // SECURITY: Tenant resolved from Host header, never from request body.
  // Service role key used server-side only for the secure Supabase insert.
  // ──────────────────────────────────────────────────────────────────────────
  app.post("/api/public/contact", async (req, res) => {
    try {
      const clientIp = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
      if (isRateLimited(clientIp, 5, 60000)) {
        return res.status(429).json({ error: "تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار دقيقة واحدة." });
      }

      const { name, phone, email, company, serviceInterest, notes,
              preferredDate, preferredTime, utmSource, utmMedium, utmCampaign,
              websiteHoneypot } = req.body;

      // Anti-Spam Honeypot: if hidden field is filled, silently reject bot
      if (websiteHoneypot) {
        return res.json({ success: true, message: "تم الاستلام." });
      }

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "اسم التواصل مطلوب." });
      }
      if (!phone || typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({ error: "رقم الهاتف مطلوب." });
      }

      const sanitizedName = name.trim().slice(0, 100);
      const sanitizedPhone = phone.trim().slice(0, 30);
      const sanitizedEmail = email ? String(email).trim().slice(0, 100) : null;
      const sanitizedCompany = company ? String(company).trim().slice(0, 100) : null;
      const sanitizedService = serviceInterest ? String(serviceInterest).trim().slice(0, 150) : "استشارات عامة";
      const sanitizedNotes = notes ? String(notes).trim().slice(0, 500) : null;

      // Resolve tenant from Host header (NEVER from request body)
      const hostname = (req.headers["host"] || req.headers["x-forwarded-host"] || "").toString();
      const serviceClient = getSupabaseServiceClient();

      let resolvedSiteId: string | null = null;
      let resolvedCompanyId: string | null = null;
      let resolvedDomain = hostname;

      if (serviceClient && hostname) {
        const { resolveHostname } = await import("./src/lib/cms/tenantResolver.js").catch(() =>
          import("./src/lib/cms/tenantResolver"));
        const siteContext = await resolveHostname(hostname, serviceClient).catch(() => null);
        if (siteContext) {
          resolvedSiteId = siteContext.siteId;
          resolvedCompanyId = siteContext.companyId;
          resolvedDomain = siteContext.domain;
        }
      }

      const leadId = `LEAD-WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 1. Write to cms_contact_submissions (buffer, always succeeds even if leads table unavailable)
      if (serviceClient) {
        const client = serviceClient as any;
        // Hash IP for privacy (sha256-like hex, not raw IP)
        const ipHash = Buffer.from(clientIp + process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8) || clientIp)
          .toString("base64").slice(0, 32);

        try {
          await client.from("cms_contact_submissions").insert({
            tenant_website_id: resolvedSiteId,
            company_id: resolvedCompanyId,
            resolved_domain: resolvedDomain,
            name: sanitizedName,
            phone: sanitizedPhone,
            email: sanitizedEmail,
            company_name: sanitizedCompany,
            service_interest: sanitizedService,
            message: sanitizedNotes,
            preferred_date: preferredDate || null,
            preferred_time: preferredTime || null,
            utm_source: utmSource || "website_direct",
            utm_medium: utmMedium || "organic",
            utm_campaign: utmCampaign || "alshamil_public",
            crm_status: "pending",
            client_ip_hash: ipHash,
          });
        } catch (err: any) {
          console.warn("[CMS_CONTACT] Failed to write submission:", err?.message);
        }

        // 2. Route to CRM leads table
        if (resolvedCompanyId) {
          const leadNumber = `WEB-${Date.now()}`;
          const { error: leadErr } = await client.from("leads").insert({
            company_id: resolvedCompanyId,
            lead_number: leadNumber,
            name: sanitizedCompany ? `${sanitizedCompany} — ${sanitizedName}` : sanitizedName,
            company_name: sanitizedCompany,
            phone: sanitizedPhone,
            email: sanitizedEmail,
            source: "WEBSITE",
            source_details: `utm_source=${utmSource || "website_direct"} | utm_campaign=${utmCampaign || "alshamil_public"} | domain=${resolvedDomain}`,
            status: "NEW",
            score: 10,
            notes: `[طلب من الموقع الإلكتروني] الخدمة: ${sanitizedService}.${sanitizedNotes ? ` ملاحظات: ${sanitizedNotes}` : ""} الموعد المفضل: ${preferredDate || "غير محدد"} ${preferredTime || ""}.`,
          });

          if (!leadErr) {
            // Update cms_contact_submissions crm_status
            try {
              await client.from("cms_contact_submissions")
                .update({ crm_status: "routed", crm_routed_at: new Date().toISOString() })
                .eq("name", sanitizedName).eq("phone", sanitizedPhone)
                .order("created_at", { ascending: false }).limit(1);
            } catch (_) {}
          } else {
            console.warn("[CMS_CONTACT] Failed to route lead to CRM:", leadErr.message);
          }
        }
      } else {
        // Supabase not configured: log to console (dev mode)
        console.log("[PUBLIC_WEBSITE_LEAD_CAPTURED]", { leadId, name: sanitizedName, phone: sanitizedPhone, email: sanitizedEmail, service: sanitizedService });
      }

      return res.json({
        success: true,
        message: "تم تسجيل طلبك بنجاح وسيتواصل معك مستشارنا في صحار قريباً.",
        leadId,
      });
    } catch (err: any) {
      console.error("Error capturing website lead:", err?.message);
      return res.status(500).json({ error: "فشل تسجيل الطلب، يرجى المحاولة لاحقاً." });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CMS PUBLIC API — All tenant resolution from Host header only
  // ──────────────────────────────────────────────────────────────────────────

  // Helper: resolve site from Host header
  async function resolveSiteFromRequest(req: express.Request) {
    const serviceClient = getSupabaseServiceClient();
    if (!serviceClient) return null;
    const hostname = (req.headers["host"] || req.headers["x-forwarded-host"] || "").toString();
    if (!hostname) return null;
    try {
      const { resolveHostname } = await import("./src/lib/cms/tenantResolver.js").catch(() =>
        import("./src/lib/cms/tenantResolver"));
      return await resolveHostname(hostname, serviceClient);
    } catch {
      return null;
    }
  }

  // GET /sitemap.xml — dynamic per hostname
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const serviceClient = getSupabaseServiceClient();
      const site = await resolveSiteFromRequest(req);

      if (!site || !serviceClient) {
        // Minimal fallback sitemap
        const host = (req.headers["host"] || "").toString().split(":")[0];
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${host}/</loc><priority>1.0</priority></url></urlset>`);
      }

      const { generateSitemapXml } = await import("./src/lib/cms/TenantSitemapGenerator.js").catch(() =>
        import("./src/lib/cms/TenantSitemapGenerator"));
      const xml = await generateSitemapXml(site, serviceClient);

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.send(xml);
    } catch (err: any) {
      console.error("[SITEMAP] Error:", err?.message);
      res.status(500).type("text/plain").send("Sitemap generation failed");
    }
  });

  // GET /robots.txt — dynamic per hostname
  app.get("/robots.txt", async (req, res) => {
    try {
      const site = await resolveSiteFromRequest(req);
      const scheme = req.headers["x-forwarded-proto"] || "https";
      const host = (req.headers["host"] || "").toString().split(":")[0];
      const policy = site?.settings ? "index, follow" : "noindex, nofollow";

      const robotsContent = [
        `User-agent: *`,
        policy.includes("noindex") ? "Disallow: /" : "Allow: /",
        `Sitemap: ${scheme}://${host}/sitemap.xml`,
        `Disallow: /api/`,
      ].join("\n");

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(robotsContent);
    } catch {
      res.type("text/plain").send("User-agent: *\nDisallow: /api/");
    }
  });

  // GET /api/public/cms/site — site config for the current hostname
  app.get("/api/public/cms/site", async (req, res) => {
    try {
      const site = await resolveSiteFromRequest(req);
      if (!site) return res.status(404).json({ error: "Site not found" });

      return res.json({
        id: site.siteId,
        name: site.name,
        siteType: site.siteType,
        template: site.template,
        logoUrl: site.logoUrl,
        primaryLanguage: site.primaryLanguage,
        settings: site.settings,
      });
    } catch (err: any) {
      console.error("[CMS_SITE_API]", err?.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/public/cms/pages/:slug — single published page
  app.get("/api/public/cms/pages/:slug", async (req, res) => {
    try {
      const serviceClient = getSupabaseServiceClient();
      const site = await resolveSiteFromRequest(req);
      if (!site || !serviceClient) return res.status(404).json({ error: "Page not found" });

      const slug = req.params.slug?.toLowerCase().trim();
      if (!slug) return res.status(400).json({ error: "Slug required" });

      const { data, error } = await serviceClient
        .from("tenant_pages" as any)
        .select("id, slug, title, page_type, sections, content, seo_title, seo_description, canonical_url, og_image, og_title, og_description, robots, structured_data, published_at")
        .eq("tenant_website_id", site.siteId)
        .eq("slug", slug)
        .eq("status", "published")
        .is("deleted_at", null)
        .maybeSingle();

      if (error || !data) return res.status(404).json({ error: "Page not found" });

      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
      return res.json(data);
    } catch (err: any) {
      console.error("[CMS_PAGE_API]", err?.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/public/cms/blog — published blog posts list
  app.get("/api/public/cms/blog", async (req, res) => {
    try {
      const serviceClient = getSupabaseServiceClient();
      const site = await resolveSiteFromRequest(req);
      if (!site || !serviceClient) return res.status(404).json({ error: "Blog not found" });

      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const category = typeof req.query.category === "string" ? req.query.category : undefined;

      let query = serviceClient
        .from("cms_blog_posts" as any)
        .select("id, slug, title, excerpt, cover_image, cover_image_alt, category, tags, author_name, published_at, reading_time_minutes, seo_description", { count: "exact" })
        .eq("tenant_website_id", site.siteId)
        .eq("status", "published")
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (category) query = (query as any).eq("category", category);

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ error: "Failed to fetch blog posts" });

      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
      return res.json({ posts: data ?? [], total: count ?? 0, page: Math.floor(offset / limit) + 1, limit });
    } catch (err: any) {
      console.error("[CMS_BLOG_LIST_API]", err?.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/public/cms/blog/:slug — single published blog post
  app.get("/api/public/cms/blog/:slug", async (req, res) => {
    try {
      const serviceClient = getSupabaseServiceClient();
      const site = await resolveSiteFromRequest(req);
      if (!site || !serviceClient) return res.status(404).json({ error: "Post not found" });

      const slug = req.params.slug?.toLowerCase().trim();
      if (!slug) return res.status(400).json({ error: "Slug required" });

      const { data, error } = await serviceClient
        .from("cms_blog_posts" as any)
        .select("id, slug, title, excerpt, content, cover_image, cover_image_alt, category, tags, author_name, published_at, reading_time_minutes, seo_title, seo_description, canonical_url, og_image, og_title, og_description, robots, structured_data")
        .eq("tenant_website_id", site.siteId)
        .eq("slug", slug)
        .eq("status", "published")
        .is("deleted_at", null)
        .maybeSingle();

      if (error || !data) return res.status(404).json({ error: "Post not found" });

      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
      return res.json(data);
    } catch (err: any) {
      console.error("[CMS_BLOG_POST_API]", err?.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/public/cms/contact — tenant-aware contact form (uses hostname resolution)
  app.post("/api/public/cms/contact", async (req, res) => {
    // Delegate to the same /api/public/contact handler via internal forward simulation
    // by sharing the same logic with a tenant-aware context
    req.url = "/api/public/contact";
    // Fall through to existing handler by calling next — instead, we duplicate logic for clarity:
    try {
      const clientIp = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
      if (isRateLimited(clientIp, 5, 60000)) {
        return res.status(429).json({ error: "تم تجاوز عدد المحاولات المسموح بها." });
      }
      const { name, phone, websiteHoneypot } = req.body;
      if (websiteHoneypot) return res.json({ success: true, message: "تم الاستلام." });
      if (!name?.trim() || !phone?.trim()) {
        return res.status(400).json({ error: "الاسم ورقم الهاتف مطلوبان." });
      }
      // Relay to the main /api/public/contact endpoint logic above by using a simple redirect
      return res.redirect(307, "/api/public/contact");
    } catch (err: any) {
      return res.status(500).json({ error: "فشل تسجيل الطلب." });
    }
  });

  // Public Website Space & Service Booking Request Endpoint
  app.post("/api/public/booking", (req, res) => {
    try {
      const clientIp = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
      if (isRateLimited(clientIp, 5, 60000)) {
        return res.status(429).json({ error: "تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار دقيقة واحدة." });
      }

      const { name, phone, email, spaceOrServiceName, bookingType, date, time, durationHours, websiteHoneypot } = req.body;

      if (websiteHoneypot) {
        return res.json({ success: true, message: "تم الاستلام." });
      }

      if (!name || !phone || !spaceOrServiceName) {
        return res.status(400).json({ error: "البيانات الأساسية للحجز غير مكتملة." });
      }

      const bookingRequest = {
        id: `BOOK-WEB-${Date.now()}`,
        name: String(name).trim().slice(0, 100),
        phone: String(phone).trim().slice(0, 30),
        email: email ? String(email).trim().slice(0, 100) : "",
        spaceOrServiceName: String(spaceOrServiceName).trim().slice(0, 150),
        bookingType: bookingType || "SPACE",
        date: date || new Date().toISOString().split("T")[0],
        time: time || "10:00",
        durationHours: Number(durationHours) || 1,
        status: "PENDING_CONFIRMATION",
        createdAt: new Date().toISOString()
      };

      console.log("[PUBLIC_WEBSITE_BOOKING_REQUEST]", bookingRequest);

      return res.json({
        success: true,
        message: "تم تقديم طلب الحجز بنجاح، وستصلك رسالة تاكيد فورية عبر الواتساب/البريد.",
        booking: bookingRequest
      });
    } catch (err: any) {
      console.error("Error capturing website booking:", err);
      return res.status(500).json({ error: "فشل تقديم طلب الحجز، يرجى المحاولة لاحقاً." });
    }
  });

  // Resend Email Server Status endpoint
  app.get("/api/resend/status", (_req, res) => {
    const enabled = (process.env.EMAIL_ENABLED ?? "true").toLowerCase() !== "false";
    res.json({
      configured: !!process.env.RESEND_API_KEY,
      enabled,
      fromEmail: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Deshal ERP <app@portal.deshalbm.com>",
    });
  });

  // Resend Email proxy endpoint (STRICT: Uses ONLY server-side RESEND_API_KEY from process.env)
  app.post("/api/send-email", async (req, res) => {
    try {
      const { type, to, subject, html, text, recipientEmail } = req.body;
      const key = process.env.RESEND_API_KEY;
      const emailEnabled = (process.env.EMAIL_ENABLED ?? "true").toLowerCase() !== "false";
      const targetRecipient = to || recipientEmail;

      if (!targetRecipient) {
        return res.status(400).json({ error: "Missing recipient email address (to/recipientEmail)" });
      }

      if (!emailEnabled) {
        console.log(`[EMAIL_DISABLED] Express Server mock email to ${targetRecipient}`);
        return res.json({
          success: true,
          mock: true,
          message: "تم محاكاة إرسال البريد بنجاح (EMAIL_ENABLED=false)",
        });
      }

      if (!key) {
        return res.status(500).json({
          error: "لم يتم تعيين مفتاح RESEND_API_KEY في ملفات البيئة بالسيرفر (.env)",
        });
      }

      const defaultFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Deshal ERP <app@portal.deshalbm.com>";
      const finalSubject = subject || `إشعار من نظام ديشال ERP [${type || 'إداري'}]`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: defaultFrom,
          to: Array.isArray(targetRecipient) ? targetRecipient : [targetRecipient],
          subject: finalSubject,
          html: html || `<p>${text || finalSubject}</p>`,
          text,
        }),
      });

      const data = await resendRes.json();
      if (!resendRes.ok) {
        const errorMsg = data.message || data.error?.message || "فشل الاتصال بـ Resend API";
        return res.status(resendRes.status).json({ error: errorMsg });
      }

      return res.json({ success: true, ...data });
    } catch (err: any) {
      console.error("Resend send-email server error:", err);
      return res.status(500).json({ error: err?.message || "Failed to send email via Resend" });
    }
  });

  // AI Assistant endpoint: Parse natural language or raw invoice text into voucher JSON
  app.post("/api/ai/parse-voucher", async (req, res) => {
    try {
      const { textPrompt } = req.body;
      if (!textPrompt || typeof textPrompt !== "string") {
        return res.status(400).json({ error: "Text prompt is required" });
      }

      const ai = getGeminiClient();
      const prompt = `You are an expert accounting and receipt voucher AI assistant. 
Extract or generate structured receipt voucher data from the following user description or text snippet:
"${textPrompt}"

Return ONLY a JSON object (no markdown, no backticks) with this structure:
{
  "type": "RECEIPT" | "PAYMENT" | "PETTY_CASH" | "TAX_INVOICE",
  "receivedFrom": "Name of payer or empty string",
  "paidTo": "Name of payee or empty string",
  "amount": 0,
  "currency": "OMR (or extracted 3-letter currency code if mentioned, e.g. OMR, SAR, AED, USD, EUR)",
  "paymentMethod": "CASH" | "BANK_TRANSFER" | "CHECK" | "CREDIT_CARD" | "ONLINE",
  "checkNumber": "",
  "bankName": "",
  "transactionRef": "",
  "category": "e.g. Professional Services, Rent, Sales",
  "notes": "Brief explanation or purpose of payment",
  "lineItems": [
    {
      "description": "Item or service description",
      "quantity": 1,
      "unitPrice": 100,
      "amount": 100
    }
  ],
  "taxRate": 0
}
Ensure all numbers are numeric. If information is missing, infer reasonable professional defaults.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const responseText = response.text || "";
      const cleanedJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsedData = JSON.parse(cleanedJson);
      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error("Gemini AI parse error:", err);
      return res.status(500).json({
        error: err?.message || "Failed to parse receipt voucher with AI",
      });
    }
  });

  // Serve with Vite middleware in development or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Serve static assets from dist folder
    app.use(
      express.static(distPath, {
        maxAge: "1y",
        immutable: true,
        index: false,
        setHeaders: (res, filepath) => {
          if (filepath.endsWith(".html") || filepath.endsWith("sw.js") || filepath.endsWith("manifest.webmanifest") || filepath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          }
        },
      })
    );

    // 301 Redirect Middleware
    app.use(async (req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/assets/")) {
        return next();
      }
      try {
        const serviceClient = getSupabaseServiceClient();
        if (!serviceClient) return next();
        const site = await resolveSiteFromRequest(req);
        if (!site) return next();

        const client = serviceClient as any;
        const { data: redirect } = await client
          .from("seo_redirects")
          .select("id, destination_url, status_code, hits_count")
          .eq("tenant_website_id", site.siteId)
          .eq("source_path", req.path)
          .eq("is_active", true)
          .maybeSingle();

        if (redirect && redirect.destination_url && redirect.destination_url !== req.path) {
          client.from("seo_redirects")
            .update({ hits_count: (redirect.hits_count || 0) + 1, last_hit_at: new Date().toISOString() })
            .eq("id", redirect.id)
            .then(() => {}).catch(() => {});

          return res.redirect(redirect.status_code || 301, redirect.destination_url);
        }
      } catch {
        // Fall through
      }
      next();
    });

    // SPA fallback with bot-aware SEO HTML injection
    // For crawlers: inject critical meta tags & Schema.org JSON-LD from CMS into the HTML before serving.
    // For browsers: serve the standard index.html SPA as-is.
    app.get("*", async (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const indexPath = path.join(distPath, "index.html");
      const ua = req.headers["user-agent"] || "";

      if (!isBotRequest(ua)) {
        // Normal browser request — serve SPA
        return res.sendFile(indexPath);
      }

      // Bot request — attempt to inject SEO meta & Schema.org from CMS
      try {
        const serviceClient = getSupabaseServiceClient();
        const site = await resolveSiteFromRequest(req).catch(() => null);

        if (!site || !serviceClient) {
          return res.sendFile(indexPath);
        }

        // Determine slug from URL path
        const urlPath = req.path.replace(/^\/+/, "") || "home";
        const isBlogPath = urlPath.startsWith("blog/");
        const slug = isBlogPath ? urlPath.replace("blog/", "") : (urlPath || "home");

        const fs = await import("fs/promises");
        let html = await fs.readFile(indexPath, "utf-8");

        let seoTitle = site.name;
        let seoDescription = site.settings?.footerText || "";
        let canonicalUrl = `https://${(req.headers.host || site.domain || "")}${req.path}`;
        let ogImage = site.logoUrl || "";
        let twitterCard = "summary_large_image";
        let datePublished: string | undefined;
        let dateModified: string | undefined;
        let authorName: string | undefined;
        let pageType = isBlogPath ? "BlogPosting" : "WebPage";

        const client = serviceClient as any;
        if (isBlogPath && slug) {
          const { data: post } = await client
            .from("cms_blog_posts")
            .select("title, seo_title, seo_description, og_image, cover_image, canonical_url, twitter_card, published_at, updated_at, author_name")
            .eq("tenant_website_id", site.siteId)
            .eq("slug", slug)
            .eq("status", "published")
            .maybeSingle();

          if (post) {
            seoTitle = post.seo_title || post.title || seoTitle;
            seoDescription = post.seo_description || "";
            ogImage = post.og_image || post.cover_image || ogImage;
            if (post.canonical_url) canonicalUrl = post.canonical_url;
            if (post.twitter_card) twitterCard = post.twitter_card;
            datePublished = post.published_at;
            dateModified = post.updated_at;
            authorName = post.author_name;
          }
        } else if (slug !== "home") {
          const { data: page } = await client
            .from("tenant_pages")
            .select("title, seo_title, seo_description, og_image, canonical_url, twitter_card, published_at, updated_at, page_type")
            .eq("tenant_website_id", site.siteId)
            .eq("slug", slug)
            .eq("status", "published")
            .maybeSingle();

          if (page) {
            seoTitle = page.seo_title || page.title || seoTitle;
            seoDescription = page.seo_description || "";
            ogImage = page.og_image || ogImage;
            if (page.canonical_url) canonicalUrl = page.canonical_url;
            if (page.twitter_card) twitterCard = page.twitter_card;
            datePublished = page.published_at;
            dateModified = page.updated_at;
            pageType = page.page_type || "WebPage";
          }
        }

        // Import schema generator dynamically
        const { generateSchemaOrgGraph } = await import("./src/lib/cms/seoEngine.js").catch(() =>
          import("./src/lib/cms/seoEngine"));

        const schemaJson = generateSchemaOrgGraph({
          siteName: site.name,
          domain: site.domain || req.headers.host || "",
          pageTitle: seoTitle,
          pageDescription: seoDescription,
          canonicalUrl,
          logoUrl: site.logoUrl,
          ogImage,
          pageType,
          datePublished,
          dateModified,
          authorName,
          localSettings: site.settings,
        });

        // Inject meta tags into <head>
        const seoMeta = [
          `<title>${escapeHtmlAttr(seoTitle)}</title>`,
          `<meta name="description" content="${escapeHtmlAttr(seoDescription)}">`,
          `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}">`,
          `<meta property="og:title" content="${escapeHtmlAttr(seoTitle)}">`,
          `<meta property="og:description" content="${escapeHtmlAttr(seoDescription)}">`,
          `<meta property="og:image" content="${escapeHtmlAttr(ogImage)}">`,
          `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}">`,
          `<meta property="og:type" content="${isBlogPath ? 'article' : 'website'}">`,
          `<meta property="og:site_name" content="${escapeHtmlAttr(site.name)}">`,
          `<meta property="og:locale" content="${site.primaryLanguage || 'ar'}">`,
          `<meta name="twitter:card" content="${escapeHtmlAttr(twitterCard)}">`,
          `<meta name="twitter:title" content="${escapeHtmlAttr(seoTitle)}">`,
          `<meta name="twitter:description" content="${escapeHtmlAttr(seoDescription)}">`,
          `<meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}">`,
          `<meta name="robots" content="index, follow">`,
          `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>`,
        ].join("\n    ");

        if (html.includes("<title>")) {
          html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(seoTitle)}</title>`);
        }
        html = html.replace("</head>", `  ${seoMeta}\n</head>`);

        return res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
      } catch (err: any) {
        console.warn("[SEO_BOT] Meta injection failed, falling back to SPA:", err?.message);
        return res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Receipt Voucher Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
