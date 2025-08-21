export interface Vehicle {
  id: string;
  mercedesUrl: string;
  mainImage?: string;
  imageGallery: string;
  price: number;
  manufacturer: string;
  model: string;
  vehicleNumber: string;
  vehicleType: string;
  firstRegistration: string;
  modelYear: number;
  mileage: number;
  power: string;
  fuelType: string;
  transmission: string;
  exteriorColor: string;
  interiorColor: string;
  upholstery: string;
  acceleration?: string;
  warranty?: string;
  chargingDuration?: string;
  electricRange?: string;
  energy?: string;
  dealerLocation: string;
  distanceFromHildesheim?: number;
  travelTimeFromHildesheim?: string;
  interior?: string;
  exterior?: string;
  infotainment?: string;
  safetyTech?: string;
  packages?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  preferences: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CrawlResult {
  success: boolean;
  vehicle?: Partial<Vehicle>;
  error?: string;
}

export interface DistanceResult {
  distance: number;
  duration: string;
  route?: any;
}