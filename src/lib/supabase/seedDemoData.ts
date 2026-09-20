/**
 * Demo Data Seeder Utility for Deshal ERP — Supabase & Application Layer
 * Seeds comprehensive initial operational data (Companies, Branches, Profiles, Memberships,
 * Accounts, Employees, Customers, Suppliers, Inventory, Spaces, Services, Vouchers, POS Orders).
 */

import { supabase, isSupabaseConfigured } from './client';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../../utils/accountingStorage';

export interface SeedResult {
  success: boolean;
  message: string;
  details: {
    companies: number;
    branches: number;
    profiles: number;
    memberships: number;
    accounts: number;
    customers: number;
    employees: number;
    products: number;
    suppliers: number;
    spaces: number;
    services: number;
    vouchers: number;
    posOrders: number;
  };
}

// ──────────────────────────────────────────────
// Canonical Default Baseline Seed Datasets
// ──────────────────────────────────────────────

export const CANONICAL_BRANCHES = [
  {
    id: 'brn-sohar',
    code: 'MAIN',
    name_ar: 'فرع صحار الرئيسي',
    name_en: 'Sohar Main Branch',
    city: 'صحار',
    is_active: true
  },
  {
    id: 'brn-muscat',
    code: 'BR-MUSCAT',
    name_ar: 'فرع مسقط - العذيبة',
    name_en: 'Muscat Al Azaiba Branch',
    city: 'مسقط',
    is_active: true
  }
];

export const CANONICAL_EMPLOYEES = [
  {
    id: 'emp-101',
    employee_code: 'EMP-101',
    full_name: 'أحمد بن سعيد المعمري',
    full_name_en: 'Ahmed Saeed Al Maamari',
    email: 'deshalbm.com@gmail.com',
    phone: '+968 99112233',
    role: 'ADMIN',
    job_title: 'المدير العام والتنفيذي',
    department: 'الإدارة العليا',
    status: 'ACTIVE',
    basic_salary: 2500,
    allowances: 400
  },
  {
    id: 'emp-102',
    employee_code: 'EMP-102',
    full_name: 'فاطمة بنت سالم البلوشي',
    full_name_en: 'Fatma Salim Al Balushi',
    email: 'fatma.albalushi@deshalbm.com',
    phone: '+968 98223344',
    role: 'HR',
    job_title: 'مديرة الموارد البشرية والشؤون الإدارية',
    department: 'الموارد البشرية',
    status: 'ACTIVE',
    basic_salary: 1400,
    allowances: 250
  },
  {
    id: 'emp-103',
    employee_code: 'EMP-103',
    full_name: 'سالم بن عبدالله الهنائي',
    full_name_en: 'Salim Abdullah Al Hinai',
    email: 'salim.alhinai@deshalbm.com',
    phone: '+968 97334455',
    role: 'ACCOUNTANT',
    job_title: 'كبير المحاسبين الماليين',
    department: 'المالية والمحاسبة',
    status: 'ACTIVE',
    basic_salary: 1200,
    allowances: 200
  },
  {
    id: 'emp-104',
    employee_code: 'EMP-104',
    full_name: 'خالد بن محمد الزدجالي',
    full_name_en: 'Khalid Mohammad Al Zadjali',
    email: 'khalid.alzadjali@deshalbm.com',
    phone: '+968 96445566',
    role: 'SALES',
    job_title: 'أخصائي المبيعات ونقاط البيع',
    department: 'المبيعات والتسويق',
    status: 'ACTIVE',
    basic_salary: 950,
    allowances: 150
  },
  {
    id: 'emp-105',
    employee_code: 'EMP-105',
    full_name: 'مريم بنت راشد المقبالي',
    full_name_en: 'Maryam Rashid Al Maqbali',
    email: 'maryam.almaqbali@deshalbm.com',
    phone: '+968 95556677',
    role: 'EMPLOYEE',
    job_title: 'مستشارة إدارة المشاريع وحاضنة الأعمال',
    department: 'الاستشارات والتطوير',
    status: 'ACTIVE',
    basic_salary: 1100,
    allowances: 180
  }
];

export const CANONICAL_CUSTOMERS = [
  {
    id: 'cust-101',
    name: 'شركة صحار التنموية ش.م.ع.م',
    contact_person: 'المهندس ناصر المعمري',
    email: 'info@sohardev.om',
    phone: '+968 99123456',
    address: 'ولاية صحار - المنطقة الصناعية',
    city: 'صحار',
    country: 'Sultanate of Oman',
    tax_id: 'OM987261',
    cr_number: '1092837',
    customer_type: 'CORPORATE',
    status: 'ACTIVE',
    credit_limit: 15000,
    notes: 'عميل استراتيجي - عقد استشارات وإيجار مكتب'
  },
  {
    id: 'cust-102',
    name: 'مؤسسة الباطنة للتجارة والمقاولات',
    contact_person: 'سالم الشامسي',
    email: 'contact@batinatrade.om',
    phone: '+968 92345678',
    address: 'صحار - فلج القبائل',
    city: 'صحار',
    country: 'Sultanate of Oman',
    tax_id: 'OM2091823',
    cr_number: '2091823',
    customer_type: 'CORPORATE',
    status: 'ACTIVE',
    credit_limit: 8000,
    notes: 'عميل خدمات محاسبة ومساحة عمل'
  },
  {
    id: 'cust-103',
    name: 'عبدالله بن سالم الشحي',
    contact_person: 'عبدالله الشحي',
    email: 'abdullah.alshehhi@gmail.com',
    phone: '+968 95678901',
    address: 'صحار - الهمبار',
    city: 'صحار',
    country: 'Sultanate of Oman',
    customer_type: 'INDIVIDUAL',
    status: 'ACTIVE',
    credit_limit: 2000,
    notes: 'حجز قاعة اجتماعات واستوديو بودكاست'
  },
  {
    id: 'cust-104',
    name: 'شركة الخليج للحلول الرقمية',
    contact_person: 'أيمن الرئيسي',
    email: 'sales@gulfdigital.om',
    phone: '+968 91234567',
    address: 'مسقط - العذيبة الشمالية',
    city: 'مسقط',
    country: 'Sultanate of Oman',
    tax_id: 'OM3049182',
    cr_number: '3049182',
    customer_type: 'CORPORATE',
    status: 'ACTIVE',
    credit_limit: 10000,
    notes: 'عقد توريد وتشغيل أكشاك حضور ذكية'
  }
];

export const CANONICAL_SUPPLIERS = [
  {
    id: 'sup-101',
    name: 'شركة عُمان للتجهيزات المكتوبة وتكنولوجيا المعلومات',
    contact_person: 'سعيد البلوشي',
    email: 'supply@omantech.om',
    phone: '+968 24501234',
    address: 'مسقط - غلا الصناعية',
    city: 'مسقط',
    cr_number: '1094832',
    tax_id: 'OM1094832'
  },
  {
    id: 'sup-102',
    name: 'مؤسسة النماء للتوريدات العمومية',
    contact_person: 'حمد الشامسي',
    email: 'info@namaa-supply.om',
    phone: '+968 26845678',
    address: 'صحار - المنطقة الصناعية',
    city: 'صحار',
    cr_number: '3049281',
    tax_id: 'OM3049281'
  }
];

export const CANONICAL_PRODUCTS = [
  {
    id: 'prod-101',
    sku: 'KSK-PRO-01',
    barcode: '6901234567890',
    name: 'جهاز كشك الحضور والخدمات الذكي Touch-Kiosk Pro',
    category: 'أجهزة وأنظمة',
    warehouse: 'المستودع الرئيسي - صحار',
    unit: 'جهاز',
    quantity: 15,
    cost_price: 320.000,
    selling_price: 450.000,
    status: 'ACTIVE'
  },
  {
    id: 'prod-102',
    sku: 'SRV-FEAS-01',
    barcode: '6901234567891',
    name: 'دراسة جدوى متكاملة لتأسيس مشروع تجاري',
    category: 'استشارات وتأسيس',
    warehouse: 'المستودع الرئيسي - صحار',
    unit: 'دراسة',
    quantity: 99,
    cost_price: 600.000,
    selling_price: 1200.000,
    status: 'ACTIVE'
  },
  {
    id: 'prod-103',
    sku: 'SPC-MTG-01',
    barcode: '6901234567892',
    name: 'حجز قاعة الاجتماعات الكبرى (بالساعة)',
    category: 'حجوزات المساحات',
    warehouse: 'المستودع الرئيسي - صحار',
    unit: 'ساعة',
    quantity: 500,
    cost_price: 10.000,
    selling_price: 25.000,
    status: 'ACTIVE'
  },
  {
    id: 'prod-104',
    sku: 'SUB-COWORK-01',
    barcode: '6901234567893',
    name: 'اشتراك مساحة عمل مشتركة - باقة رواد الأعمال',
    category: 'اشتراكات المساحات',
    warehouse: 'المستودع الرئيسي - صحار',
    unit: 'شهر',
    quantity: 50,
    cost_price: 30.000,
    selling_price: 85.000,
    status: 'ACTIVE'
  }
];

export const CANONICAL_SPACES = [
  {
    id: 'space-101',
    code: 'SPC-01',
    name_ar: 'قاعة الاجتماعات الكبرى - صحار',
    name_en: 'Main Conference Room - Sohar',
    space_type: 'MEETING_ROOM',
    capacity: 14,
    hourly_rate: 25.000,
    daily_rate: 150.000,
    monthly_rate: 1200.000,
    status: 'AVAILABLE'
  },
  {
    id: 'space-102',
    code: 'SPC-02',
    name_ar: 'استوديو البودكاست والإعلام الرقمي',
    name_en: 'Podcast & Media Studio',
    space_type: 'MEDIA_STUDIO',
    capacity: 5,
    hourly_rate: 35.000,
    daily_rate: 200.000,
    monthly_rate: 1500.000,
    status: 'AVAILABLE'
  },
  {
    id: 'space-103',
    code: 'SPC-03',
    name_ar: 'مكتب خاص للمؤسسات الناشئة',
    name_en: 'Private Startup Office Suite',
    space_type: 'PRIVATE_OFFICE',
    capacity: 4,
    hourly_rate: 15.000,
    daily_rate: 80.000,
    monthly_rate: 350.000,
    status: 'AVAILABLE'
  }
];

export const CANONICAL_SERVICES = [
  {
    id: 'srv-101',
    code: 'CONS-01',
    name: 'خدمة تأسيس الشركات ودراسات الجدوى',
    name_en: 'Company Formation & Feasibility Service',
    category: 'CONSULTING',
    base_price: 1200.000,
    pricing_model: 'FIXED_PRICE',
    status: 'ACTIVE'
  },
  {
    id: 'srv-102',
    code: 'CONS-02',
    name: 'خدمة الهيكلة المالية والاستشارات المحاسبية',
    name_en: 'Financial Structuring & Accounting Advisory',
    category: 'CONSULTING',
    base_price: 650.000,
    pricing_model: 'HOURLY',
    status: 'ACTIVE'
  },
  {
    id: 'srv-103',
    code: 'CONS-03',
    name: 'إعداد وتطوير الهياكل التنظيمية ولوائح العمل',
    name_en: 'Organizational Structuring & HR Policy Manual',
    category: 'CONSULTING',
    base_price: 850.000,
    pricing_model: 'FIXED_PRICE',
    status: 'ACTIVE'
  }
];

export const CANONICAL_VOUCHERS = [
  {
    id: 'vch-101',
    voucher_number: 'RV-2026-001',
    voucher_date: '2026-09-01',
    customer_id: 'cust-101',
    customer_name: 'شركة صحار التنموية ش.م.ع.م',
    amount: 1850.000,
    currency: 'OMR',
    payment_method: 'BANK_TRANSFER',
    status: 'POSTED',
    description: 'دفعة مقدمة لحجز قاعة الاجتماعات وحاضنة الأعمال - سبتمبر 2026'
  },
  {
    id: 'vch-102',
    voucher_number: 'RV-2026-002',
    voucher_date: '2026-09-10',
    customer_id: 'cust-103',
    customer_name: 'عبدالله بن سالم الشحي',
    amount: 250.000,
    currency: 'OMR',
    payment_method: 'CASH',
    status: 'POSTED',
    description: 'سداد رسوم استوديو البودكاست وتصوير المحتوى الرقمي'
  },
  {
    id: 'vch-103',
    voucher_number: 'RV-2026-003',
    voucher_date: '2026-09-15',
    customer_id: 'cust-102',
    customer_name: 'مؤسسة الباطنة للتجارة والمقاولات',
    amount: 1200.000,
    currency: 'OMR',
    payment_method: 'CARD',
    status: 'POSTED',
    description: 'مقابل خدمات استشارية وإعداد دراسة جدوى تسويقية'
  }
];

export const CANONICAL_POS_ORDERS = [
  {
    id: 'pos-101',
    order_number: 'POS-2026-001',
    customer_id: 'cust-101',
    customer_name: 'شركة صحار التنموية ش.م.ع.م',
    cashier_name: 'خالد الزدجالي',
    order_date: new Date().toISOString(),
    status: 'COMPLETED',
    payment_method: 'CARD',
    subtotal: 450.000,
    tax_amount: 0.000,
    total_amount: 450.000,
    amount_tendered: 450.000,
    change_amount: 0.000,
    notes: 'مبيعات كشك صحار - جهاز كشك حضور ذكي'
  }
];

export const CANONICAL_SHIFTS = [
  {
    id: 'shift-101',
    shift_number: 'SHIFT-2026-001',
    cashier_name: 'خالد الزدجالي',
    opened_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    opening_cash: 50.000,
    total_sales: 450.000,
    total_transactions: 1,
    status: 'OPEN',
    notes: 'وردية كشك الاستقبال والنقاط الذكية - صحار'
  }
];

/**
 * Seeds demo data into Supabase for the specified companyId.
 */
export async function seedDemoDataToSupabase(companyId: string): Promise<SeedResult> {
  const result: SeedResult = {
    success: false,
    message: '',
    details: {
      companies: 0,
      branches: 0,
      profiles: 0,
      memberships: 0,
      accounts: 0,
      customers: 0,
      employees: 0,
      products: 0,
      suppliers: 0,
      spaces: 0,
      services: 0,
      vouchers: 0,
      posOrders: 0
    },
  };

  if (!isSupabaseConfigured || !companyId) {
    result.message = 'Supabase غير محدد أو معرّف الشركة غير متوفر.';
    return result;
  }

  try {
    // 0. Ensure Default Company Entity Exists
    const { data: compData } = await (supabase.from('companies') as any).upsert([
      {
        id: companyId,
        name_ar: 'مؤسسة ديشال ERP',
        name_en: 'Deshal Enterprise ERP',
        cr_number: '1092837',
        tax_number: 'OM1092837',
        is_active: true,
        updated_at: new Date().toISOString()
      }
    ], { onConflict: 'id' }).select();
    result.details.companies = compData?.length ?? 1;

    // 1. Seed Branches
    const branchRows = CANONICAL_BRANCHES.map((b) => ({
      ...b,
      company_id: companyId
    }));
    const { data: bData } = await (supabase.from('branches') as any).upsert(branchRows, { onConflict: 'id' }).select();
    result.details.branches = bData?.length ?? branchRows.length;

    // 2. Seed Chart of Accounts
    if (DEFAULT_CHART_OF_ACCOUNTS.length > 0) {
      const accRows = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
        id: a.id,
        company_id: companyId,
        code: a.code,
        name_ar: a.nameAr,
        name_en: a.nameEn,
        account_type: a.type,
        account_category: a.category,
        parent_id: a.parentId ?? null,
        is_posting: a.isPosting ?? false,
        opening_balance: a.openingBalance ?? 0,
        current_balance: a.currentBalance ?? 0,
        currency: a.currency ?? 'OMR',
        is_active: a.isActive ?? true,
      }));
      const { data: aData } = await (supabase.from('chart_of_accounts') as any).upsert(accRows, { onConflict: 'id' }).select();
      result.details.accounts = aData?.length ?? accRows.length;
    }

    // 3. Seed Customers
    const custRows = CANONICAL_CUSTOMERS.map((c) => ({
      ...c,
      company_id: companyId
    }));
    const { data: cData } = await (supabase.from('customers') as any).upsert(custRows, { onConflict: 'id' }).select();
    result.details.customers = cData?.length ?? custRows.length;

    // 4. Seed Employees & Profiles / Memberships
    const empRows = CANONICAL_EMPLOYEES.map((e) => ({
      ...e,
      company_id: companyId,
      primary_branch_id: 'brn-sohar'
    }));
    const { data: eData } = await (supabase.from('employees') as any).upsert(empRows, { onConflict: 'id' }).select();
    result.details.employees = eData?.length ?? empRows.length;

    // Seed Profiles for Employees
    const profileRows = CANONICAL_EMPLOYEES.map((e) => ({
      id: e.id,
      email: e.email,
      full_name: e.full_name,
      full_name_en: e.full_name_en,
      phone: e.phone,
      role: e.role,
      company_id: companyId,
      branch_id: 'brn-sohar',
      status: 'ACTIVE'
    }));
    const { data: profData } = await (supabase.from('profiles') as any).upsert(profileRows, { onConflict: 'id' }).select();
    result.details.profiles = profData?.length ?? profileRows.length;

    // Seed User Company Memberships
    const membershipRows = CANONICAL_EMPLOYEES.map((e) => ({
      user_id: e.id,
      company_id: companyId,
      is_active: true
    }));
    const { data: mData } = await (supabase.from('user_company_memberships') as any).upsert(membershipRows, { onConflict: 'user_id,company_id' }).select();
    result.details.memberships = mData?.length ?? membershipRows.length;

    // 5. Seed Inventory / Products
    const prodRows = CANONICAL_PRODUCTS.map((p) => ({
      ...p,
      company_id: companyId
    }));
    const { data: pData } = await (supabase.from('products') as any).upsert(prodRows, { onConflict: 'id' }).select();
    result.details.products = pData?.length ?? prodRows.length;

    // 6. Seed Suppliers
    const supRows = CANONICAL_SUPPLIERS.map((s) => ({
      ...s,
      company_id: companyId
    }));
    const { data: sData } = await (supabase.from('suppliers') as any).upsert(supRows, { onConflict: 'id' }).select();
    result.details.suppliers = sData?.length ?? supRows.length;

    // 7. Seed Spaces
    const spaceRows = CANONICAL_SPACES.map((sp) => ({
      ...sp,
      company_id: companyId,
      branch_id: 'brn-sohar',
      branch_name: 'فرع صحار الرئيسي'
    }));
    const { data: spData } = await (supabase.from('spaces') as any).upsert(spaceRows, { onConflict: 'id' }).select();
    result.details.spaces = spData?.length ?? spaceRows.length;

    // 8. Seed Services
    const srvRows = CANONICAL_SERVICES.map((sv) => ({
      ...sv,
      company_id: companyId,
      branch_id: 'brn-sohar'
    }));
    const { data: svData } = await (supabase.from('consulting_services') as any).upsert(srvRows, { onConflict: 'id' }).select();
    result.details.services = svData?.length ?? srvRows.length;

    // 9. Seed Vouchers (Receipt Vouchers)
    const vchRows = CANONICAL_VOUCHERS.map((v) => ({
      ...v,
      company_id: companyId,
      branch_id: 'brn-sohar'
    }));
    const { data: vData } = await (supabase.from('vouchers') as any).upsert(vchRows, { onConflict: 'id' }).select();
    result.details.vouchers = vData?.length ?? vchRows.length;

    // 10. Seed POS Orders & Shifts
    const posRows = CANONICAL_POS_ORDERS.map((po) => ({
      ...po,
      company_id: companyId,
      branch_id: 'brn-sohar'
    }));
    const { data: poData } = await (supabase.from('pos_orders') as any).upsert(posRows, { onConflict: 'id' }).select();
    result.details.posOrders = poData?.length ?? posRows.length;

    const shiftRows = CANONICAL_SHIFTS.map((sh) => ({
      ...sh,
      company_id: companyId,
      branch_id: 'brn-sohar'
    }));
    await (supabase.from('cashier_shifts') as any).upsert(shiftRows, { onConflict: 'id' }).select();

    result.success = true;
    result.message = 'تم شحن وتضمين كافة البيانات التشغيلية بنجاح إلى قاعدة بيانات Supabase!';
    return result;
  } catch (err: any) {
    console.error('[SeedDemoData] Error:', err);
    result.message = `حدث خطأ أثناء الشحن: ${err?.message || err}`;
    return result;
  }
}
