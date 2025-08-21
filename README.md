# Mercedes Helper

Eine moderne Webanwendung zur Verwaltung und Suche von Mercedes-Benz Fahrzeugen mit automatischem Crawling und Entfernungsberechnung.

## Features

- 🚗 **Automatisches Crawling** von Mercedes-Benz Fahrzeugdaten
- 🌍 **Entfernungsberechnung** zu Hildesheim mit Fahrtzeit
- ⭐ **Favoriten-System** (max. 3 Fahrzeuge)
- 🔍 **Erweiterte Such- und Filteroptionen**
- 📱 **Responsive Design** für Mobile und Desktop
- 🔐 **Benutzerauthentifizierung** für erweiterte Funktionen
- 📋 **Persönliche Präferenzen** verwalten

## Technologie-Stack

### Backend
- **Node.js** mit TypeScript
- **Express.js** Web Framework
- **Prisma** ORM mit SQLite
- **Puppeteer** für Web Scraping
- **JWT** für Authentifizierung

### Frontend
- **Bootstrap 5** für responsives Design
- **Leaflet** für Kartenfunktionen
- **Vanilla JavaScript** (ES6+)

### Deployment
- **Docker** mit Docker Compose
- **Nginx** als Reverse Proxy
- **Portainer** kompatibel

## Schnellstart

### Voraussetzungen
- Node.js 18+
- Docker & Docker Compose
- Git

### Lokale Entwicklung

1. **Repository klonen**
```bash
git clone <repository-url>
cd mercedes-helper
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren**
```bash
cp .env.example .env
# .env bearbeiten und JWT_SECRET ändern
```

4. **Datenbank initialisieren**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Entwicklungsserver starten**
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

### Docker Deployment

1. **Docker Compose starten**
```bash
docker-compose up -d
```

Die Anwendung ist dann unter `http://localhost` erreichbar.

### Portainer Deployment

1. **Stack in Portainer erstellen**
2. **docker-compose.yml** Inhalt kopieren
3. **Umgebungsvariablen** konfigurieren:
   - `JWT_SECRET`: Sicheres Secret für JWT
   - `DATABASE_URL`: SQLite Pfad
4. **Stack deployen**

## Verwendung

### Fahrzeuge hinzufügen

1. **Anmelden** oder Registrieren
2. **"Fahrzeug hinzufügen"** klicken
3. **Mercedes-Benz URL** eingeben (z.B. von gebrauchtwagen.mercedes-benz.de)
4. **Crawling** starten - die Daten werden automatisch extrahiert

### Favoriten verwalten

- **Stern-Symbol** neben Fahrzeugen klicken
- **Maximal 3 Favoriten** möglich
- **Favoriten-Tab** für Übersicht

### Entfernungen berechnen

- **"Entfernung berechnen"** Button bei Fahrzeugen
- Automatische Berechnung zu **Hildesheim**
- **Fahrtzeit** und **Route** werden angezeigt

### Suchen und Filtern

- **Suchleiste**: Nach Modell, Händler etc.
- **Sortierung**: Preis, Entfernung, Baujahr etc.
- **Filter**: Kraftstoff, Getriebe, Preis

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Anmeldung
- `GET /api/auth/me` - Aktueller Benutzer

### Vehicles
- `GET /api/vehicles` - Alle Fahrzeuge (mit Filtern)
- `GET /api/vehicles/:id` - Einzelnes Fahrzeug
- `PUT /api/vehicles/:id` - Fahrzeug bearbeiten

### Crawler
- `POST /api/crawler/crawl` - Fahrzeug crawlen
- `GET /api/crawler/status` - Crawler Status

### Favorites
- `GET /api/favorites` - Favoriten abrufen
- `POST /api/favorites/:id/toggle` - Favorit hinzufügen/entfernen

### Distance
- `POST /api/distance/calculate/:id` - Entfernung berechnen
- `POST /api/distance/calculate-all` - Alle Entfernungen berechnen

### Preferences
- `GET /api/preferences` - Benutzer-Präferenzen
- `PUT /api/preferences` - Präferenzen speichern

## Konfiguration

### Umgebungsvariablen

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
NODE_ENV=production
```

### Docker Volumes

- `./data` - SQLite Datenbank
- `./uploads` - Fahrzeugbilder

## Entwicklung

### Scripts

```bash
npm run dev          # Entwicklungsserver
npm run build        # Production Build
npm run start        # Production Server
npm run typecheck    # TypeScript prüfen
npm run lint         # Code Linting
npm run migrate      # Datenbank Migration
npm run generate     # Prisma Client generieren
```

### Projekt-Struktur

```
mercedes-helper/
├── src/
│   ├── routes/         # API Routes
│   ├── services/       # Business Logic
│   ├── middleware/     # Express Middleware
│   ├── lib/           # Utilities
│   └── types/         # TypeScript Types
├── public/            # Frontend Dateien
├── prisma/            # Datenbank Schema
├── uploads/           # Hochgeladene Bilder
└── data/             # SQLite Datenbank
```

## Features im Detail

### Web Crawling
- Automatische Extraktion von Fahrzeugdaten
- Bild-Download und lokale Speicherung
- Unterstützung für alle Mercedes-Benz Fahrzeugseiten
- Fehlerbehandlung und Retry-Logik

### Entfernungsberechnung
- Integration mit OpenStreetMap Nominatim (Geocoding)
- OSRM für Routenberechnung
- Fallback auf Luftlinie bei API-Fehlern
- Batch-Verarbeitung für mehrere Fahrzeuge

### Responsive Design
- Mobile-First Ansatz
- Bootstrap 5 Grid System
- Touch-optimierte Bedienung
- Optimierte Bildergalerien

## Sicherheit

- **JWT** Token-basierte Authentifizierung
- **Helmet.js** für HTTP Security Headers
- **Input Validation** und Sanitization
- **Rate Limiting** für API Endpoints
- **Secure Headers** für Production

## Performance

- **Lazy Loading** für Fahrzeugbilder
- **Debounced Search** für bessere UX
- **Database Indexing** für schnelle Queries
- **Gzip Compression** über Nginx
- **Browser Caching** für statische Assets

## Lizenz

MIT License - siehe LICENSE Datei für Details.

## Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository.