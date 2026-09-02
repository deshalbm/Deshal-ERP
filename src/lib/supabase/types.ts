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
      purchase_orders: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          supplier_id: string;
          warehouse_id: string | null;
          purchase_number: string;
          supplier_invoice_no: string | null;
          date: string;
          due_date: string | null;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
          payment_status: 'UNPAID' | 'PARTIAL' | 'PAID' | null;
          received_at: string | null;
          confirmed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          supplier_id: string;
          warehouse_id?: string | null;
          purchase_number: string;
          supplier_invoice_no?: string | null;
          date: string;
          due_date?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
          payment_status?: 'UNPAID' | 'PARTIAL' | 'PAID' | null;
          received_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          supplier_id?: string;
          warehouse_id?: string | null;
          purchase_number?: string;
          supplier_invoice_no?: string | null;
          date?: string;
          due_date?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
          payment_status?: 'UNPAID' | 'PARTIAL' | 'PAID' | null;
          received_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          updated_at?: string;
        };
      };
      purchase_order_lines: {
        Row: {
          id: string;
          purchase_order_id: string;
          product_id: string;
          description: string | null;
          quantity: number;
          received_quantity: number;
          invoiced_quantity: number;
          unit_price: number;
          discount_amount: number;
          tax_amount: number;
          line_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          product_id: string;
          description?: string | null;
          quantity: number;
          received_quantity?: number;
          invoiced_quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          tax_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          product_id?: string;
          description?: string | null;
          quantity?: number;
          received_quantity?: number;
          invoiced_quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          tax_amount?: number;
          updated_at?: string;
        };
      };
      goods_receipts: {
        Row: {
          id: string;
          company_id: string;
          purchase_order_id: string;
          supplier_id: string;
          warehouse_id: string;
          receipt_number: string;
          receipt_date: string;
          status: 'DRAFT' | 'RECEIVED' | 'CANCELLED';
          notes: string | null;
          received_at: string | null;
          received_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          purchase_order_id: string;
          supplier_id: string;
          warehouse_id: string;
          receipt_number: string;
          receipt_date?: string;
          status?: 'DRAFT' | 'RECEIVED' | 'CANCELLED';
          notes?: string | null;
          received_at?: string | null;
          received_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          purchase_order_id?: string;
          supplier_id?: string;
          warehouse_id?: string;
          receipt_number?: string;
          receipt_date?: string;
          status?: 'DRAFT' | 'RECEIVED' | 'CANCELLED';
          notes?: string | null;
          received_at?: string | null;
          received_by?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      goods_receipt_lines: {
        Row: {
          id: string;
          goods_receipt_id: string;
          purchase_order_line_id: string;
          product_id: string;
          quantity: number;
          accepted_quantity: number;
          rejected_quantity: number;
          unit_cost: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goods_receipt_id: string;
          purchase_order_line_id: string;
          product_id: string;
          quantity: number;
          accepted_quantity: number;
          rejected_quantity?: number;
          unit_cost?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          goods_receipt_id?: string;
          purchase_order_line_id?: string;
          product_id?: string;
          quantity?: number;
          accepted_quantity?: number;
          rejected_quantity?: number;
          unit_cost?: number;
          notes?: string | null;
        };
      };
      supplier_invoices: {
        Row: {
          id: string;
          company_id: string;
          supplier_id: string;
          purchase_order_id: string | null;
          invoice_number: string;
          supplier_invoice_number: string | null;
          invoice_date: string;
          due_date: string | null;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          paid_amount: number;
          outstanding_amount: number;
          currency: string;
          status: 'DRAFT' | 'POSTED' | 'PARTIAL' | 'PAID' | 'CANCELLED';
          journal_entry_id: string | null;
          posted_at: string | null;
          posted_by: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          supplier_id: string;
          purchase_order_id?: string | null;
          invoice_number: string;
          supplier_invoice_number?: string | null;
          invoice_date?: string;
          due_date?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          currency?: string;
          status?: 'DRAFT' | 'POSTED' | 'PARTIAL' | 'PAID' | 'CANCELLED';
          journal_entry_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          supplier_id?: string;
          purchase_order_id?: string | null;
          invoice_number?: string;
          supplier_invoice_number?: string | null;
          invoice_date?: string;
          due_date?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          currency?: string;
          status?: 'DRAFT' | 'POSTED' | 'PARTIAL' | 'PAID' | 'CANCELLED';
          journal_entry_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      supplier_invoice_lines: {
        Row: {
          id: string;
          supplier_invoice_id: string;
          purchase_order_line_id: string | null;
          goods_receipt_line_id: string | null;
          product_id: string | null;
          description: string | null;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          tax_amount: number;
          line_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_invoice_id: string;
          purchase_order_line_id?: string | null;
          goods_receipt_line_id?: string | null;
          product_id?: string | null;
          description?: string | null;
          quantity: number;
          unit_price?: number;
          discount_amount?: number;
          tax_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_invoice_id?: string;
          purchase_order_line_id?: string | null;
          goods_receipt_line_id?: string | null;
          product_id?: string | null;
          description?: string | null;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          tax_amount?: number;
          updated_at?: string;
        };
      };
      supplier_payment_allocations: {
        Row: {
          id: string;
          payment_id: string;
          supplier_invoice_id: string;
          allocated_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          supplier_invoice_id: string;
          allocated_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          supplier_invoice_id?: string;
          allocated_amount?: number;
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
