const express = require('express');
const { dbRun, dbGet } = require('../database/database');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.fieldname === 'avatar') folder += 'avatars/';
    if (file.fieldname === 'banner') folder += 'banners/';
    cb(null, folder);
  },
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET profile
router.get('/', requireAuth, async (req, res) => {
  const user = await dbGet(
    'SELECT id, username, display_name, avatar_url, banner_url, profile_theme FROM users WHERE id = ?',
    [req.userId]
  );
  res.json(user);
});

// UPDATE profile
router.post('/update', requireAuth, async (req, res) => {
  const { displayName, theme } = req.body;
  const updates = {};
  if (displayName) updates.display_name = displayName;
  if (theme) updates.profile_theme = theme;
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: 'No fields to update' });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(req.userId);

  await dbRun(`UPDATE users SET ${setClause} WHERE id = ?`, values);
  const updatedUser = await dbGet(
    'SELECT id, username, display_name, avatar_url, banner_url, profile_theme FROM users WHERE id = ?',
    [req.userId]
  );
  res.json(updatedUser);
});

// UPLOAD avatar/banner
router.post('/upload/:type', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const type = req.params.type;
  const url = `/uploads/${type === 'avatar' ? 'avatars' : 'banners'}/${req.file.filename}`;

  const field = type === 'avatar' ? 'avatar_url' : 'banner_url';
  await dbRun(
    `UPDATE users SET ${field} = ?, updated_at = ? WHERE id = ?`,
    [url, new Date().toISOString(), req.userId]
  );

  res.json({ success: true, url });
});

module.exports = router;
