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
    
    # Generate and apply migrations with Drizzle
    echo "🔄 Generating database migrations..."
    npm run db:generate
    
    echo "🔄 Applying database migrations..."
    npm run db:migrate
    
    echo "✅ Database initialized successfully!"
else
    echo "✅ Database already exists"
fi

# Start the application
echo "🚀 Starting Mercedes Helper application..."
exec npm start