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
      stock_balances: {
        Row: {
          id: string;
          company_id: string;
          product_id: string;
          warehouse_id: string;
          quantity: number;
          reserved_quantity: number;
          available_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          product_id: string;
          warehouse_id: string;
          quantity?: number;
          reserved_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          product_id?: string;
          warehouse_id?: string;
          quantity?: number;
          reserved_quantity?: number;
          updated_at?: string;
        };
      };
      inventory_transactions: {
        Row: {
          id: string;
          company_id: string;
          warehouse_id: string;
          product_id: string;
          transaction_number: string;
          transaction_type:
            | 'OPENING'
            | 'PURCHASE_RECEIPT'
            | 'PURCHASE_RETURN'
            | 'SALE_ISSUE'
            | 'SALE_RETURN'
            | 'TRANSFER_OUT'
            | 'TRANSFER_IN'
            | 'ADJUSTMENT_IN'
            | 'ADJUSTMENT_OUT'
            | 'PRODUCTION_IN'
            | 'PRODUCTION_OUT';
          status: 'DRAFT' | 'POSTED' | 'CANCELLED';
          quantity: number;
          unit_cost: number;
          total_cost: number;
          transaction_date: string;
          reference_type: string | null;
          reference_id: string | null;
          source_warehouse_id: string | null;
          destination_warehouse_id: string | null;
          notes: string | null;
          posted_at: string | null;
          posted_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          warehouse_id: string;
          product_id: string;
          transaction_number: string;
          transaction_type:
            | 'OPENING'
            | 'PURCHASE_RECEIPT'
            | 'PURCHASE_RETURN'
            | 'SALE_ISSUE'
            | 'SALE_RETURN'
            | 'TRANSFER_OUT'
            | 'TRANSFER_IN'
            | 'ADJUSTMENT_IN'
            | 'ADJUSTMENT_OUT'
            | 'PRODUCTION_IN'
            | 'PRODUCTION_OUT';
          status?: 'DRAFT' | 'POSTED' | 'CANCELLED';
          quantity: number;
          unit_cost?: number;
          transaction_date?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          source_warehouse_id?: string | null;
          destination_warehouse_id?: string | null;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          warehouse_id?: string;
          product_id?: string;
          transaction_number?: string;
          transaction_type?:
            | 'OPENING'
            | 'PURCHASE_RECEIPT'
            | 'PURCHASE_RETURN'
            | 'SALE_ISSUE'
            | 'SALE_RETURN'
            | 'TRANSFER_OUT'
            | 'TRANSFER_IN'
            | 'ADJUSTMENT_IN'
            | 'ADJUSTMENT_OUT'
            | 'PRODUCTION_IN'
            | 'PRODUCTION_OUT';
          status?: 'DRAFT' | 'POSTED' | 'CANCELLED';
          quantity?: number;
          unit_cost?: number;
          transaction_date?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          source_warehouse_id?: string | null;
          destination_warehouse_id?: string | null;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      stock_transfers: {
        Row: {
          id: string;
          company_id: string;
          transfer_number: string;
          source_warehouse_id: string;
          destination_warehouse_id: string;
          status: 'DRAFT' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
          transfer_date: string;
          shipped_at: string | null;
          received_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          transfer_number: string;
          source_warehouse_id: string;
          destination_warehouse_id: string;
          status?: 'DRAFT' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
          transfer_date?: string;
          shipped_at?: string | null;
          received_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          transfer_number?: string;
          source_warehouse_id?: string;
          destination_warehouse_id?: string;
          status?: 'DRAFT' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
          transfer_date?: string;
          shipped_at?: string | null;
          received_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      stock_transfer_lines: {
        Row: {
          id: string;
          stock_transfer_id: string;
          product_id: string;
          quantity: number;
          unit_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          stock_transfer_id: string;
          product_id: string;
          quantity: number;
          unit_cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          stock_transfer_id?: string;
          product_id?: string;
          quantity?: number;
          unit_cost?: number;
        };
      };
      stock_reservations: {
        Row: {
          id: string;
          company_id: string;
          warehouse_id: string;
          product_id: string;
          sales_order_id: string | null;
          sales_order_line_id: string | null;
          reserved_quantity: number;
          status: 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'CANCELLED';
          reserved_at: string;
          released_at: string | null;
          fulfilled_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          warehouse_id: string;
          product_id: string;
          sales_order_id?: string | null;
          sales_order_line_id?: string | null;
          reserved_quantity: number;
          status?: 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'CANCELLED';
          reserved_at?: string;
          released_at?: string | null;
          fulfilled_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          warehouse_id?: string;
          product_id?: string;
          sales_order_id?: string | null;
          sales_order_line_id?: string | null;
          reserved_quantity?: number;
          status?: 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'CANCELLED';
          reserved_at?: string;
          released_at?: string | null;
          fulfilled_at?: string | null;
          created_by?: string | null;
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
