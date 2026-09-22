import pool from '../../../db.js';

/**
 * Gets user recently viewed properties
 */
export async function getRecentlyViewed(userId) {
  if (!userId) return [];

  const query = `
    SELECT DISTINCT ON (l.id)
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
      v.viewed_at
    FROM listing_views v
    JOIN listings l ON v.listing_id = l.id
    WHERE v.user_id = $1 AND l.status = 'published'
    ORDER BY l.id, v.viewed_at DESC
    LIMIT 10
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting recently viewed properties:', error);
    return [];
  }
}
