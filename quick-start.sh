#!/bin/bash

echo "🏛️  Legal Strategy Platform - Local Setup"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if .env exists, create if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys if you have them."
fi

echo "🚀 Starting all services..."
echo "This might take a few minutes on first run..."

# Start services
docker-compose up --build -d

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Access your application at:"
echo "🌐 Main App: http://localhost"
echo "🔌 API: http://localhost:3001"
echo "🗄️  Database: localhost:5432"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""
echo "First time? Register an account at http://localhost"