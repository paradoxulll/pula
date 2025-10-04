const { dbGet } = require('../database/database');

const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

const getUserFromSession = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await dbGet(
        'SELECT id, discord_id, discord_username, display_name, avatar_url, banner_url, profile_theme, rank FROM users WHERE id = ?',
        [req.session.userId]
      );
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error('Error fetching user from session:', error);
    }
  }
  next();
};

module.exports = {
  requireAuth,
  getUserFromSession
};