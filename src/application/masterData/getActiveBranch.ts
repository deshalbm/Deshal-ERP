import { Branch } from "../../types";
import { BranchRepositoryPort } from "../ports/branchRepositoryPort";

export interface GetActiveBranchOptions {
  branches?: Branch[];
  activeId?: string | null;
  repository?: BranchRepositoryPort;
  loadBranchesHandler?: () => Branch[];
  loadActiveIdHandler?: () => string | null;
}

/**
 * Application Resolver: Resolves the currently active branch from provided state or repository.
 * Pure Application Layer — Zero direct browser/storage dependencies.
 */
export function getActiveBranch(options?: GetActiveBranchOptions): Branch {
  const repo = options?.repository;
  const loadBranchesFn = options?.loadBranchesHandler || (repo ? () => repo.loadBranches() : () => []);
  const loadActiveIdFn = options?.loadActiveIdHandler || (repo ? () => repo.loadActiveBranchId() : () => null);

  const branches = options?.branches || loadBranchesFn();
  const activeId = options?.activeId !== undefined ? options.activeId : loadActiveIdFn();

  return (
    branches.find((b) => b.id === activeId) ||
    branches[0] ||
    ({
      id: "branch-sohar",
      nameAr: "فرع صحار الرئيسي",
      nameEn: "Sohar Main Branch",
    } as unknown as Branch)
  );
}
