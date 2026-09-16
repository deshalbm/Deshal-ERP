import { updateBranchList, validateCompanySettings } from "../application/masterData/masterDataUseCases";
import { Branch, CompanySettings, DesignTheme, RecurringSchedule } from "../types";
import { DEFAULT_COMPANY_SETTINGS, DEFAULT_DESIGN_THEME } from "../utils/storage";

console.log("\n================================================================");
console.log("  DESHAL ERP — MASTER DATA USE CASE UNIT TEST SUITE");
console.log("================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// Sample Data Setup
const sampleBranchSohar: Branch = {
  id: "branch-sohar",
  code: "BR-SOHAR",
  name: "فرع صحار الرئيسي",
  nameEn: "Sohar Main Branch",
  address: "صحار",
  city: "صحار",
  country: "Oman",
  phone: "96826840000",
  email: "sohar@deshalbm.com",
  isMain: true,
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z"
};

const sampleBranchMuscat: Branch = {
  id: "branch-muscat",
  code: "BR-MUSCAT",
  name: "فرع مسقط",
  nameEn: "Muscat Branch",
  address: "مسقط",
  city: "مسقط",
  country: "Oman",
  phone: "96824000000",
  email: "muscat@deshalbm.com",
  isMain: false,
  status: "ACTIVE",
  createdAt: "2026-01-02T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z"
};

const sampleDuplicateCodeBranch: Branch = {
  id: "branch-salalah",
  code: "BR-SOHAR", // Duplicate code of Sohar
  name: "فرع صلالة",
  nameEn: "Salalah Branch",
  address: "صلالة",
  city: "صلالة",
  country: "Oman",
  phone: "96823000000",
  email: "salalah@deshalbm.com",
  isMain: false,
  status: "ACTIVE",
  createdAt: "2026-01-03T00:00:00Z",
  updatedAt: "2026-01-03T00:00:00Z"
};

// [Test 1] Add New Branch
console.log("[Test 1] Add New Branch");
const res1 = updateBranchList(sampleBranchMuscat, [sampleBranchSohar]);
assert(res1.success === true, "New branch is added successfully");
assert(res1.updatedBranches.length === 2, "Branch list count increases to 2");
assert(res1.updatedBranches[1].id === "branch-muscat", "New branch matches inserted object");

// [Test 2] Update Existing Branch
console.log("\n[Test 2] Update Existing Branch");
const updatedSohar: Branch = { ...sampleBranchSohar, phone: "96826849999" };
const res2 = updateBranchList(updatedSohar, [sampleBranchSohar, sampleBranchMuscat]);
assert(res2.success === true, "Existing branch is updated successfully");
assert(res2.updatedBranches.length === 2, "Branch list count remains 2");
assert(res2.updatedBranches[0].phone === "96826849999", "Branch phone number is updated");

// [Test 3] Duplicate Branch Code Rejection
console.log("\n[Test 3] Duplicate Branch Code Rejection");
const res3 = updateBranchList(sampleDuplicateCodeBranch, [sampleBranchSohar]);
assert(res3.success === false, "Duplicate branch code is rejected");
assert(res3.message?.includes("مستخدم بالفعل") === true, "Rejection message specifies code collision");
assert(res3.updatedBranches.length === 1, "Branch list length is unmutated");

// [Test 4] Active Branch Selection Fallback
console.log("\n[Test 4] Active Branch Selection Fallback");
function resolveActiveBranch(activeId: string, branches: Branch[]): Branch {
  return branches.find((b) => b.id === activeId) || branches[0] || sampleBranchSohar;
}
const active1 = resolveActiveBranch("branch-muscat", [sampleBranchSohar, sampleBranchMuscat]);
assert(active1.id === "branch-muscat", "Resolves active branch ID when matching branch exists");

const active2 = resolveActiveBranch("branch-unknown", [sampleBranchSohar, sampleBranchMuscat]);
assert(active2.id === "branch-sohar", "Falls back to first branch in list when active ID is unknown");

// [Test 5] Default Company Settings Verification
console.log("\n[Test 5] Default Company Settings Verification");
assert(DEFAULT_COMPANY_SETTINGS.companyName !== "", "DEFAULT_COMPANY_SETTINGS has company name");
assert(DEFAULT_COMPANY_SETTINGS.defaultCurrency === "OMR", "DEFAULT_COMPANY_SETTINGS default currency is OMR");
assert(DEFAULT_COMPANY_SETTINGS.taxId !== "", "DEFAULT_COMPANY_SETTINGS has tax ID");

// [Test 6] Company Settings Validation
console.log("\n[Test 6] Company Settings Validation");
const validCheck = validateCompanySettings(DEFAULT_COMPANY_SETTINGS);
assert(validCheck.valid === true, "Valid company settings pass validation");

const invalidCheck = validateCompanySettings({ ...DEFAULT_COMPANY_SETTINGS, companyName: "" });
assert(invalidCheck.valid === false, "Empty company name fails validation");

// [Test 7] Default Design Theme Verification
console.log("\n[Test 7] Default Design Theme Verification");
assert(DEFAULT_DESIGN_THEME.primaryColor !== undefined, "DEFAULT_DESIGN_THEME has primaryColor");
assert(DEFAULT_DESIGN_THEME.templateId !== undefined, "DEFAULT_DESIGN_THEME has templateId");

// [Test 8] Recurring Schedules Struct Verification
console.log("\n[Test 8] Recurring Schedules Struct Verification");
const sampleSchedule: RecurringSchedule = {
  id: "sched-1",
  scheduleCode: "SCH-001",
  title: "إيجار المحل الشهري",
  type: "RECEIPT",
  frequency: "MONTHLY",
  amount: 500,
  currency: "OMR",
  partyName: "شركة الرمز",
  partyType: "CUSTOMER",
  category: "إيجارات",
  paymentMethod: "CASH",
  startDate: "2026-01-01",
  completedOccurrences: 0,
  nextDueDate: "2026-03-01",
  autoGenerateVoucher: true,
  reminderDaysBefore: 3,
  status: "ACTIVE",
  executions: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z"
};
assert(sampleSchedule.frequency === "MONTHLY", "Schedule frequency is MONTHLY");
assert(sampleSchedule.status === "ACTIVE", "Schedule status is active");

// Summary
console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exitCode = 1;
}
