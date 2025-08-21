import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { authRoutes } from './routes/auth';
import { vehicleRoutes } from './routes/vehicles';
import { crawlerRoutes } from './routes/crawler';
import { favoritesRoutes } from './routes/favorites';
import { userPreferencesRoutes } from './routes/userPreferences';
import { distanceRoutes } from './routes/distance';
import { authenticateToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/crawler', authenticateToken, crawlerRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/preferences', userPreferencesRoutes);
app.use('/api/distance', distanceRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});