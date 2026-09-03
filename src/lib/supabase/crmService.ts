/**
 * CRM Service — Supabase CRUD
 * Maps CRM Customer Interactions, Leads, Opportunities, and Activities to Supabase tables.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { CustomerInteraction } from '../../types';

export interface Lead {
  id: string;
  leadNumber: string;
  contactName: string;
  companyName?: string;
  phone: string;
  email?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
  source?: string;
  estimatedValue?: number;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Activities & Interactions
// ──────────────────────────────────────────────

export async function getCustomerInteractions(
  companyId: string,
  customerId?: string
): Promise<CustomerInteraction[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('activities') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[CRMService] getCustomerInteractions:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): CustomerInteraction => ({
    id: row.id,
    date: row.created_at ?? new Date().toISOString(),
    type: row.activity_type ?? 'NOTE',
    title: row.title ?? '',
    notes: row.description ?? '',
    createdByName: row.created_by_name ?? '',
  }));
}

export async function addCustomerInteraction(
  customerId: string,
  interaction: CustomerInteraction,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const row = {
    id: interaction.id,
    company_id: companyId,
    customer_id: customerId,
    title: interaction.title,
    description: interaction.notes,
    activity_type: interaction.type,
    created_by_name: interaction.createdByName ?? '',
    created_at: interaction.date ?? new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('activities') as any).insert(row);
  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ──────────────────────────────────────────────
// Leads
// ──────────────────────────────────────────────

export async function getLeads(companyId: string): Promise<Lead[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('leads') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CRMService] getLeads:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): Lead => ({
    id: row.id,
    leadNumber: row.lead_number ?? '',
    contactName: row.contact_name ?? row.name ?? '',
    companyName: row.company_name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    status: row.status ?? 'NEW',
    source: row.source ?? '',
    estimatedValue: row.estimated_value ?? 0,
    assignedTo: row.assigned_to ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertLead(
  lead: Lead,
  companyId: string
): Promise<{ success: boolean; data?: Lead; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const row = {
    id: lead.id,
    company_id: companyId,
    lead_number: lead.leadNumber,
    contact_name: lead.contactName,
    company_name: lead.companyName,
    phone: lead.phone,
    email: lead.email,
    status: lead.status,
    source: lead.source,
    estimated_value: lead.estimatedValue ?? 0,
    assigned_to: lead.assignedTo,
    notes: lead.notes,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('leads') as any)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultLead: Lead = {
    id: data.id,
    leadNumber: data.lead_number ?? '',
    contactName: data.contact_name ?? '',
    companyName: data.company_name ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    status: data.status ?? 'NEW',
    source: data.source ?? '',
    estimatedValue: data.estimated_value ?? 0,
    assignedTo: data.assigned_to ?? '',
    notes: data.notes ?? '',
    createdAt: data.created_at ?? new Date().toISOString(),
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };

  return { success: true, data: resultLead };
}
