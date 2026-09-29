import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Get all team members / personas
router.get('/users', (req, res) => {
  res.json({ users: db.getUsers() });
});

// Current user
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Register
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const user = db.createUser({ name, email, password, role });
    const token = createToken(user);
    res.status(201).json({ user, token, message: 'Registration successful' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const rawUser = db.getUserByEmail(email);
  if (!rawUser) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPassword = bcrypt.compareSync(password, rawUser.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { passwordHash: _, ...safeUser } = rawUser;
  const token = createToken(safeUser);
  res.json({ user: safeUser, token, message: 'Login successful' });
});

// Demo persona 1-click switch (Convenience for recruiters & pairing)
router.post('/demo-switch', (req, res) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = createToken(user);
  res.json({ user, token, message: `Switched active persona to ${user.name}` });
});

export default router;
