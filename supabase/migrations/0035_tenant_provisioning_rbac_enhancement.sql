-- Deshal ERP — Migration 0035: Multi-Tenant Provisioning & System RBAC Seeding Enhancement
-- Purpose: Additive RPC enhancement and system RBAC role/permission catalog seeding function.
-- Guarantees atomic seeding of all 91 system permissions, 7 default roles, role-permission matrix,
-- profile user memberships, and 12-module entitlements without modifying existing tables or data.

BEGIN;

-- ============================================================================
-- 1. Helper Function: Seed System Permissions, Roles & Role-Permission Matrix
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_system_permissions_and_roles(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role_id UUID;
    v_manager_role_id UUID;
    v_employee_role_id UUID;
    v_accountant_role_id UUID;
    v_hr_role_id UUID;
    v_sales_role_id UUID;
    v_inventory_role_id UUID;
BEGIN
    IF p_company_id IS NULL THEN
        RAISE EXCEPTION 'Target company_id is required for system RBAC seeding.';
    END IF;

    -- ------------------------------------------------------------------------
    -- 1.1 Seed 91 Master System Permissions Catalog (Idempotent)
    -- ------------------------------------------------------------------------
    INSERT INTO public.permissions (code, module, description_ar, description_en)
    VALUES
        -- Financials & Vouchers (vouchers)
        ('view_vouchers', 'vouchers', 'عرض وتصفح السندات والفواتير', 'View Vouchers & Invoices'),
        ('create_vouchers', 'vouchers', 'إنشاء وتحرير السندات والفواتير', 'Create & Edit Vouchers'),
        ('edit_vouchers', 'vouchers', 'تعديل السندات المحررة', 'Edit Posted Vouchers'),
        ('delete_vouchers', 'vouchers', 'حذف وإلغاء السندات', 'Delete & Cancel Vouchers'),
        ('approve_vouchers', 'vouchers', 'اعتماد وتصديق السندات المالية', 'Approve Financial Vouchers'),
        ('close_financial_period', 'vouchers', 'إغلاق الفترات المالية والسنوات المحاسبية', 'Close Financial Periods'),
        ('print_export_vouchers', 'vouchers', 'طباعة وتصدير السندات PDF', 'Print & Export Vouchers'),
        ('apply_discounts', 'vouchers', 'منح الخصومات والتخفيضات', 'Apply Discounts'),
        ('manage_general_ledger', 'vouchers', 'إدارة شجرة الحسابات وقيود اليومية', 'Manage Chart of Accounts & GL Entries'),
        ('view_financial_reports', 'vouchers', 'عرض التقارير المالية والختامية', 'View Financial Reports'),
        ('financial_admin_override', 'vouchers', 'تجاوز السقوف والقيود المالية الاستثنائية', 'Financial Limit Override'),

        -- POS Terminal & Cashier (pos)
        ('pos_view_sales', 'pos', 'عرض سجلات ومبيعات نقطة البيع', 'View POS Sales Records'),
        ('pos_open_shift', 'pos', 'فتح وغلق ورديات الكاشير', 'Open & Close POS Shifts'),
        ('pos_create_order', 'pos', 'إنشاء المبيعات وإصدار الفواتير الفورية', 'Create POS Orders'),
        ('pos_edit_order', 'pos', 'تعديل الطلبات المعلقة في نقطة البيع', 'Edit Pending POS Orders'),
        ('pos_apply_discount', 'pos', 'تطبيق خصومات نقطة البيع', 'Apply POS Discounts'),
        ('pos_void_item', 'pos', 'إلغاء الأصناف أو الطلبات في الكاشير', 'Void POS Order Items'),
        ('pos_cash_drawer', 'pos', 'فتح درج النقدية يدويًا', 'Open Cash Drawer'),
        ('pos_close_shift_override', 'pos', 'اعتماد وإغلاق الوردية وتصفية الفروقات', 'Override POS Shift Closure'),
        ('pos_settings', 'pos', 'إعدادات وطابعات وأجهزة الكاشير', 'POS Device & Hardware Settings'),

        -- Inventory & Warehousing (inventory)
        ('view_inventory', 'inventory', 'عرض المنتجات وسجلات المخزون', 'View Products & Inventory'),
        ('manage_inventory', 'inventory', 'إدارة المخزون والتسعير', 'Manage Inventory & Pricing'),
        ('delete_inventory', 'inventory', 'حذف وإلغاء أصناف المنتجات', 'Delete Product Items'),
        ('manage_transfers', 'inventory', 'المناقلات والتحويل المخزني', 'Manage Stock Transfers'),
        ('approve_transfers', 'inventory', 'اعتماد واستلام التحويلات المخزنية', 'Approve Stock Transfers'),
        ('inventory_stocktake', 'inventory', 'إجراء وتسوية الجرد المخزني', 'Conduct Inventory Stocktake'),
        ('inventory_categories', 'inventory', 'إدارة التصنيفات والوحدات', 'Manage Product Categories'),
        ('inventory_settings', 'inventory', 'إعدادات وتنبيهات حد الأمان للمخزون', 'Inventory Threshold Settings'),

        -- Purchases & Suppliers (purchases)
        ('view_purchases', 'purchases', 'عرض أوامر وفواتير المشتريات', 'View Purchase Orders & Invoices'),
        ('manage_purchases', 'purchases', 'إدارة المشتريات وفواتير الموردين', 'Manage Purchases & Supplier Invoices'),
        ('delete_purchases', 'purchases', 'حذف وإلغاء أوامر وفواتير الشراء', 'Delete Purchase Orders'),
        ('manage_suppliers', 'purchases', 'إدارة الموردين وجهات الاتصال', 'Manage Suppliers Directory'),
        ('approve_purchase_orders', 'purchases', 'اعتماد أوامر الشراء الرسمية', 'Approve Purchase Orders'),
        ('purchases_settings', 'purchases', 'إعدادات وسياسات الشراء', 'Purchasing Rules & Settings'),

        -- CRM & Customers (crm)
        ('view_customers', 'crm', 'عرض سجلات وحسابات العملاء', 'View Customers Directory'),
        ('manage_customers', 'crm', 'إدارة بيانات العملاء', 'Manage Customer Accounts'),
        ('delete_customers', 'crm', 'حذف وإلغاء سجلات العملاء', 'Delete Customer Records'),
        ('crm_pipeline_mgmt', 'crm', 'إدارة مسار المبيعات والفرص', 'Manage Sales Pipeline & Deals'),
        ('crm_activities_mgmt', 'crm', 'إدارة الأنشطة والمهام وتواصل العملاء', 'Manage CRM Activities & Calls'),
        ('crm_settings', 'crm', 'إعدادات وتصنيفات مراحل CRM', 'CRM Stages & Pipeline Settings'),

        -- Spaces, Bookings & Contracts (spaces)
        ('view_spaces', 'spaces', 'عرض العقارات والمساحات والحجوزات', 'View Properties, Spaces & Bookings'),
        ('manage_spaces', 'spaces', 'إدارة العقارات والقاعات والمساحات', 'Manage Properties & Spaces'),
        ('delete_spaces', 'spaces', 'حذف وتعطيل المساحات والعقارات', 'Delete Properties & Spaces'),
        ('manage_space_bookings', 'spaces', 'إدارة الحجوزات والمواعيد', 'Manage Space Reservations'),
        ('cancel_space_bookings', 'spaces', 'إلغاء واسترداد مبالغ الحجوزات', 'Cancel Space Bookings'),
        ('manage_lease_contracts', 'spaces', 'إدارة عقود الإيجار والأقساط', 'Manage Lease Agreements'),
        ('terminate_lease_contracts', 'spaces', 'فسخ وإغلاق عقود الإيجار', 'Terminate Lease Contracts'),
        ('spaces_settings', 'spaces', 'إعدادات وقواعد المساحات والعقود', 'Spaces Rules & Leasing Settings'),

        -- Services & Packages (services)
        ('view_services', 'services', 'عرض دليل الخدمات والباقات', 'View Service Catalog'),
        ('manage_services', 'services', 'إدارة دليل الخدمات والأسعار', 'Manage Services & Packages'),
        ('delete_services', 'services', 'حذف وإلغاء تفعيل الخدمات', 'Delete Service Offerings'),
        ('manage_service_bookings', 'services', 'حجز وإدارة طلبات الخدمات', 'Manage Service Bookings'),
        ('cancel_service_bookings', 'services', 'إلغاء ومراجعة طلبات الخدمات', 'Cancel Service Orders'),
        ('services_settings', 'services', 'إعدادات وسياسات تقديم الخدمات', 'Service Delivery Settings'),

        -- HR & Payroll (hr)
        ('view_employees', 'hr', 'عرض دليل وسجلات الموظفين', 'View Staff Directory'),
        ('manage_employees', 'hr', 'إدارة الموظفين وتوزيع الصلاحيات', 'Manage Staff & Roles'),
        ('delete_employees', 'hr', 'حذف أو إنهاء خدمات الموظفين', 'Archive & Terminate Employees'),
        ('view_salaries', 'hr', 'الاطلاع على الرواتب والبيانات المالية للموظفين', 'View Employee Salaries & Bank Info'),
        ('manage_payroll', 'hr', 'اعتماد وصرف مسيرات الرواتب (WPS)', 'Process Monthly WPS Payroll'),
        ('approve_payroll', 'hr', 'الاعتماد النهائي لمسير الرواتب', 'Final Payroll Approval'),
        ('manage_contracts_eosb', 'hr', 'إدارة عقود العمل وتصفية مكافأة نهاية الخدمة', 'Manage Contracts & EOSB'),
        ('hr_settings', 'hr', 'إعدادات ولوائح الموارد البشرية', 'HR Rules & PASI Settings'),

        -- Attendance & Kiosk (attendance)
        ('attendance_view', 'attendance', 'عرض سجلات الحركات وحضور الموظفين', 'View Attendance Logs'),
        ('attendance_create', 'attendance', 'تسجيل حركات الحضور والانصراف (Kiosk)', 'Clock In/Out via Kiosk'),
        ('attendance_edit', 'attendance', 'طلب تعديل وتصحيح حركات الحضور', 'Request Attendance Adjustment'),
        ('attendance_delete', 'attendance', 'حذف أو إلغاء حركات الحضور', 'Delete Attendance Log'),
        ('attendance_approve', 'attendance', 'اعتماد حركات وتعديلات الحضور', 'Approve Attendance Adjustments'),
        ('attendance_reports', 'attendance', 'تقارير وتحليلات الحضور وساعات العمل', 'Attendance & Overtime Reports'),
        ('attendance_photos', 'attendance', 'عرض صور التحقق من الهوية الملتقطة بالكشك', 'View Kiosk Verification Photos'),
        ('attendance_devices', 'attendance', 'إدارة وتأمين أجهزة الكشك اللوحية (Kiosk Devices)', 'Manage Tablet Kiosk Devices'),
        ('movement_types_mgmt', 'attendance', 'إدارة وتخصيص أنواع الحركات الإدارية', 'Manage Movement Types'),
        ('employee_pin_mgmt', 'attendance', 'إدارة رموز الأمان (PIN) للموظفين', 'Manage Employee PIN Security'),
        ('attendance_settings', 'attendance', 'إعدادات وسياسات الحضور والانصراف', 'Attendance Policy Settings'),
        ('kiosk_mode_only', 'attendance', 'وضع جهاز الكشك اللوحي المقيد فقط', 'Kiosk Restricted Mode'),

        -- Requests & Documents (requests)
        ('view_requests', 'requests', 'عرض الطلبات والمعاملات الإدارية', 'View Official Requests'),
        ('manage_requests', 'requests', 'إدارة النماذج والطلبات الإدارية', 'Submit & Manage Requests'),
        ('approve_requests', 'requests', 'اعتماد والموافقة على الطلبات الرسمية', 'Approve Official Requests'),
        ('delete_requests', 'requests', 'حذف وإلغاء الطلبات الإدارية', 'Delete Pending Requests'),
        ('view_documents', 'requests', 'عرض واستعراض الوثائق والأرشيف', 'View Document Archive'),
        ('manage_documents', 'requests', 'إدارة الأرشيف والوثائق الرسمية', 'Manage Enterprise Documents'),
        ('delete_documents', 'requests', 'حذف وإتلاف المستندات الرقمية', 'Delete Archived Documents'),
        ('requests_settings', 'requests', 'إعدادات مسارات الاعتماد ونماذج الطلبات', 'Workflow & Form Settings'),

        -- Branches, System & Settings (management)
        ('view_branches', 'management', 'عرض بيانات وقائمة الفروع والمستودعات', 'View Company Branches'),
        ('manage_branches', 'management', 'إدارة الفروع والمستودعات', 'Manage Branches & Warehouses'),
        ('delete_branches', 'management', 'حذف وإغلاق الفروع والمستودعات', 'Deactivate Company Branches'),
        ('view_reports', 'management', 'الاطلاع على التقارير العامة والإحصائيات', 'View General Analytics'),
        ('edit_settings', 'management', 'تعديل إعدادات الشركة وقوالب الطباعة', 'Edit Company Settings & Header'),
        ('system_audit_logs', 'management', 'عرض واستخراج سجلات التدقيق والأمان', 'View Audit Logs & Security Trails'),
        ('auditor_read_only', 'management', 'صلاحية التفتيش الرقابي والمدقق (قراءة فقط)', 'Auditor Inspection Read-Only'),
        ('collaborator_limited', 'management', 'صلاحيات المتعاون الخارجي المقيدة', 'External Collaborator Limited'),
        ('management_admin_override', 'management', 'صلاحية التجاوز الإداري الشامل', 'Management Admin Override')
    ON CONFLICT (code) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 1.2 Seed 7 System Default Roles for Target Company (Idempotent)
    -- ------------------------------------------------------------------------
    INSERT INTO public.roles (company_id, code, name_ar, name_en, is_system_default)
    VALUES
        (p_company_id, 'ADMIN', 'مدير النظام', 'System Administrator', true),
        (p_company_id, 'MANAGER', 'مدير', 'Manager', true),
        (p_company_id, 'EMPLOYEE', 'موظف', 'Employee', true),
        (p_company_id, 'ACCOUNTANT', 'محاسب', 'Accountant', true),
        (p_company_id, 'HR', 'مدير الموارد البشرية', 'HR Manager', true),
        (p_company_id, 'SALES', 'ممثل مبيعات', 'Sales Representative', true),
        (p_company_id, 'INVENTORY', 'أخصائي مخزون', 'Inventory Officer', true)
    ON CONFLICT (company_id, code) DO NOTHING;

    -- Fetch Role IDs for Role-Permission Assignment
    SELECT id INTO v_admin_role_id FROM public.roles WHERE company_id = p_company_id AND code = 'ADMIN';
    SELECT id INTO v_manager_role_id FROM public.roles WHERE company_id = p_company_id AND code = 'MANAGER';
    SELECT id INTO v_employee_role_id FROM public.roles WHERE company_id = p_company_id AND code = 'EMPLOYEE';
    SELECT id INTO v_accountant_role_id FROM public.roles WHERE company_id = p_company_id AND code = 'ACCOUNTANT';
    SELECT id INTO v_hr_role_id FROM public.roles WHERE company_id = p_company_id AND code = 'HR';
    SELECT id INTO v_sales_role_id FROM public.roles WHERE company_id = p_company_id AND code = 'SALES';
    SELECT id INTO v_inventory_role_id FROM public.roles WHERE company_id = p_company_id AND code = 'INVENTORY';

    -- ------------------------------------------------------------------------
    -- 1.3 Assign Permissions to ADMIN Role (All 91 Permissions)
    -- ------------------------------------------------------------------------
    IF v_admin_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_admin_role_id, p.id
        FROM public.permissions p
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ------------------------------------------------------------------------
    -- 1.4 Assign Permissions to MANAGER Role (53 Permissions)
    -- ------------------------------------------------------------------------
    IF v_manager_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_manager_role_id, p.id
        FROM public.permissions p
        WHERE p.code IN (
            'view_vouchers', 'create_vouchers', 'edit_vouchers', 'approve_vouchers', 'print_export_vouchers', 'apply_discounts', 'view_financial_reports',
            'pos_view_sales', 'pos_open_shift', 'pos_create_order', 'pos_edit_order', 'pos_apply_discount', 'pos_close_shift_override',
            'view_inventory', 'manage_inventory', 'manage_transfers', 'approve_transfers', 'inventory_stocktake', 'inventory_categories',
            'view_purchases', 'manage_purchases', 'manage_suppliers', 'approve_purchase_orders',
            'view_customers', 'manage_customers', 'crm_pipeline_mgmt', 'crm_activities_mgmt',
            'view_spaces', 'manage_spaces', 'manage_space_bookings', 'manage_lease_contracts',
            'view_services', 'manage_services', 'manage_service_bookings',
            'view_employees', 'manage_employees', 'view_salaries', 'manage_payroll', 'approve_payroll',
            'attendance_view', 'attendance_create', 'attendance_approve', 'attendance_reports', 'attendance_photos',
            'view_requests', 'manage_requests', 'approve_requests', 'view_documents', 'manage_documents',
            'view_branches', 'manage_branches', 'view_reports'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ------------------------------------------------------------------------
    -- 1.5 Assign Permissions to ACCOUNTANT Role (33 Permissions)
    -- ------------------------------------------------------------------------
    IF v_accountant_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_accountant_role_id, p.id
        FROM public.permissions p
        WHERE p.code IN (
            'view_vouchers', 'create_vouchers', 'edit_vouchers', 'approve_vouchers', 'close_financial_period', 'print_export_vouchers',
            'apply_discounts', 'manage_general_ledger', 'view_financial_reports', 'pos_view_sales',
            'view_inventory', 'view_purchases', 'manage_purchases', 'manage_suppliers', 'approve_purchase_orders',
            'view_customers', 'manage_customers', 'view_spaces', 'manage_lease_contracts', 'view_services',
            'view_employees', 'view_salaries', 'manage_payroll', 'approve_payroll', 'manage_contracts_eosb',
            'attendance_view', 'attendance_reports', 'view_requests', 'approve_requests', 'view_documents',
            'view_branches', 'view_reports'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ------------------------------------------------------------------------
    -- 1.6 Assign Permissions to SALES Role (18 Permissions)
    -- ------------------------------------------------------------------------
    IF v_sales_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_sales_role_id, p.id
        FROM public.permissions p
        WHERE p.code IN (
            'view_vouchers', 'create_vouchers', 'print_export_vouchers', 'apply_discounts',
            'pos_view_sales', 'pos_open_shift', 'pos_create_order', 'pos_apply_discount',
            'view_inventory', 'view_customers', 'manage_customers', 'crm_pipeline_mgmt', 'crm_activities_mgmt',
            'view_spaces', 'manage_space_bookings', 'view_services', 'manage_service_bookings', 'attendance_create'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ------------------------------------------------------------------------
    -- 1.7 Assign Permissions to EMPLOYEE Role (5 Standard Permissions)
    -- ------------------------------------------------------------------------
    IF v_employee_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_employee_role_id, p.id
        FROM public.permissions p
        WHERE p.code IN (
            'attendance_create', 'attendance_view', 'view_requests', 'manage_requests', 'view_documents'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ------------------------------------------------------------------------
    -- 1.8 Assign Permissions to HR Role (23 HR Permissions)
    -- ------------------------------------------------------------------------
    IF v_hr_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_hr_role_id, p.id
        FROM public.permissions p
        WHERE p.code IN (
            'view_employees', 'manage_employees', 'delete_employees', 'view_salaries', 'manage_payroll', 'approve_payroll',
            'manage_contracts_eosb', 'hr_settings', 'attendance_view', 'attendance_create', 'attendance_edit',
            'attendance_approve', 'attendance_reports', 'attendance_photos', 'attendance_devices', 'movement_types_mgmt',
            'employee_pin_mgmt', 'attendance_settings', 'view_requests', 'manage_requests', 'approve_requests',
            'view_documents', 'manage_documents'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ------------------------------------------------------------------------
    -- 1.9 Assign Permissions to INVENTORY Role (12 Inventory Permissions)
    -- ------------------------------------------------------------------------
    IF v_inventory_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_inventory_role_id, p.id
        FROM public.permissions p
        WHERE p.code IN (
            'view_inventory', 'manage_inventory', 'delete_inventory', 'manage_transfers', 'approve_transfers',
            'inventory_stocktake', 'inventory_categories', 'inventory_settings', 'view_purchases', 'manage_purchases',
            'manage_suppliers', 'attendance_create'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END;
$$;

-- ============================================================================
-- 2. Enhanced Atomic Idempotent Tenant Provisioning RPC Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.provision_tenant_transaction(
    p_idempotency_key TEXT,
    p_name TEXT,
    p_cr_number TEXT,
    p_tax_id TEXT,
    p_currency TEXT,
    p_main_branch_name TEXT,
    p_admin_email TEXT,
    p_admin_name TEXT,
    p_subscription_plan TEXT DEFAULT 'FREE'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_job RECORD;
    v_company_id UUID;
    v_tenant_id UUID;
    v_branch_id UUID;
    v_admin_role_id UUID;
    v_user_id UUID;
    v_tenant_code TEXT;
    v_job_id UUID;
BEGIN
    -- Security Guard: Must be executed by a Platform Admin
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Security Violation: Only Platform Administrators can execute tenant provisioning.';
    END IF;

    -- 1. Idempotency Check
    SELECT * INTO v_existing_job
    FROM public.tenant_provisioning_jobs
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        IF v_existing_job.status = 'COMPLETED' THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'tenant_id', v_existing_job.tenant_id,
                'company_id', v_existing_job.company_id,
                'message', 'Provisioning already completed previously.'
            );
        ELSIF v_existing_job.status = 'IN_PROGRESS' THEN
            RAISE EXCEPTION 'Provisioning job is currently in progress for idempotency key %', p_idempotency_key;
        END IF;
    END IF;

    -- Register / Update Provisioning Job State
    INSERT INTO public.tenant_provisioning_jobs (idempotency_key, status, payload)
    VALUES (p_idempotency_key, 'IN_PROGRESS', jsonb_build_object('name', p_name, 'cr_number', p_cr_number))
    ON CONFLICT (idempotency_key) DO UPDATE
    SET status = 'IN_PROGRESS', failed_step = NULL, error_message = NULL
    RETURNING id INTO v_job_id;

    -- 2. Create Company Entity
    INSERT INTO public.companies (name_ar, name_en, cr_number, tax_number, is_active)
    VALUES (p_name, p_name, p_cr_number, p_tax_id, true)
    RETURNING id INTO v_company_id;

    -- 3. Generate Tenant Code & Create Master Tenant Entity
    v_tenant_code := 'TNT-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
    
    INSERT INTO public.tenants (company_id, tenant_code, name, status, subscription_plan)
    VALUES (v_company_id, v_tenant_code, p_name, 'PROVISIONING', p_subscription_plan)
    RETURNING id INTO v_tenant_id;

    -- 4. Create Main Branch
    INSERT INTO public.branches (company_id, code, name_ar, name_en, city, is_active)
    VALUES (v_company_id, 'MAIN', p_main_branch_name, p_main_branch_name, 'صحار', true)
    RETURNING id INTO v_branch_id;

    -- 5. Seed System Permissions & All 7 Default Roles + Permissions Matrix
    PERFORM public.seed_system_permissions_and_roles(v_company_id);

    -- Fetch ADMIN Role ID
    SELECT id INTO v_admin_role_id
    FROM public.roles
    WHERE company_id = v_company_id AND code = 'ADMIN';

    -- 6. Register Admin Profile Membership & User Role Binding (if profile exists)
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE email = p_admin_email AND company_id = v_company_id
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.user_company_memberships (user_id, company_id, is_active)
        VALUES (v_user_id, v_company_id, true)
        ON CONFLICT (user_id, company_id) DO NOTHING;

        IF v_admin_role_id IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (v_user_id, v_admin_role_id)
            ON CONFLICT (user_id, role_id) DO NOTHING;
        END IF;
    END IF;

    -- 7. Initialize Default Modules (All 12 Modules Enabled by Default)
    INSERT INTO public.tenant_modules (tenant_id, module_code, is_enabled)
    VALUES
        (v_tenant_id, 'crm', true),
        (v_tenant_id, 'pos', true),
        (v_tenant_id, 'inventory', true),
        (v_tenant_id, 'purchases', true),
        (v_tenant_id, 'accounting', true),
        (v_tenant_id, 'hr', true),
        (v_tenant_id, 'attendance', true),
        (v_tenant_id, 'spaces', true),
        (v_tenant_id, 'services', true),
        (v_tenant_id, 'requests', true),
        (v_tenant_id, 'documents', true),
        (v_tenant_id, 'kiosk', true)
    ON CONFLICT (tenant_id, module_code) DO NOTHING;

    -- 8. Initialize Tenant Subscription Record
    INSERT INTO public.tenant_subscriptions (company_id, plan_type, status)
    VALUES (v_company_id, p_subscription_plan, 'active')
    ON CONFLICT (company_id) DO NOTHING;

    -- 9. Mark Tenant READY and Job COMPLETED
    UPDATE public.tenants
    SET status = 'READY', updated_at = now()
    WHERE id = v_tenant_id;

    UPDATE public.tenant_provisioning_jobs
    SET status = 'COMPLETED',
        tenant_id = v_tenant_id,
        company_id = v_company_id,
        completed_at = now()
    WHERE id = v_job_id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'tenant_id', v_tenant_id,
        'company_id', v_company_id,
        'tenant_code', v_tenant_code,
        'main_branch_id', v_branch_id
    );

EXCEPTION WHEN OTHERS THEN
    IF v_job_id IS NOT NULL THEN
        UPDATE public.tenant_provisioning_jobs
        SET status = 'FAILED',
            failed_step = 'PROVISION_TRANSACTION',
            error_code = SQLSTATE,
            error_message = SQLERRM
        WHERE id = v_job_id;
    END IF;

    RAISE EXCEPTION 'Tenant Provisioning Failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

COMMIT;
