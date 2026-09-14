import { randomUUID } from 'crypto';
import gemini from './openaiClient.js';
import { searchProperties } from './propertySearchService.js';

const conversations = new Map();

const SYSTEM_PROMPT = `
You are SuDomus AI, the real-estate assistant for SuDomus,
a Nigerian real-estate marketplace.

SuDomus currently focuses primarily on Lagos, Rivers State, and Imo State.

Your responsibilities:
- Help users find properties.
- Help users understand buying and renting.
- Answer general Nigerian real-estate questions.
- Help users compare properties when property data is provided.
- Understand Nigerian locations and Naira prices.

IMPORTANT RULES:
- Never invent a property.
- Never invent a price, address, bedroom count, or availability.
- Property searches are performed against the SuDomus database.
- Prices are in Nigerian Naira unless the user says otherwise.
- If a user wants properties, extract the relevant search filters.
- Keep responses concise and natural.

Return ONLY valid JSON.

Use exactly this structure:

{
  "intent": "PROPERTY_SEARCH | PROPERTY_DETAILS | PROPERTY_COMPARISON | LOCATION_QUESTION | RENTAL_QUESTION | BUYING_QUESTION | GENERAL_REAL_ESTATE | GREETING | UNKNOWN",
  "location": null,
  "city": null,
  "state": null,
  "propertyType": null,
  "bedrooms": null,
  "bathrooms": null,
  "minPrice": null,
  "maxPrice": null,
  "listingType": null,
  "clarifyingNeeded": false,
  "reply": "Your response"
}

Allowed property types:
- apartment
- house
- land
- commercial

Allowed listing types:
- sale
- rent

Normalize common terms:
- flat/apartment -> apartment
- duplex/home/house -> house
- plot/land -> land
- office/shop/warehouse/commercial -> commercial

Normalize listing type:
- buy/buying/purchase/for sale -> sale
- rent/rental/lease/to let -> rent

Normalize Nigerian prices:
- ₦50m -> 50000000
- 50 million -> 50000000
- ₦500k -> 500000
- 500 thousand -> 500000

For bedrooms:
- "3 bedroom" -> 3
- "at least 3 bedrooms" -> 3
- "3+ bedrooms" -> 3

If the user provides enough information to search, do not unnecessarily ask questions.

IMPORTANT LISTING TYPE RULE:

Only set listingType to "sale" when the user explicitly indicates that they want to buy or purchase a property, or explicitly says "for sale".

Only set listingType to "rent" when the user explicitly says rent, renting, rental, lease, or for rent.

If the user does not specify whether they want to buy or rent, listingType MUST be an empty string "".

NEVER assume that a property search is for sale.

Examples:

User: "Find me a 3 bedroom apartment in Lekki under 50 million"
listingType: ""

User: "Find me a 3 bedroom apartment for sale in Lekki"
listingType: "sale"

User: "I want to buy a 3 bedroom apartment in Lekki"
listingType: "sale"

User: "Find me a 3 bedroom apartment for rent in Lekki"
listingType: "rent"

User: "I need a place to rent in Lekki"
listingType: "rent"
IMPORTANT LOCATION RULE:

For Nigerian real estate searches, treat neighborhoods, districts, estates, towns, and areas as the user's location.

Examples:
- Lekki → location: "Lekki"
- Ikoyi → location: "Ikoyi"
- Victoria Island → location: "Victoria Island"
- GRA → location: "GRA"
- Port Harcourt → location: "Port Harcourt"

Do not require the location to be a database city.

If the user says "in Lekki", use:
location: "Lekki"

Do not use:
city: "Lekki"

unless you are certain Lekki is actually the city value being requested.
`;

function normalizeFilters(parsed) {
  const filters = {
    location: parsed.location || null,
    city: parsed.city || null,
    state: parsed.state || null,
    propertyType: parsed.propertyType || null,
    listingType: parsed.listingType || null,
    bedrooms: parsed.bedrooms ?? null,
    bathrooms: parsed.bathrooms ?? null,
    minPrice: parsed.minPrice ?? null,
    maxPrice: parsed.maxPrice ?? null,
  };

  if (filters.propertyType) {
    const type = String(filters.propertyType).toLowerCase();

    if (type.includes('flat') || type.includes('apartment')) {
      filters.propertyType = 'apartment';
    } else if (
      type.includes('duplex') ||
      type.includes('house') ||
      type.includes('home')
    ) {
      filters.propertyType = 'house';
    } else if (
      type.includes('land') ||
      type.includes('plot')
    ) {
      filters.propertyType = 'land';
    } else if (
      type.includes('office') ||
      type.includes('shop') ||
      type.includes('warehouse') ||
      type.includes('commercial')
    ) {
      filters.propertyType = 'commercial';
    }
  }

  if (filters.listingType) {
    const type = String(filters.listingType).toLowerCase();

    if (
      type.includes('rent') ||
      type.includes('lease') ||
      type.includes('rental')
    ) {
      filters.listingType = 'rent';
    } else if (
      type.includes('sale') ||
      type.includes('buy') ||
      type.includes('purchase')
    ) {
      filters.listingType = 'sale';
    }
  }

  if (filters.bedrooms !== null) {
    filters.bedrooms = Number(filters.bedrooms);

    if (Number.isNaN(filters.bedrooms)) {
      filters.bedrooms = null;
    }
  }

  if (filters.bathrooms !== null) {
    filters.bathrooms = Number(filters.bathrooms);

    if (Number.isNaN(filters.bathrooms)) {
      filters.bathrooms = null;
    }
  }

  if (filters.minPrice !== null) {
    filters.minPrice = Number(filters.minPrice);

    if (Number.isNaN(filters.minPrice)) {
      filters.minPrice = null;
    }
  }

  if (filters.maxPrice !== null) {
    filters.maxPrice = Number(filters.maxPrice);

    if (Number.isNaN(filters.maxPrice)) {
      filters.maxPrice = null;
    }
  }

  return filters;
}

function hasSearchFilters(filters) {
  return Object.values(filters).some(
    value =>
      value !== null &&
      value !== undefined &&
      value !== ''
  );
}

function fallbackResponse(message) {
  const lower = message.toLowerCase();

  if (
    lower.includes('hello') ||
    lower.includes('hi') ||
    lower.includes('hey')
  ) {
    return {
      intent: 'GREETING',
      reply:
        'Hi! I’m SuDomus AI. I can help you find properties, compare listings, or answer questions about buying and renting in Nigeria.',
    };
  }

  if (
    lower.includes('rent') ||
    lower.includes('rental') ||
    lower.includes('to let')
  ) {
    return {
      intent: 'RENTAL_QUESTION',
      reply:
        'I can help you find rental properties. Tell me your preferred location, property type, bedrooms, and budget.',
    };
  }

  if (
    lower.includes('buy') ||
    lower.includes('purchase') ||
    lower.includes('for sale')
  ) {
    return {
      intent: 'BUYING_QUESTION',
      reply:
        'I can help you find properties for sale. Tell me your preferred location, property type, bedrooms, and budget.',
    };
  }

  return {
    intent: 'GENERAL_REAL_ESTATE',
    reply:
      'I can help with Nigerian real estate, property searches, buying, renting, and comparing listings. What are you looking for?',
  };
}

function formatProperties(properties) {
  return properties.map(property => ({
    id: property.id,
    title: property.title,
    description: property.description,
    price: property.price,
    currency: 'NGN',
    listingType: property.listing_type,
    propertyType: property.property_type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    toilets: property.toilets,
    location:
      property.address ||
      property.city ||
      property.state ||
      'Nigeria',
    city: property.city,
    state: property.state,
    image: property.image_url || null,

    // Do not claim a property is verified
    // until the real verification system exists.
    verified: false,
  }));
}

export async function handleChatMessage({
  message,
  conversationId,
}) {
  const existingConversation =
    conversationId
      ? conversations.get(conversationId)
      : null;

  const id =
    conversationId || randomUUID();

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not configured'
      );
    }

    const interactionOptions = {
  model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',

  input: message,

  system_instruction: SYSTEM_PROMPT,

  generation_config: {
    temperature: 0.2,
  },

  response_format: {
    type: 'text',
    mime_type: 'application/json',
    schema: {
      type: 'object',
      properties: {
        intent: { type: 'string' },
        location: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        propertyType: { type: 'string' },
        bedrooms: { type: 'integer' },
        bathrooms: { type: 'integer' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
        listingType: { type: 'string' },
        clarifyingNeeded: { type: 'boolean' },
        reply: { type: 'string' }
      },
      required: [
        'intent',
        'location',
        'city',
        'state',
        'propertyType',
        'bedrooms',
        'bathrooms',
        'minPrice',
        'maxPrice',
        'listingType',
        'clarifyingNeeded',
        'reply'
      ]
    }
  }
};

    if (existingConversation?.interactionId) {
      interactionOptions.previous_interaction_id =
        existingConversation.interactionId;
    }

    const interaction =
      await gemini.interactions.create(
        interactionOptions
      );
      console.log(' Gemini interaction status:', interaction.status);
console.log(' Gemini interaction ID:', interaction.id);
console.log(' Gemini output:', interaction.output_text);
console.log(
  ' Gemini raw outputs:',
  JSON.stringify(interaction.outputs, null, 2)
);

    const content =
  interaction.output_text ||
  interaction.outputs
    ?.filter(output => output.type === 'text')
    ?.map(output => output.text)
    ?.join('') ||
  '';

    if (!content.trim()) {
  console.error('❌ Gemini returned no text output.');

  return {
    conversationId,
    reply: 'I received your request, but I could not generate a response. Please try again.',
    properties: [],
  };
}

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error(
        '❌ Gemini returned invalid JSON:',
        content
      );

      throw new Error(
        'Gemini returned invalid JSON'
      );
    }

    const filters =
      normalizeFilters(parsed);

      console.log(' Normalized AI filters:', filters);

    let properties = [];

    if (
      parsed.intent === 'PROPERTY_SEARCH' ||
      hasSearchFilters(filters)
    ) {
      properties =
        await searchProperties(filters);
    }
    console.log(' Properties found:', properties);
console.log(' Number of properties:', properties.length);

    let reply =
      parsed.reply ||
      '';

    if (
      parsed.intent === 'PROPERTY_SEARCH' ||
      hasSearchFilters(filters)
    ) {
      if (properties.length === 0) {
        reply =
          'I couldn’t find a published property matching those requirements. Try adjusting the location, property type, or budget.';
      } else {
        reply =
          parsed.reply ||
          `I found ${properties.length} matching ${
            properties.length === 1
              ? 'property'
              : 'properties'
          } for you.`;
      }
    }

    conversations.set(id, {
      interactionId: interaction.id,
    });

    return {
      success: true,
      message: reply,
      intent:
        parsed.intent || 'UNKNOWN',
      filters,
      properties:
        formatProperties(properties),
      isPrototypeData: false,
      conversationId: id,
    };
  } catch (error) {
    console.error(
      '⚠️ SuDomus AI Gemini error:',
      error.message
    );

    const fallback =
      fallbackResponse(message);

    return {
      success: true,
      message: fallback.reply,
      intent: fallback.intent,
      filters: {},
      properties: [],
      isPrototypeData: false,
      conversationId: id,
    };
  }
}