/**
 * Domain engine for Tenant Companies & Fine-Grained Module Feature Scopes.
 * Pure domain logic: zero UI, zero framework, zero persistence/browser dependencies.
 */

export interface TenantModuleFeatures {
  crmEnabled: boolean;
  crmLeadsEnabled: boolean;
  crmPipelineEnabled: boolean;
  posEnabled: boolean;
  posDiscountOverrideEnabled: boolean;
  inventoryEnabled: boolean;
  accountingEnabled: boolean;
  hrEnabled: boolean;
  spacesEnabled: boolean;
  servicesEnabled: boolean;
  requestsEnabled: boolean;
  documentsEnabled: boolean;
  kioskEnabled: boolean;
}

export type TenantCompanyStatus = "ACTIVE" | "INACTIVE" | "PENDING_PROVISION" | "SUSPENDED";

export interface TenantCompanyProfile {
  companyId: string;
  name: string;
  crNumber: string;
  taxId: string;
  currency: string;
  mainBranchName: string;
  adminEmail: string;
  adminName: string;
  adminPin: string;
  status: TenantCompanyStatus;
  moduleFeatures: TenantModuleFeatures;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantCompanyParams {
  companyId?: string;
  name: string;
  crNumber: string;
  taxId: string;
  currency: string;
  mainBranchName: string;
  adminEmail: string;
  adminName: string;
  adminPin: string;
  status?: TenantCompanyStatus;
  moduleFeatures?: Partial<TenantModuleFeatures>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Returns default fine-grained module feature flags for a newly provisioned enterprise tenant company.
 */
export function getDefaultTenantModuleFeatures(): TenantModuleFeatures {
  return {
    crmEnabled: true,
    crmLeadsEnabled: true,
    crmPipelineEnabled: true,
    posEnabled: true,
    posDiscountOverrideEnabled: true,
    inventoryEnabled: true,
    accountingEnabled: true,
    hrEnabled: true,
    spacesEnabled: true,
    servicesEnabled: true,
    requestsEnabled: true,
    documentsEnabled: true,
    kioskEnabled: true
  };
}

/**
 * Validates parameters for creating or updating a tenant company profile.
 */
export function validateTenantCompanyParams(params: CreateTenantCompanyParams): ValidationResult {
  const errors: string[] = [];

  if (!params.name || !params.name.trim()) {
    errors.push("اسم الشركة مطلوب / Company name is required.");
  }

  if (!params.crNumber || !params.crNumber.trim()) {
    errors.push("رقم السجل التجاري مطلوب / Commercial Registration (CR) number is required.");
  }

  if (!params.adminEmail || !params.adminEmail.trim()) {
    errors.push("البريد الإلكتروني لمدير النظام مطلوب / Admin email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.adminEmail.trim())) {
    errors.push("البريد الإلكتروني غير صالحة / Invalid admin email format.");
  }

  if (!params.adminName || !params.adminName.trim()) {
    errors.push("اسم مدير النظام مطلوب / Admin name is required.");
  }

  if (!params.adminPin || !params.adminPin.trim()) {
    errors.push("رمز PIN لمدير النظام مطلوب / Admin PIN is required.");
  } else if (!/^\d{4,6}$/.test(params.adminPin.trim())) {
    errors.push("رمز PIN يجب أن يتكون من 4 إلى 6 أرقام / Admin PIN must be 4 to 6 numeric digits.");
  }

  if (!params.currency || !params.currency.trim()) {
    errors.push("العملة الرئيسية مطلوبة / Currency is required.");
  }

  if (!params.mainBranchName || !params.mainBranchName.trim()) {
    errors.push("اسم الفرع الرئيسي مطلوب / Main branch name is required.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Pure domain factory function to create a new TenantCompanyProfile.
 */
export function createTenantCompanyProfile(
  params: CreateTenantCompanyParams,
  nowMs: number = Date.now()
): TenantCompanyProfile {
  const validation = validateTenantCompanyParams(params);
  if (!validation.valid) {
    throw new Error(`Invalid tenant company params: ${validation.errors.join("; ")}`);
  }

  const isoTimestamp = new Date(nowMs).toISOString();
  const companyId = params.companyId && params.companyId.trim()
    ? params.companyId.trim()
    : `cmp_${nowMs}`;

  const defaultFeatures = getDefaultTenantModuleFeatures();
  const mergedFeatures: TenantModuleFeatures = {
    ...defaultFeatures,
    ...(params.moduleFeatures || {})
  };

  return {
    companyId,
    name: params.name.trim(),
    crNumber: params.crNumber.trim(),
    taxId: (params.taxId || "").trim(),
    currency: params.currency.trim().toUpperCase(),
    mainBranchName: params.mainBranchName.trim(),
    adminEmail: params.adminEmail.trim().toLowerCase(),
    adminName: params.adminName.trim(),
    adminPin: params.adminPin.trim(),
    status: params.status || "ACTIVE",
    moduleFeatures: mergedFeatures,
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp
  };
}

/**
 * Pure domain function to toggle or update fine-grained module feature flags for a tenant company profile.
 */
export function toggleTenantModuleFeature(
  company: TenantCompanyProfile,
  moduleKey: keyof TenantModuleFeatures,
  enabled: boolean,
  nowMs: number = Date.now()
): TenantCompanyProfile {
  const updatedFeatures: TenantModuleFeatures = {
    ...company.moduleFeatures,
    [moduleKey]: enabled
  };

  return {
    ...company,
    moduleFeatures: updatedFeatures,
    updatedAt: new Date(nowMs).toISOString()
  };
}
