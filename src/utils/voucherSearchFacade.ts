/**
 * DESHAL ERP — VOUCHER SEARCH & SEQUENCE UTILITY FACADE
 * Encapsulates server-side search and auto-increment voucher sequence lookups.
 */

export async function resolveNextVoucherNumber(companyId: string, voucherType: string, branchId?: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const svc = await import("../lib/supabase/accountingService");
    return await svc.fetchNextVoucherNumber(companyId, voucherType, branchId);
  } catch {
    return null;
  }
}

export async function searchServerSideCustomers(companyId: string, query: string): Promise<{ customers: any[]; total: number }> {
  if (typeof window === "undefined") return { customers: [], total: 0 };
  try {
    const svc = await import("../lib/supabase/customerService");
    return await svc.searchCustomersServerSide(companyId, query);
  } catch {
    return { customers: [], total: 0 };
  }
}

export async function searchServerSideProductsAndServices(companyId: string, query: string): Promise<{ products: any[]; total: number }> {
  if (typeof window === "undefined") return { products: [], total: 0 };
  try {
    const svc = await import("../lib/supabase/masterDataService");
    return await svc.searchProductsAndServicesServerSide(companyId, query);
  } catch {
    return { products: [], total: 0 };
  }
}
