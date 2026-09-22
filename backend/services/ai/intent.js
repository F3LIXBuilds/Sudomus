/**
 * Intent parsing and parameter normalization for SuDomus AI
 */

const NIGERIAN_LOCATIONS = [
  'Lekki', 'Ikoyi', 'Victoria Island', 'VI', 'Ajah', 'Yaba', 'Ikeja',
  'Surulere', 'Gbagada', 'Port Harcourt', 'GRA', 'Owerri', 'Abuja',
  'Calabar', 'Asaba', 'Enugu', 'Ibadan', 'Sangotedo', 'Chevron',
  'Ikate', 'Epe', 'Ikorodu', 'Magodo', 'Maryland', 'Banana Island'
];

/**
 * Parses Nigerian Naira price expressions into numbers
 * Examples:
 * - ₦15m, 15 million, 15m -> 15000000
 * - ₦500k, 500k, 500 thousand -> 500000
 * - 2.5 billion -> 2500000000
 */
export function parseNairaPrice(text) {
  if (!text || typeof text !== 'string') return null;

  const str = text.toLowerCase().replace(/₦/g, '').replace(/naira/g, '').trim();

  // Pattern for billion (e.g. 2.5 billion, 2b)
  const billionMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:billion|b)/i);
  if (billionMatch) {
    return Math.round(parseFloat(billionMatch[1]) * 1000000000);
  }

  // Pattern for million (e.g. 15m, 15 million, 2.5m)
  const millionMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:million|m)/i);
  if (millionMatch) {
    return Math.round(parseFloat(millionMatch[1]) * 1000000);
  }

  // Pattern for thousand (e.g. 500k, 500 thousand)
  const thousandMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k)/i);
  if (thousandMatch) {
    return Math.round(parseFloat(thousandMatch[1]) * 1000);
  }

  // Plain numbers with commas or standalone
  const plainMatch = str.match(/(?:under|around|budget|below|max|about|cost|price|of)?\s*(\d{1,3}(?:,\d{3})+|\d+)/i);
  if (plainMatch) {
    const val = parseInt(plainMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(val) && val > 1000) return val;
  }

  return null;
}

/**
 * Normalizes user intent and extracts property search fields deterministically
 */
export function parseIntentFromText(text) {
  if (!text || typeof text !== 'string') {
    return {
      intent: 'UNKNOWN',
      location: null,
      city: null,
      state: null,
      propertyType: null,
      bedrooms: null,
      bathrooms: null,
      minPrice: null,
      maxPrice: null,
      listingType: null,
      clarifyingNeeded: false,
      missingInformation: [],
    };
  }

  const lower = text.toLowerCase();

  // 1. Detect Greeting
  if (/^(hi|hello|hey|good day|greetings|howdy|sup)\b/i.test(lower.trim())) {
    return {
      intent: 'GREETING',
      location: null,
      city: null,
      state: null,
      propertyType: null,
      bedrooms: null,
      bathrooms: null,
      minPrice: null,
      maxPrice: null,
      listingType: null,
      clarifyingNeeded: false,
      missingInformation: [],
    };
  }

  // 2. Listing Type extraction
  let listingType = null;
  if (/\b(rent|renting|rental|rentals|lease|to let)\b/i.test(lower)) {
    listingType = 'rent';
  } else if (/\b(buy|buying|purchase|for sale|sale|purchasing)\b/i.test(lower)) {
    listingType = 'sale';
  }

  // 3. Property Type extraction
  let propertyType = null;
  if (/\b(flat|flats|apartment|apartments)\b/i.test(lower)) {
    propertyType = 'apartment';
  } else if (/\b(duplex|house|houses|home|homes|villa|townhouse|bungalow)\b/i.test(lower)) {
    propertyType = 'house';
  } else if (/\b(land|plot|plots)\b/i.test(lower)) {
    propertyType = 'land';
  } else if (/\b(commercial|office|shop|warehouse)\b/i.test(lower)) {
    propertyType = 'commercial';
  }

  // 4. Bedroom extraction
  let bedrooms = null;
  const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom|bedrooms|bdrm|br)\b/i);
  if (bedMatch) {
    bedrooms = parseInt(bedMatch[1], 10);
  }

  // 5. Bathroom extraction
  let bathrooms = null;
  const bathMatch = lower.match(/(\d+)\s*(?:bath|bathroom|bathrooms|bth)\b/i);
  if (bathMatch) {
    bathrooms = parseInt(bathMatch[1], 10);
  }

  // 6. Location extraction
  let location = null;
  for (const loc of NIGERIAN_LOCATIONS) {
    const regex = new RegExp(`\\b${loc}\\b`, 'i');
    if (regex.test(text)) {
      location = loc;
      break;
    }
  }

  if (!location) {
    const locMatch = text.match(/\b(?:in|at|around|near|within)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (locMatch) {
      location = locMatch[1];
    }
  }

  // 7. Price extraction
  const extractedPrice = parseNairaPrice(text);
  let maxPrice = null;
  let minPrice = null;
  if (extractedPrice) {
    if (/\b(above|min|minimum|from|at least)\b/i.test(lower)) {
      minPrice = extractedPrice;
    } else {
      maxPrice = extractedPrice;
    }
  }

  // Determine intent category
  let intent = 'PROPERTY_SEARCH';

  if (/\b(afford|affordability|earn|earning|salary|income|upfront cost|move in cost)\b/i.test(lower)) {
    intent = 'AFFORDABILITY_CALCULATION';
  } else if (/\b(compare|cheaper|difference|versus|vs)\b/i.test(lower)) {
    intent = 'PROPERTY_COMPARISON';
  } else if (/\b(tell me more|details|about the first|first one|second one|this property)\b/i.test(lower)) {
    intent = 'PROPERTY_DETAILS';
  } else if (/\b(documents|check before renting|landlord|agreement|title|c of o|governor|deed)\b/i.test(lower)) {
    intent = 'GENERAL_REAL_ESTATE';
  } else if (!location && !bedrooms && !propertyType && !maxPrice && !listingType) {
    if (/\b(rent|rental)\b/i.test(lower)) intent = 'RENTAL_QUESTION';
    else if (/\b(buy|buying|purchase)\b/i.test(lower)) intent = 'BUYING_QUESTION';
    else intent = 'GENERAL_REAL_ESTATE';
  }

  return {
    intent,
    location,
    city: null,
    state: null,
    propertyType,
    bedrooms,
    bathrooms,
    minPrice,
    maxPrice,
    listingType,
    clarifyingNeeded: false,
    missingInformation: [],
  };
}

/**
 * Standardizes raw model or parsed intent response
 */
export function normalizeIntent(parsed = {}) {
  const intentTypes = [
    'PROPERTY_SEARCH', 'PROPERTY_DETAILS', 'PROPERTY_COMPARISON',
    'LOCATION_QUESTION', 'RENTAL_QUESTION', 'BUYING_QUESTION',
    'GENERAL_REAL_ESTATE', 'GREETING', 'AFFORDABILITY_CALCULATION', 'UNKNOWN'
  ];

  const intent = intentTypes.includes(parsed.intent) ? parsed.intent : 'PROPERTY_SEARCH';

  let location = typeof parsed.location === 'string' && parsed.location.trim() ? parsed.location.trim() : null;
  let city = typeof parsed.city === 'string' && parsed.city.trim() ? parsed.city.trim() : null;
  let state = typeof parsed.state === 'string' && parsed.state.trim() ? parsed.state.trim() : null;

  let propertyType = parsed.propertyType || null;
  if (propertyType) {
    const pt = String(propertyType).toLowerCase();
    if (pt.includes('flat') || pt.includes('apartment')) propertyType = 'apartment';
    else if (pt.includes('duplex') || pt.includes('house') || pt.includes('home')) propertyType = 'house';
    else if (pt.includes('land') || pt.includes('plot')) propertyType = 'land';
    else if (pt.includes('commercial') || pt.includes('office') || pt.includes('shop')) propertyType = 'commercial';
    else propertyType = null;
  }

  let listingType = parsed.listingType || null;
  if (listingType) {
    const lt = String(listingType).toLowerCase();
    if (lt.includes('rent') || lt.includes('lease') || lt.includes('rental')) listingType = 'rent';
    else if (lt.includes('sale') || lt.includes('buy') || lt.includes('purchase')) listingType = 'sale';
    else listingType = null;
  }

  const bedrooms = Number.isFinite(Number(parsed.bedrooms)) && Number(parsed.bedrooms) > 0 ? Number(parsed.bedrooms) : null;
  const bathrooms = Number.isFinite(Number(parsed.bathrooms)) && Number(parsed.bathrooms) > 0 ? Number(parsed.bathrooms) : null;
  const minPrice = Number.isFinite(Number(parsed.minPrice)) && Number(parsed.minPrice) > 0 ? Number(parsed.minPrice) : null;
  const maxPrice = Number.isFinite(Number(parsed.maxPrice)) && Number(parsed.maxPrice) > 0 ? Number(parsed.maxPrice) : null;

  return {
    intent,
    location,
    city,
    state,
    propertyType,
    bedrooms,
    bathrooms,
    minPrice,
    maxPrice,
    listingType,
    clarifyingNeeded: Boolean(parsed.clarifyingNeeded),
    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
  };
}
