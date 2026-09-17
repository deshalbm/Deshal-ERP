import {
  TenantCompanyProfile,
  TenantModuleFeatures,
  CreateTenantCompanyParams,
  createTenantCompanyProfile,
  toggleTenantModuleFeature,
  validateTenantCompanyParams
} from "../../domain/tenant/tenantCompanyDomain";
import { TenantCompanyStorageAdapter } from "../ports/tenantCompanyPorts";

export interface ProvisioningResult {
  success: boolean;
  profile?: TenantCompanyProfile;
  error?: string;
  validationErrors?: string[];
}

/**
 * Application use case: Provision a new tenant company with company profile, admin info, and module scope.
 */
export function provisionNewTenantCompany(
  params: CreateTenantCompanyParams,
  storageAdapter?: TenantCompanyStorageAdapter,
  nowMs: number = Date.now()
): ProvisioningResult {
  const validation = validateTenantCompanyParams(params);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join("; "),
      validationErrors: validation.errors
    };
  }

  const existingProfiles = storageAdapter ? storageAdapter.loadProfiles() : [];
  
  // Check CR number duplicate
  const duplicateCr = existingProfiles.find(
    p => p.crNumber.trim().toLowerCase() === params.crNumber.trim().toLowerCase()
  );
  if (duplicateCr) {
    return {
      success: false,
      error: `توجد شركة مسبقاً برقم السجل التجاري ${params.crNumber} (${duplicateCr.name}). / Company with CR number already exists.`
    };
  }

  try {
    const newProfile = createTenantCompanyProfile(params, nowMs);
    const updatedProfiles = [...existingProfiles, newProfile];

    if (storageAdapter) {
      storageAdapter.saveProfiles(updatedProfiles);
    }

    return {
      success: true,
      profile: newProfile
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to provision tenant company profile."
    };
  }
}

/**
 * Application use case: Update fine-grained module feature flags for an existing tenant company.
 */
export function updateTenantCompanyFeatures(
  companyId: string,
  features: Partial<TenantModuleFeatures>,
  storageAdapter?: TenantCompanyStorageAdapter,
  nowMs: number = Date.now()
): ProvisioningResult {
  const existingProfiles = storageAdapter ? storageAdapter.loadProfiles() : [];
  const targetIndex = existingProfiles.findIndex(p => p.companyId === companyId);

  if (targetIndex === -1) {
    return {
      success: false,
      error: `لم يتم العثور على الشركة برقم ${companyId} / Company profile not found.`
    };
  }

  let currentProfile = existingProfiles[targetIndex];

  // Apply feature updates sequentially using domain rules
  (Object.keys(features) as Array<keyof TenantModuleFeatures>).forEach(key => {
    if (features[key] !== undefined) {
      currentProfile = toggleTenantModuleFeature(currentProfile, key, Boolean(features[key]), nowMs);
    }
  });

  const updatedProfiles = [...existingProfiles];
  updatedProfiles[targetIndex] = currentProfile;

  if (storageAdapter) {
    storageAdapter.saveProfiles(updatedProfiles);
  }

  return {
    success: true,
    profile: currentProfile
  };
}

/**
 * Application use case: Load all provisioned tenant company profiles.
 */
export function loadTenantCompanyProfiles(
  storageAdapter?: TenantCompanyStorageAdapter
): TenantCompanyProfile[] {
  if (!storageAdapter) return [];
  return storageAdapter.loadProfiles();
}

/**
 * Application use case: Save all tenant company profiles.
 */
export function saveTenantCompanyProfiles(
  profiles: TenantCompanyProfile[],
  storageAdapter?: TenantCompanyStorageAdapter
): void {
  if (storageAdapter) {
    storageAdapter.saveProfiles(profiles);
  }
}
