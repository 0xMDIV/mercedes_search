import express from 'express';
import { prisma } from '../lib/database';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', optionalAuth, async (req: any, res) => {
  try {
    const favorites = await prisma.vehicle.findMany({
      where: { isFavorite: true },
      orderBy: [
        { favoriteOrder: 'asc' },
        { price: 'asc' }
      ],
      take: 3,
      include: {
        addedBy: {
          select: {
            username: true
          }
        }
      }
    });

    res.json(favorites);

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/toggle', optionalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.isFavorite) {
      // Remove from favorites
      const updatedVehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          isFavorite: false,
          favoriteOrder: null
        }
      });

      // Reorder remaining favorites
      const remainingFavorites = await prisma.vehicle.findMany({
        where: { isFavorite: true },
        orderBy: { favoriteOrder: 'asc' }
      });

      for (let i = 0; i < remainingFavorites.length; i++) {
        await prisma.vehicle.update({
          where: { id: remainingFavorites[i].id },
          data: { favoriteOrder: i + 1 }
        });
      }

      res.json({
        message: 'Vehicle removed from favorites',
        vehicle: updatedVehicle,
        isFavorite: false
      });

    } else {
      // Check if we already have 3 favorites
      const currentFavorites = await prisma.vehicle.findMany({
        where: { isFavorite: true },
        orderBy: { favoriteOrder: 'asc' }
      });

      if (currentFavorites.length >= 3) {
        return res.status(400).json({ 
          error: 'Maximum 3 favorites allowed. Remove one first.' 
        });
      }

      // Add to favorites
      const updatedVehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          isFavorite: true,
          favoriteOrder: currentFavorites.length + 1
        }
      });

      res.json({
        message: 'Vehicle added to favorites',
        vehicle: updatedVehicle,
        isFavorite: true
      });
    }

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/reorder', optionalAuth, async (req: any, res) => {
  try {
    const { vehicleIds } = req.body;

    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length > 3) {
      return res.status(400).json({ error: 'Invalid vehicle IDs array' });
    }

    // Update the order of favorites
    for (let i = 0; i < vehicleIds.length; i++) {
      await prisma.vehicle.update({
        where: { id: vehicleIds[i] },
        data: { favoriteOrder: i + 1 }
      });
    }

    res.json({ message: 'Favorites reordered successfully' });

  } catch (error) {
    console.error('Reorder favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as favoritesRoutes };