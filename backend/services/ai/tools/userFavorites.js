import pool from '../../../db.js';

/**
 * Gets user favorited properties
 */
export async function getUserFavorites(userId) {
  if (!userId) return [];

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
      ) AS image_url
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    WHERE f.user_id = $1 AND l.status = 'published'
    ORDER BY f.created_at DESC
    LIMIT 10
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting user favorites:', error);
    return [];
  }
}
