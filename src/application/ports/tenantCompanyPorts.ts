import { TenantCompanyProfile } from "../../domain/tenant/tenantCompanyDomain";

/**
 * Port contract for tenant company profile persistence.
 * Pure application interface contract.
 */
export interface TenantCompanyStorageAdapter {
  loadProfiles(): TenantCompanyProfile[];
  saveProfiles(profiles: TenantCompanyProfile[]): void;
}
