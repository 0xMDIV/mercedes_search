#!/bin/bash

# Mercedes Helper Deployment Script

echo "🚗 Mercedes Helper Deployment Script"
echo "====================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data uploads ssl

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and set your JWT_SECRET!"
fi

# Build and start the application
echo "🏗️  Building and starting services..."
docker-compose down
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if application is running
if curl -f http://localhost:3000/api/vehicles >/dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access your application at: http://localhost"
    echo ""
    echo "📚 Quick Start:"
    echo "1. Open http://localhost in your browser"
    echo "2. Register a new account"
    echo "3. Add Mercedes-Benz vehicle URLs to start crawling"
    echo ""
    echo "🐳 Docker services:"
    docker-compose ps
else
    echo "❌ Application failed to start. Check logs:"
    echo "docker-compose logs app"
fi

echo ""
echo "🛠️  Useful commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    docker-compose down"
echo "  Restart:          docker-compose restart"
echo "  Update:           git pull && docker-compose up --build -d"