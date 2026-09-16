import { loadAuditLogs, clearAuditLogs, logActivity } from "../utils/auditLogger";
import { AuditLogEntry } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — AUDIT CONTEXT & LOGGING USE CASE UNIT TEST SUITE");
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

// [Test 1] Load initial audit logs
console.log("[Test 1] Initial Audit Logs Loading");
clearAuditLogs();
const initialLogs = loadAuditLogs();
assert(Array.isArray(initialLogs), "loadAuditLogs returns an array");
assert(initialLogs.length === 0, "Initial audit logs are empty after clear");

// [Test 2] Log Activity & Persistence
console.log("\n[Test 2] Activity Logging & Structure");
const newLogs = logActivity({
  action: "LOGIN",
  module: "SECURITY",
  entityId: "usr-1",
  entityName: "مدير النظام",
  descriptionAr: "تسجيل دخول المستخدم",
  descriptionEn: "User logged in",
  performedByName: "مدير النظام",
  performedByRole: "ADMIN",
  performedByEmployeeId: "emp-curr",
  branchName: "صحار"
}, initialLogs);

assert(newLogs.length === 1, "Log list count increases to 1");
assert(newLogs[0].action === "LOGIN", "Logged action matches input: LOGIN");
assert(newLogs[0].module === "SECURITY", "Logged module matches input: SECURITY");
assert(newLogs[0].id.startsWith("log-"), "Log entry gets an auto-generated ID");
assert(Boolean(newLogs[0].timestamp), "Log entry receives an ISO timestamp");

// [Test 3] Clear Audit Logs
console.log("\n[Test 3] Clearing Audit Logs");
const cleared = clearAuditLogs();
assert(cleared.length === 0, "clearAuditLogs returns empty array");
const reloaded = loadAuditLogs();
assert(reloaded.length === 0, "loadAuditLogs returns empty array after clear");

console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");
