import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

const isAdmin = (req) => req.user?.role === 'admin';

// GET /api/messages/conversations
router.get('/conversations', async (req, res) => {
  const userId = req.user.id;

  try {
    const where = isAdmin(req)
      ? ''
      : 'WHERE c.buyer_id = $1 OR c.agent_id = $1';

    const params = isAdmin(req) ? [] : [userId];

    const result = await pool.query(`
      SELECT
        c.id,
        c.buyer_id,
        c.agent_id,
        c.created_at,
        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        agent.name AS agent_name,
        agent.email AS agent_email,
        latest.message AS latest_message,
        latest.created_at AS latest_message_at,
        latest.sender_id AS latest_sender_id
      FROM conversations c
      JOIN users buyer ON buyer.id = c.buyer_id
      JOIN users agent ON agent.id = c.agent_id
      LEFT JOIN LATERAL (
        SELECT m.message, m.created_at, m.sender_id
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) latest ON true
      ${where}
      ORDER BY COALESCE(latest.created_at, c.created_at) DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
});

// GET /api/messages/conversations/:id
router.get('/conversations/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const conversationRes = await pool.query(`
      SELECT
        c.id,
        c.buyer_id,
        c.agent_id,
        c.created_at,
        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        agent.name AS agent_name,
        agent.email AS agent_email
      FROM conversations c
      JOIN users buyer ON buyer.id = c.buyer_id
      JOIN users agent ON agent.id = c.agent_id
      WHERE c.id = $1
    `, [id]);

    if (!conversationRes.rows.length) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const conversation = conversationRes.rows[0];

    if (
      !isAdmin(req) &&
      conversation.buyer_id !== userId &&
      conversation.agent_id !== userId
    ) {
      return res.status(403).json({ message: 'You are not authorized to view this conversation.' });
    }

    const messagesRes = await pool.query(`
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.message,
        m.created_at,
        u.name AS sender_name,
        u.email AS sender_email
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [id]);

    res.json({
      conversation,
      messages: messagesRes.rows
    });
  } catch (err) {
    console.error('Fetch conversation error:', err);
    res.status(500).json({ message: 'Failed to fetch conversation.' });
  }
});

// POST /api/messages/conversations/:id
router.post('/conversations/:id', async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const senderId = req.user.id;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  if (message.trim().length > 2000) {
    return res.status(400).json({ message: 'Message must be 2000 characters or fewer.' });
  }

  try {
    const conversationRes = await pool.query(
      'SELECT id, buyer_id, agent_id FROM conversations WHERE id = $1',
      [id]
    );

    if (!conversationRes.rows.length) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const conversation = conversationRes.rows[0];

    if (
      !isAdmin(req) &&
      conversation.buyer_id !== senderId &&
      conversation.agent_id !== senderId
    ) {
      return res.status(403).json({ message: 'You are not authorized to reply to this conversation.' });
    }

    const messageId = crypto.randomUUID();

    const messageRes = await pool.query(`
      INSERT INTO messages (id, conversation_id, sender_id, message, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, conversation_id, sender_id, message, created_at
    `, [messageId, id, senderId, message.trim()]);

    // Notify the other participant. For an admin reply, notify both conversation participants.
    const recipients = isAdmin(req)
      ? [conversation.buyer_id, conversation.agent_id]
      : [senderId === conversation.buyer_id ? conversation.agent_id : conversation.buyer_id];

    for (const recipientId of recipients) {
      if (!recipientId || recipientId === senderId) continue;

      await pool.query(`
        INSERT INTO notifications (id, user_id, title, body, is_read, created_at)
        VALUES ($1, $2, $3, $4, false, NOW())
      `, [
        crypto.randomUUID(),
        recipientId,
        'New Message',
        `${req.user.name || 'Someone'} sent you a new message.`
      ]);
    }

    res.status(201).json({
      message: messageRes.rows[0]
    });
  } catch (err) {
    console.error('Send conversation message error:', err);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

export default router;
