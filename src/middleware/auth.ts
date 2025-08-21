import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../lib/database';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email
    }).from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (!user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email
    }).from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Invalid token, but continue without user
  }

  next();
};