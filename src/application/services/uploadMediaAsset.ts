import type { MediaStoragePort, UploadMediaResult } from '../ports/mediaStoragePort';

export async function uploadMediaAsset(
  bucket: string,
  path: string,
  base64Data: string,
  storageAdapter?: MediaStoragePort
): Promise<UploadMediaResult> {
  if (!storageAdapter) {
    return { error: 'Media storage adapter not provided.' };
  }
  return storageAdapter.uploadImage(bucket, path, base64Data);
}
