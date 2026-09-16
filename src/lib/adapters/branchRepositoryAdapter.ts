import { BranchRepositoryPort } from '../../application/ports/branchRepositoryPort';
import { Branch } from '../../types';
import { loadBranches } from '../../utils/storage';

export const defaultBranchRepositoryAdapter: BranchRepositoryPort = {
  loadBranches(): Branch[] {
    return loadBranches();
  },
  loadActiveBranchId(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('rv_studio_active_branch_id') : null;
  }
};
