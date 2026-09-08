import assert from "assert";
import { verifyKioskEmployeeCode, verifyKioskPin } from "../utils/kioskSecurity";
import { DEFAULT_EMPLOYEES } from "../utils/storage";

console.log("\n================================================================");
console.log("  DESHAL ERP — KIOSK EMPLOYEE CODE AUTHENTICATION TEST SUITE");
console.log("================================================================\n");

// Polyfill localStorage if running in Node environment
if (typeof localStorage === "undefined" || !localStorage.getItem) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function runKioskEmployeeCodeTests() {
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     ${e.message}`);
    }
  }

  test("1. Direct Match with Full Employee Code (EMP-001)", async () => {
    const res = await verifyKioskPin("EMP-001", DEFAULT_EMPLOYEES);
    assert.strictEqual(res.success, true, "EMP-001 should match Executive General Manager");
    assert.strictEqual(res.employee?.employeeCode, "EMP-001");
    assert.strictEqual(res.employee?.fullName, "سعيد بن راشد الشحي");
  });

  test("2. Case-Insensitive Match with Employee Code (emp-002)", async () => {
    const res = await verifyKioskPin("emp-002", DEFAULT_EMPLOYEES);
    assert.strictEqual(res.success, true, "emp-002 should match Fatima");
    assert.strictEqual(res.employee?.employeeCode, "EMP-002");
  });

  test("3. Numeric Short Code Match (003 or 3 -> EMP-003)", async () => {
    const res1 = await verifyKioskPin("003", DEFAULT_EMPLOYEES);
    assert.strictEqual(res1.success, true, "003 should match EMP-003");
    assert.strictEqual(res1.employee?.employeeCode, "EMP-003");

    const res2 = await verifyKioskPin("4", DEFAULT_EMPLOYEES);
    assert.strictEqual(res2.success, true, "4 should match EMP-004");
    assert.strictEqual(res2.employee?.employeeCode, "EMP-004");
  });

  test("4. Quick Tap Employee Selection (EMP-005)", async () => {
    const res = verifyKioskEmployeeCode("EMP-005", DEFAULT_EMPLOYEES);
    assert.strictEqual(res.success, true, "EMP-005 should match Maryam");
    assert.strictEqual(res.employee?.employeeCode, "EMP-005");
  });

  test("5. Reject Non-Existent Employee Code", async () => {
    const res = await verifyKioskPin("EMP-999", DEFAULT_EMPLOYEES);
    assert.strictEqual(res.success, false, "EMP-999 should fail");
    assert.ok(res.errorMessage?.includes("غير صحيح") || res.errorMessage?.includes("غير مسجل"));
  });

  console.log("\n================================================================");
  console.log(`  RESULTS: Total Tests: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
  console.log("================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runKioskEmployeeCodeTests();
