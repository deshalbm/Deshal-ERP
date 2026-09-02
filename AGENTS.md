# Deshal ERP — Primary Agent Instructions

## Mission

You are the senior implementation agent for Deshal ERP. Improve the existing
product safely, incrementally, and measurably. This is an existing
React/TypeScript ERP application; do not treat it as a greenfield project.

## Current verified baseline

- Frontend: React 19 + TypeScript + Vite + Tailwind.
- Server: Express + TypeScript.
- AI: @google/genai via server-side GEMINI_API_KEY.
- Current persistence is predominantly browser localStorage through
  `src/utils/*Storage.ts` and `src/utils/storage.ts`.
- A Supabase sync utility exists, but it is not the same as a production
  backend/database architecture.
- Authentication/roles and audit logging exist in application code.
- Current modules/components include Home, POS, CRM/customer management,
  inventory, purchases, branches, HR/payroll/attendance, requests,
  accounting/general ledger, spaces, bookings, lease contracts, services,
  documents, help, onboarding, kiosk and navigation utilities.
- Existing CRM is primarily customer-centric. Leads, Opportunities, Pipelines
  and CRM activities are not yet established as a complete first-class CRM
  domain.

## Non-negotiable rules

1. Inspect before changing. Search for existing types, components, storage
   functions and business rules first.
2. Prefer reuse and refactoring over deletion or wholesale rewrites.
3. Never silently break existing behavior.
4. Never put authorization only in the frontend. Current architecture
   limitations must be explicitly identified before claiming enterprise-grade
   security.
5. Never put secrets, service-role keys or private credentials in client code or
   persisted browser storage.
6. Do not use mock data as a substitute for completed functionality.
7. Preserve TypeScript type safety; avoid `any` unless unavoidable and
   documented.
8. Every data model change must define ownership, relationships, validation,
   deletion behavior, migration/backfill strategy and audit requirements.
9. Financial posting must preserve double-entry invariants and traceability.
10. Never modify posted financial records destructively; use approved
    adjustment/reversal flows where applicable.
11. For a feature request, complete the smallest safe vertical slice: types ->
    persistence/API -> business rules -> UI -> permissions -> tests ->
    documentation.
12. Before completion, run the project validation commands that are available
    and report actual results.

## Mandatory execution loop

Understand -> Inspect -> Plan -> Implement -> Test -> Review -> Document ->
Report.

## Before implementation

Read `.agent/context/project-baseline.md`, `.agent/context/product.md`,
`.agent/context/terminology.md`, the relevant skill(s), and the relevant
workflow.

## Completion standard

A task is not complete because the UI renders. It must satisfy functional
acceptance criteria, preserve existing behavior, pass relevant checks, and
report changed files, tests, risks and follow-up work.

Feature Complete
=
Functional Implementation
+
Tests Passed
+
Security Verified
+
Acceptance Criteria Met
+
Documentation Reviewed
+
about.md Updated When Required

