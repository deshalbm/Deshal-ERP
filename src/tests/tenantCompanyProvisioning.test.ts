import {
  TenantCompanyProfile,
  TenantModuleFeatures,
  CreateTenantCompanyParams,
  getDefaultTenantModuleFeatures,
  validateTenantCompanyParams,
  createTenantCompanyProfile,
  toggleTenantModuleFeature
} from "../domain/tenant/tenantCompanyDomain";
import {
  provisionNewTenantCompany,
  updateTenantCompanyFeatures,
  loadTenantCompanyProfiles,
  saveTenantCompanyProfiles
} from "../application/services/tenantCompanyProvisioning";
import { TenantCompanyStorageAdapter } from "../application/ports/tenantCompanyPorts";

// Mock In-Memory Storage Adapter for Testing
class InMemoryTenantCompanyAdapter implements TenantCompanyStorageAdapter {
  private memory: TenantCompanyProfile[] = [];

  constructor(initial: TenantCompanyProfile[] = []) {
    this.memory = [...initial];
  }

  loadProfiles(): TenantCompanyProfile[] {
    return [...this.memory];
  }

  saveProfiles(profiles: TenantCompanyProfile[]): void {
    this.memory = [...profiles];
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

console.log("==========================================");
console.log("🧪 Running Tenant Company Provisioning Tests");
console.log("==========================================");

// Test 1: Domain - Default Module Features
console.log("\n[Test 1] Domain - Default Module Features");
const defaultFeatures = getDefaultTenantModuleFeatures();
assert(defaultFeatures.crmEnabled === true, "crmEnabled should default to true");
assert(defaultFeatures.posEnabled === true, "posEnabled should default to true");
assert(defaultFeatures.accountingEnabled === true, "accountingEnabled should default to true");
assert(defaultFeatures.hrEnabled === true, "hrEnabled should default to true");
assert(defaultFeatures.spacesEnabled === true, "spacesEnabled should default to true");
console.log("✅ Passed: Default features initialized correctly.");

// Test 2: Domain - Parameter Validation
console.log("\n[Test 2] Domain - Parameter Validation");
const invalidParams: CreateTenantCompanyParams = {
  name: "",
  crNumber: "",
  taxId: "",
  currency: "",
  mainBranchName: "",
  adminEmail: "invalid-email",
  adminName: "",
  adminPin: "12"
};
const validationResult = validateTenantCompanyParams(invalidParams);
assert(validationResult.valid === false, "Validation should fail for empty/invalid params");
assert(validationResult.errors.length >= 5, "Should return multiple validation errors");
console.log("✅ Passed: Parameter validation rejected invalid params correctly.");

// Test 3: Domain - Create Tenant Company Profile
console.log("\n[Test 3] Domain - Create Tenant Company Profile");
const validParams: CreateTenantCompanyParams = {
  companyId: "cmp_test_100",
  name: "شركة العالمي لخدمات الأعمال",
  crNumber: "CR-998877",
  taxId: "OM102938475",
  currency: "OMR",
  mainBranchName: "الفرع الرئيسي - مسقط",
  adminEmail: "admin@alalami.om",
  adminName: "سعيد البوسعيدي",
  adminPin: "9988",
  status: "ACTIVE",
  moduleFeatures: {
    posDiscountOverrideEnabled: false
  }
};

const fixedTimeMs = 1750000000000;
const profile = createTenantCompanyProfile(validParams, fixedTimeMs);
assert(profile.companyId === "cmp_test_100", "Company ID mismatch");
assert(profile.name === "شركة العالمي لخدمات الأعمال", "Company name mismatch");
assert(profile.currency === "OMR", "Currency should be upper case");
assert(profile.moduleFeatures.posEnabled === true, "posEnabled default should remain true");
assert(profile.moduleFeatures.posDiscountOverrideEnabled === false, "posDiscountOverrideEnabled override should be false");
assert(profile.createdAt === new Date(fixedTimeMs).toISOString(), "Timestamp mismatch");
console.log("✅ Passed: Profile creation domain function works as expected.");

// Test 4: Domain - Toggle Module Feature Flag
console.log("\n[Test 4] Domain - Toggle Module Feature Flag");
const updatedTimeMs = 1750000100000;
const updatedProfile = toggleTenantModuleFeature(profile, "spacesEnabled", false, updatedTimeMs);
assert(updatedProfile.moduleFeatures.spacesEnabled === false, "spacesEnabled should be toggled to false");
assert(updatedProfile.moduleFeatures.posEnabled === true, "posEnabled should remain unchanged");
assert(updatedProfile.updatedAt === new Date(updatedTimeMs).toISOString(), "UpdatedAt timestamp should update");
assert(profile.moduleFeatures.spacesEnabled === true, "Original profile must remain immutable");
console.log("✅ Passed: Feature flag toggling is immutable and updates timestamp.");

// Test 5: Application Service - Provision New Tenant Company
console.log("\n[Test 5] Application Service - Provision New Tenant Company");
const mockAdapter = new InMemoryTenantCompanyAdapter();
const provisionRes = provisionNewTenantCompany(validParams, mockAdapter, fixedTimeMs);
assert(provisionRes.success === true, "Provisioning should succeed");
assert(provisionRes.profile !== undefined, "Provisioned profile should be returned");
assert(mockAdapter.loadProfiles().length === 1, "Storage adapter should contain 1 company profile");
assert(mockAdapter.loadProfiles()[0].companyId === "cmp_test_100", "Stored company ID matches");
console.log("✅ Passed: Provisioning application service persisted profile.");

// Test 6: Application Service - Duplicate CR Prevention
console.log("\n[Test 6] Application Service - Duplicate CR Prevention");
const duplicateRes = provisionNewTenantCompany(
  { ...validParams, companyId: "cmp_test_101", name: "شركة أخرى بنفس السجل" },
  mockAdapter,
  fixedTimeMs
);
assert(duplicateRes.success === false, "Provisioning duplicate CR should fail");
assert(duplicateRes.error?.includes("CR-998877") === true, "Error message should report duplicate CR");
assert(mockAdapter.loadProfiles().length === 1, "Storage adapter should still contain only 1 profile");
console.log("✅ Passed: Duplicate CR prevention verified.");

// Test 7: Application Service - Update Tenant Company Features
console.log("\n[Test 7] Application Service - Update Tenant Company Features");
const updateRes = updateTenantCompanyFeatures(
  "cmp_test_100",
  { hrEnabled: false, posDiscountOverrideEnabled: true },
  mockAdapter,
  updatedTimeMs
);
assert(updateRes.success === true, "Updating features should succeed");
assert(updateRes.profile?.moduleFeatures.hrEnabled === false, "hrEnabled should be false");
assert(updateRes.profile?.moduleFeatures.posDiscountOverrideEnabled === true, "posDiscountOverrideEnabled should be true");
assert(mockAdapter.loadProfiles()[0].moduleFeatures.hrEnabled === false, "Storage adapter updated");
console.log("✅ Passed: Application service updated company module features.");

// Test 8: Application Service - Load and Save Profiles
console.log("\n[Test 8] Application Service - Load and Save Profiles");
const loadedProfiles = loadTenantCompanyProfiles(mockAdapter);
assert(loadedProfiles.length === 1, "Loaded profiles count matches");
saveTenantCompanyProfiles([], mockAdapter);
assert(loadTenantCompanyProfiles(mockAdapter).length === 0, "Saved empty array clears storage");
console.log("✅ Passed: Load and save helper application functions verified.");

console.log("\n🎉 ALL TENANT COMPANY PROVISIONING TESTS PASSED PERFECTLY!");
