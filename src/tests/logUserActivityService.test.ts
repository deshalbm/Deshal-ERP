import { logUserActivity } from "../application/audit/logUserActivity";
import { defaultAuditLoggerAdapter } from "../lib/adapters/auditLoggerAdapter";
import { loadAuditLogs, clearAuditLogs } from "../utils/auditLogger";
import { AuditLogEntry } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — LOG USER ACTIVITY APPLICATION SERVICE TEST SUITE");
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

// Clear storage before starting
clearAuditLogs();

// TEST 1: Basic Activity Logging & Payload Generation
console.log("--- TEST 1: ACTIVITY LOG CREATION ---");
const logInput: Omit<AuditLogEntry, "id" | "timestamp"> = {
  action: "LOGIN",
  module: "SECURITY",
  entityId: "usr-101",
  entityName: "خالد بن حمد",
  descriptionAr: "تسجيل دخول المستخدم خالد بن حمد",
  descriptionEn: "User Khalid logged in",
  details: "IP: 192.168.1.1",
  performedByName: "خالد بن حمد",
  performedByRole: "ADMIN",
  performedByEmployeeId: "emp-301",
  branchName: "فرع صحار الرئيسي"
};

const updatedLogs1 = logUserActivity(logInput, [], { adapter: defaultAuditLoggerAdapter });
assert(updatedLogs1.length === 1, "Appends new log entry to array");
assert(updatedLogs1[0].action === "LOGIN", "Action matches input");
assert(updatedLogs1[0].module === "SECURITY", "Module matches input");
assert(typeof updatedLogs1[0].id === "string" && updatedLogs1[0].id.startsWith("log-"), "Auto-generates unique ID starting with 'log-'");
assert(typeof updatedLogs1[0].timestamp === "string" && Boolean(Date.parse(updatedLogs1[0].timestamp)), "Assigns valid ISO timestamp");

// TEST 2: Prepending & Ordering Safety
console.log("\n--- TEST 2: PREPENDING & ORDERING ---");
const secondInput: Omit<AuditLogEntry, "id" | "timestamp"> = {
  action: "CREATE",
  module: "VOUCHERS",
  entityId: "v-999",
  entityName: "سند قبض #1024",
  descriptionAr: "إنشاء سند قبض جديد",
  descriptionEn: "Created new receipt voucher",
  details: "Amount: 150 OMR",
  performedByName: "خالد بن حمد",
  performedByRole: "ADMIN",
  performedByEmployeeId: "emp-301",
  branchName: "فرع صحار الرئيسي"
};

const updatedLogs2 = logUserActivity(secondInput, updatedLogs1, { adapter: defaultAuditLoggerAdapter });
assert(updatedLogs2.length === 2, "Array length increases to 2");
assert(updatedLogs2[0].action === "CREATE", "Newest log entry is prepended to the top");
assert(updatedLogs2[1].action === "LOGIN", "Previous log entry remains second in order");

// TEST 3: LocalStorage Persistence Integrity
console.log("\n--- TEST 3: STORAGE PERSISTENCE ---");
const persistedLogs = loadAuditLogs();
assert(persistedLogs.length === 2, "Persists updated audit log trail to localStorage");
assert(persistedLogs[0].id === updatedLogs2[0].id, "Persisted top log entry ID matches memory state");
assert(persistedLogs[0].descriptionAr === "إنشاء سند قبض جديد", "Persisted Arabic description matches memory state");

// SUMMARY
console.log(`\n========================================================`);
console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`========================================================\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
