export interface UploadMediaResult {
  publicUrl?: string;
  error?: string;
}

export interface MediaStoragePort {
  uploadImage(bucket: string, path: string, base64Data: string): Promise<UploadMediaResult>;
}
