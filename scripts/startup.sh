#!/bin/sh

# Mercedes Helper Startup Script
# This script initializes the database and starts the application

set -e

echo "🚀 Mercedes Helper - Starting up..."

# Ensure data directory exists and has correct permissions
echo "📁 Setting up data directory..."
mkdir -p /app/data

# Check if database exists, if not initialize it
if [ ! -f "/app/data/production.db" ]; then
    echo "🗄️  Database not found, initializing..."
    
    # Run Prisma db push to create the database
    echo "🔄 Pushing database schema..."
    npx prisma db push --accept-data-loss
    
    echo "✅ Database initialized successfully!"
else
    echo "✅ Database already exists"
fi

# Ensure Prisma client is generated
echo "🔧 Ensuring Prisma client is ready..."
npx prisma generate

# Start the application
echo "🚀 Starting Mercedes Helper application..."
exec npm start