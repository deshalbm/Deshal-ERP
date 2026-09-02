-- Deshal ERP — Migration 0005: Operational Suites (Spaces, Leasing, Services, Inventory & Purchasing)
-- Purpose: Real Estate, Space Bookings, Catalog Services, Inventory Stock & Supplier Procurement

BEGIN;

-- 1. Spaces & Rental Units Table
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    type TEXT NOT NULL, -- OFFICE, MEETING_ROOM, HALL, DESK
    capacity INT NOT NULL DEFAULT 1,
    hourly_rate NUMERIC(15,3) NOT NULL DEFAULT 0,
    daily_rate NUMERIC(15,3) NOT NULL DEFAULT 0,
    monthly_rate NUMERIC(15,3) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, MAINTENANCE
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_spaces_code UNIQUE (company_id, code)
);

-- 2. Space Bookings Table
CREATE TABLE IF NOT EXISTS public.space_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Lease Contracts Table
CREATE TABLE IF NOT EXISTS public.lease_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    space_id UUID REFERENCES public.spaces(id) ON DELETE RESTRICT,
    contract_number TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_contract_value NUMERIC(15,3) NOT NULL DEFAULT 0,
    payment_frequency TEXT NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, ANNUALLY
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, EXPIRED, TERMINATED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_lease_contracts_number UNIQUE (company_id, contract_number)
);

-- 4. Products & Catalog Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL DEFAULT 'GENERAL',
    unit TEXT NOT NULL DEFAULT 'PCS',
    cost_price NUMERIC(15,3) NOT NULL DEFAULT 0,
    selling_price NUMERIC(15,3) NOT NULL DEFAULT 0,
    min_alert_quantity INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_products_sku UNIQUE (company_id, sku)
);

-- 5. Warehouses Table
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_warehouses_code UNIQUE (company_id, code)
);

-- 6. Inventory Stock Balances Table
CREATE TABLE IF NOT EXISTS public.stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_stock_balances_warehouse_product UNIQUE (warehouse_id, product_id)
);

-- 7. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    city TEXT DEFAULT 'صحار',
    tax_id TEXT,
    cr_number TEXT,
    category TEXT DEFAULT 'عام',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    purchase_number TEXT NOT NULL,
    supplier_invoice_no TEXT,
    date DATE NOT NULL,
    due_date DATE,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, ORDERED, RECEIVED, CANCELLED
    payment_status TEXT NOT NULL DEFAULT 'UNPAID', -- PAID, PARTIAL, UNPAID
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_purchase_orders_number UNIQUE (company_id, purchase_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spaces_company_id ON public.spaces(company_id);
CREATE INDEX IF NOT EXISTS idx_space_bookings_space_id ON public.space_bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_balances_warehouse ON public.stock_balances(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);

COMMIT;
