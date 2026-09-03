/**
 * Supabase Storage Service — Deshal ERP
 * Manages uploading and retrieving media files (kiosk attendance photos, avatars, documents)
 * to Supabase Storage Buckets ('attendance_photos', 'company_assets', 'employee_documents').
 */

import { supabase, isSupabaseConfigured } from './client';

export type StorageBucket = 'attendance_photos' | 'company_assets' | 'employee_documents';

/**
 * Uploads a base64 Data URL or Blob file to a Supabase Storage Bucket and returns its public HTTP URL.
 */
export async function uploadImageToStorage(
  bucketName: StorageBucket,
  filePath: string,
  base64OrBlob: string | Blob
): Promise<{ publicUrl?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase storage is not configured.' };
  }

  try {
    let fileBody: Blob;
    let contentType = 'image/jpeg';

    if (typeof base64OrBlob === 'string') {
      if (!base64OrBlob.startsWith('data:')) {
        // Already a remote HTTP URL
        return { publicUrl: base64OrBlob };
      }

      const match = base64OrBlob.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      if (match) {
        contentType = match[1];
      }

      const base64Data = base64OrBlob.replace(/^data:[^;]+;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      fileBody = new Blob(byteArrays, { type: contentType });
    } else {
      fileBody = base64OrBlob;
    }

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBody, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`[StorageService] Upload error (${bucketName}/${filePath}):`, uploadError.message);
      return { error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { publicUrl: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error('[StorageService] Unexpected upload error:', err);
    return { error: err?.message || 'Upload failed' };
  }
}
