/**
 * Administrative Requests & Approval Workflow Engine — Deshal ERP
 * Pure Domain Layer: Dynamic form validation, multi-stage approval workflow state transitions,
 * SLA turnaround time evaluation, and summary analytics.
 */

import {
  EmployeeRequest,
  RequestApprovalStageRecord,
  RequestCategory,
  RequestFormField,
  RequestStatus,
  RequestStats,
} from '../../types/requests';

export interface FieldValidationError {
  fieldId: string;
  fieldLabelAr: string;
  messageAr: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
}

export interface WorkflowTransitionResult {
  updatedRequest: EmployeeRequest;
  isCompleted: boolean;
  finalStatus: RequestStatus;
}

export interface SLAResult {
  slaDeadline: string;
  isSlaBreached: boolean;
  remainingHours: number;
}

/**
 * Validates user form values against defined request form fields.
 */
export function validateRequestFields(
  fields: RequestFormField[],
  values: Record<string, any>
): FieldValidationResult {
  const errors: FieldValidationError[] = [];

  fields.forEach((field) => {
    const val = values[field.id];

    // Check required rule
    if (field.required && (val === undefined || val === null || val === '')) {
      errors.push({
        fieldId: field.id,
        fieldLabelAr: field.labelAr,
        messageAr: `الحقل ${field.labelAr} مطلوب`,
      });
      return;
    }

    if (val !== undefined && val !== null && val !== '') {
      const numVal = Number(val);
      const strVal = String(val);

      if (field.validation) {
        const { min, max, minLength, maxLength, regexPattern, regexErrorMessageAr } = field.validation;

        if (min !== undefined && !isNaN(numVal) && numVal < min) {
          errors.push({
            fieldId: field.id,
            fieldLabelAr: field.labelAr,
            messageAr: `القيمة في ${field.labelAr} يجب أن لا تقل عن ${min}`,
          });
        }

        if (max !== undefined && !isNaN(numVal) && numVal > max) {
          errors.push({
            fieldId: field.id,
            fieldLabelAr: field.labelAr,
            messageAr: `القيمة في ${field.labelAr} يجب أن لا تتجاوز ${max}`,
          });
        }

        if (minLength !== undefined && strVal.length < minLength) {
          errors.push({
            fieldId: field.id,
            fieldLabelAr: field.labelAr,
            messageAr: `طول النص في ${field.labelAr} يجب أن لا يقل عن ${minLength} أحرف`,
          });
        }

        if (maxLength !== undefined && strVal.length > maxLength) {
          errors.push({
            fieldId: field.id,
            fieldLabelAr: field.labelAr,
            messageAr: `طول النص في ${field.labelAr} يجب أن لا يتجاوز ${maxLength} أحرف`,
          });
        }

        if (regexPattern) {
          try {
            const regex = new RegExp(regexPattern);
            if (!regex.test(strVal)) {
              errors.push({
                fieldId: field.id,
                fieldLabelAr: field.labelAr,
                messageAr: regexErrorMessageAr || `الصيغة في ${field.labelAr} غير صحيحة`,
              });
            }
          } catch (e) {
            // Ignore invalid regex string pattern
          }
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates approval stage decisions (APPROVED, REJECTED, RETURNED) and updates request state cleanly.
 */
export function evaluateWorkflowStageTransition(
  request: EmployeeRequest,
  decision: 'APPROVED' | 'REJECTED' | 'RETURNED',
  decisionUserId: string,
  decisionUserName: string,
  decisionUserRole: string,
  comments?: string,
  nowMs: number = Date.now()
): WorkflowTransitionResult {
  const now = new Date(nowMs).toISOString();
  const updatedApprovals = [...request.approvals];
  const currentIdx = request.currentStageIndex;

  if (currentIdx >= 0 && currentIdx < updatedApprovals.length) {
    updatedApprovals[currentIdx] = {
      ...updatedApprovals[currentIdx],
      status: decision,
      decisionByUserId: decisionUserId,
      decisionByUserName: decisionUserName,
      decisionByUserRole: decisionUserRole,
      decisionAt: now,
      comments,
    };
  }

  let newStatus: RequestStatus = request.status;
  let newStageIndex = currentIdx;
  let isCompleted = false;
  let completedAt = request.completedAt;

  if (decision === 'REJECTED') {
    newStatus = 'REJECTED';
    isCompleted = true;
    completedAt = now;
  } else if (decision === 'RETURNED') {
    newStatus = 'RETURNED';
    isCompleted = false;
  } else if (decision === 'APPROVED') {
    const isLastStage = currentIdx >= updatedApprovals.length - 1;
    if (isLastStage) {
      newStatus = 'APPROVED';
      isCompleted = true;
      completedAt = now;
    } else {
      newStageIndex = currentIdx + 1;
      newStatus = 'PENDING_APPROVAL';
      if (updatedApprovals[newStageIndex]) {
        updatedApprovals[newStageIndex] = {
          ...updatedApprovals[newStageIndex],
          status: 'PENDING',
        };
      }
    }
  }

  const updatedRequest: EmployeeRequest = {
    ...request,
    status: newStatus,
    currentStageIndex: newStageIndex,
    approvals: updatedApprovals,
    completedAt,
    rejectionReason: decision === 'REJECTED' ? comments : request.rejectionReason,
    returnedReason: decision === 'RETURNED' ? comments : request.returnedReason,
    updatedAt: now,
  };

  return {
    updatedRequest,
    isCompleted,
    finalStatus: newStatus,
  };
}

/**
 * Computes SLA deadline date/time and evaluates whether SLA is breached.
 */
export function evaluateRequestSLA(
  submittedAt: string,
  slaHours: number = 24,
  completedAt?: string,
  nowStr?: string,
  nowMs: number = Date.now()
): SLAResult {
  const currentNowStr = nowStr ?? new Date(nowMs).toISOString();
  const subDate = new Date(submittedAt);
  const slaDeadlineDate = new Date(subDate.getTime() + slaHours * 60 * 60 * 1000);
  const slaDeadline = slaDeadlineDate.toISOString();

  const evalDate = completedAt ? new Date(completedAt) : new Date(currentNowStr);
  const isSlaBreached = evalDate.getTime() > slaDeadlineDate.getTime();
  const remainingTimeMs = slaDeadlineDate.getTime() - evalDate.getTime();
  const remainingHours = Math.round((remainingTimeMs / (1000 * 60 * 60)) * 10) / 10;

  return {
    slaDeadline,
    isSlaBreached,
    remainingHours,
  };
}

/**
 * Computes summary statistics across a collection of employee requests.
 */
export function calculateRequestSummaryStats(requests: EmployeeRequest[]): RequestStats {
  let pendingApproval = 0;
  let underReview = 0;
  let completed = 0;
  let rejected = 0;
  let returned = 0;
  let autoApprovedCount = 0;
  let slaBreachedCount = 0;
  let totalProcessingHours = 0;

  const byCategory: Record<RequestCategory, number> = {
    DOCUMENTS: 0,
    ADMINISTRATIVE: 0,
    FINANCIAL: 0,
    ASSETS: 0,
    PROCUREMENT: 0,
    HR: 0,
    CUSTOM: 0,
  };

  const byDepartment: Record<string, number> = {};

  requests.forEach((req) => {
    byCategory[req.typeCategory] = (byCategory[req.typeCategory] || 0) + 1;
    if (req.department) {
      byDepartment[req.department] = (byDepartment[req.department] || 0) + 1;
    }

    if (req.isSlaBreached) {
      slaBreachedCount++;
    }

    switch (req.status) {
      case 'PENDING_APPROVAL':
        pendingApproval++;
        break;
      case 'UNDER_REVIEW':
      case 'PROCESSING':
        underReview++;
        break;
      case 'APPROVED':
      case 'COMPLETED':
        completed++;
        break;
      case 'REJECTED':
        rejected++;
        break;
      case 'RETURNED':
        returned++;
        break;
    }

    if (req.completedAt && req.submittedAt) {
      const sub = new Date(req.submittedAt).getTime();
      const comp = new Date(req.completedAt).getTime();
      const hours = Math.max(0, (comp - sub) / (1000 * 60 * 60));
      totalProcessingHours += hours;
      if (hours < 0.1) {
        autoApprovedCount++;
      }
    }
  });

  const totalRequests = requests.length;
  const avgProcessingHours = completed > 0 ? Math.round((totalProcessingHours / completed) * 10) / 10 : 0;
  const slaComplianceRate = totalRequests > 0
    ? Math.round(((totalRequests - slaBreachedCount) / totalRequests) * 1000) / 10
    : 100;

  return {
    totalRequests,
    pendingApproval,
    underReview,
    completed,
    completedCount: completed,
    rejected,
    returned,
    autoApprovedCount,
    slaBreachedCount,
    averageProcessingHours: avgProcessingHours,
    avgProcessingHours,
    slaComplianceRate,
    byCategory,
    byDepartment,
  };
}
