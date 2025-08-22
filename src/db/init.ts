import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function initDatabase() {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/production.db';
  
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const sqlite = new Database(dbPath);

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS UserPreferences (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE REFERENCES User(id) ON DELETE CASCADE,
      preferences TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Vehicle (
      id TEXT PRIMARY KEY,
      mercedesUrl TEXT NOT NULL UNIQUE,
      mainImage TEXT,
      imageGallery TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      manufacturer TEXT NOT NULL DEFAULT 'Mercedes-Benz',
      model TEXT NOT NULL,
      vehicleNumber TEXT NOT NULL,
      vehicleType TEXT NOT NULL,
      firstRegistration TEXT NOT NULL,
      modelYear INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      power TEXT NOT NULL,
      fuelType TEXT NOT NULL,
      transmission TEXT NOT NULL,
      exteriorColor TEXT NOT NULL,
      interiorColor TEXT NOT NULL,
      upholstery TEXT NOT NULL,
      acceleration TEXT,
      warranty TEXT,
      chargingDuration TEXT,
      electricRange TEXT,
      energy TEXT,
      dealerLocation TEXT NOT NULL,
      distanceFromHildesheim REAL,
      travelTimeFromHildesheim TEXT,
      interior TEXT NOT NULL DEFAULT '',
      exterior TEXT NOT NULL DEFAULT '',
      infotainment TEXT NOT NULL DEFAULT '',
      safetyTech TEXT NOT NULL DEFAULT '',
      packages TEXT NOT NULL DEFAULT '',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      favoriteOrder INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      addedById TEXT REFERENCES User(id)
    );

    CREATE INDEX IF NOT EXISTS idx_vehicle_favorite ON Vehicle(isFavorite, favoriteOrder);
    CREATE INDEX IF NOT EXISTS idx_vehicle_price ON Vehicle(price);
    CREATE INDEX IF NOT EXISTS idx_vehicle_distance ON Vehicle(distanceFromHildesheim);
    CREATE INDEX IF NOT EXISTS idx_vehicle_year ON Vehicle(modelYear);
  `);

  sqlite.close();
  console.log('✅ Database schema created successfully!');
}