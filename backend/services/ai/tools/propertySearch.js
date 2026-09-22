import { searchProperties as executeSearch } from '../../propertySearchService.js';

/**
 * Validates and executes property search using existing propertySearchService
 */
export async function searchProperties(filters = {}) {
  const sanitized = {
    location: typeof filters.location === 'string' ? filters.location.trim() : null,
    city: typeof filters.city === 'string' ? filters.city.trim() : null,
    state: typeof filters.state === 'string' ? filters.state.trim() : null,
    propertyType: typeof filters.propertyType === 'string' ? filters.propertyType.trim().toLowerCase() : null,
    listingType: typeof filters.listingType === 'string' ? filters.listingType.trim().toLowerCase() : null,
    bedrooms: Number.isFinite(Number(filters.bedrooms)) && Number(filters.bedrooms) > 0 ? Number(filters.bedrooms) : null,
    bathrooms: Number.isFinite(Number(filters.bathrooms)) && Number(filters.bathrooms) > 0 ? Number(filters.bathrooms) : null,
    minPrice: Number.isFinite(Number(filters.minPrice)) && Number(filters.minPrice) > 0 ? Number(filters.minPrice) : null,
    maxPrice: Number.isFinite(Number(filters.maxPrice)) && Number(filters.maxPrice) > 0 ? Number(filters.maxPrice) : null,
  };

  // Ensure propertyType is one of allowed values if set
  const allowedTypes = ['apartment', 'house', 'land', 'commercial'];
  if (sanitized.propertyType && !allowedTypes.includes(sanitized.propertyType)) {
    if (sanitized.propertyType.includes('flat')) sanitized.propertyType = 'apartment';
    else if (sanitized.propertyType.includes('duplex') || sanitized.propertyType.includes('home')) sanitized.propertyType = 'house';
    else if (sanitized.propertyType.includes('plot')) sanitized.propertyType = 'land';
    else if (sanitized.propertyType.includes('office') || sanitized.propertyType.includes('shop')) sanitized.propertyType = 'commercial';
    else sanitized.propertyType = null;
  }

  // Ensure listingType is valid
  if (sanitized.listingType && !['sale', 'rent'].includes(sanitized.listingType)) {
    if (sanitized.listingType.includes('rent') || sanitized.listingType.includes('lease')) sanitized.listingType = 'rent';
    else if (sanitized.listingType.includes('sale') || sanitized.listingType.includes('buy')) sanitized.listingType = 'sale';
    else sanitized.listingType = null;
  }

  return await executeSearch(sanitized);
}
