import { processChatMessage } from './ai/orchestrator.js';

/**
 * Public service handler for SuDomus AI Chat
 * Compatible with /api/ai/chat route
 */
export async function handleChatMessage({ message, conversationId, user }) {
  try {
    return await processChatMessage({ message, conversationId, user });
  } catch (error) {
    console.error('❌ Error in SuDomus AI Service:', error);
    return {
      success: true,
      message: 'I am SuDomus AI. I encountered an issue processing your request, but I can help you search properties if you specify location and budget.',
      intent: 'UNKNOWN',
      filters: {},
      properties: [],
      isPrototypeData: false,
      conversationId: conversationId || null,
    };
  }
}