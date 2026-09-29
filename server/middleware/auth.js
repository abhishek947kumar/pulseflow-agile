import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'pulseflow-recruiter-demo-jwt-secret-key-2026';

export function authenticate(req, res, next) {
  // Support Demo Persona header for recruiter convenience
  const demoUserId = req.headers['x-demo-user-id'];
  if (demoUserId) {
    const user = db.getUserById(demoUserId);
    if (user) {
      req.user = user;
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no header, fallback to default demo user Alex Rivera
    const defaultUser = db.getUsers()[0];
    req.user = defaultUser;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User associated with token not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token', details: err.message });
  }
}
