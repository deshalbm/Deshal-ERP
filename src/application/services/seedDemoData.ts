import type { SeedDemoDataPort, SeedResult } from '../ports/seedDemoDataPort';

export async function seedDemoData(
  companyId: string,
  seederAdapter?: SeedDemoDataPort
): Promise<SeedResult> {
  if (!seederAdapter) {
    return {
      success: false,
      message: 'Seeder adapter not provided.',
      details: { branches: 0, accounts: 0, customers: 0, employees: 0, products: 0, suppliers: 0, spaces: 0, services: 0 }
    };
  }
  return seederAdapter.seedDemoData(companyId);
}
