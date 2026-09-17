import {
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSION_CONFIG,
  PERMISSION_CATEGORIES_META,
  ALL_PERMISSIONS,
  evaluateEmployeePermissions,
  hasPermission
} from "../domain/hr/employeePermissions";
import {
  ROLE_DEFAULT_PERMISSIONS as STORAGE_ROLE_PERMISSIONS,
  PERMISSION_CONFIG as STORAGE_PERMISSION_CONFIG,
  evaluateEmployeePermissions as STORAGE_EVALUATE,
  hasPermission as STORAGE_HAS_PERMISSION
} from "../utils/storage/employeesStorage";
import { EmployeeRole, EmployeePermission } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — HR EMPLOYEE PERMISSIONS DOMAIN UNIT TEST SUITE");
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

// TEST 1: Role Default Permissions Matrix Coverage
console.log("--- TEST 1: ROLE DEFAULT PERMISSIONS MATRIX COVERAGE ---");
const expectedRoles: EmployeeRole[] = [
  "ADMIN",
  "MANAGER",
  "ACCOUNTANT",
  "SALES",
  "STOREKEEPER",
  "RECEPTIONIST",
  "COLLABORATOR",
  "AUDITOR",
  "KIOSK_TABLET",
  "CUSTOM"
];

expectedRoles.forEach(role => {
  assert(
    Array.isArray(ROLE_DEFAULT_PERMISSIONS[role]),
    `Role matrix contains permissions array for '${role}'`
  );
});

assert(
  Object.keys(ROLE_DEFAULT_PERMISSIONS).length === 10,
  "Role default permissions matrix contains exactly 10 roles"
);

// TEST 2: Role Specific Permission Characterization
console.log("\n--- TEST 2: ROLE SPECIFIC PERMISSION CHARACTERIZATION ---");
assert(
  ROLE_DEFAULT_PERMISSIONS.ADMIN.length === PERMISSION_CONFIG.length,
  `ADMIN role has all ${PERMISSION_CONFIG.length} default permissions`
);
assert(
  ROLE_DEFAULT_PERMISSIONS.ADMIN.includes("edit_settings") &&
    ROLE_DEFAULT_PERMISSIONS.ADMIN.includes("manage_employees") &&
    ROLE_DEFAULT_PERMISSIONS.ADMIN.includes("attendance_settings"),
  "ADMIN role includes top-level administrative permissions"
);

assert(
  ROLE_DEFAULT_PERMISSIONS.KIOSK_TABLET.length === 1 &&
    ROLE_DEFAULT_PERMISSIONS.KIOSK_TABLET[0] === "kiosk_mode_only",
  "KIOSK_TABLET role has strictly ['kiosk_mode_only'] permission"
);

assert(
  ROLE_DEFAULT_PERMISSIONS.AUDITOR.includes("auditor_read_only") &&
    !ROLE_DEFAULT_PERMISSIONS.AUDITOR.includes("edit_settings") &&
    !ROLE_DEFAULT_PERMISSIONS.AUDITOR.includes("delete_vouchers"),
  "AUDITOR role has read-only permissions and no edit/delete capabilities"
);

assert(
  ROLE_DEFAULT_PERMISSIONS.COLLABORATOR.includes("collaborator_limited"),
  "COLLABORATOR role includes 'collaborator_limited' permission"
);

// TEST 3: Permission Config Dictionary & 11 Module Categories Invariants
console.log("\n--- TEST 3: PERMISSION CONFIG DICTIONARY INVARIANTS ---");
assert(
  PERMISSION_CONFIG.length === 91,
  `PERMISSION_CONFIG dictionary contains exactly 91 granular permission entries`
);

assert(
  PERMISSION_CATEGORIES_META.length === 11,
  "PERMISSION_CATEGORIES_META covers all 11 system functional modules"
);

const categories = new Set(PERMISSION_CONFIG.map(p => p.category));
assert(
  categories.has("vouchers") &&
    categories.has("pos") &&
    categories.has("inventory") &&
    categories.has("purchases") &&
    categories.has("crm") &&
    categories.has("spaces") &&
    categories.has("services") &&
    categories.has("hr") &&
    categories.has("attendance") &&
    categories.has("requests") &&
    categories.has("management"),
  "PERMISSION_CONFIG covers all 11 categories (vouchers, pos, inventory, purchases, crm, spaces, services, hr, attendance, requests, management)"
);

PERMISSION_CONFIG.forEach(config => {
  assert(
    typeof config.id === "string" && config.id.length > 0,
    `Permission config item '${config.id}' has valid non-empty ID`
  );
  assert(
    typeof config.label === "string" && config.label.length > 0,
    `Permission config item '${config.id}' has valid non-empty label`
  );
  assert(
    typeof config.description === "string" && config.description.length > 0,
    `Permission config item '${config.id}' has valid non-empty description`
  );
});

// TEST 4: Custom Permission Matrix Evaluation & Overrides
console.log("\n--- TEST 4: CUSTOM PERMISSION MATRIX EVALUATION & OVERRIDES ---");
const testEmployee = {
  role: "SALES" as EmployeeRole,
  permissions: ["create_vouchers", "manage_spaces", "manage_services"] as EmployeePermission[]
};

const evaluated = evaluateEmployeePermissions(testEmployee);
assert(
  evaluated.includes("create_vouchers") &&
    evaluated.includes("manage_spaces") &&
    evaluated.includes("manage_services") &&
    !evaluated.includes("delete_vouchers"),
  "evaluateEmployeePermissions uses custom employee permissions array as authoritative override"
);

assert(
  hasPermission(testEmployee, "manage_spaces") === true,
  "hasPermission returns true for custom granted permission 'manage_spaces' on SALES role"
);

assert(
  hasPermission(testEmployee, "delete_vouchers") === false,
  "hasPermission returns false for ungranted permission 'delete_vouchers'"
);

// Fallback to role defaults when permissions array is not defined
const fallbackEmp = { role: "STOREKEEPER" as EmployeeRole };
const fallbackEval = evaluateEmployeePermissions(fallbackEmp);
assert(
  fallbackEval.includes("manage_inventory") && fallbackEval.includes("inventory_stocktake"),
  "evaluateEmployeePermissions falls back to STOREKEEPER role default permissions when employee custom permissions are undefined"
);

// TEST 5: Re-export Backward Compatibility Verification
console.log("\n--- TEST 5: RE-EXPORT BACKWARD COMPATIBILITY VERIFICATION ---");
assert(
  ROLE_DEFAULT_PERMISSIONS === STORAGE_ROLE_PERMISSIONS,
  "ROLE_DEFAULT_PERMISSIONS re-exported from employeesStorage references exact same object"
);

assert(
  PERMISSION_CONFIG === STORAGE_PERMISSION_CONFIG,
  "PERMISSION_CONFIG re-exported from employeesStorage references exact same object"
);

assert(
  evaluateEmployeePermissions === STORAGE_EVALUATE,
  "evaluateEmployeePermissions re-exported from employeesStorage references exact same function"
);

assert(
  hasPermission === STORAGE_HAS_PERMISSION,
  "hasPermission re-exported from employeesStorage references exact same function"
);

// TEST 6: Employee PIN Management Permission & Strict Validation
console.log("\n--- TEST 6: EMPLOYEE PIN MGMT PERMISSION & PIN VALIDATION ---");
const adminUser = { role: "ADMIN" as EmployeeRole };
const salesUserWithoutPinPerm = { role: "SALES" as EmployeeRole, permissions: ["pos_create_order"] as EmployeePermission[] };
const salesUserWithPinPerm = { role: "SALES" as EmployeeRole, permissions: ["employee_pin_mgmt"] as EmployeePermission[] };

assert(
  hasPermission(adminUser, "employee_pin_mgmt") === true,
  "ADMIN role has employee_pin_mgmt permission by default"
);

assert(
  hasPermission(salesUserWithoutPinPerm, "employee_pin_mgmt") === false,
  "User without employee_pin_mgmt permission is denied PIN management access"
);

assert(
  hasPermission(salesUserWithPinPerm, "employee_pin_mgmt") === true,
  "User with explicit employee_pin_mgmt permission is granted PIN management access"
);

const pinRegex = /^\d{4,6}$/;
assert(pinRegex.test("1234") === true, "PIN '1234' (4 digits) is valid");
assert(pinRegex.test("123456") === true, "PIN '123456' (6 digits) is valid");
assert(pinRegex.test("123") === false, "PIN '123' (3 digits) is invalid");
assert(pinRegex.test("1234567") === false, "PIN '1234567' (7 digits) is invalid");
assert(pinRegex.test("12a4") === false, "PIN with non-numeric chars '12a4' is invalid");

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
