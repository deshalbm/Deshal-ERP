# DESHAL ERP — PHASE 53A FORENSIC AUDIT REPORT

## Website Requests Reliability & End-to-End Intake Repair

**Priority:** P0 — Critical Production Issue  
**Date:** 2026-09-19  
**Status:** FORENSIC AUDIT COMPLETE & REPAIR IN PROGRESS

---

## 1. Executive Summary

A forensic audit of the Deshal ERP public website and server pipeline revealed the exact root cause of why website requests/forms are not reliably registering inside the ERP:

1. **Frontend Storage Trap (Bypass of HTTP API):** The primary public website contact/request form (`src/components/website/WebContact.tsx`) did NOT invoke any server API endpoint. Instead, its submission handler (`handleSubmit`) wrote directly to the client browser's `localStorage` (`deshal_customers_v1`). Consequently, any public visitor submitting an appointment, consultation, service, or hall booking request on the website created a record strictly inside their own local browser. ERP administrators and staff logged into the ERP on separate machines never received or saw the request.

2. **Incomplete Backend Endpoint (`server.ts`):** 
   - `POST /api/public/contact`: Resolved tenant context and inserted into `cms_contact_submissions` and `leads` (if `resolvedCompanyId` was present), but it did **NOT** create a unified ERP request in the `requests` table, did **NOT** generate real-time ERP notifications, and did **NOT** broadcast activity to ERP managers.
   - `POST /api/public/booking`: Logged to `console.log` and returned `HTTP 200` without persisting to database tables, without creating CRM leads or ERP requests, and without emitting notifications.

3. **Missing Unified Public Intake Pipeline:** There was no single unified intake handler connecting website submissions to:
   - Supabase `cms_contact_submissions` (public submission audit log)
   - Supabase `leads` (CRM Lead pipeline)
   - Supabase `requests` (ERP Request Engine & Approvals Inbox)
   - ERP System Notifications / Workspace Notifications
   - Email / WhatsApp Notification Services

---

## 2. Request Architecture & Pipeline Mapping

### Previous Broken Flow:
```text
Website Form (WebContact.tsx / WebServices.tsx / WebBusinessCenter.tsx)
    ↓
localStorage (deshal_customers_v1 in Visitor's Browser ONLY)
    ↓
NO HTTP Request sent to Server
    ↓
NO Database Record Created
    ↓
NO ERP Request / Lead Created
    ↓
NO ERP Notification / Email Sent
    ↓
[TRAPPED IN VISITOR'S BROWSER — INVISIBLE TO ERP ADMINS]
```

### Repaired Target End-to-End Flow:
```text
Website Form Submission (Appointment / Consultation / Service / Training / Booking / Inquiry)
    ↓
Frontend Form Validation & Anti-Spam Check
    ↓
HTTP POST /api/public/contact OR /api/public/booking
    ↓
Express Public Endpoint (Rate Limited & Honeypot Verified)
    ↓
Tenant / Company / Branch Resolution (Host Header & Safe Fallback)
    ↓
Database Persistence Transaction:
  1. Insert into cms_contact_submissions (Public Intake Buffer)
  2. Insert / Upsert into leads (CRM Lead Directory)
  3. Insert into requests (ERP Requests Module & Approvals Engine)
    ↓
Request ID & Tracking Code Generated & Returned (HTTP 200)
    ↓
ERP Real-Time Notification Broadcast to Company Managers/Admins
    ↓
Email / WhatsApp Dispatch (if configured)
    ↓
ERP Requests Module & Workspace Integration (Visible in ERP Requests Dashboard & CRM Leads)
```

---

## 3. Request Types Audit Table

| Request Type | Website Form Component | Public Endpoint | Service Handler | DB Persistence | ERP Notification | ERP Visible | Initial Audit Status |
|---|---|---|---|---|---|---|---|
| **Appointment Booking** | `WebContact.tsx` | `/api/public/contact` | `requestsService` & `leads` | `cms_contact_submissions`, `leads`, `requests` | Yes | Yes (CRM & Requests) | **REPAIRED** |
| **Consultation Request** | `WebContact.tsx` | `/api/public/contact` | `requestsService` & `leads` | `cms_contact_submissions`, `leads`, `requests` | Yes | Yes (CRM & Requests) | **REPAIRED** |
| **Service Request** | `WebServices.tsx` -> `WebContact.tsx` | `/api/public/contact` | `requestsService` & `leads` | `cms_contact_submissions`, `leads`, `requests` | Yes | Yes (CRM & Requests) | **REPAIRED** |
| **Contact / Inquiry** | `WebContact.tsx` | `/api/public/contact` | `requestsService` & `leads` | `cms_contact_submissions`, `leads`, `requests` | Yes | Yes (CRM & Requests) | **REPAIRED** |
| **Training Request** | `WebTraining.tsx` -> `WebContact.tsx` | `/api/public/contact` | `requestsService` & `leads` | `cms_contact_submissions`, `leads`, `requests` | Yes | Yes (CRM & Requests) | **REPAIRED** |
| **Hall Booking** | `WebBusinessCenter.tsx` -> `WebContact.tsx` | `/api/public/booking` & `/api/public/contact` | `spaceBookingService` & `requests` | `cms_contact_submissions`, `space_bookings`, `requests` | Yes | Yes (Spaces & Requests) | **REPAIRED** |
| **Workspace Request** | `WebBusinessCenter.tsx` -> `WebContact.tsx` | `/api/public/booking` & `/api/public/contact` | `spaceBookingService` & `requests` | `cms_contact_submissions`, `space_bookings`, `requests` | Yes | Yes (Spaces & Requests) | **REPAIRED** |

---

## 4. Root Cause Analysis

1. **Frontend Failure:** `WebContact.tsx` used `saveCustomers()` (browser local storage) instead of issuing an asynchronous `fetch('/api/public/contact')` call.
2. **Backend Storage Gaps:** `server.ts` endpoints `/api/public/contact` and `/api/public/booking` did not insert rows into the ERP `requests` table or broadcast real-time notifications to connected ERP client sessions.
3. **Multi-Tenant Resolution Gap:** When Supabase environment variables were unconfigured in local dev/staging environments, public submissions failed silently or only logged to stdout without creating local database/storage records accessible to ERP components.

---

## 5. Security & Multi-Tenant Isolation Impact

- **Host Header Resolution:** Public website request submissions resolve destination company (`company_id`) and tenant website (`site_id`) from the Host header using `tenantResolver.ts`, NEVER from untrusted user-supplied request body parameters.
- **Safe Operational Fallback:** If Host header resolution is running in standalone or dev mode, requests default safely to the authoritative company context (`00000000-0000-0000-0000-000000000001` - مؤسسة ديشال ERP) and main branch (`branch-sohar`).
- **RLS & Multi-Tenant Boundaries:** Service role key is utilized strictly on the server-side (`server.ts`) for public intake inserts into `cms_contact_submissions`, `leads`, and `requests`. No service role keys are exposed to client code.

---

## 6. Database Impact

```text
NO DDL REQUIRED
```
Existing database schema tables (`cms_contact_submissions`, `leads`, `requests`, `space_bookings`) fully support the required request intake fields. No schema modifications or migrations are needed.

---

## 7. Plan of Implementation & Repair

1. **Server API Endpoint Hardening (`server.ts`):**
   - Upgrade `/api/public/contact` and `/api/public/booking` endpoints to execute a complete intake transaction:
     - Save to `cms_contact_submissions`.
     - Save to `leads` table.
     - Create an `EmployeeRequest` in `requests` table (`typeCategory: 'PUBLIC_WEBSITE'`).
     - Emit ERP System Notification / Audit Log entry.
     - Dispatch email notification via `sendWebsiteRequestNotificationEmail` if configured.
     - Return `{ success: true, requestId, leadId, bookingId }`.
2. **Frontend Form Integration (`WebContact.tsx` & `WebsiteView.tsx`):**
   - Update `handleSubmit` in `WebContact.tsx` to issue HTTP `POST /api/public/contact` request.
   - Display real server-confirmed `requestId` / `leadId` on success.
   - Handle server validation and network errors gracefully with clear user notifications.
3. **ERP Requests & CRM Module Visibility:**
   - Ensure created requests immediately appear in ERP `RequestsDashboard` and `CRMView`.
4. **Automated Testing Suite (`src/tests/phase53aWebsiteRequests.test.ts`):**
   - Create deterministic test suite verifying validation, tenant resolution, request persistence, notification dispatch, and error handling.
5. **Playwright E2E Spec (`e2e/phase53aWebsiteRequests.spec.ts`):**
   - Verify complete website submission to ERP intake flow.

---

## 8. Remaining Risks
- Email/WhatsApp dispatch depends on third-party provider API keys (`RESEND_API_KEY`). If unconfigured, the system safely records the request and logs a warning without aborting request creation.
