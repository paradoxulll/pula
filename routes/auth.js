const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { dbRun, dbGet, dbAll } = require('../database/database');
const discordConfig = require('../config/discord');

const router = express.Router();

// Generate Discord OAuth URL and redirect user
router.get('/discord', (req, res) => {
  const state = uuidv4();
  
  // Store state in session for security
  req.session.oauthState = state;
  
  const authUrl = `${discordConfig.authUrl}?client_id=${discordConfig.clientId}&redirect_uri=${encodeURIComponent(discordConfig.redirectUri)}&response_type=code&scope=${discordConfig.scopes.join('%20')}&state=${state}`;
  
  res.json({ authUrl });
});

// Handle Discord OAuth callback
router.get('/discord/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Verify state to prevent CSRF
  if (!state || state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(discordConfig.tokenUrl, new URLSearchParams({
      client_id: discordConfig.clientId,
      client_secret: discordConfig.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: discordConfig.redirectUri
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token } = tokenResponse.data;
    
    // Get user info from Discord
    const userResponse = await axios.get(discordConfig.userUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    const discordUser = userResponse.data;
    
    // Check if user exists in our database
    let user = await dbGet(
      'SELECT * FROM users WHERE discord_id = ?',
      [discordUser.id]
    );
    
    if (!user) {
      // Create new user
      const result = await dbRun(
        `INSERT INTO users (discord_id, discord_username, discord_discriminator, discord_avatar, discord_email, display_name) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          discordUser.id,
          discordUser.username,
          discordUser.discriminator,
          discordUser.avatar,
          discordUser.email,
          discordUser.username
        ]
      );
      
      user = await dbGet('SELECT * FROM users WHERE id = ?', [result.id]);
    }
    
    // Store user in session
    req.session.userId = user.id;
    req.session.discordId = user.discord_id;
    
    // Redirect to frontend profile page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    res.redirect(`${frontendUrl}/#profile`);
    
  } catch (error) {
    console.error('Discord OAuth error:', error.response?.data || error.message);
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
      `SELECT id, discord_id, discord_username, discord_discriminator, 
              display_name, avatar_url, banner_url, profile_theme, rank, created_at
       FROM users WHERE id = ?`,
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
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;