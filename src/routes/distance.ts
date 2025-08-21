import express from 'express';
import axios from 'axios';
import { prisma } from '../lib/database';

const router = express.Router();

const HILDESHEIM_COORDS = [52.1505, 9.9595]; // Latitude, Longitude

// Simple distance calculation using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Geocoding function using Nominatim (OpenStreetMap)
async function geocodeLocation(location: string): Promise<{lat: number, lon: number} | null> {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: location + ', Germany',
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'MercedesHelper/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Calculate route using OSRM (Open Source Routing Machine)
async function calculateRoute(startCoords: number[], endCoords: number[]): Promise<{distance: number, duration: string} | null> {
  try {
    const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}`, {
      params: {
        overview: 'false',
        steps: 'false'
      }
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceKm = Math.round(route.distance / 1000);
      const durationMinutes = Math.round(route.duration / 60);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      const durationString = hours > 0 
        ? `${hours}h ${minutes}min`
        : `${minutes}min`;

      return {
        distance: distanceKm,
        duration: durationString
      };
    }
    return null;
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
}

router.post('/calculate/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (!vehicle.dealerLocation) {
      return res.status(400).json({ error: 'Vehicle has no dealer location' });
    }

    // Geocode the dealer location
    const dealerCoords = await geocodeLocation(vehicle.dealerLocation);
    
    if (!dealerCoords) {
      return res.status(400).json({ error: 'Could not geocode dealer location' });
    }

    // Calculate route from Hildesheim to dealer
    let routeInfo = await calculateRoute(HILDESHEIM_COORDS, [dealerCoords.lat, dealerCoords.lon]);
    
    if (!routeInfo) {
      // Fallback to simple distance calculation
      const distance = Math.round(calculateDistance(
        HILDESHEIM_COORDS[0], HILDESHEIM_COORDS[1],
        dealerCoords.lat, dealerCoords.lon
      ));
      
      // Rough time estimation: 1 km = ~1 minute in city, 1 km = ~45 seconds on highway
      const estimatedMinutes = Math.round(distance * 0.8);
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      const durationString = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

      routeInfo = {
        distance,
        duration: durationString
      };
    }

    // Update vehicle with distance and travel time
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        distanceFromHildesheim: routeInfo.distance,
        travelTimeFromHildesheim: routeInfo.duration
      }
    });

    res.json({
      vehicleId,
      dealerLocation: vehicle.dealerLocation,
      distance: routeInfo.distance,
      travelTime: routeInfo.duration,
      coordinates: {
        dealer: dealerCoords,
        hildesheim: { lat: HILDESHEIM_COORDS[0], lon: HILDESHEIM_COORDS[1] }
      }
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/calculate-all', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        AND: [
          { dealerLocation: { not: '' } },
          { distanceFromHildesheim: null }
        ]
      },
      select: {
        id: true,
        dealerLocation: true
      }
    });

    let processed = 0;
    let errors = 0;

    for (const vehicle of vehicles) {
      try {
        const dealerCoords = await geocodeLocation(vehicle.dealerLocation);
        
        if (dealerCoords) {
          const routeInfo = await calculateRoute(HILDESHEIM_COORDS, [dealerCoords.lat, dealerCoords.lon]);
          
          if (routeInfo) {
            await prisma.vehicle.update({
              where: { id: vehicle.id },
              data: {
                distanceFromHildesheim: routeInfo.distance,
                travelTimeFromHildesheim: routeInfo.duration
              }
            });
            processed++;
          } else {
            errors++;
          }
        } else {
          errors++;
        }

        // Small delay to avoid overwhelming the APIs
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing vehicle ${vehicle.id}:`, error);
        errors++;
      }
    }

    res.json({
      message: 'Batch distance calculation completed',
      totalVehicles: vehicles.length,
      processed,
      errors
    });

  } catch (error) {
    console.error('Batch distance calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as distanceRoutes };