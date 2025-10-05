const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../database/database');
const discordConfig = require('../config/discord');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretul_tau_super_lung';

// 1️⃣ Generează link de login Discord
router.get('/discord', (req, res) => {
  const state = uuidv4();

  const authUrl = `${discordConfig.authUrl}?client_id=${discordConfig.clientId}&redirect_uri=${encodeURIComponent(discordConfig.redirectUri)}&response_type=code&scope=${discordConfig.scopes.join('%20')}&state=${state}`;

  res.json({ authUrl });
});

// 2️⃣ Callback Discord
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(discordConfig.tokenUrl, new URLSearchParams({
      client_id: discordConfig.clientId,
      client_secret: discordConfig.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: discordConfig.redirectUri
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(discordConfig.userUrl, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const discordUser = userResponse.data;

    // Check or create user in DB
    let user = await dbGet('SELECT * FROM users WHERE discord_id = ?', [discordUser.id]);
    if (!user) {
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
      user = await dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Redirect to frontend cu token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    res.redirect(`${frontendUrl}/#token=${token}`);

  } catch (error) {
    console.error('Discord OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
