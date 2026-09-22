/**
 * Formats grounded AI responses for SuDomus frontend
 */

export function formatProperties(properties = []) {
  if (!Array.isArray(properties)) return [];

  return properties.map(property => ({
    id: property.id,
    title: property.title || 'Property Listing',
    description: property.description || '',
    price: Number(property.price) || 0,
    currency: 'NGN',
    listingType: property.listing_type || property.listingType || null,
    propertyType: property.property_type || property.propertyType || null,
    bedrooms: property.bedrooms != null ? Number(property.bedrooms) : null,
    bathrooms: property.bathrooms != null ? Number(property.bathrooms) : null,
    toilets: property.toilets != null ? Number(property.toilets) : null,
    location: property.address || property.city || property.state || 'Nigeria',
    city: property.city || null,
    state: property.state || null,
    image: property.image_url || property.image || null,
    verified: Boolean(property.verified || property.verification_status === 'verified'),
  }));
}

export function buildChatResponse({
  success = true,
  message,
  intent = 'UNKNOWN',
  filters = {},
  properties = [],
  conversationId,
  isPrototypeData = false,
}) {
  return {
    success,
    message: message || '',
    intent,
    filters,
    properties: formatProperties(properties),
    isPrototypeData,
    conversationId,
  };
}
