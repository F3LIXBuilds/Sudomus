import { randomUUID } from 'crypto';

class MemoryStore {
  constructor() {
    this.conversations = new Map();
  }

  /**
   * Retrieves or initializes a conversation session
   */
  getOrCreate(conversationId) {
    const id = conversationId || randomUUID();

    if (!this.conversations.has(id)) {
      this.conversations.set(id, {
        id,
        messages: [],
        lastFilters: {
          location: null,
          city: null,
          state: null,
          propertyType: null,
          bedrooms: null,
          bathrooms: null,
          minPrice: null,
          maxPrice: null,
          listingType: null,
        },
        lastProperties: [],
        updatedAt: Date.now(),
      });
    }

    const session = this.conversations.get(id);
    session.updatedAt = Date.now();
    return session;
  }

  /**
   * Merges newly extracted intent filters with the existing conversation filter state
   */
  mergeFilters(conversationId, newFilters = {}) {
    const session = this.getOrCreate(conversationId);
    const prev = session.lastFilters;

    const merged = {
      location: newFilters.location ?? prev.location,
      city: newFilters.city ?? prev.city,
      state: newFilters.state ?? prev.state,
      propertyType: newFilters.propertyType ?? prev.propertyType,
      bedrooms: newFilters.bedrooms ?? prev.bedrooms,
      bathrooms: newFilters.bathrooms ?? prev.bathrooms,
      minPrice: newFilters.minPrice ?? prev.minPrice,
      maxPrice: newFilters.maxPrice ?? prev.maxPrice,
      listingType: newFilters.listingType ?? prev.listingType,
    };

    session.lastFilters = merged;
    return merged;
  }

  /**
   * Stores current property list for reference in follow-ups (e.g. "compare the first two", "tell me more about the first one")
   */
  setProperties(conversationId, properties = []) {
    const session = this.getOrCreate(conversationId);
    session.lastProperties = properties;
  }

  /**
   * Adds message turn to history
   */
  addMessage(conversationId, role, content) {
    const session = this.getOrCreate(conversationId);
    session.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    // Keep last 10 turns to avoid context overflow
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }
  }

  /**
   * Clears old sessions (older than 2 hours)
   */
  cleanOldSessions() {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, session] of this.conversations.entries()) {
      if (session.updatedAt < twoHoursAgo) {
        this.conversations.delete(id);
      }
    }
  }
}

export const memory = new MemoryStore();

// Periodically clean stale conversations
setInterval(() => memory.cleanOldSessions(), 30 * 60 * 1000);
