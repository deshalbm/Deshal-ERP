import type { MasterDataPort } from '../ports/masterDataPort';
import type { MasterLocation } from '../../types';

export async function fetchMasterLocations(
  adapter?: MasterDataPort
): Promise<MasterLocation[]> {
  if (!adapter) return [];
  return adapter.getMasterLocations();
}
