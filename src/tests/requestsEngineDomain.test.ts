/**
 * Characterization Unit Test Suite — Administrative Requests & Approval Workflow Engine
 * Verifies form field validation, multi-stage approval workflow state transitions,
 * SLA turnaround time evaluation, and summary analytics.
 */

import {
  validateRequestFields,
  evaluateWorkflowStageTransition,
  evaluateRequestSLA,
  calculateRequestSummaryStats,
} from '../domain/requests/requestsEngine';
import { EmployeeRequest, RequestFormField } from '../types/requests';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log("\n================================================================");
  console.log("  DESHAL ERP — REQUESTS & APPROVAL WORKFLOW ENGINE TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: FORM FIELD VALIDATION ---
  console.log("\n--- TEST 1: FORM FIELD VALIDATION ---");
  const fields: RequestFormField[] = [
    { id: "f-name", labelAr: "الاسم", labelEn: "Name", type: "text", required: true, order: 1 },
    { id: "f-amount", labelAr: "المبلغ", labelEn: "Amount", type: "number", required: true, validation: { min: 10, max: 1000 }, order: 2 },
  ];

  const validRes = validateRequestFields(fields, { "f-name": "Salim Al-Busaidi", "f-amount": 500 });
  assert(validRes.isValid === true, "Valid form values pass validation");

  const missingReq = validateRequestFields(fields, { "f-amount": 500 });
  assert(missingReq.isValid === false, "Fails validation when required name field is missing");

  const outOfBounds = validateRequestFields(fields, { "f-name": "Salim", "f-amount": 5 });
  assert(outOfBounds.isValid === false, "Fails validation when amount is less than min (10)");

  // --- TEST 2: WORKFLOW STAGE TRANSITIONS ---
  console.log("\n--- TEST 2: WORKFLOW STAGE TRANSITIONS ---");
  const mockReq: EmployeeRequest = {
    id: "req-1",
    requestNumber: "REQ-2026-001",
    typeId: "t-1",
    typeCode: "SALARY_CERT",
    typeNameAr: "شهادة راتب",
    typeNameEn: "Salary Certificate",
    typeCategory: "DOCUMENTS",
    employeeId: "emp-1",
    employeeCode: "EMP-001",
    employeeName: "Ahmed",
    department: "IT",
    status: "PENDING_APPROVAL",
    priority: "MEDIUM",
    currentStageIndex: 0,
    values: {},
    approvals: [
      { stageIndex: 0, stageNameAr: "موافقة المدير المباشر", stageNameEn: "Direct Manager Approval", approverType: "DIRECT_MANAGER", status: "PENDING" },
      { stageIndex: 1, stageNameAr: "موافقة الموارد البشرية", stageNameEn: "HR Approval", approverType: "HR", status: "PENDING" }
    ],
    timeline: [],
    attachments: [],
    comments: [],
    submittedAt: "2026-01-15T08:00:00.000Z",
    updatedAt: ""
  };

  // Stage 0 Approval -> Should advance to Stage 1 (status remain PENDING_APPROVAL)
  const stage1Res = evaluateWorkflowStageTransition(mockReq, 'APPROVED', 'u-mgr', 'Manager Salim', 'Manager', 'Approved');
  assert(stage1Res.isCompleted === false, "Stage 1 approval does not mark request completed");
  assert(stage1Res.updatedRequest.currentStageIndex === 1, "Advances currentStageIndex to 1");
  assert(stage1Res.updatedRequest.status === 'PENDING_APPROVAL', "Status remains PENDING_APPROVAL for next stage");

  // Stage 1 Approval (Final Stage) -> Should set status APPROVED and completedAt
  const finalRes = evaluateWorkflowStageTransition(stage1Res.updatedRequest, 'APPROVED', 'u-hr', 'HR Maryam', 'HR', 'Final approval');
  assert(finalRes.isCompleted === true, "Final stage approval marks request completed");
  assert(finalRes.updatedRequest.status === 'APPROVED', "Final status is APPROVED");
  assert(finalRes.updatedRequest.completedAt !== undefined, "Sets completedAt timestamp");

  // Rejection -> Should set status REJECTED
  const rejectRes = evaluateWorkflowStageTransition(mockReq, 'REJECTED', 'u-mgr', 'Manager Salim', 'Manager', 'Budget exceeded');
  assert(rejectRes.isCompleted === true, "Rejection marks request completed");
  assert(rejectRes.updatedRequest.status === 'REJECTED', "Status is REJECTED");

  // --- TEST 3: REQUEST SLA EVALUATION ---
  console.log("\n--- TEST 3: REQUEST SLA EVALUATION ---");
  const submittedTime = "2026-01-15T08:00:00.000Z";
  // 24h SLA deadline should be 2026-01-16T08:00:00.000Z
  const slaOnTime = evaluateRequestSLA(submittedTime, 24, "2026-01-15T12:00:00.000Z");
  assert(slaOnTime.isSlaBreached === false, "Completion within 4 hours is not breached");

  const slaBreached = evaluateRequestSLA(submittedTime, 24, "2026-01-17T08:00:00.000Z");
  assert(slaBreached.isSlaBreached === true, "Completion after 48 hours breaches 24h SLA");

  // --- TEST 4: REQUEST SUMMARY STATS ---
  console.log("\n--- TEST 4: REQUEST SUMMARY STATS ---");
  const requestsList: EmployeeRequest[] = [
    finalRes.updatedRequest,
    rejectRes.updatedRequest,
    {
      ...mockReq,
      id: "req-3",
      status: "RETURNED"
    }
  ];

  const stats = calculateRequestSummaryStats(requestsList);
  assert(stats.totalRequests === 3, "Counts 3 total requests");
  assert(stats.completed === 1, "Counts 1 completed request");
  assert(stats.rejected === 1, "Counts 1 rejected request");
  assert(stats.returned === 1, "Counts 1 returned request");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
