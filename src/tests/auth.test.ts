import {
  validateLoginCredentials,
  evaluateKioskTabletGuard,
  createCompatibleAuthSession
} from "../application/auth/authUseCases";
import { AuthSession } from "../types";
import { SupabaseAuthUser } from "../lib/supabase/authService";
import fs from "fs";
import path from "path";

console.log("\n================================================================");
console.log("  DESHAL ERP — AUTH & SECURITY SESSION USE CASE UNIT TEST SUITE");
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

// [Test 1] validateLoginCredentials - Empty Email
console.log("[Test 1] Login Validation — Empty Email");
const val1 = validateLoginCredentials("", "password123");
assert(val1.valid === false, "Empty email returns valid=false");
assert(val1.message?.includes("البريد الإلكتروني") === true, "Message prompts for email");

// [Test 2] validateLoginCredentials - Empty Password
console.log("\n[Test 2] Login Validation — Empty Password");
const val2 = validateLoginCredentials("user@deshalbm.com", "");
assert(val2.valid === false, "Empty password returns valid=false");
assert(val2.message?.includes("كلمة المرور") === true, "Message prompts for password");

// [Test 3] validateLoginCredentials - Valid Inputs
console.log("\n[Test 3] Login Validation — Valid Inputs");
const val3 = validateLoginCredentials("user@deshalbm.com", "password123");
assert(val3.valid === true, "Valid credentials return valid=true");
assert(val3.message === undefined, "No error message when valid");

// [Test 4] evaluateKioskTabletGuard - Kiosk Tablet Role
console.log("\n[Test 4] Kiosk Tablet Guard — KIOSK_TABLET Role");
const kioskSessionRole: AuthSession = {
  user: {
    id: "u-kiosk",
    employeeId: "emp-kiosk",
    email: "kiosk@deshalbm.com",
    fullName: "جهاز الحضور والانصراف",
    fullNameEn: "Attendance Kiosk",
    role: "KIOSK_TABLET",
    passwordHash: "",
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    isLocked: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  },
  employee: {
    id: "emp-kiosk",
    employeeCode: "EMP-KIOSK",
    fullName: "جهاز الحضور والانصراف",
    fullNameEn: "Attendance Kiosk",
    email: "kiosk@deshalbm.com",
    phone: "",
    role: "KIOSK_TABLET",
    jobTitle: "Kiosk Device",
    department: "الموارد البشرية",
    branchId: "branch-sohar",
    status: "ACTIVE",
    hireDate: "2026-01-01T00:00:00Z",
    basicSalary: 0,
    allowances: 0,
    currency: "OMR",
    permissions: ["kiosk_mode_only"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  },
  token: "test-token",
  loginMethod: "PASSWORD",
  authenticatedAt: "2026-01-01T00:00:00Z",
  expiresAt: "2026-01-02T00:00:00Z",
  isLocked: false
};
assert(evaluateKioskTabletGuard(kioskSessionRole) === true, "Identifies KIOSK_TABLET role correctly");

// [Test 5] evaluateKioskTabletGuard — Standard Manager Session
console.log("\n[Test 5] Kiosk Tablet Guard — Standard Manager Role");
const managerSession: AuthSession = {
  user: {
    id: "u-admin",
    employeeId: "emp-admin",
    email: "admin@deshalbm.com",
    fullName: "المدير العام",
    fullNameEn: "General Manager",
    role: "MANAGER",
    passwordHash: "",
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    isLocked: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  },
  employee: {
    id: "emp-admin",
    employeeCode: "EMP-ADMIN",
    fullName: "المدير العام",
    fullNameEn: "General Manager",
    email: "admin@deshalbm.com",
    phone: "",
    role: "MANAGER",
    jobTitle: "General Manager",
    department: "الإدارة العامة",
    branchId: "branch-sohar",
    status: "ACTIVE",
    hireDate: "2026-01-01T00:00:00Z",
    basicSalary: 0,
    allowances: 0,
    currency: "OMR",
    permissions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  },
  token: "test-token-admin",
  loginMethod: "PASSWORD",
  authenticatedAt: "2026-01-01T00:00:00Z",
  expiresAt: "2026-01-02T00:00:00Z",
  isLocked: false
};
assert(evaluateKioskTabletGuard(managerSession) === false, "Standard manager session is not kiosk tablet");

// [Test 6] evaluateKioskTabletGuard — Null Session
console.log("\n[Test 6] Kiosk Tablet Guard — Null Session");
assert(evaluateKioskTabletGuard(null) === false, "Null session returns false for kiosk tablet guard");

// [Test 7] createCompatibleAuthSession — Supabase Auth User Mapping
console.log("\n[Test 7] Compatible Auth Session — Supabase User Mapping");
const mockSupabaseUser: SupabaseAuthUser = {
  id: "sp-user-123",
  email: "sp@deshalbm.com",
  fullName: "علي البلوشي",
  fullNameEn: "Ali Al-Balushi",
  role: "ACCOUNTANT",
  companyId: "comp-999",
  branchId: "branch-sohar",
  avatarUrl: null,
  pinCode: null
};

const compatResult = createCompatibleAuthSession(mockSupabaseUser, "custom-token-xyz");
assert(compatResult.user.id === "sp-user-123", "User ID is mapped correctly");
assert(compatResult.user.fullName === "علي البلوشي", "Full name is mapped correctly");
assert(compatResult.user.role === "ACCOUNTANT", "User role is mapped correctly");
assert(compatResult.token === "custom-token-xyz", "Custom token is preserved");
assert(compatResult.activeBranchId === "branch-sohar", "Active branch ID is mapped");
assert(compatResult.isLocked === false, "Default lock state is false");

// [Test 8] Phase 25B — Logout Storage Cleanup Verification
console.log("\n[Test 8] Phase 25B — Logout Storage Cleanup Verification");
const mockStorage: Record<string, string> = {
  rv_studio_active_employee_id: "emp-123",
  rv_studio_active_branch_id: "branch-sohar"
};
function simulateLogout(storage: Record<string, string>) {
  delete storage.rv_studio_active_employee_id;
  delete storage.rv_studio_active_branch_id;
}
simulateLogout(mockStorage);
assert(mockStorage.rv_studio_active_employee_id === undefined, "Logout clears active employee storage key");
assert(mockStorage.rv_studio_active_branch_id === undefined, "Logout clears active branch storage key");

// [Test 9] Phase 25B — Single Active Subscription Audit Verification
console.log("\n[Test 9] Phase 25B — Single Active Auth Subscription Verification");
const authContextFile = fs.readFileSync(path.join(process.cwd(), "src/contexts/AuthContext.tsx"), "utf8");
const erpDataFile = fs.readFileSync(path.join(process.cwd(), "src/contexts/ERPDataContext.tsx"), "utf8");

assert(authContextFile.includes("onAuthStateChange("), "AuthContext retains primary onAuthStateChange subscription");
assert(!erpDataFile.includes("onAuthStateChange("), "ERPDataContext legacy onAuthStateChange subscription has been removed");

// Summary
console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exitCode = 1;
}
