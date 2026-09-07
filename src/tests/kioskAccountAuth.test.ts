import assert from "assert";
import { authenticateKioskAccount, DEFAULT_KIOSK_DEVICES } from "../utils/attendanceStorage";
import { KioskDevice } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — KIOSK TABLET ACCOUNT AUTHENTICATION TEST SUITE");
console.log("================================================================\n");

async function runKioskAuthTests() {
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

  const testDevices: KioskDevice[] = [
    {
      id: "dev-sohar-01",
      deviceCode: "KIOSK-SOH-01",
      name: "آيباد فرع صحار الرئيسي",
      companyName: "ديشال لإدارة الأعمال",
      branchId: "branch-sohar",
      branchName: "فرع صحار الرئيسي",
      location: "صالة الاستقبال",
      username: "kiosk.sohar",
      plainPassword: "password123",
      deviceToken: "tok_sohar_01",
      status: "ACTIVE",
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "dev-warehouse-01",
      deviceCode: "KIOSK-WH-01",
      name: "تابلت المستودع",
      companyName: "ديشال لإدارة الأعمال",
      branchId: "branch-sohar",
      branchName: "فرع صحار الرئيسي",
      location: "بوابة المستودع",
      username: "kiosk.warehouse",
      plainPassword: "wh654321",
      deviceToken: "tok_wh_01",
      status: "SUSPENDED",
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  test("Successful Authentication with valid Username & Password", () => {
    const res = authenticateKioskAccount("kiosk.sohar", "password123", testDevices);
    assert.strictEqual(res.success, true, "Authentication should succeed for valid credentials");
    assert.strictEqual(res.device?.id, "dev-sohar-01", "Should return the matching kiosk device");
  });

  test("Case-Insensitive Username matching", () => {
    const res = authenticateKioskAccount("KioSk.SoHaR", "password123", testDevices);
    assert.strictEqual(res.success, true, "Username matching should be case-insensitive");
  });

  test("Authentication failure for incorrect password", () => {
    const res = authenticateKioskAccount("kiosk.sohar", "wrongpass", testDevices);
    assert.strictEqual(res.success, false, "Authentication should fail for wrong password");
    assert.ok(res.errorMessage?.includes("غير صحيح"), "Error message should report invalid password");
  });

  test("Authentication failure for non-existent username", () => {
    const res = authenticateKioskAccount("kiosk.unknown", "123456", testDevices);
    assert.strictEqual(res.success, false, "Authentication should fail for non-existent account");
  });

  test("Authentication failure for SUSPENDED kiosk device", () => {
    const res = authenticateKioskAccount("kiosk.warehouse", "wh654321", testDevices);
    assert.strictEqual(res.success, false, "Authentication should fail for suspended device");
    assert.ok(res.errorMessage?.includes("معلق"), "Error message should indicate device is suspended");
  });

  test("Default Kiosk Devices contain valid Username & Credentials", () => {
    assert.ok(DEFAULT_KIOSK_DEVICES.length >= 3, "DEFAULT_KIOSK_DEVICES should have default seed devices");
    for (const dev of DEFAULT_KIOSK_DEVICES) {
      assert.ok(dev.username, `Device ${dev.id} must have a username`);
      assert.ok(dev.plainPassword, `Device ${dev.id} must have a plainPassword`);
    }
  });

  test("Authentication via email profile (kiosk.main@deshalbm.com) succeeds", () => {
    const res = authenticateKioskAccount("kiosk.main@deshalbm.com", "123456", DEFAULT_KIOSK_DEVICES);
    assert.strictEqual(res.success, true, "Email login should succeed for kiosk.main@deshalbm.com");
    assert.strictEqual(res.device?.username, "kiosk.main", "Should match kiosk.main device");
  });

  console.log("\n================================================================");
  console.log(`  RESULTS: Total Tests: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
  console.log("================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runKioskAuthTests();
