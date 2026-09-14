import { Router } from 'express';
import { handleChatMessage } from '../services/aiService.js';

const router = Router();

const MAX_MESSAGE_LENGTH = 1000;

router.post('/chat', async (req, res) => {
  const { message, conversationId } = req.body ?? {};

  if (
    typeof message !== 'string' ||
    message.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Message is required.',
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
    });
  }

  if (
    conversationId !== undefined &&
    typeof conversationId !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid conversationId.',
    });
  }

  try {
    const result = await handleChatMessage({
      message: message.trim(),
      conversationId,
    });

    return res.json(result);
  } catch (error) {
    console.error('❌ AI route error:', error);

    return res.status(500).json({
      success: false,
      message: 'SuDomus AI is temporarily unavailable.',
    });
  }
});

export default router;