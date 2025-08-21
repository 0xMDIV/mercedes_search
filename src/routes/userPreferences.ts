import express from 'express';
import { prisma } from '../lib/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', optionalAuth, async (req: any, res) => {
  try {
    if (!req.user) {
      return res.json({ preferences: [] });
    }

    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id }
    });

    if (!userPreferences) {
      return res.json({ preferences: [] });
    }

    res.json({ 
      preferences: userPreferences.preferences || [] 
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', authenticateToken, async (req: any, res) => {
  try {
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences must be an array' });
    }

    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId: req.user.id },
      update: {
        preferences: preferences,
        updatedAt: new Date()
      },
      create: {
        userId: req.user.id,
        preferences: preferences
      }
    });

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userPreferencesRoutes };