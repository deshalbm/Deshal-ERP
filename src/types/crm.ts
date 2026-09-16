export type CustomerType = 'CORPORATE' | 'INDIVIDUAL' | 'GOVERNMENT' | 'VIP';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'PROSPECT';

export interface CustomerInteraction {
  id: string;
  date: string;
  type: 'CALL' | 'MEETING' | 'WHATSAPP' | 'EMAIL' | 'NOTE' | 'PAYMENT' | 'VOUCHER_ISSUED';
  title: string;
  notes: string;
  createdByName?: string;
}

export interface Customer {
  id: string;
  name: string; // Client / Company name
  contactPerson?: string;
  phone: string;
  normalizedPhone?: string;
  email: string;
  address?: string;
  city?: string;
  governorate?: string;
  country?: string;
  taxId?: string;
  crNumber?: string;
  branchId?: string; // Preferred or handling branch
  branchName?: string;
  type: CustomerType;
  status: CustomerStatus;
  notes?: string;
  tags?: string[];
  creditLimit?: number;
  assignedProject?: string;
  isTenant?: boolean;
  tenantSpaceCode?: string;
  tenantSpaceName?: string;
  tenantPackageName?: string;
  interactions?: CustomerInteraction[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// CRM DOMAIN EXPANSION: LEADS, OPPORTUNITIES & PIPELINES
// ----------------------------------------------------

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST';
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'SOCIAL_MEDIA' | 'DIRECT_VISIT' | 'CAMPAIGN' | 'PHONE' | 'OTHER';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CRMLead {
  id: string;
  title: string; // Deal or inquiry title (e.g., "استفسار عن حجز مكتب خاص")
  contactName: string;
  phone: string;
  email?: string;
  companyName?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedToId?: string;
  assignedToName?: string;
  estimatedValue?: number;
  notes?: string;
  tags?: string[];
  convertedCustomerId?: string; // Set when converted to full Customer
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStage = 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface CRMOpportunity {
  id: string;
  leadId?: string;
  customerId?: string;
  customerName: string;
  title: string; // Opportunity title (e.g., "عقد إيجار مكتب مساحة 150م")
  dealValue: number;
  currency: string;
  stage: OpportunityStage;
  probabilityPercent: number; // 0 to 100
  expectedCloseDate?: string;
  assignedToId?: string;
  assignedToName?: string;
  notes?: string;
  lossReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type CRMActivityType = 'CALL' | 'MEETING' | 'WHATSAPP' | 'EMAIL' | 'NOTE' | 'SITE_VISIT';

export interface CRMActivityRecord {
  id: string;
  leadId?: string;
  opportunityId?: string;
  customerId?: string;
  entityName: string; // Name of lead, opportunity, or customer
  type: CRMActivityType;
  title: string;
  notes?: string;
  date: string;
  performedByName: string;
  createdAt: string;
}
