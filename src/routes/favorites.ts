import express from 'express';
import { db } from '../lib/database';
import { vehicles, users } from '../db/schema';
import { eq, and, isNotNull, asc } from 'drizzle-orm';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', optionalAuth, async (req: any, res) => {
  try {
    const favorites = await db.select({
      id: vehicles.id,
      mercedesUrl: vehicles.mercedesUrl,
      mainImage: vehicles.mainImage,
      imageGallery: vehicles.imageGallery,
      price: vehicles.price,
      manufacturer: vehicles.manufacturer,
      model: vehicles.model,
      vehicleNumber: vehicles.vehicleNumber,
      vehicleType: vehicles.vehicleType,
      firstRegistration: vehicles.firstRegistration,
      modelYear: vehicles.modelYear,
      mileage: vehicles.mileage,
      power: vehicles.power,
      fuelType: vehicles.fuelType,
      transmission: vehicles.transmission,
      exteriorColor: vehicles.exteriorColor,
      interiorColor: vehicles.interiorColor,
      upholstery: vehicles.upholstery,
      acceleration: vehicles.acceleration,
      warranty: vehicles.warranty,
      chargingDuration: vehicles.chargingDuration,
      electricRange: vehicles.electricRange,
      energy: vehicles.energy,
      dealerLocation: vehicles.dealerLocation,
      distanceFromHildesheim: vehicles.distanceFromHildesheim,
      travelTimeFromHildesheim: vehicles.travelTimeFromHildesheim,
      interior: vehicles.interior,
      exterior: vehicles.exterior,
      infotainment: vehicles.infotainment,
      safetyTech: vehicles.safetyTech,
      packages: vehicles.packages,
      isFavorite: vehicles.isFavorite,
      favoriteOrder: vehicles.favoriteOrder,
      createdAt: vehicles.createdAt,
      updatedAt: vehicles.updatedAt,
      addedById: vehicles.addedById,
      addedByUsername: users.username
    })
    .from(vehicles)
    .leftJoin(users, eq(vehicles.addedById, users.id))
    .where(eq(vehicles.isFavorite, true))
    .orderBy(asc(vehicles.favoriteOrder), asc(vehicles.price))
    .limit(3);

    res.json(favorites);

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/toggle', optionalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [vehicle] = await db.select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.isFavorite) {
      // Remove from favorites
      const [updatedVehicle] = await db.update(vehicles)
        .set({
          isFavorite: false,
          favoriteOrder: null
        })
        .where(eq(vehicles.id, id))
        .returning();

      // Reorder remaining favorites
      const remainingFavorites = await db.select()
        .from(vehicles)
        .where(eq(vehicles.isFavorite, true))
        .orderBy(asc(vehicles.favoriteOrder));

      for (let i = 0; i < remainingFavorites.length; i++) {
        await db.update(vehicles)
          .set({ favoriteOrder: i + 1 })
          .where(eq(vehicles.id, remainingFavorites[i].id));
      }

      res.json({
        message: 'Vehicle removed from favorites',
        vehicle: updatedVehicle,
        isFavorite: false
      });

    } else {
      // Check if we already have 3 favorites
      const currentFavorites = await db.select()
        .from(vehicles)
        .where(eq(vehicles.isFavorite, true))
        .orderBy(asc(vehicles.favoriteOrder));

      if (currentFavorites.length >= 3) {
        return res.status(400).json({ 
          error: 'Maximum 3 favorites allowed. Remove one first.' 
        });
      }

      // Add to favorites
      const [updatedVehicle] = await db.update(vehicles)
        .set({
          isFavorite: true,
          favoriteOrder: currentFavorites.length + 1
        })
        .where(eq(vehicles.id, id))
        .returning();

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
      await db.update(vehicles)
        .set({ favoriteOrder: i + 1 })
        .where(eq(vehicles.id, vehicleIds[i]));
    }

    res.json({ message: 'Favorites reordered successfully' });

  } catch (error) {
    console.error('Reorder favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as favoritesRoutes };