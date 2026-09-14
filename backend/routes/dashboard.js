import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to check if a user is agent or seller
const authorizeAgentOrSeller = (req, res, next) => {
  const { role } = req.user;
  if (role !== 'agent' && role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Agents or sellers only.' });
  }
  next();
};

/* ================= AGENT DASHBOARD ANALYTICS ================= */
router.get('/agent', authMiddleware, authorizeAgentOrSeller, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Statistics (Optimized using group-by and simple counts)
    const countsPromise = pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold
      FROM listings 
      WHERE user_id = $1
    `, [userId]);

    const viewsPromise = pool.query(`
      SELECT COUNT(*) as total_views 
      FROM listing_views v 
      JOIN listings l ON v.listing_id = l.id 
      WHERE l.user_id = $1
    `, [userId]);

    const favoritesPromise = pool.query(`
      SELECT COUNT(*) as favorites 
      FROM favorites f 
      JOIN listings l ON f.listing_id = l.id 
      WHERE l.user_id = $1
    `, [userId]);

    const messagesCountPromise = pool.query(`
      SELECT COUNT(*) as total_messages 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      WHERE c.agent_id = $1
    `, [userId]);

    const appointmentsCountPromise = pool.query(`
      SELECT COUNT(*) as total_appointments 
      FROM appointments 
      WHERE agent_id = $1
    `, [userId]);

    const notificationsCountPromise = pool.query(`
      SELECT COUNT(*) as unread_notifications 
      FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    // 2. Recent items queries
    const recentListingsPromise = pool.query(`
      SELECT * FROM listings 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);

    const recentMessagesPromise = pool.query(`
      SELECT m.*, u.name as sender_name, u.email as sender_email 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      JOIN users u ON m.sender_id = u.id 
      WHERE c.agent_id = $1 
      ORDER BY m.created_at DESC 
      LIMIT 5
    `, [userId]);

    const upcomingAppointmentsPromise = pool.query(`
      SELECT a.*, u.name as buyer_name, l.title as listing_title 
      FROM appointments a 
      JOIN users u ON a.buyer_id = u.id 
      JOIN listings l ON a.listing_id = l.id 
      WHERE a.agent_id = $1 
      ORDER BY a.appointment_date ASC 
      LIMIT 5
    `, [userId]);

    // Await all queries in parallel
    const [
      countsRes,
      viewsRes,
      favoritesRes,
      messagesCountRes,
      appointmentsCountRes,
      notificationsCountRes,
      recentListingsRes,
      recentMessagesRes,
      upcomingAppointmentsRes
    ] = await Promise.all([
      countsPromise,
      viewsPromise,
      favoritesPromise,
      messagesCountPromise,
      appointmentsCountPromise,
      notificationsCountPromise,
      recentListingsPromise,
      recentMessagesPromise,
      upcomingAppointmentsPromise
    ]);

    const counts = countsRes.rows[0] || { total: 0, published: 0, draft: 0, pending: 0, sold: 0 };

    res.json({
      stats: {
        totalListings: parseInt(counts.total || 0, 10),
        publishedListings: parseInt(counts.published || 0, 10),
        draftListings: parseInt(counts.draft || 0, 10),
        pendingListings: parseInt(counts.pending || 0, 10),
        soldListings: parseInt(counts.sold || 0, 10),
        totalViews: parseInt(viewsRes.rows[0]?.total_views || 0, 10),
        favorites: parseInt(favoritesRes.rows[0]?.favorites || 0, 10),
        messages: parseInt(messagesCountRes.rows[0]?.total_messages || 0, 10),
        appointments: parseInt(appointmentsCountRes.rows[0]?.total_appointments || 0, 10),
        notifications: parseInt(notificationsCountRes.rows[0]?.unread_notifications || 0, 10)
      },
      recentListings: recentListingsRes.rows,
      recentMessages: recentMessagesRes.rows,
      upcomingAppointments: upcomingAppointmentsRes.rows
    });
  } catch (err) {
    console.error('Agent analytics error:', err);
    res.status(500).json({ message: 'Failed to retrieve agent dashboard analytics.' });
  }
});

/* ================= BUYER DASHBOARD ANALYTICS ================= */
router.get('/buyer', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Saved Properties (Favorites)
    const savedPropertiesPromise = pool.query(`
      SELECT l.*, true as is_favorited,
             COALESCE(
               (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_cover = true LIMIT 1),
               (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY created_at ASC LIMIT 1)
             ) as image_url
      FROM favorites f 
      JOIN listings l ON f.listing_id = l.id 
      WHERE f.user_id = $1 AND l.status = 'published'
      ORDER BY f.created_at DESC
    `, [userId]);

    // 2. Recently Viewed
    const recentlyViewedPromise = pool.query(`
      SELECT DISTINCT ON (l.id) l.*, lv.viewed_at,
             COALESCE(
               (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_cover = true LIMIT 1),
               (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY created_at ASC LIMIT 1)
             ) as image_url
      FROM listing_views lv 
      JOIN listings l ON lv.listing_id = l.id 
      WHERE lv.user_id = $1 AND l.status = 'published'
      ORDER BY l.id, lv.viewed_at DESC
      LIMIT 5
    `, [userId]);

    // 3. Recommended Listings (published, not owned by user, limit 6)
    const recommendedListingsPromise = pool.query(`
      SELECT l.*,
             COALESCE(
               (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_cover = true LIMIT 1),
               (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY created_at ASC LIMIT 1)
             ) as image_url
      FROM listings l
      WHERE l.status = 'published' AND l.user_id != $1
      ORDER BY l.created_at DESC
      LIMIT 6
    `, [userId]);

    // 4. Notifications
    const notificationsPromise = pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [userId]);

    // 5. Recent Messages (both sent and received, sorted by date)
    const messagesPromise = pool.query(`
      SELECT m.*, u.name as sender_name, u.email as sender_email 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      JOIN users u ON m.sender_id = u.id 
      WHERE c.buyer_id = $1 
      ORDER BY m.created_at DESC 
      LIMIT 10
    `, [userId]);

    // 6. Upcoming Viewings (Appointments)
    const upcomingViewingsPromise = pool.query(`
      SELECT a.*, u.name as agent_name, u.email as agent_email, l.title as listing_title 
      FROM appointments a 
      JOIN users u ON a.agent_id = u.id 
      JOIN listings l ON a.listing_id = l.id 
      WHERE a.buyer_id = $1 
      ORDER BY a.appointment_date ASC 
      LIMIT 5
    `, [userId]);

    // 7. Profile details / KYC / Wallet info
    const profilePromise = pool.query(`
      SELECT u.id, u.name, u.email, u.role,
             (SELECT status FROM kyc_documents WHERE user_id = u.id ORDER BY uploaded_at DESC LIMIT 1) as kyc_status,
             (SELECT wallet_address FROM wallet_connections WHERE user_id = u.id ORDER BY connected_at DESC LIMIT 1) as wallet_address
      FROM users u
      WHERE u.id = $1
    `, [userId]);

    const [
      savedPropertiesRes,
      recentlyViewedRes,
      recommendedRes,
      notificationsRes,
      messagesRes,
      upcomingViewingsRes,
      profileRes
    ] = await Promise.all([
      savedPropertiesPromise,
      recentlyViewedPromise,
      recommendedListingsPromise,
      notificationsPromise,
      messagesPromise,
      upcomingViewingsPromise,
      profilePromise
    ]);

    // Sort recentlyViewedRes by viewed_at desc in memory because DISTINCT ON requires ordering by the ON column first
    const sortedRecentlyViewed = recentlyViewedRes.rows.sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at));

    res.json({
      savedProperties: savedPropertiesRes.rows,
      recentlyViewed: sortedRecentlyViewed,
      recommendedListings: recommendedRes.rows,
      notifications: notificationsRes.rows,
      messages: messagesRes.rows,
      upcomingViewings: upcomingViewingsRes.rows,
      profileSummary: profileRes.rows[0] || null
    });
  } catch (err) {
    console.error('Buyer analytics error:', err);
    res.status(500).json({ message: 'Failed to retrieve buyer dashboard analytics.' });
  }
});

export default router;
