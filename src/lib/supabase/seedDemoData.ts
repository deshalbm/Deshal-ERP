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
// Canonical Default Baseline Seed Datasets (Strict Postgres Types)
// ──────────────────────────────────────────────

export const CANONICAL_BRANCHES = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    code: 'MAIN',
    name_ar: 'فرع صحار الرئيسي',
    name_en: 'Sohar Main Branch',
    city: 'صحار',
    is_active: true
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    code: 'BR-MUSCAT',
    name_ar: 'فرع مسقط - العذيبة',
    name_en: 'Muscat Al Azaiba Branch',
    city: 'مسقط',
    is_active: true
  }
];

export const CANONICAL_EMPLOYEES = [
  {
    id: '61738273-e738-4f53-8718-85811a174281',
    employee_code: 'EMP-101',
    full_name: 'أحمد بن سعيد المعمري',
    job_title: 'المدير العام والتنفيذي',
    email: 'deshalbm.com@gmail.com',
    phone: '+968 99112233',
    status: 'ACTIVE',
    basic_salary: 2500,
    housing_allowance: 250,
    transport_allowance: 150,
    other_allowances: 0
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    employee_code: 'EMP-102',
    full_name: 'فاطمة بنت سالم البلوشي',
    job_title: 'مديرة الموارد البشرية والشؤون الإدارية',
    email: 'fatma.albalushi@deshalbm.com',
    phone: '+968 98223344',
    status: 'ACTIVE',
    basic_salary: 1400,
    housing_allowance: 150,
    transport_allowance: 100,
    other_allowances: 0
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    employee_code: 'EMP-103',
    full_name: 'سالم بن عبدالله الهنائي',
    job_title: 'كبير المحاسبين الماليين',
    email: 'salim.alhinai@deshalbm.com',
    phone: '+968 97334455',
    status: 'ACTIVE',
    basic_salary: 1200,
    housing_allowance: 120,
    transport_allowance: 80,
    other_allowances: 0
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    employee_code: 'EMP-104',
    full_name: 'خالد بن محمد الزدجالي',
    job_title: 'أخصائي المبيعات ونقاط البيع',
    email: 'khalid.alzadjali@deshalbm.com',
    phone: '+968 96445566',
    status: 'ACTIVE',
    basic_salary: 950,
    housing_allowance: 100,
    transport_allowance: 50,
    other_allowances: 0
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    employee_code: 'EMP-105',
    full_name: 'مريم بنت راشد المقبالي',
    job_title: 'مستشارة إدارة المشاريع وحاضنة الأعمال',
    email: 'maryam.almaqbali@deshalbm.com',
    phone: '+968 95556677',
    status: 'ACTIVE',
    basic_salary: 1100,
    housing_allowance: 110,
    transport_allowance: 70,
    other_allowances: 0
  }
];

export const CANONICAL_CUSTOMERS = [
  {
    id: '00000000-0000-0000-0000-000000000401',
    name: 'شركة صحار التنموية ش.م.ع.م',
    contact_person: 'المهندس ناصر المعمري',
    email: 'info@sohardev.om',
    phone: '+968 99123456',
    address: 'ولاية صحار - المنطقة الصناعية',
    city: 'صحار',
    country: 'سلطنة عمان',
    tax_id: 'OM987261',
    cr_number: '1092837',
    customer_type: 'CORPORATE',
    status: 'ACTIVE'
  },
  {
    id: '00000000-0000-0000-0000-000000000402',
    name: 'مؤسسة الباطنة للتجارة والمقاولات',
    contact_person: 'سالم الشامسي',
    email: 'contact@batinatrade.om',
    phone: '+968 92345678',
    address: 'صحار - فلج القبائل',
    city: 'صحار',
    country: 'سلطنة عمان',
    tax_id: 'OM2091823',
    cr_number: '2091823',
    customer_type: 'CORPORATE',
    status: 'ACTIVE'
  },
  {
    id: '00000000-0000-0000-0000-000000000403',
    name: 'عبدالله بن سالم الشحي',
    contact_person: 'عبدالله الشحي',
    email: 'abdullah.alshehhi@gmail.com',
    phone: '+968 95678901',
    address: 'صحار - الهمبار',
    city: 'صحار',
    country: 'سلطنة عمان',
    tax_id: '',
    cr_number: '',
    customer_type: 'INDIVIDUAL',
    status: 'ACTIVE'
  },
  {
    id: '00000000-0000-0000-0000-000000000404',
    name: 'شركة الخليج للحلول الرقمية',
    contact_person: 'أيمن الرئيسي',
    email: 'sales@gulfdigital.om',
    phone: '+968 91234567',
    address: 'مسقط - العذيبة الشمالية',
    city: 'مسقط',
    country: 'سلطنة عمان',
    tax_id: 'OM3049182',
    cr_number: '3049182',
    customer_type: 'CORPORATE',
    status: 'ACTIVE'
  }
];

export const CANONICAL_SUPPLIERS = [
  {
    id: '00000000-0000-0000-0000-000000000501',
    name: 'شركة عُمان للتجهيزات المكتوبة وتكنولوجيا المعلومات',
    phone: '+968 24501234',
    email: 'supply@omantech.om',
    city: 'مسقط',
    tax_id: 'OM1094832',
    cr_number: '1094832',
    category: 'أجهزة وتقنية'
  },
  {
    id: '00000000-0000-0000-0000-000000000502',
    name: 'مؤسسة النماء للتوريدات العمومية',
    phone: '+968 26845678',
    email: 'info@namaa-supply.om',
    city: 'صحار',
    tax_id: 'OM3049281',
    cr_number: '3049281',
    category: 'عام'
  }
];

export const CANONICAL_PRODUCTS = [
  {
    id: '00000000-0000-0000-0000-000000000601',
    sku: 'KSK-PRO-01',
    barcode: '6901234567890',
    name_ar: 'جهاز كشك الحضور والخدمات الذكي Touch-Kiosk Pro',
    name_en: 'Touch-Kiosk Pro Device',
    category: 'أجهزة وأنظمة',
    unit: 'جهاز',
    cost_price: 320.000,
    selling_price: 450.000
  },
  {
    id: '00000000-0000-0000-0000-000000000602',
    sku: 'SRV-FEAS-01',
    barcode: '6901234567891',
    name_ar: 'دراسة جدوى متكاملة لتأسيس مشروع تجاري',
    name_en: 'Feasibility Study Service',
    category: 'استشارات وتأسيس',
    unit: 'دراسة',
    cost_price: 600.000,
    selling_price: 1200.000
  },
  {
    id: '00000000-0000-0000-0000-000000000603',
    sku: 'SPC-MTG-01',
    barcode: '6901234567892',
    name_ar: 'حجز قاعة الاجتماعات الكبرى (بالساعة)',
    name_en: 'Main Conference Room Booking',
    category: 'حجوزات المساحات',
    unit: 'ساعة',
    cost_price: 10.000,
    selling_price: 25.000
  },
  {
    id: '00000000-0000-0000-0000-000000000604',
    sku: 'SUB-COWORK-01',
    barcode: '6901234567893',
    name_ar: 'اشتراك مساحة عمل مشتركة - باقة رواد الأعمال',
    name_en: 'Coworking Membership Plan',
    category: 'اشتراكات المساحات',
    unit: 'شهر',
    cost_price: 30.000,
    selling_price: 85.000
  }
];

export const CANONICAL_SPACES = [
  {
    id: '00000000-0000-0000-0000-000000000701',
    code: 'SPC-01',
    name_ar: 'قاعة الاجتماعات الكبرى - صحار',
    name_en: 'Main Conference Room - Sohar',
    type: 'MEETING_ROOM',
    capacity: 14,
    hourly_rate: 25.000,
    daily_rate: 150.000,
    monthly_rate: 1200.000,
    status: 'AVAILABLE'
  },
  {
    id: '00000000-0000-0000-0000-000000000702',
    code: 'SPC-02',
    name_ar: 'استوديو البودكاست والإعلام الرقمي',
    name_en: 'Podcast & Media Studio',
    type: 'HALL',
    capacity: 5,
    hourly_rate: 35.000,
    daily_rate: 200.000,
    monthly_rate: 1500.000,
    status: 'AVAILABLE'
  },
  {
    id: '00000000-0000-0000-0000-000000000703',
    code: 'SPC-03',
    name_ar: 'مكتب خاص للمؤسسات الناشئة',
    name_en: 'Private Startup Office Suite',
    type: 'OFFICE',
    capacity: 4,
    hourly_rate: 15.000,
    daily_rate: 80.000,
    monthly_rate: 350.000,
    status: 'AVAILABLE'
  }
];

export const CANONICAL_VOUCHERS = [
  {
    id: '00000000-0000-0000-0000-000000000801',
    voucher_number: 'RV-2026-001',
    type: 'RECEIPT',
    date: '2026-09-01',
    received_from: 'شركة صحار التنموية ش.م.ع.م',
    amount: 1850.000,
    total_amount: 1850.000,
    currency: 'OMR',
    payment_method: 'BANK_TRANSFER',
    status: 'POSTED',
    notes: 'دفعة مقدمة لحجز قاعة الاجتماعات وحاضنة الأعمال - سبتمبر 2026'
  },
  {
    id: '00000000-0000-0000-0000-000000000802',
    voucher_number: 'RV-2026-002',
    type: 'RECEIPT',
    date: '2026-09-10',
    received_from: 'عبدالله بن سالم الشحي',
    amount: 250.000,
    total_amount: 250.000,
    currency: 'OMR',
    payment_method: 'CASH',
    status: 'POSTED',
    notes: 'سداد رسوم استوديو البودكاست وتصوير المحتوى الرقمي'
  },
  {
    id: '00000000-0000-0000-0000-000000000803',
    voucher_number: 'RV-2026-003',
    type: 'RECEIPT',
    date: '2026-09-15',
    received_from: 'مؤسسة الباطنة للتجارة والمقاولات',
    amount: 1200.000,
    total_amount: 1200.000,
    currency: 'OMR',
    payment_method: 'CARD',
    status: 'POSTED',
    notes: 'مقابل خدمات استشارية وإعداد دراسة جدوى تسويقية'
  }
];

export const CANONICAL_POS_ORDERS = [
  {
    id: '00000000-0000-0000-0000-000000000901',
    order_number: 'POS-2026-001',
    customer_id: '00000000-0000-0000-0000-000000000401',
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
    id: '00000000-0000-0000-0000-000000000951',
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
        name_ar: 'شركة ديشال لإدارة الأعمال ش.م.م',
        name_en: 'Deshal Business Management LLC',
        cr_number: '1489201',
        tax_number: 'OM99281726',
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
    const mainBranchId = '00000000-0000-0000-0000-000000000101';
    const empRows = CANONICAL_EMPLOYEES.map((e) => ({
      ...e,
      company_id: companyId,
      branch_id: mainBranchId
    }));
    const { data: eData } = await (supabase.from('employees') as any).upsert(empRows, { onConflict: 'id' }).select();
    result.details.employees = eData?.length ?? empRows.length;

    // Seed Profiles for Employees
    const profileRows = CANONICAL_EMPLOYEES.map((e) => ({
      id: e.id,
      email: e.email,
      full_name: e.full_name,
      phone: e.phone,
      company_id: companyId,
      is_active: true
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
      branch_id: mainBranchId
    }));
    const { data: spData } = await (supabase.from('spaces') as any).upsert(spaceRows, { onConflict: 'id' }).select();
    result.details.spaces = spData?.length ?? spaceRows.length;

    // 8. Seed Vouchers (Receipt Vouchers)
    const vchRows = CANONICAL_VOUCHERS.map((v) => ({
      ...v,
      company_id: companyId,
      branch_id: mainBranchId,
      branch_name: 'فرع صحار الرئيسي'
    }));
    const { data: vData } = await (supabase.from('vouchers') as any).upsert(vchRows, { onConflict: 'id' }).select();
    result.details.vouchers = vData?.length ?? vchRows.length;

    // 9. Seed Kiosk Devices
    const kioskRows = [
      {
        id: '00000000-0000-0000-0000-000000000301',
        company_id: companyId,
        branch_id: mainBranchId,
        device_code: 'KSK-SOHAR-01',
        name: 'كشك حضور صحار الذكي',
        location: 'مدخل الاستقبال الرئيسي - صحار',
        is_active: true
      }
    ];
    await (supabase.from('kiosk_devices') as any).upsert(kioskRows, { onConflict: 'id' }).select();

    // 10. Seed POS Orders & Shifts
    const posRows = CANONICAL_POS_ORDERS.map((po) => ({
      ...po,
      company_id: companyId,
      branch_id: mainBranchId
    }));
    const { data: poData } = await (supabase.from('pos_orders') as any).upsert(posRows, { onConflict: 'id' }).select();
    result.details.posOrders = poData?.length ?? posRows.length;

    const shiftRows = CANONICAL_SHIFTS.map((sh) => ({
      ...sh,
      company_id: companyId,
      branch_id: mainBranchId
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
