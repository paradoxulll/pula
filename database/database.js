const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'fivem-forum.db');
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT UNIQUE NOT NULL,
        discord_username TEXT NOT NULL,
        discord_discriminator TEXT,
        discord_avatar TEXT,
        discord_email TEXT,
        display_name TEXT,
        avatar_url TEXT,
        banner_url TEXT,
        profile_theme TEXT DEFAULT 'theme-1',
        rank TEXT DEFAULT 'Community Member',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Sessions table for Discord OAuth
      db.run(`CREATE TABLE IF NOT EXISTS oauth_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Staff members table
      db.run(`CREATE TABLE IF NOT EXISTS staff_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        role TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      console.log('✅ Database tables initialized');
      resolve();
    });
  });
};

// Helper function to run SQL queries with promises
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  initDatabase,
  dbRun,
  dbGet,
  dbAll
};