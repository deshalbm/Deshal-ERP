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
      documents: {
        Row: {
          id: string;
          company_id: string;
          category_id: string | null;
          document_number: string | null;
          title: string;
          description: string | null;
          file_name: string;
          file_type: string;
          mime_type: string | null;
          file_size: number;
          storage_bucket: string;
          storage_path: string;
          status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED' | 'LOCKED' | 'DELETED';
          current_version_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          expires_at: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          category_id?: string | null;
          document_number?: string | null;
          title: string;
          description?: string | null;
          file_name: string;
          file_type: string;
          mime_type?: string | null;
          file_size: number;
          storage_bucket: string;
          storage_path: string;
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED' | 'LOCKED' | 'DELETED';
          current_version_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          expires_at?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          category_id?: string | null;
          document_number?: string | null;
          title?: string;
          description?: string | null;
          file_name?: string;
          file_type?: string;
          mime_type?: string | null;
          file_size?: number;
          storage_bucket?: string;
          storage_path?: string;
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED' | 'LOCKED' | 'DELETED';
          current_version_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          expires_at?: string | null;
          uploaded_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
      };
      document_categories: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          description: string | null;
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
          description?: string | null;
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
          description?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          version_number: number;
          file_name: string;
          mime_type: string | null;
          file_size: number | null;
          storage_bucket: string | null;
          storage_path: string | null;
          checksum: string | null;
          notes: string | null;
          is_current: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          version_number: number;
          file_name: string;
          mime_type?: string | null;
          file_size?: number | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          checksum?: string | null;
          notes?: string | null;
          is_current?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          version_number?: number;
          file_name?: string;
          mime_type?: string | null;
          file_size?: number | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          checksum?: string | null;
          notes?: string | null;
          is_current?: boolean;
          created_by?: string | null;
        };
      };
      document_links: {
        Row: {
          id: string;
          company_id: string;
          document_id: string;
          entity_type: string;
          entity_id: string;
          relation_type: 'ATTACHMENT' | 'PRIMARY' | 'SUPPORTING' | 'CONTRACT' | 'IDENTIFICATION' | 'FINANCIAL' | 'APPROVAL' | 'OTHER';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          document_id: string;
          entity_type: string;
          entity_id: string;
          relation_type?: 'ATTACHMENT' | 'PRIMARY' | 'SUPPORTING' | 'CONTRACT' | 'IDENTIFICATION' | 'FINANCIAL' | 'APPROVAL' | 'OTHER';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          document_id?: string;
          entity_type?: string;
          entity_id?: string;
          relation_type?: 'ATTACHMENT' | 'PRIMARY' | 'SUPPORTING' | 'CONTRACT' | 'IDENTIFICATION' | 'FINANCIAL' | 'APPROVAL' | 'OTHER';
          created_by?: string | null;
        };
      };
      document_access_logs: {
        Row: {
          id: string;
          company_id: string;
          document_id: string;
          version_id: string | null;
          actor_id: string | null;
          action: 'VIEW' | 'DOWNLOAD' | 'UPLOAD' | 'UPDATE' | 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'VERSION_CREATE';
          source: string;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          document_id: string;
          version_id?: string | null;
          actor_id?: string | null;
          action: 'VIEW' | 'DOWNLOAD' | 'UPLOAD' | 'UPDATE' | 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'VERSION_CREATE';
          source?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          document_id?: string;
          version_id?: string | null;
          actor_id?: string | null;
          action?: 'VIEW' | 'DOWNLOAD' | 'UPLOAD' | 'UPDATE' | 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'VERSION_CREATE';
          source?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
        };
      };
      document_access_rules: {
        Row: {
          id: string;
          company_id: string;
          document_id: string;
          subject_type: 'USER' | 'ROLE' | 'COMPANY';
          subject_id: string | null;
          permission: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          document_id: string;
          subject_type: 'USER' | 'ROLE' | 'COMPANY';
          subject_id?: string | null;
          permission?: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          document_id?: string;
          subject_type?: 'USER' | 'ROLE' | 'COMPANY';
          subject_id?: string | null;
          permission?: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
          created_by?: string | null;
        };
      };
      approval_workflows: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          entity_type: string;
          description: string | null;
          is_active: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          code: string;
          name_ar: string;
          name_en?: string | null;
          entity_type: string;
          description?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          code?: string;
          name_ar?: string;
          name_en?: string | null;
          entity_type?: string;
          description?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      approval_workflow_steps: {
        Row: {
          id: string;
          workflow_id: string;
          step_order: number;
          name_ar: string;
          name_en: string | null;
          approver_type: 'USER' | 'ROLE';
          approver_user_id: string | null;
          approver_role_id: string | null;
          minimum_approvals: number;
          allow_reject: boolean;
          is_required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          step_order: number;
          name_ar: string;
          name_en?: string | null;
          approver_type: 'USER' | 'ROLE';
          approver_user_id?: string | null;
          approver_role_id?: string | null;
          minimum_approvals?: number;
          allow_reject?: boolean;
          is_required?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          step_order?: number;
          name_ar?: string;
          name_en?: string | null;
          approver_type?: 'USER' | 'ROLE';
          approver_user_id?: string | null;
          approver_role_id?: string | null;
          minimum_approvals?: number;
          allow_reject?: boolean;
          is_required?: boolean;
        };
      };
      approval_requests: {
        Row: {
          id: string;
          company_id: string;
          workflow_id: string;
          entity_type: string;
          entity_id: string;
          requested_by: string | null;
          current_step_order: number;
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
          submitted_at: string;
          completed_at: string | null;
          rejected_at: string | null;
          cancelled_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          workflow_id: string;
          entity_type: string;
          entity_id: string;
          requested_by?: string | null;
          current_step_order?: number;
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
          submitted_at?: string;
          completed_at?: string | null;
          rejected_at?: string | null;
          cancelled_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          workflow_id?: string;
          entity_type?: string;
          entity_id?: string;
          requested_by?: string | null;
          current_step_order?: number;
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
          submitted_at?: string;
          completed_at?: string | null;
          rejected_at?: string | null;
          cancelled_at?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
      };
      approval_actions: {
        Row: {
          id: string;
          approval_request_id: string;
          workflow_step_id: string;
          actor_id: string | null;
          action: 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'CANCELLED';
          comments: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          approval_request_id: string;
          workflow_step_id: string;
          actor_id?: string | null;
          action: 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'CANCELLED';
          comments?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          approval_request_id?: string;
          workflow_step_id?: string;
          actor_id?: string | null;
          action?: 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'CANCELLED';
          comments?: string | null;
          metadata?: Json;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          company_id: string | null;
          actor_id: string | null;
          action: string;
          domain: string;
          entity_type: string | null;
          entity_id: string | null;
          entity_table: string | null;
          entity_schema: string;
          request_id: string | null;
          correlation_id: string | null;
          transaction_id: number | null;
          source: string;
          ip_address: string | null;
          user_agent: string | null;
          details: string | null;
          before_state: Json | null;
          after_state: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          actor_id?: string | null;
          action: string;
          domain: string;
          entity_type?: string | null;
          entity_id?: string | null;
          entity_table?: string | null;
          entity_schema?: string;
          request_id?: string | null;
          correlation_id?: string | null;
          transaction_id?: number | null;
          source?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: string | null;
          before_state?: Json | null;
          after_state?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          actor_id?: string | null;
          action?: string;
          domain?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          entity_table?: string | null;
          entity_schema?: string;
          request_id?: string | null;
          correlation_id?: string | null;
          transaction_id?: number | null;
          source?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: string | null;
          before_state?: Json | null;
          after_state?: Json | null;
          metadata?: Json;
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
