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
      payments: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          payment_number: string;
          direction: 'INBOUND' | 'OUTBOUND';
          payment_date: string;
          amount: number;
          currency: string;
          exchange_rate: number;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'ONLINE' | 'WALLET' | 'OTHER';
          status: 'DRAFT' | 'POSTED' | 'CANCELLED';
          customer_id: string | null;
          supplier_id: string | null;
          bank_account_id: string | null;
          journal_entry_id: string | null;
          external_reference: string | null;
          reference_number: string | null;
          notes: string | null;
          posted_at: string | null;
          posted_by: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          payment_number: string;
          direction?: 'INBOUND' | 'OUTBOUND';
          payment_date?: string;
          amount: number;
          currency?: string;
          exchange_rate?: number;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'ONLINE' | 'WALLET' | 'OTHER';
          status?: 'DRAFT' | 'POSTED' | 'CANCELLED';
          customer_id?: string | null;
          supplier_id?: string | null;
          bank_account_id?: string | null;
          journal_entry_id?: string | null;
          external_reference?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          payment_number?: string;
          direction?: 'INBOUND' | 'OUTBOUND';
          payment_date?: string;
          amount?: number;
          currency?: string;
          exchange_rate?: number;
          payment_method?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'ONLINE' | 'WALLET' | 'OTHER';
          status?: 'DRAFT' | 'POSTED' | 'CANCELLED';
          customer_id?: string | null;
          supplier_id?: string | null;
          bank_account_id?: string | null;
          journal_entry_id?: string | null;
          external_reference?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      payment_allocations: {
        Row: {
          id: string;
          company_id: string;
          payment_id: string;
          invoice_id: string;
          allocated_amount: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          payment_id: string;
          invoice_id: string;
          allocated_amount: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          payment_id?: string;
          invoice_id?: string;
          allocated_amount?: number;
          notes?: string | null;
          created_by?: string | null;
        };
      };
      receipts: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          receipt_number: string;
          payment_id: string;
          customer_id: string | null;
          receipt_date: string;
          amount: number;
          currency: string;
          status: 'ISSUED' | 'CANCELLED';
          notes: string | null;
          issued_at: string;
          issued_by: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          receipt_number: string;
          payment_id: string;
          customer_id?: string | null;
          receipt_date?: string;
          amount: number;
          currency?: string;
          status?: 'ISSUED' | 'CANCELLED';
          notes?: string | null;
          issued_at?: string;
          issued_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          receipt_number?: string;
          payment_id?: string;
          customer_id?: string | null;
          receipt_date?: string;
          amount?: number;
          currency?: string;
          status?: 'ISSUED' | 'CANCELLED';
          notes?: string | null;
          issued_at?: string;
          issued_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          customer_id: string;
          sales_order_id: string | null;
          quotation_id: string | null;
          invoice_number: string;
          date: string;
          due_date: string | null;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          customer_id: string;
          sales_order_id?: string | null;
          quotation_id?: string | null;
          invoice_number: string;
          date: string;
          due_date?: string | null;
          subtotal?: number;
          tax_amount?: number;
          total_amount: number;
          status?: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          customer_id?: string;
          sales_order_id?: string | null;
          quotation_id?: string | null;
          invoice_number?: string;
          date?: string;
          due_date?: string | null;
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
          updated_at?: string;
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
