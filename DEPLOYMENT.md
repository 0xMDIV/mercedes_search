# Server Deployment Guide

## 🚀 Deployment auf Linux Server

### Voraussetzungen
- Docker & Docker Compose installiert
- Root/Sudo Zugriff
- Mindestens 2GB RAM und 10GB Speicher

### 📁 Server-Verzeichnisstruktur
```
/opt/mercedes_search/
├── data/              # SQLite Datenbank
├── uploads/           # Fahrzeugbilder
├── ssl/              # SSL Zertifikate (optional)
├── nginx.conf        # Nginx Konfiguration
├── docker-compose.yml
└── .env              # Umgebungsvariablen
```

### 🔧 Manuelle Installation

1. **Verzeichnisse erstellen**
```bash
sudo mkdir -p /opt/mercedes_search/{data,uploads,ssl}
sudo chown -R 1000:1000 /opt/mercedes_search/{data,uploads}
```

2. **Dateien kopieren**
```bash
# Konfigurationsdateien
sudo cp nginx.conf /opt/mercedes_search/
sudo cp docker-compose.yml /opt/mercedes_search/

# Umgebungsvariablen
sudo cp .env.example /opt/mercedes_search/.env
```

3. **Umgebungsvariablen konfigurieren**
```bash
sudo nano /opt/mercedes_search/.env
```
**Wichtige Konfigurationen:**
- `JWT_SECRET` auf einen sicheren Wert setzen
- `HTTP_PORT` und `HTTPS_PORT` anpassen falls 80/443 bereits belegt sind

4. **Anwendung starten**
```bash
cd /opt/mercedes_search
sudo docker-compose up -d
```

### 🚀 Automatische Installation

1. **Deployment-Script ausführen**
```bash
chmod +x deploy-server.sh
sudo ./deploy-server.sh
```

2. **JWT Secret konfigurieren**
```bash
sudo nano /opt/mercedes_search/.env
# JWT_SECRET=your-super-secure-secret-here
```

3. **Anwendung starten**
```bash
cd /opt/mercedes_search
sudo docker-compose up -d
```

### 🐳 Portainer Deployment

#### Option 1: Stack aus Git Repository
1. In Portainer: **Stacks** → **Add Stack**
2. Name: `mercedes-helper`
3. **Repository**: Diese Git-URL eingeben
4. **Compose path**: `portainer-stack.yml`
5. **Environment variables**:
   ```
   JWT_SECRET=your-super-secure-secret-here
   HTTP_PORT=8080
   HTTPS_PORT=8443
   ```
   *Ports anpassen falls 80/443 bereits belegt sind*

#### Option 2: Stack manuell erstellen
1. In Portainer: **Stacks** → **Add Stack**
2. Name: `mercedes-helper`
3. **Web editor**: Inhalt von `portainer-stack.yml` kopieren
4. **Environment variables**:
   ```
   JWT_SECRET=your-super-secure-secret-here
   HTTP_PORT=8080
   HTTPS_PORT=8443
   ```

### 🔒 SSL/HTTPS Konfiguration (Optional)

1. **SSL Zertifikate platzieren**
```bash
sudo cp your-cert.pem /opt/mercedes_search/ssl/cert.pem
sudo cp your-key.pem /opt/mercedes_search/ssl/key.pem
```

2. **Nginx Konfiguration erweitern**
```bash
sudo nano /opt/mercedes_search/nginx.conf
```

Beispiel HTTPS Block hinzufügen:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 🛠️ Wartung & Administration

#### Container-Management
```bash
# Status prüfen
cd /opt/mercedes_search && docker-compose ps

# Logs anzeigen
cd /opt/mercedes_search && docker-compose logs -f

# Neustart
cd /opt/mercedes_search && docker-compose restart

# Update (nach Code-Änderungen)
cd /opt/mercedes_search && docker-compose down
cd /opt/mercedes_search && docker-compose up --build -d
```

#### Systemd Service (Auto-Start)
```bash
# Service starten
sudo systemctl start mercedes-helper

# Service stoppen
sudo systemctl stop mercedes-helper

# Status prüfen
sudo systemctl status mercedes-helper

# Auto-Start aktivieren
sudo systemctl enable mercedes-helper
```

#### Backup
```bash
# Datenbank und Uploads sichern
sudo tar -czf mercedes-backup-$(date +%Y%m%d).tar.gz /opt/mercedes_search/data /opt/mercedes_search/uploads
```

### 🔍 Troubleshooting

#### Container startet nicht
```bash
# Logs prüfen
cd /opt/mercedes_search && docker-compose logs app

# Häufige Probleme:
# - JWT_SECRET nicht gesetzt
# - Permissions auf data/uploads Verzeichnis
# - Port 80/443 bereits belegt
```

#### Datenbank-Probleme
```bash
# Container neu erstellen
cd /opt/mercedes_search && docker-compose down
cd /opt/mercedes_search && docker-compose up --build -d

# Datenbank zurücksetzen (ACHTUNG: Alle Daten gehen verloren!)
sudo rm -rf /opt/mercedes_search/data/*
cd /opt/mercedes_search && docker-compose restart app
```

#### Performance-Optimierung
```bash
# Docker Logs begrenzen
echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

### 📊 Monitoring

#### Health Checks
```bash
# API Status
curl http://localhost/api/vehicles

# Container Health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

#### Resource Usage
```bash
# Container Resources
docker stats mercedes-helper-app mercedes-helper-nginx

# Disk Usage
du -sh /opt/mercedes_search/
```

### 🌐 Zugriff

Nach erfolgreichem Deployment ist die Anwendung erreichbar unter:
- **HTTP**: `http://your-server-ip:8080` (oder der in HTTP_PORT konfigurierten Port)
- **HTTPS**: `https://your-server-ip:8443` (oder der in HTTPS_PORT konfigurierten Port, wenn SSL konfiguriert)

### ⚡ Quick Start Checklist

- [ ] Server-Verzeichnisse erstellt
- [ ] Konfigurationsdateien kopiert
- [ ] JWT_SECRET in .env gesetzt
- [ ] Docker Container gestartet
- [ ] Anwendung unter http://server-ip:8080 erreichbar
- [ ] Ersten Benutzer registriert
- [ ] Erstes Fahrzeug hinzugefügt