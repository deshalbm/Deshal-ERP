import type { MasterLocation } from '../../types';

export interface MasterDataPort {
  getMasterLocations(): Promise<MasterLocation[]>;
}
