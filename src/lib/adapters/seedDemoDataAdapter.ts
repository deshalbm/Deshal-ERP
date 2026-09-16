import type { SeedDemoDataPort, SeedResult } from '../../application/ports/seedDemoDataPort';
import { seedDemoDataToSupabase } from '../supabase/seedDemoData';

export const defaultSeedDemoDataAdapter: SeedDemoDataPort = {
  seedDemoData(companyId: string): Promise<SeedResult> {
    return seedDemoDataToSupabase(companyId);
  }
};
