import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET_KEY = process.env.JWT_SECRET || 'deez';
const EXPIRES_IN = '7d';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: EXPIRES_IN });
};

export const verifyToken = (token) => {
  return jwt.verify(token, SECRET_KEY);
};

export const comparePasswords = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
