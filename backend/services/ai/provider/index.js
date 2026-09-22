import { claudeExtractIntent, claudeGenerateResponse } from './claude.js';
import { parseIntentFromText, normalizeIntent } from '../intent.js';

/**
 * Generic AI Provider Abstraction Interface
 */

export async function extractIntent({ message, history = [] }) {
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const raw = await claudeExtractIntent({ message, history });
      return normalizeIntent(raw);
    }
  } catch (error) {
    console.warn('⚠️ Provider intent extraction failed, falling back to deterministic intent parser:', error.message);
  }

  // Deterministic rule-based fallback intent parser
  const parsed = parseIntentFromText(message);
  return normalizeIntent(parsed);
}

export async function generateResponse({ message, intent, properties = [], history = [] }) {
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      return await claudeGenerateResponse({ message, intent, properties, history });
    }
  } catch (error) {
    console.warn('⚠️ Provider response generation failed, falling back to deterministic response generator:', error.message);
  }

  // Deterministic grounded response fallback
  if (properties.length > 0) {
    return `I found ${properties.length} matching published ${properties.length === 1 ? 'property' : 'properties'} in the SuDomus marketplace.`;
  }

  if (intent === 'PROPERTY_SEARCH') {
    return 'I couldn’t find a published property matching those exact requirements. Try adjusting the location, property type, or budget.';
  }

  if (intent === 'GREETING') {
    return 'Hello! I am SuDomus AI. I can help you search properties, compare listings, or answer questions about buying and renting in Nigeria.';
  }

  return 'I am SuDomus AI, your real-estate assistant. Tell me what property or real estate question you have!';
}
