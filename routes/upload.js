const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { dbRun } = require('../database/database');
const { requireAuth } = require('../middleware/auth'); // JWT middleware

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';

    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'banner') {
      uploadPath += 'banners/';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload avatar
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar in database (folosim JWT)
    await dbRun(
      'UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?',
      [avatarUrl, new Date().toISOString(), req.userId]
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      imageUrl: avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Upload banner
router.post('/banner', requireAuth, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bannerUrl = `/uploads/banners/${req.file.filename}`;

    // Update user's banner in database (folosim JWT)
    await dbRun(
      'UPDATE users SET banner_url = ?, updated_at = ? WHERE id = ?',
      [bannerUrl, new Date().toISOString(), req.userId]
    );

    res.json({
      success: true,
      message: 'Banner uploaded successfully',
      imageUrl: bannerUrl
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner' });
  }
});

module.exports = router;
