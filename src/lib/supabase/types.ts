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
      employee_contracts: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          branch_id: string | null;
          department_id: string | null;
          contract_number: string;
          contract_type: 'LIMITED' | 'UNLIMITED' | 'PART_TIME' | 'TEMPORARY' | 'CONSULTING';
          status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';
          start_date: string;
          end_date: string | null;
          probation_end_date: string | null;
          basic_salary: number;
          housing_allowance: number;
          transport_allowance: number;
          other_allowances: number;
          gross_salary: number;
          currency: string;
          working_hours_per_day: number;
          working_days_per_week: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          branch_id?: string | null;
          department_id?: string | null;
          contract_number: string;
          contract_type?: 'LIMITED' | 'UNLIMITED' | 'PART_TIME' | 'TEMPORARY' | 'CONSULTING';
          status?: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';
          start_date: string;
          end_date?: string | null;
          probation_end_date?: string | null;
          basic_salary?: number;
          housing_allowance?: number;
          transport_allowance?: number;
          other_allowances?: number;
          currency?: string;
          working_hours_per_day?: number;
          working_days_per_week?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          branch_id?: string | null;
          department_id?: string | null;
          contract_number?: string;
          contract_type?: 'LIMITED' | 'UNLIMITED' | 'PART_TIME' | 'TEMPORARY' | 'CONSULTING';
          status?: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';
          start_date?: string;
          end_date?: string | null;
          probation_end_date?: string | null;
          basic_salary?: number;
          housing_allowance?: number;
          transport_allowance?: number;
          other_allowances?: number;
          currency?: string;
          working_hours_per_day?: number;
          working_days_per_week?: number;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      salary_components: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          component_type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
          calculation_type: 'FIXED' | 'PERCENTAGE';
          percentage_of: 'BASIC_SALARY' | 'GROSS_SALARY' | null;
          default_amount: number;
          default_percentage: number | null;
          is_taxable: boolean;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en?: string | null;
          component_type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
          calculation_type?: 'FIXED' | 'PERCENTAGE';
          percentage_of?: 'BASIC_SALARY' | 'GROSS_SALARY' | null;
          default_amount?: number;
          default_percentage?: number | null;
          is_taxable?: boolean;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          code?: string;
          name_ar?: string;
          name_en?: string | null;
          component_type?: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
          calculation_type?: 'FIXED' | 'PERCENTAGE';
          percentage_of?: 'BASIC_SALARY' | 'GROSS_SALARY' | null;
          default_amount?: number;
          default_percentage?: number | null;
          is_taxable?: boolean;
          is_active?: boolean;
          display_order?: number;
          updated_at?: string;
        };
      };
      employee_salary_components: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          salary_component_id: string;
          effective_from: string;
          effective_to: string | null;
          amount: number | null;
          percentage: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          salary_component_id: string;
          effective_from?: string;
          effective_to?: string | null;
          amount?: number | null;
          percentage?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          salary_component_id?: string;
          effective_from?: string;
          effective_to?: string | null;
          amount?: number | null;
          percentage?: number | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          branch_id: string | null;
          attendance_date: string;
          check_in_at: string | null;
          check_out_at: string | null;
          scheduled_check_in_at: string | null;
          scheduled_check_out_at: string | null;
          status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'REMOTE_WORK';
          total_work_minutes: number;
          regular_work_minutes: number;
          overtime_minutes: number;
          late_minutes: number;
          early_departure_minutes: number;
          source: 'KIOSK' | 'MANUAL' | 'SYSTEM' | 'IMPORT' | 'MOBILE';
          is_locked: boolean;
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          branch_id?: string | null;
          attendance_date: string;
          check_in_at?: string | null;
          check_out_at?: string | null;
          scheduled_check_in_at?: string | null;
          scheduled_check_out_at?: string | null;
          status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'REMOTE_WORK';
          total_work_minutes?: number;
          regular_work_minutes?: number;
          overtime_minutes?: number;
          late_minutes?: number;
          early_departure_minutes?: number;
          source?: 'KIOSK' | 'MANUAL' | 'SYSTEM' | 'IMPORT' | 'MOBILE';
          is_locked?: boolean;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          branch_id?: string | null;
          attendance_date?: string;
          check_in_at?: string | null;
          check_out_at?: string | null;
          scheduled_check_in_at?: string | null;
          scheduled_check_out_at?: string | null;
          status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'REMOTE_WORK';
          total_work_minutes?: number;
          regular_work_minutes?: number;
          overtime_minutes?: number;
          late_minutes?: number;
          early_departure_minutes?: number;
          source?: 'KIOSK' | 'MANUAL' | 'SYSTEM' | 'IMPORT' | 'MOBILE';
          is_locked?: boolean;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      leave_types: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          annual_entitlement: number;
          is_paid: boolean;
          requires_approval: boolean;
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
          annual_entitlement?: number;
          is_paid?: boolean;
          requires_approval?: boolean;
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
          annual_entitlement?: number;
          is_paid?: boolean;
          requires_approval?: boolean;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      employee_leave_balances: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          leave_type_id: string;
          year: number;
          opening_balance: number;
          accrued_days: number;
          used_days: number;
          adjusted_days: number;
          closing_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          leave_type_id: string;
          year: number;
          opening_balance?: number;
          accrued_days?: number;
          used_days?: number;
          adjusted_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          leave_type_id?: string;
          year?: number;
          opening_balance?: number;
          accrued_days?: number;
          used_days?: number;
          adjusted_days?: number;
          updated_at?: string;
        };
      };
      payroll_slips: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          contract_id: string | null;
          month: string;
          period_start: string | null;
          period_end: string | null;
          basic_salary: number;
          total_allowances: number;
          total_earnings: number;
          total_deductions: number;
          net_salary: number;
          status: 'DRAFT' | 'POSTED' | 'PAID' | 'LOCKED' | 'CANCELLED';
          payment_status: 'UNPAID' | 'PARTIAL' | 'PAID' | null;
          posted_at: string | null;
          posted_by: string | null;
          locked_at: string | null;
          disbursed_at: string | null;
          journal_entry_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          contract_id?: string | null;
          month: string;
          period_start?: string | null;
          period_end?: string | null;
          basic_salary?: number;
          total_allowances?: number;
          total_earnings?: number;
          total_deductions?: number;
          net_salary?: number;
          status?: 'DRAFT' | 'POSTED' | 'PAID' | 'LOCKED' | 'CANCELLED';
          payment_status?: 'UNPAID' | 'PARTIAL' | 'PAID' | null;
          posted_at?: string | null;
          posted_by?: string | null;
          locked_at?: string | null;
          disbursed_at?: string | null;
          journal_entry_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          contract_id?: string | null;
          month?: string;
          period_start?: string | null;
          period_end?: string | null;
          basic_salary?: number;
          total_allowances?: number;
          total_earnings?: number;
          total_deductions?: number;
          net_salary?: number;
          status?: 'DRAFT' | 'POSTED' | 'PAID' | 'LOCKED' | 'CANCELLED';
          payment_status?: 'UNPAID' | 'PARTIAL' | 'PAID' | null;
          posted_at?: string | null;
          posted_by?: string | null;
          locked_at?: string | null;
          disbursed_at?: string | null;
          journal_entry_id?: string | null;
          updated_at?: string;
        };
      };
      payroll_slip_lines: {
        Row: {
          id: string;
          payroll_slip_id: string;
          salary_component_id: string | null;
          component_code: string;
          component_name_ar: string;
          component_name_en: string | null;
          component_type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
          amount: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payroll_slip_id: string;
          salary_component_id?: string | null;
          component_code: string;
          component_name_ar: string;
          component_name_en?: string | null;
          component_type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
          amount?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          payroll_slip_id?: string;
          salary_component_id?: string | null;
          component_code?: string;
          component_name_ar?: string;
          component_name_en?: string | null;
          component_type?: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
          amount?: number;
          notes?: string | null;
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
