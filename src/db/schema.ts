import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('User', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: text('createdAt').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updatedAt').default(sql`(datetime('now'))`).notNull(),
});

export const userPreferences = sqliteTable('UserPreferences', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  preferences: text('preferences').default('').notNull(),
  createdAt: text('createdAt').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updatedAt').default(sql`(datetime('now'))`).notNull(),
});

export const vehicles = sqliteTable('Vehicle', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mercedesUrl: text('mercedesUrl').notNull().unique(),
  mainImage: text('mainImage'),
  imageGallery: text('imageGallery').default('').notNull(),
  price: real('price').notNull(),
  manufacturer: text('manufacturer').default('Mercedes-Benz').notNull(),
  model: text('model').notNull(),
  vehicleNumber: text('vehicleNumber').notNull(),
  vehicleType: text('vehicleType').notNull(),
  firstRegistration: text('firstRegistration').notNull(),
  modelYear: integer('modelYear').notNull(),
  mileage: integer('mileage').notNull(),
  power: text('power').notNull(),
  fuelType: text('fuelType').notNull(),
  transmission: text('transmission').notNull(),
  exteriorColor: text('exteriorColor').notNull(),
  interiorColor: text('interiorColor').notNull(),
  upholstery: text('upholstery').notNull(),
  acceleration: text('acceleration'),
  warranty: text('warranty'),
  chargingDuration: text('chargingDuration'),
  electricRange: text('electricRange'),
  energy: text('energy'),
  dealerLocation: text('dealerLocation').notNull(),
  distanceFromHildesheim: real('distanceFromHildesheim'),
  travelTimeFromHildesheim: text('travelTimeFromHildesheim'),
  interior: text('interior').default('').notNull(),
  exterior: text('exterior').default('').notNull(),
  infotainment: text('infotainment').default('').notNull(),
  safetyTech: text('safetyTech').default('').notNull(),
  packages: text('packages').default('').notNull(),
  isFavorite: integer('isFavorite', { mode: 'boolean' }).default(false).notNull(),
  favoriteOrder: integer('favoriteOrder'),
  createdAt: text('createdAt').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updatedAt').default(sql`(datetime('now'))`).notNull(),
  addedById: text('addedById').references(() => users.id),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;