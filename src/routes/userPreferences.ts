import express from 'express';
import { db } from '../lib/database';
import { userPreferences } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', optionalAuth, async (req: any, res) => {
  try {
    if (!req.user) {
      return res.json({ preferences: [] });
    }

    const [userPrefs] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, req.user.id))
      .limit(1);

    if (!userPrefs || !userPrefs.preferences) {
      return res.json({ preferences: [] });
    }

    const preferences = userPrefs.preferences ? 
      userPrefs.preferences.split('\n').filter((p: string) => p.trim() !== '') : [];

    res.json({ preferences });

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

    const preferencesString = preferences.join('\n');

    // Check if preferences exist
    const [existingPrefs] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, req.user.id))
      .limit(1);

    if (existingPrefs) {
      // Update existing
      await db.update(userPreferences)
        .set({
          preferences: preferencesString,
          updatedAt: new Date().toISOString()
        })
        .where(eq(userPreferences.userId, req.user.id));
    } else {
      // Create new
      await db.insert(userPreferences).values({
        userId: req.user.id,
        preferences: preferencesString
      });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences: preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userPreferencesRoutes };