const express = require('express');
const { dbRun, dbGet } = require('../database/database');
const { requireAuth } = require('../middleware/auth'); // JWT middleware

const router = express.Router();

// Get user profile
router.get('/', requireAuth, async (req, res) => {
  try {
    // Folosim req.userId din JWT middleware
    const user = await dbGet(
      `SELECT id, discord_id, discord_username, discord_discriminator, 
              display_name, avatar_url, banner_url, profile_theme, rank, created_at
       FROM users WHERE id = ?`,
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.post('/update', requireAuth, async (req, res) => {
  const { displayName, theme } = req.body;

  try {
    const updates = {};
    
    if (displayName !== undefined) updates.display_name = displayName;
    if (theme !== undefined) updates.profile_theme = theme;
    
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(req.userId); // folosim userId din JWT

    await dbRun(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );

    // Return updated user
    const updatedUser = await dbGet(
      `SELECT id, discord_id, discord_username, discord_discriminator, 
              display_name, avatar_url, banner_url, profile_theme, rank, created_at
       FROM users WHERE id = ?`,
      [req.userId]
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
