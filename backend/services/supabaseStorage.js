import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase URL or Service Role Key is missing. KYC storage will not work correctly.');
}

const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_SERVICE_ROLE_KEY || 'placeholder');

const BUCKET_NAME = 'kyc-documents';

/**
 * Uploads a document buffer to Supabase storage.
 * @param {Buffer} buffer The file buffer to upload
 * @param {string} storagePath The destination path in the bucket
 * @param {string} contentType The MIME type of the file
 * @returns {Promise<Object>} The data returned from Supabase
 */
export async function uploadKycDocument(buffer, storagePath, contentType) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: contentType,
      upsert: false,
    });

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Creates a signed URL for temporary access to a KYC document.
 * @param {string} storagePath The path of the file in the bucket
 * @param {number} expiresIn Expiration time in seconds (default: 300)
 * @returns {Promise<string>} The signed URL
 */
export async function createKycSignedUrl(storagePath, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }
  return data.signedUrl;
}

/**
 * Deletes a document from Supabase storage.
 * @param {string} storagePath The path of the file to delete
 * @returns {Promise<void>}
 */
export async function deleteKycDocument(storagePath) {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw error;
  }
}
