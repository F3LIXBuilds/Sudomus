// backend/routes/test.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected route accessed',
    user: req.user
  });
});

export default router;
