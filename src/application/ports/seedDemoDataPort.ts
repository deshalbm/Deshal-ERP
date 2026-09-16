export interface SeedResult {
  success: boolean;
  message: string;
  details: {
    branches: number;
    accounts: number;
    customers: number;
    employees: number;
    products: number;
    suppliers: number;
    spaces: number;
    services: number;
  };
}

export interface SeedDemoDataPort {
  seedDemoData(companyId: string): Promise<SeedResult>;
}
