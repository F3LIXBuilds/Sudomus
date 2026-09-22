import 'dotenv/config';
import pool from './db.js';

async function runMigration() {
  try {
    console.log('Running KYC Supabase migration...');

    await pool.query(`
      ALTER TABLE kyc_documents
      ADD COLUMN IF NOT EXISTS storage_key TEXT,
      ADD COLUMN IF NOT EXISTS original_filename TEXT,
      ADD COLUMN IF NOT EXISTS mime_type TEXT,
      ADD COLUMN IF NOT EXISTS file_size INTEGER,
      ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) DEFAULT 'supabase',
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS reviewed_by UUID NULL,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
    `);

    console.log('✅ KYC Supabase migration successful');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
