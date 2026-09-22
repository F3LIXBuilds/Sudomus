import { memory } from './memory.js';
import { extractIntent, generateResponse } from './provider/index.js';
import { searchProperties } from './tools/propertySearch.js';
import { getPropertyDetails } from './tools/propertyDetails.js';
import { compareProperties } from './tools/compareProperties.js';
import { searchAgents } from './tools/agentSearch.js';
import { getPropertyStats } from './tools/propertyStats.js';
import { getUserFavorites } from './tools/userFavorites.js';
import { getRecentlyViewed } from './tools/recentlyViewed.js';
import { calculateRentalAffordability, calculateBuyingAffordability } from './tools/affordabilityCalculator.js';
import { parseNairaPrice } from './intent.js';
import { buildChatResponse } from './response.js';

function isSimpleGreeting(text) {
  const clean = text.trim().toLowerCase();
  return ['hi', 'hello', 'hey', 'greetings', 'good day', 'good morning', 'good afternoon'].includes(clean);
}

function hasFilters(filters) {
  return Object.values(filters).some(v => v !== null && v !== undefined && v !== '');
}

export async function processChatMessage({ message, conversationId, user }) {
  const session = memory.getOrCreate(conversationId);
  const trimmed = message.trim();

  // Fast-path: simple greeting
  if (isSimpleGreeting(trimmed)) {
    const reply = 'Hi! I’m SuDomus AI. I can help you find properties, compare listings, calculate affordability, or answer questions about buying and renting in Nigeria.';
    memory.addMessage(session.id, 'user', trimmed);
    memory.addMessage(session.id, 'assistant', reply);

    return buildChatResponse({
      success: true,
      message: reply,
      intent: 'GREETING',
      filters: session.lastFilters,
      properties: [],
      conversationId: session.id,
    });
  }

  // 1. Extract Intent
  const extracted = await extractIntent({ message: trimmed, history: session.messages });

  // 2. Merge Filters with conversation memory
  let mergedFilters = session.lastFilters;
  if (extracted.intent === 'PROPERTY_SEARCH' || hasFilters(extracted)) {
    mergedFilters = memory.mergeFilters(session.id, extracted);
  }

  let properties = [];
  let toolData = null;
  let customReply = null;

  // 3. Tool Execution based on intent & filters
  try {
    if (extracted.intent === 'AFFORDABILITY_CALCULATION') {
      const parsedAmount = parseNairaPrice(trimmed);
      const isBuying = extracted.listingType === 'sale' || /\b(buy|purchase|buying)\b/i.test(trimmed);

      if (isBuying && parsedAmount) {
        const result = calculateBuyingAffordability({ totalCapital: parsedAmount });
        customReply = result.summary;
        mergedFilters.maxPrice = result.maxPropertyPrice;
      } else if (parsedAmount) {
        const isMonthly = /\b(monthly|per month|month|a month|pm)\b/i.test(trimmed);
        const result = calculateRentalAffordability(
          isMonthly 
            ? { monthlyIncome: parsedAmount } 
            : { totalBudget: parsedAmount }
        );
        customReply = result.summary;
        mergedFilters.maxPrice = result.maxBaseRent;
      } else {
        customReply = 'To calculate affordability, please provide your monthly income, annual income, or total upfront budget (e.g. "I earn 1.5 million monthly" or "I have 10m upfront budget").';
      }

      // Automatically search matching properties within calculated budget
      if (mergedFilters.maxPrice) {
        properties = await searchProperties({ ...mergedFilters, listingType: extracted.listingType || 'rent' });
        memory.setProperties(session.id, properties);
      }
    } else if (extracted.intent === 'PROPERTY_SEARCH' || hasFilters(mergedFilters)) {
      properties = await searchProperties(mergedFilters);
      memory.setProperties(session.id, properties);
    } else if (extracted.intent === 'PROPERTY_DETAILS') {
      const targetId = session.lastProperties[0]?.id;
      if (targetId) {
        toolData = await getPropertyDetails(targetId);
        if (toolData) properties = [toolData];
      }
    } else if (extracted.intent === 'PROPERTY_COMPARISON') {
      const ids = session.lastProperties.map(p => p.id).slice(0, 3);
      if (ids.length > 0) {
        properties = await compareProperties(ids);
      }
    } else if (trimmed.toLowerCase().includes('agent') || trimmed.toLowerCase().includes('realtor')) {
      toolData = await searchAgents({ location: mergedFilters.location });
    } else if (trimmed.toLowerCase().includes('favorite')) {
      properties = await getUserFavorites(user?.id);
    } else if (trimmed.toLowerCase().includes('recent') || trimmed.toLowerCase().includes('viewed')) {
      properties = await getRecentlyViewed(user?.id);
    }
  } catch (err) {
    console.error('❌ Error executing database tools in AI orchestrator:', err);
  }

  // 4. Grounded Response Generation
  let reply = customReply;
  if (!reply) {
    reply = await generateResponse({
      message: trimmed,
      intent: extracted.intent,
      properties,
      history: session.messages,
    });
  }

  // Customize reply if properties count is zero for property search
  if ((extracted.intent === 'PROPERTY_SEARCH' || hasFilters(mergedFilters)) && properties.length === 0 && !customReply) {
    reply = `I couldn’t find a published property matching those requirements. Try adjusting the location, property type, or budget.`;
  }

  // 5. Update Memory
  memory.addMessage(session.id, 'user', trimmed);
  memory.addMessage(session.id, 'assistant', reply);

  return buildChatResponse({
    success: true,
    message: reply,
    intent: extracted.intent,
    filters: mergedFilters,
    properties,
    conversationId: session.id,
  });
}
