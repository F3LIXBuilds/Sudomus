import pool from '../../../db.js';

/**
 * Gets aggregate statistics for published listings (e.g. min, max, avg price, count)
 */
export async function getPropertyStats({ location, propertyType, listingType } = {}) {
  const conditions = ["status = 'published'"];
  const values = [];

  if (location) {
    values.push(`%${location}%`);
    conditions.push(`(address ILIKE $${values.length} OR city ILIKE $${values.length} OR state ILIKE $${values.length})`);
  }

  if (propertyType) {
    values.push(propertyType);
    conditions.push(`LOWER(property_type) = LOWER($${values.length})`);
  }

  if (listingType) {
    values.push(listingType);
    conditions.push(`LOWER(listing_type) = LOWER($${values.length})`);
  }

  const query = `
    SELECT 
      COUNT(*)::int AS total_listings,
      MIN(price)::numeric AS min_price,
      MAX(price)::numeric AS max_price,
      AVG(price)::numeric AS avg_price,
      AVG(bedrooms)::numeric AS avg_bedrooms
    FROM listings
    WHERE ${conditions.join(' AND ')}
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || { total_listings: 0, min_price: null, max_price: null, avg_price: null, avg_bedrooms: null };
  } catch (error) {
    console.error('❌ Error getting property stats:', error);
    return { total_listings: 0, min_price: null, max_price: null, avg_price: null, avg_bedrooms: null };
  }
}
