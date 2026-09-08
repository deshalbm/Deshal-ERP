import assert from "assert";
import { verifyKioskEmployeeCode, verifyKioskPin } from "../utils/kioskSecurity";
import { Employee } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — KIOSK EMPLOYEE CODE AUTHENTICATION TEST SUITE");
console.log("================================================================\n");

// Polyfill localStorage if running in Node environment
if (typeof localStorage === "undefined" || !(localStorage as any).getItem) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

const TEST_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    employeeCode: "EMP-001",
    fullName: "سعيد بن راشد الشحي",
    fullNameEn: "Said Rashid Al-Shehhi",
    civilId: "109847291",
    email: "said.shehhi@deshalbm.com",
    phone: "+968 99123456",
    role: "ADMIN",
    jobTitle: "المدير التنفيذي العام",
    department: "الإدارة العليا",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    status: "ACTIVE",
    hireDate: "2024-01-01",
    contractType: "FULL_TIME",
    basicSalary: 1200,
    allowances: 300,
    currency: "OMR",
    permissions: [],
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2026-09-08T08:00:00Z"
  },
  {
    id: "emp-2",
    employeeCode: "EMP-002",
    fullName: "فاطمة بنت ناصر البلوشي",
    fullNameEn: "Fatima Nasser Al-Balushi",
    civilId: "118274910",
    email: "fatima.balushi@deshalbm.com",
    phone: "+968 99234567",
    role: "ACCOUNTANT",
    jobTitle: "رئيسة قسم المحاسبة والمالية",
    department: "المالية والمحاسبة",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    status: "ACTIVE",
    hireDate: "2024-03-15",
    contractType: "FULL_TIME",
    basicSalary: 850,
    allowances: 150,
    currency: "OMR",
    permissions: [],
    createdAt: "2024-03-15T08:00:00Z",
    updatedAt: "2026-09-08T08:00:00Z"
  },
  {
    id: "emp-3",
    employeeCode: "EMP-003",
    fullName: "طارق بن سالم المعمري",
    fullNameEn: "Tariq Salem Al-Maamari",
    civilId: "103847294",
    email: "tariq.maamari@deshalbm.com",
    phone: "+968 99345678",
    role: "SALES",
    jobTitle: "مشرف مبيعات وتنفيذي عقود",
    department: "المبيعات والمشاريع",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    status: "ACTIVE",
    hireDate: "2024-06-01",
    contractType: "FULL_TIME",
    basicSalary: 650,
    allowances: 120,
    currency: "OMR",
    permissions: [],
    createdAt: "2024-06-01T08:00:00Z",
    updatedAt: "2026-09-08T08:00:00Z"
  },
  {
    id: "emp-4",
    employeeCode: "EMP-004",
    fullName: "خالد بن خلفان الحوسني",
    fullNameEn: "Khalid Khalfan Al-Hosni",
    civilId: "129847119",
    email: "khalid.hosni@deshalbm.com",
    phone: "+968 99456789",
    role: "STOREKEEPER",
    jobTitle: "أمين المستودعات المركزية",
    department: "المستودعات واللوجستيات",
    branchId: "branch-sohar",
    branchName: "فرع صحار الرئيسي",
    status: "ACTIVE",
    hireDate: "2024-09-01",
    contractType: "FULL_TIME",
    basicSalary: 550,
    allowances: 100,
    currency: "OMR",
    permissions: [],
    createdAt: "2024-09-01T08:00:00Z",
    updatedAt: "2026-09-08T08:00:00Z"
  },
  {
    id: "emp-5",
    employeeCode: "EMP-005",
    fullName: "مريم بنت حمد الكعبي",
    fullNameEn: "Maryam Hamad Al-Kaabi",
    civilId: "134857201",
    email: "maryam.kaabi@deshalbm.com",
    phone: "+968 99567890",
    role: "RECEPTIONIST",
    jobTitle: "مسؤولة الاستقبال والخدمات",
    department: "خدمة العملاء والاستقبال",
    branchId: "branch-muscat",
    branchName: "فرع مسقط - الغبرة",
    status: "ACTIVE",
    hireDate: "2025-01-15",
    contractType: "FULL_TIME",
    basicSalary: 500,
    allowances: 100,
    currency: "OMR",
    permissions: [],
    createdAt: "2025-01-15T08:00:00Z",
    updatedAt: "2026-09-08T08:00:00Z"
  }
];

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
    const res = await verifyKioskPin("EMP-001", TEST_EMPLOYEES);
    assert.strictEqual(res.success, true, "EMP-001 should match Executive General Manager");
    assert.strictEqual(res.employee?.employeeCode, "EMP-001");
    assert.strictEqual(res.employee?.fullName, "سعيد بن راشد الشحي");
  });

  test("2. Case-Insensitive Match with Employee Code (emp-002)", async () => {
    const res = await verifyKioskPin("emp-002", TEST_EMPLOYEES);
    assert.strictEqual(res.success, true, "emp-002 should match Fatima");
    assert.strictEqual(res.employee?.employeeCode, "EMP-002");
  });

  test("3. Numeric Short Code Match (003 or 3 -> EMP-003)", async () => {
    const res1 = await verifyKioskPin("003", TEST_EMPLOYEES);
    assert.strictEqual(res1.success, true, "003 should match EMP-003");
    assert.strictEqual(res1.employee?.employeeCode, "EMP-003");

    const res2 = await verifyKioskPin("4", TEST_EMPLOYEES);
    assert.strictEqual(res2.success, true, "4 should match EMP-004");
    assert.strictEqual(res2.employee?.employeeCode, "EMP-004");
  });

  test("4. Quick Tap Employee Selection (EMP-005)", async () => {
    const res = verifyKioskEmployeeCode("EMP-005", TEST_EMPLOYEES);
    assert.strictEqual(res.success, true, "EMP-005 should match Maryam");
    assert.strictEqual(res.employee?.employeeCode, "EMP-005");
  });

  test("5. Reject Non-Existent Employee Code", async () => {
    const res = await verifyKioskPin("EMP-999", TEST_EMPLOYEES);
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
