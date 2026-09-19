/**
 * DESHAL ERP — PHASE 53B WORKSPACE PERSONALIZATION DOMAIN
 * 
 * Domain entities, types, and pure business logic for personalized workspace resolution.
 * Evaluates authenticated user identity, company membership, branch scope, RBAC permissions,
 * enabled tenant modules, and role classifications to construct authorized operational views.
 */

import { EmployeePermission } from '../../../types/hr';

export type WorkspacePersonaType = 
  | 'RECEPTION'
  | 'HR'
  | 'ACCOUNTANT'
  | 'OPERATIONS_MANAGER'
  | 'PLATFORM_ADMIN'
  | 'GENERAL_EMPLOYEE';

export type WorkspaceWidgetId =
  | 'context_header'
  | 'priority_my_work'
  | 'website_requests'
  | 'quick_actions'
  | 'operational_kpis'
  | 'today_bookings_appointments'
  | 'hr_attendance_contracts'
  | 'accounting_financial_summary'
  | 'platform_admin_tenants'
  | 'recent_activity';

export interface WorkspaceWidgetConfig {
  id: WorkspaceWidgetId;
  titleAr: string;
  titleEn: string;
  requiredModule?: string;
  requiredPermission?: EmployeePermission;
  minRoleCategory?: WorkspacePersonaType[];
  order: number;
}

export interface WorkspaceQuickActionItem {
  id: string;
  labelAr: string;
  labelEn: string;
  iconName: string;
  targetTab: string;
  requiredModule?: string;
  requiredPermission?: EmployeePermission;
}

export interface WorkspaceContextInput {
  userId?: string | null;
  userName?: string;
  isPlatformAdmin?: boolean;
  platformRole?: string | null;
  primaryRole?: string | null;
  activeCompanyId?: string | null;
  activeCompanyNameAr?: string;
  activeBranchId?: string | null;
  activeBranchNameAr?: string;
  allowedBranchIds?: string[];
  permissions?: EmployeePermission[];
  enabledModules?: string[];
}

/**
 * PURE DOMAIN FUNCTION: Resolves workspace persona category based on primary user role and permissions.
 */
export function resolveWorkspacePersona(input: WorkspaceContextInput): WorkspacePersonaType {
  if (input.isPlatformAdmin && input.platformRole === 'PLATFORM_ADMIN' && (!input.activeCompanyId || input.activeCompanyId === 'platform')) {
    return 'PLATFORM_ADMIN';
  }

  const role = (input.primaryRole || '').toUpperCase();
  const perms = input.permissions || [];

  if (role.includes('RECEPTION') || role.includes('FRONT') || role.includes('RECEPTIONIST')) {
    return 'RECEPTION';
  }

  if (role.includes('HR') || role.includes('PAYROLL') || role.includes('RESOURCES') || perms.includes('manage_employees')) {
    return 'HR';
  }

  if (role.includes('ACCOUNT') || role.includes('FINANCE') || role.includes('TREASURY') || perms.includes('view_financial_reports')) {
    return 'ACCOUNTANT';
  }

  if (role.includes('ADMIN') || role.includes('MANAGER') || role.includes('DIRECTOR') || role.includes('OWNER')) {
    return 'OPERATIONS_MANAGER';
  }

  return 'GENERAL_EMPLOYEE';
}

/**
 * PURE DOMAIN FUNCTION: Evaluates whether a widget is authorized for the given context.
 */
export function isWidgetAuthorized(widget: WorkspaceWidgetConfig, input: WorkspaceContextInput): boolean {
  // 1. Check enabled tenant modules
  if (widget.requiredModule && input.enabledModules && input.enabledModules.length > 0) {
    if (!input.enabledModules.includes(widget.requiredModule)) {
      return false;
    }
  }

  // 2. Check granular RBAC permissions
  if (widget.requiredPermission && input.permissions) {
    if (!input.permissions.includes(widget.requiredPermission)) {
      return false;
    }
  }

  // 3. Platform Admin isolation check
  if (widget.id === 'platform_admin_tenants') {
    return Boolean(input.isPlatformAdmin);
  }

  return true;
}

/**
 * PURE DOMAIN FUNCTION: Returns all available quick actions filtered by user authorization.
 */
export function filterAuthorizedQuickActions(input: WorkspaceContextInput): WorkspaceQuickActionItem[] {
  const allActions: WorkspaceQuickActionItem[] = [
    {
      id: 'new_customer',
      labelAr: 'عميل جديد',
      labelEn: 'New Customer',
      iconName: 'UserPlus',
      targetTab: 'crm',
      requiredModule: 'crm',
      requiredPermission: 'manage_customers'
    },
    {
      id: 'new_booking',
      labelAr: 'حجز قاعة/مساحة',
      labelEn: 'New Booking',
      iconName: 'CalendarPlus',
      targetTab: 'spaces',
      requiredModule: 'spaces'
    },
    {
      id: 'new_service_request',
      labelAr: 'طلب خدمة جديدة',
      labelEn: 'New Service Request',
      iconName: 'FilePlus',
      targetTab: 'requests',
      requiredModule: 'requests'
    },
    {
      id: 'new_voucher',
      labelAr: 'سند مالي جديد',
      labelEn: 'New Voucher',
      iconName: 'Receipt',
      targetTab: 'accounting',
      requiredModule: 'accounting',
      requiredPermission: 'create_vouchers'
    },
    {
      id: 'new_invoice',
      labelAr: 'فاتورة جديدة',
      labelEn: 'New Invoice',
      iconName: 'FileSpreadsheet',
      targetTab: 'pos',
      requiredModule: 'pos'
    },
    {
      id: 'new_employee',
      labelAr: 'إضافة موظف',
      labelEn: 'New Employee',
      iconName: 'UserCheck',
      targetTab: 'hr',
      requiredModule: 'hr',
      requiredPermission: 'manage_employees'
    }
  ];

  return allActions.filter(action => {
    if (action.requiredModule && input.enabledModules && input.enabledModules.length > 0) {
      if (!input.enabledModules.includes(action.requiredModule)) return false;
    }
    if (action.requiredPermission && input.permissions) {
      if (!input.permissions.includes(action.requiredPermission)) return false;
    }
    return true;
  });
}
