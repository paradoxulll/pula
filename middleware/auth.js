const jwt = require("jsonwebtoken");
const { dbGet } = require("../database/database");

const JWT_SECRET = process.env.JWT_SECRET || "secretul_tau_super_lung"; 

// Middleware care verifică token-ul
const requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.userId = decoded.id; // punem userId din token în req
    next();
  });
};

// Middleware care ia userul din DB
const getUserFromSession = async (req, res, next) => {
  if (req.userId) {
    try {
      const user = await dbGet(
        "SELECT id, discord_id, discord_username, display_name, avatar_url, banner_url, profile_theme, rank FROM users WHERE id = ?",
        [req.userId]
      );

      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }
  next();
};

module.exports = {
  requireAuth,
  getUserFromSession,
};
