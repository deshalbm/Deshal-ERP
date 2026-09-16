import {
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSION_CONFIG
} from "../domain/hr/employeePermissions";
import {
  ROLE_DEFAULT_PERMISSIONS as STORAGE_ROLE_PERMISSIONS,
  PERMISSION_CONFIG as STORAGE_PERMISSION_CONFIG
} from "../utils/storage/employeesStorage";
import { EmployeeRole } from "../types";

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
  ROLE_DEFAULT_PERMISSIONS.ADMIN.length === 26,
  "ADMIN role has all 26 default permissions"
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

// TEST 3: Permission Config Dictionary Invariants
console.log("\n--- TEST 3: PERMISSION CONFIG DICTIONARY INVARIANTS ---");
assert(
  PERMISSION_CONFIG.length === 28,
  "PERMISSION_CONFIG dictionary contains exactly 28 entries"
);

const categories = new Set(PERMISSION_CONFIG.map(p => p.category));
assert(
  categories.has("vouchers") &&
    categories.has("inventory") &&
    categories.has("purchases") &&
    categories.has("crm") &&
    categories.has("management") &&
    categories.has("attendance"),
  "PERMISSION_CONFIG covers all 6 categories (vouchers, inventory, purchases, crm, management, attendance)"
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

// TEST 4: Re-export Backward Compatibility Verification
console.log("\n--- TEST 4: RE-EXPORT BACKWARD COMPATIBILITY VERIFICATION ---");
assert(
  ROLE_DEFAULT_PERMISSIONS === STORAGE_ROLE_PERMISSIONS,
  "ROLE_DEFAULT_PERMISSIONS re-exported from employeesStorage references exact same object"
);

assert(
  PERMISSION_CONFIG === STORAGE_PERMISSION_CONFIG,
  "PERMISSION_CONFIG re-exported from employeesStorage references exact same object"
);

console.log(`\n==============================================================`);
console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log(`==============================================================\n`);
