import pool from './db.js';
import 'dotenv/config';

async function migrate() {
  console.log('Starting migration for email verification...');
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
      ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP;
    `);
    
    // Set existing users to verified so they don't get locked out
    const res = await pool.query(`
      UPDATE users 
      SET email_verified = TRUE 
      WHERE email_verified IS FALSE AND verification_token_hash IS NULL;
    `);
    console.log(`Updated ${res.rowCount} existing users to verified.`);

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
