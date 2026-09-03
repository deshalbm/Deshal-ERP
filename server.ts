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

  // Resend Email proxy endpoint
  app.post("/api/send-email", async (req, res) => {
    try {
      const { apiKey, from, to, subject, html, text } = req.body;
      const key = apiKey || process.env.RESEND_API_KEY;

      if (!key) {
        return res.status(400).json({ error: "Resend API key is missing" });
      }

      if (!to || !subject || !html) {
        return res.status(400).json({ error: "Missing to, subject, or html body" });
      }

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from || "onboarding@resend.dev",
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text,
        }),
      });

      const data = await resendRes.json();
      if (!resendRes.ok) {
        return res.status(resendRes.status).json(data);
      }

      return res.json({ success: true, ...data });
    } catch (err: any) {
      console.error("Resend send-email error:", err);
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
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Receipt Voucher Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
