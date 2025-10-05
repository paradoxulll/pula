const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { dbRun, dbGet } = require('../database/database');
const steamConfig = require('../config/steam');

const router = express.Router();

// Initiate Steam authentication
router.get('/steam', (req, res) => {
  const state = uuidv4();
  const sessionId = uuidv4();
  
  // Store state in session for security
  req.session.oauthState = state;
  req.session.oauthSession = sessionId;
  
  // For Steam OpenID, you'd typically redirect to Steam's OpenID endpoint
  // Since we're simplifying, we'll create a mock authentication flow
  const authUrl = `${process.env.FRONTEND_URL}/profile?auth=steam&state=${state}&session=${sessionId}`;
  
  res.json({ 
    success: true, 
    authUrl,
    message: 'Redirect to Steam authentication'
  });
});

// Handle Steam authentication callback (mock implementation)
router.post('/steam/callback', async (req, res) => {
  const { steamId, username, avatar } = req.body;
  
  if (!steamId || !username) {
    return res.status(400).json({ error: 'Missing Steam user data' });
  }

  try {
    // Validate Steam ID format
    if (!steamConfig.isValidSteamID(steamId)) {
      return res.status(400).json({ error: 'Invalid Steam ID' });
    }

    // Check if user exists in database
    let user = await dbGet(
      'SELECT * FROM users WHERE steam_id = ?',
      [steamId]
    );

    if (!user) {
      // Create new user
      const result = await dbRun(
        `INSERT INTO users (steam_id, steam_username, steam_avatar, display_name) 
         VALUES (?, ?, ?, ?)`,
        [steamId, username, avatar, username]
      );

      user = await dbGet('SELECT * FROM users WHERE id = ?', [result.id]);
    } else {
      // Update last login and user info
      await dbRun(
        'UPDATE users SET last_login = ?, steam_username = ?, steam_avatar = ? WHERE id = ?',
        [new Date().toISOString(), username, avatar, user.id]
      );
    }

    // Create session
    req.session.userId = user.id;
    req.session.steamId = user.steam_id;
    
    // Return user data
    res.json({
      success: true,
      user: {
        id: user.id,
        steam_id: user.steam_id,
        steam_username: user.steam_username,
        steam_avatar: user.steam_avatar,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        profile_theme: user.profile_theme,
        rank: user.rank,
        is_whitelisted: user.is_whitelisted
      }
    });

  } catch (error) {
    console.error('Steam authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await dbGet(
      `SELECT id, steam_id, steam_username, steam_avatar, display_name, 
              avatar_url, banner_url, profile_theme, rank, is_whitelisted, created_at
       FROM users WHERE id = ? AND is_active = 1`,
      [req.session.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check if user is whitelisted
router.get('/whitelist/status', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const user = await dbGet(
      'SELECT id, steam_id, is_whitelisted FROM users WHERE id = ?',
      [req.session.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      is_whitelisted: user.is_whitelisted,
      steam_id: user.steam_id
    });
  } catch (error) {
    console.error('Error checking whitelist status:', error);
    res.status(500).json({ error: 'Failed to check whitelist status' });
  }
});

module.exports = router;
