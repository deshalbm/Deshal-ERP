/**
 * DESHAL ERP — CRM & SALES PIPELINE DOMAIN UNIT TEST SUITE
 * 
 * Verifies deal weighting math, pipeline summaries, lead conversion rules,
 * status filtering, and storage persistence contracts.
 */

import {
  calculateOpportunityWeightedValue,
  calculatePipelineSummary,
  validateLeadConversion,
  convertLeadToCustomerPayload,
  filterLeadsByStatus
} from "../domain/crm/crmRules";

import { CRMLead, CRMOpportunity } from "../types/crm";
import { loadCRMLeads, saveCRMLeads, loadCRMOpportunities } from "../utils/storage/crmStorage";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

function runTests() {
  console.log("================================================================");
  console.log("  DESHAL ERP — CRM & SALES PIPELINE DOMAIN UNIT TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: DEAL WEIGHTED VALUE CALCULATION ---
  console.log("\n--- TEST 1: DEAL WEIGHTED VALUE CALCULATION ---");
  const weighted1 = calculateOpportunityWeightedValue(1000, 30);
  assert(weighted1 === 300, "Calculates 30% of 1000 OMR as 300 OMR");

  const weighted2 = calculateOpportunityWeightedValue(2500, 85);
  assert(weighted2 === 2125, "Calculates 85% of 2500 OMR as 2125 OMR");

  const weightedZero = calculateOpportunityWeightedValue(0, 50);
  assert(weightedZero === 0, "Returns 0 for zero deal value");

  const weightedNan = calculateOpportunityWeightedValue(NaN, 50);
  assert(weightedNan === 0, "Returns 0 for NaN deal value");

  // --- TEST 2: PIPELINE SUMMARY CALCULATIONS ---
  console.log("\n--- TEST 2: PIPELINE SUMMARY CALCULATIONS ---");
  const testOpps: CRMOpportunity[] = [
    { id: "o1", customerName: "C1", title: "T1", dealValue: 1000, currency: "OMR", stage: "QUALIFICATION", probabilityPercent: 30, createdAt: "", updatedAt: "" },
    { id: "o2", customerName: "C2", title: "T2", dealValue: 2000, currency: "OMR", stage: "PROPOSAL", probabilityPercent: 60, createdAt: "", updatedAt: "" },
    { id: "o3", customerName: "C3", title: "T3", dealValue: 5000, currency: "OMR", stage: "WON", probabilityPercent: 100, createdAt: "", updatedAt: "" },
    { id: "o4", customerName: "C4", title: "T4", dealValue: 1500, currency: "OMR", stage: "LOST", probabilityPercent: 0, createdAt: "", updatedAt: "" }
  ];

  const summary = calculatePipelineSummary(testOpps);
  assert(summary.totalDealsCount === 4, "Counts total deals correctly");
  assert(summary.totalPipelineValue === 8000, "Sums total pipeline value excluding LOST deals (1000 + 2000 + 5000 = 8000 OMR)");
  assert(summary.totalWeightedValue === 6500, "Sums weighted value correctly (300 + 1200 + 5000 = 6500 OMR)");
  assert(summary.stageCounts.QUALIFICATION === 1, "Counts QUALIFICATION deals correctly");
  assert(summary.stageCounts.WON === 1, "Counts WON deals correctly");

  // --- TEST 3: LEAD CONVERSION VALIDATION ---
  console.log("\n--- TEST 3: LEAD CONVERSION VALIDATION ---");
  const validLead: CRMLead = {
    id: "l1",
    title: "مكتب خاص",
    contactName: "عبدالله الزدجالي",
    phone: "+968 99000000",
    source: "WEBSITE",
    status: "NEW",
    priority: "HIGH",
    createdAt: "",
    updatedAt: ""
  };

  const validRes = validateLeadConversion(validLead);
  assert(validRes.isValid === true, "Valid lead passes conversion validation");

  const invalidLeadNoContact: CRMLead = { ...validLead, contactName: "" };
  const invalidRes1 = validateLeadConversion(invalidLeadNoContact);
  assert(invalidRes1.isValid === false, "Fails conversion when contactName is missing");

  const alreadyConvertedLead: CRMLead = { ...validLead, status: "CONVERTED" };
  const invalidRes2 = validateLeadConversion(alreadyConvertedLead);
  assert(invalidRes2.isValid === false, "Fails conversion when lead status is already CONVERTED");

  // --- TEST 4: LEAD TO CUSTOMER PAYLOAD CONVERSION ---
  console.log("\n--- TEST 4: LEAD TO CUSTOMER PAYLOAD CONVERSION ---");
  const custPayload = convertLeadToCustomerPayload(validLead);
  assert(custPayload.name === "عبدالله الزدجالي", "Customer name matches lead contactName when companyName empty");
  assert(custPayload.phone === "+968 99000000", "Customer phone matches lead phone");
  assert(custPayload.status === "ACTIVE", "Converted customer status is ACTIVE");
  assert(custPayload.tags?.includes("عميل محوّل"), "Includes 'عميل محوّل' tag");

  // --- TEST 5: LEAD STATUS FILTERING ---
  console.log("\n--- TEST 5: LEAD STATUS FILTERING ---");
  const leadsList: CRMLead[] = [
    validLead,
    { ...validLead, id: "l2", status: "QUALIFIED" },
    { ...validLead, id: "l3", status: "CONVERTED" }
  ];

  const filteredNew = filterLeadsByStatus(leadsList, "NEW");
  assert(filteredNew.length === 1 && filteredNew[0].id === "l1", "Filters leads by NEW status");

  const filteredAll = filterLeadsByStatus(leadsList, "ALL");
  assert(filteredAll.length === 3, "Returns all leads when filter is ALL");

  // --- TEST 6: STORAGE INTEGRITY ---
  console.log("\n--- TEST 6: STORAGE INTEGRITY ---");
  const initialLeads = loadCRMLeads();
  assert(Array.isArray(initialLeads), "Loads CRM leads cleanly");

  const initialOpps = loadCRMOpportunities();
  assert(Array.isArray(initialOpps), "Loads CRM opportunities cleanly");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
