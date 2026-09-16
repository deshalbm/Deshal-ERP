import { getActiveBranch } from "../application/masterData/getActiveBranch";
import { getActiveEmployee } from "../application/hr/getActiveEmployee";
import { Branch, Employee } from "../types";
import {
  saveBranches,
  saveEmployees,
  saveActiveEmployeeId,
} from "../utils/storage";
import { defaultBranchRepositoryAdapter } from "../lib/adapters/branchRepositoryAdapter";
import { defaultEmployeeRepositoryAdapter } from "../lib/adapters/employeeRepositoryAdapter";

console.log("\n================================================================");
console.log("  DESHAL ERP — ACTIVE RESOLUTION HELPERS UNIT TEST SUITE");
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

// Mock LocalStorage in Node environment if absent
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

const sampleBranches: Branch[] = [
  {
    id: "branch-sohar",
    name: "فرع صحار الرئيسي",
    nameEn: "Sohar Main Branch",
  } as unknown as Branch,
  {
    id: "branch-muscat",
    name: "فرع مسقط الإلكتروني",
    nameEn: "Muscat E-Commerce Branch",
  } as unknown as Branch,
];

const sampleEmployee: Employee = {
  id: "emp-301",
  employeeCode: "EMP-301",
  fullName: "علي بن سالم الكندي",
  jobTitle: "مدير مشاريع",
  department: "إدارة العمليات",
  email: "ali@deshalbm.com",
  phone: "96891112233",
  role: "STAFF" as any,
  branchId: "branch-muscat",
  status: "ACTIVE",
  hireDate: "2024-03-01",
  basicSalary: 800,
  allowances: 200,
  currency: "OMR",
  permissions: [],
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
};

// ============================================================================
// GET ACTIVE BRANCH TESTS
// ============================================================================
console.log("--- GET ACTIVE BRANCH TESTS ---");

// TEST 1: Matching Active Branch
saveBranches(sampleBranches);
localStorage.setItem("rv_studio_active_branch_id", "branch-muscat");
const branch1 = getActiveBranch({ repository: defaultBranchRepositoryAdapter });
assert(branch1.id === "branch-muscat", "Resolves matching active branch ID 'branch-muscat'");
assert(branch1.nameEn === "Muscat E-Commerce Branch", "Matching branch details match");

// TEST 2: Fallback to First Branch when active ID is unknown
localStorage.setItem("rv_studio_active_branch_id", "non-existent-branch-id");
const branch2 = getActiveBranch({ repository: defaultBranchRepositoryAdapter });
assert(branch2.id === "branch-sohar", "Falls back to first branch in list when active ID is unknown");

// TEST 3: Fallback to Default Branch on cleared storage
localStorage.removeItem("rv_studio_branches_list");
localStorage.removeItem("rv_studio_active_branch_id");
const branch3 = getActiveBranch({ repository: defaultBranchRepositoryAdapter });
assert(Boolean(branch3 && branch3.id), "Returns non-null active branch object on uninitialized storage");
assert(typeof branch3.id === "string", "Active branch ID is a string");

// TEST 4: LocalStorage Key Contract Verification
saveBranches(sampleBranches);
localStorage.setItem("rv_studio_active_branch_id", "branch-muscat");
assert(localStorage.getItem("rv_studio_active_branch_id") === "branch-muscat", "Exact key 'rv_studio_active_branch_id' verified");

// ============================================================================
// GET ACTIVE EMPLOYEE TESTS
// ============================================================================
console.log("\n--- GET ACTIVE EMPLOYEE TESTS ---");

// TEST 5: Matching Active Employee
saveEmployees([sampleEmployee]);
saveActiveEmployeeId("emp-301");
const emp1 = getActiveEmployee(undefined, { repository: defaultEmployeeRepositoryAdapter });
assert(emp1.id === "emp-301", "Resolves matching active employee ID 'emp-301'");
assert(emp1.fullName === "علي بن سالم الكندي", "Matching employee fullName matches");

// TEST 6: Fallback to First Employee
saveActiveEmployeeId("non-existent-emp-id");
const emp2 = getActiveEmployee(undefined, { repository: defaultEmployeeRepositoryAdapter });
assert(emp2.id === "emp-301", "Falls back to first employee in list when active ID is unknown");

// TEST 7: Fallback to Default System User
saveEmployees([]);
saveActiveEmployeeId("");
const emp3 = getActiveEmployee(undefined, { repository: defaultEmployeeRepositoryAdapter });
assert(emp3.id === "emp-curr", "Falls back to default system employee 'emp-curr' when list is empty");
assert(String((emp3 as any).role) === "مدير النظام", "Default employee role is 'مدير النظام'");

// TEST 8: Active Employee Resolution Behavior
assert(emp3.fullName === "المستخدم", "Default employee fullName falls back to 'المستخدم'");

// TEST 9: Existing userName Fallback Behavior
const emp4 = getActiveEmployee("خالد بن حمد", { repository: defaultEmployeeRepositoryAdapter });
assert(emp4.fullName === "خالد بن حمد", "Passes custom userName fallback to default employee object");
assert((emp4 as any).nameAr === "خالد بن حمد", "Passes custom userName to nameAr property");

// TEST 10: LocalStorage rv_user_name Fallback Behavior
localStorage.setItem("rv_user_name", "سالم بن ناصر");
const emp5 = getActiveEmployee(undefined, { repository: defaultEmployeeRepositoryAdapter });
assert(emp5.fullName === "سالم بن ناصر", "Reads rv_user_name from localStorage when userName argument is omitted");
assert((emp5 as any).nameAr === "سالم بن ناصر", "Sets nameAr from rv_user_name localStorage value");
localStorage.removeItem("rv_user_name");
localStorage.removeItem("rv_user_name");

// SUMMARY
console.log(`\n========================================================`);
console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`========================================================\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
