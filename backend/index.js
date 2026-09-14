import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import testRoutes from './routes/test.js';
import listingsRoutes from './routes/listings.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/aiRoutes.js';

import pool from './db.js';

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:3000']
).map(url => url.trim().replace(/\/+$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json());

import adminRoutes from './routes/admin.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Database connection test
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Neon connected'))
  .catch(err => console.error('❌ Neon error:', err.message));

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SuDomus API is running',
  });
});

app.listen(PORT, () => {
  console.log(`✅ SuDomus API running on port ${PORT}`);
});