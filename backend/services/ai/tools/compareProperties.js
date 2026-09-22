import pool from '../../../db.js';

/**
 * Fetches multiple published properties by ID for side-by-side comparison
 */
export async function compareProperties(propertyIds = []) {
  if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
    return [];
  }

  const validIds = propertyIds.filter(id => typeof id === 'string' && id.trim().length > 0);
  if (validIds.length === 0) return [];

  const placeholders = validIds.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    SELECT 
      l.id,
      l.title,
      l.description,
      l.price,
      l.property_type,
      l.listing_type,
      l.bedrooms,
      l.bathrooms,
      l.toilets,
      l.parking_spaces,
      l.land_size,
      l.address,
      l.city,
      l.state,
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
      ) AS image_url
    FROM listings l
    WHERE l.id IN (${placeholders}) AND l.status = 'published'
  `;

  try {
    const result = await pool.query(query, validIds);
    return result.rows;
  } catch (error) {
    console.error('❌ Error comparing properties:', error);
    return [];
  }
}
