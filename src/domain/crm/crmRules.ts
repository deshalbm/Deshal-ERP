/**
 * DESHAL ERP — CRM & SALES PIPELINE DOMAIN RULES
 * 
 * Pure domain logic for opportunity weighted pipeline values, deal probabilities,
 * lead conversion payloads, status filtering, and pipeline analytics summaries.
 */

import { CRMLead, CRMOpportunity, OpportunityStage, Customer } from "../../types/crm";

export interface PipelineSummary {
  totalPipelineValue: number;
  totalWeightedValue: number;
  totalDealsCount: number;
  stageCounts: Record<OpportunityStage, number>;
  stageValues: Record<OpportunityStage, number>;
}

/**
 * Calculate weighted value for a single sales deal based on deal value & win probability %
 */
export function calculateOpportunityWeightedValue(dealValue: number, probabilityPercent: number): number {
  if (isNaN(dealValue) || dealValue <= 0) return 0;
  const prob = Math.max(0, Math.min(100, isNaN(probabilityPercent) ? 0 : probabilityPercent));
  const weighted = (dealValue * prob) / 100;
  return Number(weighted.toFixed(3));
}

/**
 * Calculate full pipeline summary statistics across all opportunities
 */
export function calculatePipelineSummary(opportunities: CRMOpportunity[]): PipelineSummary {
  const stageCounts: Record<OpportunityStage, number> = {
    QUALIFICATION: 0,
    PROPOSAL: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0
  };

  const stageValues: Record<OpportunityStage, number> = {
    QUALIFICATION: 0,
    PROPOSAL: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0
  };

  let totalPipelineValue = 0;
  let totalWeightedValue = 0;

  if (Array.isArray(opportunities)) {
    opportunities.forEach((opp) => {
      const val = opp.dealValue || 0;
      const prob = opp.probabilityPercent || 0;
      const weighted = calculateOpportunityWeightedValue(val, prob);

      if (opp.stage && stageCounts[opp.stage] !== undefined) {
        stageCounts[opp.stage] += 1;
        stageValues[opp.stage] += val;
      }

      // Sum values for active/won deals
      if (opp.stage !== "LOST") {
        totalPipelineValue += val;
        totalWeightedValue += weighted;
      }
    });
  }

  return {
    totalPipelineValue: Number(totalPipelineValue.toFixed(3)),
    totalWeightedValue: Number(totalWeightedValue.toFixed(3)),
    totalDealsCount: opportunities ? opportunities.length : 0,
    stageCounts,
    stageValues
  };
}

/**
 * Validates whether a lead is eligible to be converted into a formal Customer profile
 */
export function validateLeadConversion(lead: CRMLead): { isValid: boolean; errorMessage?: string } {
  if (!lead) {
    return { isValid: false, errorMessage: "بيانات العميل المحتمل غير موجودة." };
  }
  if (!lead.contactName || !lead.contactName.trim()) {
    return { isValid: false, errorMessage: "اسم جهة الاتصال مطلوب لإتمام التحويل." };
  }
  if (!lead.phone || !lead.phone.trim()) {
    return { isValid: false, errorMessage: "رقم الهاتف مطلوب لإتمام التحويل." };
  }
  if (lead.status === "CONVERTED") {
    return { isValid: false, errorMessage: "تم تحويل هذا العميل المحتمل سابقاً." };
  }
  return { isValid: true };
}

/**
 * Converts a CRMLead into a full Customer object payload
 */
export function convertLeadToCustomerPayload(lead: CRMLead, nowMs: number = Date.now()): Customer {
  const now = new Date(nowMs).toISOString();
  return {
    id: `cust-${nowMs}`,
    name: lead.companyName && lead.companyName.trim() ? lead.companyName.trim() : lead.contactName.trim(),
    contactPerson: lead.contactName.trim(),
    phone: lead.phone.trim(),
    email: lead.email ? lead.email.trim() : "",
    type: lead.companyName && lead.companyName.trim() ? "CORPORATE" : "INDIVIDUAL",
    status: "ACTIVE",
    notes: `تم التحويل تلقائياً من العميل المحتمل (${lead.title}). ملاحظات: ${lead.notes || "-"}`,
    tags: ["عميل محوّل", ...(lead.tags || [])],
    creditLimit: 5000,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Filter leads by status or category
 */
export function filterLeadsByStatus(leads: CRMLead[], statusFilter: string): CRMLead[] {
  if (!Array.isArray(leads)) return [];
  if (!statusFilter || statusFilter === "ALL") return leads;
  return leads.filter((l) => l.status === statusFilter);
}
