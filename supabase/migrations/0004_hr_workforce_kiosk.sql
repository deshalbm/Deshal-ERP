-- Deshal ERP — Migration 0004: HR, Workforce, Payroll & Attendance Kiosk Engine
-- Purpose: Employee 360, Employment Contracts, Attendance Logs, Kiosk Devices, Payroll Slips, Leave Requests

BEGIN;

-- 1. Employees Master Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
    employee_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    civil_id TEXT,
    job_title TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    basic_salary NUMERIC(15,3) NOT NULL DEFAULT 0,
    housing_allowance NUMERIC(15,3) NOT NULL DEFAULT 0,
    transport_allowance NUMERIC(15,3) NOT NULL DEFAULT 0,
    other_allowances NUMERIC(15,3) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, TERMINATED
    joining_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_employees_code UNIQUE (company_id, employee_code)
);

-- 2. Kiosk Devices Table
CREATE TABLE IF NOT EXISTS public.kiosk_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    device_code TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_kiosk_devices_code UNIQUE (company_id, device_code)
);

-- 3. Attendance Movement Logs Table (Kiosk & App Check-ins)
CREATE TABLE IF NOT EXISTS public.attendance_movement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    kiosk_device_id UUID REFERENCES public.kiosk_devices(id) ON DELETE SET NULL,
    movement_type_code TEXT NOT NULL, -- CHECK_IN, CHECK_OUT, MISSION_OUT, MISSION_IN, BREAK_OUT, BREAK_IN
    movement_category TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    photo_url TEXT,
    reason TEXT,
    sync_status TEXT NOT NULL DEFAULT 'SYNCED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Payroll Slips Table
CREATE TABLE IF NOT EXISTS public.payroll_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    month TEXT NOT NULL, -- YYYY-MM
    basic_salary NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_allowances NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(15,3) NOT NULL DEFAULT 0,
    net_salary NUMERIC(15,3) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, DISBURSED
    disbursed_at TIMESTAMPTZ,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_payroll_employee_month UNIQUE (company_id, employee_id, month)
);

-- 5. Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL, -- ANNUAL, SICK, UNPAID, EMERGENCY
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reason TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for workforce queries
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_movement_logs_employee_id ON public.attendance_movement_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_movement_logs_date ON public.attendance_movement_logs(date);
CREATE INDEX IF NOT EXISTS idx_payroll_slips_employee_id ON public.payroll_slips(employee_id);

COMMIT;
