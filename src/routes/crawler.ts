import express from 'express';
import { mercedesCrawler } from '../services/crawler';
import { db } from '../lib/database';
import { vehicles } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';

const router = express.Router();

router.post('/crawl', async (req: any, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('gebrauchtwagen.mercedes-benz.de')) {
      return res.status(400).json({ error: 'Invalid Mercedes URL' });
    }

    const result = await mercedesCrawler.crawlVehicle(url);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Check if vehicle already exists
    const [existingVehicle] = await db.select()
      .from(vehicles)
      .where(eq(vehicles.mercedesUrl, url))
      .limit(1);

    if (existingVehicle) {
      // Update existing vehicle
      const [updatedVehicle] = await db.update(vehicles)
        .set({
          ...result.vehicle,
          updatedAt: new Date().toISOString(),
          addedById: req.user?.id
        })
        .where(eq(vehicles.mercedesUrl, url))
        .returning();

      return res.json({
        message: 'Vehicle updated successfully',
        vehicle: updatedVehicle,
        isNew: false
      });
    } else {
      // Create new vehicle
      const [newVehicle] = await db.insert(vehicles)
        .values({
          ...result.vehicle,
          mercedesUrl: url,
          addedById: req.user?.id
        })
        .returning();

      return res.json({
        message: 'Vehicle crawled and saved successfully',
        vehicle: newVehicle,
        isNew: true
      });
    }

  } catch (error) {
    console.error('Crawler route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const [vehicleCount] = await db.select({ count: count() }).from(vehicles);
    const recentCrawls = await db.select({
      id: vehicles.id,
      model: vehicles.model,
      mercedesUrl: vehicles.mercedesUrl,
      updatedAt: vehicles.updatedAt
    })
    .from(vehicles)
    .orderBy(desc(vehicles.updatedAt))
    .limit(5);

    res.json({
      totalVehicles: vehicleCount.count,
      recentCrawls
    });
  } catch (error) {
    console.error('Crawler status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as crawlerRoutes };