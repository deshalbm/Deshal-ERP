import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "10mb" }));

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
          if (filepath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );

    // Return explicit 404 for missing asset bundles to avoid text/html MIME type errors
    app.get("/assets/*", (_req, res) => {
      res.status(404).type("text/plain").send("Asset not found");
    });

    // SPA fallback route for client-side navigation
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Receipt Voucher Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
