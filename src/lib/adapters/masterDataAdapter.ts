import type { MasterDataPort } from '../../application/ports/masterDataPort';
import type { MasterLocation } from '../../types';
import { getMasterLocations as supabaseGetMasterLocations } from '../supabase/masterDataService';

export const defaultMasterDataAdapter: MasterDataPort = {
  getMasterLocations(): Promise<MasterLocation[]> {
    return supabaseGetMasterLocations();
  }
};
