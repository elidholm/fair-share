import { accessSync, constants } from 'node:fs';
import { dirname } from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const filename = process.env.DB_PATH || '/app/database/fairshare.db';

const db = await open({
  filename,
  driver: sqlite3.Database
});

// SQLite opens a read-only file without complaint and only fails on the first write,
// which surfaces as a 500 on every save. Refuse to start instead, so a misconfigured
// volume fails the deployment rather than silently breaking writes.
if (filename !== ':memory:') {
  for (const path of [dirname(filename), filename]) {
    try {
      accessSync(path, constants.W_OK);
    } catch (error) {
      throw new Error(
        `Database path ${path} is not writable by uid ${process.getuid?.()} (${error.code}). ` +
        'Make the database directory and file writable by the API user.',
        { cause: error }
      );
    }
  }
}

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
