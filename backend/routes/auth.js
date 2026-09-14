import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

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

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, userRole]
    );

    res.status(201).json({ user: result.rows[0] });

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
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
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

export default router;
