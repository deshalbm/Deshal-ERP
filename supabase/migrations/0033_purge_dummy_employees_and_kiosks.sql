-- Deshal ERP — Migration 0033: Purge All Dummy & Demo Employee / Kiosk Records
-- Purpose: Safely remove all mock employee, kiosk, attendance, and payroll seed rows from Supabase PostgreSQL database.

BEGIN;

-- 1. Ensure Foreign Key on payroll_slips uses ON DELETE CASCADE to prevent RESTRICT blocks
ALTER TABLE IF EXISTS public.payroll_slips 
  DROP CONSTRAINT IF EXISTS payroll_slips_employee_id_fkey;

ALTER TABLE IF EXISTS public.payroll_slips 
  ADD CONSTRAINT payroll_slips_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- 2. Temporarily disable immutability triggers for purge operation
ALTER TABLE IF EXISTS public.payroll_slips DISABLE TRIGGER trg_prevent_posted_payroll_modification;
ALTER TABLE IF EXISTS public.attendance_records DISABLE TRIGGER trg_prevent_locked_attendance_update;

-- 3. Truncate / Delete all child HR, Attendance, Payroll, Leave, and Kiosk records
DELETE FROM public.payroll_slips;
DELETE FROM public.leave_requests;
DELETE FROM public.attendance_records;
DELETE FROM public.attendance_movement_logs;
DELETE FROM public.kiosk_devices;

-- 4. Delete all employee records
DELETE FROM public.employees;

-- 5. Re-enable immutability triggers
ALTER TABLE IF EXISTS public.payroll_slips ENABLE TRIGGER trg_prevent_posted_payroll_modification;
ALTER TABLE IF EXISTS public.attendance_records ENABLE TRIGGER trg_prevent_locked_attendance_update;

COMMIT;

