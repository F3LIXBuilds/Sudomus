import pool from '../../../db.js';

/**
 * Fetches details for a single published property by ID
 */
export async function getPropertyDetails(propertyId) {
  if (!propertyId || typeof propertyId !== 'string') {
    return null;
  }

  const query = `
    SELECT 
      l.*,
      COALESCE(
        (
          SELECT image_url 
          FROM listing_images 
          WHERE listing_id = l.id AND is_cover = true 
          LIMIT 1
        ),
        (
          SELECT image_url 
          FROM listing_images 
          WHERE listing_id = l.id 
          ORDER BY created_at ASC 
          LIMIT 1
        )
      ) AS image_url,
      COALESCE(
        (
          SELECT json_agg(feature) 
          FROM listing_features 
          WHERE listing_id = l.id
        ),
        '[]'::json
      ) AS features
    FROM listings l
    WHERE l.id = $1 AND l.status = 'published'
  `;

  try {
    const result = await pool.query(query, [propertyId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error fetching property details:', error);
    return null;
  }
}
