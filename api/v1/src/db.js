import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DB_PATH || '/app/database/fairshare.db',
  driver: sqlite3.Database
});

// Initialize database schema
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    incomes TEXT DEFAULT '[]',  -- JSON string
    expenses TEXT DEFAULT '[]'   -- JSON string
  );
`);

export default db;
