import express from 'express';
import { mercedesCrawler } from '../services/crawler';
import { prisma } from '../lib/database';

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
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { mercedesUrl: url }
    });

    if (existingVehicle) {
      // Update existing vehicle
      const updatedVehicle = await prisma.vehicle.update({
        where: { mercedesUrl: url },
        data: {
          ...result.vehicle,
          updatedAt: new Date(),
          addedById: req.user.id
        }
      });

      return res.json({
        message: 'Vehicle updated successfully',
        vehicle: updatedVehicle,
        isNew: false
      });
    } else {
      // Create new vehicle
      const newVehicle = await prisma.vehicle.create({
        data: {
          ...result.vehicle,
          mercedesUrl: url,
          addedById: req.user.id
        } as any
      });

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
    const vehicleCount = await prisma.vehicle.count();
    const recentCrawls = await prisma.vehicle.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        model: true,
        mercedesUrl: true,
        updatedAt: true
      }
    });

    res.json({
      totalVehicles: vehicleCount,
      recentCrawls
    });
  } catch (error) {
    console.error('Crawler status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as crawlerRoutes };