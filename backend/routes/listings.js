import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import crypto from 'crypto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Configure Cloudinary
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️ Cloudinary env variables not fully configured. Using mock local upload for development.');
}

// Upload helper function
const uploadToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      const base64Data = fileBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;
      resolve({
        secure_url: dataUrl,
        public_id: `mock_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`
      });
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sudomus_listings',
        public_id: fileName.split('.')[0] + '_' + Date.now()
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured || publicId.startsWith('mock_')) {
      resolve({ result: 'ok' });
      return;
    }
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

const router = express.Router();

// Helper to validate listings data
const validateListing = (data) => {
  const errors = [];
  const {
    title,
    description,
    price,
    bedrooms,
    bathrooms,
    toilets,
    parking_spaces,
    land_size,
    property_type,
    listing_type,
    status,
    address,
    city,
    state,
    country
  } = data;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required and must be a valid string.');
  }

  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
    errors.push('Price is required and must be a positive number.');
  }

  if (bedrooms !== undefined && bedrooms !== null && (isNaN(Number(bedrooms)) || Number(bedrooms) < 0)) {
    errors.push('Bedrooms must be a non-negative number.');
  }

  if (bathrooms !== undefined && bathrooms !== null && (isNaN(Number(bathrooms)) || Number(bathrooms) < 0)) {
    errors.push('Bathrooms must be a non-negative number.');
  }

  if (toilets !== undefined && toilets !== null && (isNaN(Number(toilets)) || Number(toilets) < 0)) {
    errors.push('Toilets must be a non-negative number.');
  }

  if (parking_spaces !== undefined && parking_spaces !== null && (isNaN(Number(parking_spaces)) || Number(parking_spaces) < 0)) {
    errors.push('Parking spaces must be a non-negative number.');
  }

  if (land_size !== undefined && land_size !== null && (isNaN(Number(land_size)) || Number(land_size) < 0)) {
    errors.push('Land size must be a non-negative number.');
  }

  const validPropertyTypes = ['apartment', 'house', 'land', 'commercial'];
  if (!property_type || !validPropertyTypes.includes(property_type)) {
    errors.push(`Property type must be one of: ${validPropertyTypes.join(', ')}.`);
  }

  const validListingTypes = ['sale', 'rent'];
  if (!listing_type || !validListingTypes.includes(listing_type)) {
    errors.push(`Listing type must be one of: ${validListingTypes.join(', ')}.`);
  }

  const validStatuses = ['draft', 'pending_review', 'published', 'sold', 'rented', 'archived'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Middleware to authorize only agent and seller roles for mutations
const authorizeMutations = (req, res, next) => {
  const { role } = req.user;
  if (role !== 'agent' && role !== 'seller') {
    return res.status(403).json({ message: 'Only agents and sellers are authorized to perform this action.' });
  }
  next();
};

/* ================= GET LOGGED IN USER LISTINGS ================= */
router.get('/my-listings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, 
              COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_cover = true LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY created_at ASC LIMIT 1)
              ) as image_url
       FROM listings l 
       WHERE l.user_id = $1 
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch my listings error:', err);
    res.status(500).json({ message: 'Failed to retrieve listings.' });
  }
});

/* ================= GET ALL LISTINGS (PUBLIC) ================= */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, 
              COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_cover = true LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY created_at ASC LIMIT 1)
              ) as image_url
       FROM listings l 
       WHERE l.status = 'published' AND l.verification_status = 'verified'
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch listings error:', err);
    res.status(500).json({ message: 'Failed to retrieve listings.' });
  }
});

/* ================= CREATE LISTING ================= */
router.post('/', authMiddleware, authorizeMutations, async (req, res) => {
  const { isValid, errors } = validateListing(req.body);
  if (!isValid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const {
    title,
    description,
    price,
    bedrooms,
    bathrooms,
    toilets,
    parking_spaces,
    land_size,
    property_type,
    listing_type,
    status = 'draft',
    address,
    city,
    state,
    country
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO listings 
      (title, description, price, bedrooms, bathrooms, toilets, parking_spaces, land_size, property_type, listing_type, status, address, city, state, country, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *`,
      [
        title.trim(),
        description || '',
        price,
        bedrooms || 0,
        bathrooms || 0,
        toilets || 0,
        parking_spaces || 0,
        land_size || 0,
        property_type,
        listing_type,
        status,
        address || '',
        city || '',
        state || '',
        country || '',
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ message: 'Failed to create listing.' });
  }
});

/* ================= UPDATE LISTING ================= */
router.put('/:id', authMiddleware, authorizeMutations, async (req, res) => {
  const { id } = req.params;

  // Check existence & ownership first
  try {
    const listingCheck = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listingCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to edit this listing.' });
    }
  } catch (err) {
    console.error('Ownership check error:', err);
    return res.status(500).json({ message: 'Server error check.' });
  }

  const { isValid, errors } = validateListing(req.body);
  if (!isValid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const {
    title,
    description,
    price,
    bedrooms,
    bathrooms,
    toilets,
    parking_spaces,
    land_size,
    property_type,
    listing_type,
    status,
    address,
    city,
    state,
    country
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE listings 
       SET title = $1, description = $2, price = $3, bedrooms = $4, bathrooms = $5, toilets = $6, parking_spaces = $7, land_size = $8, property_type = $9, listing_type = $10, status = $11, address = $12, city = $13, state = $14, country = $15, verification_status = 'pending', updated_at = NOW()
       WHERE id = $16 AND user_id = $17
       RETURNING *`,
      [
        title.trim(),
        description || '',
        price,
        bedrooms || 0,
        bathrooms || 0,
        toilets || 0,
        parking_spaces || 0,
        land_size || 0,
        property_type,
        listing_type,
        status || 'draft',
        address || '',
        city || '',
        state || '',
        country || '',
        id,
        req.user.id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ message: 'Failed to update listing.' });
  }
});

/* ================= DELETE LISTING ================= */
router.delete('/:id', authMiddleware, authorizeMutations, async (req, res) => {
  const { id } = req.params;

  try {
    const listingCheck = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listingCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this listing.' });
    }

    await pool.query(
      'DELETE FROM listings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Listing deleted successfully.' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ message: 'Failed to delete listing.' });
  }
});

/* ================= GET AGENT PUBLIC PROFILE & LISTINGS (PUBLIC) ================= */
router.get('/agent/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userRes = await pool.query(
      'SELECT id, name, role, avatar, bio, verified, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Agent or seller not found.' });
    }

    const agent = userRes.rows[0];

    const listingsRes = await pool.query(
      `SELECT l.*, 
              COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_cover = true LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY created_at ASC LIMIT 1)
              ) as image_url
       FROM listings l 
       WHERE l.user_id = $1 AND l.status = 'published' AND l.verification_status = 'verified'
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json({
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        avatar: agent.avatar || null,
        bio: agent.bio || null,
        verified: Boolean(agent.verified),
        memberSince: agent.created_at,
        publishedCount: listingsRes.rows.length
      },
      listings: listingsRes.rows
    });
  } catch (err) {
    console.error('Fetch agent profile error:', err);
    res.status(500).json({ message: 'Failed to retrieve agent profile.' });
  }
});

/* ================= GET SINGLE LISTING DETAILS (PUBLIC) ================= */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch listing details and agent info
    const listingRes = await pool.query(
      `SELECT l.*, 
              u.name as agent_name, 
              u.email as agent_email, 
              u.role as agent_role,
              u.avatar as agent_avatar,
              u.verified as agent_verified,
              u.bio as agent_bio,
              (SELECT COUNT(*) FROM listings WHERE user_id = l.user_id AND status = 'published') as agent_listings_count
       FROM listings l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (listingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    const listing = listingRes.rows[0];

    // If it's not published, check if the requester is the owner
    if (listing.status !== 'published') {
      const authHeader = req.headers.authorization;
      let isOwner = false;
      if (authHeader) {
        try {
          const jwt = await import('jsonwebtoken');
          const token = authHeader.split(' ')[1];
          const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.id === listing.user_id) {
            isOwner = true;
          }
        } catch (e) {
          // invalid token
        }
      }
      if (!isOwner) {
        return res.status(403).json({ message: 'You are not authorized to view this listing.' });
      }
    }

    // 2. Fetch images
    const imagesRes = await pool.query(
      'SELECT * FROM listing_images WHERE listing_id = $1 ORDER BY created_at ASC',
      [id]
    );

    // 3. Fetch features
    const featuresRes = await pool.query(
      'SELECT * FROM listing_features WHERE listing_id = $1',
      [id]
    );

    res.json({
      ...listing,
      agent_verified: Boolean(listing.agent_verified),
      agent_listings_count: parseInt(listing.agent_listings_count || 0, 10),
      images: imagesRes.rows,
      features: featuresRes.rows.map(f => f.feature)
    });
  } catch (err) {
    console.error('Fetch listing details error:', err);
    res.status(500).json({ message: 'Failed to retrieve listing details.' });
  }
});

/* ================= SEND PROPERTY INQUIRY (OPTIONAL AUTH) ================= */
router.post('/:id/inquire', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const listingRes = await pool.query('SELECT id, user_id, title FROM listings WHERE id = $1', [id]);
    if (listingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    const listing = listingRes.rows[0];

    // Optional auth token verification
    let senderId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        if (decoded) senderId = decoded.id;
      } catch (e) {
        // ignore token error
      }
    }

    // If authenticated sender and not sending to themselves, link into conversation & message
    if (senderId && senderId !== listing.user_id) {
      let convRes = await pool.query(
        'SELECT id FROM conversations WHERE (buyer_id = $1 AND agent_id = $2) OR (buyer_id = $2 AND agent_id = $1)',
        [senderId, listing.user_id]
      );
      let convId;
      if (convRes.rows.length === 0) {
        convId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO conversations (id, buyer_id, agent_id, created_at) VALUES ($1, $2, $3, NOW())',
          [convId, senderId, listing.user_id]
        );
      } else {
        convId = convRes.rows[0].id;
      }

      const msgId = crypto.randomUUID();
      const formattedMsg = `[Inquiry on ${listing.title}]: ${message.trim()}`;
      await pool.query(
        'INSERT INTO messages (id, conversation_id, sender_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [msgId, convId, senderId, formattedMsg]
      );
    }

    // Always create a notification for the listing owner
    const notifId = crypto.randomUUID();
    const senderDisplayName = name?.trim() || (senderId ? 'A verified user' : 'A potential buyer');
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, body, is_read, created_at) VALUES ($1, $2, $3, $4, false, NOW())',
      [
        notifId,
        listing.user_id,
        `New Inquiry: ${listing.title}`,
        `${senderDisplayName} sent an inquiry: "${message.trim().slice(0, 100)}${message.trim().length > 100 ? '...' : ''}"`
      ]
    );

    res.json({
      success: true,
      message: 'Your inquiry has been delivered to the agent.'
    });
  } catch (err) {
    console.error('Send inquiry error:', err);
    res.status(500).json({ message: 'Failed to send inquiry.' });
  }
});

/* ================= TOGGLE FAVORITE (AUTH) ================= */
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const favCheck = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND listing_id = $2',
      [userId, id]
    );

    if (favCheck.rows.length > 0) {
      // Remove favorite
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2',
        [userId, id]
      );
      res.json({ favorited: false });
    } else {
      // Add favorite
      const newId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO favorites (id, user_id, listing_id, created_at) VALUES ($1, $2, $3, NOW())',
        [newId, userId, id]
      );
      res.json({ favorited: true });
    }
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ message: 'Failed to toggle favorite.' });
  }
});

/* ================= CHECK IF FAVORITED (AUTH) ================= */
router.get('/:id/is-favorited', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const favCheck = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND listing_id = $2',
      [userId, id]
    );
    res.json({ favorited: favCheck.rows.length > 0 });
  } catch (err) {
    console.error('Check favorite error:', err);
    res.status(500).json({ message: 'Failed to check favorite status.' });
  }
});

/* ================= RECORD LISTING VIEW (OPTIONAL AUTH) ================= */
router.post('/:id/view', async (req, res) => {
  const { id } = req.params;
  
  // Try to parse token if present
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const jwt = await import('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      if (decoded) userId = decoded.id;
    } catch (e) {
      // ignore token verification error for views
    }
  }

  try {
    const newId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO listing_views (id, listing_id, user_id, viewed_at) VALUES ($1, $2, $3, NOW())',
      [newId, id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Record listing view error:', err);
    res.status(500).json({ message: 'Failed to record view.' });
  }
});

/* ================= UPLOAD LISTING IMAGES (AUTH, OWNER ONLY) ================= */
router.post('/:id/images', authMiddleware, upload.array('images', 10), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verify listing existence & ownership
    const listingCheck = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listingCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Only the owner of this listing can upload images.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided.' });
    }

    // 2. Check if a cover image already exists
    const coverCheck = await pool.query(
      'SELECT id FROM listing_images WHERE listing_id = $1 AND is_cover = true',
      [id]
    );
    let hasCover = coverCheck.rows.length > 0;

    const uploadedImages = [];

    // 3. Process uploads
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);

      const imageId = crypto.randomUUID();
      // If there's no cover image currently, make the first uploaded image in this batch the cover
      const isCover = !hasCover && i === 0;
      if (isCover) hasCover = true;

      const insertResult = await pool.query(
        `INSERT INTO listing_images (id, listing_id, image_url, public_id, is_cover, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [imageId, id, uploadResult.secure_url, uploadResult.public_id, isCover]
      );

      uploadedImages.push(insertResult.rows[0]);
    }

    // 4. Return all images for this listing
    const allImages = await pool.query(
      'SELECT * FROM listing_images WHERE listing_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.status(201).json(allImages.rows);
  } catch (err) {
    console.error('Upload images error:', err);
    res.status(500).json({ message: err.message || 'Failed to upload images.' });
  }
});

/* ================= DELETE LISTING IMAGE (AUTH, OWNER ONLY) ================= */
router.delete('/:id/images/:imageId', authMiddleware, async (req, res) => {
  const { id, imageId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verify listing existence & ownership
    const listingCheck = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listingCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Only the owner of this listing can delete images.' });
    }

    // 2. Fetch the image to delete
    const imageCheck = await pool.query(
      'SELECT * FROM listing_images WHERE id = $1 AND listing_id = $2',
      [imageId, id]
    );

    if (imageCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found.' });
    }

    const imageToDelete = imageCheck.rows[0];

    // 3. Delete from Cloudinary
    if (imageToDelete.public_id) {
      await deleteFromCloudinary(imageToDelete.public_id);
    }

    // 4. Delete from database
    await pool.query(
      'DELETE FROM listing_images WHERE id = $1 AND listing_id = $2',
      [imageId, id]
    );

    // 5. If this was the cover image, automatically set the next oldest image as the cover
    if (imageToDelete.is_cover) {
      const remainingCheck = await pool.query(
        'SELECT id FROM listing_images WHERE listing_id = $1 ORDER BY created_at ASC LIMIT 1',
        [id]
      );
      if (remainingCheck.rows.length > 0) {
        await pool.query(
          'UPDATE listing_images SET is_cover = true WHERE id = $1',
          [remainingCheck.rows[0].id]
        );
      }
    }

    // 6. Return remaining images
    const allImages = await pool.query(
      'SELECT * FROM listing_images WHERE listing_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json(allImages.rows);
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ message: 'Failed to delete image.' });
  }
});

/* ================= SET COVER IMAGE (AUTH, OWNER ONLY) ================= */
router.put('/:id/images/:imageId/cover', authMiddleware, async (req, res) => {
  const { id, imageId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verify listing existence & ownership
    const listingCheck = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listingCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Only the owner of this listing can change the cover image.' });
    }

    // 2. Check if the image belongs to the listing
    const imageCheck = await pool.query(
      'SELECT id FROM listing_images WHERE id = $1 AND listing_id = $2',
      [imageId, id]
    );

    if (imageCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found for this listing.' });
    }

    // 3. Clear is_cover for all other images of this listing
    await pool.query(
      'UPDATE listing_images SET is_cover = false WHERE listing_id = $1',
      [id]
    );

    // 4. Set this specific image as cover
    await pool.query(
      'UPDATE listing_images SET is_cover = true WHERE id = $1 AND listing_id = $2',
      [imageId, id]
    );

    // 5. Return all images
    const allImages = await pool.query(
      'SELECT * FROM listing_images WHERE listing_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json(allImages.rows);
  } catch (err) {
    console.error('Set cover image error:', err);
    res.status(500).json({ message: 'Failed to update cover image.' });
  }
});

export default router;

