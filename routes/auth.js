const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../database/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// REGISTER
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  const existingUser = await dbGet(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, email]
  );
  if (existingUser) return res.status(400).json({ error: 'Username or email already exists' });

  const hash = await bcrypt.hash(password, 10);
  await dbRun(
    'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
    [username, email, hash, username]
  );

  res.json({ success: true, message: 'User registered successfully' });
});

// LOGIN
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'All fields required' });

  const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(400).json({ error: 'Invalid username or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Invalid username or password' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token });
});

module.exports = router;
