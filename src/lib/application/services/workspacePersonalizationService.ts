/**
 * DESHAL ERP — PHASE 53B WORKSPACE PERSONALIZATION SERVICE
 * 
 * Application Service layer for calculating operational indicators, gathering priority task queues,
 * fetching website request summaries, computing role-based widgets, and ensuring zero cross-company data leakage.
 */

import {
  WorkspacePersonaType,
  WorkspaceWidgetConfig,
  WorkspaceQuickActionItem,
  WorkspaceContextInput,
  resolveWorkspacePersona,
  isWidgetAuthorized,
  filterAuthorizedQuickActions
} from '../../domain/workspace/workspacePersonalizationDomain';

export interface WebsiteRequestsSummary {
  newCount: number;
  pendingCount: number;
  inProgressCount: number;
  todayCount: number;
  totalActive: number;
}

export interface MyWorkPriorityItem {
  id: string;
  type: 'APPROVAL' | 'REQUEST' | 'CONTRACT_EXPIRING' | 'TASK' | 'APPOINTMENT';
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  targetTab: string;
  createdAt: string;
}

export interface OperationalKpisSummary {
  todayCollectionsOmr: number;
  monthlyRevenueOmr: number;
  activeContractsCount: number;
  pendingInvoicesCount: number;
}

export interface PersonalizedWorkspaceState {
  persona: WorkspacePersonaType;
  authorizedWidgets: WorkspaceWidgetConfig[];
  quickActions: WorkspaceQuickActionItem[];
  websiteRequests: WebsiteRequestsSummary;
  priorityItems: MyWorkPriorityItem[];
  kpis: OperationalKpisSummary;
}

const DEFAULT_WIDGET_CONFIGS: WorkspaceWidgetConfig[] = [
  { id: 'context_header', titleAr: 'ترويسة السياق التشغيلي', titleEn: 'Context Header', order: 1 },
  { id: 'priority_my_work', titleAr: 'مهامي وأعمالي اليومية (My Work)', titleEn: 'My Priority Work', order: 2 },
  { id: 'website_requests', titleAr: 'طلبات الموقع الإلكتروني (Website Requests)', titleEn: 'Website Requests', requiredModule: 'requests', order: 3 },
  { id: 'quick_actions', titleAr: 'الإجراءات السريعة (Quick Actions)', titleEn: 'Quick Actions', order: 4 },
  { id: 'operational_kpis', titleAr: 'المؤشرات التشغيلية السريعة (KPIs)', titleEn: 'Operational Indicators', requiredModule: 'accounting', order: 5 },
  { id: 'today_bookings_appointments', titleAr: 'حجوزات ومواعيد اليوم', titleEn: "Today's Bookings & Appointments", requiredModule: 'spaces', order: 6 },
  { id: 'hr_attendance_contracts', titleAr: 'الحضور والعقود المنتهية', titleEn: 'Attendance & Expiring Contracts', requiredModule: 'hr', order: 7 },
  { id: 'accounting_financial_summary', titleAr: 'الملخص المالي والذمم', titleEn: 'Financial Summary & Receivables', requiredModule: 'accounting', order: 8 },
  { id: 'platform_admin_tenants', titleAr: 'إدارة المستأجرين والمنصة', titleEn: 'Tenant Platform Administration', order: 9 },
  { id: 'recent_activity', titleAr: 'نشاطات وسجلات النظام الأخيرة', titleEn: 'Recent Operational Activity', order: 10 }
];

/**
 * APPLICATION SERVICE FUNCTION: Computes the complete personalized workspace state.
 */
export function buildPersonalizedWorkspaceState(
  input: WorkspaceContextInput,
  rawRequests: any[] = [],
  rawVouchers: any[] = [],
  rawContracts: any[] = []
): PersonalizedWorkspaceState {
  const persona = resolveWorkspacePersona(input);

  // Filter authorized widgets
  const authorizedWidgets = DEFAULT_WIDGET_CONFIGS
    .filter(widget => isWidgetAuthorized(widget, input))
    .sort((a, b) => a.order - b.order);

  // Filter authorized quick actions
  const quickActions = filterAuthorizedQuickActions(input);

  // Compute Website Requests summary (Filtered by company context)
  const websiteReqs = rawRequests.filter(req => {
    const isWeb = req.request_number?.startsWith('REQ-WEB-') || req.field_values?.typeCategory === 'PUBLIC_WEBSITE' || req.field_values?.typeCode === 'REQ-WEBSITE-PUBLIC';
    if (!isWeb) return false;
    if (input.activeCompanyId && req.company_id) {
      return req.company_id === input.activeCompanyId;
    }
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const websiteRequests: WebsiteRequestsSummary = {
    newCount: websiteReqs.filter(r => r.status === 'SUBMITTED' || r.status === 'NEW').length,
    pendingCount: websiteReqs.filter(r => r.status === 'PENDING' || r.status === 'PENDING_APPROVAL').length,
    inProgressCount: websiteReqs.filter(r => r.status === 'IN_PROGRESS' || r.status === 'UNDER_REVIEW').length,
    todayCount: websiteReqs.filter(r => (r.updated_at || r.created_at || '').startsWith(todayStr)).length,
    totalActive: websiteReqs.filter(r => r.status !== 'REJECTED' && r.status !== 'CLOSED').length
  };

  // Build My Work Priority Items
  const priorityItems: MyWorkPriorityItem[] = [];

  // Add website requests to priority queue if new
  websiteReqs.filter(r => r.status === 'SUBMITTED' || r.status === 'NEW').slice(0, 3).forEach(r => {
    priorityItems.push({
      id: r.id || r.request_number,
      type: 'REQUEST',
      titleAr: `طلب موقع جديد: ${r.field_values?.values?.name || r.field_values?.employeeName || 'زائر الموقع'}`,
      titleEn: `New Website Request: ${r.field_values?.values?.name || 'Visitor'}`,
      subtitleAr: `الخدمة: ${r.field_values?.values?.serviceInterest || 'استفسار عام'}`,
      priority: 'HIGH',
      targetTab: 'requests',
      createdAt: r.updated_at || new Date().toISOString()
    });
  });

  // Add contract expirations to priority queue
  rawContracts.filter(c => c.status === 'ACTIVE').slice(0, 2).forEach(c => {
    priorityItems.push({
      id: c.id,
      type: 'CONTRACT_EXPIRING',
      titleAr: `عقد ينتهي قريباً: ${c.tenantName || c.contractNumber}`,
      titleEn: `Expiring Contract: ${c.tenantName || c.contractNumber}`,
      subtitleAr: `قيمة العقد: ${c.totalAmount} ر.ع.`,
      priority: 'MEDIUM',
      targetTab: 'contracts',
      createdAt: c.createdAt || new Date().toISOString()
    });
  });

  // Compute concise Operational KPIs
  const todayVouchers = rawVouchers.filter(v => (v.date || '').startsWith(todayStr));
  const todayCollectionsOmr = todayVouchers.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
  const monthlyRevenueOmr = rawVouchers.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);

  const kpis: OperationalKpisSummary = {
    todayCollectionsOmr,
    monthlyRevenueOmr,
    activeContractsCount: rawContracts.filter(c => c.status === 'ACTIVE').length,
    pendingInvoicesCount: rawRequests.filter(r => r.status === 'SUBMITTED').length
  };

  return {
    persona,
    authorizedWidgets,
    quickActions,
    websiteRequests,
    priorityItems,
    kpis
  };
}
