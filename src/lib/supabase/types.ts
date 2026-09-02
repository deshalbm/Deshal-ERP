// Supabase Database Type Definitions for Deshal ERP

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          cr_number: string | null;
          tax_number: string | null;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          cr_number?: string | null;
          tax_number?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string | null;
          cr_number?: string | null;
          tax_number?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          city: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en?: string | null;
          city?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          code?: string;
          name_ar?: string;
          name_en?: string | null;
          city?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          employee_id?: string | null;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          city: string | null;
          tax_id: string | null;
          cr_number: string | null;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          tax_id?: string | null;
          cr_number?: string | null;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          tax_id?: string | null;
          cr_number?: string | null;
          category?: string;
          updated_at?: string;
        };
      };
      pipelines: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          description: string | null;
          is_active: boolean;
          is_default: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en?: string | null;
          description?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          code?: string;
          name_ar?: string;
          name_en?: string | null;
          description?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          lead_number: string;
          name: string;
          company_name: string | null;
          job_title: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          city: string | null;
          country: string | null;
          source: string | null;
          source_details: string | null;
          status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST';
          score: number;
          estimated_value: number;
          currency: string;
          assigned_to: string | null;
          converted_customer_id: string | null;
          converted_opportunity_id: string | null;
          converted_at: string | null;
          lost_reason: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          lead_number: string;
          name: string;
          company_name?: string | null;
          job_title?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          city?: string | null;
          country?: string | null;
          source?: string | null;
          source_details?: string | null;
          status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST';
          score?: number;
          estimated_value?: number;
          currency?: string;
          assigned_to?: string | null;
          converted_customer_id?: string | null;
          converted_opportunity_id?: string | null;
          converted_at?: string | null;
          lost_reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          lead_number?: string;
          name?: string;
          company_name?: string | null;
          job_title?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          city?: string | null;
          country?: string | null;
          source?: string | null;
          source_details?: string | null;
          status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST';
          score?: number;
          estimated_value?: number;
          currency?: string;
          assigned_to?: string | null;
          converted_customer_id?: string | null;
          converted_opportunity_id?: string | null;
          converted_at?: string | null;
          lost_reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      chart_of_accounts: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          type: string;
          category: string;
          parent_id: string | null;
          is_posting: boolean;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en?: string | null;
          type: string;
          category: string;
          parent_id?: string | null;
          is_posting?: boolean;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          code?: string;
          name_ar?: string;
          name_en?: string | null;
          type?: string;
          category?: string;
          parent_id?: string | null;
          is_posting?: boolean;
          currency?: string;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          entry_number: string;
          date: string;
          type: string;
          status: string;
          total_debit: number;
          total_credit: number;
          is_balanced: boolean;
          description_ar: string;
          description_en: string | null;
          reference_number: string | null;
          posted_at: string | null;
          posted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          entry_number: string;
          date: string;
          type?: string;
          status?: string;
          total_debit: number;
          total_credit: number;
          is_balanced?: boolean;
          description_ar: string;
          description_en?: string | null;
          reference_number?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          entry_number?: string;
          date?: string;
          type?: string;
          status?: string;
          total_debit?: number;
          total_credit?: number;
          is_balanced?: boolean;
          description_ar?: string;
          description_en?: string | null;
          reference_number?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          company_id: string;
          actor_id: string | null;
          action: string;
          domain: string;
          entity_id: string | null;
          details: string;
          ip_address: string | null;
          before_state: Json | null;
          after_state: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          actor_id?: string | null;
          action: string;
          domain: string;
          entity_id?: string | null;
          details: string;
          ip_address?: string | null;
          before_state?: Json | null;
          after_state?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          actor_id?: string | null;
          action?: string;
          domain?: string;
          entity_id?: string | null;
          details?: string;
          ip_address?: string | null;
          before_state?: Json | null;
          after_state?: Json | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auth_user_company_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      auth_user_has_permission: {
        Args: { p_permission: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
