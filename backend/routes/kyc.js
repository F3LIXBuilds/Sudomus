import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

import authMiddleware, { requireAdmin } from '../middleware/authMiddleware.js';
import pool from '../db.js';
import { uploadKycDocument, createKycSignedUrl, deleteKycDocument } from '../services/supabaseStorage.js';

const router = express.Router();

/*
 * Resolve backend directory
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
 * KYC upload directory
 */
const kycUploadDir = path.join(__dirname, '../uploads/kyc');

if (!fs.existsSync(kycUploadDir)) {
  fs.mkdirSync(kycUploadDir, {
    recursive: true,
  });
}

/*
 * Multer storage
 */
const storage = multer.memoryStorage();

/*
 * Allowed file types
 */
const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only JPG, PNG, WEBP and PDF files are allowed.'
        )
      );
    }
  },
});

/*
 * GET current user's KYC records
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        document_type,
        status,
        uploaded_at
       FROM kyc_documents
       WHERE user_id = $1
       ORDER BY uploaded_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get KYC error:', err);

    res.status(500).json({
      message: 'Failed to load KYC records',
    });
  }
});

/*
 * Upload KYC document
 */
router.post(
  '/documents',
  authMiddleware,
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'A document is required',
        });
      }

      const { documentType } = req.body;

      const allowedDocumentTypes = [
        'government_id',
        'business_license',
      ];

      if (!allowedDocumentTypes.includes(documentType)) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: 'Invalid document type',
        });
      }

      // Backend protection: check if a pending document of the same type already exists
      const existingPending = await pool.query(
        `SELECT id FROM kyc_documents WHERE user_id = $1 AND document_type = $2 AND status = 'pending'`,
        [req.user.id, documentType]
      );

      if (existingPending.rows.length > 0) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          message: 'Your KYC submission is already pending review.'
        });
      }

      /*
       * Random storage path for Supabase
       */
      const extension = path.extname(req.file.originalname);
      const randomFilename = crypto.randomBytes(16).toString('hex') + extension;
      const documentId = crypto.randomUUID(); // Optional, use UUID to segment
      const storagePath = `kyc/${req.user.id}/${documentId}/${randomFilename}`;

      /*
       * Upload to Supabase first
       */
      await uploadKycDocument(req.file.buffer, storagePath, req.file.mimetype);

      let result;
      try {
        result = await pool.query(
          `INSERT INTO kyc_documents
            (user_id, document_type, document_url, status, storage_key, original_filename, mime_type, file_size)
           VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
           RETURNING
            id,
            document_type,
            status,
            uploaded_at`,
          [
            req.user.id,
            documentType,
            null, // document_url is null for new files
            storagePath,
            req.file.originalname,
            req.file.mimetype,
            req.file.size
          ]
        );
      } catch (dbError) {
        // Fallback: delete from Supabase if DB insert fails
        console.error('KYC database insert error, cleaning up Supabase:', dbError);
        await deleteKycDocument(storagePath);
        throw dbError; // Rethrow to let the main catch block handle the response
      }

      res.status(201).json({
        message: 'Document uploaded successfully',

        document: result.rows[0],
      });
    } catch (err) {
      console.error('KYC upload error:', err);

      /*
       * Remove uploaded file if database insertion fails (for legacy diskStorage, though we now use memory storage)
       */
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (deleteError) {
          console.error(
            'Failed to remove uploaded KYC file:',
            deleteError
          );
        }
      }

      res.status(500).json({
        message:
          err.message || 'Failed to upload document',
      });
    }
  }
);

/*
 * GET signed URL for admin verification
 */
router.get('/admin/documents/:id/url', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT storage_key, document_url FROM kyc_documents WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'KYC document not found' });
    }

    const doc = result.rows[0];

    if (!doc.storage_key) {
      // Fallback for legacy files
      return res.json({ url: doc.document_url });
    }

    // Generate signed URL from Supabase, expires in 5 minutes
    const signedUrl = await createKycSignedUrl(doc.storage_key, 300);

    res.json({ url: signedUrl });
  } catch (err) {
    console.error('Get KYC Signed URL error:', err);
    res.status(500).json({ message: 'Failed to generate signed URL' });
  }
});

export default router;