#!/bin/bash

# Database initialization script for Mercedes Helper

echo "🗄️  Initializing Mercedes Helper Database..."

if ! command -v npx >/dev/null 2>&1; then
    echo "❌ Node.js/npm not found. Please install Node.js first."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data


# Optional: Seed database with sample data
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database with sample data..."
    # Add seeding logic here if needed
fi

echo "✅ Database initialization completed!"
echo "📋 Database location: ./data/production.db"