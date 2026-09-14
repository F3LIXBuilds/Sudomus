import pool from '../db.js';

export const searchProperties = async (filters = {}) => {
  const {
    location,
    city,
    state,
    propertyType,
    listingType,
    bedrooms,
    bathrooms,
    minPrice,
    maxPrice,
  } = filters;

  const conditions = [`l.status = 'published'`];
  const values = [];

  const addCondition = (condition, value) => {
    values.push(value);
    conditions.push(condition.replace('?', `$${values.length}`));
  };

  // Location is treated as a broad search across address, city and state.
  if (location) {
    addCondition(
      `
      (
        l.address ILIKE ?
        OR l.city ILIKE ?
        OR l.state ILIKE ?
      )
      `,
      `%${location}%`
    );

    // The above condition only creates one placeholder,
    // so we need to handle the three-column search separately.
    conditions.pop();
    values.pop();

    const placeholder = `$${values.length + 1}`;
    values.push(`%${location}%`);

    conditions.push(`
      (
        l.address ILIKE ${placeholder}
        OR l.city ILIKE ${placeholder}
        OR l.state ILIKE ${placeholder}
      )
    `);
  }

  /*
   * Only use city as a separate filter when we don't already
   * have a location search that covers it.
   */
  if (city && !location) {
    addCondition('l.city ILIKE ?', `%${city}%`);
  }

  /*
   * Only use state separately when there is no broad location.
   */
  if (state && !location) {
    addCondition('l.state ILIKE ?', `%${state}%`);
  }

  if (propertyType) {
    addCondition(
      'LOWER(l.property_type) = LOWER(?)',
      propertyType
    );
  }

  if (listingType) {
    addCondition(
      'LOWER(l.listing_type) = LOWER(?)',
      listingType
    );
  }

  // Only apply bedroom filtering when actually requested.
  if (
    bedrooms !== undefined &&
    bedrooms !== null &&
    Number(bedrooms) > 0
  ) {
    addCondition(
      'l.bedrooms >= ?',
      Number(bedrooms)
    );
  }

  // Only apply bathroom filtering when actually requested.
  if (
    bathrooms !== undefined &&
    bathrooms !== null &&
    Number(bathrooms) > 0
  ) {
    addCondition(
      'l.bathrooms >= ?',
      Number(bathrooms)
    );
  }

  if (
    minPrice !== undefined &&
    minPrice !== null &&
    Number(minPrice) > 0
  ) {
    addCondition(
      'l.price >= ?',
      Number(minPrice)
    );
  }

  if (
    maxPrice !== undefined &&
    maxPrice !== null &&
    Number(maxPrice) > 0
  ) {
    addCondition(
      'l.price <= ?',
      Number(maxPrice)
    );
  }

  const query = `
    SELECT
      l.*,

      COALESCE(
        (
          SELECT image_url
          FROM listing_images
          WHERE listing_id = l.id
            AND is_cover = true
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

    WHERE ${conditions.join(' AND ')}

    ORDER BY l.created_at DESC

    LIMIT 10
  `;

  console.log('🔎 Property search SQL:', query);
  console.log('🔎 Property search values:', values);

  const result = await pool.query(query, values);

  console.log(
    `🏠 Database returned ${result.rows.length} properties`
  );

  return result.rows;
};