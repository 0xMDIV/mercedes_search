import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/database';
import { users, userPreferences } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await db.select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt
    });

    // Create user preferences
    await db.insert(userPreferences).values({
      userId: user.id,
      preferences: ""
    });

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [user] = await db.select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, username)))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticateToken, async (req: any, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

export { router as authRoutes };