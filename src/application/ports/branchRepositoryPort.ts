import { Branch } from '../../types';

export interface BranchRepositoryPort {
  loadBranches(): Branch[];
  loadActiveBranchId(): string | null;
}
