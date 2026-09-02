/**
 * Supabase Cloud Backup & Sync Engine
 * Direct REST API synchronization between employee devices and Supabase database.
 */

import {
  CompanySettings,
  DesignTheme,
  ReceiptVoucher,
  Customer,
  InventoryItem,
  StockMovement,
  PurchaseInvoice,
  Supplier,
  Branch,
  StockTransfer,
  Employee,
  AuditLogEntry,
  POSOrder,
  RecurringSchedule
} from "../types";

export interface FullAppBackupSnapshot {
  version: string;
  timestamp: string;
  backupId: string;
  companyName: string;
  syncKey: string;
  data: {
    settings: CompanySettings;
    theme: DesignTheme;
    vouchers: ReceiptVoucher[];
    customers: Customer[];
    inventory: InventoryItem[];
    purchases: PurchaseInvoice[];
    suppliers: Supplier[];
    stockMovements: StockMovement[];
    branches: Branch[];
    stockTransfers: StockTransfer[];
    employees: Employee[];
    schedules: RecurringSchedule[];
    posOrders: POSOrder[];
    auditLogs: AuditLogEntry[];
  };
}

/**
 * Generates SQL snippet that the user can execute in Supabase SQL editor
 */
export function generateSupabaseSqlSetup(tableName = "deshal_erp_backups"): string {
  return `-- ============================================================
-- SQL Setup for Deshal ERP Cloud Backup & Multi-Device Sync
-- Execute this script in your Supabase Project SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.${tableName} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_key TEXT NOT NULL UNIQUE,
    company_name TEXT,
    snapshot JSONB NOT NULL,
    records_count JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

-- Allow read/write access via anon key for the sync application
CREATE POLICY "Allow public sync access"
ON public.${tableName}
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Index for fast lookup by sync_key
CREATE INDEX IF NOT EXISTS idx_${tableName}_sync_key ON public.${tableName} (sync_key);
`;
}

/**
 * Test connectivity and authorization with Supabase REST API
 */
export async function testSupabaseConnection(
  supabaseUrl: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      return { success: false, message: "Invalid URL. Must begin with https://" };
    }
    if (!anonKey.trim()) {
      return { success: false, message: "Anon Key is required." };
    }

    // Ping the Supabase REST root or schema endpoint
    const response = await fetch(`${cleanUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: anonKey.trim(),
        Authorization: `Bearer ${anonKey.trim()}`
      }
    });

    if (response.status === 200 || response.status === 404 || response.status === 401) {
      if (response.status === 401) {
        return { success: false, message: "Authentication failed. Check your Supabase anon/public key." };
      }
      return { success: true, message: "Connection established successfully with Supabase!" };
    }

    return {
      success: true,
      message: `Supabase reached (HTTP ${response.status}). Ready for cloud sync.`
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to reach Supabase server. Check your network or URL."
    };
  }
}

/**
 * Pushes full snapshot to Supabase database table using upsert
 */
export async function pushBackupToSupabase(
  supabaseUrl: string,
  anonKey: string,
  tableName: string,
  syncKey: string,
  snapshot: FullAppBackupSnapshot
): Promise<{ success: boolean; message: string; timestamp?: string }> {
  try {
    const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");
    const cleanTable = (tableName || "deshal_erp_backups").trim();
    const cleanKey = (syncKey || "default-tenant").trim();

    const payload = {
      sync_key: cleanKey,
      company_name: snapshot.companyName || "Deshal Business ERP",
      snapshot: snapshot,
      records_count: {
        vouchers: snapshot.data.vouchers?.length || 0,
        inventory: snapshot.data.inventory?.length || 0,
        customers: snapshot.data.customers?.length || 0,
        purchases: snapshot.data.purchases?.length || 0
      },
      updated_at: new Date().toISOString()
    };

    // Upsert into Supabase REST endpoint: /rest/v1/{table}?on_conflict=sync_key
    const response = await fetch(`${cleanUrl}/rest/v1/${cleanTable}?on_conflict=sync_key`, {
      method: "POST",
      headers: {
        apikey: anonKey.trim(),
        Authorization: `Bearer ${anonKey.trim()}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        message: `Supabase sync error (${response.status}): ${errText || response.statusText}`
      };
    }

    const nowIso = new Date().toISOString();
    return {
      success: true,
      message: "تم حفظ النسخة الاحتياطية بنجاح على سحابة Supabase ومزامنتها!",
      timestamp: nowIso
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Cloud backup failed due to network exception."
    };
  }
}

/**
 * Pulls the latest snapshot from Supabase database table
 */
export async function pullBackupFromSupabase(
  supabaseUrl: string,
  anonKey: string,
  tableName: string,
  syncKey: string
): Promise<{ success: boolean; snapshot?: FullAppBackupSnapshot; message: string }> {
  try {
    const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");
    const cleanTable = (tableName || "deshal_erp_backups").trim();
    const cleanKey = (syncKey || "default-tenant").trim();

    const endpoint = `${cleanUrl}/rest/v1/${cleanTable}?sync_key=eq.${encodeURIComponent(cleanKey)}&select=*`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: anonKey.trim(),
        Authorization: `Bearer ${anonKey.trim()}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        message: `Could not fetch backup from Supabase (${response.status}): ${errText}`
      };
    }

    const rows = await response.json();
    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: `No cloud backup found for sync key: "${cleanKey}". Push a backup first.`
      };
    }

    const row = rows[0];
    const snapshot = row.snapshot as FullAppBackupSnapshot;

    if (!snapshot || !snapshot.data) {
      return {
        success: false,
        message: "Invalid snapshot structure retrieved from Supabase."
      };
    }

    return {
      success: true,
      snapshot,
      message: `تم جلب أحدث نسخة سحابية بنجاح (${new Date(snapshot.timestamp).toLocaleString()})`
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Cloud restore failed due to network exception."
    };
  }
}
