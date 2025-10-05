const { dbGet } = require('../database/database');

const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
  }
  next();
};

const getUserFromSession = async (req) => {
  if (!req.session.userId) {
    return null;
  }

  try {
    const user = await dbGet(
      `SELECT id, steam_id, steam_username, steam_avatar, display_name, 
              avatar_url, banner_url, profile_theme, rank, is_whitelisted, created_at
       FROM users WHERE id = ? AND is_active = 1`,
      [req.session.userId]
    );
    
    return user;
  } catch (error) {
    console.error('Error fetching user from session:', error);
    return null;
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  getUserFromSession
};
