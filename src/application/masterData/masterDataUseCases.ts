import { Branch, CompanySettings } from '../../types';

export interface UpdateBranchResult {
  success: boolean;
  message?: string;
  updatedBranches: Branch[];
}

/**
 * Pure Application Use Case for updating or adding a Branch.
 * Validates branch code uniqueness across the organization.
 */
export function updateBranchList(
  branch: Branch,
  branches: Branch[]
): UpdateBranchResult {
  const existingIdx = branches.findIndex((b) => b.id === branch.id);
  const duplicateCode = branches.find(
    (b) => b.code.toLowerCase() === branch.code.toLowerCase() && b.id !== branch.id
  );

  if (duplicateCode) {
    return {
      success: false,
      message: `كود الفرع (${branch.code}) مستخدم بالفعل لفرع آخر.`,
      updatedBranches: branches
    };
  }

  let updatedBranches: Branch[];
  if (existingIdx >= 0) {
    updatedBranches = branches.map((b) => (b.id === branch.id ? branch : b));
  } else {
    updatedBranches = [...branches, branch];
  }

  return {
    success: true,
    updatedBranches
  };
}

/**
 * Pure Application Use Case for validating Company Settings.
 */
export function validateCompanySettings(
  settings: CompanySettings
): { valid: boolean; message?: string } {
  if (!settings.companyName || settings.companyName.trim() === '') {
    return { valid: false, message: 'اسم الشركة مطلوب.' };
  }
  return { valid: true };
}
