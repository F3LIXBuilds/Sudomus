import { aiService } from '../services/api';

export class SuDomusApiError extends Error {}

export async function sendChatMessage(message, conversationId) {
  try {
    return await aiService.sendChatMessage(message, conversationId);
  } catch (err) {
    throw new SuDomusApiError(err.message || 'Something went wrong. Please try again.');
  }
}
