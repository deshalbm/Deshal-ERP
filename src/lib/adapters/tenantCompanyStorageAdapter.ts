import { TenantCompanyStorageAdapter } from "../../application/ports/tenantCompanyPorts";
import { TenantCompanyProfile } from "../../domain/tenant/tenantCompanyDomain";

const TENANT_COMPANIES_STORAGE_KEY = "deshal_tenant_companies_v1";

export class LocalStorageTenantCompanyAdapter implements TenantCompanyStorageAdapter {
  private key: string;

  constructor(key: string = TENANT_COMPANIES_STORAGE_KEY) {
    this.key = key;
  }

  loadProfiles(): TenantCompanyProfile[] {
    if (typeof localStorage === "undefined") {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.warn("Failed to load tenant company profiles from localStorage:", e);
      return [];
    }
  }

  saveProfiles(profiles: TenantCompanyProfile[]): void {
    if (typeof localStorage === "undefined") {
      return;
    }

    try {
      localStorage.setItem(this.key, JSON.stringify(profiles));
    } catch (e) {
      console.error("Failed to save tenant company profiles to localStorage:", e);
    }
  }
}

export const defaultTenantCompanyStorageAdapter = new LocalStorageTenantCompanyAdapter();
