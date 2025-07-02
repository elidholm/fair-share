import db from '../db.js';

export const createUser = async ({ username, email, passwordHash }) => {
  return await db.run(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );
};

export const findUserByEmail = async (email) => {
  return await db.get('SELECT * FROM users WHERE email = ?', [email]);
};

export const findUserByUsername = async (username) => {
  return await db.get('SELECT * FROM users WHERE username = ?', [username]);
};

export const findUserById = async (id) => {
  return await db.get('SELECT * FROM users WHERE id = ?', [id]);
};
