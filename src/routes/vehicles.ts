import express from 'express';
import { db } from '../lib/database';
import { vehicles, users } from '../db/schema';
import { eq, and, or, like, lte, desc, asc, sql, count } from 'drizzle-orm';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', optionalAuth, async (req: any, res) => {
  try {
    const { 
      search, 
      sortBy = 'price_asc', 
      fuelType, 
      transmission, 
      maxPrice,
      limit = 50,
      offset = 0 
    } = req.query;

    let whereConditions: any[] = [];

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          like(vehicles.model, `%${search}%`),
          like(vehicles.dealerLocation, `%${search}%`),
          like(vehicles.exteriorColor, `%${search}%`),
          like(vehicles.fuelType, `%${search}%`)
        )
      );
    }

    // Fuel type filter
    if (fuelType && fuelType !== '') {
      whereConditions.push(like(vehicles.fuelType, `%${fuelType}%`));
    }

    // Transmission filter
    if (transmission && transmission !== '') {
      whereConditions.push(like(vehicles.transmission, `%${transmission}%`));
    }

    // Price filter
    if (maxPrice && parseInt(maxPrice) > 0) {
      whereConditions.push(lte(vehicles.price, parseInt(maxPrice)));
    }

    const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Sorting
    let orderByCondition;
    switch (sortBy) {
      case 'price_asc':
        orderByCondition = asc(vehicles.price);
        break;
      case 'price_desc':
        orderByCondition = desc(vehicles.price);
        break;
      case 'year_desc':
        orderByCondition = desc(vehicles.modelYear);
        break;
      case 'year_asc':
        orderByCondition = asc(vehicles.modelYear);
        break;
      case 'mileage_asc':
        orderByCondition = asc(vehicles.mileage);
        break;
      case 'mileage_desc':
        orderByCondition = desc(vehicles.mileage);
        break;
      case 'distance_asc':
        orderByCondition = asc(vehicles.distanceFromHildesheim);
        break;
      case 'distance_desc':
        orderByCondition = desc(vehicles.distanceFromHildesheim);
        break;
      default:
        orderByCondition = asc(vehicles.price);
    }

    const vehiclesList = await db.select({
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
    .where(whereCondition)
    .orderBy(orderByCondition)
    .limit(parseInt(limit))
    .offset(parseInt(offset));

    const [totalCount] = await db.select({ count: count() })
      .from(vehicles)
      .where(whereCondition);

    res.json({
      vehicles: vehiclesList,
      total: totalCount.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicle] = await db.select({
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
    .where(eq(vehicles.id, id))
    .limit(1);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as vehicleRoutes };