import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `
You are SuDomus AI, the real-estate assistant for SuDomus, a Nigerian real-estate marketplace.

Your responsibilities:
- Help users find properties in Nigeria (Lagos, Port Harcourt, Abuja, Owerri, etc.).
- Help users understand buying, renting, and real-estate processes in Nigeria.
- Answer general Nigerian real-estate questions concisely and accurately.
- Assist in comparing properties when database property information is provided.

IMPORTANT SECURITY AND ACCURACY RULES:
- Never fabricate properties, prices, addresses, bedroom counts, or availability.
- Always distinguish database listing facts from general real estate advice.
- Never execute SQL queries directly or output SQL code.
- Prices are in Nigerian Naira (NGN) unless specified otherwise.
- Keep responses friendly, concise, and structured.
`;

let anthropicClient = null;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Extracts intent and search parameters from user message using Claude
 */
export async function claudeExtractIntent({ message, history = [] }) {
  const client = getClient();
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  const prompt = `
Extract structured intent and search parameters from the following user real estate query.

User message: "${message}"

Return ONLY valid JSON matching this schema:
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
  "missingInformation": []
}

Allowed propertyType: "apartment", "house", "land", "commercial", or null.
Allowed listingType: "sale", "rent", or null.

Rules for listingType:
- Set "sale" ONLY if the user explicitly wants to buy, purchase, or says "for sale".
- Set "rent" ONLY if the user explicitly says rent, rental, lease, or to let.
- Otherwise, set listingType to null.

Rules for Nigerian Prices:
- ₦15m / 15 million -> 15000000
- ₦500k / 500 thousand -> 500000
`;

  const response = await client.messages.create({
    model,
    max_tokens: 500,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      ...history.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: prompt }
    ],
  });

  const text = response.content[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generates natural language grounded response using Claude
 */
export async function claudeGenerateResponse({ message, intent, properties = [], history = [] }) {
  const client = getClient();
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  const contextData = properties.length > 0
    ? `Database properties found (${properties.length}):\n` + JSON.stringify(properties.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        bedrooms: p.bedrooms,
        location: p.address || p.city || p.state,
        listingType: p.listing_type,
        propertyType: p.property_type
      })), null, 2)
    : 'No matching database properties were found.';

  const prompt = `
User question: "${message}"
Detected intent: ${intent}
Context from SuDomus database:
${contextData}

Generate a concise, natural, friendly reply for the user based strictly on the ground truth provided above.
If zero properties were found for a property search, explain politely without inventing any listing.
`;

  const response = await client.messages.create({
    model,
    max_tokens: 600,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [
      ...history.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: prompt }
    ],
  });

  return response.content[0]?.text || 'I retrieved the information for you.';
}
