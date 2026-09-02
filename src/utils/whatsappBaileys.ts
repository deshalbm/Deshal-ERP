import {
  WhatsAppSettings,
  WhatsAppMessageLog,
  WhatsAppConnectionStatus,
  BaileysServerPreset
} from "../types";
import { saveWhatsAppLog } from "./storage";

export interface PhoneFormatResult {
  raw: string;
  cleanDigits: string;
  internationalNumber: string;
  jid: string;
  isValid: boolean;
  displayFormatted: string;
}

/**
 * Normalizes phone numbers with international country code logic
 */
export function formatInternationalPhoneNumber(
  rawPhone: string,
  defaultCountryCode = "968"
): PhoneFormatResult {
  if (!rawPhone) {
    return {
      raw: "",
      cleanDigits: "",
      internationalNumber: "",
      jid: "",
      isValid: false,
      displayFormatted: ""
    };
  }

  // Remove spaces, dashes, parens, +, etc.
  let digits = rawPhone.replace(/[^0-9]/g, "");

  // If starts with 00, trim leading zeroes
  if (digits.startsWith("00")) {
    digits = digits.substring(2);
  }

  // If local Oman number (8 digits, starting with 7, 9, 2), prepend 968
  if (digits.length === 8 && defaultCountryCode === "968") {
    digits = "968" + digits;
  } else if (digits.length === 9 && defaultCountryCode === "966" && digits.startsWith("5")) {
    // Saudi (9 digits starting with 5)
    digits = "966" + digits;
  } else if (digits.length === 9 && defaultCountryCode === "971" && digits.startsWith("5")) {
    // UAE
    digits = "971" + digits;
  } else if (digits.length <= 10 && !digits.startsWith(defaultCountryCode) && defaultCountryCode) {
    // If not matching but shorter than standard international length, prepend default country code
    digits = defaultCountryCode + digits;
  }

  const isValid = digits.length >= 8 && digits.length <= 15;
  const jid = `${digits}@s.whatsapp.net`;
  
  // Format for pretty display
  let displayFormatted = `+${digits}`;
  if (digits.startsWith("968") && digits.length === 11) {
    displayFormatted = `+968 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  } else if (digits.startsWith("966") && digits.length === 12) {
    displayFormatted = `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  return {
    raw: rawPhone,
    cleanDigits: digits,
    internationalNumber: digits,
    jid,
    isValid,
    displayFormatted
  };
}

/**
 * Helper to build request headers
 */
function buildHeaders(settings: WhatsAppSettings): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };

  if (settings.apiKey?.trim()) {
    const key = settings.apiKey.trim();
    headers["Authorization"] = key.startsWith("Bearer ") ? key : `Bearer ${key}`;
    headers["apikey"] = key;
    headers["x-api-key"] = key;
  }

  return headers;
}

/**
 * Normalizes baseUrl without trailing slash
 */
function cleanBaseUrl(url: string): string {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "");
}

/**
 * Sends text message directly through the self-hosted Baileys server
 */
export async function sendBaileysTextMessage(
  settings: WhatsAppSettings,
  recipientPhone: string,
  messageText: string,
  meta?: {
    recipientName?: string;
    voucherNumber?: string;
    messageType?: WhatsAppMessageLog["messageType"];
    sentBy?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string; rawResponse?: any }> {
  const baseUrl = cleanBaseUrl(settings.serverUrl);
  if (!baseUrl) {
    return { success: false, error: "عنوان سرفر WhatsApp Baileys غير محدد في الإعدادات." };
  }

  const phoneInfo = formatInternationalPhoneNumber(recipientPhone, settings.defaultCountryCode || "968");
  if (!phoneInfo.isValid) {
    return { success: false, error: `رقم الهاتف غير صالح: ${recipientPhone}` };
  }

  const sessionId = settings.sessionId?.trim() || "deshal-erp";
  const headers = buildHeaders(settings);
  const preset = settings.serverPreset || "generic_baileys";

  let endpointUrl = "";
  let payload: any = {};

  if (preset === "generic_baileys") {
    endpointUrl = `${baseUrl}/message/send-text`;
    payload = {
      sessionId,
      to: phoneInfo.cleanDigits,
      jid: phoneInfo.jid,
      number: phoneInfo.cleanDigits,
      message: messageText,
      text: messageText
    };
  } else if (preset === "evolution_api") {
    endpointUrl = `${baseUrl}/message/sendText/${sessionId}`;
    payload = {
      number: phoneInfo.cleanDigits,
      options: {
        delay: 1200,
        presence: "composing"
      },
      textMessage: {
        text: messageText
      },
      text: messageText
    };
  } else if (preset === "baileys_http") {
    endpointUrl = `${baseUrl}/chats/send?id=${encodeURIComponent(sessionId)}`;
    payload = {
      receiver: phoneInfo.jid,
      message: { text: messageText }
    };
  } else if (preset === "wppconnect") {
    endpointUrl = `${baseUrl}/api/${sessionId}/send-message`;
    payload = {
      phone: phoneInfo.cleanDigits,
      message: messageText
    };
  } else {
    // Custom endpoint
    const customEndpoint = settings.endpoints?.sendText || "/message/send-text";
    endpointUrl = customEndpoint.startsWith("http") ? customEndpoint : `${baseUrl}${customEndpoint.startsWith("/") ? "" : "/"}${customEndpoint}`;
    payload = {
      sessionId,
      jid: phoneInfo.jid,
      to: phoneInfo.cleanDigits,
      number: phoneInfo.cleanDigits,
      message: messageText,
      text: messageText
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let resJson: any = null;
    try {
      resJson = await res.json();
    } catch {
      resJson = { status: res.status, statusText: res.statusText };
    }

    if (res.ok && (resJson?.success !== false && resJson?.error !== true)) {
      const messageId = resJson?.id || resJson?.key?.id || resJson?.messageId || `msg-${Date.now()}`;
      
      // Save log
      saveWhatsAppLog({
        id: `walog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        recipientPhone: phoneInfo.displayFormatted,
        recipientName: meta?.recipientName || "العميل",
        messageType: meta?.messageType || "RECEIPT",
        voucherNumber: meta?.voucherNumber,
        status: "DELIVERED",
        messageSnippet: messageText.slice(0, 140),
        sentBy: meta?.sentBy || "منظومة ديشال ERP",
        method: "BAILEYS_API"
      });

      return { success: true, messageId, rawResponse: resJson };
    } else {
      const errMsg = resJson?.message || resJson?.error || resJson?.details || `فشل الإرسال (رمز الخطأ: ${res.status})`;
      
      saveWhatsAppLog({
        id: `walog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        recipientPhone: phoneInfo.displayFormatted,
        recipientName: meta?.recipientName || "العميل",
        messageType: meta?.messageType || "RECEIPT",
        voucherNumber: meta?.voucherNumber,
        status: "FAILED",
        errorDetails: String(errMsg),
        messageSnippet: messageText.slice(0, 140),
        sentBy: meta?.sentBy || "منظومة ديشال ERP",
        method: "BAILEYS_API"
      });

      return { success: false, error: errMsg, rawResponse: resJson };
    }
  } catch (err: any) {
    const errorMsg = err.name === "AbortError" 
      ? "انتهت مهلة الاتصال بسرفر Baileys (Timeout 20s)."
      : err.message || "تعذر الاتصال بسرفر WhatsApp Baileys. يرجى التحقق من تشغيل السرفر واتصال الشبكة.";
    
    saveWhatsAppLog({
      id: `walog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      recipientPhone: phoneInfo.displayFormatted,
      recipientName: meta?.recipientName || "العميل",
      messageType: meta?.messageType || "RECEIPT",
      voucherNumber: meta?.voucherNumber,
      status: "FAILED",
      errorDetails: errorMsg,
      messageSnippet: messageText.slice(0, 140),
      sentBy: meta?.sentBy || "منظومة ديشال ERP",
      method: "BAILEYS_API"
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Checks Baileys Session Connection Status
 */
export async function checkBaileysStatus(
  settings: WhatsAppSettings
): Promise<{
  status: WhatsAppConnectionStatus;
  details?: string;
  qrCodeData?: string;
  sessionName?: string;
  phoneConnected?: string;
  latencyMs?: number;
}> {
  const baseUrl = cleanBaseUrl(settings.serverUrl);
  if (!baseUrl) {
    return { status: "DISCONNECTED", details: "لم يتم ضبط عنوان سرفر Baileys بعد." };
  }

  const sessionId = settings.sessionId?.trim() || "deshal-erp";
  const headers = buildHeaders(settings);
  const preset = settings.serverPreset || "generic_baileys";

  let statusUrl = "";
  if (preset === "generic_baileys") {
    statusUrl = `${baseUrl}/session/status/${sessionId}`;
  } else if (preset === "evolution_api") {
    statusUrl = `${baseUrl}/instance/connectionState/${sessionId}`;
  } else if (preset === "baileys_http") {
    statusUrl = `${baseUrl}/chats/status?id=${encodeURIComponent(sessionId)}`;
  } else if (preset === "wppconnect") {
    statusUrl = `${baseUrl}/api/${sessionId}/status-session`;
  } else {
    const customEndpoint = settings.endpoints?.checkStatus || `/session/status/${sessionId}`;
    statusUrl = customEndpoint.startsWith("http") ? customEndpoint : `${baseUrl}${customEndpoint.startsWith("/") ? "" : "/"}${customEndpoint}`;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(statusUrl, {
      method: "GET",
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        status: "DISCONNECTED",
        details: `السرفر استجاب برمز الخطأ ${res.status}: ${res.statusText}`,
        latencyMs
      };
    }

    const data = await res.json();
    
    // Normalize status from different Baileys API wrappers
    const stateStr = (data?.state || data?.status || data?.connection || data?.instance?.state || "").toString().toLowerCase();
    
    if (stateStr.includes("open") || stateStr.includes("connected") || stateStr.includes("islogged") || stateStr.includes("authenticated")) {
      return {
        status: "CONNECTED",
        details: "سلسلة الاتصال نشطة ومقترنة مع WhatsApp بنجاح.",
        phoneConnected: data?.user?.id || data?.phone || data?.number || data?.instance?.owner,
        sessionName: sessionId,
        latencyMs
      };
    }

    if (stateStr.includes("qr") || stateStr.includes("scan") || data?.qr || data?.qrcode) {
      return {
        status: "QR_READY",
        details: "الجلسة جاهزة للمسح، يرجى مسح رمز QR من تطبيق واتساب.",
        qrCodeData: data?.qr || data?.qrcode || data?.base64,
        sessionName: sessionId,
        latencyMs
      };
    }

    if (stateStr.includes("connecting") || stateStr.includes("pairing")) {
      return {
        status: "CONNECTING",
        details: "جاري الاتصال بسيرفرات WhatsApp...",
        sessionName: sessionId,
        latencyMs
      };
    }

    return {
      status: "DISCONNECTED",
      details: data?.message || "الجلسة غير متصلة، يمكنك بدء جلسة جديدة ومسح الرمز.",
      sessionName: sessionId,
      latencyMs
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      status: "DISCONNECTED",
      details: err.name === "AbortError" 
        ? "انتهت مهلة الاستجابة (Timeout 8s)." 
        : `تعذر الوصول للسرفر: ${err.message}`,
      latencyMs
    };
  }
}

/**
 * Fetches or initiates a QR Code for scanning
 */
export async function fetchBaileysQrCode(
  settings: WhatsAppSettings
): Promise<{ success: boolean; qrData?: string; error?: string; status?: WhatsAppConnectionStatus }> {
  const baseUrl = cleanBaseUrl(settings.serverUrl);
  if (!baseUrl) {
    return { success: false, error: "عنوان سرفر Baileys غير محدد." };
  }

  const sessionId = settings.sessionId?.trim() || "deshal-erp";
  const headers = buildHeaders(settings);
  const preset = settings.serverPreset || "generic_baileys";

  let qrUrl = "";
  if (preset === "generic_baileys") {
    qrUrl = `${baseUrl}/session/qr/${sessionId}`;
  } else if (preset === "evolution_api") {
    qrUrl = `${baseUrl}/instance/connect/${sessionId}`;
  } else if (preset === "baileys_http") {
    qrUrl = `${baseUrl}/chats/qr?id=${encodeURIComponent(sessionId)}`;
  } else if (preset === "wppconnect") {
    qrUrl = `${baseUrl}/api/${sessionId}/qrcode-session`;
  } else {
    const customEndpoint = settings.endpoints?.getQr || `/session/qr/${sessionId}`;
    qrUrl = customEndpoint.startsWith("http") ? customEndpoint : `${baseUrl}${customEndpoint.startsWith("/") ? "" : "/"}${customEndpoint}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(qrUrl, {
      method: "GET",
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, error: `فشل جلب الرمز (رمز الخطأ ${res.status})` };
    }

    const data = await res.json();
    const qrData = data?.qr || data?.qrcode || data?.base64 || data?.code || (typeof data === "string" ? data : "");

    if (qrData) {
      return { success: true, qrData, status: "QR_READY" };
    }

    if (data?.state === "open" || data?.status === "connected") {
      return { success: true, status: "CONNECTED" };
    }

    return { success: false, error: data?.message || "لم يتم العثور على رمز QR نشط في استجابة السرفر." };
  } catch (err: any) {
    return { success: false, error: err.message || "تعذر الاتصال بالسرفر لجلب رمز QR." };
  }
}

/**
 * Starts/Initializes a new Baileys Session on the server
 */
export async function startBaileysSession(
  settings: WhatsAppSettings
): Promise<{ success: boolean; qrData?: string; message?: string }> {
  const baseUrl = cleanBaseUrl(settings.serverUrl);
  if (!baseUrl) {
    return { success: false, message: "عنوان سرفر Baileys غير محدد." };
  }

  const sessionId = settings.sessionId?.trim() || "deshal-erp";
  const headers = buildHeaders(settings);
  const preset = settings.serverPreset || "generic_baileys";

  let startUrl = "";
  let bodyPayload: any = { sessionId };

  if (preset === "generic_baileys") {
    startUrl = `${baseUrl}/session/start`;
    bodyPayload = { sessionId };
  } else if (preset === "evolution_api") {
    startUrl = `${baseUrl}/instance/create`;
    bodyPayload = {
      instanceName: sessionId,
      token: settings.apiKey || "",
      qrcode: true
    };
  } else if (preset === "baileys_http") {
    startUrl = `${baseUrl}/chats/init?id=${encodeURIComponent(sessionId)}`;
  } else if (preset === "wppconnect") {
    startUrl = `${baseUrl}/api/${sessionId}/start-session`;
    bodyPayload = { waitQrCode: true };
  } else {
    const customEndpoint = settings.endpoints?.startSession || `/session/start`;
    startUrl = customEndpoint.startsWith("http") ? customEndpoint : `${baseUrl}${customEndpoint.startsWith("/") ? "" : "/"}${customEndpoint}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(startUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const qrData = data?.qr || data?.qrcode || data?.base64 || data?.instance?.qrcode?.base64;
      return {
        success: true,
        qrData,
        message: data?.message || "تم بدء الجلسة بنجاح على السرفر."
      };
    } else {
      return {
        success: false,
        message: data?.message || `فشل بدء الجلسة (رمز الخطأ ${res.status})`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "تعذر بدء الجلسة بسبب خطأ في الشبكة."
    };
  }
}

/**
 * Disconnects / Logs out Baileys Session
 */
export async function logoutBaileysSession(
  settings: WhatsAppSettings
): Promise<{ success: boolean; message?: string }> {
  const baseUrl = cleanBaseUrl(settings.serverUrl);
  if (!baseUrl) return { success: false, message: "عنوان سرفر Baileys غير محدد." };

  const sessionId = settings.sessionId?.trim() || "deshal-erp";
  const headers = buildHeaders(settings);
  const preset = settings.serverPreset || "generic_baileys";

  let logoutUrl = "";
  if (preset === "generic_baileys") {
    logoutUrl = `${baseUrl}/session/logout/${sessionId}`;
  } else if (preset === "evolution_api") {
    logoutUrl = `${baseUrl}/instance/logout/${sessionId}`;
  } else if (preset === "baileys_http") {
    logoutUrl = `${baseUrl}/chats/logout?id=${encodeURIComponent(sessionId)}`;
  } else if (preset === "wppconnect") {
    logoutUrl = `${baseUrl}/api/${sessionId}/logout-session`;
  } else {
    const customEndpoint = settings.endpoints?.logoutSession || `/session/logout/${sessionId}`;
    logoutUrl = customEndpoint.startsWith("http") ? customEndpoint : `${baseUrl}${customEndpoint.startsWith("/") ? "" : "/"}${customEndpoint}`;
  }

  try {
    const res = await fetch(logoutUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ sessionId })
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: data?.message || (res.ok ? "تم إنهاء الجلسة وتسجيل الخروج بنجاح." : "فشل تسجيل الخروج.")
    };
  } catch (err: any) {
    return { success: false, message: err.message || "خطأ أثناء محاولة تسجيل الخروج." };
  }
}

/**
 * Sample NodeJS + Baileys Express Server Template Code
 * for users deploying on their private VPS / Ubuntu / Docker
 */
export const BAILEYS_SERVER_NODE_SNIPPET = `/**
 * Deshal ERP - Baileys WhatsApp Gateway Server
 * Production REST API Gateway using @whiskeysockets/baileys
 * 
 * Instructions:
 * 1. mkdir deshal-wa-server && cd deshal-wa-server
 * 2. npm init -y
 * 3. npm install @whiskeysockets/baileys express cors qrcode pino
 * 4. node server.js
 */

import express from 'express';
import cors from 'cors';
import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const API_SECRET = process.env.API_SECRET || ''; // Set your secret token if desired

const sessions = new Map();
const qrCodes = new Map();
const sessionStates = new Map();

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  if (!API_SECRET) return next();
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-key'] || req.headers['apikey'];
  if (token !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};

async function initSession(sessionId) {
  if (sessions.has(sessionId)) return sessions.get(sessionId);

  const { state, saveCreds } = await useMultiFileAuthState(\`./auth_sessions/\${sessionId}\`);
  const { version } = await fetchLatestBaileysVersion();

  sessionStates.set(sessionId, 'connecting');

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr);
      qrCodes.set(sessionId, qrDataUrl);
      sessionStates.set(sessionId, 'qr_ready');
    }

    if (connection === 'open') {
      sessionStates.set(sessionId, 'open');
      qrCodes.delete(sessionId);
      console.log(\`✅ WhatsApp Session [\${sessionId}] Connected!\`);
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      sessionStates.set(sessionId, 'closed');
      sessions.delete(sessionId);
      if (shouldReconnect) {
        initSession(sessionId);
      }
    }
  });

  sessions.set(sessionId, sock);
  return sock;
}

// 1. Send Text Message
app.post('/message/send-text', authMiddleware, async (req, res) => {
  try {
    const { sessionId = 'deshal-erp', to, jid, message, text } = req.body;
    const msgText = message || text;
    const recipient = jid || (to ? \`\${to.replace(/[^0-9]/g, '')}@s.whatsapp.net\` : null);

    if (!recipient || !msgText) {
      return res.status(400).json({ error: 'Missing recipient phone or message text' });
    }

    let sock = sessions.get(sessionId);
    if (!sock) {
      sock = await initSession(sessionId);
    }

    const state = sessionStates.get(sessionId);
    if (state !== 'open') {
      return res.status(503).json({ error: 'WhatsApp session is not connected yet. Please scan QR.' });
    }

    const sent = await sock.sendMessage(recipient, { text: msgText });
    res.json({ success: true, messageId: sent.key.id, timestamp: sent.messageTimestamp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Check Session Status
app.get('/session/status/:sessionId', authMiddleware, (req, res) => {
  const { sessionId } = req.params;
  const state = sessionStates.get(sessionId) || 'disconnected';
  const qr = qrCodes.get(sessionId);
  res.json({
    sessionId,
    state,
    status: state === 'open' ? 'connected' : state,
    qr: qr || null
  });
});

// 3. Get QR Code
app.get('/session/qr/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params;
  let qr = qrCodes.get(sessionId);
  if (!qr) {
    await initSession(sessionId);
    qr = qrCodes.get(sessionId);
  }
  res.json({ sessionId, qr: qr || null, status: sessionStates.get(sessionId) || 'connecting' });
});

// 4. Start Session
app.post('/session/start', authMiddleware, async (req, res) => {
  const { sessionId = 'deshal-erp' } = req.body;
  await initSession(sessionId);
  res.json({ success: true, message: 'Session initialization triggered' });
});

// 5. Logout Session
app.post('/session/logout/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params;
  const sock = sessions.get(sessionId);
  if (sock) {
    await sock.logout();
    sessions.delete(sessionId);
    sessionStates.set(sessionId, 'logged_out');
  }
  res.json({ success: true, message: 'Session logged out' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Deshal ERP Baileys WhatsApp Gateway listening on port \${PORT}\`);
});
`;

export const DOCKER_COMPOSE_SNIPPET = `version: '3.8'

services:
  baileys-whatsapp:
    image: node:20-alpine
    container_name: deshal_erp_whatsapp
    working_dir: /app
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - API_SECRET=your_super_secret_token_123
    volumes:
      - ./auth_sessions:/app/auth_sessions
      - ./server.js:/app/server.js
      - ./package.json:/app/package.json
    command: sh -c "npm install && node server.js"
    restart: unless-stopped
`;
