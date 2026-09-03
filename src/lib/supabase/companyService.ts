/**
 * Company & Branch Service
 * Reads company settings and branches from Supabase.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { CompanySettings, Branch } from '../../types';

// ──────────────────────────────────────────────
// Company
// ──────────────────────────────────────────────

export async function getCompany(companyId: string): Promise<CompanySettings | null> {
  if (!isSupabaseConfigured) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('companies') as any)
    .select('*')
    .eq('id', companyId)
    .maybeSingle();

  if (error || !data) {
    console.error('[CompanyService] getCompany error:', error?.message);
    return null;
  }

  return mapRowToCompanySettings(data);
}

export async function updateCompany(
  companyId: string,
  updates: Partial<CompanySettings>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('companies') as any)
    .update({
      name_ar: updates.companyName,
      name_en: updates.tagline,
      logo_url: updates.logoUrl,
      tax_number: updates.taxId,
      cr_number: updates.crNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Branches
// ──────────────────────────────────────────────

export async function getBranches(companyId: string): Promise<Branch[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('branches') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[CompanyService] getBranches error:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToBranch);
}

export async function upsertBranch(
  branch: Branch,
  companyId: string
): Promise<{ success: boolean; data?: Branch; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const row = {
    id: branch.id,
    company_id: companyId,
    code: branch.code ?? '',
    name: branch.name,
    name_en: branch.nameEn ?? '',
    is_main: branch.isMain ?? false,
    address: branch.address ?? '',
    city: branch.city ?? '',
    country: branch.country ?? '',
    phone: branch.phone ?? '',
    email: branch.email ?? '',
    manager_name: branch.managerName ?? '',
    status: branch.status ?? 'ACTIVE',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('branches') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToBranch(data) };
}

export async function deleteBranch(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('branches') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToCompanySettings(row: any): CompanySettings {
  return {
    companyName: row.name_ar ?? '',
    tagline: row.name_en ?? '',
    logoUrl: row.logo_url ?? '',
    taxId: row.tax_number ?? '',
    crNumber: row.cr_number ?? '',
    address: row.address ?? '',
    cityStateZip: row.city ?? '',
    country: row.country ?? 'Sultanate of Oman',
    phone: row.phone ?? '',
    email: row.email ?? '',
    website: row.website ?? '',
    defaultCurrency: row.default_currency ?? 'OMR',
    headerNotice: row.header_notice ?? '',
    footerNotice: row.footer_notice ?? '',
    termsAndConditions: row.terms ?? '',
    authorizedSignatoryName: row.signatory_name ?? '',
    authorizedSignatoryTitle: row.signatory_title ?? '',
    signatureImageUrl: row.signature_url ?? '',
    stampImageUrl: row.stamp_url ?? '',
    logoWidth: row.logo_width ?? 150,
    bankDetails: row.bank_details ?? {
      bankName: '', accountName: '', accountNumber: '', iban: '', swiftCode: '',
    },
    defaultCustomFields: row.custom_fields ?? [],
    qrCodeContent: '',
    whatsappSettings: row.whatsapp_settings ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToBranch(row: any): Branch {
  return {
    id: row.id,
    code: row.code ?? '',
    name: row.name ?? '',
    nameEn: row.name_en ?? '',
    isMain: row.is_main ?? false,
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    country: row.country ?? '',
    managerName: row.manager_name ?? '',
    status: row.status ?? 'ACTIVE',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}
