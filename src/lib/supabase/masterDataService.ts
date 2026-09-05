/**
 * Master Data Service — Oman Locations, Products & Services Catalog
 */

import { supabase, isSupabaseConfigured } from './client';
import type { MasterLocation, InventoryItem } from '../../types';
import { ensureValidUuid } from '../../utils/uuid';

// Fallback Master Locations for Oman
export const DEFAULT_MASTER_LOCATIONS: MasterLocation[] = [
  { id: 'loc-1', governorateAr: 'شمال الباطنة', governorateEn: 'North Al Batinah', cityAr: 'صحار', cityEn: 'Sohar', displayOrder: 1 },
  { id: 'loc-2', governorateAr: 'شمال الباطنة', governorateEn: 'North Al Batinah', cityAr: 'لوى', cityEn: 'Liwa', displayOrder: 2 },
  { id: 'loc-3', governorateAr: 'شمال الباطنة', governorateEn: 'North Al Batinah', cityAr: 'شناص', cityEn: 'Shinas', displayOrder: 3 },
  { id: 'loc-4', governorateAr: 'شمال الباطنة', governorateEn: 'North Al Batinah', cityAr: 'صحم', cityEn: 'Saham', displayOrder: 4 },
  { id: 'loc-5', governorateAr: 'مسقط', governorateEn: 'Muscat', cityAr: 'مسقط', cityEn: 'Muscat', displayOrder: 10 },
  { id: 'loc-6', governorateAr: 'مسقط', governorateEn: 'Muscat', cityAr: 'السيب', cityEn: 'Seeb', displayOrder: 11 },
  { id: 'loc-7', governorateAr: 'مسقط', governorateEn: 'Muscat', cityAr: 'بوشر', cityEn: 'Bawshar', displayOrder: 12 },
  { id: 'loc-8', governorateAr: 'ظفار', governorateEn: 'Dhofar', cityAr: 'صلالة', cityEn: 'Salalah', displayOrder: 20 },
  { id: 'loc-9', governorateAr: 'جنوب الباطنة', governorateEn: 'South Al Batinah', cityAr: 'الرستاق', cityEn: 'Rustaq', displayOrder: 30 },
  { id: 'loc-10', governorateAr: 'جنوب الباطنة', governorateEn: 'South Al Batinah', cityAr: 'بركاء', cityEn: 'Barka', displayOrder: 31 },
  { id: 'loc-11', governorateAr: 'الداخلية', governorateEn: 'Ad Dakhiliyah', cityAr: 'نزوى', cityEn: 'Nizwa', displayOrder: 40 },
  { id: 'loc-12', governorateAr: 'البريمي', governorateEn: 'Al Buraimi', cityAr: 'البريمي', cityEn: 'Al Buraimi', displayOrder: 50 },
  { id: 'loc-13', governorateAr: 'الظاهرة', governorateEn: 'Ad Dhahirah', cityAr: 'عبري', cityEn: 'Ibri', displayOrder: 60 },
  { id: 'loc-14', governorateAr: 'مسندم', governorateEn: 'Musandam', cityAr: 'خصب', cityEn: 'Khasab', displayOrder: 70 },
];

export async function getMasterLocations(): Promise<MasterLocation[]> {
  if (!isSupabaseConfigured) return DEFAULT_MASTER_LOCATIONS;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('master_locations') as any)
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_MASTER_LOCATIONS;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id,
      governorateAr: row.governorate_ar,
      governorateEn: row.governorate_en,
      cityAr: row.city_ar,
      cityEn: row.city_en,
      displayOrder: row.display_order,
    }));
  } catch (e) {
    console.warn('[MasterDataService] getMasterLocations failed, using fallback:', e);
    return DEFAULT_MASTER_LOCATIONS;
  }
}

export async function searchProductsAndServicesServerSide(
  companyId: string,
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<{ products: InventoryItem[]; total: number }> {
  if (!isSupabaseConfigured) return { products: [], total: 0 };

  const validCompanyId = ensureValidUuid(companyId);
  const offset = (page - 1) * limit;

  let req = (supabase.from('products') as any)
    .select('*', { count: 'exact' })
    .eq('company_id', validCompanyId);

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    req = req.or(`name.ilike.${q},sku.ilike.${q},barcode.ilike.${q},category.ilike.${q}`);
  }

  const { data, count, error } = await req
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[MasterDataService] searchProductsAndServicesServerSide:', error.message);
    return { products: [], total: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: InventoryItem[] = (data ?? []).map((row: any) => ({
    id: row.id,
    sku: row.sku ?? '',
    barcode: row.barcode ?? '',
    name: row.name ?? '',
    category: row.category ?? '',
    warehouse: row.warehouse ?? '',
    unit: row.unit ?? 'حبة',
    quantity: row.quantity ?? 0,
    minAlertQuantity: row.min_alert_quantity ?? 5,
    costPrice: row.cost_price ?? 0,
    sellingPrice: row.selling_price ?? 0,
    status: row.quantity <= 0 ? 'OUT_OF_STOCK' : row.quantity < 5 ? 'LOW_STOCK' : 'IN_STOCK',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));

  return {
    products: items,
    total: count ?? 0,
  };
}
