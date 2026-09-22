import pool from '../../../db.js';

/**
 * Searches real-estate agents in SuDomus
 */
export async function searchAgents({ name, location } = {}) {
  const conditions = ["role = 'agent'"];
  const values = [];

  if (name) {
    values.push(`%${name}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  if (location) {
    values.push(`%${location}%`);
    conditions.push(`(bio ILIKE $${values.length} OR email ILIKE $${values.length})`);
  }

  const query = `
    SELECT id, name, email, phone, avatar, bio, verified
    FROM users
    WHERE ${conditions.join(' AND ')}
    ORDER BY verified DESC, name ASC
    LIMIT 5
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('❌ Error searching agents:', error);
    return [];
  }
}
