/**
 * Demo Data Seeder Utility for Deshal ERP
 * Allows seeding initial demo data into Supabase on demand from Settings.
 * Does NOT auto-run on app load to keep live databases clean by default.
 */

import { supabase, isSupabaseConfigured } from './client';
import {
  DEFAULT_CHART_OF_ACCOUNTS,
} from '../../utils/accountingStorage';
import {
  loadCustomers,
  loadEmployees,
  loadInventory,
  loadSuppliers,
  loadBranches,
  loadRentalSpaces,
  loadConsultingServices,
} from '../../utils/storage';

export interface SeedResult {
  success: boolean;
  message: string;
  details: {
    branches: number;
    accounts: number;
    customers: number;
    employees: number;
    products: number;
    suppliers: number;
    spaces: number;
    services: number;
  };
}

/**
 * Seeds demo data into Supabase for the specified companyId.
 */
export async function seedDemoDataToSupabase(companyId: string): Promise<SeedResult> {
  const result: SeedResult = {
    success: false,
    message: '',
    details: {
      branches: 0,
      accounts: 0,
      customers: 0,
      employees: 0,
      products: 0,
      suppliers: 0,
      spaces: 0,
      services: 0,
    },
  };

  if (!isSupabaseConfigured || !companyId) {
    result.message = 'Supabase غير محدد أو معرّف الشركة غير متوفر.';
    return result;
  }

  try {
    // 1. Seed Branches
    const branches = loadBranches();
    if (branches.length > 0) {
      const rows = branches.map((b) => ({
        id: b.id,
        company_id: companyId,
        code: b.code,
        name: b.name,
        name_en: b.nameEn ?? '',
        is_main: b.isMain ?? false,
        phone: b.phone ?? '',
        email: b.email ?? '',
        address: b.address ?? '',
        city: b.city ?? '',
        country: b.country ?? '',
        manager_name: b.managerName ?? '',
        status: b.status ?? 'ACTIVE',
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('branches') as any).upsert(rows, { onConflict: 'id' }).select();
      result.details.branches = data?.length ?? rows.length;
    }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('chart_of_accounts') as any).upsert(accRows, { onConflict: 'id' }).select();
      result.details.accounts = data?.length ?? accRows.length;
    }

    // 3. Seed Customers
    const customers = loadCustomers();
    if (customers.length > 0) {
      const custRows = customers.map((c) => ({
        id: c.id,
        company_id: companyId,
        name: c.name,
        contact_person: c.contactPerson ?? '',
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        country: c.country,
        tax_id: c.taxId,
        cr_number: c.crNumber,
        customer_type: c.type,
        status: c.status,
        notes: c.notes,
        credit_limit: c.creditLimit ?? 0,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('customers') as any).upsert(custRows, { onConflict: 'id' }).select();
      result.details.customers = data?.length ?? custRows.length;
    }

    // 4. Seed Employees
    const employees = loadEmployees();
    if (employees.length > 0) {
      const empRows = employees.map((e) => ({
        id: e.id,
        company_id: companyId,
        employee_code: e.employeeCode,
        full_name: e.fullName,
        full_name_en: e.fullNameEn,
        email: e.email,
        phone: e.phone,
        role: e.role,
        job_title: e.jobTitle,
        department: e.department,
        status: e.status,
        hire_date: e.hireDate || null,
        basic_salary: e.basicSalary ?? 0,
        allowances: e.allowances ?? 0,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('employees') as any).upsert(empRows, { onConflict: 'id' }).select();
      result.details.employees = data?.length ?? empRows.length;
    }

    // 5. Seed Inventory / Products
    const items = loadInventory();
    if (items.length > 0) {
      const prodRows = items.map((i) => ({
        id: i.id,
        company_id: companyId,
        sku: i.sku,
        barcode: i.barcode,
        name: i.name,
        category: i.category,
        warehouse: i.warehouse,
        unit: i.unit,
        quantity: i.quantity ?? 0,
        cost_price: i.costPrice ?? 0,
        selling_price: i.sellingPrice ?? 0,
        status: i.status,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('products') as any).upsert(prodRows, { onConflict: 'id' }).select();
      result.details.products = data?.length ?? prodRows.length;
    }

    // 6. Seed Suppliers
    const suppliers = loadSuppliers();
    if (suppliers.length > 0) {
      const supRows = suppliers.map((s) => ({
        id: s.id,
        company_id: companyId,
        name: s.name,
        contact_person: s.contactPerson ?? '',
        email: s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        tax_id: s.taxId,
        cr_number: s.crNumber,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('suppliers') as any).upsert(supRows, { onConflict: 'id' }).select();
      result.details.suppliers = data?.length ?? supRows.length;
    }

    // 7. Seed Spaces
    const spaces = loadRentalSpaces();
    if (spaces.length > 0) {
      const spaceRows = spaces.map((sp) => ({
        id: sp.id,
        company_id: companyId,
        code: sp.code,
        name: sp.name,
        name_en: sp.nameEn,
        space_type: sp.type,
        capacity: sp.capacity,
        hourly_rate: sp.hourlyRate,
        daily_rate: sp.dailyRate,
        monthly_rate: sp.monthlyRate,
        status: sp.status,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('spaces') as any).upsert(spaceRows, { onConflict: 'id' }).select();
      result.details.spaces = data?.length ?? spaceRows.length;
    }

    // 8. Seed Services
    const services = loadConsultingServices();
    if (services.length > 0) {
      const srvRows = services.map((sv) => ({
        id: sv.id,
        company_id: companyId,
        code: sv.code,
        name: sv.name,
        name_en: sv.nameEn,
        category: sv.category,
        base_price: sv.basePrice,
        pricing_model: sv.pricingModel,
        status: sv.status,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('consulting_services') as any).upsert(srvRows, { onConflict: 'id' }).select();
      result.details.services = data?.length ?? srvRows.length;
    }

    result.success = true;
    result.message = 'تم شحن البيانات التوضيحية بنجاح إلى Supabase!';
    return result;
  } catch (err: any) {
    console.error('[SeedDemoData] Error:', err);
    result.message = `حدث خطأ أثناء الشحن: ${err?.message || err}`;
    return result;
  }
}
