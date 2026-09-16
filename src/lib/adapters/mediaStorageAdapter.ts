import type { MediaStoragePort, UploadMediaResult } from '../../application/ports/mediaStoragePort';
import { uploadImageToStorage, StorageBucket } from '../supabase/storageService';

export const defaultMediaStorageAdapter: MediaStoragePort = {
  uploadImage(bucket: string, path: string, base64Data: string): Promise<UploadMediaResult> {
    return uploadImageToStorage(bucket as StorageBucket, path, base64Data);
  }
};
