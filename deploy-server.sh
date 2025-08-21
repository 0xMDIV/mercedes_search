#!/bin/bash

# Mercedes Helper Server Deployment Script

echo "🚗 Mercedes Helper Server Deployment"
echo "====================================="

# Configuration
SERVER_PATH="/opt/mercedes_search"
BACKUP_PATH="/opt/mercedes_search_backup"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script should be run as root or with sudo"
    echo "   sudo ./deploy-server.sh"
    exit 1
fi

# Create server directory structure
echo "📁 Creating server directory structure..."
mkdir -p $SERVER_PATH/{data,uploads,ssl}

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R 1000:1000 $SERVER_PATH/data
chown -R 1000:1000 $SERVER_PATH/uploads
chmod 755 $SERVER_PATH/data
chmod 755 $SERVER_PATH/uploads

# Copy configuration files
echo "📋 Copying configuration files..."
cp nginx.conf $SERVER_PATH/
cp docker-compose.yml $SERVER_PATH/

# Check if .env exists and copy it
if [ -f .env ]; then
    cp .env $SERVER_PATH/
    echo "✅ Environment file copied"
else
    echo "⚠️  Creating .env file from template..."
    cp .env.example $SERVER_PATH/.env
    echo "🔧 Please edit $SERVER_PATH/.env and configure:"
    echo "   - JWT_SECRET (security)"
    echo "   - HTTP_PORT and HTTPS_PORT (if 80/443 are in use)"
fi

# Create systemd service for auto-start (optional)
cat > /etc/systemd/system/mercedes-helper.service << EOF
[Unit]
Description=Mercedes Helper Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$SERVER_PATH
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
systemctl enable mercedes-helper.service

echo "✅ Server deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit $SERVER_PATH/.env and set a secure JWT_SECRET"
echo "2. Place SSL certificates in $SERVER_PATH/ssl/ (optional)"
echo "3. Start the application:"
echo "   cd $SERVER_PATH"
echo "   docker-compose up -d"
echo ""
echo "🌐 The application will be available at:"
echo "   HTTP:  http://your-server-ip:8080 (default port)"
echo "   HTTPS: https://your-server-ip:8443 (default port, if SSL configured)"
echo "   Note: Ports can be customized in .env file"
echo ""
echo "🛠️  Useful commands:"
echo "   sudo systemctl start mercedes-helper    # Start service"
echo "   sudo systemctl stop mercedes-helper     # Stop service"
echo "   sudo systemctl status mercedes-helper   # Check status"
echo "   cd $SERVER_PATH && docker-compose logs  # View logs"