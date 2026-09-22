import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { sendVerificationEmail } from '../services/email.js';

const router = express.Router();

// Simple email regex validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* ================= SIGNUP ================= */
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'A valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const validRoles = ['user', 'agent', 'seller', 'admin'];
  const userRole = role || 'user';
  if (!validRoles.includes(userRole)) {
    return res.status(400).json({ message: 'Invalid user role' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, verification_token_hash, verification_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, userRole, hashedToken, expiresAt]
    );

    const mode = process.env.EMAIL_VERIFICATION_MODE || 'email';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    
    if (mode === 'development') {
      return res.status(201).json({
        user: result.rows[0],
        message: 'Account created. Please verify your email.',
        verificationRequired: true,
        developmentVerificationUrl: verifyUrl
      });
    }

    let emailResult = null;
    try {
      emailResult = await sendVerificationEmail(email.toLowerCase().trim(), name.trim(), verifyUrl);
    } catch (emailErr) {
      console.error('Failed to send email during signup:', emailErr);
    }

    res.status(201).json({
      user: result.rows[0],
      message: 'Account created. Check your email to verify your SuDomus account.',
      verificationRequired: true,
      emailSent: emailResult?.success ?? false
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ================= LOGIN ================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for email: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password, role, email_verified FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      console.log(`Login failed for ${email}: Invalid password`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.email_verified) {
      console.log(`Login failed for ${email}: Email not verified`);
      return res.status(403).json({ message: 'Please verify your email before signing in.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL ERROR: JWT_SECRET is missing!');
      throw new Error('JWT_SECRET is missing');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ================= GET CURRENT USER PROFILE ================= */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, avatar, bio, wallet_address FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ================= UPDATE CURRENT USER PROFILE ================= */
router.put('/profile', authMiddleware, async (req, res) => {
  const { name } = req.body;

  // Validation: Name is required and must not be empty
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Name cannot be empty' });
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 100) {
    return res.status(400).json({ message: 'Name must be 100 characters or less' });
  }

  try {
    // SECURITY: Authenticated user ID comes strictly from req.user.id (JWT verified by authMiddleware)
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, name, email, role, phone, avatar, bio, wallet_address, updated_at`,
      [trimmedName, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ================= VERIFY EMAIL ================= */
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      'SELECT id, verification_token_expires_at FROM users WHERE verification_token_hash = $1',
      [hashedToken]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Verification link is invalid.' });
    }

    const user = result.rows[0];

    if (new Date() > new Date(user.verification_token_expires_at)) {
      return res.status(400).json({ message: 'Verification link has expired.' });
    }

    await pool.query(
      `UPDATE users 
       SET email_verified = TRUE, verification_token_hash = NULL, verification_token_expires_at = NULL 
       WHERE id = $1`,
      [user.id]
    );

    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ================= RESEND VERIFICATION ================= */
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'A valid email is required' });
  }

  // Always return success to prevent email enumeration, but process internally if valid
  const genericSuccessMsg = 'If an account exists for that email, a verification email has been sent.';

  try {
    const result = await pool.query(
      'SELECT id, name, email_verified, verification_token_expires_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.json({ message: genericSuccessMsg });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.json({ message: genericSuccessMsg });
    }

    // Rate limiting: if a token was generated recently (e.g. expires_at is > 23h 58m from now), don't send again.
    // Since tokens last 24h, we check if they were generated in the last 2 minutes.
    if (user.verification_token_expires_at) {
      const generatedAt = new Date(user.verification_token_expires_at).getTime() - (24 * 60 * 60 * 1000);
      if (Date.now() - generatedAt < 2 * 60 * 1000) {
        // Cooldown active, just pretend we sent it
        return res.json({ message: genericSuccessMsg });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users 
       SET verification_token_hash = $1, verification_token_expires_at = $2 
       WHERE id = $3`,
      [hashedToken, expiresAt, user.id]
    );

    const mode = process.env.EMAIL_VERIFICATION_MODE || 'email';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    
    if (mode === 'development') {
      return res.json({
        message: genericSuccessMsg,
        developmentVerificationUrl: verifyUrl
      });
    }

    const emailResult = await sendVerificationEmail(email.toLowerCase().trim(), user.name, verifyUrl);

    res.json({
      message: genericSuccessMsg,
      emailSent: emailResult?.success ?? false
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    // Don't leak server error to client if possible, just generic success
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
