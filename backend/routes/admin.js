import express from 'express';
import pool from '../db.js';
import authMiddleware, { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here require auth and admin
router.use(authMiddleware, requireAdmin);

/* ================= ADMIN OVERVIEW STATS ================= */
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Users stats
    const usersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'agent' THEN 1 ELSE 0 END) as total_agents,
        SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as total_sellers
      FROM users
    `);
    stats.users = usersResult.rows[0];

    // Listings stats
    const listingsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_listings,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_listings,
        SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending_review,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_listings
      FROM listings
    `);
    stats.listings = listingsResult.rows[0];

    // Verification stats
    const verificationResult = await pool.query(`
      SELECT COUNT(*) as pending_kyc
      FROM kyc_documents
      WHERE status = 'pending'
    `);
    stats.verification = verificationResult.rows[0];

    // View & Favorites stats
    const viewsResult = await pool.query('SELECT COUNT(*) as total_views FROM listing_views');
    const favoritesResult = await pool.query('SELECT COUNT(*) as total_favorites FROM favorites');
    
    stats.activity = {
      total_views: viewsResult.rows[0].total_views,
      total_favorites: favoritesResult.rows[0].total_favorites
    };

    res.json(stats);
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

/* ================= GET LISTINGS FOR REVIEW ================= */
router.get('/listings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, 
             u.name as owner_name, u.email as owner_email, u.role as owner_role,
             (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_cover = true LIMIT 1) as cover_image
      FROM listings l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch review listings error:', err);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

/* ================= APPROVE LISTING ================= */
router.post('/listings/:id/approve', async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    await pool.query('BEGIN');

    const listingRes = await pool.query(
      `UPDATE listings 
       SET status = 'published', verification_status = 'verified', rejection_reason = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING user_id`,
      [id]
    );

    if (listingRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Listing not found' });
    }

    const ownerId = listingRes.rows[0].user_id;

    // Audit log
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'approve_listing', 'listing', $2)`,
      [adminId, id]
    );

    // Notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, body)
       VALUES ($1, 'Listing Approved', 'Your property listing has been approved and published.')`,
      [ownerId]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Listing approved successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Approve listing error:', err);
    res.status(500).json({ message: 'Failed to approve listing' });
  }
});

/* ================= REJECT LISTING ================= */
router.post('/listings/:id/reject', async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: 'Rejection reason is required' });
  }

  try {
    await pool.query('BEGIN');

    const listingRes = await pool.query(
      `UPDATE listings 
       SET status = 'pending_review', verification_status = 'rejected', rejection_reason = $1, updated_at = NOW()
       WHERE id = $2 RETURNING user_id`,
      [reason.trim(), id]
    );

    if (listingRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Listing not found' });
    }

    const ownerId = listingRes.rows[0].user_id;

    // Audit log
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, reason)
       VALUES ($1, 'reject_listing', 'listing', $2, $3)`,
      [adminId, id, reason.trim()]
    );

    // Notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, body)
       VALUES ($1, 'Listing Rejected', $2)`,
      [ownerId, `Your property listing requires changes: ${reason.trim()}`]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Listing rejected successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Reject listing error:', err);
    res.status(500).json({ message: 'Failed to reject listing' });
  }
});

/* ================= GET KYC VERIFICATIONS ================= */
router.get('/verification', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT k.*, u.name, u.email, u.role
      FROM kyc_documents k
      JOIN users u ON k.user_id = u.id
      ORDER BY k.uploaded_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch KYC error:', err);
    res.status(500).json({ message: 'Failed to fetch KYC queue' });
  }
});

/* ================= APPROVE KYC ================= */
router.post('/verification/:id/approve', async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    await pool.query('BEGIN');

    const kycRes = await pool.query(
      `UPDATE kyc_documents SET status = 'approved' WHERE id = $1 RETURNING user_id`,
      [id]
    );

    if (kycRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'KYC record not found' });
    }

    const userId = kycRes.rows[0].user_id;

    await pool.query(
      `UPDATE users SET verified = true WHERE id = $1`,
      [userId]
    );

    // Audit log
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'approve_kyc', 'kyc_document', $2)`,
      [adminId, id]
    );

    // Notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, body)
       VALUES ($1, 'Verification Approved', 'Your account verification has been approved.')`,
      [userId]
    );

    await pool.query('COMMIT');
    res.json({ message: 'KYC approved successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Approve KYC error:', err);
    res.status(500).json({ message: 'Failed to approve KYC' });
  }
});

/* ================= REJECT KYC ================= */
router.post('/verification/:id/reject', async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: 'Rejection reason is required' });
  }

  try {
    await pool.query('BEGIN');

    const kycRes = await pool.query(
      `UPDATE kyc_documents SET status = 'rejected' WHERE id = $1 RETURNING user_id`,
      [id]
    );

    if (kycRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'KYC record not found' });
    }

    const userId = kycRes.rows[0].user_id;

    await pool.query(
      `UPDATE users SET verified = false WHERE id = $1`,
      [userId]
    );

    // Audit log
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, reason)
       VALUES ($1, 'reject_kyc', 'kyc_document', $2, $3)`,
      [adminId, id, reason.trim()]
    );

    // Notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, body)
       VALUES ($1, 'Verification Rejected', $2)`,
      [userId, `Your account verification was rejected: ${reason.trim()}`]
    );

    await pool.query('COMMIT');
    res.json({ message: 'KYC rejected successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Reject KYC error:', err);
    res.status(500).json({ message: 'Failed to reject KYC' });
  }
});

/* ================= GET AUDIT LOG ================= */
router.get('/audit', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.name as admin_name, u.email as admin_email
      FROM admin_audit_logs a
      JOIN users u ON a.admin_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

export default router;
