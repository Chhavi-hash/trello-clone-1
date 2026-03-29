const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      avatar_url VARCHAR(255) NOT NULL,
      email VARCHAR(100)
    );
    CREATE TABLE IF NOT EXISTS boards (
      id SERIAL PRIMARY KEY,
      member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
      title VARCHAR(100) NOT NULL,
      bg_type VARCHAR(20) NOT NULL DEFAULT 'color',
      bg_value VARCHAR(255) NOT NULL DEFAULT '#0052cc',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS lists (
      id SERIAL PRIMARY KEY,
      board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title VARCHAR(50) NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      cover_type VARCHAR(10),
      cover_value VARCHAR(255),
      archived BOOLEAN NOT NULL DEFAULT FALSE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS labels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(30) NOT NULL,
      color VARCHAR(20) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS card_labels (
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (card_id, label_id)
    );
    CREATE TABLE IF NOT EXISTS card_members (
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      PRIMARY KEY (card_id, member_id)
    );
    CREATE TABLE IF NOT EXISTS checklist_items (
      id SERIAL PRIMARY KEY,
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      text VARCHAR(200) NOT NULL,
      is_complete BOOLEAN NOT NULL DEFAULT FALSE,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES members(id),
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      action_type VARCHAR(50) NOT NULL,
      performed_by INTEGER REFERENCES members(id),
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Tables ready');
};

init().catch(console.error);

module.exports = { query: (text, params) => pool.query(text, params) };