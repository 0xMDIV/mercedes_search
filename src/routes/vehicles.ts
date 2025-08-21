import express from 'express';
import { prisma } from '../lib/database';
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

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { model: { contains: search, mode: 'insensitive' } },
        { dealerLocation: { contains: search, mode: 'insensitive' } },
        { exteriorColor: { contains: search, mode: 'insensitive' } },
        { fuelType: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fuel type filter
    if (fuelType && fuelType !== '') {
      where.fuelType = { contains: fuelType, mode: 'insensitive' };
    }

    // Transmission filter
    if (transmission && transmission !== '') {
      where.transmission = { contains: transmission, mode: 'insensitive' };
    }

    // Price filter
    if (maxPrice && parseInt(maxPrice) > 0) {
      where.price = { lte: parseInt(maxPrice) };
    }

    // Sorting
    let orderBy: any = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'distance_asc':
        orderBy = { distanceFromHildesheim: 'asc' };
        break;
      case 'mileage_asc':
        orderBy = { mileage: 'asc' };
        break;
      case 'year_desc':
        orderBy = { modelYear: 'desc' };
        break;
      case 'created_desc':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { price: 'asc' };
    }

    // Get favorites first if user is logged in
    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: [
        { isFavorite: 'desc' },
        { favoriteOrder: 'asc' },
        orderBy
      ],
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        addedBy: {
          select: {
            username: true
          }
        }
      }
    });

    const total = await prisma.vehicle.count({ where });

    res.json({
      vehicles,
      total,
      hasMore: total > parseInt(offset) + parseInt(limit)
    });

  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        addedBy: {
          select: {
            username: true
          }
        }
      }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', optionalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Update vehicle
    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json(updatedVehicle);

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', optionalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Delete vehicle
    await prisma.vehicle.delete({
      where: { id }
    });

    res.json({ message: 'Vehicle deleted successfully' });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as vehicleRoutes };