const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../database/database');
const discordConfig = require('../config/discord');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secretul_tau_super_lung';

// ✅ LOGIN cu Discord OAuth2
router.get('/discord', (req, res) => {
  const state = uuidv4();

  const authUrl = `${discordConfig.authUrl}?client_id=${discordConfig.clientId}&redirect_uri=${encodeURIComponent(discordConfig.redirectUri)}&response_type=code&scope=${discordConfig.scopes.join('%20')}&state=${state}`;

  res.json({ authUrl });
});

// ✅ CALLBACK după ce userul apasă "Authorize"
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // 1. Cerem token de la Discord
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

    // 2. Luăm user info de la Discord
    const userResponse = await axios.get(discordConfig.userUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const discordUser = userResponse.data;

    // 3. Verificăm userul în baza noastră de date
    let user = await dbGet(
      'SELECT * FROM users WHERE discord_id = ?',
      [discordUser.id]
    );

    if (!user) {
      // ✅ dacă nu există, îl creăm
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

    // 4. Creăm un JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // 5. Trimitem tokenul către frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    res.redirect(`${frontendUrl}/#token=${token}`);

  } catch (error) {
    console.error('Discord OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ✅ GET USER (din JWT)
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbGet(
      `SELECT id, discord_id, discord_username, discord_discriminator, 
              display_name, avatar_url, banner_url, profile_theme, rank, created_at
       FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('JWT error:', err);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

// ✅ LOGOUT – frontend doar șterge token-ul
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out, just delete token on client' });
});

module.exports = router;
